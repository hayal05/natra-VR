// order.routes — Task 3.15c, extended by Task 3.17, Task 3.18a, Task
// 5.12a, Task 5.13, Task 5.14a, and Task 5.18a
//
// Mounted at `/api/orders` in `app.js`. `POST /`, `GET /track`, and
// `GET /history` are all deliberately public (no `authMiddleware`) — same
// as every other customer-facing route since `restaurant.routes.js`
// (Task 3.3): customers have no accounts (docs/DB_SCHEMA.md), so there's
// no `req.user` to gate those on.
//
// `GET /` (Task 5.12a) is the first route on this router that's
// owner-authenticated — chains `authMiddleware` (1.14) then
// `attachOwnerRestaurant` (1.15a), same as `food.routes.js`'s/
// `category.routes.js`'s own `GET /` list routes, and for the same
// reason those don't chain `ownershipMiddleware` (1.4) either: that
// middleware is built around a single `:id` route param a collection
// route doesn't have. Scoping the list to the caller's own restaurant is
// instead just `paginateForOwner(orders, req.user.restaurant_id, ...)`
// inside `orderController.list` itself.
//
// No shadowing concern from adding an owner-scoped `GET /` here unlike
// `/api/foods/popular` or `/api/categories/live` (see those routes' own
// header comments, and `app.js`'s mount-order comments) — this is a
// different HTTP method than the existing public `POST /`, and Express
// dispatches by method + path together, so the two coexist on the same
// path with no registration-order concern between them. `GET /track` and
// `GET /history` are still both literal path segments, not `:id`-shaped —
// this router still has no `GET /:id` for either (or the new `GET /`) to
// be confused with, but they stay declared as plain string routes rather
// than reserved implicitly, so a future `GET /:id` (if Phase 5's order
// detail view, Task 5.13, ever adds one on this same router) can't
// accidentally shadow any of the three by being registered first —
// Express matches routes in registration order, and all three would need
// to come before any `:id` for that hypothetical future route to not
// swallow them.
//
// Task 5.13 adds that `GET /:id` now — registered last, after `/track`
// and `/history`, exactly as the paragraph above anticipated, so it can
// never shadow either literal path. Chains `authMiddleware` →
// `attachOwnerRestaurant` → `ownershipMiddleware(orders)` (Task 1.4),
// same three-deep chain `food.routes.js`'s own `GET /:id` uses — an order
// belongs to a restaurant (`orders.restaurant_id`, `models/orders.js`'s
// `ownerColumn`) the same way a food does, so the exact same middleware
// composition applies unchanged.

const express = require('express');

const orderController = require('../controllers/orderController');
const orders = require('../models/orders');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');

const router = express.Router();

const requireOwnedOrder = ownershipMiddleware(orders);

router.post('/', orderController.create);
router.get('/', authMiddleware, attachOwnerRestaurant, orderController.list);
router.get('/track', orderController.track);
router.get('/history', orderController.history);
// Task 5.17 — same shadowing concern `/api/foods/popular`'s own route
// comment (Task 3.5) already documents: this is a literal path segment,
// not a resource id, so it must be registered before `GET /:id` below or
// that route's `ownershipMiddleware` would try (and fail) to treat
// "counts" as a numeric order id.
router.get('/counts', authMiddleware, attachOwnerRestaurant, orderController.counts);
// Task 5.18a — same shadowing concern `/counts` immediately above (and
// `/api/foods/popular`'s own route comment, Task 3.5) already document:
// a literal path segment, registered before `GET /:id` for the same
// reason.
router.get(
  '/sales-summary',
  authMiddleware,
  attachOwnerRestaurant,
  orderController.salesSummary
);
router.get('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedOrder, orderController.getOne);
// Task 5.14a — same three-deep chain as `GET /:id` immediately above
// (an Accept/Reject action needs the exact same "is this caller's
// restaurant, does this order belong to it" guarantee a read does), just
// a different HTTP method/sub-path on the same `:id`. `requireOwnedOrder`
// attaches the row as `req.resource`, which `orderController.updateStatus`
// hands straight to `services/updateOrderStatus.js` — see that
// controller function's own comment for why no second fetch happens.
router.patch(
  '/:id/status',
  authMiddleware,
  attachOwnerRestaurant,
  requireOwnedOrder,
  orderController.updateStatus
);

module.exports = router;
