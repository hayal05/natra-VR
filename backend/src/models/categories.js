// categories — Task 1.16a
//
// crudFactory instance for `categories` (docs/DB_SCHEMA.md's 0.7
// section) — "owner-managed, scoped to one restaurant (no shared/global
// categories)". `ownerColumn: 'restaurant_id'`, same direction as
// `foods` (1.15b), so `ownershipMiddleware` (1.4) needs no
// `ownerIdField` override here either.
//
// No companion-row transaction needed here (unlike `foods` +
// `food_visibility`, 1.15c) — categories has no 1:1 sibling table, so
// `categoriesCrud.create`/`createForOwner` can be called directly from
// the controller, not through a service-layer wrapper.

const crudFactory = require('../utils/crudFactory');

const categories = crudFactory({
  table: 'categories',
  columns: ['restaurant_id', 'name'],
  ownerColumn: 'restaurant_id',
});

module.exports = categories;
