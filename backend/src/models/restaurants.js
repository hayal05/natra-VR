// restaurants — Task 1.15a
//
// crudFactory instance for `restaurants` (docs/DB_SCHEMA.md's 0.6
// section). `ownerColumn: 'owner_id'` gets us `findAllForOwner`/
// `findByIdForOwner`/etc "for free" from crudFactory (Task 1.2), but
// note the id it scopes by is a `users.id`, NOT a `restaurants.id` —
// unlike every *other* owner-scoped table (foods, categories, ...),
// which scope by `restaurant_id`. Anything reading `restaurants`'
// `ownerColumn` metadata (e.g. `ownershipMiddleware`, Task 1.4) needs
// `{ ownerIdField: 'id' }` passed explicitly, matching the second
// `ownershipMiddleware` usage example in its own file header — this
// module intentionally doesn't try to paper over that with a
// differently-named column.
//
// Built now (1.15a) rather than earlier because until this task nothing
// needed to look a restaurant up by its owner: 1.12/1.13/1.14 only ever
// dealt with `users` rows directly.

const crudFactory = require('../utils/crudFactory');

const restaurants = crudFactory({
  table: 'restaurants',
  columns: [
    'owner_id',
    'name',
    'description',
    'logo_url',
    'logo_thumbnail_url',
    'cover_url',
    'cover_thumbnail_url',
    'phone',
    'location_text',
    'live_status',
    'is_suspended',
    'is_open',
  ],
  ownerColumn: 'owner_id',
});

module.exports = restaurants;
