// customerFoodController — Task 3.5
//
// Public (no auth) GET /api/foods/popular — the customer-facing,
// aggregated-across-every-Live-restaurant Popular Foods list the Home
// screen's grid (Task 3.5, frontend: `frontend/src/pages/Home/Home.jsx`,
// `ResponsiveGrid` — Task 2.7) fetches. See `services/popularFoods.js`'s
// header comment for the full reasoning on the Live/visibility filters
// and the placeholder (name-ASC, not real popularity) ordering.
//
// Kept as its own small controller/route pair, not a second exported
// function on `foodController.js` (1.15d/1.15e) — same reasoning
// `customerCategoryController.js` (3.4) already gave for not extending
// `categoryController.js`: that file's own scope is owner-scoped routes
// behind `authMiddleware` → `attachOwnerRestaurant` → `ownershipMiddleware`
// on every route, and mixing a genuinely public, no-auth handler into the
// same file/router is the kind of thing that's easy to mis-mount during a
// later refactor (e.g. accidentally chaining `authMiddleware` onto it).

const { listPopularFoods, getPublicFoodById } = require('../services/popularFoods');
const { notFound } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const { rows, meta } = await listPopularFoods(req.query);
    const foods = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      image_url: row.image_url,
      restaurant_id: row.restaurant_id,
      restaurant_name: row.restaurant_name,
    }));
    res.status(200).json({ foods, meta });
  } catch (err) {
    next(err);
  }
}

// getOne — Task 3.9, mounted at GET /api/foods/detail/:id (see
// routes/customerFoodDetail.routes.js's own header comment for the mount-
// order reasoning). A nonexistent food id and a food that exists but
// isn't visible right now (non-Live restaurant, or hidden via
// food_visibility) both 404 identically — see popularFoods.js's
// `getPublicFoodById` doc comment for why that's a deliberate choice,
// not an oversight.
async function getOne(req, res, next) {
  try {
    const food = await getPublicFoodById(req.params.id);
    if (!food) {
      throw notFound('Food not found');
    }
    res.status(200).json({ food });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne };
