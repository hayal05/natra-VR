// updateOrderStatus — Task 5.14a
//
// Wires `statusTransition` (Task 1.7) to the `orders` table — the first
// real caller of that generic factory, exactly as its own header comment
// anticipated ("Phase 5's Accept/Reject/Complete — Tasks 5.14/5.15").
// `docs/DB_SCHEMA.md`'s 0.8 section is the source of truth for the
// transitions map: `status VARCHAR2(10) CHECK IN ('New','Accepted',
// 'Completed','Rejected','Expired')` (the `'Expired'` value added by
// migration 0011, Task 7.3b), and `orderController.js`'s comment on
// `create` already establishes every order starts at `'New'`.
//
// **Why this can't just call `orders.updateForOwner(id, restaurantId,
// { status, status_updated_at })`** — `models/orders.js`'s own header
// comment deliberately excludes `status`/`status_updated_at` from its
// settable `columns` allow-list, specifically so a transition can only
// ever happen through this kind of guarded path, not a bare
// crudFactory `update()` call that skips `statusTransition`'s
// `assertCanTransition` check entirely. `crudFactory`'s `pickAllowed`
// would silently drop both keys (they're not in `columns`), leaving
// nothing to update and throwing "No valid fields provided" — so this
// module reaches past crudFactory and writes those two columns with its
// own bare `UPDATE` via `withConnection` (the same connection-borrowing
// helper crudFactory itself uses internally), then re-reads the row
// through `orders.findById` so the caller gets back the same full
// `selectColumns` shape every other order-returning endpoint in this
// codebase already returns.
//
// Transitions map covers all statuses (including the terminal
// `Completed`/`Rejected`, listed with an empty array per
// `statusTransition`'s own doc comment on `knownStatuses`) even though
// this task (5.14) only ever drives `New -> Accepted`/`New -> Rejected`
// — `Accepted -> Completed` is Task 5.15's job, wired through this exact
// same instance rather than a second one, since it's the same table and
// the same set of rules, just exercised from a different caller later.
//
// `New -> Expired` — Task 7.3b, implementing 7.3a's design decision
// (docs/PROJECT_STATUS.md's 7.3a entry): a genuinely new terminal
// status for a timed-out pending order, not `Rejected` + a flag.
// `Expired` itself is listed with an empty array, same as
// `Completed`/`Rejected` — terminal, no further transition out of it.
// This instance is the *only* place that ever calls
// `orderStatus.transition(order, 'Expired')` — 7.3c/7.3e's future
// scheduler is the sole intended caller for that specific target;
// `orderController.js`'s owner-facing `updateStatus` endpoint validates
// its request body against `z.enum(['Accepted', 'Rejected', 'Completed'])`
// (deliberately, per 7.3a's own log entry — never `'Expired'`), so an
// owner has no route that can reach this transition directly even though
// this shared instance's map allows it structurally. That split (this
// map says what's *possible*; the controller's schema says what a given
// caller is *allowed* to request) is the same separation of concerns
// this file's own top-of-file comment already draws between
// `statusTransition` and auth/ownership — just applied to "which caller"
// instead of "which user".
const { withConnection } = require('../config/db');
const orders = require('../models/orders');
const statusTransition = require('../utils/statusTransition');

const orderStatus = statusTransition({
  transitions: {
    New: ['Accepted', 'Rejected', 'Expired'],
    Accepted: ['Completed'],
    Completed: [],
    Rejected: [],
    Expired: [],
  },
  timestampField: 'status_updated_at',
  onTransition: async ({ current, to, timestamp }) => {
    await withConnection(async (connection) => {
      const result = await connection.execute(
        'UPDATE orders SET status = :status, status_updated_at = :statusUpdatedAt WHERE id = :id',
        { status: to, statusUpdatedAt: timestamp, id: current.id }
      );
      await connection.commit();
      return result;
    });
    return orders.findById(current.id);
  },
});

/**
 * Transition `order` (an already-fetched, already-ownership-checked
 * `orders` row — see `orderController.updateStatus`'s own comment on why
 * this never re-fetches or re-checks ownership itself) to `to`.
 *
 * Throws the same 409 `assertCanTransition` throws (via `../utils/errors`'
 * `conflict`) if `order.status -> to` isn't an allowed move — e.g.
 * re-accepting an already-`Accepted` order, or rejecting a `Completed`
 * one. Returns the updated row.
 */
async function updateOrderStatus(order, to) {
  return orderStatus.transition(order, to);
}

module.exports = updateOrderStatus;
// Exported for Task 5.15's own future controller (or tests here) to
// inspect `knownStatuses`/`getAllowedTransitions` without constructing a
// second, differently-configured instance of the same table's rules.
module.exports.orderStatus = orderStatus;
