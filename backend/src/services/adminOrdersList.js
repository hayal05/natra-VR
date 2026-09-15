// adminOrdersList — Task 6.9
//
// Backs the admin "Orders" list (`AdminOrders.jsx`, this same task's
// frontend half) with a paginated, **platform-wide** order list — every
// order across every restaurant, unlike `orderController.js`'s own
// owner-scoped `list` (5.12a, `paginateForOwner` against a single
// `restaurant_id`). `docs/NATRA_MASTER_PROMPT.md`'s "Order management"
// section lists "View all orders" as its own line, distinct from the
// owner-facing "Restaurant order management" section entirely — this is
// a new, admin-only query, not that endpoint reused with the owner scope
// dropped (same reasoning `adminRestaurantsList.js`'s own header comment
// gives for not reusing `restaurantController.list`: a second, oddly-
// authed route pointed at an owner-scoped handler would be confusing,
// and would risk that handler quietly losing its scoping guarantee for
// owners later).
//
// **Joined to `restaurants` for `restaurant_name`** — an admin scanning
// orders across the whole platform needs to know which restaurant each
// one belongs to; `orders` itself only has `restaurant_id`. A plain INNER
// JOIN is correct (not a defensive LEFT JOIN): `restaurant_id` is a
// required, non-nullable FK (`docs/DB_SCHEMA.md`'s 0.8 section) and
// `restaurants` rows are never hard-deleted (same "orders are never
// hard-deleted" convention that section documents for orders themselves,
// and the same assumption `popularFoods.js`'s own header comment already
// makes for its own INNER JOIN to `food_visibility`).
//
// **Search matches `order_code`, `customer_name`, or `customer_phone`** —
// the three fields `docs/DB_SCHEMA.md`'s own notes call out as how an
// order actually gets found later: `order_code` is "shown to customer"
// (the thing a caller would read off a screenshot/receipt), and
// `customer_phone` is explicitly "the sole lookup key for tracking/
// history" on the customer-facing side (`OrderHistory.jsx`/3.18). No
// restaurant-name search here — that's `listRestaurantsForAdmin`'s own
// job for the Restaurants screen; this list's own restaurant filter is
// a distinct, exact-match dropdown (`FilterBar`), added below by Task
// 6.10a, not this task's free-text search.
//
// **6.10a: `restaurant_id`/`status`/`date` filters, ANDed with the `q`
// search above** — the three `FilterBar` controls Task 6.10's own
// wording calls for (6.10b wires the actual `FilterBar` UI to these).
// All three are exact-match, allow-listed values (not more LIKE
// patterns), so — unlike `q` — each is validated up front and rejected
// with a 400 rather than silently matching nothing on a typo'd value:
//   - `restaurant_id`: must parse as a positive integer, same
//     `parsePositiveInt`-shaped validation `utils/paginate.js` already
//     uses for `page`/`limit` (no FK-existence check against
//     `restaurants` — same as every other exact-match filter in this
//     codebase, a well-formed id for a restaurant that doesn't exist
//     just matches zero rows, not a 404).
//   - `status`: must be one of `updateOrderStatus.js`'s own
//     `orderStatus.knownStatuses` (`'New'|'Accepted'|'Completed'|
//     'Rejected'`, the exact `orders.status` `CHECK` values,
//     case-sensitive) — reusing that module's exported `orderStatus`
//     (its own trailing comment already anticipates exactly this: "so
//     a caller can inspect `knownStatuses` ... without constructing a
//     second, differently-configured instance of the same table's
//     rules") rather than hand-maintaining a second copy of the same
//     four strings here.
//   - `date`: a single calendar day, `YYYY-MM-DD`. Same "no DB/server
//     timezone to defer to, so compute the boundary in the Node
//     process's own local timezone" reasoning `salesSummary.js`'s own
//     `startOfLocalToday()` already documents, extended from "today"
//     to an arbitrary admin-picked day — parsed into a `[dateStart,
//     dateEnd)` pair of plain `Date`s (local midnight of that day, and
//     local midnight of the next) and bound as a `created_at >=
//     :dateStart AND created_at < :dateEnd` range, rather than an
//     Oracle-specific `TRUNC(created_at) = TO_DATE(...)` expression —
//     same reasoning `salesSummary.js`'s own comment gives for avoiding
//     that: it sidesteps picking (and keeping in sync with the JS side)
//     an Oracle date-truncation expression for a boundary that's a JS
//     `Date` computation everywhere else in this file already.
//
// Combined with `AND` (a restaurant admin picks *and* a status admin
// picks *and* a day admin picks — not `OR`, which would return
// unrelated orders matching only one filter), while `q`'s own three
// columns stay `OR`'d together internally and the whole search clause
// is parenthesized before being `AND`'d against the rest — otherwise
// SQL's normal `OR` precedence would let a `customer_phone` match alone
// satisfy the whole `WHERE`, silently ignoring any `restaurant_id`/
// `status`/`date` filter also present in the same request.
//
// Same "crudFactory's `count`/`findAll` only support equality filters on
// allow-listed columns, no LIKE, no JOIN" situation `adminRestaurantsList.js`
// already hit — a search filter across a join needs the same hand-written
// raw-SQL-via-`withConnection` approach, not `models/orders.js`'s
// crudFactory instance. Reuses `search.js`'s own `escapeLikePattern` —
// same escaping requirement applies (an admin's search text is still
// untrusted, and may itself contain literal `%`/`_` characters) — same as
// `adminRestaurantsList.js`'s own reuse of it.
//
// Pagination math reuses `utils/paginate.js`'s `parsePaginationParams`/
// `buildPaginationMeta`, same as `adminRestaurantsList.js` — only the
// actual row-fetch/count queries are hand-written, using the same
// `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY` Oracle paging syntax.
//
// Ordered by `o.id DESC` — same "newest first" choice `orderController.js`'s
// own owner-scoped `list` (5.12a) and `history` (3.18a) already made,
// documented there as the deliberate pick over `created_at`/`status`
// (neither is in `orders`'s settable-columns allow-list `findAll`'s
// `orderBy` checks against) — this is hand-written SQL with no such
// restriction, but `id DESC` is kept anyway for the same visible
// ordering every other order list in this codebase already uses.
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `adminRestaurantsList.js`/`search.js`/
// `popularFoods.js` already flag for their own hand-written queries.

const { withConnection } = require('../config/db');
const { escapeLikePattern } = require('./search');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');
const { badRequest } = require('../utils/errors');
const { orderStatus } = require('./updateOrderStatus');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Same "positive integer or reject with a 400" shape
// `utils/paginate.js`'s own (unexported) `parsePositiveInt` already uses
// for `page`/`limit` — not reused directly since that one's error
// message is hard-coded to pagination's own param names, but the same
// validation.
function parseRestaurantIdFilter(raw) {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw badRequest('"restaurant_id" must be a positive integer');
  }
  return n;
}

// Rejects anything not exactly one of `orders.status`'s own CHECK-
// constraint values — see this file's header comment for why an exact-
// match filter is validated up front rather than left to silently match
// nothing on a typo'd/wrong-case value.
function parseStatusFilter(raw) {
  if (raw === undefined || raw === '') return undefined;
  if (!orderStatus.knownStatuses.includes(raw)) {
    throw badRequest(`"status" must be one of: ${orderStatus.knownStatuses.join(', ')}`);
  }
  return raw;
}

// `'YYYY-MM-DD'` -> a `[dateStart, dateEnd)` pair of local-midnight
// `Date`s spanning that one calendar day — see this file's header
// comment for why this mirrors `salesSummary.js`'s own
// `startOfLocalToday()` rather than an Oracle-specific `TRUNC`/`TO_DATE`
// expression. Rejects both malformed strings (wrong shape entirely) and
// well-shaped-but-impossible ones (e.g. `2024-02-30`) — `new Date(y, m,
// d)` would otherwise silently roll an invalid day-of-month over into
// the following month rather than reporting the typo.
function parseDateFilter(raw) {
  if (raw === undefined || raw === '') return undefined;
  if (!DATE_PATTERN.test(raw)) {
    throw badRequest('"date" must be in YYYY-MM-DD format');
  }

  const [year, month, day] = raw.split('-').map(Number);
  const dateStart = new Date(year, month - 1, day);
  const dateEnd = new Date(year, month - 1, day + 1);

  const rolledOver =
    dateStart.getFullYear() !== year ||
    dateStart.getMonth() !== month - 1 ||
    dateStart.getDate() !== day;
  if (rolledOver) {
    throw badRequest('"date" is not a valid calendar date');
  }

  return { dateStart, dateEnd };
}

// Same full column set `crudFactory`'s default `selectColList` would
// produce for `models/orders.js` (its own explicit `selectColumns`,
// which already includes the DB-managed status/timestamp fields) plus
// the joined `restaurant_name` — kept in sync by hand here since a raw
// query can't ask crudFactory for its own select list, same reasoning
// `adminRestaurantsList.js`'s own `RESTAURANT_COLUMNS` comment gives.
const ORDER_COLUMNS = [
  'o.id',
  'o.order_code',
  'o.restaurant_id',
  'r.name AS restaurant_name',
  'o.customer_name',
  'o.customer_phone',
  'o.customer_location_text',
  'o.total',
  'o.status',
  'o.status_updated_at',
  'o.created_at',
].join(', ');

/**
 * Paginated, platform-wide order list for the admin Orders screen, with
 * an optional case-insensitive substring match on `order_code`/
 * `customer_name`/`customer_phone`, plus (Task 6.10a) optional exact-
 * match `restaurant_id`/`status`/`date` filters — all combined with
 * `AND` (see this file's header comment for the full reasoning and
 * precedents behind each).
 *
 * @param {Object} [rawParams] - typically `req.query`: `page`/`limit`/
 *   `offset` (forwarded to `parsePaginationParams`, Task 1.9 — throws a
 *   400 `ApiError` on malformed values, same as every other paginated
 *   endpoint) plus:
 *   - `q` - optional order-code/customer-name/phone search term.
 *   - `restaurant_id` - optional, must be a positive integer if given.
 *   - `status` - optional, must be one of `orderStatus.knownStatuses`
 *     if given.
 *   - `date` - optional, `YYYY-MM-DD`; matches orders created on that
 *     one calendar day (local time).
 *   Any malformed `restaurant_id`/`status`/`date` throws a 400
 *   `ApiError`, same as malformed pagination params — see each
 *   `parse*Filter` helper above.
 * @returns {Promise<{ rows: Array, meta: Object }>}
 */
async function listOrdersForAdmin(rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);

  const q = typeof rawParams.q === 'string' ? rawParams.q.trim() : '';
  const hasSearch = q !== '';
  const restaurantId = parseRestaurantIdFilter(rawParams.restaurant_id);
  const status = parseStatusFilter(rawParams.status);
  const dateRange = parseDateFilter(rawParams.date);

  const conditions = [];
  const filterBinds = {};

  if (hasSearch) {
    // ESCAPE '\' mirrors adminRestaurantsList.js's/search.js's own LIKE
    // clauses exactly, including needing the same doubled backslash
    // here (one JS-string escape, one SQL-string escape) to bind a
    // single literal backslash as the escape character. Parenthesized
    // as one condition so its internal `OR`s don't leak into the outer
    // `AND` chain below — see this file's header comment.
    conditions.push(
      `(UPPER(o.order_code) LIKE UPPER(:pattern) ESCAPE '\\\\'
         OR UPPER(o.customer_name) LIKE UPPER(:pattern) ESCAPE '\\\\'
         OR UPPER(o.customer_phone) LIKE UPPER(:pattern) ESCAPE '\\\\')`
    );
    filterBinds.pattern = `%${escapeLikePattern(q)}%`;
  }

  if (restaurantId !== undefined) {
    conditions.push('o.restaurant_id = :restaurantId');
    filterBinds.restaurantId = restaurantId;
  }

  if (status !== undefined) {
    conditions.push('o.status = :status');
    filterBinds.status = status;
  }

  if (dateRange !== undefined) {
    conditions.push('o.created_at >= :dateStart AND o.created_at < :dateEnd');
    filterBinds.dateStart = dateRange.dateStart;
    filterBinds.dateEnd = dateRange.dateEnd;
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT ${ORDER_COLUMNS}
           FROM orders o
           JOIN restaurants r ON r.id = o.restaurant_id
           ${whereSql}
          ORDER BY o.id DESC
          OFFSET :pagingOffset ROWS
          FETCH NEXT :pagingLimit ROWS ONLY`,
        { ...filterBinds, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(
        `SELECT COUNT(*) AS total
           FROM orders o
           JOIN restaurants r ON r.id = o.restaurant_id
           ${whereSql}`,
        filterBinds
      ),
    ]);

    const total = Number(countResult.rows[0].total);
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

module.exports = { listOrdersForAdmin };
