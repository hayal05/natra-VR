// paymentMethods — Task 1.16c
//
// crudFactory instance for `payment_methods` (docs/DB_SCHEMA.md's 0.9
// section). `ownerColumn: 'restaurant_id'`, same shape as `categories`/
// `service_areas` (1.16a/b) — but `is_active` (default 1 at the DB
// level, per the schema doc) is deliberately included in the allowed
// column set here even though `controllers/paymentMethodController.js`'s
// create schema never sets it: the column needs to be *updatable* (the
// whole point of the "hidden from checkout without deleting history"
// note is a toggle, not a delete), it just isn't part of creation.
//
// No `removeForOwner` route is exposed at all for this table — see
// `controllers/paymentMethodController.js`'s header comment for the full
// reasoning (an FK from `orders.payment_method_id`, added in the same
// migration this table is, with no `ON DELETE` clause, plus orders are
// never hard-deleted, so a real delete would fail as a bare DB error for
// any method that's ever been used — `is_active` is the only supported
// way to retire one).

const crudFactory = require('../utils/crudFactory');

const paymentMethods = crudFactory({
  table: 'payment_methods',
  columns: ['restaurant_id', 'method_name', 'account_number', 'account_name', 'instructions', 'is_active'],
  ownerColumn: 'restaurant_id',
});

module.exports = paymentMethods;
