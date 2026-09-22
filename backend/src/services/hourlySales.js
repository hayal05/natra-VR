// hourlySales — Task 10.3e2-i
//
// Backs the owner Dashboard's Sales Overview line chart (Task 10.3e2-ii,
// `frontend/src/pages/OwnerDashboard/OwnerDashboard.jsx`) — the one named
// exception in Phase 10's "restyle only, no new features" rule
// (`docs/TASKS.md`'s Phase 10 intro, `docs/UI_REDESIGN_ROADMAP.md`): the
// reference shows an hourly sales curve and `salesSummary.js` only buckets
// Today / All-time, so this is real new backend work rather than faked
// placeholder data.
//
// Deliberately a sibling of `salesSummary.js` (Task 5.18a), not an
// extension of it: same query shape, same reasoning, different output.
// Everything `salesSummary.js`'s header comment says about why this is a
// hand-written raw-SQL read (no `crudFactory` `status` filter, no
// aggregates) and about the local-timezone "today" boundary applies here
// unchanged, and the same read-rows-then-bucket-in-JS approach is used
// for the same reasons (small per-restaurant volume, no Oracle-specific
// `TRUNC`/`EXTRACT` expression to keep in sync with the JS-side day
// boundary). Only `Completed` orders count, scoped by `restaurant_id`.
//
// getHourlySales(restaurantId) ->
//   { hours: [{ hour: 0..23, total, orderCount }, ...24 entries] }
//
// Always returns all 24 hourly buckets (zeros where nothing sold), in
// ascending hour order, rather than a sparse list of only the hours with
// sales: the chart wants a continuous x-axis, and a fixed-shape response
// keeps the frontend free of gap-filling logic (same "every key always
// present" reasoning `orderCounts.js` gives for its own status counts).
// Hours are the *local* hour of `created_at` (Node process timezone), the
// same single-timezone assumption `salesSummary.js` makes explicit.
// Which hours to actually plot (the reference shows roughly 8am-11pm) is
// a presentation decision left to the frontend.

const { withConnection } = require('../config/db');
const { COMPLETED_STATUS } = require('./salesSummary');

const HOURS_PER_DAY = 24;

// Same float-drift guard as `salesSummary.js`'s own `roundToCents`
// (not exported there, and not worth widening that module's surface for
// a one-liner).
function roundToCents(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function startOfLocalToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getHourlySales(restaurantId) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT total, created_at
         FROM orders
        WHERE restaurant_id = :restaurantId AND status = :status
        ORDER BY id ASC`,
      { restaurantId, status: COMPLETED_STATUS }
    );

    const todayStart = startOfLocalToday();
    const totals = new Array(HOURS_PER_DAY).fill(0);
    const counts = new Array(HOURS_PER_DAY).fill(0);

    for (const row of result.rows) {
      // `created_at` is a `Date` from real oracledb or an ISO string from
      // `fakeDb` — `new Date(...)` accepts both (see `salesSummary.js`).
      // Both key casings are read: real oracledb (`OUT_FORMAT_OBJECT`,
      // unquoted identifiers) returns UPPERCASE keys, which is what
      // `salesSummary.js` reads; `fakeDb`/the unit-test mocks return the
      // lowercase names. See `docs/PROJECT_STATUS.md`'s 10.3e2-i entry.
      const createdAt = new Date(row.CREATED_AT ?? row.created_at);
      if (createdAt < todayStart) continue;

      const hour = createdAt.getHours();
      // `total` may arrive as a string depending on the driver's numeric
      // binding mode — coerced, same as `salesSummary.js`.
      totals[hour] += Number(row.TOTAL ?? row.total);
      counts[hour] += 1;
    }

    const hours = [];
    for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) {
      hours.push({ hour, total: roundToCents(totals[hour]), orderCount: counts[hour] });
    }
    return { hours };
  });
}

module.exports = { getHourlySales, HOURS_PER_DAY };
