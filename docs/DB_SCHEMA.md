# NATRA — Database Schema (Design Doc)

Status: design only — no migrations yet (migrations start at Task 0.6).
Target: Oracle Autonomous AI Database. Types below are written in Oracle SQL
terms (`VARCHAR2`, `NUMBER`, `TIMESTAMP`, `CLOB`) so they translate directly
into migration files later. Large binary media (logos, covers, food photos,
payment screenshots) live in **Object Storage** — every "…_url" column below
stores an Object Storage URL/key, never the file itself.

15 tables total, grouped the same way the migration tasks (0.6–0.10) split them.

---

## Conventions

- Every table has `id` (`NUMBER`, PK, identity) unless noted.
- Every table has `created_at TIMESTAMP DEFAULT SYSTIMESTAMP`; tables whose
  rows are mutated after creation also have `updated_at TIMESTAMP`.
- FK columns are named `<referenced_table_singular>_id`.
- Money columns are `NUMBER(10,2)` (ETB, no currency table — single-currency
  platform).
- Enums are implemented as `VARCHAR2` + `CHECK` constraint (Oracle has no
  native enum type).
- No soft-delete columns unless explicitly noted — deletion behavior per
  table is called out where it matters (e.g. orders are never hard-deleted).

---

## 0.6 — Core tables: users, restaurants

### `users`
Owners and admins only. Customers never get a row here (no accounts).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| role | VARCHAR2(10) | `CHECK (role IN ('owner','admin'))` |
| full_name | VARCHAR2(120) | required |
| email | VARCHAR2(160) | unique, required — login identifier |
| phone | VARCHAR2(30) | required |
| password_hash | VARCHAR2(255) | bcrypt/argon2 hash, never plaintext |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Relationships: referenced by `restaurants.owner_id`, `live_requests.reviewed_by`,
`notifications.recipient_id`, `food_visibility.updated_by`.

### `restaurants`
One row per restaurant. Owned by exactly one `users` row.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| owner_id | NUMBER | FK → `users.id`, required |
| name | VARCHAR2(120) | required |
| description | CLOB | nullable |
| logo_url | VARCHAR2(500) | nullable |
| logo_thumbnail_url | VARCHAR2(500) | nullable — `uploadToObjectStorage`'s (Task 1.6) generated thumbnail alongside `logo_url`; `NULL` whenever `logo_url` is (no logo uploaded) or a logo was uploaded before this column existed |
| cover_url | VARCHAR2(500) | nullable |
| cover_thumbnail_url | VARCHAR2(500) | nullable — same as `logo_thumbnail_url`, for `cover_url` |
| phone | VARCHAR2(30) | required |
| location_text | VARCHAR2(255) | free text, no GPS |
| live_status | VARCHAR2(12) | `CHECK IN ('not_requested','pending','approved','rejected')`, default `'not_requested'` |
| is_suspended | NUMBER(1) | 0/1, default 0 — admin can suspend an approved restaurant independent of `live_status` |
| is_open | NUMBER(1) | 0/1, default 0 — "accepting orders" toggle, independent of Live |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**"Live" is derived, not a raw flag:** a restaurant is Live when
`live_status = 'approved' AND is_suspended = 0`. Keeping `live_status` and
`is_suspended` separate means Suspend/Reactivate (admin) doesn't destroy the
approval history the way overwriting a single status field would.

Relationships: parent of `categories`, `foods`, `orders`, `payment_methods`,
`service_areas`, `opening_hours`, `live_requests`.

---

## 0.7 — foods, categories, food_visibility

### `categories`
Owner-managed, scoped to one restaurant (no shared/global categories).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| name | VARCHAR2(80) | required |
| created_at | TIMESTAMP | |

### `foods`
| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| category_id | NUMBER | FK → `categories.id`, nullable (uncategorized allowed) |
| name | VARCHAR2(120) | required |
| description | VARCHAR2(500) | short description per spec |
| price | NUMBER(10,2) | required |
| image_url | VARCHAR2(500) | nullable until photo uploaded |
| image_thumbnail_url | VARCHAR2(500) | nullable — `uploadToObjectStorage`'s (Task 1.6) generated thumbnail alongside `image_url`; `NULL` whenever `image_url` is, or a photo was uploaded before this column existed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `food_visibility`
Current show/hide state for a food, kept as its own table (1:1 with `foods`)
rather than a column on `foods`, so hide/show toggles are cheap writes that
don't touch the food record itself and carry an audit trail (who hid it,
when). Hidden foods disappear from the customer menu and cannot be ordered.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| food_id | NUMBER | FK → `foods.id`, unique (1 row per food) |
| is_hidden | NUMBER(1) | 0/1, default 0 |
| updated_by | NUMBER | FK → `users.id`, nullable |
| updated_at | TIMESTAMP | |

A `foods` row is created together with a default `food_visibility` row
(`is_hidden = 0`) — enforced in the service layer (crudFactory hook), not a
DB trigger.

---

## 0.8 — orders, order_items

### `orders`
Customer identity is not a FK — customers have no account row anywhere.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| order_code | VARCHAR2(20) | unique, e.g. `NTR-48291`, shown to customer |
| restaurant_id | NUMBER | FK → `restaurants.id`, required — all items in an order share one restaurant |
| customer_name | VARCHAR2(120) | required |
| customer_phone | VARCHAR2(30) | required, **indexed** — sole lookup key for tracking/history |
| customer_location_text | VARCHAR2(255) | required, free text |
| customer_note | VARCHAR2(500) | nullable |
| payment_method_id | NUMBER | FK → `payment_methods.id`, required |
| payment_screenshot_url | VARCHAR2(500) | required |
| subtotal | NUMBER(10,2) | required |
| total | NUMBER(10,2) | required (no fees/tax modeled yet, but kept distinct from subtotal for future use) |
| status | VARCHAR2(10) | `CHECK IN ('New','Accepted','Completed','Rejected','Expired')`, default `'New'` — `'Expired'` added by migration 0011 (Task 7.3b); reachable only from `'New'` and terminal, same as `'Completed'`/`'Rejected'` |
| status_updated_at | TIMESTAMP | updated on every status change |
| expires_at | TIMESTAMP | nullable — set from admin timeout setting (Phase 7) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Orders are never hard-deleted (needed for order history + popularity stats).

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| order_id | NUMBER | FK → `orders.id`, required |
| food_id | NUMBER | FK → `foods.id`, required |
| food_name_snapshot | VARCHAR2(120) | copied at order time — survives food edits/deletes |
| unit_price_snapshot | NUMBER(10,2) | copied at order time |
| quantity | NUMBER(5) | required, ≥ 1 |
| line_total | NUMBER(10,2) | `unit_price_snapshot * quantity`, stored (not computed) for simple aggregation in popularity queries |

---

## 0.9 — payment_methods, service_areas, opening_hours

### `payment_methods`
Per-restaurant, owner-managed (distinct from the platform-level registration
payment config in `admin_settings`).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| method_name | VARCHAR2(60) | e.g. "Telebirr", "CBE Birr", "Bank Transfer" |
| account_number | VARCHAR2(60) | account/phone number |
| account_name | VARCHAR2(120) | |
| instructions | VARCHAR2(500) | nullable |
| is_active | NUMBER(1) | 0/1, default 1 — inactive methods hidden from checkout without deleting history |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `service_areas`
| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| area_name | VARCHAR2(120) | free text, owner-defined |
| created_at | TIMESTAMP | |

### `opening_hours`
One row per restaurant per day (7 rows/restaurant, seeded on restaurant
creation).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| day_of_week | NUMBER(1) | 0=Sunday … 6=Saturday |
| is_closed | NUMBER(1) | 0/1, default 0 |
| open_time | VARCHAR2(5) | `"HH:MM"`, nullable when `is_closed=1` |
| close_time | VARCHAR2(5) | `"HH:MM"`, nullable when `is_closed=1` |

`UNIQUE (restaurant_id, day_of_week)`.

---

## 0.10 — registration_payments, live_requests, admin_settings, notifications, popularity_stats

### `live_requests`
The approval workflow entity. One restaurant can have multiple requests over
time (e.g. rejected → owner reapplies).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| restaurant_id | NUMBER | FK → `restaurants.id`, required |
| status | VARCHAR2(10) | `CHECK IN ('pending','approved','rejected')`, default `'pending'` |
| reviewed_by | NUMBER | FK → `users.id` (admin), nullable until reviewed |
| reviewed_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

Approving a `live_requests` row is the only thing that sets
`restaurants.live_status = 'approved'` (service-layer transaction, both rows
updated together).

### `registration_payments`
The one-time fee payment evidence, tied 1:1 to a `live_requests` row (kept
separate from `live_requests` so the payment record — amount charged at the
time, screenshot — stays immutable even if the request is reviewed and its
status changes).

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| live_request_id | NUMBER | FK → `live_requests.id`, unique, required |
| amount | NUMBER(10,2) | copied from `admin_settings` at submission time |
| payment_screenshot_url | VARCHAR2(500) | required |
| submitted_at | TIMESTAMP | |

### `admin_settings`
Single-row configuration table (platform-wide, no multi-tenancy). Enforced
as one row via a fixed `id = 1` check or application-level guard.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK, always `1` |
| registration_fee_amount | NUMBER(10,2) | required |
| registration_method_name | VARCHAR2(60) | e.g. "Telebirr" |
| registration_account_number | VARCHAR2(60) | |
| registration_account_name | VARCHAR2(120) | |
| registration_instructions | VARCHAR2(500) | nullable |
| order_timeout_mode | VARCHAR2(10) | `CHECK IN ('off','15m','30m','1h','custom')`, default `'off'` |
| order_timeout_custom_minutes | NUMBER(5) | nullable, used only when mode = `'custom'` |
| notify_before_expiry | NUMBER(1) | 0/1, default 0 |
| updated_at | TIMESTAMP | |

### `notifications`
Covers owner ("new order") and admin ("new live request") notifications.
Customer status updates (Accepted/Rejected) are **not** stored here — customers
have no account/session to attach a row to, so those are delivered via the
existing track/polling endpoint (Phase 7), not a notification record.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| recipient_id | NUMBER | FK → `users.id`, required |
| type | VARCHAR2(30) | e.g. `'new_order'`, `'live_request_submitted'` |
| restaurant_id | NUMBER | FK → `restaurants.id`, nullable, context |
| order_id | NUMBER | FK → `orders.id`, nullable, context |
| message | VARCHAR2(255) | rendered text, e.g. "New order from Bole, behind Edna Mall — 2 items — 450 ETB" |
| is_read | NUMBER(1) | 0/1, default 0 |
| created_at | TIMESTAMP | |

### `popularity_stats`
Cached aggregate, recomputed on a schedule/trigger (Phase 7, Task 7.1) rather
than queried live on every home-page load.

| Column | Type | Notes |
|---|---|---|
| id | NUMBER | PK |
| food_id | NUMBER | FK → `foods.id`, unique |
| completed_quantity | NUMBER(10) | SUM of `order_items.quantity` across that food's `Completed` orders |
| last_computed_at | TIMESTAMP | |

Popular Foods grid ranks by `completed_quantity DESC`. Recompute strategy
(full recalculation vs. incremental update on each `Completed` transition) is
decided in Task 7.1 — this table's shape supports either.

---

## Relationship summary

```
users (owner/admin)
  └─< restaurants
        ├─< categories
        ├─< foods >─── food_visibility (1:1)
        │      └─< order_items
        ├─< payment_methods
        ├─< service_areas
        ├─< opening_hours
        ├─< orders ─< order_items
        │      └── payment_methods (selected method)
        └─< live_requests ─── registration_payments (1:1)

admin_settings          (single row, no FKs in)
notifications  → users (recipient), restaurants / orders (context, nullable)
popularity_stats → foods (1:1 cache)
```

---

## Deferred to later tasks
- Actual Oracle DDL / migration files — Tasks 0.6–0.10.
- Indexes beyond the implied PK/unique/FK indexes: most of what this
  section originally deferred to Task 8.5 actually landed earlier than
  that, alongside the migration that needed it — `orders.customer_phone`
  and `orders(restaurant_id, status)` in migration 0008,
  `popularity_stats.food_id` (via its own `UNIQUE` constraint) in
  migration 0010, and `notifications(recipient_id, is_read)` also in
  migration 0010 — following this note's own "should get indexes as
  soon as their migrations land" advice below, rather than waiting.
  Task 8.5 (the formal indexing pass) found those already done when it
  went looking (8.5a/8.5b), and added the two more `orders` needed for
  the admin Orders screen's `status`/`date` filters
  (`ix_orders_status`/`ix_orders_created_at`, migration 0013, 8.5c) —
  see docs/PROJECT_STATUS.md's 8.5a/8.5b/8.5c log entries for each.
- Row-level constraints enforcing "all order_items in an order share the
  order's restaurant_id" — enforced in the `crudFactory`/order-submission
  service layer (Task 3.15), not the DB schema.
