// foods — Task 1.15b
//
// crudFactory instance for `foods` (docs/DB_SCHEMA.md's 0.7 section).
// `ownerColumn: 'restaurant_id'` — unlike `restaurants` (1.15a, which
// scopes by `owner_id` pointing at `users.id`), this is the "normal"
// direction every other owner-scoped table in Phase 1 uses: scoped
// directly by `restaurant_id`, matched against
// `req.user.restaurant_id` once `attachOwnerRestaurant` (1.15a) has run.
// That's why `ownershipMiddleware` (Task 1.4) can use this instance with
// no `ownerIdField` override — its default (read `req.user[ownerColumn]`,
// i.e. `req.user.restaurant_id`) is exactly right here.
//
// `category_id` is listed as settable even though it's nullable
// ("uncategorized allowed" per the schema doc) — crudFactory's
// pickAllowed (1.1) only writes columns actually present in the
// caller's payload, so omitting `category_id` on create/update simply
// leaves it untouched/NULL rather than requiring callers to pass
// `category_id: null` explicitly.
//
// Deliberately NOT handled here — crudFactory only ever does single-table
// writes (see its own header comment):
//   - the paired `food_visibility` row every new food needs   -> Task 1.15c
//   - hide/show (a `food_visibility` write, not a `foods` one) -> Task 1.15c/5.9
//
// `image_thumbnail_url` (Task 8.4c-ii prerequisite, migration 0012) added
// alongside `image_url` — same "settable column" treatment, nothing
// special about it at this layer.

const crudFactory = require('../utils/crudFactory');

const foods = crudFactory({
  table: 'foods',
  columns: [
    'restaurant_id',
    'category_id',
    'name',
    'description',
    'price',
    'image_url',
    'image_thumbnail_url',
  ],
  ownerColumn: 'restaurant_id',
});

module.exports = foods;
