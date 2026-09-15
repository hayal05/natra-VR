-- Task 0.8 — orders, order_items
-- Source of truth: docs/DB_SCHEMA.md
-- Depends on: 0006 (restaurants), 0007 (foods)
--
-- NOTE on payment_method_id: docs/DB_SCHEMA.md marks orders.payment_method_id
-- as a required FK -> payment_methods.id, but payment_methods isn't created
-- until Task 0.9 (migration 0009). The column is created here (NOT NULL, per
-- the schema doc) WITHOUT the FK constraint; migration 0009 adds it via
-- ALTER TABLE once payment_methods exists. Tracked in
-- backend/migrations/README.md so it isn't forgotten.

-- =====================================================================
-- orders
-- Customer identity is not a FK — customers have no account row anywhere.
-- Never hard-deleted (needed for order history + popularity stats).
-- =====================================================================
CREATE TABLE orders (
  id                       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_code               VARCHAR2(20)  NOT NULL,
  restaurant_id            NUMBER        NOT NULL,
  customer_name            VARCHAR2(120) NOT NULL,
  customer_phone           VARCHAR2(30)  NOT NULL,
  customer_location_text   VARCHAR2(255) NOT NULL,
  customer_note            VARCHAR2(500),
  payment_method_id        NUMBER        NOT NULL, -- FK added in migration 0009
  payment_screenshot_url   VARCHAR2(500) NOT NULL,
  subtotal                 NUMBER(10,2)  NOT NULL,
  total                    NUMBER(10,2)  NOT NULL,
  status                   VARCHAR2(10) DEFAULT 'New' NOT NULL,
  status_updated_at        TIMESTAMP,
  expires_at               TIMESTAMP,
  created_at               TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at                TIMESTAMP,
  CONSTRAINT fk_orders_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT uq_orders_order_code UNIQUE (order_code),
  CONSTRAINT ck_orders_status
    CHECK (status IN ('New', 'Accepted', 'Completed', 'Rejected'))
);

-- Sole lookup key for customer tracking/history — hot path.
CREATE INDEX ix_orders_customer_phone ON orders (customer_phone);
CREATE INDEX ix_orders_restaurant_id  ON orders (restaurant_id);
-- Supports restaurant dashboard queries filtered by status.
CREATE INDEX ix_orders_restaurant_status ON orders (restaurant_id, status);

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

-- =====================================================================
-- order_items
-- Snapshots food name/price at order time so later edits/deletes to
-- foods don't corrupt past orders. No updated_at — line items aren't
-- mutated after creation.
-- =====================================================================
CREATE TABLE order_items (
  id                    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id              NUMBER        NOT NULL,
  food_id               NUMBER        NOT NULL,
  food_name_snapshot    VARCHAR2(120) NOT NULL,
  unit_price_snapshot   NUMBER(10,2)  NOT NULL,
  quantity              NUMBER(5)     NOT NULL,
  line_total            NUMBER(10,2)  NOT NULL,
  CONSTRAINT fk_order_items_order_id
    FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_food_id
    FOREIGN KEY (food_id) REFERENCES foods (id),
  CONSTRAINT ck_order_items_quantity CHECK (quantity >= 1)
);

CREATE INDEX ix_order_items_order_id ON order_items (order_id);
CREATE INDEX ix_order_items_food_id  ON order_items (food_id);

COMMIT;
