// customerFood.routes — Task 3.5
//
// Mounted at `/api/foods/popular` in `app.js` — see this file's own
// mount-order comment there for why it MUST be registered before
// `app.use('/api/foods', foodRoutes)` (Task 1.15d), the exact same
// shadowing concern `customerCategory.routes.js` (Task 3.4) already
// flagged and fixed for `/api/categories/live` vs `/api/categories`:
// `/api/foods/popular` is itself a prefix match for `/api/foods`, and
// Express tries `app.use(...)` mounts in registration order. If the
// owner-scoped `food.routes.js` were reached first, its own
// `GET /:id` route (chained behind `authMiddleware`) would match the
// literal segment "popular" as an `:id` value and 401 before this public
// route ever got a chance.
//
// No `authMiddleware` at all, same as `restaurant.routes.js` (3.3) and
// `customerCategory.routes.js` (3.4) — customers have no accounts
// (docs/DB_SCHEMA.md).

const express = require('express');

const customerFoodController = require('../controllers/customerFoodController');

const router = express.Router();

router.get('/', customerFoodController.list);

module.exports = router;
