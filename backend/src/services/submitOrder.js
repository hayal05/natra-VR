// submitOrder — Task 3.15b
//
// The actual business logic behind "a customer places an order" — the
// one place a customer-submitted order should ever be created from, the
// same role `createFoodWithVisibility` (1.15c) plays for foods.
// `controllers/orderController.js` (Task 3.15c, not built yet) is
// expected to be a thin wrapper: validate the request shape, call this,
// return what it returns.
//
// Business rules enforced here (all against freshly-read DB state, never
// trusted from the request body):
//   - every food_id must exist and currently be visible (an order for a
//     hidden food is rejected — docs/DB_SCHEMA.md's 0.7 section: "Hidden
//     foods disappear from the customer menu and cannot be ordered")
//   - every item must belong to the same restaurant (the single-restaurant
//     constraint OrderBuilder, Task 3.11, already enforces client-side —
//     this is the server-side version nothing client-controlled can
//     bypass)
//   - payment_method_id must belong to that same restaurant and still be
//     active (`is_active`, the payment_methods retire mechanism 1.16c's
//     model comment documents)
//   - unit prices are re-read from `foods.price` at submit time, never
//     taken from the request — `subtotal`/`total` are computed here, not
//     accepted as input fields at all
//   - `customer_phone` is run through `normalizePhone` (already built by
//     Task 1.10's `phoneLookup.js`) before being stored — that module's
//     own header flagged this as a dependency on this task: without it, a
//     customer typing their number slightly differently at Track Order
//     time (Task 3.17) than they did here wouldn't find their order
//
// The `orders` row + every `order_items` row are written as one atomic
// transaction, same `withTransaction` shape `createFoodWithVisibility`
// (1.15c) established — all validation reads happen first, on plain
// pooled connections (they're reads of already-committed rows; nothing
// about them needs the same connection as the writes that follow), then
// the transaction opens only for the inserts themselves.
//
// Deliberately NOT this task's job (see docs/TASKS.md's 3.15a-d
// breakdown):
//   - the public route/controller/request-shape validation -> Task 3.15c
//   - integration tests, README/PROJECT_STATUS/TASKS status updates -> 3.15d
//
// Task 7.5a adds the real owner-notification trigger this function's own
// docstring return-value promised nothing about until now: once the
// order + its items are committed, a `notifications` row (type
// `new_order`) is written for the restaurant's owning user — the exact
// "real trigger, not just UI" gap `docs/PROJECT_STATUS.md`'s Phase 7
// note (and docs/TASKS.md's own 7.5 line) named: Phase 5's owner
// notifications (5.20a-c, 5.21) were `OwnerDashboard`-local polling of
// `GET /api/orders`, inferring a "new order" client-side rather than a
// real server-side event. This is that event's one and only source —
// same "the one place a customer-submitted order should ever be created
// from" reasoning this file's own header already gives for order
// creation itself, applied here to the notification that has to follow
// it. See `notifyOwnerOfNewOrder`'s own comment below for why a failure
// here doesn't fail the order itself.

const { withTransaction } = require('../config/db');
const orders = require('../models/orders');
const orderItems = require('../models/orderItems');
const foods = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');
const paymentMethods = require('../models/paymentMethods');
const restaurants = require('../models/restaurants');
const notifications = require('../models/notifications');
const { generateOrderCode } = require('../utils/orderCode');
const { normalizePhone } = require('../utils/phoneLookup');
const { badRequest } = require('../utils/errors');

// `notifications.type` for this trigger — docs/TASKS.md's own 7.5a line
// names this exact string.
const NEW_ORDER_NOTIFICATION_TYPE = 'new_order';

/**
 * Task 7.5a's write step: notify the restaurant's owning user that a new
 * order has just been placed. Called once, right after the order +
 * items transaction above has committed — never from inside it (see
 * `submitOrder`'s own call site below): a customer's order must exist
 * regardless of whether the follow-up notification write succeeds, same
 * "the write that matters more shouldn't roll back because the write
 * that matters less failed" posture `notifyBeforeExpiry.js`'s (7.4b) own
 * per-candidate try/catch takes for its own notification writes, applied
 * here at the call site instead (see the one caller below) since this
 * function itself has no loop of its own to isolate failures within.
 *
 * **Resolves `recipient_id` via `restaurants.findById`**, same as
 * `notifyBeforeExpiry.js`'s own `notifyOrderApproachingExpiry` (7.4b):
 * the order only carries `restaurant_id`, but `notifications.recipient_id`
 * is a `users.id` (`restaurants.owner_id`, per that model's own header
 * comment on why it's a different column than every other owner-scoped
 * table's `restaurant_id`). A restaurant that's vanished (unexpected —
 * restaurants are never deleted anywhere in this codebase) is treated as
 * nothing to notify, not an error — same defensive posture 7.4b's own
 * version already established for the identical lookup.
 *
 * **No dedup guard, unlike 7.4b's own `notifyOrderApproachingExpiry`**:
 * that guard exists because the *same* order can be re-evaluated by
 * every scheduler tick until it either expires or gets accepted, so a
 * naive write would duplicate. An order is only ever submitted once —
 * `submitOrder` is the one and only place a `new_order` notification for
 * a given order is written from — so there is no repeat-write case here
 * to guard against.
 *
 * @param {Object} order - the just-created `orders` row (needs `id`,
 *   `restaurant_id`, `order_code`, `customer_location_text`, `total`)
 * @param {Object[]} items - the just-created `order_items` rows (only
 *   `.length` is used, for the item-count line in the message)
 * @returns {Promise<Object|null>} the created `notifications` row, or
 *   `null` if the restaurant/owner couldn't be resolved
 */
async function notifyOwnerOfNewOrder(order, items) {
  const restaurant = await restaurants.findById(order.restaurant_id);
  if (!restaurant) return null;

  const itemCount = items.length;
  return notifications.create({
    recipient_id: restaurant.owner_id,
    type: NEW_ORDER_NOTIFICATION_TYPE,
    restaurant_id: order.restaurant_id,
    order_id: order.id,
    message:
      `New order ${order.order_code} from ${order.customer_location_text} — ` +
      `${itemCount} item${itemCount === 1 ? '' : 's'} — ${order.total} ETB`,
  });
}

// Oracle's unique-constraint violation error number (ORA-00001), for the
// `uq_orders_order_code` constraint (migration 0008) — same constant/
// check `authController.js` (1.12) uses for `uq_users_email`. Unlike that
// one-shot "pre-check, then a single fallback" case (an email collision
// means a real duplicate signup), an `order_code` collision is just
// random-number bad luck against a 90,000-value space — worth an actual
// retry loop with a fresh code each time, not just one fallback attempt.
const ORA_UNIQUE_CONSTRAINT_VIOLATION = 1;
const MAX_ORDER_CODE_ATTEMPTS = 5;

function isUniqueConstraintViolation(err) {
  return Boolean(err) && err.errorNum === ORA_UNIQUE_CONSTRAINT_VIOLATION;
}

/**
 * Insert the `orders` row on `connection`, retrying with a fresh
 * `generateOrderCode()` value if the DB reports the code as already
 * taken. `fakeDb` (used by this file's own tests) never enforces
 * `uq_orders_order_code` — same standing caveat `authController.test.js`
 * already documents for its own unique-constraint fallback — so the
 * retry path itself is exercised there by mocking `orders.create` to
 * throw a simulated `errorNum: 1` error, not by a real collision.
 */
async function insertOrderWithUniqueCode(connection, orderData) {
  let lastErr;
  for (let attempt = 0; attempt < MAX_ORDER_CODE_ATTEMPTS; attempt += 1) {
    const order_code = generateOrderCode();
    try {
      // eslint-disable-next-line no-await-in-loop
      return await orders.create({ ...orderData, order_code }, { connection });
    } catch (err) {
      if (!isUniqueConstraintViolation(err)) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * @param {Object} data
 * @param {string} data.customer_name
 * @param {string} data.customer_phone - normalized via `normalizePhone`
 *   before being stored
 * @param {string} data.customer_location_text
 * @param {string|null} [data.customer_note]
 * @param {number} data.payment_method_id
 * @param {string} data.payment_screenshot_url
 * @param {{food_id: number, quantity: number}[]} data.items - non-empty;
 *   any other fields on an item (e.g. a client-supplied price) are
 *   ignored — see module header
 * @returns {Promise<{order: Object, items: Object[]}>} the created order
 *   row (full shape, per `models/orders.js`'s `selectColumns` — includes
 *   `order_code`/`status`) and its created `order_items` rows
 */
async function submitOrder(data) {
  const {
    customer_name,
    customer_phone,
    customer_location_text,
    customer_note = null,
    payment_method_id,
    payment_screenshot_url,
    items,
  } = data || {};

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('At least one item is required');
  }

  const normalizedPhone = normalizePhone(customer_phone);

  // --- Validation + pricing phase: re-fetch every food, reject hidden
  // ones, and enforce the single-restaurant constraint as we go, rather
  // than collecting restaurant_ids and checking afterward — the first
  // mismatching item is exactly as invalid as any later one, so there's
  // no reason to keep reading once one's found.
  let restaurantId;
  const lineItems = [];

  for (const item of items) {
    const { food_id, quantity } = item || {};

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw badRequest(`quantity for food_id ${food_id} must be a positive integer`);
    }

    // eslint-disable-next-line no-await-in-loop
    const food = await foods.findById(food_id);
    if (!food) {
      throw badRequest(`food_id ${food_id} does not exist`);
    }

    // eslint-disable-next-line no-await-in-loop
    const visibilityRows = await foodVisibility.findAll({ food_id });
    const isHidden = visibilityRows.length > 0 && Number(visibilityRows[0].is_hidden) === 1;
    if (isHidden) {
      throw badRequest(`"${food.name}" is no longer available`);
    }

    if (restaurantId === undefined) {
      restaurantId = food.restaurant_id;
    } else if (food.restaurant_id !== restaurantId) {
      throw badRequest('All items in an order must be from the same restaurant');
    }

    // NUMBER(10,2) round-tripped through oracledb comes back as a plain
    // JS number already — `Number(...)` here is just defensive against a
    // fake/mock DB layer (this file's own tests) that might hand back a
    // string, same reasoning `foodController.js`'s price validation uses.
    const unitPrice = Number(food.price);
    const lineTotal = Number((unitPrice * quantity).toFixed(2));

    lineItems.push({
      food_id,
      food_name_snapshot: food.name,
      unit_price_snapshot: unitPrice,
      quantity,
      line_total: lineTotal,
    });
  }

  // eslint-disable-next-line no-await-in-loop
  const paymentMethod = await paymentMethods.findById(payment_method_id);
  if (!paymentMethod || paymentMethod.restaurant_id !== restaurantId) {
    throw badRequest('payment_method_id is not valid for this restaurant');
  }
  if (Number(paymentMethod.is_active) !== 1) {
    throw badRequest('That payment method is no longer available');
  }

  const subtotal = Number(
    lineItems.reduce((sum, li) => sum + li.line_total, 0).toFixed(2)
  );
  // No fees/tax modeled yet (docs/DB_SCHEMA.md's `orders.total` note) —
  // kept as a distinct value from `subtotal` for that future use, not
  // collapsed into one column now.
  const total = subtotal;

  // --- Write phase: the order + every order_item, as one transaction.
  const result = await withTransaction(async (connection) => {
    const order = await insertOrderWithUniqueCode(connection, {
      restaurant_id: restaurantId,
      customer_name,
      customer_phone: normalizedPhone,
      customer_location_text,
      customer_note,
      payment_method_id,
      payment_screenshot_url,
      subtotal,
      total,
    });

    const createdItems = [];
    for (const li of lineItems) {
      // eslint-disable-next-line no-await-in-loop
      const created = await orderItems.create({ ...li, order_id: order.id }, { connection });
      createdItems.push(created);
    }

    await connection.commit();
    return { order, items: createdItems };
  });

  // Task 7.5a — fired *after* the transaction above has already
  // committed, on its own separate connection (via `notifications.create`'s
  // plain, no-`{connection}` pooled path), and deliberately never allowed
  // to turn a successful order into a failed request: the customer's
  // order is real the instant the transaction above commits, regardless
  // of whether the follow-up "tell the owner" write succeeds. Logged and
  // swallowed on failure, not rethrown — same "one write's failure
  // doesn't undo a different, already-successful one" reasoning this
  // file's own `insertOrderWithUniqueCode` retry loop applies to a
  // narrower case, applied here at the boundary between two genuinely
  // separate concerns (an order existing vs. an owner being told about
  // it) instead.
  try {
    await notifyOwnerOfNewOrder(result.order, result.items);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[submitOrder] failed to notify owner of new order ${result.order.id} ` +
        `(${result.order.order_code}):`,
      err
    );
  }

  return result;
}

module.exports = submitOrder;
module.exports.notifyOwnerOfNewOrder = notifyOwnerOfNewOrder;
module.exports.NEW_ORDER_NOTIFICATION_TYPE = NEW_ORDER_NOTIFICATION_TYPE;
