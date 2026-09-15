// search — Task 3.6
//
// Backs the customer-facing Home screen's search bar
// (frontend/src/pages/Home/Home.jsx, `SearchBar` — Task 2.13/3.2). Task
// 3.6's own two open questions (docs/PROJECT_STATUS.md's "Next: 3.6"
// note) are resolved here, not guessed at silently:
//
//   1. **search-as-you-type vs search-on-submit**: this is a query
//      function, not a decision about *when* it's called — that choice
//      lives on the frontend (Home.jsx wires it to a debounced `onChange`,
//      not `onSubmit` — see that file's own doc comment for the
//      reasoning). This module doesn't care which triggered it.
//   2. **what a search actually filters**: both `foods` and
//      `restaurants` by name — the reference placeholder text itself
//      ("Search foods, drinks, restaurants...", `SearchBar`'s own
//      default `placeholder`) names both, and there's no separate
//      "drinks" table (docs/DB_SCHEMA.md's `foods` table covers every
//      menu item a restaurant sells, drink or otherwise) — so "drinks"
//      isn't a third thing to search, it's covered by "foods" already.
//      Categories chip selection composing with a search term is
//      explicitly NOT decided here — 3.4's own doc comment already
//      flagged that as still open, and nothing about *this* task
//      requires resolving it (search and the chip row aren't wired
//      together on the frontend either, see Home.jsx).
//
// Same "crudFactory can't join, so this is a small hand-written raw-SQL
// read via withConnection" situation as 3.3/3.4/3.5. Reuses the exact
// same Live/visibility filters those already established:
// `restaurantController.js`'s `LIVE_FILTER` for restaurants, plus
// `popularFoods.js`'s added `food_visibility.is_hidden = 0` INNER JOIN
// for foods (a search box is exactly the kind of thing a hidden food
// must never surface through, same "cannot be ordered" reasoning
// docs/DB_SCHEMA.md's `food_visibility` section gives).
//
// **LIKE wildcard escaping**: a customer's search text is untrusted and
// may itself contain literal `%`/`_` characters (e.g. searching for an
// actual product named "50% Off Combo") — passed through unescaped,
// those would act as SQL wildcards instead of literal characters the
// customer typed. `escapeLikePattern` below escapes `\`, `%`, and `_`
// (in that order, so an already-escaped `%`/`_` doesn't get double-
// escaped) and every query uses `ESCAPE '\'` to match.
//
// Not paginated — same reasoning `liveCategories.js` (3.4) gives for its
// own unpaged list: a search box's result set is meant to be scanned
// immediately, not paged through, so this returns one bounded page per
// entity type (`limit`, capped by `MAX_RESULTS`) rather than building a
// `page`/`meta` story a search UI doesn't need. `popularFoods.js` (3.5)
// made the opposite call because a *browsing* grid can be paged through
// indefinitely — a search result list isn't that.
//
// Column-casing note: same systemic, pre-existing,
// never-yet-exercised-against-real-Oracle gap `liveCategories.js` and
// `popularFoods.js` already flagged for their own queries.
//
// `image_thumbnail_url`/`cover_thumbnail_url`/`logo_thumbnail_url` (Task
// 8.4c-ii, migration 0012) added to both SELECT lists below — see
// `restaurantMenu.js`'s equivalent note for why a hand-written column
// list needs its own explicit addition on top of the migration.

const { withConnection } = require('../config/db');

const LIVE_RESTAURANT_BINDS = { liveStatus: 'approved', isSuspended: 0 };
const LIVE_FOOD_BINDS = { ...LIVE_RESTAURANT_BINDS, isHidden: 0 };

const DEFAULT_RESULT_LIMIT = 10;
const MAX_RESULT_LIMIT = 20;

function escapeLikePattern(raw) {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function resolveLimit(rawLimit) {
  if (rawLimit === undefined) return DEFAULT_RESULT_LIMIT;
  const n = Number(rawLimit);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_RESULT_LIMIT;
  return Math.min(n, MAX_RESULT_LIMIT);
}

async function searchFoodsAndRestaurants({ q, limit } = {}) {
  const trimmed = (q ?? '').trim();
  const boundedLimit = resolveLimit(limit);

  return withConnection(async (connection) => {
    const pattern = `%${escapeLikePattern(trimmed)}%`;

    const [foodsResult, restaurantsResult] = await Promise.all([
      connection.execute(
        `SELECT f.id AS id,
                f.name AS name,
                f.price AS price,
                f.image_url AS image_url,
                f.image_thumbnail_url AS image_thumbnail_url,
                f.restaurant_id AS restaurant_id,
                r.name AS restaurant_name
           FROM foods f
           JOIN restaurants r ON r.id = f.restaurant_id
           JOIN food_visibility fv ON fv.food_id = f.id
          WHERE r.live_status = :liveStatus
            AND r.is_suspended = :isSuspended
            AND fv.is_hidden = :isHidden
            AND UPPER(f.name) LIKE UPPER(:pattern) ESCAPE '\\'
          ORDER BY f.name ASC
          FETCH FIRST :resultLimit ROWS ONLY`,
        { ...LIVE_FOOD_BINDS, pattern, resultLimit: boundedLimit }
      ),
      connection.execute(
        `SELECT r.id AS id,
                r.name AS name,
                r.cover_url AS cover_url,
                r.cover_thumbnail_url AS cover_thumbnail_url,
                r.logo_url AS logo_url,
                r.logo_thumbnail_url AS logo_thumbnail_url,
                r.location_text AS location_text,
                r.is_open AS is_open
           FROM restaurants r
          WHERE r.live_status = :liveStatus
            AND r.is_suspended = :isSuspended
            AND UPPER(r.name) LIKE UPPER(:pattern) ESCAPE '\\'
          ORDER BY r.name ASC
          FETCH FIRST :resultLimit ROWS ONLY`,
        { ...LIVE_RESTAURANT_BINDS, pattern, resultLimit: boundedLimit }
      ),
    ]);

    return { foods: foodsResult.rows, restaurants: restaurantsResult.rows };
  });
}

module.exports = { searchFoodsAndRestaurants, escapeLikePattern, DEFAULT_RESULT_LIMIT, MAX_RESULT_LIMIT };
