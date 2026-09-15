// customerSearchController — Task 3.6
//
// Public (no auth) GET /api/search?q=... — backs the customer-facing Home
// screen's search bar. See `services/search.js`'s header comment for the
// full reasoning on scope (foods + restaurants, both by name), the Live/
// visibility filters, and why this isn't paginated.
//
// Kept as its own small controller/route pair rather than folded into an
// existing one, same reasoning `customerCategoryController.js` (3.4) and
// `customerFoodController.js` (3.5) already gave: this is a genuinely
// public, no-auth handler, and every owner-scoped controller in this
// codebase assumes `authMiddleware` ran first.
//
// `q` is required and must be non-blank after trimming — an empty search
// isn't "match everything," it's a malformed request (the frontend never
// sends one: Home.jsx only calls this endpoint once the debounced search
// term is non-empty, same guard this validates independently rather than
// trusting the frontend to always uphold it).

const { searchFoodsAndRestaurants } = require('../services/search');
const { badRequest } = require('../utils/errors');

async function search(req, res, next) {
  try {
    const { q, limit } = req.query;
    if (typeof q !== 'string' || q.trim().length === 0) {
      throw badRequest('"q" is required and cannot be blank');
    }

    const { foods, restaurants } = await searchFoodsAndRestaurants({ q, limit });

    res.status(200).json({
      query: q.trim(),
      foods: foods.map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        restaurant_id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
      })),
      restaurants: restaurants.map((row) => ({
        id: row.id,
        name: row.name,
        cover_url: row.cover_url,
        logo_url: row.logo_url,
        location_text: row.location_text,
        is_open: row.is_open,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
