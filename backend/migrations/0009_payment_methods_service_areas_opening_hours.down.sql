-- Task 0.9 rollback — drops in reverse dependency order.
-- Must drop fk_orders_payment_method_id before dropping payment_methods,
-- otherwise the DROP TABLE below would need CASCADE CONSTRAINTS on
-- payment_methods (fine here since it purges), but the explicit ALTER
-- keeps this script paired 1:1 with the ALTER TABLE in the up script.

ALTER TABLE orders DROP CONSTRAINT fk_orders_payment_method_id;

DROP TABLE opening_hours   CASCADE CONSTRAINTS PURGE;
DROP TABLE service_areas   CASCADE CONSTRAINTS PURGE;
DROP TABLE payment_methods CASCADE CONSTRAINTS PURGE;

COMMIT;
