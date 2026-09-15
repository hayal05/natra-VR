-- Task 0.10 rollback — drops in reverse dependency order.

DROP TABLE popularity_stats       CASCADE CONSTRAINTS PURGE;
DROP TABLE notifications          CASCADE CONSTRAINTS PURGE;
DROP TABLE registration_payments  CASCADE CONSTRAINTS PURGE;
DROP TABLE live_requests          CASCADE CONSTRAINTS PURGE;
DROP TABLE admin_settings         CASCADE CONSTRAINTS PURGE;

COMMIT;
