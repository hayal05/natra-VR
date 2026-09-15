// food.routes — Task 1.15d
//
// Every route here is owner-only (no admin access to a restaurant's own
// foods list/CRUD is planned — admin's food-related concerns, if any,
// live elsewhere per docs/ROADMAP.md), so every route chains the same
// first two middlewares:
//   authMiddleware        (1.14) — who is this
//   attachOwnerRestaurant (1.15a) — resolves req.user.restaurant_id for
//                                   an owner; 403s an owner with no
//                                   restaurant yet; no-ops (then relies on
//                                   ownershipMiddleware/handler below to
//                                   403) for any other role
//
// Single-resource routes (:id) additionally chain ownershipMiddleware
// (1.4) configured with foodsCrud — it reads req.user.restaurant_id (the
// field attachOwnerRestaurant just set, and exactly what foodsCrud's own
// `ownerColumn: 'restaurant_id'` already defaults to, per models/foods.js
// — no ownerIdField override needed here, unlike restaurants' own
// owner_id-vs-id case), fetches+confirms the row, and attaches it as
// req.resource before the controller handler ever runs.
//
// GET / (list) deliberately does NOT chain ownershipMiddleware — that
// middleware is built around a single `:id` route param
// (docs: middleware/ownershipMiddleware.js), which a collection route has
// none of. Scoping the list to the caller's restaurant is instead just
// `paginateForOwner(foodsCrud, req.user.restaurant_id, ...)` inside
// foodController.list itself.

const express = require('express');

const foodController = require('../controllers/foodController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');
const foodsCrud = require('../models/foods');

const router = express.Router();

const requireOwnedFood = ownershipMiddleware(foodsCrud);

router.get('/', authMiddleware, attachOwnerRestaurant, foodController.list);
router.post('/', authMiddleware, attachOwnerRestaurant, foodController.create);

router.get('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedFood, foodController.getOne);
router.patch('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedFood, foodController.update);
router.delete('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedFood, foodController.remove);

// Task 5.9a — hide/show. A separate sub-path rather than folding into the
// plain PATCH /:id above: `is_hidden` isn't a `foods` column (see
// foodController.js's Task 5.9a header comment), so this needs its own
// route to reach a handler that writes to `food_visibility` instead.
// Chains the same requireOwnedFood as update/remove above — ownership is
// checked once, the same way, regardless of which sub-resource of "this
// food" a route ends up writing to.
router.patch(
  '/:id/visibility',
  authMiddleware,
  attachOwnerRestaurant,
  requireOwnedFood,
  foodController.setVisibility
);

module.exports = router;
