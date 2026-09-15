// orderController — Task 3.15c, extended by Tasks 3.17, 3.18a, 5.12a,
// 5.13, and 5.14a
//
// Route handler for POST /api/orders. Deliberately thin, same split
// `foodController.js` (1.15e) established: this layer's only job is
// "is the request body even shaped right" (via zod, below) — every real
// business rule (single-restaurant constraint, hidden/unknown food_id,
// payment_method_id ownership/active check, server-side pricing, the
// order_code retry loop, the orders+order_items transaction) already
// lives in `services/submitOrder.js` (Task 3.15b) and isn't repeated
// here.
//
// No `authMiddleware` here at all — same as every other customer-facing
// route since `restaurant.routes.js` (Task 3.3): customers have no
// accounts (docs/DB_SCHEMA.md), so there's no `req.user` to scope by,
// and this endpoint is intentionally reachable by anyone.
//
// `createOrderSchema` is `.strict()`, same reasoning `foodController.js`
// (1.15e) already documents for its own create schema: a client-supplied
// `subtotal`/`total`/`order_code`/`restaurant_id`/`status` (or any other
// unrecognized key) is rejected outright with a 400 rather than silently
// dropped. That matters more here than it did for foods — `subtotal`/
// `total` are exactly the fields `submitOrder.js`'s own header comment
// says must never be trusted from a request; `.strict()` makes that a
// visible rejection instead of relying on `submitOrder` simply never
// reading those keys off `data` (true today, but a silent-drop schema
// wouldn't tell a caller their `total` field did nothing).
//
// Length/type limits below come straight from `docs/DB_SCHEMA.md`'s 0.8
// section (`orders` table), same "fail here with a clear message rather
// than at the DB layer" reasoning `foodController.js`/
// `paymentMethodController.js` already use for their own schemas.
//
// Deliberately NOT this task's job (see docs/TASKS.md's 3.15a-d
// breakdown):
//   - route-level/integration tests, README/PROJECT_STATUS/TASKS status
//     updates -> Task 3.15d
//
// Task 3.17 adds `track` (GET /api/orders/track?order_code=...&
// customer_phone=...) on top of this same file — see that function's own
// comment below for why it reuses `utils/phoneLookup.js` (Task 1.10)
// rather than a hand-written query.
//
// Task 5.12a adds `list` (GET /api/orders, owner-authenticated) — the
// first route in this file requiring `authMiddleware`/
// `attachOwnerRestaurant` at all; every route above it is intentionally
// public (customers have no accounts).
//
// Task 5.13 adds `getOne` (GET /api/orders/:id, owner-authenticated,
// additionally behind `ownershipMiddleware` — see `order.routes.js`'s own
// comment on why it's registered last) — see that function's own comment
// below for what it adds on top of a bare `orders` row. See `list`'s own comment below.

const { z } = require('zod');

const submitOrder = require('../services/submitOrder');
const updateOrderStatus = require('../services/updateOrderStatus');
const { getOrderCounts } = require('../services/orderCounts');
const { getSalesSummary } = require('../services/salesSummary');
const orders = require('../models/orders');
const orderItems = require('../models/orderItems');
const paymentMethods = require('../models/paymentMethods');
const { phoneLookup } = require('../utils/phoneLookup');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, ApiError } = require('../utils/errors');

// docs/DB_SCHEMA.md's 0.8 section: customer_name VARCHAR2(120),
// customer_location_text VARCHAR2(255), customer_note VARCHAR2(500),
// payment_screenshot_url VARCHAR2(500).
const CUSTOMER_NAME_MAX_LENGTH = 120;
const CUSTOMER_LOCATION_TEXT_MAX_LENGTH = 255;
const CUSTOMER_NOTE_MAX_LENGTH = 500;
const PAYMENT_SCREENSHOT_URL_MAX_LENGTH = 500;
// customer_phone VARCHAR2(30) — this caps the *raw* (pre-normalize)
// input at the same 30 chars, not the post-`normalizePhone` value.
// That's still a safe bound: `normalizePhone` (Task 1.10, called inside
// `submitOrder`) only ever strips characters (keeping digits and a
// leading `+`), never adds any, so a raw string already within 30 chars
// can never normalize to something longer.
const CUSTOMER_PHONE_MAX_LENGTH = 30;

const customerNameSchema = z
  .string()
  .trim()
  .min(1, 'customer_name is required')
  .max(CUSTOMER_NAME_MAX_LENGTH, `customer_name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`);

const customerPhoneSchema = z
  .string()
  .trim()
  .min(1, 'customer_phone is required')
  .max(CUSTOMER_PHONE_MAX_LENGTH, `customer_phone must be at most ${CUSTOMER_PHONE_MAX_LENGTH} characters`);

const customerLocationTextSchema = z
  .string()
  .trim()
  .min(1, 'customer_location_text is required')
  .max(
    CUSTOMER_LOCATION_TEXT_MAX_LENGTH,
    `customer_location_text must be at most ${CUSTOMER_LOCATION_TEXT_MAX_LENGTH} characters`
  );

const customerNoteSchema = z
  .string()
  .trim()
  .max(CUSTOMER_NOTE_MAX_LENGTH, `customer_note must be at most ${CUSTOMER_NOTE_MAX_LENGTH} characters`)
  .nullable();

const paymentMethodIdSchema = z
  .number({ invalid_type_error: 'payment_method_id must be a number' })
  .int('payment_method_id must be an integer')
  .positive('payment_method_id must be a positive integer');

// Validated as a real URL, same `image_url` pattern `foodController.js`
// (1.15e) uses — this field is populated from `uploadToObjectStorage`'s
// (Task 3.14) return value in practice, but this endpoint takes it as a
// plain string, not a file upload of its own.
const paymentScreenshotUrlSchema = z
  .string()
  .trim()
  .min(1, 'payment_screenshot_url is required')
  .max(
    PAYMENT_SCREENSHOT_URL_MAX_LENGTH,
    `payment_screenshot_url must be at most ${PAYMENT_SCREENSHOT_URL_MAX_LENGTH} characters`
  )
  .url('payment_screenshot_url must be a valid URL');

const foodIdSchema = z
  .number({ invalid_type_error: 'food_id must be a number' })
  .int('food_id must be an integer')
  .positive('food_id must be a positive integer');

const quantitySchema = z
  .number({ invalid_type_error: 'quantity must be a number' })
  .int('quantity must be an integer')
  .positive('quantity must be a positive integer');

// `.strict()` here too — an item carrying anything beyond food_id/
// quantity (most importantly a client-supplied price) is rejected
// outright, same reasoning as the top-level schema, not silently
// dropped by `submitOrder.js`'s own destructuring (which only ever
// reads `food_id`/`quantity` off each item regardless).
const orderItemSchema = z
  .object({
    food_id: foodIdSchema,
    quantity: quantitySchema,
  })
  .strict();

const createOrderSchema = z
  .object({
    customer_name: customerNameSchema,
    customer_phone: customerPhoneSchema,
    customer_location_text: customerLocationTextSchema,
    customer_note: customerNoteSchema.optional(),
    payment_method_id: paymentMethodIdSchema,
    payment_screenshot_url: paymentScreenshotUrlSchema,
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  })
  .strict();

function parseOrThrow(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw badRequest(firstIssue ? firstIssue.message : 'Invalid request payload');
  }
  return parsed.data;
}

// POST /api/orders — validates the request shape, then hands off
// entirely to `submitOrder` (3.15b) for every actual business rule.
// Returns 201 with the created order (including its generated
// `order_code`/`status`) + its created `order_items` rows, for Task
// 3.16's confirmation screen to read back.
async function create(req, res, next) {
  try {
    const data = parseOrThrow(createOrderSchema, req.body);
    const { order, items } = await submitOrder(data);
    res.status(201).json({ order, items });
  } catch (err) {
    next(err);
  }
}

// Same reasoning + same fix as foodController.js's/categoryController.js's
// requireRestaurantScope (found while writing 1.15f's tests for foods,
// reused as-is for every owner-scoped collection route since): `list`
// below has no `:id` for `ownershipMiddleware` (Task 1.4) to run against,
// so nothing else on this route catches an admin token — or any other
// non-owner role `attachOwnerRestaurant` (1.15a) deliberately no-ops
// for — reaching it with an undefined restaurant scope.
function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

// GET /api/orders (owner-authenticated) — Task 5.12a
//
// Lists the caller's own restaurant's orders, paginated, newest-first.
// Mounted behind authMiddleware + attachOwnerRestaurant only (order.routes.js)
// — no ownershipMiddleware, same as foodController.list/categoryController.list:
// there's no single `:id` here, the whole point is "every order belonging
// to req.user.restaurant_id".
//
// `orderBy: 'id', orderDir: 'DESC'` — same reasoning `history` (3.18a,
// below) already documents for the customer-facing list: `created_at`
// isn't in `models/orders.js`'s settable `columns` list (crudFactory's
// `findAll`/`count` only allow-list `orderBy` against `primaryKey` +
// those columns — see crudFactory.js's `_buildFilterWhere`), and neither
// is `status` (both deliberately excluded there — see that model's own
// header comment on why). A strictly-increasing surrogate `id` is an
// equally reliable newest-first proxy without widening that allow-list
// for this one caller.
//
// No `status`/date filter yet, unlike foodController.list's `category_id`
// filter — deliberately out of scope here: docs/TASKS.md's 5.12 is just
// "incoming orders list", and status/restaurant/date filtering is
// explicitly Task 6.10's job on the admin side. Worth revisiting once
// 5.14 (Accept/Reject) exists and an owner has a real reason to want
// only `New` orders in view, but that's a product decision for whoever
// picks up that task, not assumed here.
async function list(req, res, next) {
  try {
    requireRestaurantScope(req);
    const { rows, meta } = await paginateForOwner(
      orders,
      req.user.restaurant_id,
      {},
      req.query,
      { orderBy: 'id', orderDir: 'DESC' }
    );
    res.status(200).json({ orders: rows, meta });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/counts (owner-authenticated) — Task 5.17
//
// Backs the owner Dashboard's "new orders count + order counts summary"
// (docs/TASKS.md's 5.17). Mounted (order.routes.js) ahead of `GET /:id`
// for the same reason `/api/foods/popular` is mounted ahead of
// `food.routes.js`'s owner-scoped router (Task 3.5's own comment): a
// literal path segment like "counts" would otherwise be swallowed as
// `:id` by a route registered first, and here that would mean
// `ownershipMiddleware`'s own numeric-id check 400ing on the string
// "counts" before this handler ever ran, not a 401/403 — a different,
// more confusing failure than 3.5's/3.4's shadowing bugs produced, but
// the same underlying registration-order cause. Chains only
// `authMiddleware` → `attachOwnerRestaurant`, same as `list` above — no
// `ownershipMiddleware` here either, since this isn't scoped to one
// order's `:id` any more than `list` is.
//
// Delegates entirely to `services/orderCounts.js` (Task 5.17) for the
// actual query — see that file's own header comment for why this can't
// go through `crudFactory`'s `countForOwner` (Task 1.9) the way a
// simpler equality-filtered count could.
async function counts(req, res, next) {
  try {
    requireRestaurantScope(req);
    const orderCounts = await getOrderCounts(req.user.restaurant_id);
    res.status(200).json({ counts: orderCounts });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/sales-summary (owner-authenticated) — Task 5.18a
//
// Backs the owner Dashboard's sales summary widget (Task 5.18, frontend
// half wired in 5.18b). Mounted (order.routes.js) ahead of `GET /:id`,
// same shadowing reasoning `counts`'s own comment above already gives
// for the "counts" literal segment — "sales-summary" would otherwise be
// swallowed as `:id` too. Same chain as `counts`: `authMiddleware` →
// `attachOwnerRestaurant` only, no `ownershipMiddleware` (not scoped to
// one order's `:id`).
//
// Delegates entirely to `services/salesSummary.js` (Task 5.18a) for the
// actual query — see that file's own header comment for why this can't
// go through `crudFactory` either (same `status`-isn't-a-settable-column
// gap `counts`'s own delegate hits, plus no `SUM` support regardless).
async function salesSummary(req, res, next) {
  try {
    requireRestaurantScope(req);
    const summary = await getSalesSummary(req.user.restaurant_id);
    res.status(200).json({ summary });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id (owner-authenticated) — Task 5.13
//
// `docs/NATRA_MASTER_PROMPT.md`'s "Order details" list: Order ID,
// customer name, phone, food items and quantities, total, selected
// payment method, payment screenshot, specific customer location,
// date/time, status. `order.routes.js`'s `requireOwnedOrder`
// (`ownershipMiddleware(orders)`, Task 1.4) has already fetched the row
// (confirmed to belong to `req.user.restaurant_id`) and attached it as
// `req.resource` before this handler ever runs — same guarantee
// `foodController.getOne` (1.15e) documents for itself — so everything
// below is purely about gathering the two things a bare `orders` row
// doesn't carry on its own: its line items and its payment method's
// display details.
//
// `order_items` has no `ownerColumn` of its own (see that model's header
// comment) — ownership for them rides entirely on `req.resource` already
// being confirmed as this owner's order above, then filtering items by
// its `order_id`, same "go through the parent row first" pattern that
// model's comment describes.
//
// `payment_method_id` is looked up with a plain `findById`, not
// `findByIdForOwner`/`getOrThrowForOwner` — `submitOrder.js` (3.15b)
// already enforced at write time that a payment method must belong to
// the *same* restaurant as the order to be accepted in the first place
// (see that file's own `payment_method_id is not valid for this
// restaurant` check), so by the time an order row exists, its
// `payment_method_id` is guaranteed to already be this owner's, without
// this handler re-deriving that from `req.user` itself. `findById`
// (rather than `getOrThrow`) returns `null` instead of throwing if
// nothing turns up — defensive only, since payment methods are never
// hard-deleted (`models/paymentMethods.js`'s own header comment: `is_active`
// is the only supported way to retire one), never something a real order
// should hit.
async function getOne(req, res, next) {
  try {
    const order = req.resource;
    const [items, paymentMethod] = await Promise.all([
      orderItems.findAll({ order_id: order.id }),
      paymentMethods.findById(order.payment_method_id),
    ]);
    res.status(200).json({ order, items, payment_method: paymentMethod });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status (owner-authenticated) — Task 5.14a,
// widened by Task 5.15
//
// Accept/Reject/Complete, wired through `statusTransition` (Task 1.7) via
// `services/updateOrderStatus.js` — see that file's own header comment
// for why the actual column write can't go through crudFactory's
// `updateForOwner` (status/status_updated_at are deliberately excluded
// from `models/orders.js`'s settable columns).
//
// `.strict()` `z.enum(['Accepted', 'Rejected', 'Completed'])` — 5.14a's
// version of this schema deliberately left `Completed` out, with a
// comment here explaining that omission was "Task 5.15's own job". This
// is that widening: `updateOrderStatus`'s transitions map (5.14a) already
// knew `Accepted -> Completed` was valid and was already tested for it
// (`updateOrderStatus.test.js`), so this task's only real gap was this
// schema still 400ing the request before it ever reached that service —
// no second endpoint, exactly as 5.14a's own comment anticipated.
//
// `req.resource` (from `order.routes.js`'s `requireOwnedOrder`, same
// chain `getOne` above already documents) is the already-ownership-
// checked row `updateOrderStatus` transitions — this handler never
// re-fetches or re-derives ownership itself.
//
// A disallowed transition (e.g. re-accepting an already-`Accepted`
// order, or completing a `New`/`Rejected`/already-`Completed` one)
// surfaces as `updateOrderStatus`'s own 409 (via `statusTransition`'s
// `assertCanTransition`), not a bespoke error shape here.
const updateStatusSchema = z
  .object({
    status: z.enum(['Accepted', 'Rejected', 'Completed']),
  })
  .strict();

async function updateStatus(req, res, next) {
  try {
    const { status } = parseOrThrow(updateStatusSchema, req.body);
    const order = await updateOrderStatus(req.resource, status);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

// Track Order (Task 3.17) — `docs/NATRA_MASTER_PROMPT.md`'s "Tracking
// ... requires: Order ID, Phone number". Bound directly to the `orders`
// crud instance (Task 3.15a) here rather than in a separate module: this
// controller is `phoneLookup`'s only caller so far, so a dedicated file
// would just be one more indirection between this handler and the config
// object it passes.
//
// `getOrThrowByCode` (Task 1.10) already does everything the business
// logic needs — matching `order_code` AND `customer_phone` in one query,
// `normalizePhone`-tolerant on the phone side (the same normalization
// `submitOrder`, 3.15b, ran at write time, so "0912 345 678" here matches
// a row stored as "0912345678"), and a 404 rather than distinguishing
// "no such order" from "right code, wrong phone" — a Track Order endpoint
// leaking that a code exists to someone who doesn't also know the phone
// on it would be a real information leak given `orderCode.js`'s own note
// that codes aren't a security boundary on their own.
const orderLookup = phoneLookup({
  crud: orders,
  phoneColumn: 'customer_phone',
  codeColumn: 'order_code',
  entityName: 'Order',
});

// docs/DB_SCHEMA.md's 0.8 section: order_code VARCHAR2(20). No `.trim()`
// needed beyond what `normalizePhone`/`getOrThrowByCode` already do on
// the phone side — `order_code` is matched as an exact equality filter
// (crudFactory's `findAll`), so a stray leading/trailing space would
// simply fail to match rather than silently succeed against the wrong
// row; trimming it here is a kindness to a customer who pasted it with
// whitespace, not a correctness requirement.
const ORDER_CODE_MAX_LENGTH = 20;
const orderCodeSchema = z
  .string()
  .trim()
  .min(1, 'order_code is required')
  .max(ORDER_CODE_MAX_LENGTH, `order_code must be at most ${ORDER_CODE_MAX_LENGTH} characters`);

// Same schema/length rule `customerPhoneSchema` (above) uses for the
// create endpoint — this is the same column being matched against, just
// read from a query string instead of a JSON body.
const trackQuerySchema = z
  .object({
    order_code: orderCodeSchema,
    customer_phone: customerPhoneSchema,
  })
  .strict();

// GET /api/orders/track?order_code=...&customer_phone=... — a query
// string, not a path param, since neither value alone identifies a
// resource the way `/api/restaurants/:id` does; both are required
// together (see `orderLookup`'s own comment above for why). Returns the
// same `{ order, items }` shape `create` (3.15c) does, so a customer
// re-visiting Track Order sees exactly what Order Confirmation (3.16)
// showed them right after checkout, not a differently-shaped response
// they'd need special-casing for.
async function track(req, res, next) {
  try {
    const { order_code, customer_phone } = parseOrThrow(trackQuerySchema, req.query);
    const order = await orderLookup.getOrThrowByCode(order_code, customer_phone);
    const items = await orderItems.findAll({ order_id: order.id });
    res.status(200).json({ order, items });
  } catch (err) {
    next(err);
  }
}

// Order History (Task 3.18a) — `docs/NATRA_MASTER_PROMPT.md`'s
// "Customers can view previous orders using phone number only." Unlike
// `track` above, there's no code to pair the phone with — this is
// deliberately the *less*-restrictive lookup `orderLookup.findAllByPhone`'s
// own doc comment (`utils/phoneLookup.js`, Task 1.10) already calls out by
// name as "a route has to opt into on purpose", so a phone alone is
// genuinely enough to browse every order made with it (a product decision
// already made upstream of this handler, not one it re-litigates).
//
// `findAllByPhone` already returns the exact `{ rows, meta }` shape
// `paginate()` (Task 1.9) produces, so this handler does no reshaping of
// its own — same "pass the API response's `meta` straight through" contract
// `ListWithPagination`'s own doc comment (Task 2.16) expects on the
// frontend side (3.18c).
//
// `orderBy: 'id', orderDir: 'DESC'` (rather than the default ascending
// `id` order `findAll`/`paginate` would otherwise use) so a customer's most
// recent order shows first — the ordinary expectation for an order-history
// list. `created_at` would read more naturally here, but it isn't in
// `models/orders.js`'s settable `columns` list (see that model's own
// comment on why `status`/`status_updated_at`/`expires_at` are excluded;
// `created_at` is DB-managed the same way) and `findAll`'s `orderBy` is
// only allow-listed against `primaryKey` + settable `columns` — `id` being
// a strictly increasing surrogate key makes it an equally reliable proxy
// for insertion order here, without widening that allow-list for this one
// caller.
const historyQuerySchema = z
  .object({
    customer_phone: customerPhoneSchema,
    page: z.string().trim().optional(),
    limit: z.string().trim().optional(),
  })
  .strict();

// GET /api/orders/history?customer_phone=...&page=...&limit=... — a list
// endpoint, not a single-record lookup like `track`: an unmatched phone
// number returns `200` with an empty `rows` array (`meta.total === 0`),
// never a `404` — there's no single "the" resource here to have not been
// found, just a filter that happened to match nothing, same as any other
// paginated list endpoint in this codebase.
async function history(req, res, next) {
  try {
    const { customer_phone, page, limit } = parseOrThrow(historyQuerySchema, req.query);
    const { rows, meta } = await orderLookup.findAllByPhone(
      customer_phone,
      {},
      { page, limit },
      { orderBy: 'id', orderDir: 'DESC' }
    );
    res.status(200).json({ rows, meta });
  } catch (err) {
    next(err);
  }
}

// Schema exported alongside the handler so 3.15d's tests can exercise it
// directly, same convention `foodController.js` (1.15e) already
// established.
module.exports = {
  create,
  createOrderSchema,
  list,
  counts,
  salesSummary,
  getOne,
  updateStatus,
  updateStatusSchema,
  track,
  trackQuerySchema,
  history,
  historyQuerySchema,
};
