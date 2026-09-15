// adminController — Task 6.3a, extended by 6.4a, extended by 6.6b,
// extended by 6.6c, extended by 6.7c, extended by 6.8, extended by 6.9
//
// Thin controller wrapping `services/adminDashboardSummary.js` (already
// built as part of Task 6.3's initial pass, before the task was split
// into 6.3a/6.3b) — same one-function-per-route-calls-one-service shape
// `adminSettingsController.js`'s `getRegistrationInfo` already uses for
// its own single read. `getDashboardSummaryHandler` has no request input
// to validate (no params, query, or body) — a platform-wide GET with
// nothing to scope by, unlike every owner-authenticated controller in
// this codebase.
//
// `listRestaurantsHandler` (Task 6.4a) is the same thin shape, wrapping
// `services/adminRestaurantsList.js` instead — its one real input is
// `req.query` (page/limit/offset/q), forwarded straight through
// unvalidated the same way `restaurantController.js`'s own `list`
// forwards `req.query` to `paginate()`: the service (via
// `parsePaginationParams`) is what actually validates it, throwing a
// 400 `ApiError` this handler's `catch` passes to `next` untouched.
//
// `listLiveRequestsHandler`/`getLiveRequestDetailHandler` (Tasks
// 6.6b/6.6c) are the same two-handlers-per-resource shape
// `listRestaurantsHandler`/`getRestaurantDetailHandler` already
// established for restaurants, both wrapping
// `services/adminLiveRequestsList.js` — see that file's own header
// comment for why both the list and detail reads live together there
// rather than the detail half going through a crudFactory instance the
// way `getRestaurantDetailHandler` does.
//
// Route-level auth (`authMiddleware` + `requireAdmin`) is what makes
// exposing platform-wide data safe on both handlers here — see
// `admin.routes.js`'s own header comment for the chain, and
// `requireAdmin.js`'s header comment for why this needed a new
// role-gating middleware rather than reusing `attachOwnerRestaurant`.
//
// `updateLiveRequestStatusHandler` (Task 6.7c) is the last piece of the
// Approve/Reject backend — wiring 6.7a's `rejectLiveRequest` and 6.7b's
// `approveLiveRequest` (both in `services/updateLiveRequestStatus.js`)
// behind a real route. Same "controller fetches, service transitions"
// split `orderController.updateStatus`/`updateOrderStatus` (5.14a)
// already establishes for the closest precedent — except the fetch here
// goes through `getLiveRequestForAdmin` (6.6c), not `ownershipMiddleware`
// (Task 1.4)'s `req.resource`, since this row isn't owner-scoped the way
// an order is; there's no `getOrThrowForOwner` to build that middleware
// around (see `admin.routes.js`'s own header comment on why none of its
// routes use `attachOwnerRestaurant`/`ownershipMiddleware`).
//
// `updateRestaurantSuspensionHandler` (Task 6.8) is Suspend/Reactivate —
// `restaurants.is_suspended`, a NUMBER(1) 0/1 column `docs/DB_SCHEMA.md`'s
// own 0.6 section is explicit is kept "independent of `live_status`," not
// a `statusTransition` state machine the way `live_requests.status`/
// `orders.status` are: both directions are always valid (there's no
// invalid "from -> to" pair to guard against the way pending->approved-
// then-back-to-pending would be), so there's nothing for that module's
// `assertCanTransition` to actually add here. This follows
// `restaurantController.js`'s own `updateMe`/`is_open` (5.8) precedent
// instead — same "boolean in, 0/1 stored" `toIsOpenNumber` convention,
// just a second copy for `is_suspended` (`toIsSuspendedNumber` below)
// rather than a shared util, per this codebase's established
// no-shared-currency/date/boolean-conversion-util precedent every other
// duplicated small helper here already follows. Unlike `updateMe`, this
// updates by plain `id` (`restaurantsCrud.update`, not `updateForOwner`)
// since the caller is an admin acting on any restaurant, not an owner
// scoped to their own.
//
// `listOrdersHandler` (Task 6.9) is the same thin
// `listRestaurantsHandler`/`listLiveRequestsHandler` shape, wrapping
// `services/adminOrdersList.js` instead — `req.query` (page/limit/
// offset/q) forwarded straight through unvalidated, same reasoning
// `listRestaurantsHandler`'s own comment already gives.

const { z } = require('zod');

const { getDashboardSummary } = require('../services/adminDashboardSummary');
const { listRestaurantsForAdmin } = require('../services/adminRestaurantsList');
const { listLiveRequestsForAdmin, getLiveRequestForAdmin } = require('../services/adminLiveRequestsList');
const { approveLiveRequest, rejectLiveRequest } = require('../services/updateLiveRequestStatus');
const { listOrdersForAdmin } = require('../services/adminOrdersList');
const { recomputePopularityStats } = require('../services/popularityAggregation');
const restaurantsCrud = require('../models/restaurants');
const ordersCrud = require('../models/orders');
const orderItemsCrud = require('../models/orderItems');
const paymentMethodsCrud = require('../models/paymentMethods');
const adminSettingsCrud = require('../models/adminSettings');
const { SETTINGS_ROW_ID } = require('./adminSettingsController');
const { badRequest, notFound } = require('../utils/errors');

async function getDashboardSummaryHandler(req, res, next) {
  try {
    const summary = await getDashboardSummary();
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

// Response envelope matches `restaurantController.js`'s own customer-
// facing `list` handler exactly (`{ restaurants, meta }`) — same shape,
// same `meta` fields (Task 1.9), just a different (platform-wide,
// search-filterable) row set underneath. Keeping the envelope identical
// means `ListWithPagination` (Task 6.4b) doesn't need any admin-specific
// response handling.
async function listRestaurantsHandler(req, res, next) {
  try {
    const { rows, meta } = await listRestaurantsForAdmin(req.query);
    res.status(200).json({ restaurants: rows, meta });
  } catch (err) {
    next(err);
  }
}

// getRestaurantDetailHandler (Task 6.5a) — GET /api/admin/restaurants/:id.
// No separate service module here, unlike `listRestaurantsHandler`'s
// `adminRestaurantsList.js`: a single-row-by-primary-key read is exactly
// what `models/restaurants.js`'s crudFactory instance already does for
// free (`getOrThrow`, Task 1.x), so this follows `restaurantController.js`'s
// own `getProfile`/`getMenu`/`getPaymentMethods` precedent of a controller
// calling the crud instance directly rather than wrapping it in a service
// that would just be `return restaurantsCrud.getOrThrow(id)`.
//
// Unlike `getProfile` (the public, customer-facing single-restaurant read,
// Task 3.7), there's no `isLive` filter here — same "platform-wide, all
// restaurants regardless of Live status" reasoning `listRestaurantsHandler`'s
// own service header comment already gives for the list endpoint. An
// admin reviewing a pending/rejected/suspended restaurant needs to see it,
// not get a 404 as if it doesn't exist.
//
// `getOrThrow` throws a 404 `ApiError` (`${table} not found`, i.e.
// "restaurants not found") for a missing/non-numeric id, which `next(err)`
// forwards to the central error handler — same shape every other
// `getOrThrow`-based read in this codebase already relies on, no bespoke
// id validation needed here.
async function getRestaurantDetailHandler(req, res, next) {
  try {
    const restaurant = await restaurantsCrud.getOrThrow(req.params.id);
    res.status(200).json({ restaurant });
  } catch (err) {
    next(err);
  }
}

// listLiveRequestsHandler (Task 6.6b) — GET /api/admin/live-requests.
// Same thin-controller-over-a-service shape `listRestaurantsHandler`
// (6.4a) already uses for `listRestaurantsForAdmin`: forward `req.query`
// straight through unvalidated (6.6a's own `parsePaginationParams` call,
// via `utils/paginate.js`, is what actually validates it, throwing a 400
// `ApiError` this handler's `catch` passes to `next` untouched — same
// "validation lives in the service, not the controller" split
// `listRestaurantsHandler`'s own comment documents). Response envelope
// is `{ live_requests, meta }` — same `{ <plural-resource>, meta }`
// shape `listRestaurantsHandler`'s `{ restaurants, meta }` already
// established, just with this endpoint's own resource name, so 6.6d's
// `ListWithPagination` wiring needs no bespoke response handling either.
async function listLiveRequestsHandler(req, res, next) {
  try {
    const { rows, meta } = await listLiveRequestsForAdmin(req.query);
    res.status(200).json({ live_requests: rows, meta });
  } catch (err) {
    next(err);
  }
}

// getLiveRequestDetailHandler (Task 6.6c) — GET /api/admin/live-requests/:id.
// Thin controller over `getLiveRequestForAdmin` (6.6a/6.6c's own
// service file) — that function is what throws the 404 `ApiError` for a
// missing id, same `getOrThrow`-shaped contract `getRestaurantDetailHandler`
// (6.5a) relies on from crudFactory, just hand-written here since this
// read needs the join, not a crudFactory instance to delegate to (see
// `adminLiveRequestsList.js`'s own header comment on why the detail read
// lives in that file rather than going through `models/liveRequests.js`).
async function getLiveRequestDetailHandler(req, res, next) {
  try {
    const liveRequest = await getLiveRequestForAdmin(req.params.id);
    res.status(200).json({ live_request: liveRequest });
  } catch (err) {
    next(err);
  }
}

// Same shape `orderController.js`'s own `parseOrThrow` (3.15c) already
// uses — this file had no request-body validation of its own until this
// handler, every prior admin route being a GET with nothing to parse.
function parseOrThrow(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw badRequest(firstIssue ? firstIssue.message : 'Invalid request payload');
  }
  return parsed.data;
}

// `.strict()` + a two-value enum — same "reject an unrecognized/extra
// field with a 400 rather than silently ignore it" reasoning
// `orderController.js`'s own `updateStatusSchema` (5.14a) already
// documents. `'pending'` isn't a valid target here (there's nothing to
// transition *to* pending — every request starts there) and `approved`/
// `rejected` are the only two `statusTransition`'s own `pending: [...]`
// map (`updateLiveRequestStatus.js`, 6.7a/6.7b) allows from `pending` —
// a request already in one of those terminal states surfaces as that
// same module's own 409 (via `assertCanTransition`), not a bespoke error
// shape here.
const updateLiveRequestStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
  })
  .strict();

// updateLiveRequestStatusHandler (Task 6.7c) —
// PATCH /api/admin/live-requests/:id/status.
//
// Fetches the row via `getLiveRequestForAdmin` (6.6c) — same joined
// shape `getLiveRequestDetailHandler` above already reads, which is a
// superset of what `rejectLiveRequest`/`approveLiveRequest`
// (`updateLiveRequestStatus.js`, 6.7a/6.7b) actually need off it
// (`id`, `restaurant_id`, `status`) — rather than a second, narrower
// read: one fewer query shape for this file to own, and it throws the
// same 404 a missing/bogus `:id` should produce either way. `req.user.id`
// (the authenticated admin, from `authMiddleware`, 1.14) is passed
// through as `reviewerId`, written to `reviewed_by` by whichever
// transition runs.
//
// Dispatches to `approveLiveRequest` or `rejectLiveRequest` by
// `status` — unlike `orderController.updateStatus`'s single
// `updateOrderStatus(req.resource, status)` call, `updateLiveRequestStatus.js`
// exports the two transitions as separate named functions rather than
// one combined one (see that module's own header comment on why approve
// needed a genuinely different, transactional write shape reject
// doesn't), so this handler is what picks between them.
async function updateLiveRequestStatusHandler(req, res, next) {
  try {
    const { status } = parseOrThrow(updateLiveRequestStatusSchema, req.body);
    const liveRequest = await getLiveRequestForAdmin(req.params.id);
    const transition = status === 'approved' ? approveLiveRequest : rejectLiveRequest;
    const updated = await transition(liveRequest, req.user.id);
    res.status(200).json({ live_request: updated });
  } catch (err) {
    next(err);
  }
}

// `is_suspended` (Task 6.8) — the admin-facing Suspend/Reactivate toggle.
// docs/DB_SCHEMA.md: `is_suspended NUMBER(1), default 0 — admin can
// suspend an approved restaurant independent of live_status`. Exposed at
// the API boundary as a boolean and converted to the DB's 0/1 here, same
// convention `restaurantController.js`'s own `toIsOpenNumber` (5.8) and
// `paymentMethodController.js`'s own `is_active` (1.16c) conversion
// already established for this codebase's other 0/1 toggleable columns.
const isSuspendedSchema = z
  .number()
  .refine((v) => v === 0 || v === 1, { message: 'is_suspended must be a boolean' });

function toIsSuspendedNumber(value) {
  if (typeof value !== 'boolean') {
    throw badRequest('is_suspended must be a boolean');
  }
  return value ? 1 : 0;
}

const updateRestaurantSuspensionSchema = z
  .object({
    is_suspended: isSuspendedSchema,
  })
  .strict();

// updateRestaurantSuspensionHandler (Task 6.8) —
// PATCH /api/admin/restaurants/:id/suspension.
//
// `toIsSuspendedNumber` runs before `updateRestaurantSuspensionSchema`,
// same ordering `restaurantController.updateMe` uses for `is_open`, so a
// non-boolean value (e.g. the string `"true"`) throws its own 400
// immediately rather than reaching the schema as something that isn't
// really 0 or 1.
//
// `restaurantsCrud.update(id, data)` (the plain, non-owner-scoped
// variant — an admin isn't the restaurant's owner) returns `null` for a
// missing id rather than throwing, unlike `getOrThrow`; this handler
// throws its own 404 in that case, same "id genuinely doesn't exist"
// reasoning `getRestaurantDetailHandler`'s own comment already gives —
// there's no ownership ambiguity for `requireAdmin` to create.
async function updateRestaurantSuspensionHandler(req, res, next) {
  try {
    const is_suspended = toIsSuspendedNumber(req.body.is_suspended);
    const { is_suspended: validated } = parseOrThrow(updateRestaurantSuspensionSchema, {
      is_suspended,
    });
    const updated = await restaurantsCrud.update(req.params.id, { is_suspended: validated });
    if (!updated) throw notFound('restaurants not found');
    res.status(200).json({ restaurant: updated });
  } catch (err) {
    next(err);
  }
}

// Response envelope matches `listRestaurantsHandler`/`listLiveRequestsHandler`
// exactly (`{ orders, meta }`) — same shape, same `meta` fields (Task 1.9),
// just a different (platform-wide, joined-to-restaurant, search-filterable)
// row set underneath. Keeping the envelope identical means
// `ListWithPagination` (Task 6.9's own frontend half) doesn't need any
// admin-specific response handling, same reasoning `listRestaurantsHandler`'s
// own comment already gives.
async function listOrdersHandler(req, res, next) {
  try {
    const { rows, meta } = await listOrdersForAdmin(req.query);
    res.status(200).json({ orders: rows, meta });
  } catch (err) {
    next(err);
  }
}

// getOrderDetailHandler (Task 6.11a) — GET /api/admin/orders/:id.
//
// Platform-wide single-order read — no ownership check, unlike
// `orderController.getOne` (Task 5.13), which relies on
// `order.routes.js`'s `ownershipMiddleware(orders)` having already
// confirmed the row belongs to `req.user.restaurant_id` and attached it
// as `req.resource` before that handler ever runs. There's no owner to
// scope by here (same "platform-wide" reasoning every other handler in
// this file gives — see this file's own header comment), so this
// handler fetches the row itself, straight off `models/orders.js`'s
// crudFactory instance, the same "no separate service, a single-row-by-
// primary-key read is exactly what `getOrThrow` already does for free"
// precedent `getRestaurantDetailHandler` (6.5a) established. `getOrThrow`
// throws a 404 `ApiError` for a missing id, which `next(err)` forwards to
// the central error handler — same shape `getRestaurantDetailHandler`
// already relies on, so a bogus/nonexistent `:id` doesn't need bespoke
// handling here either.
//
// Once the order row itself is confirmed to exist, everything else is
// the exact same "gather the two things a bare `orders` row doesn't
// carry on its own" step `orderController.getOne`'s own comment
// documents — its line items and its payment method's display details —
// fetched the same way (plain `findAll`/`findById`, no owner-scoped
// variant needed: `order_items` has no `ownerColumn` of its own, and
// `payment_method_id` was already confirmed to belong to the order's own
// restaurant back when the order was created, per `submitOrder.js`'s own
// write-time check — see `orderController.getOne`'s own comment for the
// full reasoning behind both, which applies identically here).
//
// Response envelope is `{ order, items, payment_method }` — the exact
// same shape `orderController.getOne` returns, on purpose (this task's
// own wording in `docs/TASKS.md`): so `OrderDetail.jsx` (Task 5.13) can
// be reused as-is in 6.11b's read-only admin mode, with no admin-specific
// reshaping for that screen to account for.
async function getOrderDetailHandler(req, res, next) {
  try {
    const order = await ordersCrud.getOrThrow(req.params.id);
    const [items, paymentMethod] = await Promise.all([
      orderItemsCrud.findAll({ order_id: order.id }),
      paymentMethodsCrud.findById(order.payment_method_id),
    ]);
    res.status(200).json({ order, items, payment_method: paymentMethod });
  } catch (err) {
    next(err);
  }
}

// docs/DB_SCHEMA.md's 0.10 `admin_settings` section:
// registration_method_name VARCHAR2(60), registration_account_number
// VARCHAR2(60), registration_account_name VARCHAR2(120),
// registration_instructions VARCHAR2(500) nullable,
// registration_fee_amount NUMBER(10,2) required. Same string-length/
// currency-shape conventions `paymentMethodController.js`'s own
// `method_name`/`account_number`/`account_name`/`instructions` (1.16c)
// and `foodController.js`'s own `price` (1.15) already establish for
// those exact column shapes — reused here rather than invented fresh,
// since these are the same VARCHAR2/NUMBER(10,2) shapes, just on a
// different table.
const REGISTRATION_METHOD_NAME_MAX_LENGTH = 60;
const REGISTRATION_ACCOUNT_NUMBER_MAX_LENGTH = 60;
const REGISTRATION_ACCOUNT_NAME_MAX_LENGTH = 120;
const REGISTRATION_INSTRUCTIONS_MAX_LENGTH = 500;
// NUMBER(10,2): up to 8 digits before the decimal point, exactly 2 after
// — same bound `foodController.js`'s own `MAX_PRICE` (1.15) already
// uses for the identical column shape.
const MAX_REGISTRATION_FEE_AMOUNT = 99999999.99;

const registrationFeeAmountSchema = z
  .number({ invalid_type_error: 'registration_fee_amount must be a number' })
  // Unlike `foodController.js`'s own `price` (which must be `.positive()`
  // — a menu item priced at 0 makes no sense), a one-time registration
  // fee of 0 is a real, plausible admin choice (a promotional "free to go
  // Live" period), so this only rejects negative values, not zero.
  .nonnegative('registration_fee_amount cannot be negative')
  .max(MAX_REGISTRATION_FEE_AMOUNT, `registration_fee_amount cannot exceed ${MAX_REGISTRATION_FEE_AMOUNT}`)
  // Same floating-point-safe "exactly 2 decimal places" check
  // `foodController.js`'s own `priceSchema` already uses, for the same
  // NUMBER(10,2) reason.
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'registration_fee_amount can have at most 2 decimal places',
  });

const registrationMethodNameSchema = z
  .string()
  .trim()
  .min(1, 'registration_method_name is required')
  .max(REGISTRATION_METHOD_NAME_MAX_LENGTH);

const registrationAccountNumberSchema = z
  .string()
  .trim()
  .min(1, 'registration_account_number is required')
  .max(REGISTRATION_ACCOUNT_NUMBER_MAX_LENGTH);

const registrationAccountNameSchema = z
  .string()
  .trim()
  .min(1, 'registration_account_name is required')
  .max(REGISTRATION_ACCOUNT_NAME_MAX_LENGTH);

const registrationInstructionsSchema = z
  .string()
  .trim()
  .max(
    REGISTRATION_INSTRUCTIONS_MAX_LENGTH,
    `registration_instructions must be at most ${REGISTRATION_INSTRUCTIONS_MAX_LENGTH} characters`
  )
  .nullable();

// docs/DB_SCHEMA.md's 0.10 `admin_settings` section, the other three
// columns on this same row — Task 6.13's own slice, added here as
// `updateAdminSettingsSchema`'s promised extension (see that schema's
// own comment below, and 6.12a's `.strict()` comment it refers back to):
// `order_timeout_mode VARCHAR2(10)` (`CHECK IN ('off','15m','30m','1h',
// 'custom')`, default `'off'`), `order_timeout_custom_minutes NUMBER(5)`
// (nullable, "used only when mode = 'custom'" per the schema doc's own
// note), `notify_before_expiry NUMBER(1)` (0/1, default 0).
const ORDER_TIMEOUT_MODES = ['off', '15m', '30m', '1h', 'custom'];
// NUMBER(5): up to 5 digits, so 99999 is the real ceiling — same
// "read the column's own precision straight off the schema doc" approach
// `MAX_REGISTRATION_FEE_AMOUNT` above already takes for its own
// NUMBER(10,2) column.
const MAX_ORDER_TIMEOUT_CUSTOM_MINUTES = 99999;

const orderTimeoutModeSchema = z.enum(ORDER_TIMEOUT_MODES, {
  errorMap: () => ({
    message: `order_timeout_mode must be one of: ${ORDER_TIMEOUT_MODES.join(', ')}`,
  }),
});

// A timeout of "0 minutes" isn't a real custom duration (that's what
// `'off'` mode is for), so `.positive()`, not `.nonnegative()` — unlike
// `registration_fee_amount` above, there's no equivalent "0 is a
// legitimate choice" case here. `.nullable()` because the admin can
// clear it back out when switching `order_timeout_mode` away from
// `'custom'` (not required by any DB constraint, but there's no reason
// for a stale minute count to linger once it's meaningless).
const orderTimeoutCustomMinutesSchema = z
  .number({ invalid_type_error: 'order_timeout_custom_minutes must be a number' })
  .int('order_timeout_custom_minutes must be a whole number of minutes')
  .positive('order_timeout_custom_minutes must be a positive number of minutes')
  .max(
    MAX_ORDER_TIMEOUT_CUSTOM_MINUTES,
    `order_timeout_custom_minutes cannot exceed ${MAX_ORDER_TIMEOUT_CUSTOM_MINUTES}`
  )
  .nullable();

// Same manual-refine-over-`z.boolean()` convention `isSuspendedSchema`
// above and `paymentMethodController.js`'s own `is_active` (1.16c)
// already establish for this codebase's other 0/1 toggle columns — see
// `toNotifyBeforeExpiryNumber` below for where the API boolean actually
// gets converted to this 0/1.
const notifyBeforeExpirySchema = z
  .number()
  .refine((v) => v === 0 || v === 1, { message: 'notify_before_expiry must be a boolean' })
  .optional();

// Runs before `updateAdminSettingsSchema`, same ordering
// `toIsSuspendedNumber` above and `paymentMethodController.js`'s own
// `toIsActiveNumber` (1.16c) already use for an *optional* 0/1 field —
// `undefined` (the field simply wasn't in this PATCH) passes through
// untouched rather than being coerced into `false`/`0`, so an admin
// updating only, say, `order_timeout_mode` doesn't silently flip
// `notify_before_expiry` off.
function toNotifyBeforeExpiryNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw badRequest('notify_before_expiry must be a boolean');
  }
  return value ? 1 : 0;
}

// `.strict()` + every field `.optional()` — a `PATCH` where the admin
// only wants to change, say, the fee amount shouldn't have to resend
// every other field. Same "at least one field" refine
// `paymentMethodController.js`'s own `updatePaymentMethodSchema` (1.16c)
// already uses for an identically-shaped partial update, so an empty
// `{}` body is a 400, not a silent no-op write.
//
// 6.12a scoped this to only the five `registration_*` fields and left a
// `.strict()`-rejects-`order_timeout_mode` test as a placeholder for
// this exact task; this is that promised extension — `order_timeout_mode`
// /`order_timeout_custom_minutes`/`notify_before_expiry` are now real,
// validated fields on the same schema, not a second schema, per
// `docs/TASKS.md`'s own 6.13a wording ("extend 6.12a's ... validation").
// `.strict()` itself is unchanged and still does real work: it's *every*
// column not named across both tasks (there are none left on this row,
// but the pattern still matters) that a caller can't sneak past this
// schema.
//
// The one genuinely new rule 6.13a adds beyond "one more field each":
// `order_timeout_custom_minutes` is only meaningful — and only required
// — when `order_timeout_mode` is `'custom'`, per `docs/TASKS.md`'s own
// parenthetical. The `.superRefine` below enforces that *within a single
// request*: if this PATCH's own body sets `order_timeout_mode` to
// `'custom'`, that same body must also carry a non-null
// `order_timeout_custom_minutes` — deliberately not a check against
// whatever the row's *current* value already is (that would need an
// extra `findById` before every `PATCH`, just to validate a field most
// requests won't touch). A caller flipping mode to `'custom'` is
// expected to set the minute count in the same request, the same way a
// real settings form (6.13b's job) would submit both fields together
// from one "Custom" control group. Conversely, a PATCH that only sends
// `order_timeout_custom_minutes` (mode already `'custom'` from an
// earlier request, admin is just tweaking the number) is left alone —
// this refine only fires when `order_timeout_mode` itself is part of
// *this* body.
const updateAdminSettingsSchema = z
  .object({
    registration_fee_amount: registrationFeeAmountSchema.optional(),
    registration_method_name: registrationMethodNameSchema.optional(),
    registration_account_number: registrationAccountNumberSchema.optional(),
    registration_account_name: registrationAccountNameSchema.optional(),
    registration_instructions: registrationInstructionsSchema.optional(),
    order_timeout_mode: orderTimeoutModeSchema.optional(),
    order_timeout_custom_minutes: orderTimeoutCustomMinutesSchema.optional(),
    notify_before_expiry: notifyBeforeExpirySchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })
  .superRefine((data, ctx) => {
    if (data.order_timeout_mode === 'custom' && (data.order_timeout_custom_minutes ?? null) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order_timeout_custom_minutes is required when order_timeout_mode is 'custom'",
        path: ['order_timeout_custom_minutes'],
      });
    }
  });

// getSettingsHandler (Task 6.12a) — GET /api/admin/settings.
//
// Unlike `adminSettingsController.js`'s own public `getRegistrationInfo`
// (Task 4.3), which deliberately hand-picks only the five
// `registration_*` fields off the row (see that file's own header
// comment on why the `order_timeout_*`/`notify_before_expiry` columns
// have no business reaching a prospective owner), this admin-only read
// returns the whole singleton row as-is — the admin configuring this
// screen needs to see everything already on it, including the
// `order_timeout_*`/`notify_before_expiry` columns 6.13a now validates
// writes to (and 6.13b will add its own frontend controls for), not just
// this task's own five-field slice of it.
//
// Same `findById(SETTINGS_ROW_ID)` + `notFound` fallback
// `getRegistrationInfo` already uses (imported from that same
// controller rather than re-declaring the constant a second time) — see
// that file's own comment on why the fallback only matters against
// `fakeDb`/a genuinely broken deployment, never a real one (migration
// 0010 seeds this row itself).
async function getSettingsHandler(req, res, next) {
  try {
    const settings = await adminSettingsCrud.findById(SETTINGS_ROW_ID);
    if (!settings) {
      throw notFound('Platform settings have not been configured yet');
    }
    res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
}

// updateSettingsHandler (Task 6.12a; extended by 6.13a) — PATCH
// /api/admin/settings.
//
// `notify_before_expiry` is converted from the API's boolean to the
// DB's 0/1 before `updateAdminSettingsSchema` runs, same ordering (and
// same reason) `updateRestaurantSuspensionHandler`'s own
// `toIsSuspendedNumber` call and `paymentMethodController.update`'s own
// `toIsActiveNumber` call already use: a non-boolean value throws its
// own 400 immediately, rather than reaching the schema as something
// that isn't really 0 or 1. `undefined` (field simply absent) passes
// straight through and gets deleted back out below, same
// `updatePaymentMethodSchema` precedent, so it never becomes a spurious
// "undefined key" on the object handed to `adminSettingsCrud.update`.
//
// `adminSettingsCrud.update(SETTINGS_ROW_ID, data)` is the plain,
// non-owner-scoped variant — same reasoning
// `updateRestaurantSuspensionHandler` (6.8) already gives for using
// `restaurantsCrud.update` instead of a `*ForOwner` variant: an admin
// isn't "the owner" of this row, and `models/adminSettings.js` has no
// `ownerColumn` at all (a platform-wide singleton belongs to no one in
// particular). Returns `null` for a missing row rather than throwing,
// unlike `getOrThrow`, so this throws its own 404 in that case — same
// "id genuinely doesn't exist" shape `updateRestaurantSuspensionHandler`
// already establishes for an admin-facing `update`-not-`getOrThrow` call
// (only reachable against `fakeDb`/a broken deployment in practice, same
// as `getSettingsHandler` above).
async function updateSettingsHandler(req, res, next) {
  try {
    const notify_before_expiry = toNotifyBeforeExpiryNumber(req.body.notify_before_expiry);
    const data = parseOrThrow(updateAdminSettingsSchema, { ...req.body, notify_before_expiry });
    if (data.notify_before_expiry === undefined) delete data.notify_before_expiry;
    const updated = await adminSettingsCrud.update(SETTINGS_ROW_ID, data);
    if (!updated) throw notFound('Platform settings have not been configured yet');
    res.status(200).json({ settings: updated });
  } catch (err) {
    next(err);
  }
}

// recomputePopularityHandler (Task 7.1c) — POST
// /api/admin/popularity/recompute.
//
// Manual trigger for 7.1b's `recomputePopularityStats()`, so the
// aggregation-and-upsert pipeline can be exercised (and its effect on
// the Popular Foods grid checked) over real HTTP ahead of 7.3's cron
// existing to call it on a schedule. Admin-only, same
// `authMiddleware` + `requireAdmin` chain every other route in this
// file uses — recomputing platform-wide stats isn't scoped to any one
// owner's restaurant, same reasoning `getDashboardSummaryHandler`'s own
// comment gives for skipping `attachOwnerRestaurant`/
// `ownershipMiddleware` entirely.
//
// No request body/params to validate — this action takes no input,
// unlike every `PATCH` handler in this file. Returns 204 (No Content)
// rather than 200 with a body: `recomputePopularityStats()` doesn't
// return anything meaningful to hand back (it upserts and returns
// `undefined`), and there's no new/updated resource to represent in a
// response the way `updateSettingsHandler`'s `{ settings: updated }`
// has — same "action completed, nothing to show for it" shape a
// `DELETE` handler would use, just applied to a recompute instead of a
// deletion.
async function recomputePopularityHandler(req, res, next) {
  try {
    await recomputePopularityStats();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummaryHandler,
  listRestaurantsHandler,
  getRestaurantDetailHandler,
  listLiveRequestsHandler,
  getLiveRequestDetailHandler,
  updateLiveRequestStatusHandler,
  updateLiveRequestStatusSchema,
  updateRestaurantSuspensionHandler,
  updateRestaurantSuspensionSchema,
  listOrdersHandler,
  getOrderDetailHandler,
  getSettingsHandler,
  updateSettingsHandler,
  updateAdminSettingsSchema,
  recomputePopularityHandler,
};
