// orders — Task 3.15a
//
// crudFactory instance for `orders` (docs/DB_SCHEMA.md's 0.8 section /
// migration 0008). `create()` is what `services/submitOrder.js` (Task
// 3.15b) calls, on the same transaction connection as the paired
// `order_items` inserts below it — same `{ connection }` pattern
// `createFoodWithVisibility` (1.15c) established for a food + its
// food_visibility row, not a DB trigger.
//
// `status` / `status_updated_at` / `expires_at` are deliberately NOT in
// the settable `columns` list below: every order is created as `'New'`
// (the column's own DB DEFAULT, migration 0008) with no
// `status_updated_at` yet — a status only ever changes later, via
// `statusTransition` (Task 1.7, expected to be wired to orders by Phase
// 5's Accept/Reject/Complete actions), which should write `status` and
// `status_updated_at` together itself rather than this model offering a
// second, easier-to-misuse path (a bare `update()` call) that could touch
// status without going through that transition logic. `expires_at`
// similarly stays unset here — it's populated from the admin-configured
// order-timeout setting, which doesn't exist until Phase 7. All three are
// still listed in `selectColumns` below so a read returns the full row.
//
// `ownerColumn: 'restaurant_id'` is set even though this task's own
// endpoint (3.15c — public, no-auth) never uses the `*ForOwner`
// variants — it's here so Phase 5's owner-facing order list/detail/
// accept/reject screens (5.12-5.15) can reuse this same instance with
// `ownershipMiddleware` (Task 1.4), the same way `foods` (1.15b) already
// does, instead of a second orders model needing to be built then.

const crudFactory = require('../utils/crudFactory');

const orders = crudFactory({
  table: 'orders',
  columns: [
    'order_code',
    'restaurant_id',
    'customer_name',
    'customer_phone',
    'customer_location_text',
    'customer_note',
    'payment_method_id',
    'payment_screenshot_url',
    'subtotal',
    'total',
  ],
  ownerColumn: 'restaurant_id',
  // Explicit, not the default (primaryKey + columns + created_at/
  // updated_at): includes the three DB-managed/status fields above,
  // which aren't in `columns` (not settable via create/update here) but
  // still need to come back on a read — e.g. the 3.15c response includes
  // `status` so the customer's confirmation screen (Task 3.16) can show
  // "New" without a second round trip.
  selectColumns: [
    'id',
    'order_code',
    'restaurant_id',
    'customer_name',
    'customer_phone',
    'customer_location_text',
    'customer_note',
    'payment_method_id',
    'payment_screenshot_url',
    'subtotal',
    'total',
    'status',
    'status_updated_at',
    'expires_at',
    'created_at',
    'updated_at',
  ],
});

module.exports = orders;
