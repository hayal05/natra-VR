// adminDashboardSummary — Task 6.3
//
// Backs the admin Dashboard's totals + recent activity feed
// (`frontend/src/pages/AdminDashboard/AdminDashboard.jsx`). Same
// situation `orderCounts.js` (5.17) / `salesSummary.js` (5.18a) /
// `popularFoods.js` (3.5) already hit repeatedly: `crudFactory`'s
// `count`/`countForOwner` (Task 1.9) only support an equality filter on
// an allow-listed *settable* column, there is no cross-table aggregate
// support there at all, and this needs both (a `restaurants`-table
// conditional count for "live", a `live_requests`-table count for
// "pending", a platform-wide `orders` count, and a `restaurants` JOIN
// for the activity feed's restaurant names) — so, same as every prior
// dashboard-aggregate task, a small hand-written raw-SQL read via
// `withConnection` directly, not a crudFactory instance.
//
// **Platform-wide, not restaurant-scoped** — the one real difference
// from `orderCounts.js`/`salesSummary.js`: those are an owner looking at
// their *own* restaurant, scoped by `restaurant_id`; this is an admin
// looking at the whole platform, so no `restaurant_id`/`owner_id`
// filter appears anywhere below. `requireAdmin` (this same task) is
// what makes that safe to expose — see `admin.routes.js`.
//
// **"Live" mirrors `restaurantController.js`'s own `LIVE_FILTER`**
// (`live_status = 'approved' AND is_suspended = 0`) — the same
// two-condition definition `popularFoods.js`/`liveCategories.js` already
// reuse for the customer-facing side, applied here for the admin side of
// the same derived concept (`docs/DB_SCHEMA.md`'s own "'Live' is
// derived, not a raw flag" note on `restaurants`).
//
// **"Pending" counts `live_requests` rows, not `restaurants.live_status`**
// — a restaurant's `live_status` only ever reaches `'pending'` while it
// has an actual open request (`submitLiveRequest.js`, 4.5b), but
// `live_requests` is the entity Task 6.6's review screen and Task 6.7's
// Approve/Reject actions will actually operate on, so counting there
// directly (rather than re-deriving the same number from `restaurants`)
// keeps this total defined in terms of the same rows admins will click
// through to next.
//
// **Recent activity merges two independent, differently-shaped event
// sources** (new Live requests, new orders) into one chronological feed
// — there is no single `activity_log`-style table in `docs/DB_SCHEMA.md`
// to read this from directly. Each source is queried for its own most
// recent `ACTIVITY_FETCH_LIMIT` rows (never fewer than the final
// `ACTIVITY_LIMIT` the feed shows, so truncating the merged, re-sorted
// list can never accidentally drop a genuinely-more-recent row from
// whichever source happened to return fewer matches), then merged and
// re-sorted by `createdAt` in JS — the two-small-queries-merged-in-JS
// approach `salesSummary.js` already uses for its own today/all-time
// split, rather than a `UNION ALL` (which would need matching column
// shapes between two structurally different event kinds, and Oracle's
// specific `UNION ALL` + `ORDER BY` + `FETCH FIRST` interaction isn't
// worth the extra fragility for a feed capped at 10 items).
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `orderCounts.js`/`salesSummary.js`/
// `popularFoods.js` already flag for their own queries — unquoted
// lowercase identifiers are assumed to come back as lowercase object
// keys under `oracledb.outFormat = OUT_FORMAT_OBJECT` (config/db.js).
//
// Concurrent-queries-on-one-connection note: `getDashboardSummary` below
// runs `getTotals`/`getRecentActivity` via `Promise.all` on the same
// connection, and each of those in turn runs its own 2-3 queries via
// `Promise.all` on that same connection again — the same
// several-queries-one-connection pattern `popularFoods.js`'s own
// `listPopularFoods` (rows + count) and this task's own `getTotals`
// already use, just compounded across more calls here. Untested against
// a real Oracle connection for the same reason the casing note above
// is — if node-oracledb's thin-mode driver turns out not to tolerate
// truly-concurrent `execute()` calls on one connection well, this would
// need converting to sequential `await`s; flagged here rather than
// guessed at, since nothing in this sandbox can exercise a real
// connection to find out either way.

const { withConnection } = require('../config/db');

const LIVE_STATUS = 'approved';
const NOT_SUSPENDED = 0;
const PENDING_STATUS = 'pending';

// How many items the merged, re-sorted feed actually shows.
const ACTIVITY_LIMIT = 10;
// How many rows each individual source query fetches before merging —
// must be >= ACTIVITY_LIMIT (see header comment above for why).
const ACTIVITY_FETCH_LIMIT = ACTIVITY_LIMIT;

async function getTotals(connection) {
  const [restaurantsResult, pendingResult, ordersResult] = await Promise.all([
    connection.execute(
      `SELECT COUNT(*) AS "total",
              SUM(CASE WHEN live_status = :liveStatus AND is_suspended = :notSuspended
                       THEN 1 ELSE 0 END) AS "live"
         FROM restaurants`,
      { liveStatus: LIVE_STATUS, notSuspended: NOT_SUSPENDED }
    ),
    connection.execute(`SELECT COUNT(*) AS "pending" FROM live_requests WHERE status = :status`, {
      status: PENDING_STATUS,
    }),
    connection.execute('SELECT COUNT(*) AS "total" FROM orders'),
  ]);

  const restaurantsRow = restaurantsResult.rows[0];

  return {
    // Same string-or-number driver-numeric-binding ambiguity
    // `orderCounts.js`'s own comment already flags for a grouped
    // `count`/`SUM` — coerced rather than trusted as already numeric.
    // A `SUM` over zero matching rows comes back `null` (not `0`), same
    // as any SQL `SUM` with nothing to add — `?? 0` covers the
    // no-restaurants-at-all edge case.
    restaurants: Number(restaurantsRow.total),
    live: Number(restaurantsRow.live ?? 0),
    pending: Number(pendingResult.rows[0].pending),
    orders: Number(ordersResult.rows[0].total),
  };
}

async function getRecentActivity(connection) {
  const [liveRequestsResult, ordersResult] = await Promise.all([
    connection.execute(
      `SELECT lr.id AS "id",
              lr.status AS "status",
              lr.created_at AS "created_at",
              r.name AS "restaurant_name"
         FROM live_requests lr
         JOIN restaurants r ON r.id = lr.restaurant_id
        ORDER BY lr.created_at DESC
        FETCH FIRST :fetchLimit ROWS ONLY`,
      { fetchLimit: ACTIVITY_FETCH_LIMIT }
    ),
    connection.execute(
      `SELECT o.id AS "id",
              o.order_code AS "order_code",
              o.status AS "status",
              o.created_at AS "created_at",
              r.name AS "restaurant_name"
         FROM orders o
         JOIN restaurants r ON r.id = o.restaurant_id
        ORDER BY o.created_at DESC
        FETCH FIRST :fetchLimit ROWS ONLY`,
      { fetchLimit: ACTIVITY_FETCH_LIMIT }
    ),
  ]);

  // `created_at` comes back as either a JS `Date` (real oracledb) or an
  // ISO string (`fakeDb`'s own double) — same dual shape
  // `salesSummary.js`'s own `createdAt` handling already works around —
  // `new Date(...)` accepts both, and `.toISOString()` gives the
  // frontend one stable, unambiguous wire format either way.
  const liveRequestItems = liveRequestsResult.rows.map((row) => ({
    type: 'live_request',
    id: row.id,
    restaurantName: row.restaurant_name,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  const orderItems = ordersResult.rows.map((row) => ({
    type: 'order',
    id: row.id,
    orderCode: row.order_code,
    restaurantName: row.restaurant_name,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  }));

  return [...liveRequestItems, ...orderItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, ACTIVITY_LIMIT);
}

// getDashboardSummary() -> { totals: { restaurants, live, pending, orders },
//                            recentActivity: [{ type, id, restaurantName,
//                            status, createdAt, orderCode? }, ...] }
async function getDashboardSummary() {
  return withConnection(async (connection) => {
    const [totals, recentActivity] = await Promise.all([
      getTotals(connection),
      getRecentActivity(connection),
    ]);

    return { totals, recentActivity };
  });
}

module.exports = { getDashboardSummary, ACTIVITY_LIMIT };
