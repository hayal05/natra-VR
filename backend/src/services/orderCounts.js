// orderCounts — Task 5.17
//
// Backs the owner Dashboard's "new orders count + order counts summary"
// (frontend/src/pages/OwnerDashboard/OwnerDashboard.jsx). Same situation
// `popularFoods.js` (3.5) and `liveCategories.js` (3.4) both already hit
// for a different reason: `crudFactory`'s `count`/`countForOwner` (Task
// 1.9) only support an equality filter on an allow-listed *settable*
// column (`_buildFilterWhere` checks against `primaryKey` + `columns`),
// and `models/orders.js` deliberately excludes `status` from `columns`
// (see that file's own header comment: status only ever changes via
// `statusTransition`, never a bare `update()`/`count()` filter) — so
// `orders.countForOwner(restaurantId, { status: 'New' })` would throw
// "unknown filter column" rather than return a count. A `GROUP BY`
// aggregate has no crudFactory equivalent at all regardless. So, same as
// those two prior tasks: a small hand-written raw-SQL read via
// `withConnection` directly, not a crudFactory instance.
//
// Deliberately scoped by `restaurant_id` only, not by any Live/is_open
// filter the way the customer-facing services (3.4/3.5) are — this is an
// owner looking at their *own* restaurant's orders on their own
// dashboard, not a customer browsing, so there's no "should this be
// visible to who's asking" question here the way there is for
// `popularFoods`/`liveCategories`.
//
// `ORDER_STATUSES` is the fixed 4-value vocabulary `docs/DB_SCHEMA.md`'s
// `orders.status` CHECK constraint enforces (New/Accepted/Completed/
// Rejected) — every key is always present in the returned object, `0` for
// a status the restaurant has no orders in, rather than a sparse object
// only listing statuses that happen to have a row. That's what lets the
// dashboard render all four counts unconditionally without an
// `?? 0` fallback at every call site.
const ORDER_STATUSES = ['New', 'Accepted', 'Completed', 'Rejected'];

const { withConnection } = require('../config/db');

// getOrderCounts(restaurantId) -> { New, Accepted, Completed, Rejected, total }
//
// One `GROUP BY status` query, not four separate `COUNT(*) WHERE
// status = ...` calls — same "one round trip, not N" reasoning
// `popularFoods.js`'s paired rows/count queries already run in parallel
// rather than sequentially, just taken one step further here since all
// four counts come from the same grouped result set.
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `liveCategories.js`/`popularFoods.js` already
// flag for their own queries — unquoted lowercase identifiers are
// assumed to come back as lowercase object keys under
// `oracledb.outFormat = OUT_FORMAT_OBJECT` (config/db.js), which may need
// revisiting (`row.STATUS`/`row.COUNT` vs `row.status`/`row.count`) the
// first time this runs against a live Oracle instance.
async function getOrderCounts(restaurantId) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT status AS status, COUNT(*) AS count
         FROM orders
        WHERE restaurant_id = :restaurantId
        GROUP BY status`,
      { restaurantId }
    );

    const counts = {};
    for (const orderStatus of ORDER_STATUSES) {
      counts[orderStatus] = 0;
    }

    let total = 0;
    for (const row of result.rows) {
      // A count of 1+ can only ever be for one of the 4 CHECK-constrained
      // values, but the grouped count itself always comes back as a
      // string-or-number depending on the driver's numeric-binding mode
      // (same ambiguity `paginate.js`'s own `total` handling already
      // works around) — coerced with `Number(...)` rather than trusted
      // as already numeric.
      const count = Number(row.count);
      counts[row.status] = count;
      total += count;
    }

    return { ...counts, total };
  });
}

module.exports = { getOrderCounts, ORDER_STATUSES };
