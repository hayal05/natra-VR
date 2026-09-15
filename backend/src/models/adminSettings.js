// adminSettings — Task 4.3
//
// crudFactory instance for `admin_settings` (docs/DB_SCHEMA.md's 0.10
// section) — a single-row, platform-wide config table, fixed `id = 1`
// (enforced by a real DB via `ck_admin_settings_id`, migration 0010).
// No `ownerColumn` here: unlike every other crudFactory instance so far
// (foods/categories/service_areas/... all scoped to one `restaurant_id`),
// this table has exactly one row belonging to no one in particular — the
// platform itself, not any owner.
//
// `columns` lists every settable column except `id` (server/DB-fixed,
// never written by a caller) — the full set from the schema doc,
// including `order_timeout_*`/`notify_before_expiry` even though this
// task (4.3, the Request Live screen) only reads the `registration_*`
// subset: those other columns are genuinely part of the same row and
// Task 6.12 (Platform Settings: registration fee + payment method
// config, plus 6.13's order-timeout config) will need to read/write them
// through this exact same model rather than a second one for the same
// table.
//
// The only read this task's controller needs is `findById(1)` — no
// `findAll`/`create`/`update` caller exists yet (that's 6.12's job, once
// an authenticated admin-only route wraps `update`). Exposing the full
// crudFactory surface now rather than a narrower hand-picked subset costs
// nothing today and avoids this file needing a second pass when 6.12
// actually calls it.

const crudFactory = require('../utils/crudFactory');

const adminSettings = crudFactory({
  table: 'admin_settings',
  columns: [
    'registration_fee_amount',
    'registration_method_name',
    'registration_account_number',
    'registration_account_name',
    'registration_instructions',
    'order_timeout_mode',
    'order_timeout_custom_minutes',
    'notify_before_expiry',
  ],
  selectColumns: [
    'id',
    'registration_fee_amount',
    'registration_method_name',
    'registration_account_number',
    'registration_account_name',
    'registration_instructions',
    'order_timeout_mode',
    'order_timeout_custom_minutes',
    'notify_before_expiry',
    'updated_at',
  ],
});

module.exports = adminSettings;
