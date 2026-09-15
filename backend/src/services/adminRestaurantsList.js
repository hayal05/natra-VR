// adminRestaurantsList — Task 6.4a
//
// Backs the admin "Restaurants" list (`AdminRestaurants.jsx`, Task 6.4b)
// with a paginated, **platform-wide** restaurant list — every restaurant
// regardless of `live_status`/`is_suspended`, unlike every customer-facing
// restaurant read (`restaurantController.js`'s own `LIVE_FILTER`). An
// admin reviewing/approving/suspending restaurants needs to see all of
// them, not just the Live ones — that's the whole point of
// `docs/NATRA_MASTER_PROMPT.md`'s "View restaurants" line, and exactly
// why this is a new query rather than `restaurantController.js`'s `list`
// with `LIVE_FILTER` swapped for `{}`: that handler is mounted publicly
// (no auth at all), so reusing it here would either need a second,
// differently-authed route pointed at the same handler (confusing) or
// would risk that handler quietly losing its Live-only guarantee for
// customers later (fragile) — a dedicated admin-only service, mounted
// behind `requireAdmin` (Task 6.3), is the safer split.
//
// Same "crudFactory's `count`/`findAll` only support equality filters
// on allow-listed columns, no LIKE" situation `search.js` (3.6) already
// hit for its own name search — a name/search filter here needs the
// same hand-written raw-SQL-via-`withConnection` approach, not
// `models/restaurants.js`'s crudFactory instance. Reuses `search.js`'s
// own `escapeLikePattern` rather than duplicating it — same escaping
// requirement applies (an admin's search text is still untrusted, and
// may itself contain literal `%`/`_` characters) — just against a
// different table, and a genuinely paginated result (`meta.total`/
// `totalPages`/etc, Task 1.9) instead of `search.js`'s own bounded,
// unpaginated top-N shape (that file's own header comment explains why
// a *search-box* result list doesn't need paging; an admin list screen,
// same as every other `ListWithPagination`-backed screen in this
// codebase, does).
//
// Pagination math itself reuses `utils/paginate.js`'s
// `parsePaginationParams`/`buildPaginationMeta` rather than re-deriving
// page/limit/offset handling a third time (already shared by
// `paginate`/`paginateForOwner`) — only the actual row-fetch and count
// queries are hand-written below, using the same `OFFSET ... ROWS
// FETCH NEXT ... ROWS ONLY` Oracle paging syntax `crudFactory.js`'s own
// `findAll` already generates. `paginate()`/`paginateForOwner()`
// themselves can't be reused as-is here: both are hard-wired to a
// crudFactory instance's `findAll`/`count`, neither of which can express
// a LIKE filter no matter what's forwarded through them.
//
// Ordered by `name` ASC — same stable, predictable default
// `restaurantController.js`'s customer-facing `list` already uses (that
// file's own header comment: no ranking concept exists yet, Task 7.2 is
// a different, popularity-based concern that doesn't apply here either).
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `search.js`/`popularFoods.js`/
// `adminDashboardSummary.js` already flag for their own hand-written
// queries — unquoted lowercase identifiers are assumed to come back as
// lowercase object keys under `oracledb.outFormat = OUT_FORMAT_OBJECT`
// (config/db.js).

const { withConnection } = require('../config/db');
const { escapeLikePattern } = require('./search');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');

// Same full column set `crudFactory`'s default `selectColList` would
// produce for `models/restaurants.js` (primaryKey + its `columns` +
// `created_at`/`updated_at`) — kept in sync by hand here since a raw
// query can't ask crudFactory for its own select list, but there's no
// reason an admin list row should show a narrower shape than every
// other restaurant read in this codebase already does.
const RESTAURANT_COLUMNS = [
  'id',
  'owner_id',
  'name',
  'description',
  'logo_url',
  'cover_url',
  'phone',
  'location_text',
  'live_status',
  'is_suspended',
  'is_open',
  'created_at',
  'updated_at',
].join(', ');

/**
 * Paginated, platform-wide restaurant list for the admin Restaurants
 * screen, with an optional case-insensitive substring match on `name`.
 *
 * @param {Object} [rawParams] - typically `req.query`: `page`/`limit`/
 *   `offset` (forwarded to `parsePaginationParams`, Task 1.9 — throws a
 *   400 `ApiError` on malformed values, same as every other paginated
 *   endpoint) plus `q`, an optional restaurant-name search term.
 * @returns {Promise<{ rows: Array, meta: Object }>}
 */
async function listRestaurantsForAdmin(rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);

  const q = typeof rawParams.q === 'string' ? rawParams.q.trim() : '';
  const hasSearch = q !== '';
  // ESCAPE '\' mirrors search.js's own LIKE clauses exactly, including
  // needing the same doubled backslash here (one JS-string escape, one
  // SQL-string escape) to bind a single literal backslash as the escape
  // character.
  const whereSql = hasSearch ? `WHERE UPPER(name) LIKE UPPER(:pattern) ESCAPE '\\'` : '';
  const filterBinds = hasSearch ? { pattern: `%${escapeLikePattern(q)}%` } : {};

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT ${RESTAURANT_COLUMNS}
           FROM restaurants
           ${whereSql}
          ORDER BY name ASC
          OFFSET :pagingOffset ROWS
          FETCH NEXT :pagingLimit ROWS ONLY`,
        { ...filterBinds, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(`SELECT COUNT(*) AS total FROM restaurants ${whereSql}`, filterBinds),
    ]);

    const total = Number(countResult.rows[0].total);
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

module.exports = { listRestaurantsForAdmin };
