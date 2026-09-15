// notificationController — Task 7.5b
//
// The "real endpoint" half of Task 7.5's own name: `services/submitOrder.js`
// (Task 7.5a) is the one writer of a `notifications` row; this is the
// first reader/updater anywhere in the codebase. Two routes
// (`notification.routes.js`):
//   - `GET /api/notifications` — the caller's own notifications,
//     newest-first, paginated the same way every other list endpoint in
//     this codebase is (`utils/paginate.js`, Task 1.9) — nothing about a
//     notification feed is different enough to skip that.
//   - `PATCH /api/notifications/:id/read` — marks one notification read.
//     `docs/TASKS.md`'s own 7.5b line offers either a single-id mark-read
//     or a mark-all action; a single `:id` was chosen since it composes
//     cleanly with the same `ownershipMiddleware` (Task 1.4) every other
//     single-resource write in this codebase already goes through — a
//     mark-all endpoint can be added later on top of the same model
//     without this one needing to change.
//
// Both routes are scoped to `req.user.id` (`notifications.recipient_id`,
// per that model's own Task 7.5b header comment on why the ownerIdField
// override is `'id'`, not `'recipient_id'`) — deliberately no
// `attachOwnerRestaurant` anywhere on this router, unlike most
// owner-authenticated routes in this codebase: a notification's
// recipient is a `users.id` directly, not scoped by restaurant, so an
// admin's own future notifications (nothing writes one for an admin
// today, but nothing here assumes only owners ever will) would work
// through this same pair unchanged.

const { paginate } = require('../utils/paginate');
const notifications = require('../models/notifications');

// GET /api/notifications — Task 7.5b
//
// `orderBy: 'id', orderDir: 'DESC'` — same reasoning every other
// newest-first list in this codebase already gives for using the
// strictly-increasing surrogate `id` instead of `created_at`
// (`created_at` isn't in `models/notifications.js`'s settable `columns`
// list, so it isn't in crudFactory's `orderBy` allow-list either — see
// that model's own header comment on why `created_at`/`updated_at` are
// never caller-settable anywhere in this codebase).
async function list(req, res, next) {
  try {
    const { rows, meta } = await paginate(
      notifications,
      { recipient_id: req.user.id },
      req.query,
      { orderBy: 'id', orderDir: 'DESC' }
    );
    res.status(200).json({ notifications: rows, meta });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read — Task 7.5b
//
// `notification.routes.js`'s own `ownershipMiddleware(notifications, {
// ownerIdField: 'id' })` has already fetched + confirmed the row as
// `req.resource` before this handler runs (same "don't re-fetch what a
// prior middleware already fetched" shape every other owned-resource
// write in this codebase follows) — this just flips `is_read` via
// `updateForOwner`, same defense-in-depth reasoning `foodController.js`'s
// `update`/`remove` already document for calling the *ForOwner variant
// even though ownership was already checked one layer up.
async function markRead(req, res, next) {
  try {
    const notification = await notifications.updateForOwner(
      req.resource.id,
      req.user.id,
      { is_read: 1 }
    );
    res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead };
