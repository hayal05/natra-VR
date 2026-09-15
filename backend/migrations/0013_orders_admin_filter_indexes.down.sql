-- Task 8.5c rollback — drop the two admin-filter indexes.
-- No dependents (nothing else references these index names), so this is
-- a straight drop, no ordering concerns between the two.

DROP INDEX ix_orders_status;
DROP INDEX ix_orders_created_at;

COMMIT;
