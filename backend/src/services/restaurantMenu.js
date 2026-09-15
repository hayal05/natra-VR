// restaurantMenu — Task 3.8
//
// Backs the Restaurant Profile screen's menu list
// (frontend/src/pages/RestaurantProfile) — a single restaurant's
// visible foods, single-column (docs/NATRA_MASTER_PROMPT.md's
// "Restaurant menu" section). Same reasoning `popularFoods.js` (Task
// 3.5) already gave for not using `crudFactory`'s `foods` instance
// directly: this needs a join to `food_visibility` (to exclude hidden
// foods), which a single-table `crudFactory` read can't do — so, same
// as `popularFoods.js`, a small hand-written raw-SQL read via
// `withConnection`.
//
// **Scoped to one restaurant, not "every Live restaurant" like
// `popularFoods.js`** — this file does NOT itself re-check that the
// restaurant is Live (`live_status`/`is_suspended`). That check already
// happens one layer up, in `restaurantController.js`'s `getMenu` (which
// calls `isLive` — the exact same helper `getProfile`, Task 3.7,
// already uses — before ever calling this function), so a customer
// hitting `GET /:id/foods` for a non-Live or nonexistent restaurant
// 404s at the controller and this service never runs. Re-deriving the
// Live check again here via a second join to `restaurants` would just
// be the same rule enforced twice in two different places — a
// maintenance hazard (they could drift), not extra safety.
//
// **Visibility filter**: `food_visibility.is_hidden = 0`, identical
// condition and identical "every food has exactly one food_visibility
// row by construction, so INNER JOIN is correct" reasoning
// `popularFoods.js` already established — see that file's own header
// comment for the full writeup, not repeated here.
//
// **Ordering**: `f.name ASC` — same placeholder-default reasoning as
// `popularFoods.js`/`restaurantController.js`'s own `list`. Nothing in
// `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant menu" section (or either
// reference image) specifies a category-grouped or otherwise ranked
// order for a single restaurant's own menu, so alphabetical is the
// least-surprising default rather than insertion order.
//
// **Paginated**, same call as `popularFoods.js`
// (`parsePaginationParams`/`buildPaginationMeta`) even though
// `docs/NATRA_MASTER_PROMPT.md`'s menu section shows no page-control UI
// — a real menu can still grow past one screen's worth, and building
// the real total/meta in from the start costs nothing extra here, same
// "worth it even though today's only caller asks for one bounded page"
// call `popularFoods.js` already made for the exact same reason.
//
// `image_thumbnail_url` (Task 8.4c-ii, migration 0012) added to the
// SELECT list below — this is a hand-written column list, not
// `SELECT *`, so adding the DB column alone (migration 0012) wasn't
// enough to make it reach the frontend's `EntityCard` wiring; every
// other hand-written join in this codebase that touches `foods`/
// `restaurants` needed the same explicit addition (see
// `popularFoods.js`/`search.js`).

const { withConnection } = require('../config/db');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');

const BASE_FROM = `
    FROM foods f
    JOIN food_visibility fv ON fv.food_id = f.id
   WHERE f.restaurant_id = :restaurantId
     AND fv.is_hidden = :isHidden`;

async function listRestaurantMenu(restaurantId, rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);
  const binds = { restaurantId, isHidden: 0 };

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT f.id AS id,
                f.name AS name,
                f.description AS description,
                f.price AS price,
                f.image_url AS image_url,
                f.image_thumbnail_url AS image_thumbnail_url,
                f.restaurant_id AS restaurant_id
           ${BASE_FROM}
          ORDER BY f.name ASC
          OFFSET :pagingOffset ROWS FETCH NEXT :pagingLimit ROWS ONLY`,
        { ...binds, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(`SELECT COUNT(*) AS total ${BASE_FROM}`, binds),
    ]);

    const total = countResult.rows[0].total;
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

module.exports = { listRestaurantMenu };
