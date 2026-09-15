-- Task 0.10 — registration_payments, live_requests, admin_settings,
-- notifications, popularity_stats
-- Source of truth: docs/DB_SCHEMA.md
-- Depends on: 0006 (users, restaurants), 0007 (foods), 0008 (orders)

-- =====================================================================
-- admin_settings
-- Single-row platform config. Fixed id = 1 (not identity-generated —
-- an identity column would let a second row slip in with id = 2; the
-- CHECK constraint below is what actually enforces singleton-ness).
-- =====================================================================
CREATE TABLE admin_settings (
  id                            NUMBER(1)      NOT NULL,
  registration_fee_amount      NUMBER(10,2)   NOT NULL,
  registration_method_name     VARCHAR2(60)   NOT NULL,
  registration_account_number  VARCHAR2(60)   NOT NULL,
  registration_account_name    VARCHAR2(120)  NOT NULL,
  registration_instructions    VARCHAR2(500),
  order_timeout_mode           VARCHAR2(10) DEFAULT 'off' NOT NULL,
  order_timeout_custom_minutes NUMBER(5),
  notify_before_expiry         NUMBER(1) DEFAULT 0 NOT NULL,
  updated_at                   TIMESTAMP,
  CONSTRAINT pk_admin_settings PRIMARY KEY (id),
  CONSTRAINT ck_admin_settings_id CHECK (id = 1),
  CONSTRAINT ck_admin_settings_order_timeout_mode
    CHECK (order_timeout_mode IN ('off', '15m', '30m', '1h', 'custom')),
  CONSTRAINT ck_admin_settings_notify_before_expiry
    CHECK (notify_before_expiry IN (0, 1))
);

CREATE OR REPLACE TRIGGER trg_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

-- Required singleton row — not sample/seed data (that's Tasks 0.13/0.14).
-- Without this row the app has nowhere to read the registration fee /
-- timeout config from before an admin ever visits Platform Settings
-- (Task 6.12). Placeholder payment details; admin edits via the UI.
INSERT INTO admin_settings (
  id, registration_fee_amount, registration_method_name,
  registration_account_number, registration_account_name,
  registration_instructions, order_timeout_mode,
  order_timeout_custom_minutes, notify_before_expiry
) VALUES (
  1, 0, 'TBD', 'TBD', 'TBD', NULL, 'off', NULL, 0
);

-- =====================================================================
-- live_requests
-- The approval workflow entity. One restaurant can have multiple
-- requests over time (e.g. rejected -> owner reapplies), so no unique
-- constraint on restaurant_id.
-- =====================================================================
CREATE TABLE live_requests (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id  NUMBER       NOT NULL,
  status         VARCHAR2(10) DEFAULT 'pending' NOT NULL,
  reviewed_by    NUMBER,
  reviewed_at    TIMESTAMP,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_live_requests_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT fk_live_requests_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users (id),
  CONSTRAINT ck_live_requests_status
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX ix_live_requests_restaurant_id ON live_requests (restaurant_id);
CREATE INDEX ix_live_requests_reviewed_by ON live_requests (reviewed_by);

-- =====================================================================
-- registration_payments
-- 1:1 with live_requests, kept separate so the payment evidence (amount
-- charged at submission time, screenshot) stays immutable even if the
-- request's status later changes.
-- =====================================================================
CREATE TABLE registration_payments (
  id                       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  live_request_id          NUMBER        NOT NULL,
  amount                   NUMBER(10,2)  NOT NULL,
  payment_screenshot_url   VARCHAR2(500) NOT NULL,
  submitted_at             TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_registration_payments_live_request_id
    FOREIGN KEY (live_request_id) REFERENCES live_requests (id),
  CONSTRAINT uq_registration_payments_live_request_id
    UNIQUE (live_request_id)
);

-- No separate index needed on live_request_id: the UNIQUE constraint
-- above already creates one.

-- =====================================================================
-- notifications
-- Owner ("new order") and admin ("new live request") notifications only.
-- Customer status updates are delivered via track/polling (Phase 7), not
-- a row here, since customers have no account to attach one to.
-- =====================================================================
CREATE TABLE notifications (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipient_id   NUMBER        NOT NULL,
  type           VARCHAR2(30)  NOT NULL,
  restaurant_id  NUMBER,
  order_id       NUMBER,
  message        VARCHAR2(255) NOT NULL,
  is_read        NUMBER(1) DEFAULT 0 NOT NULL,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_notifications_recipient_id
    FOREIGN KEY (recipient_id) REFERENCES users (id),
  CONSTRAINT fk_notifications_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT fk_notifications_order_id
    FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT ck_notifications_is_read CHECK (is_read IN (0, 1))
);

CREATE INDEX ix_notifications_recipient_id ON notifications (recipient_id);
CREATE INDEX ix_notifications_restaurant_id ON notifications (restaurant_id);
CREATE INDEX ix_notifications_order_id ON notifications (order_id);
-- Unread-count-per-recipient is the hot path (nav badge, Task 5.21);
-- composite index supports it directly instead of relying on the FK
-- index above plus a filter scan.
CREATE INDEX ix_notifications_recipient_is_read
  ON notifications (recipient_id, is_read);

-- =====================================================================
-- popularity_stats
-- Cached aggregate, recomputed on a schedule/trigger (Task 7.1) rather
-- than queried live. Schema doc doesn't call for created_at on this
-- table (it's a recomputed cache row, not an auditable record), so it's
-- omitted here — same reasoning DB_SCHEMA.md already applied to
-- opening_hours in migration 0009.
-- =====================================================================
CREATE TABLE popularity_stats (
  id                   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  food_id              NUMBER        NOT NULL,
  completed_quantity   NUMBER(10) DEFAULT 0 NOT NULL,
  last_computed_at     TIMESTAMP,
  CONSTRAINT fk_popularity_stats_food_id
    FOREIGN KEY (food_id) REFERENCES foods (id),
  CONSTRAINT uq_popularity_stats_food_id UNIQUE (food_id)
);

-- No separate index needed on food_id: the UNIQUE constraint above
-- already creates one.

COMMIT;
