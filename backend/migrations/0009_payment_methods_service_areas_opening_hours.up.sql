-- Task 0.9 — payment_methods, service_areas, opening_hours
-- Source of truth: docs/DB_SCHEMA.md
-- Depends on: 0006 (restaurants), 0008 (orders)

-- =====================================================================
-- payment_methods
-- Per-restaurant, owner-managed (distinct from the platform-level
-- registration payment config in admin_settings, Task 0.10).
-- =====================================================================
CREATE TABLE payment_methods (
  id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id   NUMBER        NOT NULL,
  method_name     VARCHAR2(60)  NOT NULL,
  account_number  VARCHAR2(60)  NOT NULL,
  account_name    VARCHAR2(120) NOT NULL,
  instructions    VARCHAR2(500),
  is_active       NUMBER(1) DEFAULT 1 NOT NULL,
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at      TIMESTAMP,
  CONSTRAINT fk_payment_methods_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT ck_payment_methods_is_active CHECK (is_active IN (0, 1))
);

CREATE INDEX ix_payment_methods_restaurant_id ON payment_methods (restaurant_id);

CREATE OR REPLACE TRIGGER trg_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

-- Deferred from Task 0.8: orders.payment_method_id is required but
-- payment_methods didn't exist yet when 0008 ran. Add the FK now.
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_payment_method_id
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id);

-- =====================================================================
-- service_areas
-- =====================================================================
CREATE TABLE service_areas (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id  NUMBER        NOT NULL,
  area_name      VARCHAR2(120) NOT NULL,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_service_areas_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

CREATE INDEX ix_service_areas_restaurant_id ON service_areas (restaurant_id);

-- =====================================================================
-- opening_hours
-- One row per restaurant per day (7 rows/restaurant, seeded on
-- restaurant creation — seeding is service-layer, not this migration).
-- =====================================================================
CREATE TABLE opening_hours (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id  NUMBER    NOT NULL,
  day_of_week    NUMBER(1) NOT NULL,
  is_closed      NUMBER(1) DEFAULT 0 NOT NULL,
  open_time      VARCHAR2(5),
  close_time     VARCHAR2(5),
  CONSTRAINT fk_opening_hours_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT uq_opening_hours_restaurant_day UNIQUE (restaurant_id, day_of_week),
  CONSTRAINT ck_opening_hours_day_of_week CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT ck_opening_hours_is_closed CHECK (is_closed IN (0, 1))
);

CREATE INDEX ix_opening_hours_restaurant_id ON opening_hours (restaurant_id);

COMMIT;
