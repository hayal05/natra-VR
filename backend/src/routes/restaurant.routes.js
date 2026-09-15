// restaurant.routes — Task 3.3
//
// The first public route in this codebase — no `authMiddleware` at all.
// Customers have no accounts (docs/DB_SCHEMA.md), so unlike every route
// in food.routes.js/category.routes.js/etc (1.15/1.16), there's no
// `req.user` to resolve a scope from here.
//
// `GET /` (list, Task 3.3), `GET /:id` (single-restaurant profile,
// Task 3.7), `GET /:id/foods` (that restaurant's visible menu,
// Task 3.8 — see restaurantController.js's `getMenu` header comment),
// and `GET /:id/payment-methods` (that restaurant's active payment
// methods, Task 3.13 — see restaurantController.js's
// `getPaymentMethods` header comment). All public, no `authMiddleware`
// — same reasoning as `list`.
//
// `GET /me` + `PATCH /me` (Task 5.2) are the one owner-authenticated
// exception on this otherwise-public router — the Restaurant tab's
// profile form reading/writing the caller's own restaurant. Mounted
// *before* `GET /:id` for the same reason customerFood.routes.js's
// `/foods/popular` is mounted before food.routes.js's `/foods` and
// customerCategory.routes.js's `/categories/live` before
// category.routes.js's `/categories` (see app.js's own comments on
// both): Express tries routes in registration order, and `/:id` would
// otherwise swallow a literal `/me` request as if `"me"` were an id.

const express = require('express');

const restaurantController = require('../controllers/restaurantController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');

const router = express.Router();

router.get('/me', authMiddleware, attachOwnerRestaurant, restaurantController.getMe);
router.patch('/me', authMiddleware, attachOwnerRestaurant, restaurantController.updateMe);

router.get('/', restaurantController.list);
router.get('/:id', restaurantController.getProfile);
router.get('/:id/foods', restaurantController.getMenu);
router.get('/:id/payment-methods', restaurantController.getPaymentMethods);

module.exports = router;
