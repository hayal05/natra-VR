# NATRA — DB Migrations

Plain, numbered Oracle SQL files. No migration framework yet — DB connection
setup (Task 0.11) and a runner script come after all Phase 0 migrations
(0.6–0.10) are written. Until then these are applied manually via SQL*Plus /
SQLcl against the Autonomous DB dev instance.

## Convention
- One file pair per migration task: `NNNN_description.up.sql` /
  `NNNN_description.down.sql`, numbered to match the task (`0006` = Task 0.6).
- `up` creates, `down` drops in strict reverse dependency order.
- Every table: `id` identity PK, `created_at TIMESTAMP DEFAULT SYSTIMESTAMP`.
  Tables that get updated after creation also get `updated_at` plus a
  `BEFORE UPDATE` trigger that sets it to `SYSTIMESTAMP` — Oracle has no
  native auto-update column, and relying on the app layer to remember to set
  it invites bugs, so it's enforced at the DB.
- Enums: `VARCHAR2` + named `CHECK` constraint (`ck_<table>_<column>`).
- FKs, PKs, uniques, and checks are all explicitly named
  (`pk_<table>`, `fk_<table>_<col>`, `uq_<table>_<col>`) so `down` scripts and
  future `ALTER`s can target them without guessing Oracle's generated names.
- Source of truth for columns/types/relationships is `docs/DB_SCHEMA.md` —
  migrations should never introduce a column or constraint that doc doesn't
  already describe. If a migration needs to diverge, update the doc first.

## Status
- [x] 0006 — `users`, `restaurants` (Task 0.6)
- [x] 0007 — `categories`, `foods`, `food_visibility` (Task 0.7)
- [x] 0008 — `orders`, `order_items` (Task 0.8) — `orders.payment_method_id` FK
      deferred to 0009 (payment_methods doesn't exist yet at 0008)
- [x] 0009 — `payment_methods`, `service_areas`, `opening_hours` (Task 0.9) —
      also adds the deferred `fk_orders_payment_method_id` FK from 0008
- [x] 0010 — `registration_payments`, `live_requests`, `admin_settings`,
      `notifications`, `popularity_stats` (Task 0.10) — `admin_settings` is
      seeded with its required singleton row (`id = 1`) as part of the `up`
      script, not left for the Task 0.13/0.14 seed scripts
- [x] 0011 — `orders.status`: add `'Expired'` to `ck_orders_status` (Task
      7.3b) — the first migration numbered past Phase 0's own 0006–0010
      run; the "numbered to match the task" convention above was a Phase-0
      coincidence (0006 = Task 0.6, etc.), not a rule that holds once
      later-phase tasks (7.3b) start needing their own ALTERs, so this one
      is just the next sequential number instead of some `0703b`-style
      scheme. No column resize — `orders.status` stays `VARCHAR2(10)`,
      `'Expired'` fits
- [x] 0012 — `restaurants.logo_thumbnail_url`/`cover_thumbnail_url`,
      `foods.image_thumbnail_url` (Task 8.4c-ii prerequisite) — persists
      the thumbnail URL `uploadToObjectStorage` (Task 1.6) already
      generates and returns, but nothing previously saved anywhere; see
      this file's own comment and docs/PROJECT_STATUS.md's 8.4c-i/8.4c-ii
      log entries for the full trace. Nullable, no backfill.
- [x] 0013 — `orders.status`/`orders.created_at` indexes (Task 8.5c) —
      the two `adminOrdersList.js` (6.9/6.10a) admin-Orders-screen
      filter columns not already covered by 0008's
      `ix_orders_restaurant_id`/`ix_orders_restaurant_status`; see this
      migration's own header comment for why those two don't help a
      `status`-only or `date`-only filter.

## Applying (manual, until a migration runner exists)
```bash
sqlplus $ORACLE_DB_USER/$ORACLE_DB_PASSWORD@$ORACLE_DB_CONNECT_STRING @0006_users_restaurants.up.sql
```

As of Task 0.11, `backend/src/config/db.js` provides a shared connection
pool (wired to the wallet via `ORACLE_WALLET_LOCATION`/`TNS_ADMIN`), and
`npm run db:test` (`backend/src/scripts/testDbConnection.js`) confirms the
app can actually reach the dev Autonomous DB instance. There is still no
migration-runner script — these `.sql` files are applied by hand via
SQL*Plus/SQLcl as above; a runner isn't in the task list until later.
