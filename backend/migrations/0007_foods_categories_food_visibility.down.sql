-- Task 0.7 rollback — drops in reverse dependency order.

DROP TABLE food_visibility CASCADE CONSTRAINTS PURGE;
DROP TABLE foods           CASCADE CONSTRAINTS PURGE;
DROP TABLE categories      CASCADE CONSTRAINTS PURGE;

COMMIT;
