// openingHours.routes — Task 1.16d
//
// Deliberately the narrowest route file of the four 1.16 tables: only
// `GET /` (list) and `PATCH /:id` (update) are mounted.
//
// No `POST`: rows are seeded 7-per-restaurant on restaurant creation per
// docs/DB_SCHEMA.md — a task that doesn't exist yet in this codebase,
// flagged in `controllers/openingHoursController.js`'s header.
// No `DELETE`: a restaurant always has exactly one row per day_of_week
// by construction (`UNIQUE (restaurant_id, day_of_week)`) — deleting one
// would just leave that day permanently missing rather than mean
// anything a client should be able to do.
// No `GET /:id`: nothing in the planned frontend needs to fetch a single
// day in isolation, and the full list is already just 7 rows.
//
// Same auth chain as category.routes.js/serviceArea.routes.js/
// paymentMethod.routes.js (1.16a/b/c): authMiddleware ->
// attachOwnerRestaurant -> ownershipMiddleware(openingHoursCrud) on the
// id-scoped route.

const express = require('express');

const openingHoursController = require('../controllers/openingHoursController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');
const openingHoursCrud = require('../models/openingHours');

const router = express.Router();

const requireOwnedOpeningHours = ownershipMiddleware(openingHoursCrud);

router.get('/', authMiddleware, attachOwnerRestaurant, openingHoursController.list);

router.patch(
  '/:id',
  authMiddleware,
  attachOwnerRestaurant,
  requireOwnedOpeningHours,
  openingHoursController.update
);

module.exports = router;
