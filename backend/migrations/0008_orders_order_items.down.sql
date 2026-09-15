-- Task 0.8 rollback — drops in reverse dependency order.
-- If migration 0009 has already been applied, its ALTER TABLE that adds
-- fk_orders_payment_method_id must be rolled back first (see 0009 down
-- script) or this DROP will fail/cascade unexpectedly.

DROP TABLE order_items CASCADE CONSTRAINTS PURGE;
DROP TABLE orders       CASCADE CONSTRAINTS PURGE;

COMMIT;
