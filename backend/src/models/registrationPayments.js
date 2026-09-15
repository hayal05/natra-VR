// registration_payments — Task 4.5a
//
// crudFactory instance for `registration_payments` (docs/DB_SCHEMA.md's
// 0.10 section / migration 0010) — the 1:1 payment-evidence companion
// row for a `live_requests` row. Every submitted request gets exactly
// one of these, inserted alongside it on the same transaction
// connection — see `services/submitLiveRequest.js` (Task 4.5b), the
// only place a row here should ever be created from. Same relationship
// shape `food_visibility` (1.15c) has with `foods`: kept as its own
// table (not columns on `live_requests`) specifically so the amount
// charged and the screenshot stay immutable even if the request is
// later reviewed and its `status` changes.
//
// `amount` is settable here (crudFactory has no way to know it must come
// from `admin_settings` rather than the request body — that "never trust
// a client-sent fee" rule is `submitLiveRequest.js`'s job to enforce, one
// layer up, same split `submitOrder.js` (3.15b) already uses for
// `subtotal`/`total`: never accepted as a request field there either,
// computed server-side before this model's `create` is ever called).
//
// Deliberately NO `ownerColumn`: this table has no `restaurant_id`
// column of its own (only `live_request_id`, per the schema doc), so it
// can't be scoped the way `foods`/`live_requests` are directly. Same
// reasoning `food_visibility` (1.15c) already documents for its own
// missing `ownerColumn` — ownership here is enforced transitively, by
// going through the `live_requests` row it belongs to.
//
// No `created_at`/`updated_at` — migration 0010 gives this table only
// `submitted_at` (`DEFAULT SYSTIMESTAMP`, same DB-managed pattern every
// other timestamp column in this codebase uses), so `selectColumns` is
// explicit rather than crudFactory's default, same reasoning
// `models/liveRequests.js` (4.5a, same task) and `models/openingHours.js`
// (1.16d) already document for their own non-standard timestamp columns.

const crudFactory = require('../utils/crudFactory');

const registrationPayments = crudFactory({
  table: 'registration_payments',
  columns: ['live_request_id', 'amount', 'payment_screenshot_url'],
  selectColumns: [
    'id',
    'live_request_id',
    'amount',
    'payment_screenshot_url',
    'submitted_at',
  ],
});

module.exports = registrationPayments;
