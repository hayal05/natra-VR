-- Task 7.3b — orders.status: add 'Expired'
-- Source of truth: docs/DB_SCHEMA.md's 0.8 section (updated alongside
-- this migration, per migrations/README.md's own convention: "if a
-- migration needs to diverge, update the doc first").
--
-- Implements Task 7.3a's design decision (see docs/PROJECT_STATUS.md's
-- 7.3a log entry / backend/README.md's own 7.3a section for the full
-- writeup): timed-out orders get a genuinely new terminal status,
-- 'Expired', rather than being folded into 'Rejected' behind a reason
-- flag. Reachable only from 'New' (Accepted orders are never subject to
-- the timeout — docs/NATRA_MASTER_PROMPT.md's "Order timeout" section
-- only ever discusses *pending* orders timing out), and itself terminal,
-- same as 'Completed'/'Rejected' already are.
--
-- Not a column resize: orders.status is VARCHAR2(10) (migration 0008)
-- and 'Expired' is 7 characters, so this is purely a CHECK-constraint
-- swap — drop the 4-value constraint migration 0008 created, add back a
-- 5-value one under the same constraint name (ck_orders_status) so
-- nothing else needs to know the name changed.
--
-- Out of scope for this migration (see docs/TASKS.md's 7.3b/7.3c/7.3d/
-- 7.3e breakdown): nothing writes 'Expired' to any row yet — that's
-- 7.3c's scheduler + 7.3e's expiry action, driven through
-- backend/src/services/updateOrderStatus.js's transitions map (updated
-- alongside this file, same task).

ALTER TABLE orders DROP CONSTRAINT ck_orders_status;

ALTER TABLE orders ADD CONSTRAINT ck_orders_status
  CHECK (status IN ('New', 'Accepted', 'Completed', 'Rejected', 'Expired'));

COMMIT;
