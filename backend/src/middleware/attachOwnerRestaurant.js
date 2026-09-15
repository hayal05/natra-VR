// attachOwnerRestaurant — Task 1.15a
//
// Closes the gap `authMiddleware` (1.14d/1.14e's comments) and
// `auth.routes.js`'s header both flag repeatedly: a `users` row has no
// `restaurant_id` column (`restaurants.owner_id` points AT `users.id`,
// not the reverse — docs/DB_SCHEMA.md), but `ownershipMiddleware`
// (Task 1.4) defaults to reading `req.user[ownerColumn]` —
// `req.user.restaurant_id` — for any owner-scoped table (foods,
// categories, service_areas, payment_methods, opening_hours all scope
// by `restaurant_id`, per 0.7 onward).
//
// Design chosen here (open question left by 1.14d/1.15's own TASKS.md
// entry): a second, small middleware layered *after* authMiddleware,
// not an extension of authMiddleware itself. Reasons:
//   - authMiddleware answers "who is this" for every protected route,
//     including ones with no restaurant concept at all (GET /api/auth/me
//     is the only route using it so far, and stays that way). Folding a
//     restaurants lookup into it would mean every protected route pays
//     for a query it doesn't need, and would give authMiddleware two
//     jobs instead of one.
//   - Keeping it separate means it composes the same way
//     `ownershipMiddleware` already does: mounted only on the specific
//     routes that need it, e.g.
//       router.post('/', authMiddleware, attachOwnerRestaurant, ...)
//     admin-only routes never mount it at all.
//
// Deliberately NOT this module's job:
//   - authentication itself (that's still authMiddleware, mounted
//     before this in the chain — this module assumes req.user already
//     exists and trusts it)
//   - the actual per-resource ownership check (still
//     ownershipMiddleware, Task 1.4, mounted after this one)
//   - deciding whether a non-owner role may use an owner-scoped route
//     at all — same "per-route/role-based-access concern layered on
//     top" ownershipMiddleware's own header already calls out; this
//     middleware just no-ops for a non-owner and lets the
//     ownershipMiddleware chained after it 403 on the missing
//     `restaurant_id`, rather than duplicating a role check here too

const { ApiError } = require('../utils/errors');
const restaurants = require('../models/restaurants');

/**
 * attachOwnerRestaurant(req, res, next)
 *
 * For an authenticated `owner` (`req.user.role === 'owner'`), looks up
 * their restaurant by `owner_id` and attaches:
 *   - `req.user.restaurant_id` — what `ownershipMiddleware` reads by
 *     default for every `restaurant_id`-scoped crudFactory instance
 *   - `req.restaurant` — the full row, so a route handler that also
 *     needs e.g. `live_status` doesn't have to re-fetch it
 *
 * For any other role (currently just `admin`), does nothing and calls
 * `next()` immediately — no restaurant lookup attempted, `req.user`
 * left exactly as authMiddleware set it. This is a deliberate no-op,
 * not an error: whether an admin is *allowed* on the route this is
 * mounted on is a per-route decision (see header comment above), and
 * `ownershipMiddleware` chained after this will already reject with 403
 * once it finds no `restaurant_id` to scope by — duplicating that check
 * here would just be two places that can disagree.
 *
 * An authenticated owner with NO restaurant row yet (hasn't completed
 * Phase 4's registration/Live-request flow) also gets a 403, via the
 * same reasoning `ownershipMiddleware` already applies to a missing
 * owner id: who they are isn't in question, what they can access is —
 * there's simply nothing yet for an owner-scoped route to scope to.
 *
 * Assumes one restaurant per owner (current NATRA scope — see
 * docs/DB_SCHEMA.md's "owned by exactly one `users` row", which
 * constrains restaurant -> owner, not the reverse; nothing in the
 * schema itself stops one owner having multiple restaurants). If that
 * assumption changes, this is the one place that needs to grow a
 * restaurant-selection step instead of always taking the first row.
 */
async function attachOwnerRestaurant(req, res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (req.user.role !== 'owner') {
      next();
      return;
    }

    const owned = await restaurants.findAllForOwner(req.user.id);
    const restaurant = owned[0];

    if (!restaurant) {
      throw new ApiError(403, 'Forbidden');
    }

    req.user.restaurant_id = restaurant.id;
    req.restaurant = restaurant;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachOwnerRestaurant;
