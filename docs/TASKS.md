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

## Phase 10 — Radical UI Redesign (reference-image driven)

See `docs/UI_REDESIGN_ROADMAP.md` for the reference images, the
governing rule, and the per-page feasibility findings this phase is
built from. **Restyle only, using real app data/behavior — no invented
features, no invented icons/logos/text — except 10.3e2 (Owner
Dashboard hourly sales chart) and the literal text "NATRA" allowed as
a plain-text header (no logo mark) on every page.** Scope is these 4
in-scope pages only, not a full-app pass; more pages/phases will be
added here as further reference images/page selections come in.

**Standing rule — device-size compatibility (project owner):** no Phase
10 task may compromise layout at any device size. Every task is
verified in a real render at 320 / 390 / 768 / 1024 / 1280 / 1920px plus
a short landscape phone before its box is ticked, in addition to each
screen's own `10.x-h`/`10.x-f` pass. Full wording and build rules:
`docs/UI_REDESIGN_ROADMAP.md`, Working process rule 6.

- [x] 10.0 Shared redesign kit (built once, reused across 10.1–10.4 — same "kit before screens" approach as Phase 2)
  - [x] 10.0a Confirm new palette/gradient values needed for the redesign against `docs/DESIGN_TOKENS.md`, reusing the existing WCAG-AA-safe tokens (Task 8.9b2) wherever the reference's color is close enough, adding new tokens only where genuinely new (e.g. the header gradient) — document old→new/new-addition in `DESIGN_TOKENS.md`, same convention 8.9b2 used
  - [x] 10.0b New shared `DashboardHeader` component, split into one element per task (same "one card, one concern" split Task 8.2b used):
    - [x] 10.0b-i Component shell + gradient background container only (no content yet)
    - [x] 10.0b-ii "NATRA" plain-text header (the one named exception — text only, no logo mark/icon)
    - [x] 10.0b-iii Subtitle text block as a prop (each caller supplies its own real subtitle — e.g. "Owner Dashboard"/"Admin Dashboard")
    - [x] 10.0b-iv Notification indicator as plain text + real unread count (e.g. "Notifications (3)" as a text link) — no bell icon, since none exists in the codebase
    - [x] 10.0b-v Account/profile element as a plain text link (e.g. the owner's/admin's name or "Account") to the real account/settings route, passed as a prop — no avatar icon/image, since `users` has no photo field and no avatar asset exists
    - [x] 10.0b-vi Assemble i–v into the full header layout (spacing/alignment only — no new visual elements)
  - [x] 10.0c New shared `Greeting` component:
    - [x] 10.0c-i Time-of-day text logic (Good morning/afternoon/evening, computed client-side, no backend needed) — text only, no sun/moon icon (none exists in the codebase)
    - [x] 10.0c-ii Subtitle line, text passed as a prop (the two dashboards' subtitles differ)
  - [x] 10.0d New shared `StatTile` component:
    - [x] 10.0d-i Base tile shell (count + label, typography/color only — no icon)
    - [x] 10.0d-ii Color-variant prop (background/text color only, so callers can pick a themed tile without duplicating the shell)
    - [x] 10.0d-iii Optional link affordance (plain text, e.g. an underlined label or a text arrow character — not an icon asset — only renders when a destination is passed)
  - [x] 10.0e New shared `QuickActionTile` component:
    - [x] 10.0e-i Base tile shell (text label only — no icon)
    - [x] 10.0e-ii Optional caption line under the label
    - [x] 10.0e-iii Toggle-state variant (needed only for the Open/Closed tile, 10.3d-i) — confirm it can wrap the existing `ToggleSwitch` rather than reimplementing toggle behavior
  - [ ] ~~10.0f `IconCategoryTile`~~ — dropped as its own component: with per-category icons ruled out (categories are owner-defined free text with no icon field, and no icon set exists to draw from), this collapses to a text-label tile/chip. Folded into 10.2c below instead of kept as a separate "icon tile" component.

- [x] 10.1 Login screens (`OwnerLogin.jsx` + `AdminLogin.jsx`) — reference: login card image
  - [x] 10.1a Build the card/page shell: soft gradient page background, white rounded card, orange top accent bar — shared between both screens (same pre-auth "no RoleShell" shape both already use)
  - [x] 10.1b "NATRA" plain-text header on the card (the named exception) — text only, no dot mark/logo icon (the reference's own orange-dot mark is not built)
  - [x] 10.1c-i Restyle the Email `FormField` to the rounded, filled-gray input style (both screens) — keep the label **"Email"**, not "Username, email, or phone number" (login is email-only in `authController.js`, see roadmap)
  - [x] 10.1c-ii Restyle the Password `FormField` the same way (both screens)
  - [x] 10.1d Restyle the primary submit button (bold orange full-width pill) — "Log in" on both screens
  - [x] 10.1e `OwnerLogin.jsx` only: restyle "Don't have an account? Create one" link + the existing `successBanner`/session-expired notice to the new palette
  - [x] 10.1f `AdminLogin.jsx` only: restyle its existing session-expired notice/inline error to the new palette — confirm no create-account link is added (none exists for admin by design)
  - [x] 10.1f2 *(added — gap found during 10.1f)* `OwnerLogin.jsx` only: restyle its inline credentials error (`.formError`, the `role="alert"` "Invalid email or password." message) to the same tinted-banner treatment 10.1f gave `AdminLogin` — neither 10.1e (link + banners) nor 10.1f (admin) covered the owner screen's copy of this error, so the two login screens currently differ. CSS-only; values are already decided in `AdminLogin.module.css`'s `.formError` (Task 10.1f)
  - [x] 10.1g Confirm no "Forgot password?" link is added to either screen — no backend flow exists for it (flag as a real future feature in the roadmap doc, don't build a dead link)
  - [x] 10.1h Responsive/verification pass at all 4 breakpoints for both restyled screens

- [x] 10.1z *(added — project owner request, cross-cutting, not login-specific)* Fix restaurant cover/profile photo and food thumbnail/card image sizing app-wide so each renders at a fixed, designed aspect ratio regardless of the uploaded photo's own pixel dimensions — currently reported as expanding to the size of whatever photo was uploaded. Covers: `RestaurantProfile.jsx`'s cover/logo, `EntityCard`'s image/logo (restaurant + food cards, Home + RestaurantProfile's menu), `FoodDetails.jsx`'s hero photo, `OrderBuilder.jsx`'s cart-line thumbnail, `OwnerRestaurant.jsx`/`AddFood.jsx`'s `ImageUploadField` preview, and `ImageViewer`'s thumbnail trigger (payment screenshots, `AdminRestaurantDetail.jsx`'s cover/logo). Audit every image-bearing component for one that delegates its sizing entirely to caller CSS with no built-in fallback, not just the ones with an obviously-missing dimension — fix that pattern itself, not just its current symptom.

- [x] 10.1z2 *(added — project owner request, follow-up to 10.1z)* On the
  Customer Home screen, give the restaurant-card and food-card images
  their own wider aspect ratios instead of sharing `EntityCard`'s default
  `4 / 3` — at these cards' actual rendered width, `4 / 3` reads as
  close to square, not the visibly landscape cover-photo/thumbnail boxes
  in `docs/reference_ui/phase10_customer_home_reference.jpg`. Added
  `EntityCard`'s new `mediaAspectRatio` prop (inline-style override of
  `.media`, default untouched for every other caller — RestaurantProfile's
  menu, FoodDetails' hero, OwnerOrders, none of which are Phase 10 pages)
  and wired it from `Home.jsx`: `2 / 1` on restaurant cards, `3 / 2` on
  food cards (both browse and search-results instances of each) — two
  different values, not one shared override, since the reference shows
  the restaurant cover photo noticeably wider/shorter than the food
  thumbnail. Scoped to the image box only; the rest of 10.2's Customer
  Home restyle (header band, card content, categories, CTAs) is still
  its own unstarted task below.

- [x] 10.2 Customer Home (`Home.jsx`) — reference: Natra-branded home image
  - [x] 10.2a-i Header: solid orange band container, replacing the current plain header (no content placement yet)
  - [x] 10.2a-ii Add the "NATRA" plain-text header inside the band (the named exception — text only, no logo icon) and move/restyle the existing search bar inside the same band — confirm no "Sign up" button or notification bell are added (no customer accounts/notifications, see roadmap)
  - [x] 10.2b-i Restaurants section: layout shell only — 2-column grid container replacing the current `HorizontalScroller` row (no card content changes yet)
  - [x] 10.2b-ii Restaurant card content restyle within that grid: photo, name, `location_text`/service-area count line — real fields only, no star rating/review count (no schema support)
  - [x] 10.2b-iii Open/Closed status badge placement/restyle on the card (text/color badge, no icon)
  - [x] 10.2c-i Categories section: row layout of plain text tiles/chips (no per-category icons — none exist to draw from, see 10.0f note), "All" tile included
  - [x] 10.2c-ii Wire the restaurant's real category list into the tiles (active/selected state on the currently-selected category)
  - [x] 10.2d-i Popular Foods grid: 3-column layout shell (no CTA restyle yet)
  - [x] 10.2d-ii Restyle each card's CTA from the "Order Now" bar to a compact round button showing a plain "+" character (typography, not an icon asset) — same underlying link to `FoodDetails` as today (no instant add-to-cart interaction, see roadmap)
  - [x] 10.2e Bottom nav restyle to the new active-state treatment, reusing the real existing nav icons (`HomeIcon`/`CategoriesIcon`/`OrdersIcon`/`LoginIcon` — already real, not new) with the real 4 items (Home/Categories/Orders/**Login**) — confirm no Profile tab is added
  - [x] 10.2f Responsive/verification pass at all 4 breakpoints

- [x] 10.2z *(added — found in the Phase 10 exit check, decided (b) and built)* Customer Home's Popular Foods cards (3-column grid) can't fit their own text on phones, so the **price is truncated to an ellipsis**. Measured in a real render (visible px of the price "120 ETB", which needs 58px): **320px: 13px** ("1…"), **390px: 37px** ("12…"), fully visible from 768px up; the title shows about half at 390px ("Specia…", 77 of 123px). Cause: at 390px each card is 109px wide, so after 16px body padding each side the body is 77px, and the 32px round "+" plus its gap takes 40 of it, leaving the price 37px. The reference's own cards are the same ~110px wide but use much smaller type and a ~15px "+", so the price fits there. The restaurant cards clip slightly too at 390px ("Test2's Resta…", ~10px short). Nothing overflows the card — this is legibility, but of the price, the one number a customer needs. Options: (a) at narrow widths (~<420px) move the "+" onto the photo's bottom-right corner and trim the body's horizontal padding to `--space-sm`, so the price gets ~69px at 320px and ~93px at 390px (recommended: keeps text at the reference's sizes, keeps the "+", small deviation from the reference's "+" position); (b) hide the "+" below ~420px (the whole card is already the link, so nothing is lost functionally); (c) shrink the card text below the reference's sizes on phones; (d) accept as-is. **Decided by the project owner: option (b) — hide the "+" on phones (tapping the card already opens FoodDetails).** Built: `Home.module.css` hides it below 520px (raised from the ~420px in the option text, because 520px is where it fits again beside a fractional price like "130.50 ETB"), through a new `--entity-card-cta-display` hook on `EntityCard`'s `.ctaSlot` so the empty slot's gap goes too. **One addition beyond the option as worded:** below 520px the food cards' side padding is also 16→12px (`--entity-card-pad-x` hook on `EntityCard`'s `.body`), because hiding the "+" alone still left a 3-digit price 5px short at 320px ("120 ET…"). Both hooks default to the old values, so every other `EntityCard` caller is unchanged. Result (real render): every whole-number price fully visible at every width 320→1920; "130.50 ETB" fully visible from 390px, still ~19px short at 320px and ~5px short at 360px. Titles/restaurant names still ellipsize on phones (unchanged).

- [x] 10.2z2 *(added — found in the Phase 10 exit check, decided (b) and built)* Customer Home's header still renders a **bell icon** (`BellIcon` in `Home.jsx`, an `aria-hidden` SVG with no link, count or behavior) next to the "Sign up" button — both from Task 8.7h, before Phase 10. Task 10.2a-ii is ticked with the instruction "confirm no 'Sign up' button or notification bell are added (no customer accounts/notifications)", and Phase 10's governing rule drops every fake icon ("no bell icon exists anywhere in the codebase"); the header comment in `Home.jsx` also says both were deliberately added in 8.7h. Customers have no notifications, so the bell does nothing. The customer reference image *does* show a bell and "Sign up" in that spot. Options: (a) keep both as they are (they match the reference and 8.7h was a deliberate addition; record it as an accepted exception to the rule); (b) remove the bell, keep "Sign up" (which does route to the real `/owner/register`); (c) remove both. **Decided by the project owner: option (b) — drop the bell, keep "Sign up".** Built in `Home.jsx`/`Home.module.css`: `BellIcon` and its use removed; the now-single-child `.headerActions` wrapper removed too (the "Sign up" button is a direct child of `.brandRow`, which still puts it opposite the wordmark); `.bellIcon`/`.headerActions` CSS deleted; stale bell comments updated. Verified in a real render at 320/390/1280: "Sign up" is 84×44px, its right edge lines up with the search bar's, no overflow; the only SVG left in the header is `SearchBar`'s real search icon.

- [x] 10.3 Owner Dashboard (`OwnerDashboard.jsx`) — reference: Owner Dashboard image
  - [x] 10.3a-i Wire `DashboardHeader` (10.0b) with "Owner Dashboard" as the subtitle (NATRA text header comes from the shared component)
  - [x] 10.3a-ii Wire the real notification count (owner notifications, Task 7.5) into the text-based indicator
  - [x] 10.3a-iii Wire the account text link to `/owner/account`
  - [x] 10.3b Wire the shared `Greeting` (10.0c) above the stat grid, with this screen's own subtitle copy
  - [x] 10.3c-i Total Orders `StatTile` (10.0d), derived from the existing `GET /orders/counts` response
  - [x] 10.3c-ii Completed `StatTile`, same data source
  - [x] 10.3c-iii Rejected `StatTile`, same data source
  - [x] 10.3c-iv Pending `StatTile` (New+Accepted), same data source
  - [x] 10.3c-v Assemble i–iv into the 2×2 grid layout
  - [x] 10.3d-i Open/Closed `QuickActionTile` — wraps the existing `ToggleSwitch`/`is_open` mutation, no new logic
  - [x] 10.3d-ii Add Food `QuickActionTile` — existing `/owner/restaurant/menu/new` link
  - [x] 10.3d-iii View Orders `QuickActionTile` — existing `/owner/orders` link
  - [x] 10.3d-iv Check Live status `QuickActionTile` — existing `/owner/live-status` link (moved out of the separate "Get your restaurant Live" card into this row)
  - [x] 10.3d-v Assemble i–iv into the single Quick Actions row, replacing the two old cards
  - [x] 10.3e-i Restyle the existing Today/All-time totals into the new card treatment
  - [x] 10.3e-ii Restyle the existing completed-order-count line the same way
  - [x] 10.3e2-i **(exception — new backend work)** Add an hourly-sales aggregation endpoint (bucket today's `Completed` orders by hour), alongside the existing `salesSummary.js` service
  - [x] 10.3e2-ii Render 10.3e2-i's data as a line chart in the Sales Overview card
  - [x] 10.3f-i Restyle Recent Order Notifications list rows (real `notifications` data)
  - [x] 10.3f-ii Restyle its existing empty state to match
  - [x] 10.3g Restyle the bottom nav to the new active-state treatment, reusing the real existing nav icons (`DashboardIcon`/`OrdersIcon`/`StorefrontIcon`/`ProfileIcon`) with the real 4 items (Dashboard/Orders/Restaurant/Account)
  - [x] 10.3h Responsive/verification pass at all 4 breakpoints

- [x] 10.3z *(added — found during 10.3h, decided and built)* `HourlySalesChart.jsx`'s axis labels don't keep a stable size across widths: the chart is a fixed 320-unit SVG viewBox scaled to its card, so its 12px labels render at ~9.5px on a 320px phone but ~21.5px at every width from 768px up (measured in a real render; see `docs/PROJECT_STATUS.md`'s 10.3h entry). Nothing overflows or clips — this is legibility/proportion only. Decide between (a) measuring the container's real width and using it as the viewBox width so text stays 12px at every size (changes the chart's aspect ratio at wide widths), (b) capping `.chart`'s `max-width` and centering it (fixes wide only, leaves 9.5px at 320px), or (c) accepting it as-is. **Decided by the project owner: option (a).** Built in `HourlySalesChart.jsx`: the viewBox width is now the SVG's measured width (`ResizeObserver` in a layout effect, `window` `resize` fallback), so labels are exactly 12px at every width (320→1920, measured in a real render; was 9.5px at 320 and 21.5px from 768 up). Because that changes the aspect ratio, the viewBox height now grows with width (clamped 120–180px) instead of the chart going very flat; label spacing is chosen from the real plot width (every 3h, more if a 24-hour window needs it); and `PAD_LEFT`/`PAD_RIGHT` went 16→20 so the first/last labels no longer overhang the SVG edge (the old chart clipped "11pm" by 1–2px at every width). No other file changed except a comment in `HourlySalesChart.module.css`.

- [x] 10.4 Admin Dashboard (`AdminDashboard.jsx`) — reference: Admin Dashboard image
  - [x] 10.4a-i Wire `DashboardHeader` (10.0b) — "NATRA" text header comes from the shared component, no separate branding text needed
  - [x] 10.4a-ii Wire the real notification count into the text-based indicator
  - [x] 10.4a-iii **Decided by the project owner:** build a minimal `AdminAccount` page now (profile + password + admin logout) — see `docs/PROJECT_STATUS.md`'s own 10.4a-iii entry for the new screen/route/wiring
  - [x] 10.4b Wire the shared `Greeting` (10.0c) above the totals grid, with this screen's own subtitle copy
  - [x] 10.4c-i Restaurants `StatTile` (10.0d), from `adminDashboardSummary`'s real `restaurants` field
  - [x] 10.4c-ii Live `StatTile`, from the same response's `live` field
  - [x] 10.4c-iii Pending `StatTile`, from the same response's `pending` field
  - [x] 10.4c-iv Orders `StatTile`, from the same response's `orders` field
  - [x] 10.4c-v Assemble i–iv into the 2×2 grid layout
  - [x] 10.4d-i Add a leading status-pill treatment (Pending/New/Accepted/Completed/Approved, color-coded text badge, no icon) to each recent-activity row
  - [x] 10.4d-ii Restyle the row's existing truncated label + timestamp around that new pill (plain text, no chevron icon — a text arrow character if a directional cue is wanted, not an icon asset)
  - [x] 10.4e **Decision needed, not assumed:** confirm with project owner whether the bottom-tab nav becomes the primary admin chrome at all widths (replacing the sidebar) or stays the <768px-only fallback it is today (Task 8.3g) alongside a separately-restyled sidebar for ≥768px **Decided by the project owner: option (b) — bottom tabs stay the <768px fallback, sidebar stays the ≥768px chrome, with the sidebar restyled (done in 10.4f).** No structural change to `RoleShell`'s two-render split.
  - [x] 10.4f Responsive/verification pass at all 4 breakpoints, including whichever outcome 10.4e lands on — done in a real headless-Chromium render (320/390/767/768/1024/1280/1920 + 667x375 landscape, 6 admin routes, plus loading/error/empty states on the dashboard): no horizontal overflow, exactly one nav visible at every width, all nav tap targets ≥44px, header link hit areas intact. Built: sidebar restyle (`RoleShell.module.css`: rounded pills, primary-tint active state + short rounded left bar, hover, focus ring, 44px floor) and the orange active-tab underline on the admin bottom bar (`.navInnerAdmin`; the admin reference shows it, the bar was missing it). `AdminAccount.jsx` rendered and checked at every width. One defect found and logged as 10.4z below, not fixed.

- [x] 10.4z *(added — found during 10.4f, option (a), built; pre-dates 10.4e/f, introduced when 10.4d-i put a status pill ahead of each row)* `AdminDashboard.jsx`'s Recent activity rows squeeze the description to almost nothing on phones: `.activityDescription` is single-line with an ellipsis, and the row also holds the status pill and a nowrap timestamp. Measured in a real render (visible px of the description, shortest to longest row): **320px: 9–45px of 186–245px** (1–3 characters); 360px: 49–85px; 390px: 79–115px; 480px: 169–205px; fully visible from ~600px up, and at every width ≥768px (the sidebar leaves ~548px). Nothing overflows or clips outside its card — this is legibility only, and `docs/reference_ui/phase10_admin_dashboard_reference.jpg` itself shows ellipsis at phone width, so only the 320px end is clearly wrong. Options: (a) below a narrow breakpoint (~≤400px), let the timestamp wrap onto its own line under the pill+description so the description gets the full row (CSS-only, keeps single-line rows at ≥400px like the reference); (b) let the description wrap to 2 lines at all widths (taller, less uniform rows); (c) accept as-is. **Built as option (a)** (the recommended one, taken when the project owner moved on to the next task without picking): `AdminDashboard.module.css` only — below 390px each row wraps and the timestamp sits on its own line under the pill + description (`@media (max-width: 389px)`). 390px and up is byte-for-byte the previous layout (checked: identical visible widths), so the reference-matching single-line rows are untouched; only the narrower phones the reference doesn't cover change. Measured visible description px after: 320px 157–201 of 186–245 (was 9–45), 360px 186–239 (full on 4 of 5 rows). Say if you'd rather have (b)/(c) — it's one media-query block to remove or swap.

- [x] 10.5 Owner Restaurant (`OwnerRestaurant.jsx`) — reference: `docs/reference_ui/phase10_owner_restaurant_reference.jpg` (added — see `docs/UI_REDESIGN_ROADMAP.md`'s own "Owner Restaurant" feasibility-findings entry for the full per-element check this split is based on) — closed out by 10.5i's own pass this session.
  - [x] 10.5a-i Hero: cover-photo layout shell — full-width photo block with the "Change cover photo" control overlaid on it, replacing the current standalone `ImageUploadField` layout (no logo/name/status content yet — same `cover_url` field, restyle only)
  - [x] 10.5a-ii Logo badge, overlapping the cover photo's bottom-left corner (same `logo_url` field/upload control, repositioned — not a new field)
  - [x] 10.5a-iii Restaurant name as a large heading below the hero, plus a one-line description preview under it, reusing the real `description` value (real single field shown twice, per the roadmap's finding — not a new tagline column); define and build the real empty-description fallback (no fake placeholder tagline)
  - [x] 10.5a-iv-i Move the `StatusBadge` (Open/Closed) into `.identityRow`'s new layout, beside the name/tagline block — visual position only, same real `is_open`-derived badge, no new state
  - [x] 10.5a-iv-ii Move the "Customers can order from you right now" `ToggleSwitch` to sit next to the relocated `StatusBadge`, confirming its existing immediate-commit `is_open` update (no new confirmation step) still fires correctly from the new position
  - *(Note on split: original 10.5a-iv split into i/ii — badge move, then toggle move — same one-element-at-a-time convention as 10.5a-i/ii/iii, since the pair sits in two different source locations today (`.openToggleRow`) and each needs its own move + re-verification.)*
  - [x] 10.5b-i Restyle the Restaurant name + Description form fields into the new card treatment (rounded card, restyled `Save changes` button, existing save-error/"Saved" states carried over unchanged)
  - [x] 10.5b-ii **Decided by the project owner: option (b) — drop the counter, keep Description uncapped.** "Don't fake anything — consider what's in the code only": `description` is a real unbounded CLOB with no server-enforced cap anywhere (`restaurantController.js`), so a "0/500" counter would display a limit that doesn't exist. Build the Description field with no character counter and no client-side `maxLength`.
  - [x] 10.5c-i Categories card: icon+title+"Add category" header restyle (same panel-header treatment `10.3d`/`10.4c` already established), replacing the current plain section heading + button
    - *(Split note, 10.5c–10.5i: each card gets **new** classes (`.sectionCard`, `.addPill`, …) applied one section per task instead of editing the shared `.section`/`.addButton`/`.linkButton`, same reasoning 10.5b-i used for `.saveButton` vs `.submitButton`; 10.5f-iii deletes the dead CSS. **Decided by the project owner: option (a) — stay text-only, no code change.** The reference's per-card icons (fork/clock/pin/card) don't exist in the codebase and the governing rule drops every non-real icon, so every card header below is built **text-only** (title + action), same as the 10.3/10.4 tiles. No new SVGs to be added.)*
    - [x] 10.5c-i-a New `.sectionCard` class (surface, border, radius, shadow, padding — same recipe as `.form`), applied to the Categories `<section>` only. **Built — see `docs/PROJECT_STATUS.md`'s 10.5c-i-a entry.**
    - [x] 10.5c-i-b Categories header row: title left, action slot right, both wrap. Heading typography only, no icon
    - [x] 10.5c-i-c New `.addPill` class (outlined orange pill, 44px min-height), applied to "Add category" only — `.addButton` untouched for the other two cards. **Built — see `docs/PROJECT_STATUS.md`'s 10.5c-i-c entry.**
  - [x] 10.5c-ii Restyle the category chip/row list and its existing Edit/Delete controls and `EmptyState` copy to match — same data/actions, no new ones
    - [x] 10.5c-ii-a Category name as a tinted rounded chip; long names wrap, never truncate (**also fixes** the pre-existing long-unbreakable-word overflow at 320px flagged in 10.5c-i-a's log entry: `.listRowName` has no wrap rule)
    - [x] 10.5c-ii-b Edit / Delete as underlined orange / red text links, ≥44px hit area, scoped to Categories rows (`.linkButton` also serves Opening hours' Save, Payment Edit, the menu link)
    - [x] 10.5c-ii-c Row layout: chip + actions side by side when wide, actions wrap below when narrow
    - [x] 10.5c-ii-d Inline load error ("Couldn't load categories…") restyled inside the card, copy unchanged
    - [x] 10.5c-ii-e `EmptyState` inside the card, copy unchanged
    - [x] 10.5c-ii-f *Verify only:* `ListWithPagination` loading label and pager look right inside the card (shared component — flag any clash, don't edit it) **Verified by real render 2026-09-21; no code change. One clash flagged: pager buttons are 34px tall (< 44px floor). Decided by the project owner 2026-09-22: option (a) — fix globally in the shared component. `min-height: 44px` added to `.pageButton` in `ListWithPagination.module.css`, applying to all 7 call sites (Categories, Service areas, Payment methods, OwnerMenu, OwnerOrders, AdminOrders, AdminRestaurants, AdminLiveRequests). Needs a real-render check across those screens — not yet done this session (no network/browser access). See `docs/PROJECT_STATUS.md`'s 10.5c-ii-f entry.**
  - [x] 10.5d-i Opening hours card: icon+title header restyle, matching 10.5c-i's treatment
    - [x] 10.5d-i-a Apply `.sectionCard` to the Opening hours section **Built 2026-09-21, plus a 320px time-field overflow guard — see `docs/PROJECT_STATUS.md`'s 10.5d-i-a entry.**
    - [x] 10.5d-i-b Header row: title only, no action button (none exists in the code) **Verified 2026-09-21, no code change — already title-only with the shared `.sectionHeading` typography; see `docs/PROJECT_STATUS.md`'s 10.5d-i-b entry.**
  - [x] 10.5d-ii Restyle the existing loading / error (real `openingHoursError` copy, unchanged) / empty (real `EmptyState` copy, unchanged) / per-day editing states to match — no new states invented
    - [x] 10.5d-ii-a Real `openingHoursError` state restyled (the reference shows this one), copy verbatim **Built 2026-09-21 as a new scoped `.openingHoursLoadError` class — see `docs/PROJECT_STATUS.md`'s 10.5d-ii-a entry.**
    - [x] 10.5d-ii-b Loading state restyled **Built 2026-09-21 as a new scoped `.openingHoursLoading` class — see `docs/PROJECT_STATUS.md`'s 10.5d-ii-b entry.**
    - [x] 10.5d-ii-c Empty state restyled, copy unchanged **Built 2026-09-21 as a new scoped `.openingHoursEmpty` class — see `docs/PROJECT_STATUS.md`'s 10.5d-ii-c entry.**
    - [x] 10.5d-ii-d Day-row shell (`.openingHoursRow`): day label + row container **Verified 2026-09-21, no code change — shell already equals the reference's bordered inner box; see `docs/PROJECT_STATUS.md`'s 10.5d-ii-d entry.**
    - [x] 10.5d-ii-e Closed `ToggleSwitch` placement inside the row **Built 2026-09-21 — new `.openingHoursDayGroup` pairs the day label with its own toggle; verified by real headless-Chromium render (7 viewports incl. landscape), 0 issues — see `docs/PROJECT_STATUS.md`'s 10.5d-ii-e entry.**
    - [x] 10.5d-ii-f Opens / Closes time fields, scoped so the shared `FormField` is untouched **Built 2026-09-21 as CSS-only changes on `.openingHoursTimes`: the pair now wraps (side by side when the row has room, stacked when not) so AM/PM is never clipped, and the inputs reach the 44px floor; verified by real headless-Chromium render before/after (11 viewport/locale cases: 168 issues on the original build, 0 on the fix) - see `docs/PROJECT_STATUS.md`'s 10.5d-ii-f entry.**
    - [x] 10.5d-ii-g Save link + "Saved" confirmation + per-day error. No reference exists for the editing states — reuse 10.5c's treatment and say so in the log **Built 2026-09-21: Save link gets its own scoped `.openingHoursSaveLink` (10.5c's link treatment) plus a real disabled look for "Saving...": "Saved" and the per-day error verified, no change needed. A/B real-render compare over 24 state snapshots: geometry identical, only the Saving state's style differs. Flagged a row-reflow-on-save finding — decided by the project owner 2026-09-22: option (a), leave it as-is, no code change. See `docs/PROJECT_STATUS.md`'s 10.5d-ii-g entry.**
  - [x] 10.5e-i Service areas card: icon+title+"Add area" header restyle, matching 10.5c-i's treatment (same near-exact-copy-of-Categories shape this section already has today)
    - [x] 10.5e-i-a Apply `.sectionCard` **Built 2026-09-21 - JSX-only wrapper swap (`styles.section` -> `styles.sectionCard`); A/B real-render compare over 72 snapshots (8 states x 9 viewports): card style identical to Categories' in all 72, no new problem case; a pre-existing long-unbreakable-name overflow is unchanged and belongs to 10.5e-ii-a/c - see `docs/PROJECT_STATUS.md`'s 10.5e-i-a entry.**
    - [x] 10.5e-i-b Header row, no icon **Verified 2026-09-21, no code change - the shared `.sectionHeader`/`.sectionHeading` treatment from 10.5c-i-b already applies; render-checked against Categories at 9 viewports (0 differences) plus a squeeze test of the wrap behavior; see `docs/PROJECT_STATUS.md`'s 10.5e-i-b entry.**
    - [x] 10.5e-i-c "Add area" uses `.addPill` **Built 2026-09-22 - one `className` swap (`styles.addButton` -> `styles.addPill`) on the existing button, no new CSS (reused `.addPill` from 10.5c-i-c); real headless-Chromium render at 8 viewports (320-1920) with the API mocked: "Add area" pill is byte-for-byte identical in radius/border/color/font/height to "Add category"'s, only narrower (94.9px vs 124.3px, expected - shorter label); "Add payment method" unchanged (still `.addButton`, 32/46px tall, square radius); 0px horizontal overflow at 320/375/1024; click still opens the Add-area modal - see `docs/PROJECT_STATUS.md`'s 10.5e-i-c entry.**
  - [x] 10.5e-ii Restyle the area chip/row list and its existing Edit/Delete controls and `EmptyState` copy to match
    - [x] 10.5e-ii-a Area name chip **Built 2026-09-22 - new `.areaChip` (not `.categoryChip`): reference pixel-sampled at high zoom shows Service areas' chip is a neutral gray pill (`--color-surface-muted` bg / `--color-text-secondary` text), not Categories' peach/orange - same pill shape, size and overflow-wrap fix as `.categoryChip` otherwise. Real headless-Chromium render, 8 viewports: shape identical to `.categoryChip` (radius, height, padding, font-size/weight), colors deliberately different and match the reference; the pre-existing 320px long-unbreakable-name overflow 10.5e-i-a flagged is fixed (0px overflow at 320/375/1024) - see `docs/PROJECT_STATUS.md`'s 10.5e-ii-a entry.**
    - [x] 10.5e-ii-b Edit / Delete links **Built 2026-09-22 - new `.areaEditLink`/`.areaDeleteLink` (full property duplication of `.linkButton`/`.linkButtonDanger`, same pattern as `.categoryEditLink`/`.categoryDeleteLink`); reference-checked first, and unlike the chip this one doesn't diverge - Service areas' Edit/Delete are the same underlined orange/red text as Categories'. Real headless-Chromium render, 8 viewports: area links identical to category links (44px min-height, same colors/font/underline) and identical to Payment methods' still-untouched `.linkButton`/plain link; Edit click still opens the edit-area modal - see `docs/PROJECT_STATUS.md`'s 10.5e-ii-b entry.**
    - [x] 10.5e-ii-c Row layout, narrow vs wide **Built 2026-09-22 - new `.areaRow`/`.areaRowActions` (full duplicate of `.categoryRow`/`.categoryRowActions`, same `flex-wrap`/`space-between` pairing, no reference divergence to check - it's a behavioral rule, not a color/shape decision). Real headless-Chromium render, 8 viewports, with a long-with-spaces area name: wrap behavior identical to Categories' at every width (both wrap under ~700px row width, sit side by side above it), 0px horizontal overflow at 320-390, Delete click still opens its confirmation with the right area name, no console errors - see `docs/PROJECT_STATUS.md`'s 10.5e-ii-c entry.**
    - [x] 10.5e-ii-d Inline load error **Built 2026-09-22 - new `.areaLoadError` (`composes: formError`, same as `.categoryLoadError`); `serviceAreasError`'s `<p>` swaps `styles.formError` for it, copy/role="alert" unchanged. Real headless-Chromium render with `/api/service-areas` mocked to 500, 8 viewports: identical color/size/weight/margin to Categories' load error at every width, sits inside the card under the header exactly like the reference's own error state, 0px horizontal overflow at 320-390 - see `docs/PROJECT_STATUS.md`'s 10.5e-ii-d entry.**
    - [x] 10.5e-ii-e `EmptyState` **Built 2026-09-22 - new `.areasEmpty` (`.sectionCard .areasEmpty`, same trim as `.categoriesEmpty`/`.openingHoursEmpty`), applied to the Service areas `EmptyState`; copy unchanged - see `docs/PROJECT_STATUS.md`'s 10.5e-ii-e entry.**
  - [x] 10.5f-i Payment methods card: icon+title+"Add payment method" header restyle, matching 10.5c-i's treatment
    - [x] 10.5f-i-a Apply `.sectionCard` **Built 2026-09-22 - JSX-only wrapper swap (`styles.section` -> `styles.sectionCard`), the fourth and last section to move; `.section` is now unused in this file's JSX - see `docs/PROJECT_STATUS.md`'s 10.5f-i-a entry.**
    - [x] 10.5f-i-b Header row, no icon **Verified 2026-09-22, no code change — `.sectionHeader`/`.sectionHeading` (10.5c-i-b's shared typography edit already covers all four sections) already apply, and no icon exists anywhere on this page — see `docs/PROJECT_STATUS.md`'s 10.5f-i-b entry.**
    - [x] 10.5f-i-c "Add payment method" uses `.addPill` — longest label, check the wrap at 320px **Built 2026-09-22 - one `className` swap (`styles.addButton` -> `styles.addPill`), no new CSS (reused `.addPill` from 10.5c-i-c); `.addButton` is now unused anywhere on this page - see `docs/PROJECT_STATUS.md`'s 10.5f-i-c entry (no real render this session — code-inspection wrap check only, flagged honestly).**
  - [x] 10.5f-ii Restyle the existing payment-method rows (method/account line + Active `ToggleSwitch` + Edit — no Delete, per Task 5.7's own deliberate scope) and `EmptyState` copy to match
    - [x] 10.5f-ii-a Row shell (the reference shows a bordered inner box) **Built 2026-09-22 - new `.paymentMethodRow` (byte-for-byte duplicate of `.listRow`'s existing border/radius/background/padding box, which already matched the reference's bordered inner box — confirmed by pixel-zooming the reference image); `.listRow` itself now has no call site, left for 10.5f-iii's cleanup - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-a entry.**
    - [x] 10.5f-ii-b Method name + `account_name · account_number` line **Built 2026-09-22 - new `.paymentMethodName` (font-weight-semibold added, matching reference's bold "CBE"); `.paymentMethodMeta` (the account line) already matched the reference, verified unchanged; separator stays the real " · " from the code, not the reference image's hyphen - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-b entry.**
    - [x] 10.5f-ii-c Optional `instructions` line, shown only when present (no reference — match the secondary text style) **Verified 2026-09-22, no code change — already conditional (`&&`) and already on `.paymentMethodMeta`, the same secondary-text class the account line uses; a code comment added for clarity - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-c entry.**
    - [x] 10.5f-ii-d Active `ToggleSwitch` + label placement **Built 2026-09-22 - new `.paymentMethodActions` (duplicate of `.listRowActions`), applied to the actions container; reference pixel-zoomed - order (toggle, "Active" label, Edit) was already correct, `ToggleSwitch` itself untouched (shared, already-built component) - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-d entry.**
    - [x] 10.5f-ii-e Edit link (no Delete, per Task 5.7) **Built 2026-09-22 - new `.paymentMethodEditLink` (full duplicate of `.linkButton`, same pattern as `.categoryEditLink`/`.areaEditLink`); confirmed no Delete button exists anywhere in this render, by design (5.7's deactivate-not-delete scope) - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-e entry.**
    - [x] 10.5f-ii-f Per-row toggle error (`toggleErrors`) **Built 2026-09-22 - new `.paymentMethodToggleError` (`composes: formError`, same as `.categoryLoadError`/`.areaLoadError`); copy unchanged (real server message or the existing fallback string) - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-f entry.**
    - [x] 10.5f-ii-g Inline load error + `EmptyState` **Built 2026-09-22 - new `.paymentMethodsLoadError` (`composes: formError`) and `.sectionCard .paymentMethodsEmpty` (same `padding: var(--space-lg) 0` trim as the other three cards); copy unchanged for both - see `docs/PROJECT_STATUS.md`'s 10.5f-ii-g entry.**
  - [x] 10.5f-iii *(added — cleanup)* Remove `.section`, `.addButton` and any other CSS no longer used after 10.5c–f (grep to confirm before deleting) **Built 2026-09-22: removed `.section`, `.addButton`, `.listRow`, `.listRowName`, `.listRowActions` (all confirmed dead by grep, as the note anticipated), plus `.linkButtonDanger` — not named in the note but found dead by the same grep sweep (both its former callers, Categories'/Service areas' Delete links, had already moved to their own scoped classes, and Payment methods never had a Delete link). `.linkButton` and `.subheading` were checked and confirmed still live — left untouched. See `docs/PROJECT_STATUS.md`'s 10.5f-iii entry.**
  - [x] 10.5g Restyle the "Menu management — manage your foods" note at the foot of the page to match the new card treatment (same existing link to `OwnerMenu.jsx`)
    - [x] 10.5g-i Container restyle: soft tinted, rounded, full-width strip (first check `.subheading` isn't used elsewhere) **Built 2026-09-22: confirmed `.subheading` has exactly one call site in the whole page (this note) so edited in place rather than adding a new class; new `background: var(--color-surface-muted)` / `border-radius: var(--radius-lg)` / `padding: var(--space-md) var(--space-lg)`, reusing `OwnerDashboard`'s existing tinted-strip recipe (`.salesTotal`/`.salesCompleted`) — no new color/radius invented. Text/link/copy untouched (10.5g-ii/iii's own scope) — see `docs/PROJECT_STATUS.md`'s 10.5g-i entry.**
    - [x] 10.5g-ii "manage your foods" link restyle, same `Link` to `/owner/restaurant/menu` **Built 2026-09-22: new `.menuManagementLink` (not an edit to `.linkButton` — same "new class per section" convention as `.categoryEditLink`/`.areaEditLink`/`.paymentMethodEditLink`), identical to `.linkButton` except `font-size: var(--font-size-body)` instead of caption, since this link sits inline inside `.subheading`'s sentence rather than standing alone as a row action — a typographic judgment call, not a pixel measurement (the reference image isn't high-enough-resolution to verify 12px vs 14px directly). `.linkButton` itself now has zero call sites in this file — flagged, not deleted here; see the added `10.5g-iv` cleanup task below. See `docs/PROJECT_STATUS.md`'s 10.5g-ii entry.**
    - [x] 10.5g-iii **Decision needed:** keep the stale "(adding/editing a food lands here in a later task)" text verbatim (default — restyle only; the reference shows it too) or drop it, since `OwnerMenu`/`AddFood` already exist **Decided 2026-09-22 — option (a), kept verbatim, now confirmed directly by the project owner** (previously taken only as the default with no project-owner input; that input has since been given and matches the default). Confirmed both routes the text claims are "a later task" already exist and are wired (`/owner/restaurant/menu` → `OwnerMenu`, `/owner/restaurant/menu/new` and `/owner/restaurant/menu/:id/edit` → `AddFood`, `frontend/src/App.jsx`), so the sentence is genuinely stale but left in place by explicit choice — flagged, not silently left ambiguous. *Verify only, no code change*: the parenthetical is plain text inside `<p className={styles.subheading}>` with no styling of its own; it already inherits 10.5g-i's container restyle (font-size/color were already correct pre-10.5g-i; only the container chrome changed) — see `docs/PROJECT_STATUS.md`'s 10.5g-iii entry.
    - [x] 10.5g-iv *(added — cleanup)* Remove `.linkButton` from `OwnerRestaurant.module.css` — no call sites left as of 10.5g-ii (grep to reconfirm before deleting, same as 10.5f-iii) **Built 2026-09-22 — reconfirmed by grep (no `styles.linkButton` in `OwnerRestaurant.jsx`, only stale comment mentions) before deleting; class removed and replaced with a short epitaph comment, same convention `.linkButtonDanger`'s removal (10.5f-iii) used. Also fixed one now-inaccurate comment above `.subheading` (10.5g-i) that still named `.linkButton` as backing the "manage your foods" link — see `docs/PROJECT_STATUS.md`'s 10.5g-iv entry.**
  - [x] 10.5h **Decided by the project owner: option (a) — drop the search input entirely; also drop the notification bell and the avatar's dropdown chevron.** "Don't fake anything — consider what's in the code only": none of the three has a real backing behavior on this page (no search endpoint for it to call, no bell/notification-count wiring outside the two dashboards, no dropdown menu). Keep only the plain-letter avatar (owner's real name/email initial, from the real `users` row) as a lightweight `/owner/account` link — same real data, no invented affordance around it.
    - [x] 10.5h-i *Verify only:* confirm which fields `GET /auth/me` returns (name, email) so the initial has a real source **Verified 2026-09-22, no code change — see `docs/PROJECT_STATUS.md`'s 10.5h-i entry.**
    - [x] 10.5h-ii Add an independent `useApiQuery` for it so a failure can't block the page; no render yet **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 10.5h-ii entry.**
    - [x] 10.5h-iii Initial derivation with a real fallback: name → email → a plain "Account" text link (never a fake letter) **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 10.5h-iii entry.**
    - [x] 10.5h-iv Render as a `<Link to="/owner/account">` circle with the letter **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 10.5h-iv entry.**
    - [x] 10.5h-v Place it at the right end of the `<h1>Restaurant</h1>` row (**placement assumed** — this page has no top bar; confirm) **Built 2026-09-22 — placement confirmed (not just assumed) against the reasoning in `docs/PROJECT_STATUS.md`'s 10.5h-v entry.**
    - [x] 10.5h-vi Style: orange circle, white letter, ≥44px tap target **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 10.5h-vi entry.**
    - [x] 10.5h-vii *Verify only:* no search input, bell or chevron exists anywhere on the page (same idea as 10.1g) **Verified 2026-09-22, no code change — see `docs/PROJECT_STATUS.md`'s 10.5h-vii entry.**
  - [x] 10.5i Responsive/verification pass at all 4 breakpoints, same real-render bar as 10.2f/10.3h/10.4f (320/390/768/1024/1280/1920 + one short-landscape phone; no horizontal overflow, nothing clipped, 44px tap-target floor, every state — loading/error/empty for each of the three list sections — checked, not just the happy path) — **done as a manual CSS/markup trace, not a real render; see `docs/PROJECT_STATUS.md`'s 10.5i entry for why (no browser available this session) and its own honest caveat.**
    - *(Split note: each 10.5i sub-task is run at 320 / 390 / 768 / 1024 / 1280 / 1920 + 667×375 landscape.)*
    - [x] 10.5i-a Whole page, happy path: no horizontal overflow, nothing clipped
    - [x] 10.5i-b Hero edge cases: long name, no description, no cover, no logo
    - [x] 10.5i-c Categories: loading, error, empty, populated, multi-page
    - [x] 10.5i-d Opening hours: same states plus a per-day save error
    - [x] 10.5i-e Service areas: same states
    - [x] 10.5i-f Payment methods: same states plus a toggle error
    - [x] 10.5i-g 44px tap-target sweep across every control on the page
    - [x] 10.5i-h *(added — gap)* All 5 modals (add/edit/delete) open at 320px and landscape; verify only, restyle only if broken against the new palette
    - [x] 10.5i-i Compare the page to the reference image, log deviations in `PROJECT_STATUS.md`, tick 10.5

**Phase 10 exit check (for the 4 pages currently in scope):** each
restyled screen verified against its own reference image, every
data-bearing element traced back to a real endpoint/field (except
10.3e2's named exception), and a responsive pass at all 4 breakpoints
— same bar Phase 8 used.

**Exit check status (run 2026-09-20, real headless-Chromium renders):
PASSED.** See `docs/PROJECT_STATUS.md`'s "Phase 10 exit check" entry and
the follow-ups after it. It found two things — **10.2z** (Home food-card
price truncated on phones) and **10.2z2** (Home header's decorative bell)
— both decided by the project owner and built. Every Phase 10 checkbox is
now ticked (the one unticked box, 10.0f, is the struck-through dropped
task). Known, documented leftovers that are not tasks: see the exit-check
entry's "smaller notes" (login card top-aligned vs. centered in the
reference; `SearchBar`'s 18px input; the Owner Dashboard's "Get your
restaurant Live" copy).

## Phase 11 — Merge the customer checkout flow into one page (reference-image driven)

Reference: `docs/reference_ui/phase11_checkout_reference.jpg`. **Not
part of Phase 10** — that phase is scoped to the 4 owner/admin pages
only; this is a separate, project-owner-requested merge of the 5
Phase-3 customer screens (`OrderBuilder.jsx`, `CustomerInfo.jsx`,
`PaymentMethod.jsx`, `PaymentScreenshot.jsx`, `OrderConfirmation.jsx`)
into a single scrolling "Checkout" page at the existing `/order/builder`
route. **No backend change of any kind** — the same four endpoints
(`GET /foods/detail/:id`, `GET /restaurants/:id/payment-methods`,
`POST /uploads/payment-screenshot`, `POST /orders`) are called with the
same payloads; only which page calls them, and when, changes. Same
standing device-size rule as Phase 10: every task leaves the page
working from 320px to 1920px+, portrait and landscape, verified in a
real render before its box is ticked.

**All open decisions resolved by the project owner (this session):**
1. **Icons — build real ones.** Unlike Phase 10's 10.5c precedent
   (text-only), the project owner asked for real per-field/per-section
   icons here: back-arrow, cart-summary glyph, and person/phone/pin/
   note/card/camera field icons. Built as new inline-SVG components
   following `RoleShell.jsx`'s existing icon convention (`viewBox="0 0
   24 24" fill="none" stroke="currentColor"`, feather-style line
   icons) — same shape as `HomeIcon`/`OrdersIcon`/etc., just new glyphs.
2. **Delivery fee line — dropped entirely.** No "Delivery fee: 0 ETB"
   row; only Subtotal and Total, matching what `OrderBuilder.jsx`
   already computes today.
3. **Payment method selector — preview + tap-to-open list.** The
   summary row always shows one method (the previously-selected one,
   or the restaurant's first active method if none is selected yet);
   tapping it opens the existing `Modal` component with the full list
   of active methods to choose from (picking one closes the modal and
   updates the summary row). No data/endpoint change.
4. *(No decision needed — 11.5b was a build-scope check, not a
   question for the project owner; resolved during 11.5's own build.)*
5. **Success state — centered overlay popup.** On a successful
   submit, the existing `Modal` component opens centered over the
   still-visible checkout page (rather than replacing the page in
   place or navigating to a separate route) showing the same real
   fields `OrderConfirmation.jsx` already displays: success message,
   `order.order_code`, "Track order" (→ `/track`) and "Back to home"
   (→ `/`) — dismissing the modal any other way just leaves the
   customer on a checkout page whose cart `clearCart()` has already
   emptied, which is fine since there's nothing left to resume.

- [x] 11.0 Groundwork (no visible change yet)
  - [x] 11.0a New page component (either a renamed `OrderBuilder.jsx` or a new `Checkout.jsx` replacing it) at the existing `/order/builder` route — empty shell only, no sections moved in yet
  - [x] 11.0b *Verify only:* `useOrderCart`, `useApiQuery`, `useMutation`, `QuantityStepper`, `FormField`, `ImageUploadField`, `EmptyState`, `Modal` all carry over into the merged page unchanged — no shared-component edits needed to start
  - [x] 11.0c New icon set (one small file each, `RoleShell.jsx`'s existing SVG convention) — built once here, used by 11.1/11.3/11.4/11.5 below rather than each section inlining its own copy:
    - [x] 11.0c-i Back-arrow icon
    - [x] 11.0c-ii Cart icon
    - [x] 11.0c-iii Person icon
    - [x] 11.0c-iv Phone icon
    - [x] 11.0c-v Pin (location) icon
    - [x] 11.0c-vi Note icon
    - [x] 11.0c-vii Card (payment) icon
    - [x] 11.0c-viii Camera icon

- [x] 11.1 Checkout header (new top app-bar; replaces the plain `<h1>` each of the 5 screens uses today)
  - [x] 11.1a Gradient bar shell, reusing the existing `--gradient-header` token (same one `DashboardHeader`/`Home.jsx` already use) — no content yet
  - [x] 11.1b Back control → `/` (Home), using the new back-arrow icon (11.0c)
  - [x] 11.1c "Checkout" title text
  - [x] 11.1d Cart-summary badge, pill shape per reference:
    - [x] 11.1d-i Pill container shell (background/border/radius only, no content)
    - [x] 11.1d-ii Cart icon (11.0c-ii) placed inside the pill
    - [x] 11.1d-iii "N items • total ETB" text, real `cart.items.length` + the existing subtotal calculation — no new price logic
  - [x] 11.1e Verify the existing empty-cart `EmptyState` branch still renders sanely under this new header (no dead/zero badge shown for a genuinely empty cart) **Verified 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.1e entry.**

- [x] 11.2 "Your order" section (folds in `OrderBuilder.jsx`'s existing content — same real cart/food data, no new fields)
  - [x] 11.2a Section heading restyle — new `.sectionHeading` (bold, `--font-size-title`, one step down from the header's own `.title`), "Your order" text
  - [x] 11.2b Item row restyle to the reference's card/row treatment — same real fields throughout, layout only:
    - [x] 11.2b-i Row/card shell (background, border, radius, spacing — no content) — new `.itemRow`/`.itemList`, whitespace-separated rows (no per-row border) per the reference
    - [x] 11.2b-ii Food image placement/sizing — new `.itemImage`, fixed 64×64px `object-fit: cover` box per Task 10.1z's app-wide "fixed size regardless of source photo" rule, `FALLBACK_IMAGE` fallback carried over from `FoodDetails.jsx`
    - [x] 11.2b-iii Food name + description text block (pending 11.2c's data check) — new `.itemName`/`.itemDescription` (2-line clamp)
    - [x] 11.2b-iv Unit price / line-total price text placement — new `.itemPrice`, reusing this file's own `formatPrice`; this codebase has no per-line-total distinct from unit price at quantity 1 either way, so it's the same `formatPrice(food.price)` call FoodDetails/Home/RestaurantProfile already use for a unit price
    - [x] 11.2b-v `QuantityStepper` placement inside the row (component itself unchanged) — wired to `setItemQuantity` (pulled into this file's single `useOrderCart()` call, see Checkout.jsx's own doc comment)
    - [x] 11.2b-vi Remove control placement inside the row (same existing handler) — wired to `removeItem`; **text-only, no trash icon** — none of 11.0c's 8 built icons is a remove/trash glyph, so this follows Phase 10's own "no real icon exists → text-only" precedent (10.5c) rather than inventing a 9th icon; new `.removeButton`, same underlined-red-text shape `OwnerRestaurant.module.css`'s `.categoryDeleteLink`/`.areaDeleteLink` already use
  - [x] 11.2c *Verify:* does `GET /foods/detail/:id` already return a `description` field for the reference's one-line food description under the name? If not, that line is dropped, not invented — **confirmed real**: `getPublicFoodById` (`backend/src/services/popularFoods.js`) selects a real `description` column, the same one `FoodDetails.jsx` (Task 3.9) already reads; rendered as-is, not invented
  - [x] 11.2d Subtotal / Total block restyle — **no delivery-fee line** (project owner decision above) — new `.summaryBlock`/`.summaryRow`/`.totalRow`, both rows sourced from this file's existing `subtotal`/`formattedSubtotal` (11.1d), no second total calculation added
  - [x] 11.2e "Add another item" pill restyle — same existing handler/destination, no behavior change — `navigate(`/restaurant/${cart.restaurantId}`, { state: { addingToOrder: true } })`, the exact destination/state shape `RestaurantProfile.jsx`'s own doc comment already documents as coming from Order Builder's "Add another item"; new `.addItemButton`/`.addItemPlus` (solid-orange-circle "+", text glyph not an icon asset, same call Task 10.2d-ii already made for Home's Popular Foods CTA)

  **Also restored in this task, not itself a lettered 11.2 sub-task but flagged as necessary for this section to render anything real**: the Buy Now hand-off `useEffect` (`location.state.{foodId,restaurantId,quantity}` → `addItem`, mount-only) that `App.jsx`'s own `/order/builder` route comment (Task 11.0a) already named as carried over into 11.2's job, and an empty-cart `EmptyState` branch (`.emptyStateLink` → `/`) for a direct/empty visit — which also finally lets **11.1e** be checked for real: with a genuinely empty cart, this branch renders and 11.1d's pill (guarded on `itemCount > 0`) still shows nothing next to it. 11.1e's own checkbox above should be ticked once that's confirmed in a real render (not done this session — no npm-registry/browser access; see this task's verification note below).

  **Verification this session:** no npm-registry/browser access (same standing constraint as most sessions since Task 2.10), so no real `vite build`/render. Checked instead with the `esbuild` binary bundled inside the already-installed `tsx` package (`~/.npm-global/lib/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild`): `Checkout.jsx` alone bundles clean, and a full `App.jsx` bundle (363KB JS / 147KB CSS, every route module including this one) resolves with zero errors — every import/export across the app, not just this file, is at least syntactically and reference-valid. Also cross-checked every `styles.*` class referenced in `Checkout.jsx` against `Checkout.module.css`'s own class definitions (script-diffed, not eyeballed): zero missing. Real-render visual/responsive verification against the reference image is still outstanding — deferred to 11.9 per that task's own scope, same as 10.5i's own real-render pass is deferred past its component tasks.

- [x] 11.3 "Your details" section (folds in `CustomerInfo.jsx` — same 4 real fields, same validation)
  - [x] 11.3a Section heading restyle, with the new person icon (11.0c)
  - [x] 11.3b Name field, with the person icon, carried over unchanged (same `maxLength`, same validation message)
  - [x] 11.3c Phone field, with the new phone icon, carried over unchanged
  - [x] 11.3d Delivery location field, with the new pin icon, carried over unchanged
  - [x] 11.3e Note field (optional), with the new note icon, carried over unchanged
  - [x] 11.3f Inline validation restyle — same three required-field checks, now shown in-section rather than gating a whole separate screen; touched/blur behavior unchanged

- [x] 11.4 "Payment method" section (folds in `PaymentMethod.jsx`)
  - [x] 11.4a Section heading restyle, with the new card icon (11.0c)
  - [x] 11.4b Summary row:
    - [x] 11.4b-i Fallback logic: use `cart.paymentMethodId` if set, else the restaurant's first fetched active method (real data only, no invented default)
    - [x] 11.4b-ii Summary row markup — method name, account name/number, real fields, matching the reference
    - [x] 11.4b-iii ">" affordance at the row's end (text character, per the icon set's existing precedent for directional glyphs — not a new icon unless 11.0c's set already covers it)
  - [x] 11.4c Tap-to-open Modal, reusing `PaymentMethod.jsx`'s existing list logic wholesale (no new fetch/loading/error handling written):
    - [x] 11.4c-i Wire the summary row's tap to open the existing `Modal` component
    - [x] 11.4c-ii Render the existing method list (with its own loading/error/zero-active-methods states, unchanged) inside the modal body
    - [x] 11.4c-iii Selecting a method in the list calls the existing `setPaymentMethod` and closes the modal
    - [x] 11.4c-iv Verify the modal's own backdrop/close-button dismissal leaves the previously-selected method showing in the summary row (no accidental reset)
  - [x] 11.4d *Verify:* `cart.paymentMethodId` resetting to `null` on a different-restaurant cart swap (existing `useOrderCart` behavior) still degrades correctly to "first active method" in the summary row rather than showing nothing selected

- [x] 11.5 "Upload payment screenshot" row (folds in `PaymentScreenshot.jsx`)

  - [x] 11.5a Groundwork: new `compact` mode on `ImageUploadField` (additive/opt-in, same convention as `overlay`/`badge` — Tasks 10.5a-i/ii — so every existing call site, OwnerRestaurant's cover/logo and AddFood's photo, renders unchanged)
    - [x] 11.5a-i New `compact` prop + `.fieldCompact` shell class — bordered, rounded, dashed-border-when-empty container, gated behind the prop — no icon/text/chevron content yet **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5a-i entry.**
    - [x] 11.5a-ii `icon` prop (same name/shape as `FormField`'s own Task 11.3 prop — a pre-built node, e.g. `<CameraIcon />`), rendered left-aligned inside the compact row
    - [x] 11.5a-iii Title + subtitle two-line text block — `chooseLabel` as the bold title, `helperText` (existing prop) as the subtitle line — no new prop invented for the subtitle **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5a-iii entry.**
    - [x] 11.5a-iv Chevron affordance at the row's trailing edge — text `>` character, same precedent 11.4b-iii already set, not a new icon **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5a-iv entry.**
    - [x] 11.5a-v Whole row wired as the click target (`inputRef.current.click()`), same delegated-click pattern the `overlay` button already uses **Verified 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5a-v entry.**

  - [x] 11.5b Selected state inside the compact row (a file just picked, or `value` already holds an uploaded URL)
    - [x] 11.5b-i Thumbnail swap — small square preview replaces the icon slot, reusing this component's existing `displayedPreview` logic (no second preview source) **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5b entry.**
    - [x] 11.5b-ii Title/subtitle swap on selection — `changeLabel` becomes the title; subtitle drops the "Take a screenshot…" prompt copy **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5b entry.**
    - [x] 11.5b-iii *Verify:* a `value`-string preview (already-uploaded URL, e.g. returning to the page) renders identically to a freshly-picked local file's blob preview in this new mode **Verified 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5b entry.**

  - [x] 11.5c Wire the row into `Checkout.jsx`, under the Payment method section
    - [x] 11.5c-i Local `pendingScreenshotFile`/`screenshotFieldError` state, mirroring `PaymentScreenshot.jsx`'s old `pendingFile`/`fieldError` (Task 3.14), added to this file's existing top-level `useState` cluster **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5c entry.**
    - [x] 11.5c-ii New "Upload payment screenshot" section heading + the compact `ImageUploadField` row, rendered after Payment method, same `itemCount > 0` guard every other section already uses **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5c entry.**
    - [x] 11.5c-iii `value` wired to `cart.paymentScreenshotUrl`, so a screenshot uploaded on an earlier visit still shows selected instead of blank **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5c entry.**
    - [x] 11.5c-iv `onChange`/`onError` wired to the new local state (11.5c-i) — no upload call fired here; `POST /uploads/payment-screenshot` stays 11.6b's own job on "Place order" press, not this task's **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5c entry.**

  - [x] 11.5d *Verify only:* Task 8.4a/8.4b's `maxDimension={2400}`/`quality={0.95}` override carries over unchanged onto this new call site **Verified 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.5c entry.**

- [x] 11.6 "Place order" action (folds in `OrderConfirmation.jsx`'s submit logic — moved from an on-mount effect to a button press)
  - [x] 11.6a Combined enablement gate: button disabled until 11.3's three required fields validate, 11.4 has a `paymentMethodId`, and 11.5 has a file selected or an already-uploaded `paymentScreenshotUrl` — same three checks the separate screens make today, evaluated together **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.6 entry.**
  - [x] 11.6b On press: upload the pending screenshot (if new) via the existing `POST /uploads/payment-screenshot`, then call the existing `POST /orders` with the exact payload shape `OrderConfirmation.jsx` builds today — no payload change **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.6 entry.**
  - [x] 11.6c Single loading label on the button ("Placing your order…") replacing the two separate "Uploading…"/"Placing your order…" states **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.6 entry.**
  - [x] 11.6d Error handling — same upload-failure/submit-failure messages surfaced inline, retry re-fires the same combined action; no new error copy invented **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.6 entry.**

- [x] 11.7 Success state — centered `Modal` overlay (project owner decision above)
  - [x] 11.7a Build the success modal content: reuse `OrderConfirmation.jsx`'s exact existing success markup (message, `order.order_code`, "Track order", "Back to home") **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.7 entry.**
  - [x] 11.7b Wire the modal open state to a successful `mutate()` result from 11.6; `clearCart()` still fires immediately on success, same as today **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.7 entry.**
  - [x] 11.7c "Track order"/"Back to home" inside the modal navigate exactly as `OrderConfirmation.jsx` does today (`/track`, `/`) — no new destinations **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.7 entry.**

- [x] 11.8 Routing / cleanup
  - [x] 11.8a *Verify only:* confirm (already checked this session — only `FoodDetails.jsx`'s "Buy Now" links into this flow) nothing else references the 4 routes being retired before removing them **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.8 entry.**
  - [x] 11.8b Retire `/order/customer-info`, `/order/payment-method`, `/order/payment-screenshot`, and `/order/confirm` from `App.jsx` — the success state is now a modal on the merged page, not a separate route **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.8 entry.**
  - [x] 11.8c Delete `CustomerInfo.jsx`, `PaymentMethod.jsx`, `PaymentScreenshot.jsx`, and `OrderConfirmation.jsx` plus their `.module.css` files once their content has moved — grep to reconfirm no leftover references first, same convention `10.5f-iii`/`10.5g-iv` used **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.8 entry.**

- [x] 11.9 Responsive/verification pass, same real-render bar as 10.2f/10.3h/10.4f/10.5i (320/390/768/1024/1280/1920 + 667×375 landscape) **Closed 2026-09-22; 11.9az (the one open item outside this box's own six lettered sub-tasks) resolved same day — see that entry below.**

  **Note on task split (before 11.9a started):** split into two lettered
  sub-subtasks below, same convention as 8.2c/8.2e/8.4c's i-ii splits,
  since "whole page, happy path" bundles two independently-checkable
  breakpoint groups with different failure modes — narrow widths (where
  sections stack/wrap and horizontal overflow shows up first) vs. wide
  widths (where spacing/proportion and multi-column layout are the
  actual risk) — rather than one layout question.
  - [x] 11.9a-i Narrow widths: 320px, 390px, 768px portrait, plus the
    667×375 landscape case — stacking/wrapping behavior, no horizontal
    overflow, header/cart-pill/section spacing at the tightest widths.
    **Done as a manual CSS/token-value trace, not a real render** (no
    npm-registry/browser access this session, same standing constraint
    — see `docs/PROJECT_STATUS.md`'s 11.9a-i entry for the full
    esbuild-bundle-check + token-math method). Item row, form fields,
    payment-summary row, compact screenshot field, place-order button,
    and success modal all traced clean at every narrow width. One real
    finding, logged as **11.9az** below rather than fixed silently in
    this task, matching the 10.2z/10.3z/10.4z convention of flagging a
    found issue with options for the project owner rather than picking
    one unasked.
  - [x] 11.9a-ii Wide widths: 1024px, 1280px, 1920px — section
    max-width/centering, spacing/proportion at desktop widths, no
    layout regressions introduced by the narrow-width fixes in 11.9a-i.
    **Done as a manual CSS trace** (same standing no-browser constraint
    as 11.9a-i). Clean at all three widths: `Checkout.module.css` has no
    `@media` rules at all — `.headerInner`/`.page` both cap at 640px
    with `margin: 0 auto` (deliberate single-column design, per the
    file's own doc comment), so wide viewports just center the same
    768px-width render, nothing new to break. `RoleShell`'s bottom nav
    (480px-capped, Task 8.1i) and `.content` bottom-padding/no-collision
    behavior are shared and already re-verified across seven other
    `RoleShell` screens (Task 8.2h); Checkout passes no `className`
    override so that carries over unchanged. No findings.

- [x] 11.9az *(added — found during 11.9a-i)* Checkout
  header overflows horizontally at 320px. `.headerInner` lays out the
  back button + "Checkout" title (`.headerLeft`) and the cart-summary
  pill (`.cartPill`) in one `flex-wrap: nowrap` row. The title is a
  single unbreakable word (22px bold, ~104px min) and the pill is
  `flex-shrink: 0` with `white-space: nowrap` text ("N items • total
  ETB") — neither can shrink further. Computed from real token values
  (`--space-lg`=16px, `--font-size-heading`=22px, `--font-size-caption`
  =12px): minimum combined content width ≈290px even for a tiny cart
  ("1 item • 50 ETB"), ≈340px+ for a larger order/longer price, against
  288px of available inner width at a 320px viewport — no
  `overflow-x: hidden` anywhere upstream, so this is a real horizontal
  scroll/edge-clip, not silently masked. Borderline at 390px for bigger
  carts; clears up on its own from ~672px once `.headerInner`'s own
  640px cap kicks in — narrow-width-only, same shape as 10.2z. Options:
  (a) let the cart pill wrap onto its own line below the title/back-row
  below some breakpoint (one media query, `.headerInner` → column or a
  second row); (b) shrink `.cartPillText`'s font-size and/or drop the
  " • " separator for a tighter string below ~360px; (c) accept as-is.
  **Project owner decision: collapse the pill to icon-only below 400px
  (neither (a)/(b)/(c) as originally worded) — built 2026-09-22, see
  `docs/PROJECT_STATUS.md`'s 11.9az entry.**

- [x] 11.9b Edge cases: long food name/description, long address/note text, long payment-method name, a multi-item order (3+ items).
  **Done as a manual CSS/JSX trace** (same standing no-browser
  constraint). All four clean, no new findings: item name/description
  wrap/clamp safely inside `min-width: 0` parents; the delivery-location
  and note fields are `maxLength`-bound textareas matching their DB
  column sizes (255/500 chars) and wrap normally; the payment-method
  summary row and modal list both wrap a long name instead of
  overflowing (`min-width: 0` / `width: 100%` respectively); a 3+ item
  cart just grows `.itemList` vertically, no width risk — a longer cart
  pill string from more items is the same overflow already logged as
  **11.9az**, not a new one. One minor, non-blocking note: item
  name/description/payment-name have no `overflow-wrap` guard against a
  single unbroken long word, same category as the rest of the codebase
  only guarding truly unbreakable strings (order codes) rather than
  ordinary prose.
  - [x] 11.9c Every section's loading/error/empty state (foods loading/error, payment methods loading/error/empty, upload error, submit error).
  Payment methods (loading/error+retry/empty), upload error
  (`screenshotFieldError` → `ImageUploadField`'s own error slot), and
  submit error (`placeOrderError`) were already built. **Foods
  loading/error was a real gap, not just unverified** — the code
  self-flagged it: `useApiQuery(fetchCartFoods, ...)` only destructured
  `data`, so while foods loaded (or if that fetch failed outright)
  every item row silently returned `null` and the "Your order" section
  rendered empty with no loading indicator and no error/retry at all.
  Built it this task: `loading`/`error`/`refetch` now destructured;
  three-way branch (error+Retry / "Loading your order…" / the existing
  item list) added ahead of the item map, mirroring the payment-method
  section's own existing loading/error/retry shape exactly; new scoped
  `.orderStatusRow`/`.orderStatusText` classes (byte-for-byte
  `.paymentStatusRow`/`.paymentStatusText`'s recipe, `.retryButtonInline`
  reused as-is since it was never section-scoped) — same "new class per
  section" convention `OwnerRestaurant.module.css`'s per-section error
  classes established. Stale in-code comment ("11.9c's later pass...")
  updated to reflect it's now handled. Verified with an `esbuild` bundle
  of the full `App.jsx` (0 errors) and a script diff of every
  `styles.*` reference in `Checkout.jsx` against `Checkout.module.css`
  (0 missing) — real-render visual check still deferred to 11.9a/11.9f
  per the standing no-browser-access note.
  - [x] 11.9d Success modal at 320px and landscape (same "modals at 320px" check `10.5i-h` used).
  **Done as a manual CSS/token trace** (same standing no-browser
  constraint). Clean at both. 320px: `.overlay`'s 16px padding leaves
  288px for `.dialog` (never reaches `.sm`'s 360px cap), 240px of
  content width after `.dialog`'s own 24px padding — icon/heading/
  instructions/buttons all fit; `.successOrderCode` already has
  `overflow-wrap: anywhere` and the real `order_code` format
  (`NTR-#####`, confirmed in `orderCode.js`) is short and fixed so it
  never needs it. No `title` prop on this modal (deliberate — centered
  checkmark card), so checked for a close-button/icon collision:
  none — the centered icon (x:116–172 of 240px) and the close button's
  hit area (x:232–276) sit a clean 60px apart. 667×375 landscape:
  width is not a constraint (635px available); content height (~400px
  incl. padding) exceeds `.dialog`'s `max-height: 90vh` (≈337px at this
  height), which correctly engages `overflow-y: auto` and scrolls
  internally rather than breaking the viewport — working as designed,
  same pattern already validated for other modals in `10.5i-h`. No new
  findings.
  - [x] 11.9e 44px tap-target sweep across every control on the page, including the new icons **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.9e entry.**
  - [x] 11.9f Compare the finished page to `phase11_checkout_reference.jpg`, log deviations in `PROJECT_STATUS.md`, tick 11 **Built 2026-09-22 — see `docs/PROJECT_STATUS.md`'s 11.9f entry.**

- [x] 11.10 *(added — found during a post-completion bug review)* Fix: a
  food that becomes unavailable (hidden or deleted) after being added
  to the cart is invisible and unremovable on the Checkout page,
  permanently blocking "Place order". Root cause and full trace logged
  in `docs/PROJECT_STATUS.md`'s 11.10 entry — read that first.
  **All five sub-tasks (a-e) built and verified 2026-09-22** — see each
  entry below, plus `docs/PROJECT_STATUS.md`'s 11.10a/11.10b entries for
  the two prerequisite fixes (`resolvedCartItems`, and `fetchCartFoods`'s
  own per-line 404 isolation) found along the way.
  - [x] 11.10a Filter `cart.items` down to items whose food actually
    resolved in `foodsById` before: (i) computing `subtotal`/the header
    pill, (ii) building the `/orders` payload in `placeOrder`, and
    (iii) evaluating `canPlaceOrder` — none of these three should ever
    see a food_id that isn't in `foodsById`.
    **Built** — new `resolvedCartItems` `useMemo` (`cart.items` filtered
    to `foodsById.has(item.foodId)`, `null` while `foodsById` itself
    hasn't loaded, matching its existing loading semantics). `subtotal`
    now sums over it directly (no more per-item `null`-abort — every
    line is guaranteed to resolve post-filter); the header pill's count
    is a new `resolvedItemCount` (falls back to raw `itemCount` only
    while still loading, so the pill doesn't flash "0 items"); `canPlaceOrder`
    now gates on `(resolvedCartItems?.length ?? 0) > 0` instead of the
    raw `itemCount > 0`; `placeOrder`'s `/orders` payload now maps
    `resolvedCartItems ?? []` instead of `cart.items`. Deliberately
    doesn't touch `cart.items` itself, the per-item render's own
    `if (!food) return null` skip, or show the customer anything new —
    that's 11.10b's job. Verified with an `esbuild` bundle of the full
    `App.jsx` (0 errors, only a pre-existing unrelated `import.meta`
    warning), real-render check still deferred per the standing
    no-browser-access note.
  - [x] 11.10b Surface a visible, dismissible notice for any cart item
    whose food didn't resolve ("<name-if-known-else-generic> is no
    longer available — removed from your order") and actually remove
    it from `cart.items` via the existing `removeItem` — today it sits
    outside the rendered per-item list, so the existing Remove control
    never reaches it.
    **Built** — with one prerequisite fix found while building this:
    `fetchCartFoods` used to let a single food's 404 (`getPublicFoodById`
    404s identically for a hidden/deleted/non-Live food) reject its
    whole `Promise.all`, failing the *entire* "Your order" fetch instead
    of the graceful per-line miss 11.10's own root-cause writeup
    assumed — fixed by catching a 404 per-line and resolving to `null`
    (any other status still rejects and surfaces via `cartFoodsError`
    as before); `foodsById` now `.filter(Boolean)`s those out. New
    `removedItemNotices` state + a `useEffect` keyed on
    `foodsById`/`cart.items`: any cart line not in `foodsById` gets one
    dismissible notice appended and `removeItem(item.foodId)` called for
    it — self-terminating (the removed line no longer fails the check
    on the effect's next run, not a loop). A small `foodNameCacheRef`
    (updated every time `foodsById` resolves with a real food) supplies
    the "<name-if-known>" half of the message when this food was seen
    earlier in the same visit (e.g. a manual Retry after it went hidden
    mid-visit); falls back to "A food is no longer available…" when it
    never had a name to cache, which is the common case since the 404
    itself carries no name. New scoped `.removedItemNotices`/
    `.removedItemNotice`/`.removedItemNoticeText`/
    `.removedItemNoticeDismiss` classes (tinted `color-mix` off
    `--color-error`, same technique `StatusBadge.module.css`'s own
    `.info` tint uses, Task 10.4d-i; dismiss control is `Modal.jsx`'s
    own `&times;` convention, ported). Verified with an `esbuild` bundle
    of the full `App.jsx` (0 errors) and a script diff of every
    `styles.*` reference in `Checkout.jsx` against `Checkout.module.css`
    (0 missing) — real-render check still deferred per the standing
    no-browser-access note; 11.10d is the scripted end-to-end
    verification of this and 11.10a/c together.
  - [x] 11.10c Recompute the Subtotal/Total/header-pill from only the
    resolved items, instead of the current `subtotal` `useMemo`
    aborting to `null` the moment any single item's food is missing.
    **Already done as part of 11.10a's own build** — its
    `resolvedCartItems` filter and the `subtotal` `useMemo` derived from
    it (see that entry above) are exactly this recompute; the old
    per-item `if (!food) return null` abort was removed at that same
    point, not left for this subtask to redo. This entry is the
    verification pass: confirmed `subtotal`/`formattedSubtotal` produce
    a real number (not `null`/"—") once `foodsById` resolves with a
    partial miss, via the scripted check logged under 11.10d below
    (same scenario, one script covers both).
  - [x] 11.10d *Verify:* a cart with one hidden/deleted food plus N
    valid ones — "Place order" succeeds using only the valid items, the
    ghost item is dropped from both `cart.items` and the submitted
    payload, and the customer sees the one-line notice from 11.10b
    rather than a dead end.
    **Verified by script**, not a real-render check (standing
    no-browser-access constraint; this frontend also has no test
    framework configured — checked `package.json`'s `scripts` and found
    no `.test.` files anywhere under `frontend/`, so this doesn't
    pretend to be this project's first real unit test). The pure logic
    from `resolvedCartItems`/`subtotal`/`canPlaceOrder`/the `/orders`
    payload map/the notice+`removeItem` effect was extracted verbatim
    and run against a synthetic "2 valid + 1 ghost" cart: `foodsById`
    correctly excludes the ghost's `food_id`; `resolvedCartItems` keeps
    only the 2 valid lines; `subtotal` sums to the correct total from
    those 2 (860 ETB in the script's numbers) instead of aborting;
    `canPlaceOrder` is `true`; the `/orders` payload contains exactly
    the 2 valid `food_id`s and never the ghost's; the notice effect
    generates one message and actually removes the ghost from
    `cart.items` (not just filtering it for display); a second pass
    over the now-cleaned cart finds nothing left to remove
    (self-terminating). Two edge cases also checked: the name-cache path
    (a food seen earlier this visit, then gone on a later refetch, is
    named in its notice instead of falling back to generic) and an
    *all*-ghost cart (`canPlaceOrder` correctly `false`, not just
    "itemCount > 0" staying true the way the pre-11.10a gate would have
    let it).
  - [x] 11.10e *(secondary, lower severity — same review, not a
    customer-facing production bug but a fragile assumption worth
    closing)* The Buy Now hand-off effect (`useEffect(..., [])` calling
    `addItem`, Task 11.2) assumes it fires exactly once per real
    arrival. `addItem` adds to an existing line's quantity rather than
    replacing it, and `main.jsx` wraps the app in
    `<React.StrictMode>`, which double-invokes mount effects in
    development — so a dev build silently doubles the quantity on
    every Buy Now arrival (production builds don't double-invoke, so
    real customers aren't affected today). Make the effect idempotent
    (e.g. a `useRef` guard so a second same-mount invocation is a
    no-op) so this isn't relying on StrictMode/production behavior
    staying the way it is.
    **Built** — new `buyNowHandledRef` (`useRef(false)`), checked/set at
    the top of the effect body before anything else runs: a second
    same-mount invocation (StrictMode's extra call, no cleanup fn
    involved — this effect never had one) now returns immediately
    instead of calling `addItem` again. A fresh component mount gets a
    fresh ref (`useRef` is per-instance), so a genuine second Buy Now
    later on still works normally — this only guards the
    double-invoke-within-one-mount case, not later real navigations.
    Verified with an `esbuild` bundle of the full `App.jsx` (0 errors)
    and a scripted simulation of StrictMode's double-invoke (same ref
    object called twice, no cleanup between): quantity stays 1, not 2;
    a control run of the *old*, unguarded effect against the identical
    double-invoke confirmed it really would have doubled (2), so this
    wasn't a non-issue; a separate fresh-ref run confirmed a later,
    genuine second mount still adds normally. Real-render check still
    deferred per the standing no-browser-access note — this project's
    frontend has no test framework configured to check into, so the
    script lived in this session's own scratch space, not the repo.

**Phase 11 exit check:** merged page verified against the reference
image, every data-bearing element traced back to a real endpoint/field
(same bar Phase 10 used), and a responsive pass at all 4 breakpoints
plus landscape.

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
| 10 — Radical UI Redesign (all 5 pages complete) | 7 groups / ~99 tiny sub-tasks |
| 11 — Checkout flow merge (complete, incl. 11.9az) | 10 groups / 89 tiny sub-tasks |
| **Total** | **139 tasks + Phase 10 (complete) + Phase 11 (complete)** |
