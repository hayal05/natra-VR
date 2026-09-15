// order_items — Task 3.15a
//
// crudFactory instance for `order_items` (docs/DB_SCHEMA.md's 0.8 section
// / migration 0008) — the line-item rows `services/submitOrder.js` (Task
// 3.15b) creates alongside each `orders` row, one `create()` call per
// item on the same transaction connection as the parent `orders` insert
// (same `{ connection }` pattern `createFoodWithVisibility`, 1.15c,
// already established for a food + its food_visibility row).
//
// Deliberately NO `ownerColumn`: this table has no `restaurant_id` column
// of its own (only `order_id`/`food_id`, per the schema doc) — same
// reasoning `food_visibility` (1.15c) already documents for itself.
// Ownership for Phase 5's order detail view is enforced by going through
// the parent `orders` row (which does have `ownerColumn` — see
// `models/orders.js`) first, then reading its `order_items` by `order_id`.
//
// `food_name_snapshot` / `unit_price_snapshot` / `line_total` are listed
// as settable columns because `create()` still needs to write them, not
// because a caller may supply them directly — `submitOrder` (3.15b)
// computes all three itself from the food's *current* price at order
// time, never from the request body (see its own header once written).
//
// `selectColumns` is set explicitly, NOT the crudFactory default
// (primaryKey + columns + created_at/updated_at): unlike every other
// table in this codebase, `order_items` has neither column (per migration
// 0008's own comment — "No updated_at — line items aren't mutated after
// creation" — and there's no created_at either, since a line item's time
// is the parent order's `created_at`). Using the default here would emit
// a SELECT naming columns that don't exist on this table and fail
// against real Oracle the first time `findById`/`create` ran.

const crudFactory = require('../utils/crudFactory');

const orderItems = crudFactory({
  table: 'order_items',
  columns: [
    'order_id',
    'food_id',
    'food_name_snapshot',
    'unit_price_snapshot',
    'quantity',
    'line_total',
  ],
  selectColumns: [
    'id',
    'order_id',
    'food_id',
    'food_name_snapshot',
    'unit_price_snapshot',
    'quantity',
    'line_total',
  ],
});

module.exports = orderItems;
