// food_visibility — Task 1.15c
//
// crudFactory instance for `food_visibility` (docs/DB_SCHEMA.md's 0.7
// section) — the 1:1 show/hide companion row for a `foods` row. Every
// food gets exactly one of these, inserted alongside it — see
// `services/createFoodWithVisibility.js`, which is the only place a food
// should ever be created from.
//
// Deliberately NO `ownerColumn` here: this table has no `restaurant_id`
// column of its own (only `food_id`, per the schema doc), so it can't be
// scoped the way `foods`/`restaurants` are. Ownership for a
// food_visibility row is enforced by going through the `foods` row it
// belongs to instead — a hide/show route (Task 1.15c/5.9) will look up
// the food via `ownershipMiddleware`/`foods` first, then write here by
// `food_id`, rather than relying on crudFactory's `*ForOwner` machinery.
//
// `updated_by` is nullable and left unset by `createFoodWithVisibility`'s
// initial insert (there's no "who" for a row created alongside its food,
// only for a later explicit hide/show toggle) — it's listed as settable
// here so that later toggle write has somewhere to put it.
//
// Production Oracle schema has `updated_at` but no `created_at`, so an
// explicit select list is required here instead of crudFactory's default
// (which assumes both DB-managed timestamp columns exist).

const crudFactory = require('../utils/crudFactory');

const foodVisibility = crudFactory({
  table: 'food_visibility',
  columns: ['food_id', 'is_hidden', 'updated_by'],
  selectColumns: ['id', 'food_id', 'is_hidden', 'updated_by', 'updated_at'],
});

module.exports = foodVisibility;
