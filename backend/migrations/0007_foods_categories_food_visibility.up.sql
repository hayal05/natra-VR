-- Task 0.7 — foods, categories, food_visibility
-- Source of truth: docs/DB_SCHEMA.md
-- Depends on: 0006_users_restaurants.up.sql (restaurants, users)

-- =====================================================================
-- categories
-- Owner-managed, scoped to one restaurant (no shared/global categories).
-- =====================================================================
CREATE TABLE categories (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id  NUMBER       NOT NULL,
  name           VARCHAR2(80) NOT NULL,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_categories_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

CREATE INDEX ix_categories_restaurant_id ON categories (restaurant_id);

-- =====================================================================
-- foods
-- =====================================================================
CREATE TABLE foods (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  restaurant_id  NUMBER        NOT NULL,
  category_id    NUMBER,
  name           VARCHAR2(120) NOT NULL,
  description    VARCHAR2(500),
  price          NUMBER(10,2)  NOT NULL,
  image_url      VARCHAR2(500),
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at     TIMESTAMP,
  CONSTRAINT fk_foods_restaurant_id
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id),
  CONSTRAINT fk_foods_category_id
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE INDEX ix_foods_restaurant_id ON foods (restaurant_id);
CREATE INDEX ix_foods_category_id   ON foods (category_id);

CREATE OR REPLACE TRIGGER trg_foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

-- =====================================================================
-- food_visibility
-- 1:1 with foods. Kept as its own table (not a column on foods) so
-- hide/show is a cheap write with an audit trail (who hid it, when).
-- The service layer creates the default (is_hidden = 0) row alongside
-- each new food — see docs/DB_SCHEMA.md; not enforced by a DB trigger.
-- =====================================================================
CREATE TABLE food_visibility (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  food_id     NUMBER NOT NULL,
  is_hidden   NUMBER(1) DEFAULT 0 NOT NULL,
  updated_by  NUMBER,
  updated_at  TIMESTAMP,
  CONSTRAINT fk_food_visibility_food_id
    FOREIGN KEY (food_id) REFERENCES foods (id),
  CONSTRAINT fk_food_visibility_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT uq_food_visibility_food_id UNIQUE (food_id),
  CONSTRAINT ck_food_visibility_is_hidden CHECK (is_hidden IN (0, 1))
);

CREATE OR REPLACE TRIGGER trg_food_visibility_updated_at
  BEFORE UPDATE ON food_visibility
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

COMMIT;
