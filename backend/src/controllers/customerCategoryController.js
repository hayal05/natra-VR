// customerCategoryController — Task 3.4
//
// Public (no auth) GET /api/categories/live — the customer-facing,
// aggregated-across-every-Live-restaurant category list the Home
// screen's Categories chip row (Task 3.4, frontend:
// `frontend/src/pages/Home/Home.jsx`) fetches. See
// `services/liveCategories.js`'s header comment for the full reasoning
// on why this can't just be a `paginateForOwner` call against the
// existing owner-scoped `/api/categories` (Task 1.16a), and why it isn't
// filtered down to only categories that currently have foods in them.
//
// Kept as its own small controller/route pair rather than a second
// exported function inside `categoryController.js` (1.16a): that file's
// own header comment scopes it to "route handlers for /api/categories"
// (owner-scoped, `authMiddleware` → `attachOwnerRestaurant` →
// `ownershipMiddleware` on every route) — mixing a genuinely public,
// no-auth handler into the same file/router as owner-only ones is the
// kind of thing that's easy to mis-mount later (e.g. accidentally
// chaining `authMiddleware` onto it during a refactor). Named/shaped
// after `restaurantController.js`'s own "first public endpoint in the
// codebase" precedent from Task 3.3, which drew the exact same
// separate-file line for the exact same reason.

const { listLiveCategoryNames } = require('../services/liveCategories');

async function list(req, res, next) {
  try {
    const names = await listLiveCategoryNames();
    res.status(200).json({ categories: names.map((name) => ({ name })) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
