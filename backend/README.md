# NATRA Backend

API, business logic, DB access, and Object Storage integration.

## Stack
- Node.js + Express
- Oracle Autonomous AI Database (via `oracledb` driver)
- Oracle Object Storage for media
- `zod` for validation, `bcrypt`/`jsonwebtoken` for auth, `sharp` for image processing

## Structure
```
src/
  routes/        Express route definitions (thin — delegate to controllers)
  controllers/   Request/response handling, calls services
  services/       Business logic, reusable across controllers
  models/        DB access layer (queries, mapping rows <-> objects)
  middleware/    Auth, ownership checks, error handling
  config/        DB connection, Object Storage client, env loading
  utils/         Generic helpers (crudFactory, statusTransition, paginate, etc. — Task 1.x)
  app.js         Express app setup (middleware, route mounting)
  server.js      Entry point — starts the HTTP server
```

## Setup
```bash
cp .env.example .env    # fill in DB / Object Storage / JWT secrets
npm install
npm run dev              # starts on http://localhost:4000
npm run db:test          # confirms the Oracle Autonomous DB connection works
npm run storage:test     # confirms the Oracle Object Storage bucket works
npm run seed:restaurants # seeds 4 fake restaurants (+ owners, logos, covers,
                          # categories, foods, a payment method, sample orders)
npm run seed:restaurants -- --force  # deletes existing seed data first
```

## Status
Skeleton in place (Task 0.2). DB schema and migrations (0.5–0.10), the
Oracle Autonomous DB connection (0.11 — `src/config/db.js` pool +
`npm run db:test`), Oracle Object Storage (0.12 —
`src/config/objectStorage.js` hand-rolled signed REST client +
`npm run storage:test`), the restaurant seed script (0.13 + 0.14 —
`src/scripts/seedRestaurants.js` + `npm run seed:restaurants`, seeding
restaurants/categories/foods/a payment method/sample orders), and
`GET /api/health` (0.15 — checks DB + Object Storage connectivity) are
done. `npm run lint` now has a real config (`.eslintrc.json`, added in
0.16 — it was missing before, so the script would have failed) and both
lint and a build-sanity check run in CI on every push (0.16 —
`/.github/workflows/ci.yml`).
Phase 0 (Foundation) is fully scaffolded. Phase 1 (backend kit) has started:
`crudFactory` (1.1–1.3) and `ownershipMiddleware` (1.4) are done.
`src/services/uploadToObjectStorage.js` (1.5, extended by 1.6) is built on
top of Task 0.12's low-level Object Storage client — accepts a
Multer-shaped file + folder param, recompresses jpeg/png/webp images
through `sharp` (downscale + re-encode, EXIF-orientation-safe, gifs left
untouched), uploads a second thumbnail object alongside the main one, and
returns `{ url, objectName, thumbnailUrl, thumbnailObjectName }`. Both real
`npm run lint` and the real `npm test` (41/41) now pass in this sandbox —
network access to install the packages was available this session, closing
that standing caveat from 1.1–1.5.
`src/utils/statusTransition.js` (1.7) is a generic allowed-transitions-map
+ on-transition-hook factory — not tied to any one table, meant to drive
`orders.status`, `live_requests.status`, and `restaurants.live_status`
alike once Phase 5/6 wire it up (5.14/5.15, 6.7). It validates a proposed
`from -> to` move against a caller-supplied map (409 if disallowed),
optionally stamps a timestamp, then hands off to a caller-supplied
`onTransition` hook that actually persists the change (typically via
crudFactory's `update`/`updateForOwner`) — this module never touches the
DB itself. `src/utils/statusTransition.test.js` (1.8) is a real, checked-in
Jest suite (37 tests) covering it, same style as `crudFactory.test.js`
(1.3) — no DB mocking needed since statusTransition has no I/O of its own.
`src/utils/paginate.js` (1.9) wraps `findAll`/`count` (the latter new on
`crudFactory` this task, alongside `countForOwner` for owner-scoped
tables) into `paginate`/`paginateForOwner`, returning both a page of rows
and `{ total, page, totalPages, hasNextPage, hasPrevPage }` metadata for
`ListWithPagination` (Task 2.16) to render.
`src/utils/phoneLookup.js` (1.10) is a factory (bound to one crudFactory
instance + phone/code column names, same shape as `ownershipMiddleware`)
covering the two customer-facing, no-auth lookups the app needs since
customers have no account row: `findAllByPhone` (Order History, 3.18 —
built on top of 1.9's `paginate`) and `findOneByCode`/`getOrThrowByCode`
(Track Order, 3.17 — requires *both* a code and a phone, since a phone
number alone isn't a secret). Also exports `normalizePhone`, which order
submission (Task 3.15) will need to use at write time so differently
-formatted phone numbers still match at lookup time.
`src/utils/passwordHash.js` (1.11) wraps the `bcrypt` dependency (in
`package.json` since 0.2, unused until now) into `hashPassword(plain)` /
`verifyPassword(plain, hash)` for the `users.password_hash` column
(`docs/DB_SCHEMA.md`). Both are `async` (bcrypt's `hash`/`compare`, not
the sync variants) since this runs inside Express handlers. Rejects
empty/invalid plaintext with a 400 via `errors.js`; `verifyPassword`
throws a 500 (rather than quietly returning `false`) if the stored hash
is missing or not bcrypt-shaped, so a data bug surfaces immediately
instead of looking like a wrong password. `SALT_ROUNDS` (12) is exported
for callers/tests. This was broken into sub-steps (scaffold → validation
→ bad-hash guard → async-pattern decision → tests → docs) before
implementation; see `/docs/PROJECT_STATUS.md`'s 1.11 entry for the full
breakdown.
`src/models/users.js` (1.12) is the first real `crudFactory` instance in
the codebase — `{ table: 'users', columns: ['role','full_name','email',
'phone','password_hash'] }`, no `ownerColumn` (`users` isn't owned by
anything; `restaurants.owner_id` points at it). `src/controllers/
authController.js` adds `signup` (1.12) and `login` (1.13): `signup`
validates the payload with `zod` (already a dependency), lowercases
email, checks for an existing row before insert (409 via `errors.js`'s
`conflict`, with an ORA-00001 catch as a fallback for a real
unique-constraint race), hashes the password via `passwordHash` (1.11),
and strips `password_hash` out of the response via a reusable
`toPublicUser` helper. `login` looks the user up by lowercased email,
verifies the password with `verifyPassword` (1.11), and — unknown email
or wrong password — returns the exact same 401 (`errors.js`'s new
`unauthorized` helper, added this task) with the exact same message, so
login can't be used to enumerate accounts; on success it signs a JWT
(`jsonwebtoken`, a dependency since 0.2) with `{ sub: id, role }` using
`JWT_SECRET`/`JWT_EXPIRES_IN` from `.env.example`. Mounted as `POST
/api/auth/signup` and `POST /api/auth/login` (`src/routes/auth.routes.js`,
at `/api/auth` in `app.js`).
Caveat covering 1.9–1.13, **closed this session**: prior sessions had no
npm registry access, so `paginate.test.js`, `phoneLookup.test.js`,
`passwordHash.test.js`, and `authController.test.js` had only been
verified by hand (see `/docs/PROJECT_STATUS.md`'s 1.9–1.13 entries for
how). This session had real registry access (`npm ci` succeeded), so the
full suite was run for real: **`npm test` — 7 suites, 179 tests, all
passing**; `npm run lint` clean. No regressions from any of 1.9–1.13's
hand-verified work.

Task 1.14 (auth middleware) is being built in sub-steps (`docs/TASKS.md`
1.14a–f). **1.14a — done**: `src/middleware/authMiddleware.js` exports
`extractBearerToken(req)`, which reads/validates the `Authorization`
header (`Bearer <token>` scheme, case-sensitive per RFC 6750) and throws
a 401 (`errors.js`'s `unauthorized`) for a missing header, a non-string
header (Node can hand back an array if the header was sent more than
once), a non-Bearer scheme, or an empty/whitespace-only token — one
generic "Authentication required" message for all of them, same
don't-leak-which-part-was-wrong reasoning login (1.13) already applies to
bad credentials. **1.14b — done**: the same module adds
`verifyToken(token)`, calling `jwt.verify` against `JWT_SECRET` and
returning the decoded `{ sub, role, iat, exp }` payload. Bad signature,
malformed structure, and expired all collapse to the same 401 ("Invalid
or expired token") for the same don't-leak-which-part-failed reason; a
*missing* `JWT_SECRET`, though, is treated as a server misconfiguration
rather than a bad client token — it throws a plain `Error` (500 via the
central handler), not an `ApiError`, same "surface a config bug loudly"
pattern `verifyPassword` (1.11) uses for a malformed stored hash. **1.14c
— done**: `authMiddleware(req, res, next)` — the actual assembled Express
middleware — composes 1.14a + 1.14b with a `users.findById` (1.12) lookup
on the decoded `sub`, attaching the result as `req.user` via the same
`toPublicUser` helper signup/login already use (never `password_hash`). A
token naming a since-deleted user collapses to the same 401 as any other
invalid token. **1.14d — done**: `authMiddleware` is now mounted, on
`GET /api/auth/me` (`authController.js`'s new `me` handler, just
`res.json({ user: req.user })` since the middleware already did the
lookup) — the first protected route in the codebase, chosen because it
needs no ownership scoping and gives the wiring something real to be
verified against. **Known, deliberately-not-solved-here gap, documented
in both `authMiddleware.js` and `auth.routes.js`**: `req.user` has no
`restaurant_id` (a `users` row doesn't carry one —
`restaurants.owner_id` points at `users.id`, not the reverse), so
`ownershipMiddleware` (1.4), which needs `req.user.restaurant_id` for
owner-scoped tables, still can't simply be chained after `authMiddleware`
— carried forward as a dependency for 1.15/1.16.
`authMiddleware.test.js` (23 tests as of 1.14a–d) covers the middleware's
own logic directly; `authController.test.js` gained a new
`GET /api/auth/me` block (5 tests) exercising the real route through
`supertest` — a different layer, proving the wiring itself works.

**1.14e — done**: `authMiddleware.test.js`'s `authMiddleware` describe
block (the assembled-middleware, end-to-end layer, as opposed to the
`extractBearerToken`/`verifyToken` unit-level blocks above it) closed a
gap against `docs/TASKS.md`'s own 1.14e spec — valid token, missing
header, non-Bearer header, malformed token, invalid signature, expired
token, and deleted-user token all reject with 401 — by adding the three
cases it was missing (non-Bearer scheme, malformed token, expired token,
each re-checked one layer up through the real middleware, not just the
underlying helper functions). File now has 26 tests; full suite **7
suites, 199 tests**. **1.14f — done**: manual/integration verification
run as a scratch (not shipped) script that boots the real `createApp()`
behind a real `supertest` HTTP listener — same `fakeDb` swap-in as the
test suite — and drives the actual signup → login → `GET /api/auth/me`
lifecycle through real routing/JSON-body-parsing/middleware, then hits
`GET /api/auth/me` with each of the 401 cases (no header, non-Bearer
scheme, malformed token, wrong-secret token, expired token, and a
since-deleted-user token via `fakeDb.__reset()` after issuing the token)
against the running app rather than by calling functions directly — all
13 checks passed. Real `npm test` (7 suites, 199 tests), `npm run lint`
(0 errors, the same 2 pre-existing `password_hash`/`password`
destructuring warnings from before this task), and the build-sanity boot
check (`node -e "require('./src/app')()"`) all clean, zero regressions.

**Task 1.14 (auth middleware) is fully done, all of 1.14a–f.** Task 1.15
(wire `crudFactory` to a real, ownership-checked `foods` endpoint) is now
well underway, broken into 1.15a–g (`docs/TASKS.md`):
- **1.15a** — `models/restaurants.js` (`ownerColumn: 'owner_id'`) +
  `middleware/attachOwnerRestaurant.js`, mounted after `authMiddleware`,
  closes the `req.user.restaurant_id` gap: attaches it (+ `req.restaurant`)
  for an owner with a restaurant, 403s one with none yet, no-ops for
  other roles.
- **1.15b** — `models/foods.js`, `ownerColumn: 'restaurant_id'` — the
  "normal" direction, so `ownershipMiddleware` needs no override.
- **1.15c** — `models/foodVisibility.js` + `services/
  createFoodWithVisibility.js`: creates a food and its default
  `food_visibility` row together in one transaction (`crudFactory`'s new
  `{ connection }` option + `config/db.js`'s `withTransaction`), per
  `docs/DB_SCHEMA.md`'s "enforced in the service layer" note.
- **1.15d** — `routes/food.routes.js` + `controllers/foodController.js`,
  mounted at `/api/foods`: `authMiddleware` → `attachOwnerRestaurant` →
  `ownershipMiddleware(foodsCrud)` on every single-resource route;
  `create` always goes through `createFoodWithVisibility`, never a bare
  `foods.create`.
- **1.15e**: `createFoodSchema`/`updateFoodSchema`
  (zod) added to `foodController.js`, closing the "missing/wrong-typed
  field only fails as a generic 500" gap 1.15d's own header comment had
  flagged. Both schemas are `.strict()` — a caller-supplied
  `restaurant_id`/`id` is now rejected with a 400 (previously silently
  overridden/dropped); `price` is checked for `NUMBER(10,2)`'s exact
  range/precision; `updateFoodSchema` also rejects an empty update.
- **1.15f — done, this session**: `routes/food.routes.test.js`, 35 real
  `supertest`-driven tests against the real Express app + `fakeDb` —
  every route's happy path, every 1.15e validation failure mode,
  cross-owner 404 isolation (confirming the other owner's row is
  genuinely untouched, not just that the response looked like a 404), a
  non-numeric `:id` 400, an unauthenticated 401, and an owner-with-no-
  restaurant-yet 403. **Found and fixed a real bug while writing it**:
  `POST /` and `GET /` are the only two routes with no `:id`, so neither
  chains `ownershipMiddleware` (1.4) — the thing that would otherwise
  403 on a missing `req.user.restaurant_id`. `attachOwnerRestaurant`
  (1.15a) no-ops for a non-owner role trusting a chained
  `ownershipMiddleware` to catch that afterward, which is never true for
  these two routes. Before the fix, an `admin` token could
  `POST /api/foods` and insert a food with `restaurant_id: undefined`.
  Fixed with a small `requireRestaurantScope(req)` guard in
  `foodController.js`, called at the top of `list`/`create`, throwing
  the same 403 `ownershipMiddleware` itself would have — pinned with two
  regression tests. Real `npm test` — **10 suites, 249 tests**, zero
  regressions. Real `npm run lint` clean (same 2 pre-existing warnings).
  Build-sanity boot check still clean. See `docs/PROJECT_STATUS.md`'s
  1.15f entry for the full writeup.

Next: **1.15g** — manual/integration verification + closing out Task
1.15 as a whole. See `/docs/TASKS.md`.

**1.15g — done, this session, closing out Task 1.15 as a whole.** No
`npm`/registry access in this session's sandbox (same constraint noted
for 1.9–1.14's verification passes; `node_modules` isn't installed and
`npm install` 403s), so `npm test`/`npm run lint` weren't re-run here —
1.15f's entry above already has the real numbers from the session that
had access. Instead, hand-verified the full request chain end to end by
calling the real modules directly (`attachOwnerRestaurant` →
`ownershipMiddleware(foodsCrud)` → `foodController` handlers) against
the same `fakeDb` double the checked-in tests use, with `oracledb` and
`zod` stubbed just enough to load the real, unmodified controller code
(no shim checked into the repo — throwaway, sandbox-local only):
- owner A creates a food → 201, and its `food_visibility` row exists
  (confirms `createFoodWithVisibility`'s transaction, 1.15c)
- a body-supplied `restaurant_id` on create → 400, rejected by
  `createFoodSchema`'s `.strict()` (1.15e)
- owner A's list only returns owner A's food (1.15b's scoping)
- owner B hitting owner A's food id → 404 via `ownershipMiddleware`
  (cross-owner isolation)
- owner A can get/update/delete their own food; after delete,
  `findByIdForOwner` confirms it's actually gone
- an `admin` token hitting `POST`/`GET /api/foods` → 403 via
  `requireRestaurantScope` — the exact regression 1.15f's bug-fix is
  meant to hold

All 11 checks passed, no changes needed. Task 1.15 is fully checked off
in `docs/TASKS.md`.

Next: **Task 1.16** — wire `crudFactory` to the remaining owner-scoped
tables (categories, service areas, payment methods, opening hours),
reusing `attachOwnerRestaurant` as-is. Worth deliberately re-checking
(not assuming copied-and-safe) whether any of 1.16's own collection
routes need their own `requireRestaurantScope`-style guard, the same way
`foodController.list`/`create` did.

**1.16a–d are all done** — `categories`, `service_areas`,
`payment_methods`, and `opening_hours` are wired up and mounted
(`/api/categories`, `/api/service-areas`, `/api/payment-methods`,
`/api/opening-hours`), each with the `requireRestaurantScope` guard
included from the start. `opening_hours` is the narrowest of the four
(list + update only — see `docs/PROJECT_STATUS.md`'s 1.16d entry for why)
and the one table needing an explicit `selectColumns` override, since
it has neither `created_at` nor `updated_at`. Full per-table writeups
are in `docs/PROJECT_STATUS.md`, not duplicated here.

Next: **1.16e** — final cross-table manual/integration verification
pass once registry access is available, plus this status update.

**1.16e is done — Task 1.16 is fully closed out.** Hand-verified all
four tables together in one run (signup/login for two owners + an
admin, `attachOwnerRestaurant` for both, then categories/service_areas/
payment_methods/opening_hours each exercised through their real
routes' middleware chain against `fakeDb`) — 21/21 checks passed, no
route collisions across the 7 mounted `/api/*` prefixes. Full writeup
in `docs/PROJECT_STATUS.md`'s 1.16e entry. `docs/TASKS.md`'s 1.16
(and 1.16a–e) are all checked off.

Phase 1's own exit check (curl/Postman against a real running
server + Oracle/Object Storage) is still open — that needs a live
environment this sandbox doesn't have, not more code; everything it
depends on is built and verified at the code level.

Next: **Phase 2** — frontend component kit (`docs/TASKS.md`'s 2.1
onward).

**Task 3.3** (frontend customer flow) added the first genuinely public
route in this backend: `GET /api/restaurants`
(`src/controllers/restaurantController.js` + `src/routes/restaurant.routes.js`,
mounted at `/api/restaurants` in `app.js`) — no `authMiddleware` at all,
since customers have no accounts. Returns only "Live" restaurants
(`live_status = 'approved' AND is_suspended = 0`, `docs/DB_SCHEMA.md`'s
own definition), via the existing `paginate()` utility (Task 1.9) against
the existing `restaurants` crudFactory instance (Task 1.15a) — no new
model needed. `is_open` is deliberately not filtered on, so a Live-but-
Closed restaurant still returns (frontend shows it with a Closed badge).
`restaurant.routes.test.js` (14 tests) is checked in for when registry
access is available; hand-verified in the meantime (15 checks against
the real controller/model/`paginate`/`fakeDb` chain, calling the
controller directly with req/res doubles — same no-registry-access
constraint as every 1.9–1.16 verification pass). See
`docs/PROJECT_STATUS.md`'s 3.3 entry for the full writeup, including the
frontend half (Home screen's Restaurants row).

**Task 3.4** added the second public route: `GET /api/categories/live`
(`src/services/liveCategories.js` + `src/controllers/
customerCategoryController.js` + `src/routes/customerCategory.routes.js`,
mounted at `/api/categories/live` in `app.js`, deliberately **before**
the existing owner-scoped `/api/categories` mount — see `app.js`'s own
comment there for why the order matters: `/api/categories/live` is a
prefix match for `/api/categories` too, and the owner router's `GET
/:id` would otherwise swallow the literal segment "live" as an `:id` and
401 via `authMiddleware` before this public route ever ran). Unlike
`/api/restaurants` (Task 3.3, built on the existing `paginate()` +
`restaurants` crudFactory instance), this needed a hand-written raw SQL
query — `crudFactory` only ever does single-table reads (see its own
header comment), and this is a `categories`-to-`restaurants` join,
filtered to the exact same "Live" definition `restaurantController.js`'s
`LIVE_FILTER` uses (`live_status = 'approved' AND is_suspended = 0`) —
via `withConnection` directly, the same pattern `health.routes.js`
(Task 0.15) already used for its own raw `SELECT 1 FROM DUAL` check.
Returns every distinct category name across every Live restaurant, no
pagination (a chip row has no page controls to hand params to, and this
app's whole category vocabulary is small and owner-authored by hand —
see `liveCategories.js`'s own header comment if that assumption ever
stops holding). `liveCategories.test.js` (mocks `../config/db` with a
minimal hand-rolled `withConnection` double, not `fakeDb` — `fakeDb`
can't parse a JOIN, see that file's own header comment) and
`customerCategory.routes.test.js` (same mock, real `supertest` against
the real app, including a regression test pinning that this route isn't
shadowed by the owner-scoped router's `GET /:id`) are both checked in
for when registry access is available; hand-verified in the meantime —
10 checks against the real, unmodified service/controller with a
require-cache-injected fake `config/db` (bypassing the need for a real
Oracle pool), covering the row-to-name mapping, the exact SQL shape/
binds, the empty-result case, the controller's response shape, and error
propagation via `next(err)`. See `docs/PROJECT_STATUS.md`'s 3.4 entry
for the full writeup, including the frontend half (Home screen's
Categories chip row).

**Task 3.5** added the third public route: `GET /api/foods/popular`
(`src/services/popularFoods.js` + `src/controllers/customerFoodController.js`
+ `src/routes/customerFood.routes.js`, mounted at `/api/foods/popular` in
`app.js`, deliberately **before** the existing owner-scoped `/api/foods`
mount — same shadowing concern `/api/categories/live` already had against
`/api/categories`: `/api/foods/popular` is a prefix match for `/api/foods`
too, and the owner router's `GET /:id` would otherwise swallow the
literal segment "popular" as an `:id` and 401 via `authMiddleware` before
this public route ever ran). Same "no join support in crudFactory" reason
as `/api/categories/live` needed a hand-rolled query — this one's a
three-way join (`foods` → `restaurants`, filtered to the same "Live"
definition as `restaurantController.js`'s `LIVE_FILTER`, plus a new join
to `food_visibility` filtered to `is_hidden = 0`, since a customer-facing
foods endpoint is the first place in this codebase a hidden food's
exclusion actually matters). Ranked by `f.name ASC` as a placeholder —
`docs/NATRA_MASTER_PROMPT.md` calls for ranking by completed sales/order
volume, which is Task 7.2's job and doesn't exist yet. Unlike
`/api/categories/live` (no pagination — a chip row has no page controls
and this app's category vocabulary is small), this endpoint *is*
paginated via the existing `parsePaginationParams`/`buildPaginationMeta`
(Task 1.9), same as `/api/restaurants` — a foods grid across every Live
restaurant's whole menu can grow much larger than the category list, so
that same "build real paging in from the start" call applies here even
though the current Home screen usage only ever asks for one bounded page.

`popularFoods.test.js` (mocks `../config/db` directly, same
`withConnection`-double approach `liveCategories.test.js` uses, since
`fakeDb` can't parse a JOIN) and `customerFood.routes.test.js` (same
mock, real `supertest` against the real app, including a regression test
pinning that this route isn't shadowed by the owner-scoped router's
`GET /:id`) are both checked in. **This session had real npm registry
access** — ran the actual `npm install`/`npm test`: full suite is now
**19 suites, 330 tests**, all passing except one pre-existing failure
unrelated to this task (`paymentMethod.routes.test.js`'s cross-owner-
isolation case, Task 1.16c — flagged, not fixed, to stay in scope; see
`docs/PROJECT_STATUS.md`'s 3.5 entry). Real `npm run lint` clean (same 2
pre-existing warnings as every prior session). `node --check` passed on
every new/changed file.

**Also found and fixed a real, previously-unverified bug while running
`liveCategories.test.js` for real for the first time**: `withConnection`
is the one `jest.mock(...)`-created function shared across every test in
that file, and only `mockConnection` was being reset in `beforeEach` —
`withConnection`'s own call count kept accumulating across tests, so its
"borrows a connection... " test failed the instant it actually ran under
Jest (it had only ever been hand-verified before, with no registry
access). Fixed with `withConnection.mockClear()` in `beforeEach`; applied
proactively to the new `popularFoods.test.js` too, so it doesn't carry
the same latent bug in. See `docs/PROJECT_STATUS.md`'s 3.5 entry for the
full writeup, including the frontend half (Home screen's Popular Foods
grid) — Phase 3 exit check is now within reach once 3.6 (search wiring)
lands.

**Note:** this Status section fell behind the same way
`docs/PROJECT_STATUS.md`'s own "Current stage" section once had (see
that doc's note near its top) — Tasks 3.6 (search), 3.7 (restaurant
profile header), and 3.8 (restaurant menu) all landed with their own
full write-ups in `docs/PROJECT_STATUS.md`, but weren't backfilled here.
Not fixed as part of this task (3.9) either, to avoid duplicating what
`docs/PROJECT_STATUS.md` already documents in full — see that file's
3.6/3.7/3.8 entries directly.

**Task 3.9** added a fourth public route: `GET /api/foods/detail/:id`
(`src/services/popularFoods.js`'s new `getPublicFoodById` + a new `getOne`
on `src/controllers/customerFoodController.js` + a new
`src/routes/customerFoodDetail.routes.js`), mounted at
`/api/foods/detail` in `app.js`, deliberately before the owner-scoped
`/api/foods` mount — same shadowing concern `/api/foods/popular` and
`/api/categories/live` already had. Backs the new Food Details screen.
Reuses `popularFoods.js`'s existing join (`BASE_FROM`/`LIVE_FOOD_BINDS`)
rather than a second hand-written copy, scoped down to one row by
`f.id` — a food belonging to a non-Live restaurant, or one that's
hidden, resolves to `null` (turned into a 404 by the controller),
identical to how `restaurantController.js`'s `getProfile`/`getMenu`
(3.7/3.8) already treat a non-Live restaurant. Kept as its own route/
segment rather than added onto `food.routes.js` or `customerFood.routes.js`
— see `customerFoodDetail.routes.js`'s own header comment for why either
of those would have been a real problem (route shadowing) or just a
misleading URL, not merely a style preference.

**No test file was written for this task** — deferred at the user's
explicit request (to be conducted in a later session), unlike every
other "tests unverified" note elsewhere in this file, which are all
registry-access gaps rather than a deliberate skip. `node --check`
passed on all four new/changed files. See `docs/PROJECT_STATUS.md`'s
3.9 entry for the full writeup, including the frontend half (the new
Food Details screen and the "Buy Now → `/order/builder` placeholder,
carrying real selection state" design call).

**Note:** this Status section still has the drift flagged in the 3.9
entry above (Tasks 3.6–3.12 aren't individually recapped here) — not
fixed as part of this task either, for the same reason: avoid
duplicating what `docs/PROJECT_STATUS.md` already documents in full.

**Task 3.13** added a fifth public route on the restaurants router:
`GET /api/restaurants/:id/payment-methods`
(`src/controllers/restaurantController.js`'s new `getPaymentMethods`),
mounted in `src/routes/restaurant.routes.js`. Unlike `GET /:id/foods`
(3.8), this needed no raw-SQL join — `payment_methods` already has its
own `restaurant_id` column, so it reuses the existing
`paymentMethodsCrud.findAllForOwner` (Task 1.16c) filtered to
`is_active: 1`, same "never leak a non-Live restaurant" 404 as
`getProfile`/`getMenu` via the shared `isLive` helper. Extended
`src/routes/restaurant.routes.test.js` (not a new file, since this
endpoint's plain single-table read works against the existing `fakeDb`
double) with 8 new tests: active/inactive filtering, ordering,
cross-restaurant isolation, empty list, every non-Live combination,
nonexistent id, and Live-but-Closed still returning methods.

**No npm registry access this session** (same standing gap since
several sessions) — hand-verified: the real, unmodified
`getPaymentMethods` run directly against the checked-in `fakeDb` double
via a `require.cache` injection swapping `../config/db`, covering all 7
cases named in `docs/PROJECT_STATUS.md`'s 3.13 entry — all passed.
`node --check` passed on all three changed/new backend files. See that
entry for the full writeup, including the frontend half (the new
Payment Method screen and the `useOrderCart` `paymentMethodId`
extension).

**Task 3.15** (submit order endpoint) landed across its own 4 sub-steps
(3.15a–d, `docs/TASKS.md`):
- **3.15a** — the data layer: `src/models/orders.js` and
  `src/models/orderItems.js` (plain `crudFactory` instances, no
  `ownerColumn` on `order_items` — same reasoning `food_visibility`
  already documents), plus `src/utils/orderCode.js` generating the
  unique `NTR-#####` `order_code` customers see.
- **3.15b** — `src/services/submitOrder.js`: the one place an order is
  ever created from, same role `createFoodWithVisibility` (1.15c) plays
  for foods. Re-fetches every `food_id`'s current price server-side
  (never trusts a client-sent price/subtotal/total), rejects an
  unknown/hidden food, enforces the single-restaurant constraint,
  validates `payment_method_id` belongs to that restaurant and is
  active, normalizes `customer_phone` via `normalizePhone` (1.10) before
  storing it, and writes the `orders` row + every `order_items` row as
  one transaction — with a real retry loop (up to 5 attempts) on an
  `order_code` collision, same `ORA_UNIQUE_CONSTRAINT_VIOLATION` check
  `authController.js` (1.12) already established for `uq_users_email`.
- **3.15c** — `src/routes/order.routes.js` + `src/controllers/orderController.js`:
  `POST /api/orders`, mounted with no `authMiddleware` (same as every
  customer-facing route since 3.3). The controller is deliberately thin
  — a `.strict()` zod schema validates the request shape (rejecting a
  client-supplied `subtotal`/`total`/`order_code`/`restaurant_id`/
  `status`, or a per-item `price`, with a 400 rather than silently
  dropping it), then hands off entirely to `submitOrder` (3.15b) for
  every actual business rule. Returns `201` with `{ order, items }`.
- **3.15d** — `src/routes/order.routes.test.js`: the full `app.js`
  stack (real Express + `supertest`, `fakeDb` double), covering the
  happy path (including the computed subtotal/total and the persisted
  `order_code` format), every required-field/length/type rejection,
  every `.strict()` rejection, `customer_phone` normalization
  end-to-end, and one representative case each of `submitOrder`'s own
  business-rule rejections (hidden food, cross-restaurant items)
  surfacing as a clean 400 through the real route — not re-litigating
  every case `submitOrder.test.js` (3.15b) already covers in isolation.

**No npm registry access this session either** (same standing gap as
3.13's own note above) — hand-verified two ways: `orderController.js`'s
schemas/handler were run through a small hand-rolled zod-subset shim
(3.15c, 27 checks), then the real, unmodified `orderController.js` +
`submitOrder.js` + models were run end-to-end against the checked-in
`fakeDb` double via the same `require.cache` injection technique 3.13
used (3.15d, 36 checks covering every scenario named above, plus
confirming the `orders`/`order_items` rows are actually persisted, not
just a shaped response). `node --check` passed on every new/changed
file. `orders.status`'s DB `DEFAULT('New')` is deliberately not
asserted anywhere in `order.routes.test.js` — `fakeDb` doesn't simulate
column defaults (same reason `submitOrder.test.js` never asserts it
either); only a real DB round trip confirms that value. A real
`npm test` (jest/supertest/zod) and a live-DB check still need to
confirm all of this before Task 3.15 fully merges. See
`docs/PROJECT_STATUS.md`'s 3.15a–d entries for the full writeup.

**Task 3.18a** (order history endpoint, backend half of Order History)
adds `GET /api/orders/history?customer_phone=...&page=...&limit=...` to
`order.routes.js`/`orderController.js`, right alongside `track` (3.17).
Unlike `track`, this is a *list* endpoint: it takes a phone alone (no
order code) and calls the same `orderLookup` (`phoneLookup`, Task 1.10)
instance's existing `findAllByPhone`, so no new lookup logic was needed
— only a new `.strict()` zod schema (`customer_phone` + optional
`page`/`limit`) and a thin handler. Returns `paginate()`'s own
`{ rows, meta }` shape untouched, so the frontend's `usePaginatedQuery`
(Task 3.18c) needs no reshaping. Rows are ordered `id DESC` (most recent
first) rather than `created_at` — `created_at` isn't in `orders.js`'s
settable `columns` list (it's DB-managed, same as `status`), and
`findAll`'s `orderBy` is only allow-listed against the primary key plus
those settable columns; `id`, a strictly increasing surrogate key, is an
equally reliable proxy for insertion order without widening that
allow-list for this one caller. A phone with zero orders returns `200`
with an empty `rows` array and `meta.total === 0`, never a `404` — there
is no single resource to have "not been found" the way `track`'s
code+phone pair identifies one.

`order.routes.test.js` gained a `GET /api/orders/history` describe
block: no-auth-header, happy path with multiple orders returned newest
first, cross-phone isolation (one phone's orders never leak into
another's results), the phone-normalization match `track` also relies
on, the empty-list-not-404 case, a missing-phone 400, a full
limit/page pagination round trip (page 1 and page 2 of a 2-order
history), a non-integer `page` 400, and the same unknown-query-param
`.strict()` rejection `track`'s own suite checks. All 45 tests in the
file (including the pre-existing `POST`/`track` suites) pass under a
real `npm install && npm test`, and `npx eslint` on the three
changed/new files reports no issues.

Still open for **3.18**: the frontend Order History screen itself
(3.18c — phone-only form + `ListWithPagination`) and wiring/polish
(3.18d — route in `App.jsx`, a link from Track Order, manual
verification). See `docs/TASKS.md`'s 3.18 breakdown and
`docs/PROJECT_STATUS.md`'s 3.18a entry for the full writeup.

**Task 3.18 (and Phase 3) is now fully complete** — 3.18c/3.18d were
frontend-only work (a new `OrderHistory` screen, `App.jsx` routing, and
reciprocal links between it and `TrackOrder`), with no further backend
changes beyond 3.18a above. See `frontend/README.md` and
`docs/PROJECT_STATUS.md` for that half of the writeup.

**Task 4.3 (Request Live screen) added one new backend endpoint**: `GET
/api/admin-settings/registration` (`adminSettingsController.js`, backed
by a new `models/adminSettings.js`). Public, no `authMiddleware` — an
owner reading the Request Live screen may not be logged in yet this
session, and none of the five `registration_*` fields are sensitive.
This is the first `crudFactory` instance with no `ownerColumn`:
`admin_settings` is a genuine platform-wide singleton (`id = 1`, seeded
by migration 0010 itself), not scoped to any restaurant. Returns only
the five `registration_*` fields, deliberately never
`order_timeout_mode`/`order_timeout_custom_minutes`/
`notify_before_expiry` — those are Task 6.13's platform-internal config
on the same row, irrelevant to a prospective owner. See
`adminSettingsController.js`'s own header comment for the full
reasoning, including why its 404-when-missing branch is a safety net,
not an expected path against a real DB.

No npm registry access this session — this time `node_modules` was
fully absent (not even `express`/`oracledb` resolve), a harder gap than
recent sessions' "npm install 403s but some packages present" case.
Verified instead with a hand-rolled Node script stubbing `oracledb` and
`../config/db` via `require.cache` injection (same technique 3.15's own
log entry used) and calling the controller directly — 6 checks, all
passing. A real `npm install && npm test` still needs to confirm this
before the task is considered fully closed. See `docs/PROJECT_STATUS.md`
for the full writeup, including the frontend half (a new `RequestLive`
screen, the first real use of the `Wizard` component).

**Task 4.5 (Request Live: submit endpoint) is broken into 4.5a–d**
(`docs/TASKS.md`), same convention as 1.15/3.15 since it has the same
two-table-transaction shape as both. **4.5a (data layer) is done**:
`models/liveRequests.js` (`ownerColumn: 'restaurant_id'`, explicit
`selectColumns` since `live_requests` has no `updated_at` column — only
`created_at` — matching the bug class `models/openingHours.js`, Task
1.16d, already caught for its own no-`updated_at` table; `status`/
`reviewed_by`/`reviewed_at` deliberately excluded from the settable
`columns` list, same "status only changes via `statusTransition`, not a
bare `update()`" reasoning `models/orders.js`, Task 3.15a, already
documents) and `models/registrationPayments.js` (no `ownerColumn` — same
transitively-scoped-through-its-parent reasoning `food_visibility`, Task
1.15c, already uses, since this table only has `live_request_id`, not
`restaurant_id`; explicit `selectColumns` since this table has neither
`created_at` nor `updated_at`, only `submitted_at`).

**This session had real npm registry access** (`npm ping` succeeded,
`npm install` succeeded — 526 packages). Ran the actual `npm test`: full
suite is 29 suites / 469 tests, with **11 pre-existing failures across 2
suites unrelated to this task** — the standing `payment_methods`
cross-owner-isolation gap `docs/PROJECT_STATUS.md`'s Task 3.5 entry
already flagged (and deliberately left unfixed, out of that task's own
scope) now also surfaces as 404s instead of 200s in
`restaurant.routes.test.js`'s `GET /:id/payment-methods` tests — neither
new model file is imported anywhere yet (not wired into `app.js` until
4.5c), so these can't be caused by this sub-step; confirmed by their
error messages referencing `payment_methods`, not `live_requests`/
`registration_payments` at all. `npx eslint` clean on both new files.
Beyond lint/test, since interaction with the two tables together (the
1:1 link, the ownership-scoping asymmetry between them) is exactly what
a lint pass or an unrelated-suite pass can't confirm, ran a scratch
(not shipped) verification script requiring both real, unmodified model
files against the real `fakeDb` double (Task 1.3) via the same
`require.cache`-injection technique prior sessions' mocked-module smoke
tests have used — 17 checks, all passing: a `live_requests` row created
with no `updated_at` key at all; its `status`/`created_at` present via
the explicit `selectColumns`; a linked `registration_payments` row with
no `created_at`/`updated_at` keys but a real `submitted_at`, correctly
linked by `live_request_id`, `amount` round-tripping; `liveRequests`
exposing `ownerColumn`/`findAllForOwner`/`getOrThrowForOwner` while
`registrationPayments` exposes none of those; a client-supplied
`status`/`reviewed_by` on `create()` silently dropped (not on the
allow-list); and `findAllForOwner` correctly scoping to one
`restaurant_id` and returning empty for a different one.

**4.5b (`services/submitLiveRequest.js`) is done.** Same
`withTransaction` shape `createFoodWithVisibility` (1.15c) /
`submitOrder` (3.15b) established: `amount` is never accepted as an
input field at all — read fresh from `models/adminSettings.js` (Task
4.3) at submission time, same "never trust the client's total"
reasoning `submitOrder.js` already applies to `subtotal`/`total`. One
real business rule beyond what the task's one-line description spells
out, stated rather than silently decided: a restaurant with an
already-pending request is rejected outright (a plain 400, checked by
reading every request for that restaurant via `findAllForOwner` and
filtering `status === 'pending'` in JS, since `status` isn't a
filterable column per 4.5a's own mass-assignment guard) — implied by
`docs/DB_SCHEMA.md`'s own "multiple requests over time (e.g. rejected ->
owner reapplies)" phrasing, which frames reapplying as something that
happens after a decision, not while one is outstanding. A missing
`admin_settings` row throws a plain (non-`ApiError`) `Error` rather than
a 400 — same "a config bug should surface loudly" reasoning
`verifyPassword` (1.11) already uses for its own missing/malformed
stored-hash case, since migration 0010 seeds that row itself and its
absence means the database is broken, not that the owner sent something
wrong.

Ran for real (same registry access as 4.5a): `services/
submitLiveRequest.test.js`, 11 tests — happy path (both rows created and
linked); the fee genuinely coming from `admin_settings` even when the
payload includes its own (ignored) `amount` field; every validation
rejection (missing/non-integer `restaurant_id`, missing/blank
`payment_screenshot_url`); the already-pending rejection (including
confirming no second row was written, not just the error message) and
its two adjacent cases (a *different* restaurant is unaffected; the
*same* restaurant can resubmit once its prior request is no longer
pending); the missing-`admin_settings` plain-Error case; and a
full-transaction rollback when the `registration_payments` insert fails
(no orphan `live_requests` row survives) — mirroring
`createFoodWithVisibility.test.js`'s (1.15c) own rollback test
technique. One test-authoring wrinkle worth noting: `fakeDb` doesn't
simulate `status`'s DB `DEFAULT('pending')` (same standing limitation
`orders.status` already has, Task 3.15a) — a freshly created row comes
back `status: null`, so the already-pending tests simulate the real
DEFAULT directly in the fake store rather than relying on it, and no
test asserts `status === 'pending'` on a fresh row, same convention
`submitOrder.test.js` already established for its own un-simulated
DEFAULT. Full suite is now 30 suites / 480 tests (469 + 11 new) — the
same 11 pre-existing, unrelated `payment_methods` failures as 4.5a's
entry, zero new regressions. `npx eslint` clean on both new files;
`node --check` passed.

Next: **4.5c** — `routes/liveRequest.routes.js` +
`controllers/liveRequestController.js`, owner-authenticated
(`authMiddleware` → `attachOwnerRestaurant`, unlike the customer order
flow's public route) with a zod schema accepting only
`payment_screenshot_url` (the fee is never a request field, per 4.5b),
mounted in `app.js`.

**4.5c is done.** `controllers/liveRequestController.js` — thin, same
split `orderController.js` (3.15c) established: a `.strict()` zod
schema accepting exactly one field (`payment_screenshot_url`, capped at
`docs/DB_SCHEMA.md`'s 0.10-section `VARCHAR2(500)`, validated as a real
URL), everything else delegated to `submitLiveRequest` (4.5b). A
client-supplied `restaurant_id`/`amount`/`status` is rejected with a 400
rather than silently dropped — making 4.5b's "the fee is never a
request field" rule a visible rejection here too, not just something
that happens to be true because the service never reads those keys.
`restaurant_id` itself comes from `req.user.restaurant_id`
(`attachOwnerRestaurant`, 1.15a), never the body. Returns `201` with
`{ live_request, registration_payment }` for Task 4.6's pending-state
screen.

`routes/liveRequest.routes.js`: one route, `POST /`, chaining
`authMiddleware` → `attachOwnerRestaurant` — same first-two-middlewares
shape `food.routes.js`'s collection routes use, and no
`ownershipMiddleware` for the same "no `:id` on a create-only route"
reason `food.routes.js`'s own `POST /` already documents. Mounted at
`/api/live-requests` in `app.js` (new require + `app.use` line) — first
and only router for that path, no shadowing concern.

Ran for real (same registry access as 4.5a/b): boot-sanity check
(`node -e "require('./src/app')()"`) still boots clean; `npx eslint`
clean on all three new/changed files; full `npm test` — 30 suites / 480
tests, same 11 pre-existing unrelated `payment_methods` failures as
4.5a/b's entries, zero new regressions from wiring this route into
`app.js`. Beyond that, since this is the first time 4.5a/b's code is
reachable through the actual HTTP stack rather than called directly,
ran a scratch (not shipped) `supertest`-driven script against the real,
unmodified `app.js` (fake DB swapped in via the same
`require.cache`-injection technique prior sessions' mocked-module smoke
tests use) — 11 checks, all passing: no `Authorization` header → 401;
an owner with no restaurant yet → 403 (real `attachOwnerRestaurant`
behavior, not a route bug); a valid submission → 201 with the fee
genuinely sourced from `admin_settings` (not the `1` a follow-up request
tried to sneak in); `.strict()` rejecting both a body-supplied `amount`
and `restaurant_id`; missing/invalid `payment_screenshot_url` → 400; and
4.5b's already-pending business rule surfacing correctly as a 400
through the full real route, not just in `submitLiveRequest.test.js`'s
own direct-call tests. No `liveRequest.routes.test.js` file has been
written yet — that's 4.5d's own shipped-tests job, same split
`order.routes.test.js` (3.15d) has relative to `submitOrder.test.js`
(3.15b).

**4.5d is done — Task 4.5 is now fully complete, 4/4.** New
`backend/src/routes/liveRequest.routes.test.js` (the shipped route-level/
integration suite the previous entry's scratch script stood in for) —
real Express app + real `supertest` + `fakeDb`, 12 tests: no
`Authorization` header → 401; a malformed token → 401; an owner with no
restaurant yet → 403 (real `attachOwnerRestaurant` behavior); an admin
token → a clean 400, not 403 (see below — a real, checked finding, not
an oversight); the happy path (201 with both created rows, the fee
genuinely sourced from `admin_settings`, never the request body);
`.strict()` rejecting a body-supplied `restaurant_id`/`amount`/`status`;
400s on a missing/non-URL/over-500-char `payment_screenshot_url`; and
the already-pending rejection surfacing as a clean 400 through the real
route (one representative case — `submitLiveRequest.test.js`, 4.5b, is
where every other business rule is actually re-verified).

**A real, worth-noting finding, not a bug**: unlike `foodController.js`
(1.15f's own `requireRestaurantScope` fix), this route has no separate
role-check guard of its own. An admin token has no `restaurant_id` for
`attachOwnerRestaurant` to resolve (it no-ops for a non-owner role, same
as for foods), so `restaurant_id` reaches `submitLiveRequest` (4.5b) as
`undefined` — which that function's own `Number.isInteger` guard already
rejects with a 400 ("restaurant_id is required") before any DB write.
Same fail-safe outcome as foods' 403 (an admin can never create a row
here), just surfaced as a 400 instead of a 403 since nothing independent
checks the caller's role on this route. Documented and pinned by its own
test rather than "fixed" into a 403 that would need a guard this task
doesn't actually need.

`frontend/src/pages/RequestLive/RequestLive.jsx`'s `onComplete` is now
wired to the real endpoint: it uploads the screenshot when a new file
was picked (unchanged from Task 4.4), then `api.post('/live-requests',
{ payment_screenshot_url })` — default `auth: true` attaches the owner's
bearer token via `tokenStorage` (Task 3.1), same as every other
owner-authenticated request in this codebase; `restaurant_id`/`amount`
are never sent, matching 4.5b/4.5c's own server-side-only enforcement.
A successful submission shows a stated "submitted, pending admin
review" confirmation naming Task 4.6 (the actual pending-state screen)
as not yet built — same "reserve the next step, don't fake it" pattern
this exact spot already used before 4.4/4.5 built out what came before
it. A submission failure (most likely today: the restaurant-creation
gap below) surfaces as a plain inline error, not a silent no-op.

**Real, standing gap this task does not fix**: `attachOwnerRestaurant.js`
has flagged since Task 1.15a that no restaurant-creation endpoint exists
yet — a brand-new owner has a `users` row but no `restaurants` row, so
`attachOwnerRestaurant` 403s before `submitLiveRequest` ever runs. An
owner cannot complete this screen end-to-end in this codebase today;
that's a real product gap Phase 4/5 will need to close (most likely
somewhere in registration, Task 4.1, or as its own step), not something
4.5d's own scope covers.

Ran for real (registry access held again this session): `npm install`
(526 packages), `npx eslint` clean on `liveRequest.routes.test.js`, and
full `npm test` — **31 suites / 492 tests**, the same 2 pre-existing
unrelated failures (`restaurant.routes.test.js`'s payment-methods case,
`paymentMethod.routes.test.js`'s cross-owner-isolation case, both
flagged since Task 3.5's own session) and zero new regressions;
`liveRequest.routes.test.js` itself: 12/12 passing. Frontend: real
`npm install` (280 packages), `npm run lint` clean, and `npm run build`
(`vite build`, 133 modules transformed, succeeds) against the actual
`frontend/` package. `node_modules`/`dist` removed before packaging on
both sides.

`docs/TASKS.md`'s 4.5/4.5d checkboxes ticked. Next: **Task 4.6** —
Pending-state screen (owner sees "Awaiting admin approval") — the
confirmation this task's `RequestLive.jsx` change already names as not
yet built. Worth deciding there whether/how it reads back the owner's
own `live_requests` row (no `GET` route exists on `liveRequest.routes.js`
yet — that router's own header comment already flags this as 4.6's job,
not 4.5's), and revisiting the restaurant-creation gap above if it
blocks that screen too.

**4.6 is done.** New `GET /api/live-requests/latest`
(`liveRequestController.js`'s new `getLatest`, mounted in
`liveRequest.routes.js` ahead of `POST /` behind the same
`authMiddleware` → `attachOwnerRestaurant` chain, no `ownershipMiddleware`
for the same "no `:id` param on a collection-shaped route" reasoning
`POST /` already documents) — resolves exactly the read
`models/liveRequests.js`'s own header comment (4.5a) already named this
task as needing: the caller's own restaurant's single most recent
`live_requests` row, via
`liveRequests.findAllForOwner(req.user.restaurant_id, {}, { orderBy:
'id', orderDir: 'DESC', limit: 1 })` rather than a bespoke query — no new
model method needed, `ownerColumn: 'restaurant_id'` was already sitting
there unused for exactly this. Returns `{ live_request: null }` (a
`200`, not a `404`) when the owner hasn't submitted a request yet — a
real, expected state (frontend's job to route accordingly), not an
error. A `requireRestaurantScope` guard (403), copied from
`foodController.js`'s own identically-named helper, covers the one case
`attachOwnerRestaurant` itself doesn't already reject: a non-owner role
(e.g. admin) whose `req.user.restaurant_id` was left unset by that
middleware's own no-op-for-non-owners behavior.

**Frontend half** (`frontend/src/pages/LiveStatus/`) is the real
pending-state screen — see `frontend/README.md`'s own 4.6 entry and
`LiveStatus.jsx`'s doc comment for the full writeup, including the four
states it renders (no request yet / pending / approved / rejected) and
why the approved-state render already exists despite nothing driving it
for real yet (that's Task 4.7's own job). `RequestLive.jsx`'s
`onComplete` (4.5d) now navigates to `/owner/live-status` on a
successful submission instead of showing its own former inline
"submitted, pending admin review" placeholder.

**Restaurant-creation gap — still not this task's to fix, still
flagged**: unchanged from 4.5d's own note above. This task's new
endpoint doesn't make the gap any better or worse — an owner who somehow
reached `/owner/live-status` without a `restaurants` row still gets a
403 here too (`attachOwnerRestaurant` rejects before `getLatest` ever
runs), same as `POST /` already does. `LiveStatus.jsx`'s own doc comment
names this explicitly rather than treating a 403 here as a generic fetch
failure worth retrying.

**No npm registry access this session** (`node_modules` fully absent on
both `backend/` and `frontend/`, the harder "packages fully missing"
case 4.3's own session hit, not just a `403` on top of some already-
installed packages) — verified by hand instead. Backend: `node --check`
on every changed/added file, a brace/paren/bracket balance pass, and a
hand-rolled script (`require.cache` injection stubbing `oracledb`/`zod`/
`../config/db` with the real `fakeDb` double, same technique 4.3's own
session used) calling `getLatest` directly with plain req/res/next
objects, bypassing Express routing entirely — 9/9 checks passing,
covering the 403-no-scope path, the null-when-no-requests path, correct
"most recent, not an older one" selection, cross-restaurant isolation,
and the approved-status case. A full route-level suite was also written
(`liveRequest.routes.test.js`'s new `GET /api/live-requests/latest`
`describe` block, 7 tests) but couldn't actually run this session for
the same missing-`node_modules` reason — a real `npm test` still needs
to confirm it. Frontend: brace/paren/bracket balance, a two-way
`styles.*` class-name parity check between `LiveStatus.jsx` and
`LiveStatus.module.css` (clean both directions), and every import in
both changed files cross-checked against its actual export in its
source file. A real `npm install`/`npm test`/`npx eslint`/`npx vite
build` on both sides still need to confirm this task before it's
considered fully closed.

`docs/TASKS.md`'s 4.6 checkbox ticked. Next: **Task 4.7** — Manual DB
stub/test: flip a `live_requests` row's `status` to `'approved'` and
confirm the owner sees the Live state on `/owner/live-status` — this
task's own `LiveStatus.jsx` already renders that state for real, so 4.7
is verification against what's already built, not a further build task.

**4.7 is done — Phase 4 fully checked off.** Unlike the last several
sessions, `npm install` resolved for real this time (both `backend/`
and `frontend/`), so this was verified for real rather than by hand:
`npx jest liveRequest` — 30/30 pass, including
`liveRequest.routes.test.js`'s own `'reflects an approved status once
one is set (manual DB flip, Task 4.7's own scenario)'` test (written
during 4.6, exercised for real this time) which submits a request
through the real endpoint, flips the `fakeDb` row's `status` to
`'approved'` directly, and confirms `GET /api/live-requests/latest`
returns it. See `docs/PROJECT_STATUS.md`'s 4.7 entry for the frontend
half and one flagged (not fixed) pre-existing bug this session's full
`npx jest` run — 499 tests, not just the `liveRequest` slice — turned up
in `restaurant.routes.test.js`/`paymentMethod.routes.test.js` (a
`fakeDb.js` string-vs-number id comparison issue, unrelated to this
task's own code).

**Task 5.2** added the first owner-authenticated routes on the
otherwise fully public `/api/restaurants` router: `GET /api/restaurants/me`
and `PATCH /api/restaurants/me` (`restaurantController.js`'s new
`getMe`/`updateMe`, mounted in `restaurant.routes.js` behind
`authMiddleware` → `attachOwnerRestaurant`, *before* `GET /:id` — same
mount-order fix `app.js` already applies elsewhere, since `/:id` would
otherwise swallow a literal `"me"`). `getMe` just returns `req.restaurant`,
already resolved by the middleware chain. `updateMe` accepts `name`
(required when present, ≤120 chars) and `description` (nullable, no cap
— it's a CLOB) via a `.strict()` zod schema requiring at least one
field, same shape `categoryController.js`'s `updateCategorySchema`
established; writes go through `restaurantsCrud.updateForOwner(id,
req.user.id, data)` for the same query-layer re-scoping
`categoryController.update` already practices, note the owner id here
is `req.user.id` (a `users.id`) since `restaurants`' `ownerColumn` is
`owner_id`, unlike every other owner-scoped table.

**No npm registry access this session** — `node_modules` fully absent
again. Verified by hand: `node --check` on all three changed/added
files, plus a hand-rolled `require.cache`/`Module._resolveFilename`
injection harness (real-API-shaped `zod` shim + `oracledb` stub +
`fakeDb` for `../config/db`) calling `getMe`/`updateMe` directly against
the real, unmodified controller and `restaurants` crudFactory — 14/14
checks passing (happy path, partial update, clearing `description` to
`null`, empty/over-length/unknown-field/empty-body rejection, and
`updateForOwner`'s scoping actually running). `restaurant.routes.test.js`
gained 16 new tests (`GET`/`PATCH /me` `describe` blocks, including a
mount-order regression check) that couldn't run for the same
missing-`node_modules` reason — a real `npx jest` still needs to confirm
them, and should also confirm these new routes don't trip the
still-unfixed `fakeDb` id-comparison bug from 4.7's entry above (they
shouldn't — `/me` takes no `:id` route param, same reason
`liveRequestController.js`'s `getLatest` avoids it).

**Flagged, not fixed by this task**: `attachOwnerRestaurant.js`'s
long-standing restaurant-creation gap (open since 4.3, reconfirmed at
5.1) is still open — raised with the user rather than resolved
unilaterally, and the decision was to land 5.2 as scoped, so a real
brand-new owner still can't reach these new routes without a 403.

`docs/TASKS.md`'s 5.2 checkbox ticked.

**Task 5.3** added two more owner-authenticated routes: `POST /api/uploads/restaurant-logo`
and `POST /api/uploads/restaurant-cover` (`uploadController.js`'s new
`uploadRestaurantLogo`/`uploadRestaurantCover`, mounted in
`upload.routes.js` behind `authMiddleware` → `attachOwnerRestaurant` →
the existing `handleUpload` multer wrapper). Each uploads to a fixed
folder (`restaurants/logos`/`restaurants/covers`) at
`uploadToObjectStorage`'s defaults (`compress: true, generateThumbnail:
true`) — unlike Task 3.14's payment-screenshot route, which turns both
off, since a logo/cover IS shown in list/grid contexts where a
downscaled main image and thumbnail are exactly what's wanted. Same
split 3.14 established: these routes only return `{ url, thumbnailUrl }`,
never touching the `restaurants` row — `restaurantController.js`'s
`updateMe` (5.2) does that, extended here to also accept `logo_url`/
`cover_url` as plain string fields (nullable, `.url()`-validated, ≤500
chars per `docs/DB_SCHEMA.md`'s `VARCHAR2(500)`), same shape
`foodController.js`'s `imageUrlSchema` already established for
`foods.image_url`.

**A pre-existing test needed fixing, not just extending**: 5.2's own
`'rejects an unknown field'` test in `restaurant.routes.test.js` had
asserted `logo_url` was rejected — true when written, false now that
5.3 legitimately adds it to the schema. Fixed to assert against `phone`
instead (a real `restaurants` column this endpoint still doesn't
accept), rather than leaving a test asserting the opposite of what this
task intentionally changed.

**No npm registry access this session** — verified by hand: `node
--check` on all four changed/added files, plus the 5.2 hand-
verification harness extended with `logo_url`/`cover_url` cases (its
`zod` shim gained `.url()` support) — 19/19 checks passing against the
real, unmodified `updateMe`. `upload.routes.test.js` gained two new
`describe` blocks (restaurant-logo/restaurant-cover) with `sharp`
mocked, same "test route wiring, not image processing" reasoning that
file's own header comment already gives — these are the first routes to
actually take the compress+thumbnail default path in a route test.
Neither new suite could run for real this session; a real `npx jest`
still needs to confirm both, including the mocked-`sharp` assumption
against real `sharp`.

`docs/TASKS.md`'s 5.3 checkbox ticked.

**Task 5.8** extended `updateProfileSchema`/`updateMe` again — the third
time this endpoint has grown since 5.2 (logo_url/cover_url in 5.3, now
`is_open`). `is_open` is exposed at the API boundary as a boolean and
converted to the DB's `NUMBER(1)` in a new `toIsOpenNumber` helper,
called before `updateProfileSchema` runs (so a non-boolean value throws
its own 400 immediately) — the exact same shape and ordering
`paymentMethodController.js`'s `is_active` (Task 1.16c) already
established for this codebase's only other owner-toggleable 0/1 column;
no reason to invent a second convention. `restaurant.routes.test.js`
gained 4 new tests (toggle off, toggle on, reject a non-boolean, combine
with another field in the same request).

**A real test-isolation bug found and fixed, not just a new-feature
gap**: `restaurant.routes.test.js` never set `process.env.JWT_SECRET`
the way every sibling routes-test file
(category/serviceArea/paymentMethod/openingHours/food/adminSettings/
liveRequest) does — it only worked when run inside the full `npx jest`
suite, because another file's module-load-time `process.env.JWT_SECRET
= ...` happened to already be set in the same worker process by the
time this file's authenticated (`GET`/`PATCH /me`) tests ran. Running
`npx jest restaurant.routes` on its own threw `secretOrPrivateKey must
have a value` on login and `JWT_SECRET is not configured` on every
authenticated request after, failing 29 of 55 tests in that file alone
— not a flake, a real missing line, now added matching every sibling
file's own convention.

**npm registry was reachable this session** (unlike every prior
Phase-5 entry above) — real `npm install` + `npx jest` run confirmed
all 4 new tests pass. Also surfaced (and, via a controlled revert-and-
rerun of just this task's own diff, confirmed pre-existing and
unrelated to this task) 11 failures already present in
`restaurant.routes.test.js` (`GET /:id`, `GET /:id/payment-methods`, one
admin-reachability check — all a 404-instead-of-200 pattern, likely
`fakeDb`-side, distinct from the string-vs-number id bug 4.7's entry
above already flagged) and 7 more across `paymentMethod.routes.test.js`/
`upload.routes.test.js`, neither touched by this session's work.
Flagged for a dedicated fix pass, not chased down here. Frontend half
(the `ToggleSwitch` itself) in `frontend/README.md`'s own Task 5.8
entry.

`docs/TASKS.md`'s 5.8 checkbox ticked.

**Task 5.9a** — hide/show. `models/foods.js` had flagged since 1.15b
that this needed a `food_visibility` write, not a `foods` one, and no
route reached it yet; this task closes that gap ahead of 5.9b's actual
frontend screen. New `PATCH /api/foods/:id/visibility`
(`food.routes.js`), chained behind the same `authMiddleware` →
`attachOwnerRestaurant` → `ownershipMiddleware(foodsCrud)` every other
`:id` food route already uses. The handler
(`foodController.setVisibility`) requires `{ is_hidden: boolean }`
(no partial-update shape here — the whole point of this route is
setting it), converts it to the DB's `NUMBER(1)` via a manual
`toIsHiddenNumber` helper — same convention
`paymentMethodController.js`'s `is_active` (1.16c) established, not a
new one — finds the food's `food_visibility` row by `food_id` (every
food has exactly one, by construction, per 1.15c), and writes
`is_hidden` + `updated_by: req.user.id` to that row.

`foodController.list`/`getOne` also gained a merge step
(`attachIsHidden`/`attachIsHiddenOne`) so both now return each food's
current `is_hidden` alongside its plain columns — the owner's list
needs it to render Hide/Show state. Deliberately a per-food
`food_visibility.findAll({ food_id })` lookup rather than a hand-
written JOIN like `restaurantMenu.js`/`popularFoods.js`: those exist to
*filter out* hidden foods from a customer-facing menu; here the owner's
own list must still show hidden foods (so they can be un-hidden), so
`is_hidden` is just an extra field being merged in, not a filter
condition — no new SQL shape for `fakeDb.js` to support.

7 new tests in `food.routes.test.js` for the new route (hide, un-hide,
404 on another owner's food, 3 validation-400 cases, 401
unauthenticated) plus 3 more confirming `GET /api/foods` and
`GET /api/foods/:id` reflect the current visibility state.

**No npm registry access this session** (`npm install` 403'd
immediately) — verified by hand instead: `node --check` on
`foodController.js`, `food.routes.js`, and `food.routes.test.js` (all
clean). A real `npx jest food.routes` run still needs to confirm the
new suite passes against the real (unmocked) `zod`/`crudFactory`
behavior, same caveat several earlier Phase 5 entries above carry.

`docs/TASKS.md`'s 5.9 checkbox is **not** ticked yet — 5.9a is only the
backend half; the food list screen itself (5.9b) is still open.

**Task 5.10**'s backend half: `foodController.js`'s own `imageUrlSchema`
comment had flagged since 1.15e that `image_url` "takes a plain
string... wiring an actual multipart upload route is still open" — this
closes that gap the same way 5.3 closed it for `logo_url`/`cover_url`.
New `POST /api/uploads/food-photo` (`uploadController.js`'s new
`uploadFoodPhoto`, mounted in `upload.routes.js` behind the same
owner-authenticated `authMiddleware` → `attachOwnerRestaurant` →
`handleUpload` multer wrapper restaurant-logo/cover already use).
Uploads to a fixed `foods/photos` folder at `uploadToObjectStorage`'s
defaults (`compress: true, generateThumbnail: true`) — same reasoning
5.3 already gives for logo/cover: a food photo IS shown in list/grid
contexts (`EntityCard` on Home/RestaurantProfile, `OwnerMenu`'s own
list), unlike the payment-screenshot route's `compress: false`, which
is only ever viewed full-size. Returns only `{ url, thumbnailUrl }` —
never touches a `foods` row itself; `POST /api/foods` (1.15d, unchanged)
still does that, taking `image_url` as the plain string it always has.

**A pre-existing test-isolation bug found and fixed, not just a
new-feature gap**: `upload.routes.test.js` never set
`process.env.JWT_SECRET` — exactly the gap this file's own Task 5.8
entry above flagged as one of "7 more across
`paymentMethod.routes.test.js`/`upload.routes.test.js`" failures, left
open at the time. Its restaurant-logo/restaurant-cover tests
(`createOwnerWithRestaurant`, which needs a real login) only ever
passed because some other file's module-load-time
`process.env.JWT_SECRET = ...` happened to already be sitting in the
same worker process. Running `npx jest upload.routes` on its own threw
`secretOrPrivateKey must have a value` on login and `JWT_SECRET is not
configured` on every authenticated request after — 10 of 19 tests in
the file, including every one of this task's own new food-photo tests.
Fixed with the exact same one-line convention every sibling
routes-test file (`category`/`food`/`liveRequest`/`openingHours`/
`paymentMethod`/`restaurant`/`serviceArea`) already uses, since this
task's own tests genuinely needed it to pass, not just to look right.

New `describe('POST /api/uploads/food-photo')` block in
`upload.routes.test.js`, 7 tests mirroring the restaurant-logo block's
shape exactly: requires authentication, 403s for an owner with no
restaurant yet, uploads to `foods/photos` and returns `url` +
`thumbnailUrl` (2 `putObject` calls, main + thumbnail), rejects an
unsupported file type with 400, rejects a request with no file with
400.

**npm registry was reachable this session** — real `npm install` +
`npx jest src/routes/upload.routes.test.js` confirmed all 19 tests in
the file pass (the pre-existing 10 failures above included). A full
`npx jest` run across the whole backend suite passed 531/543 — the 12
remaining failures are all in `restaurant.routes.test.js`/
`paymentMethod.routes.test.js`, the exact same pre-existing failures
this file's own Task 5.8 entry already flagged and left open; none in
any file this task touched. `npx eslint` on `uploadController.js`,
`upload.routes.js`, and `upload.routes.test.js` is clean.

`docs/TASKS.md`'s 5.10 checkbox ticked. Frontend half (`AddFood.jsx`,
the screen that actually calls this new route) in
`frontend/README.md`'s own "Task 5.10" entry.


- [x] 5.12a — Backend: owner-scoped paginated orders list endpoint
  (sub-step of Task 5.12; split into 5.12a backend / 5.12b frontend, same
  pattern Task 5.5 used for fetch+render vs. editing+save)
  - `GET /api/orders` added to the existing `order.routes.js`/
    `orderController.js` (Task 3.15c's file, already extended by 3.17/
    3.18a) — the first owner-authenticated route on this router; every
    route before it (`POST /`, `GET /track`, `GET /history`) is
    deliberately public since customers have no accounts. Chained
    `authMiddleware` (1.14) → `attachOwnerRestaurant` (1.15a), same as
    `foodController.list`/`categoryController.list` — no
    `ownershipMiddleware` (1.4), since there's no `:id` on a collection
    route for it to check against.
  - No new model needed: `models/orders.js` (Task 3.15a) already set
    `ownerColumn: 'restaurant_id'` specifically so this task could reuse
    it directly with `paginateForOwner` (Task 1.9) — flagged as such in
    that model's own header comment back when it was written.
  - `orderBy: 'id', orderDir: 'DESC'` for newest-first — the same choice
    `history` (3.18a) already made and documented on this same file:
    `created_at` isn't in `orders`'s settable `columns` allow-list
    (deliberately excluded, same as `status`/`status_updated_at`/
    `expires_at` — see `models/orders.js`'s own comment), and
    `findAll`/`count`'s `orderBy` is only allow-listed against
    `primaryKey` + those columns. A strictly-increasing surrogate `id`
    is an equally reliable proxy without widening that allow-list for
    this one caller.
  - `requireRestaurantScope` guard added, mirroring
    `foodController.js`'s/`categoryController.js`'s own fix for the
    identical gap (found while writing 1.15f's tests): `attachOwnerRestaurant`
    no-ops for a non-owner role, trusting a chained `ownershipMiddleware`
    to 403 on the resulting missing `restaurant_id` — never true for a
    collection route with no `:id`. Without this guard an admin token
    could hit `GET /api/orders` with an undefined scope; now it's a
    clean 403 before any DB call.
  - No `status`/date filter yet — deliberately out of scope for this
    task (`docs/TASKS.md`'s 5.12 line is just "incoming orders list";
    status/restaurant/date filtering is explicitly Task 6.10's job, on
    the admin side). Worth reconsidering once Task 5.14 (Accept/Reject)
    exists and an owner has a real reason to want only `New` orders in
    view, but that's a decision for whoever picks up that task.
  - `order.routes.js`'s header comment updated to describe the new
    owner-authenticated `GET /` alongside the three existing public
    routes, and to note why adding it introduces no shadowing concern
    (different HTTP method on the same path as the existing public
    `POST /`, not a prefix-match collision like `/api/foods/popular`
    vs. `/api/foods` had to work around).
  - New `describe('GET /api/orders', ...)` block appended to the
    existing `order.routes.test.js` (Task 3.15d's file), following
    `food.routes.test.js`'s (1.15f) `createOwnerWithRestaurant`/
    `createAdmin` helper shape — real signup/login through the actual
    `/api/auth` routes, a real `restaurants` row, then real HTTP
    requests through the full Express app: no-Authorization-header
    401, scoped listing + newest-first ordering, cross-owner isolation,
    an empty-array case for a restaurant with no orders yet, pagination
    (limit/page + meta), a malformed `limit` 400, an admin 403
    (`requireRestaurantScope`), and an owner with no restaurant row yet
    403ing the same way `foods`/`categories` already do.
  - **No npm registry access this session** (`npm install` 403s against
    the registry, same recurring gap as most sessions on this project;
    `node_modules` absent for both packages) — `order.routes.test.js`'s
    new block is checked in but unverified under real `supertest`/Jest.
    Verified instead by requiring the real, unmodified
    `orderController.js`/`models/orders.js` directly (bypassing
    Express/supertest entirely), with `../config/db` swapped for the
    checked-in `fakeDb` double via a `require.cache` injection and
    `oracledb` stubbed just enough to load `crudFactory.js` (a real
    `zod` install happened to be available on disk this session via an
    unrelated tool's `node_modules`, so `orderController.js` itself
    loaded and ran completely unmodified, not a hand-rolled zod shim
    like some earlier sessions on this project had to fall back on) —
    14 checks, all passing: restaurant-scoped listing, cross-owner
    isolation, newest-first (`id` DESC) ordering, `meta.total` reflecting
    the scoped count, pagination (limit/page + `hasNextPage`/
    `hasPrevPage`), a malformed `limit` rejecting with 400, an admin (no
    `restaurant_id`) rejecting with 403 before any DB call, and a clean
    empty array + `meta.total === 0` for a restaurant with no orders.
    `node --check` also passed on both changed source files and the
    extended test file.
  - `docs/TASKS.md`'s 5.12a checkbox ticked (5.12 itself split into
    5.12a/5.12b, parent line left unchecked until 5.12b lands).

**Note found at the start of the 5.14 session**: 5.12b and 5.13 (order
detail view — `GET /api/orders/:id`) had both already been built and
checked off in `docs/TASKS.md` — confirmed against the actual code
(`orderController.getOne`, `order.routes.js`'s registered-last `GET
/:id`) — but neither has its own log entry in this file, the same "the
write-up went missing" gap this file's own 3.14/3.15 history (see
`docs/PROJECT_STATUS.md`) already had once before. Not backfilled here;
picked up directly at 5.14a instead.

- [x] 5.14a — Backend: `PATCH /api/orders/:id/status` (Accept/Reject),
  wired through `statusTransition` (Task 1.7)
  - New `backend/src/services/updateOrderStatus.js` — the first real
    caller of `statusTransition`, exactly as that utility's own header
    comment (written back at 1.7) anticipated. Configured with the
    full `orders.status` transitions map from `docs/DB_SCHEMA.md`'s 0.8
    section (`New -> Accepted|Rejected`, `Accepted -> Completed`, both
    `Completed`/`Rejected` terminal) even though this task only drives
    the `New` row — `Accepted -> Completed` is Task 5.15's job, sharing
    this same instance rather than a second one.
  - **Can't use `orders.updateForOwner(...)` for the actual write** —
    `models/orders.js`'s own header comment (3.15a) deliberately keeps
    `status`/`status_updated_at` off that model's settable `columns`
    list specifically so a status change could only happen through a
    `statusTransition`-guarded path, not a bare `update()` bypassing
    `assertCanTransition`. `crudFactory`'s `pickAllowed` would drop both
    keys and throw "No valid fields provided to update orders" if that's
    all that's passed. So `onTransition` reaches past crudFactory with
    its own bare `UPDATE` via the same `withConnection` helper
    crudFactory uses internally, then re-reads the row through
    `orders.findById` for the full `selectColumns` shape.
  - New route in `order.routes.js`: `PATCH /:id/status`, chained through
    the identical `authMiddleware -> attachOwnerRestaurant ->
    requireOwnedOrder` three-deep chain `GET /:id` (5.13) already uses —
    registered after `GET /:id`, no shadowing concern (different method,
    same `:id` param). `orderController.updateStatus` hands
    `req.resource` (already ownership-checked) straight to
    `updateOrderStatus`, no second fetch.
  - `updateStatusSchema` — `.strict()` `z.enum(['Accepted', 'Rejected'])`
    — deliberately narrower than the service's own transitions map
    (which also allows `Completed`): a `status: 'Completed'` request
    today gets a clean 400 here rather than working ahead of Task 5.15's
    own frontend/tests for it. A genuinely disallowed transition inside
    this task's own scope (e.g. re-accepting an `Accepted` order)
    surfaces as `updateOrderStatus`'s own 409.
  - New `backend/src/services/updateOrderStatus.test.js` (unit,
    fakeDb-backed) — allowed transitions (`New -> Accepted`, `New ->
    Rejected`, and `Accepted -> Completed` for 5.15's future benefit),
    all four disallowed/terminal cases (409), and an id-scoping check.
    Both this file and the new `describe('PATCH /api/orders/:id/status')`
    block in `order.routes.test.js` had to force a real starting
    `status` via a direct `UPDATE` on the mocked connection first —
    `placeOrderFor`'s real `POST /api/orders` leaves `status: null`, not
    `'New'`, since fakeDb doesn't apply the real column `DEFAULT 'New'`
    the way Oracle does (the same gap the `GET /api/orders/:id` block's
    own first test already flagged).
  - New route-level tests in `order.routes.test.js`: 401 with no auth,
    Accept/Reject happy paths (200 + `status_updated_at` present), 409
    re-accepting an `Accepted` order, 400 on `status: 'Completed'`
    (out of scope until 5.15), 400 on an unrecognized status value, 400
    on an extra field (`.strict()`), 404 on another owner's order.
  - **No npm registry access this session** (`npm install` 403s on
    `zod`, same recurring gap as most sessions) — `node --check` passed
    on every changed/new file (`updateOrderStatus.js` + its test file,
    `orderController.js`, `order.routes.js`, `order.routes.test.js`);
    the new code was traced by hand against `fakeDb.js`'s UPDATE-regex
    shape and `crudFactory.js`'s `pickAllowed`/`_updateWhere` to confirm
    the reasoning above actually holds. Not a substitute for a real
    `npx jest` run.
  - `docs/TASKS.md`'s 5.14a checkbox ticked (5.14 itself split into
    5.14a backend / 5.14b frontend; parent line ticked once 5.14b's own
    entry in `frontend/README.md` also landed).

## Task 5.17 — Dashboard: new orders count + order counts summary

New `src/services/orderCounts.js` (`getOrderCounts(restaurantId)`), a
hand-written raw-SQL `GROUP BY status` read via `withConnection` — the
same reasoning `popularFoods.js`/`liveCategories.js` already established
for a query `crudFactory` can't express (here, `status` is deliberately
excluded from `models/orders.js`'s settable `columns`, so `countForOwner`
can't filter on it, and there's no `GROUP BY` support in crudFactory at
all). Returns `{ New, Accepted, Completed, Rejected, total }`, every
status always present (`0` if none), scoped by `restaurant_id` only.

New `orderController.counts` + `GET /api/orders/counts` (owner-scoped,
`authMiddleware` → `attachOwnerRestaurant`, same `requireRestaurantScope`
guard `list` already uses), mounted in `order.routes.js` **before**
`GET /:id` to avoid the "counts" literal segment being swallowed as a
route param — same shadowing class of bug `/api/foods/popular` and
`/api/categories/live` already document for their own routers.

Extended `utils/testUtils/fakeDb.js` with a new, generic single-column
`GROUP BY` COUNT shape (not hardcoded to `orders`/`status`) — same kind
of one-off extension Task 1.9's own `COUNT(*) AS total` addition made,
letting this be tested through the same double the full owner
auth/signup/login lifecycle already uses, rather than a second
JOIN-incompatible mock.

New `src/services/orderCounts.test.js` (query-correctness layer) and a
new `describe('GET /api/orders/counts', ...)` block in
`src/routes/order.routes.test.js` (routing/auth layer — 401, 403,
all-zero, real per-status counts, cross-owner isolation).

**No npm registry access this session** (`npm ping` → 403, same standing
gap as most sessions) — verified by hand: a scratch Node script against
the real, unmodified `orderCounts.js`/`orderController.js`/`models/orders.js`
directly over the real `fakeDb` double (bypassing Express/supertest),
covering empty/populated/cross-restaurant counts, the controller's 200
and 403 paths, and a regression pass confirming the new fakeDb SQL shape
doesn't break the existing single-row/`ORDER BY`/`COUNT(*)` shapes — all
passed. `node --check` passed on every changed/new file. A real
`npm install`/`npm test`/`npx eslint` run still needs to confirm this
before it's considered fully closed.

`docs/TASKS.md`'s 5.17 checkbox ticked.

## Task 5.18a — Dashboard: sales summary widget (backend)

New `src/services/salesSummary.js` (`getSalesSummary(restaurantId)`), a
hand-written raw-SQL read via `withConnection` — same reasoning
`orderCounts.js` (5.17) already established (`status` isn't a settable
`models/orders.js` column, so `crudFactory` can't filter by it, and there's
no `SUM` support there regardless). Filters to `Completed` orders only —
the same "realized sales" definition `popularFoods.js` (3.5) already uses
for its own `Completed`-only ranking. Fetches one row per completed order
(`total`, `created_at`) and buckets/sums in JS rather than doing the
`SUM`/date-truncation work in SQL, since per-restaurant order volume here
is small and it sidesteps picking an Oracle-specific `TRUNC(SYSDATE)`
expression for a "today" boundary that's already ambiguous — this codebase
has no restaurant/platform timezone column anywhere (docs/DB_SCHEMA.md),
so "today" is the Node process's own local calendar day. Sums are rounded
to the nearest cent (`Math.round((x + Number.EPSILON) * 100) / 100`) to
guard against the usual `0.1 + 0.2` float-accumulation drift over a run of
`NUMBER(10,2)` values. Returns `{ todayTotal, allTimeTotal,
completedOrderCount }`.

New `orderController.salesSummary` + `GET /api/orders/sales-summary`
(owner-scoped, `authMiddleware` → `attachOwnerRestaurant`, same
`requireRestaurantScope` guard `counts` already uses), mounted in
`order.routes.js` **before** `GET /:id` — same literal-path-segment
shadowing class of bug `/counts`'s own route comment (5.17) documents.

No `fakeDb.js` changes needed this time — the query's `SELECT total,
created_at FROM orders WHERE restaurant_id = :restaurantId AND status =
:status ORDER BY id ASC` shape already fits the existing generic
"SELECT ... ORDER BY" pattern that double supports, unlike 5.17's `GROUP
BY` query, which needed a new shape added.

New `src/services/salesSummary.test.js` (query-correctness layer — all-
zero, summed totals, today-vs-older bucketing, string-to-number coercion,
float-drift rounding, bind scoping) and a new
`describe('GET /api/orders/sales-summary', ...)` block in
`src/routes/order.routes.test.js` (routing/auth layer — 401, 403,
all-zero, Completed-only filtering, today/older bucketing, cross-owner
isolation).

**No npm registry access this session** (`npm install` → 403, same
standing gap most sessions hit) — verified by hand: a scratch Node script
required the real, unmodified `salesSummary.js` directly against a
minimal stubbed `../config/db` (module-resolution override, no rewritten
copy of the source), covering all 11 cases `salesSummary.test.js` itself
asserts (all-zero, summing, today-bucketing, string coercion, float
rounding, bind/SQL shape, the exported constant) — all passed. The
`order.routes.test.js` integration block was traced by hand instead
(fixture helpers, SQL-shape compatibility against the unmodified
`fakeDb.js`, and cross-checked against `submitOrder.js`'s own `total =
subtotal` computation for the expected per-order amounts) rather than
actually executed, since `supertest`/`express`/`jest` aren't installed
this session either. `node --check` passed on every changed/new file. A
real `npm install`/`npm test`/`npx eslint` run still needs to confirm
this before it's considered fully closed.

`docs/TASKS.md`'s 5.18a checkbox ticked; parent 5.18 stays unchecked
until 5.18b (frontend) lands.

## Task 5.22 — Account tab: owner profile/password settings (backend)

Two new owner/admin-authenticated routes on `authController.js`, the
same file `signup`/`login`/`me` already live in — not a new controller,
since both new handlers are exactly "edit the caller's own `users`
row," the same zod-schema-then-model-call shape signup/login already
establish, reusing the same `toPublicUser` strip and lowercased-email-
uniqueness check signup's own duplicate-email handling already has to
do:

- `PATCH /api/auth/me` → `updateProfile` — `full_name`/`email`/`phone`,
  any non-empty subset (an empty `{}` body is rejected via a zod
  `.refine`, same "reject rather than silently no-op" instinct
  `crudFactory.js`'s own `_updateWhere` already applies to an empty
  update). `email`, when present, is lowercased before both the
  uniqueness check and the write (same case-insensitive-identifier
  reasoning signup's own lowercasing has) and checked against every
  *other* account's email — re-submitting the caller's own current
  email back unchanged is correctly a no-op success, not a false 409,
  since the exact-match `findAll({ email })` lookup is skipped entirely
  when the submitted (already-lowercased) email equals `req.user.email`
  (itself already lowercased, since every row in this table is).
- `PATCH /api/auth/me/password` → `changePassword` —
  `current_password` + `new_password` (same `MIN_PASSWORD_LENGTH`/
  `MAX_PASSWORD_LENGTH` signup's own password field enforces). `req.user`
  (from `authMiddleware`) is the public, hash-stripped shape, so the
  real row is re-fetched via `users.findById(req.user.id)` to get
  something `verifyPassword` can actually check the supplied
  `current_password` against. A wrong current password is its own 401
  (`WRONG_CURRENT_PASSWORD_MESSAGE`) — deliberately a plainer, more
  specific message than login's own intentionally-vague
  `INVALID_CREDENTIALS_MESSAGE`, since the caller here is already
  authenticated as this exact account (via a valid bearer token), so
  there's no email-enumeration concern a vague message would be
  protecting against the way there is on the public login endpoint. On
  success, responds `{ success: true }` — no need to hand back the
  updated user, since a password change doesn't change anything a
  client would need to re-render.

Both routes mounted in `auth.routes.js` behind `authMiddleware` only, no
`ownershipMiddleware` — same reasoning `GET /me` already documents in
that file: a `users` row isn't an owned resource the way `foods`/
`categories` are (nothing points *at* it via an `ownerColumn`), it's the
caller's own identity, and both handlers are hard-scoped to
`req.user.id` internally rather than accepting any id from the request.
There is deliberately no "edit someone else's account" path anywhere
here — not asked for by `docs/TASKS.md`'s 5.22 line or
`docs/NATRA_MASTER_PROMPT.md`'s account-fields list, and would need a
real authorization model (admin-over-owner?) this task doesn't attempt
to invent.

New tests in `authController.test.js`: two new `describe` blocks,
`PATCH /api/auth/me` (updates all three fields; single-field partial
update; email lowercasing; re-submitting the caller's own email is a
200 not a 409; cross-account email conflict → 409; empty body → 400;
invalid email shape → 400; no `Authorization` header → 401, same as
`GET /me`) and `PATCH /api/auth/me/password` (successful change +
confirms the new password logs in and the old one no longer does; wrong
current password → 401 with nothing actually changed; too-short new
password → 400; missing `current_password` → 400; no `Authorization`
header → 401).

**No npm registry access this session** (`npm install` → 403, same
standing gap most sessions hit — no `node_modules` at all, not even a
partial install) — so `npx jest` itself isn't runnable here. Verified
instead with a scratch (not shipped) Node harness: a `Module._load`
override intercepts exactly the four bare module names this code path
touches (`oracledb`, `zod`, `bcrypt`, `jsonwebtoken`) plus crudFactory's
`../config/db` import, substituting small stubs that implement only the
specific chained calls `authController.js`/`crudFactory.js`/
`passwordHash.js` actually use (e.g. the zod stub supports exactly
`.object().refine()`, `.string().trim().min().max().email().optional()`,
and `.enum()` — nothing more general). Everything else —
`authController.js`, `crudFactory.js`, `models/users.js`, `utils/errors.js`,
`utils/passwordHash.js`, and `utils/testUtils/fakeDb.js` — is the real,
unmodified project code, called directly (`signup`/`updateProfile`/
`changePassword`/`login` invoked with hand-built `req`/`res` objects,
bypassing `express`/`supertest`/`authMiddleware` entirely, none of which
are installed either). 21 checks, all passing: covers every case listed
above for both new endpoints, plus confirming a rejected `changePassword`
attempt (wrong current password, or too-short new password) leaves the
account's real password unchanged (checked by attempting a login with
the pre-change password afterward). A real `npm install`/`npm test`/
`npx eslint` run still needs to confirm this before it's considered
fully closed — same standing caveat every no-registry-access session in
this file already carries.

`docs/TASKS.md`'s 5.22 checkbox ticked. See `frontend/README.md`'s own
5.22 entry for the `OwnerAccount.jsx` frontend half (profile/password
forms + the first logout affordance anywhere in this codebase).

## Task 7.2b — verify buildPaginationMeta/total count with the new join
`popularFoods.test.js`'s existing (7.2a) suite pinned the new
`LEFT JOIN popularity_stats` clause's *shape* against a canned-response
mock, which can't catch a real fan-out/count bug on its own. Added a new
`describe` block to that same test file with a small in-memory
relational engine that actually performs the join/filter/order/count
against realistic data (Live + non-Live restaurants, a hidden food, and
foods with/without a `popularity_stats` row). Confirmed `total` isn't
inflated by the `LEFT JOIN` (safe because `popularity_stats.food_id` is
`UNIQUE`), `buildPaginationMeta`'s derived fields are correct across a
single page and a multi-page split, a food with no `popularity_stats`
row still appears (ranked last, not dropped), and an all-excluded result
still yields `totalPages: 0`.

No npm registry access this session — run for real via a scratch
Jest-API shim (not hand-traced): 16/16 tests in the file pass, zero
regressions. The shim itself had a real bug (mock modules weren't
cached as singletons, so the test file's `withConnection` and
`popularFoods.js`'s own internal one were different instances) — fixed
before trusting these results; not a production-code bug.

`docs/TASKS.md`'s 7.2b checkbox ticked. Next: **7.2c** — manual check
that the customer Home screen's Popular Foods grid reflects the new
ranking with no frontend code changes needed.

## Task 7.2c — manual check: Popular Foods grid reflects the new ranking, no frontend changes needed
Re-read `frontend/src/pages/Home/Home.jsx`'s Popular Foods section: it
renders the `GET /api/foods/popular` response array as-is
(`popularFoods.map(...)` into `ResponsiveGrid`), with no client-side
sort/reorder anywhere in the component — the section's own Task 3.5
header comment already called the old `ORDER BY f.name ASC` a
"backend-side placeholder" for exactly this reason. Confirmed: the
ranking has always lived entirely in the query, so 7.2a/7.2b's new
`ORDER BY COALESCE(ps.completed_quantity, 0) DESC, f.name ASC` reaches
the screen with zero frontend changes, by construction.

Real `npm install`/`npx jest` access this session (no scratch shim
needed, unlike most prior sessions in this file):
`popularFoods.test.js` — **16/16 passing**. Full backend suite as a
broader regression check: **730/734 passing**; the 4 failures
(`order.routes.test.js`, `restaurant.routes.test.js`,
`paymentMethod.routes.test.js`, `adminRestaurantsList.test.js`) are
unrelated to anything 7.1/7.2 touched and, by inspection, pre-existing
— flagged, not fixed, as out of scope for this task.

No code changes — this task is a verification checkpoint, and its
conclusion (no frontend change needed) is what closes it.

`docs/TASKS.md`'s 7.2c checkbox ticked — **Task 7.2 is now fully
complete (7.2a–7.2c).** Next: **7.3** — order timeout/expiry cron job,
starting with 7.3a's design decision.

## Task 7.3a — design decision: `Expired` status vs. `Rejected` + reason flag
**Decision: new `'Expired'` status**, not a `Rejected` + reason flag.
`orders.status` gains a third terminal state, reachable only via `New
-> Expired` (Accepted orders are never subject to the timeout, per
`docs/NATRA_MASTER_PROMPT.md`'s "Order timeout" section).

Why not reuse `Rejected` + a flag: the master prompt itself names
"Automatically expire" as a distinct action from reject; admin's
"Filter by status" (`AdminOrders.jsx`) would silently conflate
restaurant-caused declines with system timeouts under a flag; every
existing `status`-reading query (`salesSummary.js`,
`popularityAggregation.js`) treats `status` as the single source of
truth and wouldn't know to also check a flag column; and Task 7.6
(customer notified on Accept/Reject) needs different copy for "the
restaurant declined it" vs. "nobody responded in time," which is
cheaper to settle now than rewire later.

Low-cost where it could have been expensive: `orders.status` is
`VARCHAR2(10)` — `'Expired'` (7 chars) fits without a column resize,
just a CHECK-constraint swap. No reason-flag column added either way —
`Rejected` doesn't have one today, so adding one only for `Expired`
would be an asymmetric feature nothing asked for.

No implementation here — that's 7.3b. Scope flagged for it: the
migration; `updateOrderStatus.js`'s transitions map gaining `New:
['Accepted', 'Rejected', 'Expired']` + `Expired: []`; and — found via a
project-wide grep while making this decision — five other hardcoded
4-status lists that'll need a 5th value (`OwnerDashboard.jsx`,
`orderCounts.js`, `AdminOrders.jsx`, `ComponentSandbox/mockData.js`,
plus `orderController.js`'s `z.enum` deliberately **excluded** —
`updateStatus` is the owner-facing endpoint, and an owner should never
be able to set `Expired` directly, only 7.3c/7.3e's scheduler should).
`StatusBadge.jsx` needs no change — unmapped statuses already render
`neutral`.

Also confirmed: `orders.expires_at` already exists (migration 0008,
reserved for "Phase 7" in its own header comment) and is unwritten
anywhere in the codebase — that's 7.3d's job, not this one, but the
column this decision's consumer needs is already in place.

`docs/TASKS.md`'s 7.3a checkbox ticked. Next: **7.3b** — the migration
+ `statusTransition.js` update implementing this decision.

## Task 7.3b — migration + `statusTransition.js` update implementing 7.3a's decision
`backend/migrations/0011_orders_status_add_expired.{up,down}.sql` —
drops/re-adds `ck_orders_status` (same name) with `'Expired'` added; no
column resize (`VARCHAR2(10)` already fits). First migration numbered
past Phase 0's own 0006–0010 — `migrations/README.md` updated to flag
that the "numbered to match the task" convention was a Phase-0
coincidence, not a rule. `down.sql` documents the real limitation: it
can't revert cleanly if real `'Expired'` rows already exist
(`ORA-02293`) without first resolving them by hand.

`updateOrderStatus.js`'s shared `orderStatus` instance gained `New:
['Accepted', 'Rejected', 'Expired']` + `Expired: []` (terminal, not
reachable from `Accepted` — the timeout only ever applies to pending
orders). `orderController.js`'s `updateStatus` endpoint is unchanged
(still `z.enum(['Accepted', 'Rejected', 'Completed'])`, deliberately, per
7.3a) — the map says the transition is *possible*, the controller's
schema says who's allowed to request it, and no owner-facing route can
send `'Expired'`; only 7.3c's future scheduler is meant to.

Three new tests in `updateOrderStatus.test.js`: `New -> Expired`
succeeds; `Accepted -> Expired` is a 409; `Expired` is terminal. Real
`npm install`/`npx jest` this session: `updateOrderStatus.test.js` —
11/11 passing. Full suite: 733/737 — same 4 pre-existing, unrelated
failures already flagged in 7.2c's entry, no new regressions.

`docs/DB_SCHEMA.md`'s `orders.status` row updated. `docs/TASKS.md`'s
7.3b checkbox ticked. Next: **7.3c** — scheduler infra (a lightweight
`setInterval`-based recurring job started on backend startup, since no
cron library exists in this codebase yet).

## Task 7.3c — scheduler infra
`backend/src/utils/scheduler.js` — new generic factory,
`createScheduler()`, same spirit as `statusTransition.js`/`crudFactory.js`:
not tied to orders, since `docs/TASKS.md`'s 7.4c line already
anticipates a second job (notify-before-expiry) sharing it later.
`registerJob(name, intervalMs, handler, { runImmediately })`:

- No `start()`/`stop()` pair — `registerJob()` ticks immediately on
  call, so a not-yet-existing job module (7.3d/7.3e) can `require()` the
  singleton and self-register whenever it loads, no ordering dependency
  on `server.js`.
- Overlap guard per job (a still-running handler's next tick is skipped,
  logged, not run concurrently) and error containment per tick (a
  throw/rejection is caught + `console.error`'d, never crashes the
  process or stops future ticks).
- `runImmediately` defaults `true` — catches up on anything overdue
  after a restart rather than waiting a full interval.
- `unregisterJob`/`stopAll`/`getRegisteredJobNames`/`isRegistered` round
  out the API.

`backend/src/scheduler.js` — the one app-wide singleton
(`module.exports = createScheduler()`), same plain-singleton shape
`config/db.js`'s pool already uses. `server.js` now requires it and logs
the registered job count (0 today) — confirms the infra is wired with
nothing registered yet, since 7.3d/7.3e don't exist.

New `utils/scheduler.test.js`, 16 tests via `jest.advanceTimersByTimeAsync`
(fake timers): config validation, `runImmediately` true/false, repeated
+ independent-interval ticking, the overlap guard (slow handler skips
then resumes), sync-handler safety, thrown/rejected handlers caught and
logged without halting the schedule, the stop/unregister API, and
instance independence. Also smoke-tested the real singleton directly.

Real `npm install`/`npx jest` this session: `scheduler.test.js` —
16/16 passing. Full suite: 749/753 — same 4 pre-existing, unrelated
failures already flagged, no new regressions. `node --check` clean on
all three new/changed files.

`docs/TASKS.md`'s 7.3c checkbox ticked. Next: **7.3d** — query logic:
find `New` orders older than the admin-configured window
(`admin_settings.order_timeout_mode`/`order_timeout_custom_minutes`,
Task 6.13a), skipping entirely when `order_timeout_mode = 'off'`.

## Task 7.3d — query logic: find timed-out `New` orders
`backend/src/services/orderExpiry.js` — query logic only, same
"query vs write vs trigger" split as `popularityAggregation.js`
(7.1a/7.1b/7.1c): finds candidate orders, doesn't transition anything
(7.3e) and isn't wired into 7.3c's scheduler yet (also 7.3e).

- `resolveTimeoutMinutes(settings)`: `'off'` -> `null`; `'15m'`/`'30m'`/
  `'1h'` -> their fixed minute value; `'custom'` -> the row's own
  `order_timeout_custom_minutes` if it's a positive integer, else `null`
  (a malformed `custom` row is treated as unresolvable, not as "expire
  everything now" — `admin_settings` has no DB-level CHECK tying mode
  and custom_minutes together, only 6.13a's request-time validation
  does).
- `findExpiredOrderCandidates()`: reads the singleton `admin_settings`
  row (`models/adminSettings.js`, `id = 1`), resolves the window, and —
  only when that resolves to a real number — runs one query:
  `SELECT id, order_code, restaurant_id, created_at FROM orders WHERE
  status = 'New' AND created_at < :cutoff ORDER BY created_at ASC`.
  Short-circuits to `[]` with **zero** orders queries for: no
  `admin_settings` row at all, `order_timeout_mode = 'off'`, or an
  unresolvable `custom` row.

New `orderExpiry.test.js` (`../config/db` mocked directly, same as
`popularityAggregation.test.js`/`popularFoods.test.js` — the
`created_at < :cutoff` shape isn't something `fakeDb.js` understands;
`mockConnection.execute` branches on which table's SQL it's handed):
`resolveTimeoutMinutes` across every mode plus six unusable `custom`
values; the three no-orders-query-run short-circuit cases (each
asserting exactly one `execute` call); a fixed-mode query's exact SQL
shape/binds and a `cutoff` bind checked against `now - windowMinutes`
at call time (bounded between two `Date.now()` reads, not an
exact-millisecond assertion); the same cutoff check for a `custom`
window; and a clean empty result when nothing's old enough yet.

**No npm registry access this session** (no `node_modules` for
`backend/` at all) — verified with a scratch (not shipped) Node script:
stubbed `oracledb`/`../config/db` via a `Module._load` override (same
technique used repeatedly elsewhere in this project's history), then
ran the real, unmodified `orderExpiry.js` **and** the real, unmodified
`crudFactory.js`/`models/adminSettings.js` underneath it — not
hand-simulated, `adminSettingsCrud.findById` genuinely executes
crudFactory's own generated SQL against the stub. 29 checks, all
passing. `node --check` clean on both new files.

`docs/TASKS.md`'s 7.3d checkbox ticked (also found and fixed a stray
duplicate 7.3c checkbox line left in that file from an earlier session
— cosmetic, nothing it tracked was actually re-done). Next: **7.3e** —
expiry action: transition each order this query finds via
`statusTransition`'s `New -> Expired` (7.3a/7.3b), then register that as
a real job on 7.3c's scheduler.
