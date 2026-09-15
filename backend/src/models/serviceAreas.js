// serviceAreas — Task 1.16b
//
// crudFactory instance for `service_areas` (docs/DB_SCHEMA.md's 0.9
// section) — owner-defined free-text delivery areas, scoped to one
// restaurant. Same shape as `categories` (1.16a): `ownerColumn:
// 'restaurant_id'`, one real field, no companion-row transaction.
//
// Unlike `categories`, nothing else in the schema references
// `service_areas.id` (see docs/DB_SCHEMA.md's "Relationship summary" —
// `service_areas` is a leaf under `restaurants`), so there's no
// FK-safety wrinkle to handle on delete the way `categoryController.js`
// had to for foods pointing at a category.

const crudFactory = require('../utils/crudFactory');

const serviceAreas = crudFactory({
  table: 'service_areas',
  columns: ['restaurant_id', 'area_name'],
  ownerColumn: 'restaurant_id',
});

module.exports = serviceAreas;
