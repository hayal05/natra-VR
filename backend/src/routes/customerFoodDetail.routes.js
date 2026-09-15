// customerFoodDetail.routes — Task 3.9
//
// Mounted at `/api/foods/detail` in `app.js`, deliberately its own fixed
// path segment rather than a `GET /:id` added onto the existing
// owner-scoped `food.routes.js` (Task 1.15d) or onto
// `customerFood.routes.js` (Task 3.5, mounted at `/api/foods/popular`).
// Two reasons:
//   - Mounting a public `GET /:id` directly under `/api/foods` would sit
//     in front of (or behind, depending on registration order) the
//     owner-scoped router's own `GET /:id` on the exact same path shape
//     — an owner's authenticated request for their own food by id would
//     either be swallowed by this public handler (wrong: it would never
//     reach `authMiddleware`/`ownershipMiddleware` at all) or vice versa,
//     unlike "popular"/"live"/"detail", which are literal segments a
//     numeric `:id` can never collide with.
//   - Reusing `customerFood.routes.js` (i.e. `/api/foods/popular/:id`)
//     would work mechanically, but a food reached via a restaurant's menu
//     or a search result isn't necessarily one of the "popular" ones —
//     naming the URL after an unrelated feature would be misleading
//     rather than just mechanically inconvenient.
//
// Same shadowing concern `/api/foods/popular` and `/api/categories/live`
// already established: `/api/foods/detail` is itself a prefix match for
// the owner-scoped `/api/foods`, so it MUST be mounted before that router
// in `app.js` — otherwise `food.routes.js`'s own `GET /:id` would match
// the literal segment "detail" as an `:id` and 401 via `authMiddleware`
// before this public route ever ran.
//
// No `authMiddleware` at all — same reasoning as every other customer-
// facing route (3.3/3.4/3.5/3.6/3.7/3.8): customers have no accounts
// (docs/DB_SCHEMA.md).

const express = require('express');

const customerFoodController = require('../controllers/customerFoodController');

const router = express.Router();

router.get('/:id', customerFoodController.getOne);

module.exports = router;
