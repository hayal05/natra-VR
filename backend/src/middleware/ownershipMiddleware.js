// ownershipMiddleware — Task 1.4
//
// An Express middleware *factory*: call it once per route with a
// crudFactory instance (configured with an `ownerColumn`, Task 1.2) to get
// back a middleware function. That middleware reads the resource id from
// the route params, checks `req.user` owns it via the crud instance's
// `getOrThrowForOwner`, and — if so — attaches the already-fetched row to
// the request (`req.resource` by default) so the route handler doesn't
// have to fetch it again.
//
// This module doesn't know what `req.user` looks like — auth middleware
// that actually sets `req.user` doesn't exist yet (Task 1.14 comes after
// this one in the roadmap on purpose: ownership-checking logic shouldn't
// need to wait on login/JWT work to be buildable and testable). What it
// needs from `req.user` is configurable per-route below, because the
// "owner id" isn't always the same shape:
//   - `foods`/`categories`/`payment_methods`/etc are scoped by
//     `restaurant_id` (see docs/DB_SCHEMA.md) — an owner's token/session
//     is expected to carry their restaurant id directly (as
//     `req.user.restaurant_id`) once Task 1.13/1.14 build that, since
//     looking it up from `users.id` on every request is wasteful
//   - `restaurants` itself is scoped by `owner_id`, matched against the
//     logged-in user's own id (`req.user.id`), NOT a `restaurant_id`
//     field — see the usage examples below
//
// Deliberately NOT this module's job:
//   - authentication (verifying a token, setting req.user at all)  -> Task 1.14
//   - deciding a role (owner vs admin) may bypass ownership entirely
//     -> that's a per-route/role-based-access concern layered on top,
//        not something a generic ownership check should hardcode

const { ApiError, badRequest } = require('../utils/errors');

/**
 * @param {Object} crudResource - a crudFactory(...) instance built with an
 *   `ownerColumn` (Task 1.2) — i.e. it has `getOrThrowForOwner`.
 * @param {Object} [options]
 * @param {string} [options.paramName="id"] - route param holding the
 *   resource's id, e.g. `/api/foods/:id` -> "id", `/api/foods/:foodId` ->
 *   "foodId".
 * @param {string} [options.ownerIdField] - property of `req.user` to read
 *   as the owner id to scope by. Defaults to `crudResource.ownerColumn`
 *   (the common case: a `restaurant_id`-scoped table, matched against a
 *   same-named `req.user.restaurant_id`). Pass this explicitly whenever
 *   the field on `req.user` isn't named the same as the DB column — e.g.
 *   `restaurants` itself, scoped by `owner_id` but matched against
 *   `req.user.id`, needs `{ ownerIdField: 'id' }`.
 * @param {(req) => *} [options.getOwnerId] - full override for deriving
 *   the owner id from `req`, for cases `ownerIdField` (a single property
 *   read) can't express. Takes precedence over `ownerIdField` if given.
 * @param {string} [options.attachAs="resource"] - `req` property the
 *   fetched row is attached to on success, so the route handler can reuse
 *   it (`req.resource` by default) instead of re-fetching.
 *
 * @example
 *   // foods scoped by restaurant_id, matched against req.user.restaurant_id
 *   router.patch('/:id', authMiddleware, ownershipMiddleware(foodsCrud), (req, res) => {
 *     // req.resource is the food row, already confirmed to belong to req.user
 *   });
 *
 * @example
 *   // restaurants itself: scoped by owner_id, matched against req.user.id
 *   router.patch(
 *     '/:id',
 *     authMiddleware,
 *     ownershipMiddleware(restaurantsCrud, { ownerIdField: 'id' }),
 *     (req, res) => { ... }
 *   );
 */
function ownershipMiddleware(crudResource, options = {}) {
  if (!crudResource || typeof crudResource.getOrThrowForOwner !== 'function') {
    throw new Error(
      'ownershipMiddleware: crudResource must be a crudFactory(...) instance built with an ' +
        '"ownerColumn" (Task 1.2) — no getOrThrowForOwner found on it'
    );
  }

  const { paramName = 'id', ownerIdField, getOwnerId, attachAs = 'resource' } = options;

  const resolvedOwnerIdField = ownerIdField || crudResource.ownerColumn;
  if (!getOwnerId && !resolvedOwnerIdField) {
    // Only reachable if a caller passes neither option AND crudResource
    // somehow has getOrThrowForOwner without ownerColumn metadata — i.e.
    // a bug in crudFactory itself, not normal misuse — but fail loudly at
    // setup time rather than silently reading `undefined` off req.user on
    // every request.
    throw new Error(
      'ownershipMiddleware: could not determine which req.user field to read as the owner id — ' +
        'pass "ownerIdField" or "getOwnerId" explicitly'
    );
  }
  const resolveOwnerId = getOwnerId || ((req) => req.user && req.user[resolvedOwnerIdField]);

  return async function checkOwnership(req, res, next) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const ownerId = resolveOwnerId(req);
      if (ownerId === undefined || ownerId === null) {
        // Authenticated, but this account has no owner id to scope
        // by (e.g. an admin token hitting an owner-scoped route, or the
        // resolvedOwnerIdField genuinely isn't on this user) — Forbidden,
        // not Unauthorized: who they are isn't in question, what they can
        // access is.
        throw new ApiError(403, 'Forbidden');
      }

      const rawId = req.params[paramName];
      const id = Number(rawId);
      if (rawId === undefined || !Number.isInteger(id)) {
        throw badRequest(`Invalid or missing "${paramName}" route parameter`);
      }

      // getOrThrowForOwner itself already makes "exists but isn't yours"
      // and "doesn't exist at all" indistinguishable (both a 404) — see
      // Task 1.2 — so this middleware doesn't need its own not-found vs
      // forbidden branching here.
      req[attachAs] = await crudResource.getOrThrowForOwner(id, ownerId);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ownershipMiddleware;
