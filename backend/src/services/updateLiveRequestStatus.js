// updateLiveRequestStatus — Task 6.7a (reject transition) + Task 6.7b
// (approve transition, split into 6.7b-1/6.7b-2, see docs/TASKS.md):
// 6.7b-1 built `applyApproveTransaction` (the two-table write) on its
// own below; 6.7b-2 wires it into `onTransition` and exports
// `approveLiveRequest`, completing Task 6.7's backend half (6.7c's
// route/controller is next).
//
// Wires `statusTransition` (Task 1.7) to the `live_requests` table — the
// second real caller of that generic factory, exactly as its own header
// comment anticipated ("Phase 6's Approve/Reject — Task 6.7"). The first
// caller, `updateOrderStatus.js` (5.14a), is the closest precedent
// reject follows: same "bypass crudFactory with a bare `UPDATE` via
// `withConnection`, then re-read through `findById`" shape, for the same
// reason — `models/liveRequests.js`'s own header comment deliberately
// excludes `status`/`reviewed_by`/`reviewed_at` from its settable
// `columns` allow-list, specifically so a transition can only ever
// happen through this kind of guarded path. Approve needed a second,
// genuinely different write shape instead (see `applyApproveTransaction`
// below) — that's the whole reason Task 6.7 was split into 6.7a-6.7d in
// the first place (see `docs/TASKS.md`'s note on the split).
//
// Transitions map covers both outgoing values from `pending` even though
// 6.7a only exercised `rejected` — same "list every known status even
// though this task only drives some of the transitions" precedent
// `updateOrderStatus.js`'s own map (which lists `Accepted -> Completed`,
// Task 5.15's job, alongside 5.14a's own `New -> Accepted/Rejected`)
// already sets.
const { withConnection, withTransaction } = require('../config/db');
const liveRequests = require('../models/liveRequests');
const statusTransition = require('../utils/statusTransition');

const liveRequestStatus = statusTransition({
  transitions: {
    pending: ['approved', 'rejected'],
    approved: [],
    rejected: [],
  },
  timestampField: 'reviewed_at',
  onTransition: async ({ current, to, timestamp, context }) => {
    if (to === 'rejected') {
      await withConnection(async (connection) => {
        const result = await connection.execute(
          'UPDATE live_requests SET status = :status, reviewed_by = :reviewedBy, reviewed_at = :reviewedAt WHERE id = :id',
          { status: to, reviewedBy: context?.reviewerId, reviewedAt: timestamp, id: current.id }
        );
        await connection.commit();
        return result;
      });
      return liveRequests.findById(current.id);
    }

    // to === 'approved' — Task 6.7b-2: the two-table write 6.7b-1 built
    // and hand-verified in isolation, now wired in as `onTransition`'s
    // real approve path (replacing what used to be a loud
    // not-yet-implemented throw here). `current.restaurant_id` is
    // already on the row `liveRequestStatus.transition()` was called
    // with (`models/liveRequests.js`'s `selectColumns` always includes
    // it) — no second fetch needed to find the parent restaurant.
    await applyApproveTransaction(current.id, current.restaurant_id, {
      reviewerId: context?.reviewerId,
      timestamp,
    });
    return liveRequests.findById(current.id);
  },
});

/**
 * Reject `liveRequest` (an already-fetched `live_requests` row — the
 * caller, 6.7c's future controller, is responsible for fetching it via
 * 6.6c's `getLiveRequestForAdmin`, same "controller fetches, service
 * transitions" split `orderController.updateStatus`/`updateOrderStatus`
 * already establish). `reviewerId` is the admin `users.id` making the
 * call, written to `reviewed_by`.
 *
 * Throws the same 409 `assertCanTransition` throws (via `../utils/errors`'
 * `conflict`) if `liveRequest.status -> 'rejected'` isn't allowed — e.g.
 * re-rejecting an already-`approved`/`rejected` request. Returns the
 * updated row.
 */
async function rejectLiveRequest(liveRequest, reviewerId) {
  return liveRequestStatus.transition(liveRequest, 'rejected', { reviewerId });
}

// applyApproveTransaction — Task 6.7b-1
//
// The two-table write approve needs and 6.7a's single-table reject write
// doesn't: `live_requests.status -> 'approved'` AND the parent
// `restaurants.live_status -> 'approved'` (docs/DB_SCHEMA.md's own
// `live_requests` section: "Approving a live_requests row is the only
// thing that sets restaurants.live_status = 'approved' (service-layer
// transaction, both rows updated together)"). Wired into `onTransition`
// above as of Task 6.7b-2 — kept as its own named function rather than
// inlined into that arrow function, same "the transactional write is
// worth testing in isolation from statusTransition's own validation"
// reasoning that made it easy for 6.7b-1 to test this function directly,
// still true now that it has a real caller.
//
// Uses `withTransaction` (Task 1.15c), not `withConnection` — the reject
// write above only ever touches one table so `withConnection`'s
// borrow-one-statement-and-commit shape is enough, but this write needs
// both UPDATEs to land or neither to, on one connection/session, the
// same reasoning `createFoodWithVisibility.js` (1.15c) already
// established for its own food + food_visibility pair. Both UPDATEs are
// raw `connection.execute` calls, not `crudFactory`'s own `update()`/
// `updateForOwner()` — those always borrow their own connection and
// auto-commit internally (see `crudFactory.js`'s own `update` header),
// so they can't participate in a transaction a caller already has open;
// `restaurants.live_status` being in that model's settable `columns`
// doesn't help here for that reason, on top of `live_requests.status`
// already being excluded from its own model's `columns` for the same
// reason 6.7a's write is raw SQL.
//
// Each UPDATE's `rowsAffected` is checked and a plain `Error` thrown if
// either is 0 (live request or restaurant not found) — not a silent
// half-write. Throwing inside `work` is what makes `withTransaction`
// roll back the other UPDATE too, so e.g. a `restaurant_id` that's
// somehow stale/deleted can never leave `live_requests.status` flipped
// to `'approved'` with no matching `restaurants.live_status` change.
//
// @param {number} liveRequestId - the `live_requests.id` being approved.
// @param {number} restaurantId - the parent `restaurants.id`
//   (`live_requests.restaurant_id`).
// @param {Object} fields
// @param {number} [fields.reviewerId] - written to `reviewed_by`, same
//   `context.reviewerId` convention `rejectLiveRequest` above uses.
// @param {Date} fields.timestamp - written to `reviewed_at`. Required
//   (not defaulted to `new Date()` here) so this function stays a pure
//   function of its inputs for testing — `onTransition` above is what
//   builds the timestamp it passes in.
// @returns {Promise<void>} nothing — callers (the `onTransition` branch
//   above, and `approveLiveRequest` below through it) re-read the
//   `live_requests` row via `liveRequests.findById` themselves, same
//   "write, then re-select" shape the reject path and
//   `updateOrderStatus.js` (5.14a) both use.
async function applyApproveTransaction(liveRequestId, restaurantId, { reviewerId, timestamp } = {}) {
  return withTransaction(async (connection) => {
    const liveRequestResult = await connection.execute(
      'UPDATE live_requests SET status = :status, reviewed_by = :reviewedBy, reviewed_at = :reviewedAt WHERE id = :id',
      { status: 'approved', reviewedBy: reviewerId, reviewedAt: timestamp, id: liveRequestId }
    );
    if (!liveRequestResult.rowsAffected) {
      throw new Error(`applyApproveTransaction: no live_requests row found for id ${liveRequestId}`);
    }

    const restaurantResult = await connection.execute(
      'UPDATE restaurants SET live_status = :liveStatus WHERE id = :id',
      { liveStatus: 'approved', id: restaurantId }
    );
    if (!restaurantResult.rowsAffected) {
      throw new Error(`applyApproveTransaction: no restaurants row found for id ${restaurantId}`);
    }

    await connection.commit();
  });
}

/**
 * Approve `liveRequest` (an already-fetched `live_requests` row — same
 * "controller fetches, service transitions" split `rejectLiveRequest`
 * above documents). `reviewerId` is the admin `users.id` making the
 * call, written to `reviewed_by`. Flips the parent restaurant's
 * `live_status` to `'approved'` in the same DB transaction as the
 * `live_requests` write (`applyApproveTransaction`, Task 6.7b-1) —
 * `docs/TASKS.md`'s own 6.7 wording: "approve → restaurant instantly
 * Live".
 *
 * Throws the same 409 `assertCanTransition` throws (via `../utils/errors`'
 * `conflict`) if `liveRequest.status -> 'approved'` isn't allowed — e.g.
 * approving an already-`rejected`/`approved` request. Returns the
 * updated row.
 */
async function approveLiveRequest(liveRequest, reviewerId) {
  return liveRequestStatus.transition(liveRequest, 'approved', { reviewerId });
}

module.exports = { rejectLiveRequest, approveLiveRequest };
// Exported for tests (and any future extension) to inspect
// `knownStatuses`/`getAllowedTransitions` without constructing a second,
// differently-configured instance of the same table's rules.
module.exports.liveRequestStatus = liveRequestStatus;
// Exported for 6.7b-1's own direct tests of the transactional write in
// isolation from `statusTransition`'s validation — not part of this
// module's stable public API the way `rejectLiveRequest`/
// `approveLiveRequest` are (no route/controller calls it directly; a
// caller always goes through `liveRequestStatus.transition` or one of
// those two functions).
module.exports.applyApproveTransaction = applyApproveTransaction;
