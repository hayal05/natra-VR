// openingHours — Task 1.16d
//
// crudFactory instance for `opening_hours` (docs/DB_SCHEMA.md's 0.9
// section). `ownerColumn: 'restaurant_id'`, same base shape as
// `categories`/`service_areas`/`payment_methods` (1.16a/b/c), with two
// differences forced by this table's own schema, not a stylistic choice:
//
// 1. `selectColumns` is passed explicitly instead of taking crudFactory's
//    default (`primaryKey + columns + created_at/updated_at`) — this is
//    the one table added by migration 0009 with NEITHER a `created_at`
//    NOR an `updated_at` column (compare
//    `migrations/0009_..._opening_hours...up.sql`'s `CREATE TABLE` to the
//    `payment_methods`/`service_areas` ones right above it in the same
//    file — those two have both columns and a `trg_..._updated_at`
//    trigger; opening_hours has neither). Taking crudFactory's default
//    would emit `SELECT ..., created_at, updated_at FROM opening_hours`,
//    which fails at the DB with an "invalid identifier" error on every
//    single call.
// 2. `day_of_week` IS in `columns` (crudFactory's allow-list is what
//    makes a column settable/filterable/orderable at all, and both
//    `create()` — for future seeding — and `findAllForOwner`'s
//    `orderBy: 'day_of_week'` need it there) but
//    `controllers/openingHoursController.js` deliberately never accepts
//    it in its update schema — see that file's header for why (it's the
//    row's identity within a restaurant, not an editable field).
//
// `create`/`remove` exist on this instance same as any crudFactory
// output — Tasks 1.1/1.2 don't know this table has no create/delete
// *route* (that's an Express-layer decision, see
// `routes/openingHours.routes.js`). Kept reachable at the model layer on
// purpose: the seeding task this file's controller flags as a dependency
// (7 rows/restaurant on restaurant creation, "seeded on restaurant
// creation" per docs/DB_SCHEMA.md, not yet implemented anywhere in this
// codebase) will need `create` directly once it exists, and this
// session's own tests (`routes/openingHours.routes.test.js`) use it the
// same way to seed rows without an HTTP route to create them through.

const crudFactory = require('../utils/crudFactory');

const openingHours = crudFactory({
  table: 'opening_hours',
  columns: ['restaurant_id', 'day_of_week', 'is_closed', 'open_time', 'close_time'],
  selectColumns: ['id', 'restaurant_id', 'day_of_week', 'is_closed', 'open_time', 'close_time'],
  ownerColumn: 'restaurant_id',
});

module.exports = openingHours;
