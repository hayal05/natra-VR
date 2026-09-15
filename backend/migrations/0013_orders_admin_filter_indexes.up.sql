-- Task 8.5c — orders.status / orders.created_at indexes
-- Source of truth: docs/DB_SCHEMA.md's 0.8 section and its own
-- "Deferred to later tasks" note (updated alongside this migration, per
-- migrations/README.md's own convention).
--
-- Traced `adminOrdersList.js` (Task 6.9, extended by 6.10a) — the admin
-- Orders screen's `restaurant_id`/`status`/`date` filters, ANDed
-- together, all optional (an admin can filter by any subset). Two of
-- those three are already covered:
--   - `restaurant_id` alone           -> ix_orders_restaurant_id (0008)
--   - `restaurant_id` AND `status`    -> ix_orders_restaurant_status (0008)
-- Neither helps a `status`-only or `date`-only filter (no `restaurant_id`
-- picked) — `ix_orders_restaurant_status`'s leading column is
-- `restaurant_id`, and a composite b-tree index isn't generally useful
-- for a query that only filters on a trailing column, especially not
-- here where `restaurant_id` is high-cardinality (an index skip scan
-- wouldn't pay for itself the way it might for a low-cardinality leading
-- column). `date` isn't covered by anything — no existing index touches
-- `created_at` at all. This migration adds both as plain single-column
-- indexes, letting Oracle's optimizer combine them with the existing
-- `restaurant_id`-based indexes (or with each other) per-query rather
-- than trying to pre-build one composite index for every filter
-- combination an admin might pick.
--
-- `adminRestaurantsList.js` (the other file 8.5c's own task text names)
-- turned out not to need anything here: that service's only filter is a
-- `LIKE`-based name search (docs/TASKS.md's 8.5c wording — "status,
-- restaurant_id, created_at" — doesn't actually describe any of
-- `adminRestaurantsList.js`'s own filter columns; those three all
-- belong to `adminOrdersList.js`/`orders`). A plain b-tree index
-- doesn't meaningfully help a `LIKE '%term%'` substring search anyway
-- (no fixed prefix to seek on), and building Oracle Text search
-- infrastructure for that is a different-shaped, much larger task than
-- "add index(es)" — not assumed here, flagged instead in
-- docs/PROJECT_STATUS.md's 8.5c log entry.

CREATE INDEX ix_orders_status     ON orders (status);
CREATE INDEX ix_orders_created_at ON orders (created_at);

COMMIT;
