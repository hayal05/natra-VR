// notifications — Task 7.4b
//
// crudFactory instance for `notifications` (migration 0010). First
// reader/writer of this table in the codebase — nothing before Task 7.4b
// had a reason to write a `notifications` row (see
// `services/notifyBeforeExpiry.js`'s own header comment for why the
// query side, 7.4a, and the write side, 7.4b, are split the same "query
// vs write vs trigger" way `popularityAggregation.js`/`orderExpiry.js`
// already established).
//
// Task 7.5b adds `ownerColumn: 'recipient_id'` — the "future owner-facing
// 'my notifications' endpoint" this file's own 7.4b comment (just below)
// anticipated has now landed (`GET /api/notifications`/
// `PATCH /api/notifications/:id/read`, `controllers/notificationController.js`).
// Same `restaurants`-style mismatch that model's own header comment
// flags for itself: the column is `recipient_id`, but the value it holds
// is a `users.id`, matched against the logged-in caller's own
// `req.user.id` — not a same-named field the way `foods`'/`categories`'
// `restaurant_id` matches `req.user.restaurant_id` directly. Any caller
// of the `*ForOwner` methods this now exposes (or `ownershipMiddleware`,
// Task 1.4) needs `{ ownerIdField: 'id' }` passed explicitly, same as
// `restaurants.js`'s own usage example.
//
// (Original 7.4b comment, still accurate for the "why recipient_id and
// not restaurant_id" half of the reasoning:) those all scope by
// `restaurant_id` (an owner's *restaurant*), but a notification's real
// "owner" for auth purposes is `recipient_id` (a `users.id` — the
// notified user directly, not a restaurant they happen to own).
// `findAll({ recipient_id })` still works unscoped too, for any caller
// that doesn't need the ownership guarantee (none does today).
//
// `restaurant_id`/`order_id` are both nullable FKs at the DB level
// (migration 0010) — included in `columns` so a caller *can* set them
// (7.4b's own write always does, for an expiry-adjacent notification),
// not because every notification type must carry them.
//
// `is_read` is listed in `columns` (so a future "mark as read" PATCH
// endpoint can `update(id, { is_read: 1 })` through this same instance)
// but 7.4b's own `create()` call never sets it — the DB's own
// `DEFAULT 0` (migration 0010) is exactly "unread", which is correct for
// every notification this codebase creates today.

const crudFactory = require('../utils/crudFactory');

const notifications = crudFactory({
  table: 'notifications',
  columns: ['recipient_id', 'type', 'restaurant_id', 'order_id', 'message', 'is_read'],
  ownerColumn: 'recipient_id',
});

module.exports = notifications;
