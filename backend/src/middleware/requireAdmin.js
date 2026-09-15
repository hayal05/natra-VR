// requireAdmin — Task 6.3
//
// The first admin-only route this codebase has ever needed
// (`GET /api/admin/dashboard-summary`, this same task) — every prior
// authenticated route either had no role restriction (`GET /api/auth/me`,
// `PATCH /api/auth/me`) or was scoped to `owner` via `attachOwnerRestaurant`
// (Task 1.15a), which — per that file's own header comment — deliberately
// no-ops for any non-owner role rather than asserting one, leaving
// "should a non-owner be allowed here at all" as an open per-route
// question it explicitly does not answer. This is the first route to
// actually need "yes, but only if role is X" the other direction.
//
// Mounted *after* `authMiddleware` on any route that needs it, same
// composition `attachOwnerRestaurant` already establishes
// (`router.get('/dashboard-summary', authMiddleware, requireAdmin, ...)`
// in `admin.routes.js`) — this module assumes `req.user` already exists
// and trusts it, the same assumption `attachOwnerRestaurant` makes.
//
// A non-admin (currently only `owner`) gets a 403 `Forbidden` — the same
// status and message every other role/ownership rejection in this
// codebase already uses (`attachOwnerRestaurant.js`, `ownershipMiddleware.js`,
// and every owner-scoped controller's own "authenticated, but nothing to
// scope by" branch), not a 401 — the caller genuinely authenticated
// successfully; they're just the wrong role for this route. No
// `forbidden()` helper exists in `utils/errors.js` (only
// `badRequest`/`unauthorized`/`notFound`/`conflict`) — every existing 403
// in this codebase throws `new ApiError(403, 'Forbidden')` directly
// rather than adding one, so this module follows that same convention
// rather than introducing a new helper for its one caller.

const { ApiError } = require('../utils/errors');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden'));
  }
  return next();
}

module.exports = { requireAdmin };
