// submitLiveRequest — Task 4.5b
//
// The actual business logic behind "an owner submits a Request Live
// wizard" — the one place a `live_requests` row (and its
// `registration_payments` companion) should ever be created from, same
// role `createFoodWithVisibility` (1.15c) plays for foods and
// `submitOrder` (3.15b) plays for orders. `controllers/
// liveRequestController.js` (Task 4.5c, not built yet) is expected to be
// a thin wrapper: validate the request shape, call this, return what it
// returns.
//
// Business rules enforced here (all against freshly-read DB state, never
// trusted from the request body):
//   - `amount` is never accepted as an input field at all — it's read
//     fresh from `admin_settings.registration_fee_amount` (Task 4.3's
//     model) at submission time, same "never trust the client's total"
//     reasoning `submitOrder.js` already applies to `subtotal`/`total`.
//     A fee change an admin makes today shouldn't retroactively be
//     applied to a request an owner submitted under yesterday's fee (and
//     vice versa) — reading it at submit time, not at review time, is
//     exactly why `registration_payments` is its own immutable table
//     per docs/DB_SCHEMA.md's 0.10 section, not just a join.
//   - a restaurant with an already-pending request is rejected outright,
//     rather than accepted and left for an admin to sort out two
//     open requests for the same restaurant. Not explicitly spelled out
//     in docs/DB_SCHEMA.md, but implied by its own phrasing that a
//     restaurant has "multiple requests over time (e.g. rejected ->
//     owner reapplies)" — reapplying is what happens *after* a decision,
//     not while one is still outstanding. Flagged here as a stated
//     assumption, not a silent one.
//   - a missing `admin_settings` row (id=1) is a config/data bug, not a
//     bad request from an owner — migration 0010 seeds this row itself,
//     so its absence means something is wrong with the database, not
//     with this submission. Thrown as a plain `Error` (surfaces as the
//     central handler's generic 500), not an `ApiError`, same
//     "a config bug should surface loudly, not get disguised as a normal
//     4xx" reasoning `verifyPassword` (1.11) already applies to a
//     missing/malformed stored password hash.
//
// The `live_requests` row + its `registration_payments` row are written
// as one atomic transaction, same `withTransaction` shape
// `createFoodWithVisibility` (1.15c) established — the two validation
// reads above happen first, on plain pooled connections (reads of
// already-committed rows; nothing about them needs the same connection
// as the writes that follow), then the transaction opens only for the
// inserts themselves.
//
// Deliberately NOT this task's job (see docs/TASKS.md's 4.5a-d
// breakdown):
//   - the owner-authenticated route/controller/request-shape validation
//     -> Task 4.5c
//   - integration tests, wiring RequestLive.jsx's placeholder, README/
//     PROJECT_STATUS/TASKS status updates -> 4.5d

const { withTransaction } = require('../config/db');
const liveRequests = require('../models/liveRequests');
const registrationPayments = require('../models/registrationPayments');
const adminSettings = require('../models/adminSettings');
const { badRequest } = require('../utils/errors');

// admin_settings is a fixed-id singleton (migration 0010's
// ck_admin_settings_id) — same constant `adminSettingsController.js`
// (Task 4.3) already uses for its own findById(1) read.
const ADMIN_SETTINGS_ID = 1;

/**
 * @param {Object} data
 * @param {number} data.restaurant_id - the submitting owner's own
 *   restaurant. Expected to come from `req.user.restaurant_id`/
 *   `req.restaurant` (Task 1.15a's `attachOwnerRestaurant`), never from
 *   the request body — same "always the authenticated owner's own
 *   restaurant, never the body's" rule `foodController.js` (1.15e)
 *   already enforces for `foods.restaurant_id`.
 * @param {string} data.payment_screenshot_url
 * @returns {Promise<{liveRequest: Object, payment: Object}>} the created
 *   `live_requests` row (full shape, per `models/liveRequests.js`'s
 *   `selectColumns` — includes `status: 'pending'`) and its created
 *   `registration_payments` row.
 */
async function submitLiveRequest(data) {
  const { restaurant_id, user_id, payment_screenshot_url } = data || {};

  if (!Number.isInteger(restaurant_id) || restaurant_id < 1) {
    throw badRequest('restaurant_id is required');
  }
  if (!Number.isInteger(user_id) || user_id < 1) {
    throw badRequest('user_id is required');
  }
  if (typeof payment_screenshot_url !== 'string' || payment_screenshot_url.trim() === '') {
    throw badRequest('payment_screenshot_url is required');
  }

  // `status` isn't a filterable/settable column on this model (Task
  // 4.5a's mass-assignment guard) — so "does this restaurant already
  // have a pending request" is checked by reading every request for the
  // restaurant and filtering in JS, not via a findAll({status: ...})
  // call crudFactory itself wouldn't allow.
  const existingRequests = await liveRequests.findAllForOwner(restaurant_id);
  const hasPendingRequest = existingRequests.some((req) => req.status === 'pending');
  if (hasPendingRequest) {
    throw badRequest('This restaurant already has a pending Live request');
  }

  const settings = await adminSettings.findById(ADMIN_SETTINGS_ID);
  if (!settings) {
    throw new Error(
      'admin_settings row (id=1) is missing — cannot determine the registration fee'
    );
  }
  const amount = Number(settings.registration_fee_amount);

  return withTransaction(async (connection) => {
    const liveRequest = await liveRequests.create({ restaurant_id, user_id }, { connection });
    const payment = await registrationPayments.create(
      { live_request_id: liveRequest.id, amount, payment_screenshot_url },
      { connection }
    );
    await connection.commit();
    return { liveRequest, payment };
  });
}

module.exports = submitLiveRequest;
