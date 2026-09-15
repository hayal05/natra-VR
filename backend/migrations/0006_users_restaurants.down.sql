-- Task 0.6 rollback — drops in reverse dependency order.
-- Triggers and indexes are dropped implicitly with their table.

DROP TABLE restaurants CASCADE CONSTRAINTS PURGE;
DROP TABLE users CASCADE CONSTRAINTS PURGE;

COMMIT;
