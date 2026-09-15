// admin.routes — Task 6.3a, extended by 6.4a, extended by 6.5a, extended
// by 6.6b, extended by 6.6c, extended by 6.7c, extended by 6.8, extended
// by 6.9, extended by 6.11a, extended by 6.12a, extended by 7.1c
//
// Mounted at `/api/admin` in `app.js` (uncommenting the placeholder
// mount `admin.routes.js`'s own future-mount comment already reserved
// there since Task 6.2). Twelve routes so far: `GET /dashboard-summary`
// (6.3a), `GET /restaurants` (6.4a), `GET /restaurants/:id` (6.5a),
// `PATCH /restaurants/:id/suspension` (6.8), `GET /live-requests`
// (6.6b), `GET /live-requests/:id` (6.6c),
// `PATCH /live-requests/:id/status` (6.7c), `GET /orders` (6.9),
// `GET /orders/:id` (6.11a), `GET /settings` + `PATCH /settings`
// (6.12a), and `POST /popularity/recompute` (7.1c, Phase 7 — the first
// route in this file that isn't part of Phase 6). The new route needs
// no ordering relative to anything above it (`popularity` is a
// distinct path segment, no `:id` collision possible), so it's simply
// appended last. All five `:id`-bearing routes are mounted *after* their own
// literal parent route — same "static before dynamic" ordering
// `restaurant.routes.js` already follows for its own `/live`-vs-`/:id`
// pair, and exactly what this file's own prior header comment already
// flagged 6.5 would need — otherwise Express would never reach
// `/restaurants/:id` (or `/live-requests/...`,
// `/restaurants/:id/suspension`, or `/orders/:id`) for a request that
// could just as well match the literal route first (neither literal
// route takes an id segment, so it can't actually happen here — but the
// ordering convention is followed anyway for consistency with every
// other static/dynamic pair in this codebase, and in case a future
// literal sub-route is ever added). Routes sharing a path prefix don't
// need ordering relative to each other — different HTTP methods/sub-
// paths under the same resource coexist on the same router the same way
// `order.routes.js`'s own `GET /:id` and `PATCH /:id/status` already do;
// `/restaurants/:id/suspension` (6.8) and `/restaurants/:id` (6.5a) are
// a second instance of exactly that, just on `restaurants` instead of
// `live-requests`; `GET /settings` and `PATCH /settings` (6.12a) are a
// third, on `settings` instead. `GET /orders/:id` (6.11a) is the same
// "literal parent route already mounted, `:id` route added after it"
// step for `orders` that 6.5a's own `/restaurants/:id` and 6.6c's own
// `/live-requests/:id` already did for their own resources — mounted
// straight after `GET /orders` (6.9) above it, same as those two.
// `/settings` has no `:id` segment at all (a singleton row, not a
// collection), so it's mounted last, after every other resource, with
// no ordering concern relative to anything above it.
//
// All eleven routes are admin-only — chaining `authMiddleware` (1.14,
// verifies the JWT and attaches `req.user`) then `requireAdmin` (Task
// 6.3, 403s any non-admin role). No `attachOwnerRestaurant`/
// `ownershipMiddleware` in any chain — this data is platform-wide, not
// scoped to one owner's restaurant, so neither of those owner-scoping
// middlewares applies here (see `adminDashboardSummary.js`'s,
// `adminRestaurantsList.js`'s, `adminLiveRequestsList.js`'s, and
// `adminOrdersList.js`'s own header comments on why none of those
// services has a `restaurant_id`/`owner_id` filter anywhere; 6.5a's own
// handler comment gives the same reasoning for skipping `isLive`, and
// 6.6c's own service comment gives the equivalent reasoning for skipping
// a `status` filter on its single-row read; `getOrderDetailHandler`'s
// (6.11a) own comment in `adminController.js` gives the same reasoning
// again, for orders — `getSettingsHandler`/`updateSettingsHandler`
// (6.12a) give the same reasoning a fourth time, for the platform-wide
// `admin_settings` singleton, which has no owner at all to scope by).
// `updateLiveRequestStatusHandler` (6.7c) and
// `updateRestaurantSuspensionHandler` (6.8) both follow the same
// reasoning for skipping `ownershipMiddleware` specifically — see each
// handler's own comment in `adminController.js`.

const express = require('express');

const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  getDashboardSummaryHandler,
  listRestaurantsHandler,
  getRestaurantDetailHandler,
  listLiveRequestsHandler,
  getLiveRequestDetailHandler,
  updateLiveRequestStatusHandler,
  updateRestaurantSuspensionHandler,
  listOrdersHandler,
  getOrderDetailHandler,
  getSettingsHandler,
  updateSettingsHandler,
  recomputePopularityHandler,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard-summary', authMiddleware, requireAdmin, getDashboardSummaryHandler);
router.get('/restaurants', authMiddleware, requireAdmin, listRestaurantsHandler);
router.get('/restaurants/:id', authMiddleware, requireAdmin, getRestaurantDetailHandler);
router.patch(
  '/restaurants/:id/suspension',
  authMiddleware,
  requireAdmin,
  updateRestaurantSuspensionHandler
);
router.get('/live-requests', authMiddleware, requireAdmin, listLiveRequestsHandler);
router.get('/live-requests/:id', authMiddleware, requireAdmin, getLiveRequestDetailHandler);
router.patch(
  '/live-requests/:id/status',
  authMiddleware,
  requireAdmin,
  updateLiveRequestStatusHandler
);
router.get('/orders', authMiddleware, requireAdmin, listOrdersHandler);
router.get('/orders/:id', authMiddleware, requireAdmin, getOrderDetailHandler);
router.get('/settings', authMiddleware, requireAdmin, getSettingsHandler);
router.patch('/settings', authMiddleware, requireAdmin, updateSettingsHandler);
router.post('/popularity/recompute', authMiddleware, requireAdmin, recomputePopularityHandler);

module.exports = router;
