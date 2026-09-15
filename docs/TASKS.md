# NATRA — Task List (small, one-session-sized tasks)

Each task below is sized to be completed and verified in a single working
session (one Claude Code session, one dev sitting, etc.). Work top to bottom —
later tasks depend on earlier ones unless noted. Check items off as you go.

---

## Phase 0 — Foundation

- [x] 0.1 Create GitHub repo, folder structure (`/frontend`, `/backend`, `/docs`), root README
- [x] 0.2 Init backend project (framework, package manager, folder structure: routes/controllers/services/models)
- [x] 0.3 Init frontend project (framework, folder structure: components/pages/hooks/api)
- [x] 0.4 Set up `.env.example` for both frontend and backend, `.gitignore` for secrets
- [x] 0.5 Write DB schema doc: list all ~15 tables with columns and relationships (design only, no migration yet)
- [x] 0.6 Write migrations for core tables: users (owners/admins), restaurants
- [x] 0.7 Write migrations for: foods, categories, food_visibility
- [x] 0.8 Write migrations for: orders, order_items
- [x] 0.9 Write migrations for: payment_methods, service_areas, opening_hours
- [x] 0.10 Write migrations for: registration_payments, live_requests, admin_settings, notifications, popularity_stats
- [x] 0.11 Set up Oracle Autonomous DB connection (dev environment) + test connection script
- [x] 0.12 Set up Oracle Object Storage bucket + test upload/download script
- [x] 0.13 Write seed script: 3–4 fake restaurants with logos/covers
- [x] 0.14 Extend seed script: foods per restaurant, categories, a few sample orders
- [x] 0.15 Add health-check endpoint (`GET /health`) confirming DB + storage connectivity
- [x] 0.16 Set up basic CI (lint + build on push) in GitHub Actions

**Phase 0 exit check:** migrations run clean, seed data loads, health-check passes.

---

## Phase 1 — Backend generic handlers

- [x] 1.1 Build `crudFactory` core (generic create/read/update/delete given a schema)
- [x] 1.2 Add ownership-filtering option to `crudFactory` (scope to `restaurant_id`)
- [x] 1.3 Write unit tests for `crudFactory` against a dummy table
- [x] 1.4 Build `ownershipMiddleware` (checks req.user owns the resource)
- [x] 1.5 Build `uploadToObjectStorage` service (accepts file, folder param, returns URL)
- [x] 1.6 Add image compression + thumbnail generation to upload service
- [x] 1.7 Build `statusTransition` utility (allowed-transitions map + on-transition hook)
- [x] 1.8 Write unit tests for `statusTransition` (valid/invalid transitions)
- [x] 1.9 Build `paginate` utility (limit/offset/filter params)
- [x] 1.10 Build `phoneLookup` utility (find records by phone number, no auth)
- [x] 1.11 Implement password hashing utility (bcrypt/argon2)
- [x] 1.12 Implement owner/admin signup endpoint
- [x] 1.13 Implement owner/admin login endpoint + session/JWT issuance
- [x] 1.14 Implement auth middleware (verify token, attach req.user)
  - [x] 1.14a Extract + validate the `Authorization: Bearer <token>` header (missing header, missing `Bearer` prefix, or empty token → 401)
  - [x] 1.14b Verify the token via `jwt.verify` against `JWT_SECRET` (bad signature, malformed token, and expired token → 401, same generic message so a caller can't distinguish "tampered" from "expired")
  - [x] 1.14c Look up the decoded `sub` via `users.findById` and attach the public (no `password_hash`) user row as `req.user`; a decoded token for a since-deleted user → 401 instead of trusting stale JWT claims
  - [x] 1.14d Wire the middleware into `auth.routes.js`/`app.js` where needed, and document (module header comment) that owner-scoped routes (`ownershipMiddleware`, Task 1.4) still need a `restaurant_id` on `req.user` that this task does not add — flagged as a dependency for Task 1.15/1.16
  - [x] 1.14e Unit tests (`authMiddleware.test.js`): valid token attaches `req.user`; missing header, non-Bearer header, malformed token, invalid signature, expired token, and deleted-user token all reject with 401
  - [x] 1.14f Manual/integration verification + status update (`backend/README.md`, `docs/PROJECT_STATUS.md`, this file)
- [x] 1.15 Wire `crudFactory` to real endpoints: foods (`/api/foods`)
  - [x] 1.15a Resolve the `req.user.restaurant_id` gap flagged by 1.14d: new `restaurants` crudFactory instance (`models/restaurants.js`, `ownerColumn: 'owner_id'`) + `attachOwnerRestaurant` middleware that runs after `authMiddleware`, looks up the caller's restaurant, and attaches `req.user.restaurant_id`/`req.restaurant` for an owner (403 if they have none yet); no-ops for non-owner roles so a chained `ownershipMiddleware` naturally 403s instead
  - [x] 1.15b `foods` crudFactory instance (`models/foods.js`)
  - [x] 1.15c `food_visibility` companion-row insert on food creation (service-layer wrapper, not a DB trigger — see `docs/DB_SCHEMA.md`) — `models/foodVisibility.js` + `services/createFoodWithVisibility.js`; both inserts run in one transaction (new `crudFactory` `{ connection }` option + `config/db.js`'s `withTransaction`), so a failed second insert rolls the first back too
  - [x] 1.15d Routes + controller (`routes/food.routes.js`, `controllers/foodController.js`), mounted in `app.js`, chaining `authMiddleware` → `attachOwnerRestaurant` → `ownershipMiddleware(foodsCrud)`
  - [x] 1.15e Request validation (zod schemas for create/update payloads)
  - [x] 1.15f Tests (`food.routes.test.js` or controller-level)
  - [x] 1.15g Manual/integration verification + status update (`backend/README.md`, `docs/PROJECT_STATUS.md`, this file)
- [x] 1.16 Wire `crudFactory` to real endpoints: categories, service areas, payment methods, opening hours
  - [x] 1.16a `categories` (`/api/categories`) — full CRUD, same shape as `foods` (1.15) minus the companion-row transaction; the one to confirm the `attachOwnerRestaurant`/`ownershipMiddleware`/`requireRestaurantScope` pattern actually generalizes cleanly to a second table
  - [x] 1.16b `service_areas` (`/api/service-areas`) — full CRUD, same shape as 1.16a
  - [x] 1.16c `payment_methods` (`/api/payment-methods`) — create/list/get/update only, **no DELETE route** (decision made without a user answer to the question asked — see `docs/PROJECT_STATUS.md`'s 1.16c entry): `orders.payment_method_id`'s FK has no `ON DELETE` clause and orders are never hard-deleted, so a real delete would fail as a bare DB error for any used method; `is_active`, toggled via the same PATCH as every other field, is the only supported way to retire one
  - [x] 1.16d `opening_hours` (`/api/opening-hours`) — different shape from the other three: rows are seeded 7-per-restaurant elsewhere (schema note: "seeded on restaurant creation", `UNIQUE (restaurant_id, day_of_week)`), and that seeding task doesn't exist yet in this codebase — so this is list + update only, no create/delete route, with the seeding gap flagged as a dependency the same way 1.14d flagged 1.15's
  - [x] 1.16e Mount all four route files in `app.js`, final cross-table manual/integration verification pass, status update (`backend/README.md`, `docs/PROJECT_STATUS.md`, this file)

**Phase 1 exit check:** via curl/Postman — signup, login, create a food (owned), upload an image, list foods paginated.

---

## Phase 2 — Frontend component kit

- [x] 2.1 Extract design tokens from reference images (colors, spacing scale, font scale, radius scale)
- [x] 2.2 Set up global theme/style config using those tokens
- [x] 2.3 Build `EntityCard` (image, logo?, title, subtitle, badge?, metaLine?, cta?)
- [x] 2.4 Build `StatusBadge` (color-mapped by status value)
- [x] 2.5 Build `ImageViewer` (thumbnail → full-screen modal)
- [x] 2.6 Build `HorizontalScroller`
- [x] 2.7 Build `ResponsiveGrid` (2-col mobile → N-col desktop)
- [x] 2.8 Build `EmptyState`
- [x] 2.9 Build `QuantityStepper` (−/number/+)
- [x] 2.10 Build `FormField` (label + input/textarea/select + validation message)
- [x] 2.11 Build `ToggleSwitch`
- [x] 2.12 Build `ImageUploadField` (client-side preview + compression before upload)
- [x] 2.13 Build `SearchBar`
- [x] 2.14 Build `FilterBar` (dropdowns/chips)
- [x] 2.15 Build `Modal` (base, used to host ImageViewer/confirmations)
- [x] 2.16 Build `ListWithPagination`
- [x] 2.17 Build `RoleShell` — customer bottom-nav variant
- [x] 2.18 Build `RoleShell` — owner 4-tab nav variant
- [x] 2.19 Build `RoleShell` — admin sidebar variant
- [x] 2.20 Build `Stepper/Wizard` (multi-step with state)
- [x] 2.21 Set up component sandbox page/Storybook with mock data for all 16 components
- [x] 2.22 Visual QA pass: compare sandbox against reference UI images, adjust tokens

**Phase 2 exit check:** all components render correctly in isolation, visually match reference UI.

---

## Phase 3 — Customer flow

- [x] 3.1 Build API client / fetch wrapper + React hooks for data fetching
- [x] 3.2 Home screen: header + search bar (static layout, no logic yet)
- [x] 3.3 Home screen: Restaurants row wired to real API (`HorizontalScroller` + `EntityCard`)
- [x] 3.4 Home screen: Categories chips wired to real API
- [x] 3.5 Home screen: Popular Foods grid wired to real API (`ResponsiveGrid`)
- [x] 3.6 Wire search bar to filter/search endpoint
- [x] 3.7 Restaurant profile screen: header (cover, logo, name, status, phone, location, description, areas)
- [x] 3.8 Restaurant profile screen: menu list below header (single-column large cards)
- [x] 3.9 Food details screen (image, name, description, price, `QuantityStepper`, Buy Now)
- [x] 3.10 Order builder screen: selected items, quantities, subtotal/total
- [x] 3.11 Order builder: "Add another item" (same-restaurant constraint enforced)
- [x] 3.12 Customer info form (name, phone, location free-text, note) using `FormField`
- [x] 3.13 Payment method selection screen (list restaurant's configured methods)
- [x] 3.14 Payment screenshot upload using `ImageUploadField`
- [x] 3.15 Submit order endpoint (backend): validate single-restaurant, create order + order_items, generate Order ID
  - [x] 3.15a Data layer: `models/orders.js`, `models/orderItems.js` (plain crudFactory instances — no ownership scoping, this is a public endpoint with no customer accounts, per `docs/DB_SCHEMA.md`) + `utils/orderCode.js` (generates the unique `NTR-#####` `order_code`) + a unit test for the code generator's format/uniqueness
  - [x] 3.15b `services/submitOrder.js`: the transactional business logic, same `withTransaction` shape as `createFoodWithVisibility` (1.15c) — re-fetches each `food_id`'s current `price`/`name`/`restaurant_id` server-side (client-sent prices are never trusted), enforces the single-restaurant constraint (every item's food must share one `restaurant_id`, reject otherwise), computes `subtotal`/`total` from the re-fetched prices, snapshots `food_name_snapshot`/`unit_price_snapshot` onto each `order_items` row, and inserts the `orders` row + all `order_items` rows in one transaction; unit tests covering a valid order, mixed-restaurant rejection, and an unknown/hidden `food_id`
  - [x] 3.15c Route + controller (`routes/order.routes.js`, `controllers/orderController.js`) — deliberately no `authMiddleware`; zod schema for the request body (`customer_name`, `customer_phone`, `customer_location_text`, `customer_note?`, `payment_method_id`, `payment_screenshot_url`, `items: [{food_id, quantity}]`), `.strict()` so a client-supplied `subtotal`/`total`/`order_code` is rejected rather than silently dropped; controller calls `submitOrder` (3.15b) and returns `201` with the created order (including `order_code`) for 3.16; mounted in `app.js`
  - [x] 3.15d Route-level/integration tests (`order.routes.test.js`) + manual verification + status update (`backend/README.md`, `docs/PROJECT_STATUS.md`, this file)
- [x] 3.16 Order confirmation screen (success message, Order ID, Track Order button)
- [x] 3.17 Track Order screen (input Order ID + phone) wired to backend
- [x] 3.18 Order history screen (lookup by phone only)
  - [x] 3.18a Route + controller (backend): `GET /api/orders/history?customer_phone=...&page=...` on `order.routes.js`/`orderController.js`, right next to `/track` — reuses the *same* `orderLookup` (`phoneLookup`, Task 1.10) instance already built for 3.17, just calling its existing `findAllByPhone` instead of `getOrThrowByCode`, so no new lookup logic is needed, only a new schema (`customer_phone` alone, no `order_code`) + a new thin handler. Registered `/history` as a literal path segment before any future `:id` route, same reasoning `order.routes.js`'s header comment already gives for `/track`. Returns `{ rows, meta }` untouched from `paginate()` so the frontend's `usePaginatedQuery` (3.18c) needs no reshaping.
  - [x] 3.18b Route/controller tests (`order.routes.test.js`): a phone with multiple orders (correct rows, newest-first, cross-phone isolation + pagination meta), a phone with none (empty rows, not a 404 — this is a list endpoint, not a single-record lookup like `/track`), an invalid/missing `customer_phone`, and a bad `page`/`limit`. All 45 tests in the file pass under a real `npm test`; `npx eslint` clean.
  - [x] 3.18c Order History screen (frontend): phone-only input form (`FormField`, same non-empty-only validation `TrackOrder.jsx` uses) that on submit drives a `usePaginatedQuery` call to the new endpoint; render results via `ListWithPagination`, one row per order (order_code, status via `StatusBadge`, total, date). Empty state via `EmptyState` for "no orders found for that number".
  - [x] 3.18d Wire up + polish: added `/history` route in `App.jsx`; linked `TrackOrder.jsx` → `/history` ("View order history") and `OrderHistory.jsx` → `/track` ("Track it here") reciprocally, rather than repointing `RoleShell`'s fixed 4-slot bottom nav; a real `npx vite build` (124 modules) succeeds with both screens wired in; status update (`backend/README.md`, `frontend/README.md`, `docs/PROJECT_STATUS.md`, this file).

**Phase 3 exit check:** full order placed against seeded restaurant, tracked successfully, history shows it.

---

## Phase 4 — Restaurant owner: registration & Live flow

- [x] 4.1 Owner registration form (name, phone, email, password) + endpoint
- [x] 4.2 Owner login screen wired to auth
- [x] 4.3 "Request Live" screen: show one-time fee + NATRA payment info
- [x] 4.4 Request Live: payment screenshot upload step (`Stepper/Wizard`)
- [x] 4.5 Request Live: submit endpoint (creates `live_requests` row, status pending)
  - [x] 4.5a Data layer: `models/liveRequests.js`, `models/registrationPayments.js` (crudFactory instances per `docs/DB_SCHEMA.md`'s 0.10 section — `registration_payments` is 1:1 with `live_requests` via a unique FK, same relationship shape `food_visibility` has with `foods`)
  - [x] 4.5b `services/submitLiveRequest.js`: transactional business logic, same `withTransaction` shape as `createFoodWithVisibility` (1.15c) / `submitOrder` (3.15b) — re-fetches `admin_settings.registration_fee_amount` server-side (never trusts a client-sent fee amount, same "never trust the client's total" reasoning `submitOrder` uses for order pricing), inserts the `live_requests` row (`status: 'pending'`) and its `registration_payments` row in one transaction; unit tests covering a valid submission, the fee being sourced from `admin_settings` not the request body, and rollback on a failed second insert
  - [x] 4.5c Route + controller (`routes/liveRequest.routes.js`, `controllers/liveRequestController.js`) — owner-authenticated (`authMiddleware` → `attachOwnerRestaurant`, unlike the customer order flow's public route), zod schema for the request body (`payment_screenshot_url` only — the fee amount is never accepted from the client per 4.5b), `.strict()`; controller calls `submitLiveRequest` (4.5b) and returns `201`; mounted in `app.js`
  - [x] 4.5d Route-level/integration tests (`liveRequest.routes.test.js`) + wiring `RequestLive.jsx`'s `onComplete` (previously a stated "submission coming soon — see Task 4.5" placeholder, from Task 4.4) to the real endpoint + manual verification + status update (`backend/README.md`, `frontend/README.md`, `docs/PROJECT_STATUS.md`, this file) — **Task 4.5 is now fully complete, 4/4.**
- [x] 4.6 — Pending-state screen (owner sees "Awaiting admin approval")
- [x] 4.7 Manual DB stub/test: flip a live_request to approved, confirm owner sees Live state

**Phase 4 exit check:** new owner registers, submits Live request, sees pending state. ✅ (verified 4.1-4.7; the approved/Live-state render was confirmed via the DB-flip scenario in 4.7, since no admin-approval UI exists yet to drive it for real — that's Phase 6's job)

---

## Phase 5 — Restaurant owner: management + orders

- [x] 5.1 Wire `RoleShell` owner nav with 4 tabs (Dashboard, Orders, Restaurant, Account)
- [x] 5.2 Restaurant management: profile fields (name, description) form
- [x] 5.3 Restaurant management: logo + cover image upload
- [x] 5.4 Restaurant management: categories CRUD screen
- [x] 5.5 Restaurant management: opening hours screen (per-day, `ToggleSwitch` for closed)
  - [x] 5.5a Screen scaffold: fetch and render the 7 `opening_hours` rows via the existing `GET /api/opening-hours` (Task 1.16d) — day labels in `day_of_week` order, current open/close times, a `ToggleSwitch` (Task 2.11) reflecting `is_closed` per row. Read-only at this point, no saving yet.
  - [x] 5.5b Wire per-row editing and save via the existing `PATCH /api/opening-hours/:id` (Task 1.16d) — toggling `is_closed` and/or editing times commits on save; surface the backend's merged-state validation error (`is_closed: false` with no times set) inline rather than as a generic failure. Verification + `frontend/README.md`/`docs/TASKS.md`/`docs/PROJECT_STATUS.md` updates.
- [x] 5.6 Restaurant management: service areas CRUD (add/edit/delete)
- [x] 5.7 Restaurant management: payment methods CRUD (account/phone, name, instructions)
- [x] 5.8 Restaurant management: Open/Closed toggle (no confirmation)
- [x] 5.9 Menu management: food list screen with Edit/Delete/Hide actions
- [x] 5.10 Menu management: Add Food form (name, photo, description, price, category)
- [x] 5.11 Menu management: Edit Food form (reuse Add Food form)
- [x] 5.12 Orders: incoming orders list (`ListWithPagination`)
  - [x] 5.12a Backend: owner-scoped paginated orders list endpoint (`GET /api/orders`, reusing `models/orders.js`'s `ownerColumn`/`paginateForOwner`, newest-first by `id`, `requireRestaurantScope` guard)
  - [x] 5.12b Frontend: Orders screen (`ListWithPagination`) wired to that endpoint, routed at `/owner/orders`
- [x] 5.13 Orders: order detail view (all fields — customer, items, total, payment method, screenshot, location, date, status)
- [x] 5.14 Orders: Accept/Reject actions wired to `statusTransition`
  - [x] 5.14a Backend: `services/updateOrderStatus.js` wires `statusTransition` (Task 1.7) to `orders`; new `PATCH /api/orders/:id/status` (`.strict()` schema scoped to `Accepted`/`Rejected` only — `Completed` stays out until 5.15)
  - [x] 5.14b Frontend: Accept/Reject buttons on `OrderDetail.jsx`, shown only for a `New` order, wired via `useMutation` + `refetch()`
- [x] 5.15 Orders: Complete action for Accepted orders
- [x] 5.16 Orders: Call Customer button (tel: link)
- [x] 5.17 Dashboard: new orders count + order counts summary
- [x] 5.18 Dashboard: sales summary widget
  - [x] 5.18a Backend: `services/salesSummary.js` — same hand-written raw-SQL-via-`withConnection` shape as `orderCounts.js` (5.17), since this is a `SUM` aggregate and `orders.status`/`total` aren't `crudFactory`-filterable either; scoped to `restaurant_id`, `Completed` orders only, returning at least `{ todayTotal, allTimeTotal, completedOrderCount }` from one query (not separate today/all-time round trips). New `GET /api/orders/sales-summary` route, mounted with the same `authMiddleware` → `attachOwnerRestaurant` chain (and 403-for-no-restaurant-yet behavior) as 5.17's `/orders/counts`. Unit tests: zero orders, mixed-status orders, multi-day totals.
  - [x] 5.18b Frontend: new card on `OwnerDashboard.jsx` fetched via `useApiQuery`, reusing the page's existing `noRestaurantYet` 403-hiding logic and the Orders card's loading/error/retry treatment (5.17); shows today's total + all-time total, currency-formatted. Update the page's doc comment and drop the subheading's "sales summary lands here in a later task" line. Verification + `frontend/README.md`/`docs/TASKS.md`/`docs/PROJECT_STATUS.md` updates.
- [x] 5.19 Dashboard: quick actions (Add Food, Open/Close toggle, View Orders shortcuts)
- [x] 5.20 Order notifications: browser notification + sound on new order
  - [x] 5.20a New-order detection: a polling mechanism on `OwnerDashboard` (no existing polling infra in this codebase to build on — new) that notices orders created since the last check. Reuses `GET /api/orders?page=1` (Task 5.12a, newest-first) — no new backend endpoint — comparing the top row's `id` against a `lastSeenId` ref on an interval; on a change, fetch each newly-seen order's detail (`GET /api/orders/:id`, Task 5.13) for the `customer_location_text`/`items.length`/`total` the message in 5.20b needs. Deliberately scoped to `OwnerDashboard` only, not `RoleShell` — `RoleShell` stays the presentational nav-chrome component Tasks 2.17-2.19 built (no data-fetching side effects today), and polling for real from anywhere the owner might be (not just while Dashboard is mounted) is explicitly Phase 7's "real trigger, not just UI" job (`docs/ROADMAP.md`'s own Phase 7 exit check), not this one's.
  - [x] 5.20b Browser Notification: request `Notification` permission from an explicit UI affordance on `OwnerDashboard` (browsers won't grant it from a bare page-load call), then show one native notification per order 5.20a detects, using `docs/NATRA_MASTER_PROMPT.md`'s own message template verbatim ("New order from <location> — N items — <total> ETB"). Auto-close via `setTimeout(() => notification.close(), ...)` after a few seconds, per that same doc's "disappears after a few seconds" line. Denied/unavailable `Notification` API is a no-op here, not an error — 5.20c's sound still fires regardless. Verification (deferred from the prior session) now done — see `frontend/README.md`'s own 5.20b entry for the full checklist.
  - [x] 5.20c Sound: play a short sound the instant 5.20a detects a new order, independent of 5.20b's permission state. A synthesized Web Audio beep, not a shipped audio file — this project has no audio-asset pipeline anywhere yet, and one tone doesn't need one. See `frontend/README.md`'s own 5.20c entry for the full write-up.
- [x] 5.21 Order notifications: dashboard badge/count persists after browser notification disappears
- [x] 5.22 Account tab: owner profile/password settings

**Phase 5 exit check:** owner fully configures a restaurant, receives a real order from Phase 3, moves it New → Accepted → Completed.

---

## Phase 6 — Admin

- [x] 6.1 Admin login screen wired to auth
- [x] 6.2 `RoleShell` admin sidebar nav (Dashboard, Restaurants, Orders, Platform Settings)
- [x] 6.3a Admin dashboard (backend): summary endpoint returning totals (restaurants, live, pending, orders) + recent activity feed data
- [x] 6.3b Admin dashboard (frontend): wire `AdminDashboard.jsx` to 6.3a's endpoint — totals widgets + recent activity feed list
- [x] 6.4a Restaurant management (backend): paginated admin list endpoint (platform-wide, all restaurants regardless of Live status, with a name/search filter)
- [x] 6.4b Restaurant management (frontend): `AdminRestaurants.jsx` list view wired to 6.4a via `ListWithPagination`
- [x] 6.5a Restaurant management: detail view (backend): admin-only `GET /api/admin/restaurants/:id`, platform-wide (no Live/suspended filtering, unlike the public `GET /api/restaurants/:id`)
- [x] 6.5b Restaurant management: detail view (frontend): tap-through from `AdminRestaurants.jsx`'s list rows to a new detail screen wired to 6.5a
- [x] 6.6a Live-request review (backend): paginated list endpoint for pending `live_requests`, joined with `restaurants` (name) and `registration_payments` (`payment_screenshot_url`) — same shape as 6.4a's admin restaurant list
- [x] 6.6b Live-request review (backend): `GET /api/admin/live-requests` route + controller wiring 6.6a's service in, mounted behind `authMiddleware`/`requireAdmin`
- [x] 6.6c Live-request review (backend): `GET /api/admin/live-requests/:id` detail endpoint (restaurant info + payment amount + screenshot URL) — same thin-controller shape as 6.5a
- [x] 6.6d Live-request review (frontend): `AdminLiveRequests.jsx` data wiring — `usePaginatedQuery` + a `fetchLiveRequests` query function against 6.6b's `GET /api/admin/live-requests`, plus the `RoleShell`/heading/error-state page shell, mirroring `AdminRestaurants.jsx` (6.4b)'s own data-layer half (no `SearchBar`/debounced search here — 6.6a's endpoint takes no `q` param)
- [x] 6.6e Live-request review (frontend): `AdminLiveRequests.jsx` row rendering — `ListWithPagination` wired to 6.6d's query, one row per pending request (restaurant name, payment amount, submitted date), plus its empty-state copy, mirroring `AdminRestaurants.jsx` (6.4b)'s own row/`renderItem` half
- [x] 6.6f Live-request review (frontend): detail/review screen, tap-through from 6.6e's rows, wired to 6.6c, using `ImageViewer` for the payment screenshot
- [x] 6.7a Approve/Reject (backend): reject transition — `statusTransition` (Task 1.7) wired to `live_requests` only, `pending -> rejected`, single-table write — same shape as `updateOrderStatus.js` (5.14a)
- [x] 6.7b-1 Approve/Reject (backend): two-table transactional write — `applyApproveTransaction()` in `updateLiveRequestStatus.js`, using `withTransaction` (1.15c) so one connection/session updates both `live_requests` and the parent `restaurants.live_status` together, rolling back both on any failure — the genuinely new shape 6.7b's own wording calls out, built and hand-verified on its own, not yet wired to any public entry point
- [x] 6.7b-2 Approve/Reject (backend): `approveLiveRequest(liveRequest, reviewerId)` — the exported entry point wired to 6.7b-1's transactional write, `pending -> approved`, mirroring `rejectLiveRequest`'s (6.7a) shape, replacing `onTransition`'s not-yet-implemented throw
- [x] 6.7c Approve/Reject (backend): `PATCH /api/admin/live-requests/:id/status` route + controller wiring 6.7a/6.7b in, mounted behind `authMiddleware`/`requireAdmin` — same "service(s) first, route+controller as its own step" split 6.6's own five-way split used
- [x] 6.7d Approve/Reject (frontend): Approve/Reject buttons on `AdminLiveRequestDetail.jsx` (6.6f), wired to 6.7c
- [x] 6.8 Suspend/Reactivate actions on restaurant
- [x] 6.9 Order management: view-all list with search
- [x] 6.10a Order management: filter by restaurant, status, date (backend): extend `listOrdersForAdmin`/`GET /api/admin/orders` (6.9) with optional `restaurant_id`, `status`, and `date` filters — allow-listed exact-match params, combinable with 6.9's existing `q` search
- [x] 6.10b Order management: filter by restaurant, status, date (frontend): wire `FilterBar` into `AdminOrders.jsx` (6.9) — restaurant/status/date controls calling 6.10a's new query params, alongside the existing `SearchBar`
- [x] 6.11a Order management: order detail view (backend): admin-only `GET /api/admin/orders/:id` — platform-wide single-order read (no ownership check, unlike owner's `GET /api/orders/:id`, Task 5.13a), returning the same `{ order, items, payment_method }` shape so `OrderDetail.jsx` can be reused as-is
- [x] 6.11b Order management: order detail view (frontend): make `OrderDetail.jsx` (5.13) reusable in a read-only admin mode — tap-through from `AdminOrders.jsx` (6.9/6.10b) rows to 6.11a's endpoint, with the Accept/Reject/Complete/Call Customer action row hidden for this read-only view
- [x] 6.12a Platform settings: registration fee + payment method config (backend): admin-only `GET /api/admin/settings` + `PATCH /api/admin/settings` — singleton-row read/update via `models/adminSettings.js`'s existing crudFactory instance (Task 4.3), `PATCH` validated to this task's five `registration_*` fields
- [x] 6.12b Platform settings: registration fee + payment method config (frontend): fill in `AdminSettings.jsx` (6.2's placeholder) with a form for registration fee + NATRA payment-method fields, wired to 6.12a's GET/PATCH endpoints
- [x] 6.13a Platform settings: order timeout config (backend): extend 6.12a's `PATCH /api/admin/settings` validation to also accept `order_timeout_mode` (`off`/`15m`/`30m`/`1h`/`custom`), `order_timeout_custom_minutes` (required only when mode is `custom`), and `notify_before_expiry`
- [x] 6.13b Platform settings: order timeout config (frontend): extend `AdminSettings.jsx` (6.12b) with the order-timeout controls — mode select (Off/15m/30m/1h/Custom), a conditional custom-minutes field, and a notify-before-expiry `ToggleSwitch`

**Phase 6 exit check:** admin approves the pending owner from Phase 4; that restaurant becomes Live and appears on the Phase 3 customer home.

---

## Phase 7 — Cross-cutting logic

**Note on task split (before Phase 7 started):** the original 6 tasks (7.1-7.6)
were each a multi-step piece of work spanning schema, backend, and
verification. Split into 26 lettered sub-tasks below, same convention as
Phase 5/6's a/b/c splits (e.g. 5.14a/b, 6.12a/b). Two things surfaced during
the split that weren't visible at the roadmap level:
- `orders.status` (migration 0008) only allows `New`/`Accepted`/`Completed`/
  `Rejected` — there is no `Expired`/`TimedOut` value yet, so 7.3 can't just
  "transition" orders on timeout without a design decision first (7.3a).
- No backend code anywhere writes to the `notifications` table yet (it's
  been schema-only since migration 0010); Phase 5's owner notifications
  (5.20a-c, 5.21) are `OwnerDashboard`-local polling of `GET /api/orders`,
  not table-backed. 7.5 is where that becomes real.

- [x] 7.1 Popularity aggregation query (completed order quantities by food)
  - [x] 7.1a Aggregation SQL: raw query summing `order_items.quantity` per `food_id` across orders where `status = 'Completed'`, grouped by `food_id`
  - [x] 7.1b Upsert service: write aggregation results into `popularity_stats` — update `completed_quantity`/`last_computed_at` for foods that already have a row, insert a new row for any food with sales but no row yet
  - [x] 7.1c Manual trigger endpoint: admin-only `POST /api/admin/popularity/recompute` so the aggregation can be run and checked on demand, ahead of 7.3's scheduler existing to call it automatically
  - [x] 7.1d Verification: confirm counts against a small set of test orders (only `Completed` counted, `New`/`Accepted`/`Rejected` excluded) and that re-running is idempotent (no duplicate `popularity_stats` rows)

- [x] 7.2 Wire popularity query into Popular Foods grid ranking
  - [x] 7.2a Update `listPopularFoods` (`popularFoods.js`, Task 3.5's placeholder `ORDER BY f.name ASC`) to `LEFT JOIN popularity_stats` and order by `completed_quantity DESC`, with a stable `name ASC` fallback for foods with no popularity row
  - [x] 7.2b Verify `buildPaginationMeta`/total count still behave correctly with the new join
  - [x] 7.2c Manual check: confirm the customer Home screen's Popular Foods grid (Task 3.5) reflects the new ranking with no frontend code changes needed

- [x] 7.3 Order timeout/expiry cron job (respects admin-configured setting)
  - [x] 7.3a Design decision: decide and document whether timed-out orders get a new `Expired` status (requires a migration) or are marked `Rejected` with a reason flag, since neither `orders.status`'s CHECK constraint nor `statusTransition.js`'s transitions map currently allows anything past `New`/`Accepted`/`Completed`/`Rejected`
  - [x] 7.3b Migration + `statusTransition.js` update implementing 7.3a's decision
  - [x] 7.3c Scheduler infra: a lightweight recurring job (`setInterval`-based service — no cron library exists in this codebase yet) started on backend startup
  - [x] 7.3d Query logic: find `New` orders older than the admin-configured window (`admin_settings.order_timeout_mode`/`order_timeout_custom_minutes`, Task 6.13a), skipping entirely when `order_timeout_mode = 'off'`
  - [x] 7.3e Expiry action: transition each qualifying order via `statusTransition`, using 7.3a/7.3b's approach
  - [x] 7.3f Verification: manually create an old `New` order, run the job, confirm correct behavior across each timeout mode (off/15m/30m/1h/custom)

- [x] 7.4 Notify-before-expiry logic (optional toggle from Phase 6)
  - [x] 7.4a Query logic: find `New` orders approaching (not yet past) the timeout window, only when `admin_settings.notify_before_expiry = 1`
  - [x] 7.4b Notification write: insert a `notifications` row (e.g. type `order_expiring_soon`) for the restaurant's owning user, guarded so the same order isn't notified twice
  - [x] 7.4c Wire into 7.3c's scheduler loop alongside the expiry pass
  - [x] 7.4d Verification: confirm one notification per order as it nears expiry, and none when `notify_before_expiry = 0`

- [x] 7.5 End-to-end notification wiring: owner notified on new order (real trigger, not just UI)
  - [x] 7.5a Insert a `notifications` row (type `new_order`) at the point an order is actually created — `services/submitOrder.js` (Task 3.15a) — recipient = the restaurant's owning user, not left for the frontend to infer
  - [x] 7.5b New endpoints: `GET /api/notifications` (caller's own, newest-first) and a mark-read action (`PATCH /api/notifications/:id/read` or mark-all), scoped to the authenticated user
  - [x] 7.5c Replace/extend `OwnerDashboard`'s 5.20a polling to poll 7.5b's real endpoint instead of inferring new orders from `GET /api/orders`, so it works app-wide (`RoleShell`-level) rather than only while Dashboard is mounted
  - [x] 7.5d Verification: place a real order, confirm a `notifications` row is created and the owner's existing badge/browser-notification/sound (5.20b/5.20c/5.21) fires from the real endpoint

- [x] 7.6 End-to-end notification wiring: customer notified on Accept/Reject
  - [x] 7.6a Confirm approach: customers have no account row (migration 0010's own note: customer status updates are delivered via track/polling, not a `notifications` row) — so this is polling on order-tracking (Order ID + phone), not a new table row
  - [x] 7.6b Identify or build the customer-facing order-status lookup endpoint this polls, if Phase 3's track-order screen doesn't already expose one cheap enough to poll on an interval
  - [x] 7.6c Frontend: add polling (or a manual refresh affordance) to the customer's order-tracking screen so a status change appears without a manual page reload
  - [x] 7.6d Verification: accept/reject an order as owner, confirm the customer's tracking screen reflects the new status without refresh

**Phase 7 exit check:** place an order, confirm owner gets notified live; accept it, confirm customer sees status change without refresh (or via track/polling).

---

## Phase 8 — Responsive + polish

- [ ] 8.1 Responsive pass: customer screens at mobile/tablet/desktop/large-desktop (`ResponsiveGrid`'s 768/1024/1280 breakpoints, Task 2.7)
  - [x] 8.1a `Home.jsx` — hero/search, Popular Foods grid, restaurant grid at all 4 widths
  - [x] 8.1b `RestaurantProfile.jsx` — cover/logo header, service-area chips, single-column menu list at all 4 widths
  - [x] 8.1c `FoodDetails.jsx` — large food image, info column, `QuantityStepper`/Buy Now placement at all 4 widths
  - [x] 8.1d `OrderBuilder.jsx` — cart list, totals, checkout CTA at all 4 widths
  - [x] 8.1e `CustomerInfo.jsx` and `PaymentMethod.jsx` — form/`FormField` layout at all 4 widths
  - [x] 8.1f `PaymentScreenshot.jsx` — `ImageUploadField` layout at all 4 widths
  - [x] 8.1g `OrderConfirmation.jsx` — summary layout at all 4 widths
  - [x] 8.1h `TrackOrder.jsx` and `OrderHistory.jsx` — lookup form + results list at all 4 widths
  - [x] 8.1i Design decision + fix: customer bottom-nav (Task 2.17) stays visible at every breakpoint (no reference/spec describes a wide-viewport nav shape for this role), but the 4 tabs now render in a centered, 480px-capped row instead of each stretching full-viewport-width — see `RoleShell.jsx`'s own "Bottom-nav width at wide viewports" doc comment

- [x] 8.2 Responsive pass: owner screens at all breakpoints
  - [x] 8.2a `OwnerRegistration.jsx` and `OwnerLogin.jsx` — form layout at all 4 widths
  - [x] 8.2b `OwnerDashboard.jsx` — widgets (new-orders count, sales summary, quick actions from 5.17-5.19) reflow at all 4 widths. Split into lettered sub-subtasks below, same convention as 8.1's a-i split, since this screen has one page-level layout question plus four independently-laid-out cards to verify:
    - [x] 8.2b-i Layout decision: single-column capped `.page` shell (kept, matching `AdminDashboard.module.css`'s existing convention) vs. a page-level multi-column card grid — decision documented in `OwnerDashboard.module.css`'s own comment above `.page`, no page-level grid introduced
    - [x] 8.2b-ii Page shell: verify heading/subheading spacing and the `.page` cap itself at all 4 widths per 8.2b-i's decision
    - [x] 8.2b-iii Orders card: `.newOrdersHeadline`, each `.statusSummaryRow`, and the loading/error (`.countsError` + retry) states at all 4 widths
    - [x] 8.2b-iv Order notifications card: plain text + button, and all three permission-state variants (default/granted/denied), at all 4 widths
    - [x] 8.2b-v Sales card: `.salesRow`/`.salesMeta` and its loading/error states at all 4 widths
    - [x] 8.2b-vi Quick actions card: `.openToggleRow` (status text + `ToggleSwitch`) and `.actionRow` button wrapping at all 4 widths
    - [x] 8.2b-vii Verification + status update: full pass across all cards/states at all 4 breakpoints, tick this box, log the session in `docs/PROJECT_STATUS.md`
  - [x] 8.2c `OwnerOrders.jsx` (`ListWithPagination`/`FilterBar`) and `OrderDetail.jsx` (owner mode) at all 4 widths

    **Note on task split (before 8.2c started):** split into two lettered
    sub-subtasks below, same convention as 8.2b's i-vii split, since this
    task bundles two independently-laid-out screens (a list screen and a
    detail screen) rather than one screen with multiple cards.
    - [x] 8.2c-i `OwnerOrders.jsx` — `ListWithPagination`/`FilterBar` layout at all 4 widths
    - [x] 8.2c-ii `OrderDetail.jsx` (owner mode) layout at all 4 widths
  - [x] 8.2d `OwnerRestaurant.jsx` — profile fields, logo/cover upload, hours/service-area/payment-method sub-sections at all 4 widths

    **Note on task split (before 8.2d started):** split into two lettered
    sub-subtasks below, same convention as 8.2c's i-ii split, since this
    task bundles two independently-laid-out groups of sections on one
    page — the profile-fields/logo/cover group (sharing one save-status
    banner, per this file's own header comment) and the three separate
    CRUD sub-resource sections below it — rather than one screen with a
    single layout question.
    - [x] 8.2d-i `OwnerRestaurant.jsx` — profile fields (name/description form) and logo/cover upload at all 4 widths
    - [x] 8.2d-ii `OwnerRestaurant.jsx` — categories, opening hours, service areas, and payment methods sub-sections at all 4 widths (categories added to this half's scope per 8.2d-i's session note — neither original 8.2d nor its split named it, but it's the same separate-sub-resource shape as the other three)
  - [x] 8.2e `OwnerMenu.jsx` (list) and `AddFood.jsx` (add/edit form) at all 4 widths

    **Note on task split (before 8.2e started):** split into two lettered
    sub-subtasks below, same convention as 8.2c's i-ii split, since this
    task bundles two independently-laid-out screens (a list screen and
    a form screen) rather than one screen with multiple cards.
    - [x] 8.2e-i `OwnerMenu.jsx` — food list layout at all 4 widths
    - [x] 8.2e-ii `AddFood.jsx` — add/edit form layout at all 4 widths
  - [x] 8.2f `OwnerAccount.jsx` at all 4 widths
  - [x] 8.2g `RequestLive.jsx` (`Wizard` component) and `LiveStatus.jsx` at all 4 widths
  - [x] 8.2h Verify `RoleShell`'s owner nav (Task 2.18) switches from bottom tabs to whatever wider-viewport treatment Task 2.18 defined, correctly, on every screen above

- [x] 8.3 Responsive pass: admin screens at all breakpoints
  - [x] 8.3a `AdminLogin.jsx` at all 4 widths
  - [x] 8.3b `AdminDashboard.jsx` — summary widgets (`adminDashboardSummary`, Task 6.3) reflow at all 4 widths
  - [x] 8.3c `AdminRestaurants.jsx` (`ListWithPagination`/`SearchBar`) and `AdminRestaurantDetail.jsx` at all 4 widths
  - [x] 8.3d `AdminLiveRequests.jsx` and `AdminLiveRequestDetail.jsx` at all 4 widths
  - [x] 8.3e `AdminOrders.jsx` and `OrderDetail.jsx` (admin mode, Task 6.11b) at all 4 widths
  - [x] 8.3f `AdminSettings.jsx` at all 4 widths
  - [x] 8.3g Verify `RoleShell`'s admin sidebar (Task 2.19) collapses/hides correctly at the mobile breakpoint on every screen above, since a sidebar nav is desktop-first unlike the other two roles

- [x] 8.4 Image pipeline audit: compression, responsive sizes, lazy loading
  - [x] 8.4a Re-check `uploadToObjectStorage`'s compression + thumbnail generation (Task 1.6) is actually invoked on every upload path: restaurant logo/cover (`OwnerRestaurant`), food photo (`AddFood`), payment screenshot (`PaymentScreenshot`)
  - [x] 8.4b Decide whether payment screenshots should skip thumbnailing (they're viewed full-size by admin/owner, not listed as thumbnails) and adjust 8.4a's scope accordingly
  - [x] 8.4c Add `srcset`/responsive `sizes` (or equivalent) for the food/restaurant thumbnails already generated by 1.6, wherever `EntityCard`/grids currently request only one image size

    **Note on task split (before 8.4c started):** split into two
    lettered sub-subtasks below, same convention as 8.2d/8.2e's i-ii
    splits, since this task bundles the shared component's markup
    change (a one-time edit to `EntityCard` itself, which both
    call sites route through) and the per-screen wiring of the actual
    1.6-generated URLs into that new markup (two separate call sites
    with their own data-fetching) — independently completable units
    rather than one change in one place.
    - [x] 8.4c-i `EntityCard` (Task 2.3) — add `srcset`/`sizes` (or
      equivalent) support to its `image`/`logo` slots so callers can
      pass both the 1.6 thumbnail (320w) and main compressed image as
      candidates, instead of the single `src` it takes today
    - [x] 8.4c-ii Wire the actual thumbnail/main-image URLs into
      8.4c-i's new props at both `EntityCard` call sites —
      `Home.jsx` (restaurant row, Popular Foods grid, search results)
      and `RestaurantProfile.jsx` (menu grid)
  - [x] 8.4d Add `loading="lazy"` to below-the-fold images: Home's food/restaurant grids, `RestaurantProfile`'s menu grid, `OwnerMenu`'s list
  - [x] 8.4e Manual check: confirm no layout shift (reserve image dimensions/aspect-ratio box) on the screens touched by 8.4c/8.4d

- [x] 8.5 DB indexing pass
  - [x] 8.5a Add index on `orders` for the phone-based lookup `orderTracking`/`OrderHistory` queries use (Tasks 3.17/3.18)
  - [x] 8.5b Add index supporting `popularity_stats` join used by `popularFoods.js` (Task 7.2a)
  - [x] 8.5c Add index(es) supporting `adminRestaurantsList.js`/`adminOrdersList.js` filter columns (status, restaurant_id, created_at)
  - [x] 8.5d Write the corresponding up/down migration for 8.5a-8.5c
  - [x] 8.5e Verify with `EXPLAIN`/query plan (or equivalent) that each indexed query actually uses the new index

- [x] 8.6 Loading states pass across all data-fetching screens
  - [x] 8.6a Audit `useApiQuery`/`usePaginatedQuery` (Task 2.x hooks) call sites and list which screens currently render nothing (blank) while pending
  - [x] 8.6b Add/standardize a loading UI (skeleton or spinner — pick one convention) for customer screens found in 8.6a: `Home`, `RestaurantProfile`, `FoodDetails`, `TrackOrder`/`OrderHistory` results
  - [x] 8.6c Add/standardize loading UI for owner screens: `OwnerDashboard`, `OwnerOrders`, `OwnerMenu`, `OrderDetail`
  - [x] 8.6d Add/standardize loading UI for admin screens: `AdminDashboard`, `AdminRestaurants`, `AdminOrders`, `AdminLiveRequests`
  - [x] 8.6e Add a submitting/disabled state to buttons that fire mutations (`useMutation` call sites) so double-submit isn't possible during a pending request

- [x] 8.7 Error states pass (network failure, validation failure, 404s)
  - [x] 8.7a Audit `useApiQuery`/`useMutation` error handling and list screens with no visible error UI on a failed request
  - [x] 8.7b Add a network/server-error UI (using `EmptyState` or a dedicated error variant) to the screens found in 8.7a
  - [x] 8.7c Confirm every `FormField`-based form (registration, login, restaurant profile, add food, etc.) surfaces validation errors inline, not just via a blocked submit
  - [x] 8.7d Confirm unmatched routes (`*` in `App.jsx`) and unmatched resource IDs (e.g. `/food/:id`, `/owner/orders/:id` for a missing/foreign record) both render a proper 404, not the raw dev `Placeholder`
  - [x] 8.7e Confirm expired/invalid-token API responses redirect to the correct role's login (`OwnerLogin`/`AdminLogin`) rather than showing a raw error

- [x] 8.8 Empty states pass (no orders, no foods, no restaurants, no search results)
  - [x] 8.8a `Home.jsx` — no restaurants live yet / no popular foods yet
  - [x] 8.8b `RestaurantProfile.jsx` — restaurant with no foods in a category
  - [x] 8.8c Customer search (`customerSearchController`) — no results for a query
  - [x] 8.8d `OwnerOrders.jsx`/`OwnerMenu.jsx` — no orders yet / no menu items yet
  - [x] 8.8e `TrackOrder.jsx`/`OrderHistory.jsx` — no order found for the given ID+phone / no history for the given phone
  - [x] 8.8f `AdminRestaurants.jsx`/`AdminOrders.jsx`/`AdminLiveRequests.jsx` — no results, and no results for the current filter (distinct copy from "none exist at all")

- [ ] 8.9 Accessibility/touch-target pass
  - [x] 8.9a Audit tap targets (buttons, nav items, `QuantityStepper`, `ToggleSwitch`) against a 44×44px minimum on mobile widths
  - [x] 8.9a2 Fix the tap-target gaps 8.9a's audit found (see docs/PROJECT_STATUS.md for the full list): `QuantityStepper` +/- buttons, `Modal` close button, `SearchBar` clear button, `ToggleSwitch`'s clickable wrapper, the `.linkButton`/`.linkButtonDanger` family (7 files), `FilterBar` chips/dropdown, `ImageUploadField`'s upload button
  - [x] 8.9b Run a contrast check on `DESIGN_TOKENS.md`'s color pairs (text-on-background, `StatusBadge` variants, disabled states) against WCAG AA
  - [x] 8.9b2 Resolve the WCAG AA text-contrast failures 8.9b's audit found (see docs/PROJECT_STATUS.md) — a color/design decision, not a mechanical fix, left for whoever picks this up
  - [x] 8.9c Confirm every `FormField` has a properly associated `<label>` and every icon-only button has an `aria-label`
  - [x] 8.9d Confirm visible focus states exist for keyboard navigation on all interactive elements (buttons, links, form fields), since admin is desktop/sidebar-first and likely to be keyboard-driven

**Phase 8 exit check:** manual walk-through of all 3 roles at all 4 breakpoints with no broken layouts.

---

## Phase 9 — Deployment

- [ ] 9.1 Provision Oracle Cloud VM, install Ubuntu + runtime dependencies
- [ ] 9.2 Configure production environment variables/secrets on VM
- [ ] 9.3 Set up reverse proxy / process manager (nginx + pm2 or equivalent)
- [ ] 9.4 Set up GitHub → VM deployment pipeline (Actions + SSH deploy or similar)
- [ ] 9.5 Point production DB connection to real Oracle Autonomous DB instance
- [ ] 9.6 Point production Object Storage to real bucket
- [ ] 9.7 Smoke test: full customer order flow in production
- [ ] 9.8 Smoke test: full owner registration → Live → order-handling flow in production
- [ ] 9.9 Smoke test: full admin approval + platform settings flow in production
- [ ] 9.10 Set up basic uptime/error monitoring

**Phase 9 exit check:** all 3 roles fully functional on the live production URL.

---

## Summary

| Phase | Task count |
|---|---|
| 0 — Foundation | 16 |
| 1 — Backend kit | 16 |
| 2 — Frontend kit | 22 |
| 3 — Customer flow | 18 |
| 4 — Owner registration/Live | 7 |
| 5 — Owner management/orders | 22 |
| 6 — Admin | 13 |
| 7 — Cross-cutting logic | 6 |
| 8 — Responsive/polish | 9 |
| 9 — Deployment | 10 |
| **Total** | **139 tasks** |
