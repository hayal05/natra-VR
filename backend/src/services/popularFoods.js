// popularFoods — Task 3.5
//
// Backs the customer-facing Home screen's Popular Foods grid
// (frontend/src/pages/Home/Home.jsx, ResponsiveGrid — Task 2.7). Same
// situation Task 3.3 (restaurants) and 3.4 (categories) both already hit:
// nothing in Phase 1 (1.15b `foods` crudFactory) can serve this, because
// `crudFactory` only ever does single-table reads (see that file's own
// header comment) and this needs a three-way join — `foods` to
// `restaurants` (to filter to only Live ones, same as 3.3/3.4) and to
// `food_visibility` (to exclude hidden foods, which neither 3.3 nor 3.4
// had to consider since neither restaurants nor categories carry their
// own visibility flag). So, same as `liveCategories.js` (3.4): a small
// hand-written raw-SQL read via `withConnection` directly, not another
// crudFactory instance.
//
// **Live filter**: exactly `restaurantController.js`'s own `LIVE_FILTER`
// (`live_status = 'approved' AND is_suspended = 0`) — reused as the
// identical two-condition definition, not redefined a third time (3.3
// defined it, 3.4 already reused it this same way). `is_open` is still
// not filtered on, same reasoning as both prior tasks: a Live-but-Closed
// restaurant's foods should still be browsable in the grid — a customer
// can look and decide to order once it reopens, the same "look, don't
// necessarily order right now" allowance the Restaurants row itself
// already makes for a Closed card.
//
// **Visibility filter, new for this task**: `food_visibility.is_hidden =
// 0` — docs/DB_SCHEMA.md's own `food_visibility` section is explicit that
// "Hidden foods disappear from the customer menu and cannot be ordered."
// Neither `foods` (3.3 never touched it) nor `categories` (which has no
// visibility concept at all) needed this before; a customer-facing foods
// endpoint is the first place in this codebase it actually matters. Every
// food has exactly one `food_visibility` row by construction
// (`createFoodWithVisibility`, Task 1.15c, is the only path that creates
// a `foods` row), so an INNER JOIN is correct here — there is no real
// "food with no visibility row" case to defensively LEFT JOIN around.
//
// **Ranking, as of Task 7.2**: `docs/NATRA_MASTER_PROMPT.md` calls for
// Popular Foods to be "ranked dynamically by actual completed
// sales/order volume" — now backed by `popularity_stats` (Task 7.1's
// aggregation/upsert pipeline), ordered `quantity_sold DESC` with
// a `f.name ASC` tiebreak for foods tied on quantity (including two
// foods both sitting at zero). Before this task, ranking here was a
// placeholder (`ORDER BY f.name ASC`, matching
// `restaurantController.js`'s own equivalent placeholder) — see this
// file's git history/PROJECT_STATUS.md for that prior state.
//
// `BASE_FROM` gained a `LEFT JOIN popularity_stats ps ON ps.food_id =
// f.id` (not `INNER JOIN`) so that a food with zero completed orders —
// meaning no `popularity_stats` row at all, since 7.1b's upsert only
// ever visits foods that have at least one completed sale — still
// appears in the grid, just ranked last (`COALESCE(ps.quantity_sold,
// 0)` treats "no row" the same as "a row with 0"). This is safe for
// `getPublicFoodById` too, even though that function neither selects
// nor orders by anything popularity-related: `popularity_stats.food_id`
// carries a UNIQUE constraint (migration 0010), so the `LEFT JOIN`
// cannot multiply either function's rows — at most one `popularity_stats`
// row can ever match a given `f.id`, for both a single-row lookup and
// the `COUNT(*)` query below.
//
// Paginated the same way `restaurantController.js`'s `/api/restaurants`
// is (`parsePaginationParams`/`buildPaginationMeta` from `paginate.js`,
// Task 1.9) rather than left unpaginated the way `liveCategories.js`
// (3.4) is — a foods grid across every Live restaurant's whole menu can
// grow much larger than this app's small, owner-authored category
// vocabulary, so the same "worth building real paging in from the start"
// call `paginate.js` itself was built for applies here even though the
// current Home screen usage (Task 3.5) only ever asks for one bounded
// page via `?limit=N`, same as the Restaurants row's own
// `RESTAURANTS_ROW_LIMIT` usage.
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `liveCategories.js` already flagged for its own
// query — unquoted lowercase identifiers are assumed to come back as
// lowercase object keys under `oracledb.outFormat = OUT_FORMAT_OBJECT`
// (config/db.js), which may need revisiting (`row.NAME` vs `row.name`)
// the first time this runs against a live Oracle instance.
//
// `image_thumbnail_url` (Task 8.4c-ii, migration 0012) added to both
// SELECT lists below — see `restaurantMenu.js`'s equivalent note for why
// a hand-written column list needs its own explicit addition on top of
// the migration.

const { withConnection } = require('../config/db');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');

const BASE_FROM = `
    FROM foods f
    JOIN restaurants r ON r.id = f.restaurant_id
    JOIN food_visibility fv ON fv.food_id = f.id
    LEFT JOIN popularity_stats ps ON ps.food_id = f.id
   WHERE r.live_status = :liveStatus
     AND r.is_suspended = :isSuspended
     AND fv.is_hidden = :isHidden`;

const LIVE_FOOD_BINDS = { liveStatus: 'approved', isSuspended: 0, isHidden: 0 };

// getPublicFoodById — Task 3.9
//
// Backs the Food Details screen (frontend/src/pages/FoodDetails), reached
// by tapping a food anywhere it's shown (Popular Foods grid, search
// results, a restaurant's menu). Deliberately kept in this file rather
// than a new one: it's the exact same "Live restaurant + not-hidden food"
// definition `listPopularFoods` above already established, just a single-
// row lookup by `f.id` instead of a paged list — reusing `BASE_FROM`/
// `LIVE_FOOD_BINDS` means the two can't drift out of sync with each other
// the way two independently hand-written copies of the same join could.
//
// Same "never leak a food that shouldn't be visible" rule
// `restaurantController.js`'s `isLive`-gated `getProfile`/`getMenu` (Tasks
// 3.7/3.8) already established for restaurants: a food belonging to a
// non-Live restaurant, or one that's been hidden via `food_visibility`,
// resolves to `null` here — indistinguishable from a food id that was
// never real to begin with — rather than a 403 that would confirm the id
// exists. The controller turns that `null` into a 404.
//
// Returns the plain row (or `null`), not `{ rows, meta }` — there's no
// pagination concept for a single resource, unlike `listPopularFoods`.
async function getPublicFoodById(foodId) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT f.id AS "id",
              f.name AS "name",
              f.description AS "description",
              f.price AS "price",
              f.image_url AS "image_url",
              f.image_thumbnail_url AS "image_thumbnail_url",
              f.restaurant_id AS "restaurant_id",
              r.name AS "restaurant_name"
         ${BASE_FROM}
         AND f.id = :foodId`,
      { ...LIVE_FOOD_BINDS, foodId }
    );

    return result.rows[0] || null;
  });
}

async function listPopularFoods(rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT f.id AS "id",
                f.name AS "name",
                f.description AS "description",
                f.price AS "price",
                f.image_url AS "image_url",
                f.image_thumbnail_url AS "image_thumbnail_url",
                f.restaurant_id AS "restaurant_id",
                r.name AS "restaurant_name"
           ${BASE_FROM}
          ORDER BY COALESCE(ps.quantity_sold, 0) DESC, f.name ASC
          OFFSET :pagingOffset ROWS FETCH NEXT :pagingLimit ROWS ONLY`,
        { ...LIVE_FOOD_BINDS, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(`SELECT COUNT(*) AS total ${BASE_FROM}`, LIVE_FOOD_BINDS),
    ]);

    const total = countResult.rows[0].total;
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

module.exports = { listPopularFoods, getPublicFoodById };
