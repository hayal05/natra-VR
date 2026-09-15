# NATRA — Build Roadmap

A phased plan that builds the reusable kit first, then layers features on top.
Each phase produces something testable before moving to the next.

## Phase 0 — Foundation (no UI yet)
**Goal: project skeleton + schema locked**
1. Repo setup (frontend + backend, GitHub, env var structure, CI skeleton)
2. Finalize DB schema (all ~15 tables from the spec) + migrations
3. Oracle Autonomous DB connection + Object Storage bucket config
4. Seed script with fake restaurants/foods/orders for dev testing

*Exit check: can connect to DB, run migrations, seed data, and hit a health-check endpoint.*

## Phase 1 — Backend generic handlers
**Goal: the reusable backend kit exists and is unit-tested**
1. `crudFactory` (generic create/read/update/delete + ownership check)
2. `ownershipMiddleware`
3. `uploadToObjectStorage` (+ image compression/thumbnail)
4. `statusTransition` utility
5. `paginate` + `phoneLookup` utilities
6. Auth (owner/admin login, password hashing, session/JWT)

*Exit check: Postman/curl can create a restaurant, log in as owner, upload an image, and hit a paginated list endpoint.*

## Phase 2 — Frontend component kit
**Goal: the 16 reusable components exist in a style sandbox (e.g. Storybook or a scratch page), matching reference UI colors/spacing**
1. Design tokens (orange/white theme, spacing scale, type scale) from reference images
2. Display primitives: `EntityCard`, `StatusBadge`, `ImageViewer`, `HorizontalScroller`, `ResponsiveGrid`, `EmptyState`
3. Input primitives: `QuantityStepper`, `FormField`, `ToggleSwitch`, `ImageUploadField`, `SearchBar`, `FilterBar`
4. Structural: `Modal`, `ListWithPagination`, `RoleShell` (3 nav variants), `Stepper/Wizard`

*Exit check: every component renders correctly in isolation with mock data, matches reference UI look.*

## Phase 3 — Customer flow (cheapest full slice to validate the kit end-to-end)
**Goal: a customer can browse and submit a real order**
1. Home: header/search + Restaurants row (`HorizontalScroller` + `EntityCard`) + Categories chips + Popular Foods (`ResponsiveGrid`)
2. Restaurant profile (header + menu list)
3. Food details (`QuantityStepper`) → Order builder (add another item, same-restaurant constraint)
4. Customer info form (`FormField`) → Payment method selection → screenshot upload (`ImageUploadField`)
5. Submit → Order ID generation → confirmation screen
6. Track Order (phone + order ID lookup) + Order history

*Exit check: full order can be placed and tracked against real backend, no owner/admin needed yet — seed a "fake" restaurant manually in DB.*

## Phase 4 — Restaurant owner: registration & Live flow
**Goal: an owner can self-onboard**
1. Register (name/phone/email/password) → login
2. Request Live → registration fee + NATRA payment info display → upload payment screenshot (`Stepper/Wizard`)
3. Pending state UI
4. (Depends on Phase 6 admin approval to actually flip Live — stub approval manually in DB for now if needed)

*Exit check: new owner account can register and submit a Live request end-to-end.*

## Phase 5 — Restaurant owner: management + orders
**Goal: full owner back-office**
1. `RoleShell` 4-tab nav (Dashboard, Orders, Restaurant, Account)
2. Restaurant management: profile, logo, cover, description, categories, opening hours (`ToggleSwitch` per day), service areas (add/edit/delete), payment methods config
3. Menu management: Add/Edit/Delete/Hide food (`crudFactory` + `ImageUploadField`)
4. Orders: incoming list (`ListWithPagination`), order detail view, Accept/Reject/Complete actions (`statusTransition`), Call Customer
5. Dashboard: new orders count, sales summary, quick actions (Add Food, Open/Close toggle, View Orders)
6. Order notifications: browser notification + sound + badge count

*Exit check: owner can fully configure a restaurant, receive a real order from Phase 3, and move it through New → Accepted → Completed.*

## Phase 6 — Admin
**Goal: thin oversight layer closes the loop**
1. Admin login
2. Dashboard (totals, pending Live requests, recent activity)
3. Restaurant management: list, detail, Live-request review (`ImageViewer` for screenshot), Approve/Reject, Suspend/Reactivate (`statusTransition`)
4. Order management: view all, search, filter by restaurant/status/date
5. Platform settings: registration fee + payment info config, order timeout config (Off/15m/30m/1h/Custom + notify-before-expiry)

*Exit check: admin can approve a pending owner from Phase 4, making them Live and visible in Phase 3's customer home.*

## Phase 7 — Cross-cutting logic
**Goal: things that depend on multiple phases being live**
1. Popularity ranking (real completed-sales aggregation) → wire into Popular Foods grid
2. Order timeout/expiry cron job (respects admin setting from Phase 6)
3. Notification delivery wiring end-to-end (owner gets it on new order, customer gets it on accept/reject)

## Phase 8 — Responsive + polish
1. Test all screens at mobile/tablet/desktop/large-desktop breakpoints
2. Image compression/lazy loading/thumbnails audit
3. DB indexing pass on hot queries (order lookup by phone, popularity, admin filters)
4. Empty states, loading states, error states pass across all screens

## Phase 9 — Deployment
1. Oracle Cloud VM provisioning, Ubuntu setup
2. Environment variables/secrets wired (DB, Object Storage, auth)
3. GitHub → VM deployment pipeline
4. Smoke test full 3-role flow in production environment

---

## Why this order
Phases 0–2 are pure infrastructure (no wasted screen work before the kit exists).
Phase 3 is the cheapest way to prove the entire stack works end-to-end using only
read-heavy screens plus one write. Phases 4–6 are the three role-surfaces, each
unlocking data the next one needs (owner creates data → admin approves it →
customer sees it). Phase 7 only makes sense once real orders/restaurants exist
to aggregate. Phases 8–9 are hardening, not new logic.
