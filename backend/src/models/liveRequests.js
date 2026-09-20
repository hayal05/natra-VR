// live_requests — Task 4.5a
//
// crudFactory instance for `live_requests` (docs/DB_SCHEMA.md's 0.10
// section / migration 0010). Represents one owner's request for their
// restaurant to go Live; `services/submitLiveRequest.js` (Task 4.5b) is
// the only place a row here should be created from, on the same
// transaction connection as the paired `registration_payments` insert
// below it — same `{ connection }` pattern `createFoodWithVisibility`
// (1.15c) / `orders`+`order_items` (3.15a/b) already established.
//
// `status` / `reviewed_by` / `reviewed_at` are deliberately NOT in the
// settable `columns` list: every request is created as `'pending'` (the
// column's own DB DEFAULT, migration 0010) with no reviewer yet — a
// status only ever changes later, once Phase 6's admin review screens
// exist, via `statusTransition` (Task 1.7), which should write `status`/
// `reviewed_by`/`reviewed_at` together itself rather than this model
// offering a second, easier-to-misuse path (a bare `update()` call) that
// could touch status without going through that transition logic. Same
// reasoning `models/orders.js` (3.15a) already documents for its own
// `status`/`status_updated_at` exclusion. All three are still listed in
// `selectColumns` below so a read returns the full row — e.g. Task 4.6's
// pending-state screen needs to show `status` without a second query.
//
// No `updated_at` here (unlike most tables in this codebase) — migration
// 0010's `live_requests` has only `created_at`, per docs/DB_SCHEMA.md's
// 0.10 section; `reviewed_at` is the closest thing to an "updated"
// timestamp and is already listed above. crudFactory's *default*
// selectColumns (primaryKey + columns + created_at/updated_at) would
// have named a column that doesn't exist and broken the first real
// `SELECT` — same bug class `models/openingHours.js` (1.16d) already
// caught for its own no-updated_at table. Caught here up front by an
// explicit `selectColumns`, not left to surface as an "invalid
// identifier" error at the first real read.
//
// `ownerColumn: 'restaurant_id'` is set even though Task 4.5's own
// endpoint (4.5c — owner-authenticated, single `POST`, no `:id` route)
// never uses the `*ForOwner` variants directly — same "flag it now"
// reasoning `models/orders.js` (3.15a) already used for its own
// `ownerColumn`: it's here so Task 4.6's pending-state screen (reading
// the owner's own restaurant's latest request) and Phase 6's
// admin-review screens can reuse this same instance with
// `ownershipMiddleware` (Task 1.4) / admin cross-owner reads, instead of
// a second live_requests model needing to be built then.

const crudFactory = require('../utils/crudFactory');

const liveRequests = crudFactory({
  table: 'live_requests',
  columns: ['restaurant_id', 'user_id'],
  ownerColumn: 'restaurant_id',
  selectColumns: [
    'id',
    'restaurant_id',
    'status',
    'reviewed_by',
    'reviewed_at',
    'created_at',
  ],
});

module.exports = liveRequests;
