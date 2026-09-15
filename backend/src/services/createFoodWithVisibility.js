// createFoodWithVisibility — Task 1.15c
//
// Service-layer wrapper that inserts a `foods` row together with its
// default `food_visibility` companion row (`is_hidden: 0`), per
// docs/DB_SCHEMA.md's 0.7 note that this pairing is "enforced in the
// service layer ... not a DB trigger". Both inserts run on one connection
// inside `config/db.js`'s `withTransaction` and are committed together
// (Task 1.15c's atomicity choice), so a failure partway through — e.g. the
// food_visibility insert throwing — rolls the food insert back too,
// instead of leaving an orphan `foods` row with no visibility row that
// later reads (1.15d's endpoints, or the customer-facing menu) would
// otherwise have to defensively handle.
//
// This is the only place a `foods` row should ever be created from —
// controllers (Task 1.15d) should call this, not `models/foods.js`'s bare
// `create`/`createForOwner` directly, or they'll produce a food with no
// food_visibility row.

const { withTransaction } = require('../config/db');
const foods = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');

/**
 * Create a food and its default (visible) food_visibility row together,
 * as one atomic transaction.
 *
 * @param {Object} data - same shape `models/foods.js`'s `create`/
 *   `createForOwner` accepts: `restaurant_id` (required — the eventual
 *   1.15d controller is expected to supply this from
 *   `req.user.restaurant_id`/`req.restaurant`, set by 1.15a's
 *   `attachOwnerRestaurant`), plus `category_id`, `name`, `description`,
 *   `price`, `image_url`.
 * @returns {Promise<Object>} the newly created food row (as returned by
 *   `models/foods.js`) — not the food_visibility row. Callers care about
 *   the food they just created, and can assume `is_hidden: false` for a
 *   brand new food without a second read.
 */
async function createFoodWithVisibility(data) {
  return withTransaction(async (connection) => {
    const food = await foods.create(data, { connection });
    await foodVisibility.create({ food_id: food.id, is_hidden: 0 }, { connection });
    await connection.commit();
    return food;
  });
}

module.exports = createFoodWithVisibility;
