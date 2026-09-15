// adminLiveRequestsList — Task 6.6a, extended by 6.6c
//
// Backs the admin "Live-request review" queue (`AdminLiveRequests.jsx`,
// Task 6.6d) with a paginated list of **pending** `live_requests` rows,
// joined with `restaurants` (for `restaurant_name` — the queue needs a
// human-readable name, not just an id) and `registration_payments` (for
// `amount`/`payment_screenshot_url` — the whole reason this queue exists
// is to review that screenshot; 6.6c's own detail read below returns the
// same columns for the single-row review screen's `ImageViewer`, but the
// list itself surfaces the screenshot URL too so a reviewer isn't flying
// blind row-to-row).
//
// **Hardcoded to `status = 'pending'`, not a filterable `status` query
// param** — unlike `adminRestaurantsList.js` (6.4a)'s optional `q`. This
// queue is specifically the admin's to-do list (same "Pending Live
// requests" framing `docs/NATRA_MASTER_PROMPT.md`'s admin dashboard
// section and `adminDashboardSummary.js`'s own `pending` count already
// use) — once 6.7's Approve/Reject wiring moves a row to
// `'approved'`/`'rejected'`, it should simply fall out of this list, not
// need an explicit filter to stay hidden. A separate "reviewed history"
// view, if ever wanted, is a different, not-yet-scoped screen — flagging
// here rather than guessing at its shape now. **6.6c's single-row read
// deliberately does NOT apply this same filter** — see that function's
// own comment below for why.
//
// **Three-table join, one JOIN each way** — `registration_payments` is
// joined (not LEFT JOINed) because the relationship is required, not
// optional: `submitLiveRequest.js` (4.5b) always inserts both rows in
// the same transaction, so every `live_requests` row already has exactly
// one `registration_payments` row before either can ever be read here.
// Same reasoning applies to the `restaurants` join — `restaurant_id` is
// a required FK (`docs/DB_SCHEMA.md`'s own `live_requests` section).
//
// **Ordered by `lr.created_at ASC` (oldest-first)** — a review queue is
// worked first-in-first-out, unlike `adminRestaurantsList.js`'s
// alphabetical-by-name default (that's a browsable directory, not a
// queue) or `adminDashboardSummary.js`'s activity feed (newest-first,
// a log). The owner who's been waiting longest sees their request
// reviewed first.
//
// Same "crudFactory's `findAll`/`count` can't express a JOIN, so this is
// hand-written raw SQL via `withConnection`" situation every other
// admin/aggregate read in this codebase already documents
// (`adminRestaurantsList.js`, `adminDashboardSummary.js`,
// `popularFoods.js`, `search.js`) — reuses `utils/paginate.js`'s
// `parsePaginationParams`/`buildPaginationMeta` for the page-math half,
// same as `adminRestaurantsList.js`.
//
// The `COUNT(*)` query only needs `live_requests` itself, not the full
// join — every `live_requests` row is guaranteed exactly one
// `registration_payments` row and one `restaurants` row (see the join
// comment above), so joining them can't change which rows match
// `status = 'pending'`, only add columns the count doesn't need.
//
// **Why 6.6c's detail read lives in this file, not a new one** — same
// "one file, several related reads" precedent `adminDashboardSummary.js`
// (6.3a) already set with its own `getTotals`/`getRecentActivity` split:
// both functions here answer the same "admin looking at live requests"
// concern and share the exact same joined column list, so a second file
// would just re-import or duplicate `LIVE_REQUEST_COLUMNS` for no
// benefit. Unlike `adminRestaurantsList.js`/`getRestaurantDetailHandler`
// (6.4a/6.5a), which really is a plain crudFactory `getOrThrow` with no
// query in common with the list, this detail read needs the same join
// the list does — a single row from it, not a different query shape.
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap every other hand-written query in this
// codebase already flags — unquoted lowercase identifiers/aliases are
// assumed to come back as lowercase object keys under
// `oracledb.outFormat = OUT_FORMAT_OBJECT` (config/db.js).

const { withConnection } = require('../config/db');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');
const { notFound } = require('../utils/errors');

const PENDING_STATUS = 'pending';

// Shared by both the list (6.6a) and detail (6.6c) reads below — same
// row shape either way, just one page of them vs. exactly one.
const LIVE_REQUEST_COLUMNS = `lr.id AS id,
                lr.restaurant_id AS restaurant_id,
                r.name AS restaurant_name,
                lr.status AS status,
                lr.created_at AS created_at,
                rp.amount AS amount,
                rp.payment_screenshot_url AS payment_screenshot_url,
                rp.submitted_at AS submitted_at`;

const LIVE_REQUEST_FROM_JOIN = `FROM live_requests lr
           JOIN restaurants r ON r.id = lr.restaurant_id
           JOIN registration_payments rp ON rp.live_request_id = lr.id`;

/**
 * Paginated list of pending live requests for the admin review queue.
 *
 * @param {Object} [rawParams] - typically `req.query`: `page`/`limit`/
 *   `offset`, forwarded to `parsePaginationParams` (Task 1.9 — throws a
 *   400 `ApiError` on malformed values, same as every other paginated
 *   endpoint). No search/filter param — see header comment.
 * @returns {Promise<{ rows: Array, meta: Object }>} `rows` shape:
 *   `{ id, restaurant_id, restaurant_name, status, created_at, amount,
 *      payment_screenshot_url, submitted_at }`
 */
async function listLiveRequestsForAdmin(rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT ${LIVE_REQUEST_COLUMNS}
           ${LIVE_REQUEST_FROM_JOIN}
          WHERE lr.status = :status
          ORDER BY lr.created_at ASC
          OFFSET :pagingOffset ROWS
          FETCH NEXT :pagingLimit ROWS ONLY`,
        { status: PENDING_STATUS, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(`SELECT COUNT(*) AS total FROM live_requests WHERE status = :status`, {
        status: PENDING_STATUS,
      }),
    ]);

    const total = Number(countResult.rows[0].total);
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

/**
 * Single live-request detail read for the admin review screen (Task
 * 6.6c/6.6e) — same joined shape `listLiveRequestsForAdmin` returns per
 * row, just one row by `id` instead of a page of them.
 *
 * **No `status = 'pending'` filter here**, unlike the list above — same
 * "detail reads aren't curated the way list/queue reads are" reasoning
 * `getRestaurantDetailHandler` (6.5a) already established for restaurant
 * detail vs. the customer-facing Live-only list: once 6.7's Approve/
 * Reject moves a request out of `'pending'`, it falls out of 6.6a's
 * queue, but an admin who already has the id (e.g. a link they opened
 * before it was actioned, or a not-yet-built "reviewed history" view
 * later) should still be able to open it, not get a 404 as if the
 * request never existed.
 *
 * @param {string|number} id - `live_requests.id`
 * @returns {Promise<Object>} same row shape as `listLiveRequestsForAdmin`
 * @throws {ApiError} 404 (`live_requests not found`) if no row matches
 *   — same message crudFactory's own `getOrThrow` would produce for this
 *   table, for consistency with every other not-found response in this
 *   codebase.
 */
async function getLiveRequestForAdmin(id) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT ${LIVE_REQUEST_COLUMNS}
         ${LIVE_REQUEST_FROM_JOIN}
        WHERE lr.id = :id`,
      { id }
    );

    const row = result.rows[0];
    if (!row) throw notFound('live_requests not found');
    return row;
  });
}

module.exports = { listLiveRequestsForAdmin, getLiveRequestForAdmin, PENDING_STATUS };
