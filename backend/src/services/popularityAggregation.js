// popularityAggregation — Task 7.1a
//
// First step of Phase 7's popularity ranking (docs/ROADMAP.md's Phase 7,
// item 1): the raw aggregation query only. This task deliberately stops
// at "compute the numbers" — writing them into `popularity_stats` is
// 7.1b's job, and a way to trigger this on demand is 7.1c's. Keeping
// each as its own function (and, for 7.1b, its own commit) matches how
// Phase 5/6's lettered splits keep query/write/trigger concerns separate
// (e.g. 5.14a's raw UPDATE vs 5.14b's buttons).
//
// **Why `order_items` grouped by `food_id`, not `foods` or
// `popularity_stats`**: `completed_quantity` is defined by
// docs/DB_SCHEMA.md's 0.10 section as completed order volume, and the
// only place order quantities live is `order_items.quantity` (Task 0.8) —
// `popularity_stats` itself is just a cache table (migration 0010's own
// comment: "recomputed on a schedule/trigger... rather than queried
// live"), not a source of truth to read from here.
//
// **Why join to `orders` and filter on `orders.status = 'Completed'`**:
// `order_items` has no status of its own — status lives on the parent
// `orders` row (Task 0.8). Only `Completed` counts per
// docs/ROADMAP.md's own wording ("completed order quantities by food");
// `New`/`Accepted`/`Rejected` orders are deliberately excluded, matching
// popularFoods.js's header note that real ranking was left as a TODO
// for this task.
//
// **Why a plain GROUP BY and not a LEFT JOIN against `foods`**: this
// function only needs to report on foods that actually have completed
// sales — a food with zero completed orders has nothing to aggregate,
// and 7.1b's upsert (against `popularity_stats`, not this query) is
// where "foods with no sales yet keep whatever they already had (or no
// row at all)" gets decided. Bringing in `foods`/`restaurants` here to
// filter to only Live, non-deleted foods would also be premature: a
// restaurant that goes Live→Suspended after selling food shouldn't lose
// its accumulated popularity history, the same "don't leak, but don't
// erase" distinction `popularFoods.js`'s own Live filter never had to
// make since it deals with current visibility, not accumulated stats.
//
// Column-casing note: same systemic, pre-existing, never-yet-exercised-
// against-real-Oracle gap `popularFoods.js`/`liveCategories.js` already
// flagged — unquoted lowercase identifiers are assumed to come back as
// lowercase object keys under `oracledb.outFormat = OUT_FORMAT_OBJECT`
// (config/db.js).

const { withConnection, withTransaction } = require('../config/db');

const COMPLETED_STATUS = 'Completed';

/**
 * Sum of completed order_items.quantity, grouped by food_id.
 *
 * @returns {Promise<Array<{ food_id: number, completed_quantity: number }>>}
 *   One row per food with at least one Completed order containing it.
 *   A food with zero Completed orders is simply absent from the result
 *   (not returned with completed_quantity: 0) — 7.1b decides what that
 *   absence means for `popularity_stats`.
 */
async function getCompletedQuantitiesByFood() {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT oi.food_id AS food_id,
              SUM(oi.quantity) AS completed_quantity
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
        WHERE o.status = :completedStatus
        GROUP BY oi.food_id`,
      { completedStatus: COMPLETED_STATUS }
    );

    return result.rows;
  });
}

// recomputePopularityStats — Task 7.1b
//
// Writes `getCompletedQuantitiesByFood()`'s results into `popularity_stats`
// (migration 0010's cache table), so 7.2 can rank the Popular Foods grid
// off a plain read instead of re-aggregating `order_items` on every
// request. Deliberately its own function/commit from 7.1a's query, same
// "query vs write vs trigger" separation 5.14a/5.14b (statusTransition
// wiring vs Accept/Reject buttons) already established — 7.1c (a manual
// trigger endpoint) still doesn't exist, so today this can only be
// exercised by calling it directly (e.g. from a REPL/test), not over HTTP.
//
// **MERGE, not SELECT-then-INSERT/UPDATE**: `popularity_stats.food_id`
// already carries a UNIQUE constraint (migration 0010), so a single
// `MERGE INTO ... ON (ps.food_id = src.food_id)` per food is both the
// idiomatic Oracle upsert and avoids the race a separate
// SELECT-then-branch would have if this ever runs concurrently with
// itself (e.g. 7.1c's manual trigger firing while 7.3's cron is also
// due) — the UNIQUE constraint plus MERGE's own semantics make a
// double-insert impossible even under that overlap, whereas a
// hand-rolled "SELECT exists? then INSERT else UPDATE" would have a gap
// between the SELECT and the write.
//
// **One `withTransaction`, not one `withConnection` per food**: every
// food's MERGE either all lands or none does — a recompute that dies
// partway through (e.g. row 40 of 60) shouldn't leave `popularity_stats`
// holding half-old, half-new numbers, which is exactly the kind of
// multi-statement atomicity `withTransaction` exists for (see
// `createFoodWithVisibility.js`, Task 1.15c, for the same reasoning
// applied to a food + its food_visibility row).
//
// **Foods with completed sales but no existing `popularity_stats` row**
// hit the `WHEN NOT MATCHED` branch and get one created — the "insert a
// new row" half of 7.1's own task description. Foods with zero completed
// orders are simply never visited by this loop (7.1a's query never
// returns them) — their `popularity_stats` row, if any exists from a
// past recompute, is left untouched rather than zeroed out or deleted;
// nothing in docs/ROADMAP.md/DB_SCHEMA.md calls for pruning stale rows,
// and 7.2's ranking read treats "no row" and "a row with 0" identically
// either way.
async function recomputePopularityStats() {
  const quantities = await getCompletedQuantitiesByFood();

  if (quantities.length === 0) return;

  return withTransaction(async (connection) => {
    for (const { food_id: foodId, completed_quantity: completedQuantity } of quantities) {
      // eslint-disable-next-line no-await-in-loop -- each MERGE depends
      // on the prior one committing-or-not as part of the same
      // transaction; there's no independent work here to parallelize.
      await connection.execute(
        `MERGE INTO popularity_stats ps
           USING (SELECT :foodId AS food_id FROM dual) src
              ON (ps.food_id = src.food_id)
          WHEN MATCHED THEN
            UPDATE SET ps.completed_quantity = :completedQuantity,
                       ps.last_computed_at = SYSTIMESTAMP
          WHEN NOT MATCHED THEN
            INSERT (food_id, completed_quantity, last_computed_at)
            VALUES (:foodId, :completedQuantity, SYSTIMESTAMP)`,
        { foodId, completedQuantity }
      );
    }

    await connection.commit();
  });
}

module.exports = { getCompletedQuantitiesByFood, recomputePopularityStats };
