-- Task 7.3b — revert: orders.status back to 4 values, no 'Expired'
--
-- CAVEAT this down script can't work around: if any row already has
-- status = 'Expired' by the time this runs, the ADD CONSTRAINT below
-- will fail with an ORA-02293 (check constraint violated by existing
-- data) — same as any down-migration that narrows a CHECK constraint
-- after real rows have used the wider range. Reversing this migration
-- on an environment where the 7.3c/7.3e scheduler has already run and
-- expired real orders requires first deciding what those rows become
-- (most likely back to 'Rejected', by hand) before re-running this
-- script — not something this migration can safely decide or do for
-- the caller.

ALTER TABLE orders DROP CONSTRAINT ck_orders_status;

ALTER TABLE orders ADD CONSTRAINT ck_orders_status
  CHECK (status IN ('New', 'Accepted', 'Completed', 'Rejected'));

COMMIT;
