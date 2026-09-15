-- Task 0.6 — Core tables: users, restaurants
-- Source of truth: docs/DB_SCHEMA.md
-- Target: Oracle Autonomous AI Database (19c+ syntax: IDENTITY columns)

-- =====================================================================
-- users
-- Owners and admins only. Customers never get a row here (no accounts).
-- =====================================================================
CREATE TABLE users (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role           VARCHAR2(10)  NOT NULL,
  full_name      VARCHAR2(120) NOT NULL,
  email          VARCHAR2(160) NOT NULL,
  phone          VARCHAR2(30)  NOT NULL,
  password_hash  VARCHAR2(255) NOT NULL,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at     TIMESTAMP,
  CONSTRAINT ck_users_role  CHECK (role IN ('owner', 'admin')),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

-- =====================================================================
-- restaurants
-- One row per restaurant. Owned by exactly one users row.
-- "Live" is derived (live_status = 'approved' AND is_suspended = 0), not
-- stored directly — see docs/DB_SCHEMA.md for why live_status and
-- is_suspended are kept as separate fields.
-- =====================================================================
CREATE TABLE restaurants (
  id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id       NUMBER        NOT NULL,
  name           VARCHAR2(120) NOT NULL,
  description    CLOB,
  logo_url       VARCHAR2(500),
  cover_url      VARCHAR2(500),
  phone          VARCHAR2(30)  NOT NULL,
  location_text  VARCHAR2(255),
  live_status    VARCHAR2(12) DEFAULT 'not_requested' NOT NULL,
  is_suspended   NUMBER(1) DEFAULT 0 NOT NULL,
  is_open        NUMBER(1) DEFAULT 0 NOT NULL,
  created_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  updated_at     TIMESTAMP,
  CONSTRAINT fk_restaurants_owner_id
    FOREIGN KEY (owner_id) REFERENCES users (id),
  CONSTRAINT ck_restaurants_live_status
    CHECK (live_status IN ('not_requested', 'pending', 'approved', 'rejected')),
  CONSTRAINT ck_restaurants_is_suspended CHECK (is_suspended IN (0, 1)),
  CONSTRAINT ck_restaurants_is_open      CHECK (is_open IN (0, 1))
);

CREATE INDEX ix_restaurants_owner_id ON restaurants (owner_id);

CREATE OR REPLACE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
BEGIN
  :new.updated_at := SYSTIMESTAMP;
END;
/

COMMIT;
