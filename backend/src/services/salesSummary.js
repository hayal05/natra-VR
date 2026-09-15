// salesSummary — Task 5.18a
//
// Backs the owner Dashboard's sales summary widget (Task 5.18,
// `frontend/src/pages/OwnerDashboard/OwnerDashboard.jsx`, wired in
// 5.18b). Same situation `orderCounts.js` (5.17) already hit for a
// different reason: `crudFactory`'s `count`/`countForOwner` (Task 1.9)
// only support an equality filter on an allow-listed *settable* column
// (`_buildFilterWhere`), and `models/orders.js` deliberately excludes
// `status` from `columns` (see that file's own header comment) — so
// filtering to `Completed` orders can't go through crudFactory at all,
// and there's no `SUM` aggregate support there regardless. So, same as
// `orderCounts.js`: a small hand-written raw-SQL read via
// `withConnection`, not a crudFactory instance.
//
// Deliberately scoped by `restaurant_id` only, same as `orderCounts.js`
// — this is an owner looking at their own restaurant's own completed
// sales, not a customer-facing query with a Live/is_open visibility
// question attached.
//
// Only `Completed` orders count as realized sales — `New`/`Accepted`
// orders haven't happened yet, and `Rejected` ones never will. This
// mirrors `docs/NATRA_MASTER_PROMPT.md`'s own "Popular Foods ... Ranked
// dynamically by actual completed sales/order volume" line, which
// `popularFoods.js` (3.5) already builds around the same `Completed`-only
// filter for the same reason.
//
// "Today" is computed in the Node process's own local timezone (a plain
// `Date` at local midnight, compared against each row's `created_at`),
// not the database's. `docs/DB_SCHEMA.md` has no restaurant-level or
// platform-level timezone column anywhere, so there's no "whose today"
// to defer to instead — this is the same single-timezone assumption the
// rest of this codebase already makes implicitly (nothing anywhere
// stores or converts a timezone), just made explicit here since it's the
// first place a calendar-day boundary actually matters.
//
// Deliberately reads one row per completed order (`total`, `created_at`)
// and buckets/sums in JS rather than doing the `SUM`/date-truncation
// work in SQL — the per-restaurant order volume this ever runs against
// is small (a single small business's own orders, not a platform-wide
// aggregate), so there's no real cost to the simpler, easier-to-verify-
// by-eye approach, and it sidesteps having to pick (and keep in sync
// with the JS side) an Oracle-specific `TRUNC(created_at) = TRUNC(SYSDATE)`
// expression for a boundary that's already ambiguous across timezones
// per the paragraph above.

const { withConnection } = require('../config/db');

const COMPLETED_STATUS = 'Completed';

// Guards against the same float-accumulation drift `0.1 + 0.2` classically
// produces — `total` is `NUMBER(10,2)` (docs/DB_SCHEMA.md), so summing a
// long run of two-decimal values in JS can land a cent or two off without
// this. Rounds to the nearest cent rather than trusting the running sum
// as already exact.
function roundToCents(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function startOfLocalToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// getSalesSummary(restaurantId) ->
//   { todayTotal, allTimeTotal, completedOrderCount }
async function getSalesSummary(restaurantId) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT total, created_at
         FROM orders
        WHERE restaurant_id = :restaurantId AND status = :status
        ORDER BY id ASC`,
      { restaurantId, status: COMPLETED_STATUS }
    );

    const todayStart = startOfLocalToday();

    let allTimeTotal = 0;
    let todayTotal = 0;

    for (const row of result.rows) {
      // Same string-or-number driver ambiguity `orderCounts.js`'s own
      // comment already flags for its grouped `count` — coerced rather
      // than trusted as already numeric.
      const amount = Number(row.total);
      allTimeTotal += amount;

      // `created_at` comes back as either a JS `Date` (real oracledb,
      // whose default `DATE`/`TIMESTAMP` fetch type is a `Date` object)
      // or an ISO string (`fakeDb`'s own double, which stores it as
      // `new Date().toISOString()` at insert time) — `new Date(...)`
      // accepts both without needing to branch on which.
      const createdAt = new Date(row.created_at);
      if (createdAt >= todayStart) {
        todayTotal += amount;
      }
    }

    return {
      todayTotal: roundToCents(todayTotal),
      allTimeTotal: roundToCents(allTimeTotal),
      completedOrderCount: result.rows.length,
    };
  });
}

module.exports = { getSalesSummary, COMPLETED_STATUS };
