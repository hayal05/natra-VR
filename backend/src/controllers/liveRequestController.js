// liveRequestController — Task 4.5c
//
// Route handler for POST /api/live-requests. Deliberately thin, same
// split `orderController.js` (3.15c) / `foodController.js` (1.15e)
// established: this layer's only job is "is the request body even
// shaped right" (via zod, below) — every real business rule (the
// already-pending check, sourcing the fee from `admin_settings`, the
// live_requests + registration_payments transaction) already lives in
// `services/submitLiveRequest.js` (Task 4.5b) and isn't repeated here.
//
// Owner-authenticated, unlike the customer order flow's public route —
// mounted (in `routes/liveRequest.routes.js`) behind `authMiddleware`
// (1.14) → `attachOwnerRestaurant` (1.15a), the same chain
// `food.routes.js`'s collection routes use. `restaurant_id` comes from
// `req.user.restaurant_id` (set by `attachOwnerRestaurant`), never from
// the request body — same "always the authenticated owner's own
// restaurant, never the body's" rule `foodController.js` already
// enforces for `foods.restaurant_id`.
//
// `createLiveRequestSchema` is `.strict()` and accepts exactly one
// field, `payment_screenshot_url` — same reasoning `createOrderSchema`
// (3.15c) already documents for its own `.strict()`: a client-supplied
// `restaurant_id`/`amount`/`status` is rejected outright with a 400
// rather than silently dropped, making the "the fee is never a request
// field" rule from `submitLiveRequest.js` (4.5b) a visible rejection
// here too, not just something that happens to be true because the
// service never reads that key.
//
// Length limit below comes straight from `docs/DB_SCHEMA.md`'s 0.10
// section (`registration_payments.payment_screenshot_url
// VARCHAR2(500)`), same "fail here with a clear message rather than at
// the DB layer" reasoning every other controller's schema already uses.
//
// Deliberately NOT this task's job (see docs/TASKS.md's 4.5a-d
// breakdown):
//   - route-level/integration tests, wiring RequestLive.jsx's
//     placeholder, README/PROJECT_STATUS/TASKS status updates -> 4.5d

const { z } = require('zod');

const submitLiveRequest = require('../services/submitLiveRequest');
const liveRequests = require('../models/liveRequests');
const { badRequest, ApiError } = require('../utils/errors');

const PAYMENT_SCREENSHOT_URL_MAX_LENGTH = 500;

// Same `image_url`/`payment_screenshot_url` pattern `foodController.js`
// (1.15e) / `orderController.js` (3.15c) already use — this field is
// populated from `uploadToObjectStorage`'s (Task 1.5/1.6) return value in
// practice (via the existing public
// `POST /api/uploads/payment-screenshot`, same endpoint Task 4.4's
// wizard step already uses), but this endpoint takes it as a plain
// string, not a file upload of its own.
const paymentScreenshotUrlSchema = z
  .string()
  .trim()
  .min(1, 'payment_screenshot_url is required')
  .max(
    PAYMENT_SCREENSHOT_URL_MAX_LENGTH,
    `payment_screenshot_url must be at most ${PAYMENT_SCREENSHOT_URL_MAX_LENGTH} characters`
  )
  .url('payment_screenshot_url must be a valid URL');

const createLiveRequestSchema = z
  .object({
    payment_screenshot_url: paymentScreenshotUrlSchema,
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

// POST /api/live-requests — validates the request shape, then hands off
// entirely to `submitLiveRequest` (4.5b) for every actual business rule.
// Returns 201 with the created `live_requests` row (including its
// `status: 'pending'`) and its `registration_payments` row, for Task
// 4.6's pending-state screen to read back.
async function create(req, res, next) {
  try {
    const { payment_screenshot_url } = parseOrThrow(createLiveRequestSchema, req.body);
    const { liveRequest, payment } = await submitLiveRequest({
      restaurant_id: req.user.restaurant_id,
      payment_screenshot_url,
    });
    res.status(201).json({ live_request: liveRequest, registration_payment: payment });
  } catch (err) {
    next(err);
  }
}

// Same "who is this scoped to" guard `foodController.js`'s own
// `requireRestaurantScope` (1.15e) already established — reached only
// when `attachOwnerRestaurant` no-op'd (a non-owner role, e.g. admin)
// and left `req.user.restaurant_id` unset, since an owner with none at
// all was already 403'd by that middleware itself before this handler
// ever runs.
function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

// GET /api/live-requests/latest — Task 4.6. Returns the caller's own
// restaurant's single most recent live_requests row (by `id DESC`, this
// table's own auto-incrementing insert order — same "no separate
// updated_at to sort by" reasoning `models/liveRequests.js` already
// gives for omitting that column), or `{ live_request: null }` if the
// owner hasn't submitted one yet — a real, expected state (right after
// `attachOwnerRestaurant`'s own restaurant-creation gap is resolved, an
// owner could reach this screen with a restaurant but no request at
// all), not an error.
//
// `findAllForOwner(..., { limit: 1 })` rather than a bespoke "find one"
// query — `models/liveRequests.js`'s own header comment already names
// exactly this read ("Task 4.6's pending-state screen... reading the
// owner's own restaurant's latest request") as the reason
// `ownerColumn: 'restaurant_id'` is set on this model at all, despite
// `POST /` (4.5c) never itself needing the `*ForOwner` helpers.
async function getLatest(req, res, next) {
  try {
    requireRestaurantScope(req);
    const [latest = null] = await liveRequests.findAllForOwner(
      req.user.restaurant_id,
      {},
      { orderBy: 'id', orderDir: 'DESC', limit: 1 }
    );
    res.status(200).json({ live_request: latest });
  } catch (err) {
    next(err);
  }
}

// Schema exported alongside the handler so 4.5d's tests can exercise it
// directly, same convention `foodController.js`/`orderController.js`
// already established.
module.exports = { create, getLatest, createLiveRequestSchema };
