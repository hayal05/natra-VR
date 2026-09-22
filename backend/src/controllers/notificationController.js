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
const { badRequest } = require('../utils/errors');
const notifications = require('../models/notifications');

// Task 10.3a-ii — an optional `is_read` equality filter, added as a real
// prerequisite for the owner-dashboard notification-count indicator
// (`DashboardHeader`, Task 10.0b-iv/frontend `fetchUnreadNotificationCount`),
// the same "small, scoped backend gap closed as part of the frontend task
// that needed it" shape `docs/PROJECT_STATUS.md`'s own Task 8.4c-ii entry
// already took for a thumbnail-URL persistence gap. Before this, `list`
// below only ever accepted `req.query`'s pagination params (`page`/
// `limit`/`offset`) — `is_read` wasn't filterable at all, so there was no
// way to ask this endpoint for "how many of my notifications are unread"
// without fetching every row and counting client-side, which `paginate`'s
// own page-size cap (`utils/paginate.js`'s `MAX_LIMIT`) makes unreliable
// for a real total. `is_read` is already in `models/notifications.js`'s
// own `columns` allow-list (so `crudFactory`'s `_buildFilterWhere` already
// accepts it as an equality filter with no model change needed) — this
// controller just needed to actually forward it.
//
// Validated the same "exact-match filter parsed and rejected with a 400
// on anything else, not silently ignored" way `adminOrdersList.js`'s own
// `parseStatusFilter`/`parseRestaurantIdFilter` already do for their own
// exact-match filters: the DB's own `ck_notifications_is_read` constraint
// (migration 0010) only ever allows `0`/`1`, so a query string of anything
// else (`is_read=yes`, `is_read=2`) can never match a real row and is
// almost certainly a caller bug worth a 400, not a filter that silently
// returns zero rows every time.
function parseIsReadFilter(raw) {
  if (raw === undefined || raw === '') return undefined;
  if (raw !== '0' && raw !== '1') {
    throw badRequest('"is_read" must be 0 or 1');
  }
  return Number(raw);
}

// GET /api/notifications — Task 7.5b, `is_read` filter added Task 10.3a-ii
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
    const isRead = parseIsReadFilter(req.query.is_read);
    const filters = { recipient_id: req.user.id };
    if (isRead !== undefined) filters.is_read = isRead;

    const { rows, meta } = await paginate(notifications, filters, req.query, {
      orderBy: 'id',
      orderDir: 'DESC',
    });
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
