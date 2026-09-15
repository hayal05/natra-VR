# NATRA Frontend

Customer, restaurant owner, and admin web app.

## Stack
- React 18 + Vite
- React Router for role-based routing
- Plain fetch-based API client (`src/api/client.js`)
- CSS variables for design tokens (finalized in Task 2.1)

## Structure
```
src/
  components/    Reusable UI kit (EntityCard, StatusBadge, FormField, etc. — Phase 2)
  pages/         Route-level screens (Home, RestaurantProfile, OwnerDashboard, etc.)
  hooks/         Custom React hooks (data fetching, forms, auth state)
  api/           API client wrapper (client.js) + per-resource request functions
  context/       React context providers (auth/session state)
  styles/        Global stylesheet + design tokens
  assets/        Static images/icons bundled with the app
  App.jsx        Route definitions (placeholder screens for all 3 roles)
  main.jsx       Entry point — mounts App inside BrowserRouter
```

## Setup
```bash
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to backend on :4000
```

## Status
Skeleton in place (Task 0.3). Routes exist as placeholders for all 3 roles
(customer, owner, admin). Phase 2 (frontend component kit) is fully done:
design tokens (2.1–2.2, corrected against the reference images by 2.22's
visual QA pass), all 16 reusable components (2.3–2.20, including all 3
`RoleShell` nav variants and `Wizard`), and the component sandbox page
(2.21) — see `/docs/PROJECT_STATUS.md` for the individual write-ups.

A component sandbox page renders all 16 components together against mock
data, at `/dev/components`:
```bash
npm run dev
# then open http://localhost:5173/dev/components
```
It's dev-only tooling — not a customer/owner/admin screen, so it isn't
linked from any real app navigation.

Phase 3 (customer flow) is now underway. Task 3.1 built the shared data-
fetching layer every real screen from here on uses:
- `src/api/client.js` — the fetch wrapper (`api.get`/`post`/`patch`/
  `delete`). Corrected this task: it's bearer-JWT auth against
  `Authorization: Bearer <token>` (matching the real backend,
  Tasks 1.12–1.14), not the cookie-based `credentials: 'include'` Task
  0.3's original scaffold had assumed — that mismatch had gone unnoticed
  since nothing had made an authenticated request yet.
- `src/api/tokenStorage.js` — a small localStorage wrapper for that
  token; dormant until Phase 4's owner/admin login screens exist to call
  it.
- `src/hooks/` — `useApiQuery` (single-resource GET), `usePaginatedQuery`
  (pairs directly with `ListWithPagination`'s `items`/`meta` contract,
  which already matches the backend's `paginate()`/`paginateForOwner()`
  shape), and `useMutation` (create/update/delete). All three guard
  against out-of-order/stale responses and setState-after-unmount — see
  each hook's own doc comment.

Task 3.2 is the first real screen: `src/pages/Home/` (`Home.jsx` +
`Home.module.css`), mounted at `/` in `App.jsx`, replacing that route's
placeholder. Header + search bar only, static layout, no logic yet, per
this task's own scope — the orange header block (brand row + `SearchBar`
`variant="onPrimary"`) matches `docs/reference_ui/1000065033.jpg`, wrapped
in `RoleShell role="customer"` (Task 2.17) for its first real (non-sandbox)
use. The Restaurants/Categories/Popular Foods sections are explicitly NOT
built here — that's Tasks 3.3–3.5, wiring Task 3.1's hooks to the real API;
a single placeholder line stands in for them on this screen for now. See
`Home.jsx`'s own doc comment for why the reference image's notification
bell is rendered non-interactive rather than wired to anything (customers
have no accounts and no customer-facing rows in the `notifications`
table).

Task 3.3 wires the first real data section into that screen: the
Restaurants row. `Home.jsx` now calls `GET /api/restaurants` (new
public backend endpoint, `backend/src/controllers/restaurantController.js`)
via `useApiQuery` (Task 3.1) — a plain "fetch one page" hook, not
`usePaginatedQuery`, since this is a swipeable `HorizontalScroller` row
with no page controls, not a `ListWithPagination` screen. Each result
renders through `EntityCard`'s restaurant-card slots (`cover_url`→image,
`logo_url`→logo, both falling back to a small inline-SVG placeholder
when null) with a `StatusBadge` keyed off `is_open` (every restaurant
this endpoint returns is already Live, so Open/Closed is the only status
left worth showing) and `location_text` as the meta line — no distance
figure, since this app has no GPS. Loading/error/empty states all reuse
`EmptyState` (Task 2.8) with different copy, with the error state's
action wired to `useApiQuery`'s own `refetch`. Categories chips and the
Popular Foods grid are still not built — that's Tasks 3.4/3.5, each
following this same wire-up pattern; the placeholder line on the screen
now covers only those two remaining sections.

Verified without npm registry access (same recurring sandbox constraint
as most of Phase 1/2): found a cached `esbuild` binary and a global
`react`/`react-dom` install already present in this sandbox (installed
for unrelated tooling) and used them for real signal beyond a plain
read-through — bundled `Home.jsx`'s entire import tree (stubbing only
`react-router-dom` and CSS Modules) with zero unresolved imports or
syntax errors, then rendered the bundled component with
`react-dom/server`'s `renderToStaticMarkup` against a stubbed `fetch`,
confirming it renders (the initial loading state) without throwing, and
separately confirmed the API client's actual request/response handling
(`auth: false` correctly omits the `Authorization` header, the response
JSON shape parses as expected) by bundling and exercising
`src/api/client.js` directly. Full `styles.*` class-name parity between
`Home.jsx` and `Home.module.css` also confirmed both directions. No real
`vite build`/`npm run lint` this session (registry still 403s) — worth
running for real the next time registry access is available, same
standing caveat as 2.10 onward.

**Task 3.4** wired the Categories chip row to the new
`GET /api/categories/live` (see `backend/README.md`'s 3.4 entry for the
backend half). Rendered via the existing `FilterBar` (Task 2.14) as a
single chip group — a leading "All" chip plus one per distinct live
category name — fetched the same way the Restaurants row is (`useApiQuery`,
Task 3.1, since this is one unpaged list feeding a chip row, not a
`ListWithPagination` screen). `selectedCategory` is real `useState` and
the active chip does reflect it, but selecting one doesn't filter
anything yet — there's nothing on the screen for it to filter until the
Popular Foods grid exists (Task 3.5) and 3.6 decides how filtering
actually calls the backend. The placeholder paragraph now covers only
the one remaining section (Popular Foods).

This sandbox had no npm registry access this session either (`npm
install` still 403s against the registry) — unlike 3.1–3.3, it also had
no cached `esbuild`/jsdom left over from a prior run to bundle-and-render
against, so verification here was a hand read-through plus the same
`styles.*` class-name parity check (both directions) 3.1–3.3 used — no
real `vite build`/`npm run lint` this session. Worth running both for
real, and re-confirming this component with a real bundler/render, the
next time registry access is available.

**Task 3.5** wired the third and last Home-screen section, the Popular
Foods grid, to the new `GET /api/foods/popular` (see `backend/README.md`'s
3.5 entry for the backend half). Rendered via `ResponsiveGrid` (Task 2.7)
with each food through `EntityCard`'s food-card slots (`image_url`→image
falling back to the same `FALLBACK_IMAGE` the Restaurants row uses,
`name`→title, `restaurant_name`→subtitle, a formatted price→metaLine, and
an "Order Now" `cta`). The cta is a plain styled `<span>`, not a real
button/link — Food Details (Task 3.9), where tapping a food or its
"Order Now" cta should actually navigate, doesn't exist yet, so wiring
real navigation now would be inventing that task's scope early rather
than deferring to it, same "reserve the slot" reasoning `EntityCard`'s
own `badge`/`cta` props were built with from Task 2.3 onward. Fetched via
`useApiQuery` (`POPULAR_FOODS_GRID_LIMIT`), same "one bounded page, no
page controls" reasoning as the Restaurants row. Selecting a Categories
chip still doesn't filter this grid — that's Task 3.6's job. Loading/
error/empty states reuse `EmptyState`, same as the Restaurants row.

**This session had real npm registry access** — ran the actual
`npm install`, `npm run lint` (clean), and `npm run build` (`vite build`,
95 modules transformed, up from 89 — succeeds) against the real
`frontend/` package, the first real frontend build/lint run since Task
3.2. No frontend test framework is configured yet (no vitest/RTL in
`package.json`), so this is a build-level check, same as every prior
frontend task's own bar. `node_modules`/`dist` removed before packaging.

**Note:** this Status section fell behind — Tasks 3.6 (search wiring),
3.7 (Restaurant Profile header), and 3.8 (Restaurant Profile menu list)
all landed with full write-ups in `docs/PROJECT_STATUS.md`, not
backfilled here; not fixed as part of Task 3.9 either, to avoid
duplicating that doc. See `docs/PROJECT_STATUS.md`'s own 3.6/3.7/3.8
entries directly.

**Task 3.9** added the Food Details screen: new
`frontend/src/pages/FoodDetails/` (`FoodDetails.jsx`, `.module.css`,
`index.js`) — image, restaurant name, description, price, a real
`QuantityStepper` (Task 2.9), and a real "Buy Now" button, fetched via
`useApiQuery` against the new `GET /api/foods/detail/:id` (see
`backend/README.md`'s 3.9 entry for the backend half). Mounted at
`App.jsx`'s existing `/food/:id` route, replacing its placeholder.

Buy Now navigates to a new `/order/builder` placeholder route (added to
`App.jsx` alongside this task, same `Placeholder` pattern as
`/order/confirm`/`/track`), carrying `{ foodId, restaurantId, quantity }`
via router `state` — Order Builder (Task 3.10) doesn't exist yet and
has no cart/selection-state mechanism of its own to read from yet, so
this hands it real data to pick up rather than leaving Buy Now inert or
guessing 3.10's own state design. Also closed a gap flagged since
Tasks 3.5/3.8: the "Order Now"/"Buy Now" `cta`s on Home.jsx's Popular
Foods grid, Home.jsx's search results, and RestaurantProfile.jsx's menu
list were all inert placeholders waiting on this screen to exist — all
three food `EntityCard`s now have a real `onClick` (`goToFood`) to Food
Details, the same `goToRestaurant`-style pattern each screen already
used once Restaurant Profile (3.7) existed.

**No test file was written for this task** — deferred at the user's
explicit request, to be conducted in a later session; unlike this file's
several standing "no registry access" caveats, this is a deliberate
scope cut, not a gap. Verified with `tsc --noEmit --noResolve
--skipLibCheck --jsx react-jsx` against every changed/new file (no
genuine TS1xxx-class errors) and a class-name-parity check (both
directions) between `FoodDetails.jsx` and its CSS module — not a real
`vite build`/`npm run lint` this session.

**Task 3.10** added the Order Builder screen: new
`frontend/src/pages/OrderBuilder/` (`OrderBuilder.jsx`, `.module.css`,
`index.js`) and a new `frontend/src/hooks/useOrderCart.js`, mounted at
`App.jsx`'s existing `/order/builder` route in place of its placeholder.

The cart (`{ restaurantId, items: [{ foodId, quantity }] }`) is backed by
`sessionStorage` via `useOrderCart`, not plain component state —
seemingly more than this task alone needs, but Task 3.11 ("Add another
item") will navigate away to a restaurant's menu (Task 3.8) and back, and
a plain unmount/remount of this screen would otherwise lose the cart on
that round trip; designing the storage-backed shape now avoids 3.11
having to redesign this screen's state to add it later. `sessionStorage`
over `localStorage`: an in-progress order isn't something this app has
any reason to survive past the tab closing (no customer accounts, per
`docs/DB_SCHEMA.md`). See that hook's own header comment for the full
reasoning, including why it's a plain hook and not a React Context.

Food Details' (3.9) Buy Now hands off `{ foodId, restaurantId, quantity
}` via router `state`; this screen merges it into the persisted cart
exactly once per arrival (a ref keyed on that triple guards against
re-merging on every render, since `location.state` is a fresh object
identity each time) and then clears it from history via a `replace`
navigation, so a refresh or back/forward doesn't silently double-add the
item. A directly-visited `/order/builder` with an empty cart (fresh tab,
nothing in storage) renders an empty-cart `EmptyState` pointing back at
Home rather than a blank screen.

Each line item's food data (name/image/price) is re-fetched via the
existing `GET /api/foods/detail/:id` (Task 3.9) keyed only on the set of
food ids in the cart, not on quantity — editing a quantity re-renders the
line's subtotal locally without re-fetching anything. Subtotal/total are
computed client-side (`price × quantity` summed, no fee/tax anywhere in
this project — NATRA has no platform-managed delivery at all — so total
currently just equals subtotal, kept as its own variable for if a fee is
ever added). Each line uses a real `QuantityStepper` (Task 2.9) plus a
"Remove" action; removing the last item resets the cart's `restaurantId`
too, so picking a food from a different restaurant afterward doesn't
immediately hit the cart's own "different restaurant replaces the cart"
safety net for no visible reason.

**"Add another item"** is rendered (it's part of this screen's own
layout per `docs/NATRA_MASTER_PROMPT.md`) and navigates to the current
restaurant's profile (Task 3.7, a real destination) — but tapping a food
there still goes to Food Details rather than back into this cart; wiring
that actual round trip is explicitly Task 3.11's job ("same-restaurant
constraint enforced"), flagged in `OrderBuilder.jsx`'s own doc comment
rather than guessed at here. "Continue" navigates to a new
`/order/customer-info` placeholder route (added to `App.jsx` alongside
this task, same `Placeholder` pattern as `/order/confirm`/`/track`),
carrying the cart's `restaurantId` via router `state` — Task 3.12
("Customer info form") doesn't exist yet.

**No npm registry access this session** (`npm ping` → 403, same standing
gap as several recent sessions) — verified by hand instead: a
class-name-parity check (both directions) between `OrderBuilder.jsx` and
its CSS module, brace/paren balance checks on both new files, and a
scratch (not shipped) plain-Node script exercising the cart
add/merge/replace/setQuantity/remove logic extracted from
`useOrderCart.js` against 7 scenarios (first add, adding a second
distinct food, re-adding the same food merging its quantity, adding from
a different restaurant replacing the cart, `setItemQuantity` only
touching its own line, `removeItem` keeping `restaurantId` while items
remain, and removing the last item resetting the cart) — all 7 passed.
No test file was written for this task, same deliberate scope cut as
3.9 (the user's standing instruction, not a registry-access gap).

**Order builder — "Add another item" (Task 3.11)**: the round trip
flagged above turned out to already work mechanically (Buy Now always
hands off to Order Builder, and `addItem` already merges a matching
`restaurantId`) — the actual gap was that "Add another item" had no
way to stop a customer from reaching a *different* restaurant's menu.
`OrderBuilder.jsx`'s `handleAddAnotherItem` now always navigates to
`/restaurant/${cart.restaurantId}` (never any other restaurant's id)
with `state: { addingToOrder: true }`, forwarded through
`RestaurantProfile.jsx` (a small "Adding to your current order" banner,
plus the flag threaded into its own `goToFood` navigation) to
`FoodDetails.jsx`. Also closed a real gap in `addItem`'s own
different-restaurant safety net: it silently replaced the whole cart
with no warning, so `FoodDetails.jsx`'s `handleBuyNow` now checks for
that exact mismatch and asks for confirmation via `window.confirm`
before navigating (skipped when `addingToOrder` is set, since that trip
is already guaranteed same-restaurant by the URL it came from). No
backend changes — this is entirely a frontend navigation/UX task; the
one-restaurant-per-order rule is still enforced for real at order
submission (Task 3.15, not built yet). Same standing constraints as
3.9/3.10: no npm registry access this session (verified by hand via a
class-name-parity check and a manual trace of the new state/confirm
logic against `useOrderCart`'s real, unmodified `addItem`), and no test
file written, per the same deliberate scope cut.

**Customer Info form (Task 3.12)**: new `frontend/src/pages/CustomerInfo/`
at `/order/customer-info` — name/phone/location-free-text/note via
`FormField` (Task 2.10), field length caps matching `docs/DB_SCHEMA.md`'s
`orders` columns exactly, no client-side phone format validation beyond
"non-empty" (same `normalizePhone`-tolerance reasoning as the backend
utility). `useOrderCart` (Task 3.10) is extended with a `customerInfo`
field + `setCustomerInfo` setter, kept on the same sessionStorage-backed
cart object rather than a second storage mechanism, since Tasks 3.13/3.14
will need to read it back too. `addItem`'s different-restaurant safety
net (Task 3.11) now preserves `customerInfo` across a restaurant swap;
`removeItem` emptying the cart still clears it. `OrderBuilder.jsx`'s
"Continue" no longer passes `restaurantId` via router `state`, since this
screen reads the cart directly. Same standing constraints as 3.9–3.11: no
npm registry access this session — verified by hand (class-name-parity
check, brace/paren-balance checks) plus a scratch plain-Node script
re-deriving the cart's add/remove/setCustomerInfo transitions and the
form's own `validate()` as 9 checks, all passing; no test file written,
same deliberate scope cut.

**Payment Method selection (Task 3.13)**: new
`frontend/src/pages/PaymentMethod/` at `/order/payment-method` — reads
`cart.restaurantId` (Task 3.10) via `useOrderCart`, fetches that
restaurant's active payment methods from the new
`GET /api/restaurants/:id/payment-methods`, and lets the customer tap
one to both select it and move on to a new `/order/payment-screenshot`
placeholder (Task 3.14 doesn't exist yet). `useOrderCart` gains a
`paymentMethodId` field + `setPaymentMethod` setter on the same
sessionStorage-backed cart object as `customerInfo` — but unlike
`customerInfo`, `paymentMethodId` is reset to `null` (not preserved) on
a different-restaurant cart swap, since it names one specific
restaurant's own configured method. An empty cart and a restaurant with
zero active methods configured each get their own distinct `EmptyState`.
Same standing constraints as 3.9–3.12: no npm registry access this
session — verified via `tsc --noEmit --noResolve --skipLibCheck`, a
class-name-parity check between `PaymentMethod.jsx` and its CSS module,
brace/paren-balance checks, and a scratch plain-Node script re-deriving
`useOrderCart`'s `addItem`/`removeItem`/`setPaymentMethod` transitions
as 9 checks, all passing; no test file written, same deliberate scope
cut.

**Note:** this file's own log skipped straight from 3.13 to 3.16 below —
Tasks 3.14 (Payment Screenshot upload) and 3.15 (submit-order backend
endpoint) were both actually built in an earlier session (their code and
`docs/TASKS.md` checkboxes are real and in place) but never got their own
write-up here or in `docs/PROJECT_STATUS.md`. Flagged rather than
silently backfilled with a reconstructed account of a session this one
wasn't present for.

**Order Confirmation (Task 3.16)**: new
`frontend/src/pages/OrderConfirmation/` at `/order/confirm` — reached
from Payment Screenshot's (Task 3.14) "Continue". This is also where the
built-up order is actually submitted: no earlier screen calls
`POST /api/orders` (Task 3.15), so this screen's own mount effect builds
the request from `cart.customerInfo`/`paymentMethodId`/
`paymentScreenshotUrl`/`items` and fires it via the existing `useMutation`
hook. Guarded by a plain ref (not `useMutation`'s own `loading`/`data`
state) against React 18 `StrictMode`'s effect double-invoke in dev, so
the order is never submitted twice from one visit. A `hadItemsOnMountRef`
captures whether the cart had items *before* a successful submit clears
it, so a freshly-placed order's confirmation screen doesn't collapse into
the same "browse restaurants" `EmptyState` a genuinely-empty cart (direct
visit) uses. On success: shows the returned `order_code`, a "Track
order" button to `/track` (still `App.jsx`'s own placeholder — Task
3.17's job), and a "Back to home" button; `clearCart()` runs immediately,
since there's nothing left in the in-progress order worth protecting. On
failure: the cart is left untouched and a "Try again" button re-runs the
same `mutate()` directly. Same standing constraints as recent sessions:
no npm registry access — verified via `tsc --noEmit --noResolve
--skipLibCheck --jsx react-jsx`, a class-name-parity check (both
directions) between `OrderConfirmation.jsx` and its CSS module, and a
brace/paren-balance check on the new file; no test file written, same
deliberate scope cut.

**Order History (Task 3.18c)**: new `frontend/src/pages/OrderHistory/` at
`/history` (routed in `App.jsx` as part of Task 3.18d, not yet wired at
the time of this write-up — see that task). A single phone field (no
order code, unlike Track Order/3.17) drives the new
`GET /api/orders/history` endpoint (Task 3.18a) through
`usePaginatedQuery` (Task 3.1) rather than `useMutation` — once a search
has been submitted, paging through the results via `ListWithPagination`
(Task 2.16) is itself a sequence of automatic page-keyed re-fetches,
exactly `usePaginatedQuery`'s shape, not a one-shot mutation the way
Track Order's single-record lookup is. `fetchHistory(phone)` resolves to
an empty page with no API call at all while `phone` is still `null` (no
search submitted yet) — `usePaginatedQuery` can't conditionally skip its
own effect, so this is the seam that turns "nothing searched yet" into a
real no-op. Each row shows exactly what the endpoint returns per order
(order_code, `StatusBadge`, placed-on date, total) — no per-item
breakdown, since `GET /api/orders/history` doesn't join `order_items`
(Track Order already covers that for one specific order); the master
prompt's own "detailed previous-order layout remains flexible" note
means this is a starting layout, not a fixed one. A phone with zero
orders renders `ListWithPagination`'s `emptyState` slot, not an error —
matching the backend's own `200`-with-empty-list behavior for that case.
Same standing constraint as recent sessions until this session: no npm
registry access — this time `npm install` actually succeeded, so
`npx eslint` was run for real against the new file (one real finding,
an unescaped apostrophe in JSX text, fixed) rather than hand-traced.

**Task 3.18 is complete (Task 3.18d, wiring)**: `/history` added to
`App.jsx`; `TrackOrder.jsx` and `OrderHistory.jsx` gained reciprocal
in-page links to each other (a shared `.linkButton` style, not a
`RoleShell` nav change — see `App.jsx`'s own `/history` route comment
for why the reference UI's fixed 4-slot bottom nav isn't the right place
for this). Verified with a real `npx vite build` (124 modules, no
errors) — the first task in this log verified against an actual
production build rather than `tsc --noEmit`/hand-tracing, now that
`npm install` works again this session.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

**Task 4.1 (owner registration) is done — Phase 4's first task.** New
`frontend/src/pages/OwnerRegistration/`, routed at `/owner/register`. No
backend work was needed: `POST /api/auth/signup` (Task 1.12) already
took exactly the four fields the master prompt names, `role: 'owner'`
included — re-ran `authController.test.js` (23/23 pass) to confirm
before building against it rather than assuming. `role` itself is
hardcoded to `'owner'` on this screen, not exposed as a field, since the
same endpoint also backs future admin account creation with no reason to
let a public form pick that. Password bounds mirror
`authController.js`'s own `MIN_PASSWORD_LENGTH`/`MAX_PASSWORD_LENGTH`
(8/72) exactly, cap included (bcrypt's 72-byte truncation, per that
file's own comment) — a real rule being mirrored, not a guessed one.
Deliberately does NOT log the new owner in (signup returns no token;
only `POST /api/auth/login`, Task 4.2's job, does) — navigates to
`/owner/login` with a `state.justRegistered` flag on success instead, for
4.2's screen to pick up once it exists. No `RoleShell` wrapper (no
account yet to have a role-nav context for). Verified with a real
`npx eslint` (clean) and `npx vite build` (127 modules, no errors).

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

**Task 4.2 (owner login) is done.** New `frontend/src/pages/OwnerLogin/`,
routed at `/owner/login`, replacing that path's placeholder. No backend
work needed: `POST /api/auth/login` (Task 1.13) already returned
`{ user, token }`. On success, stores the token via `tokenStorage`
(Task 3.1's localStorage wrapper — dormant until this task, its first
real caller) and navigates to `/owner/dashboard` (still a Phase 5
placeholder). Reads `OwnerRegistration`'s (4.1) `state.justRegistered`/
`state.email` to show an "account created" banner and prefill the email
field. A `401` is shown as one generic form-level message ("Invalid
email or password"), never attached to a specific field — mirroring
`authController.js`'s own `INVALID_CREDENTIALS_MESSAGE` reasoning
exactly, so this screen can't be used to enumerate which emails have
accounts any more than the endpoint itself allows. No `RoleShell`
wrapper, same reasoning as 4.1 (no account yet on this screen to have a
role-nav context for).

Standing constraint recurred this session: no npm registry access
(`npm install` 403s), so this task's verification is a manual review —
brace/paren balance check, cross-checked every import (`FormField`,
`useMutation`, `api`/`ApiError`, `tokenStorage`) against its actual
export, and confirmed every CSS custom property the new stylesheet uses
is defined in `src/styles/global.css` — rather than a real `npx eslint`/
`npx vite build`. Both should still be run for real before this task is
considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

**Task 4.3 (Request Live screen) is done.** New
`frontend/src/pages/RequestLive/`, routed at `/owner/request-live`,
linked from the still-placeholder `/owner/dashboard`. New backend
endpoint needed: `GET /api/admin-settings/registration` (see
`backend/README.md`'s own Task 4.3 entry).

**The first real use of the `Wizard` component** (Task 2.20) — until
now only previewed against mock data in `ComponentSandbox` (2.21), using
the exact same `steps` shape that preview already established (`fee`/
`upload` keys) so the sandbox's preview actually previews this real
screen. Step 1 fetches and shows the registration fee + NATRA payment
info via `useApiQuery`, with the same loading/error-with-Retry
`EmptyState` shape `RestaurantProfile.jsx`'s menu section (3.8) already
established. Step 2 is a deliberate placeholder — the real
screenshot-upload UI is Task 4.4's job, not this one's — so
`isNextDisabled` is hardcoded `true` while on Step 2 (mirrored from
Wizard's own `onStepChange` into local state, since the disabled-rule
differs per step), meaning "Submit" can't fire yet, matching Task 4.5
(the actual submit endpoint) also not existing yet.

No `RoleShell` wrapper, same reasoning 4.1/4.2 already give (no owner
nav or Live restaurant to render one around yet).

Standing constraint recurred and worsened this session: no npm registry
access, and this time no `node_modules` at all (not even `express`) —
so unlike 4.1's real `npx eslint`/`npx vite build`, this task's frontend
verification is manual: brace/paren balance, and every import (`Wizard`,
`EmptyState`, `useApiQuery`, `api`) cross-checked against its actual
export. Both a real lint and build still need to confirm this before
the task is considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

**Task 4.4 (Request Live: payment screenshot upload step) is done.**
`RequestLive.jsx`'s Step 2 (previously a hardcoded placeholder) now
renders a real `ImageUploadField` (Task 2.10) and gates the wizard's
"Submit" on a screenshot having been picked — same `isNextDisabled`
mirroring approach Step 1 already established, extended with the
picked-file/uploaded-URL state Step 2 now actually has.

**Reuses the existing public `POST /api/uploads/payment-screenshot`**
(`uploadController.js`, Task 3.14 — built for the customer order flow)
rather than a second, registration-specific upload route: that endpoint
is already a bare, context-free multipart `image` upload with
`compress: false` (the same "a reviewer needs full-fidelity pixels"
reasoning applies to an admin reviewing a registration payment as it
does to an order payment), so no new backend code was needed for this
task at all — see `RequestLive.jsx`'s own doc comment for the one
real trade-off this reuse accepts (registration and order screenshots
share one Object Storage folder, indistinguishable by path).

Upload fires on Submit (`Wizard`'s `onComplete`), not on file pick —
the same "`ImageUploadField` doesn't upload anything itself, the
screen decides when" split `PaymentScreenshot.jsx` (3.14) already
established, reused here via the same `FormData` + `api.post(...,
{ auth: false })` call. Task 4.5 (the real submit endpoint) still
doesn't exist, so a successful upload can only get the screenshot
durably stored and show an explicit "uploaded, submission coming
soon — see Task 4.5" confirmation, rather than silently doing nothing
or faking a real submission.

No backend changes this task — everything it needed already existed
from Task 3.14. Same standing constraint as 4.1–4.3: no npm registry
access, no `node_modules` — verified manually (brace/paren/bracket
balance, a two-way `styles.*` class-name parity check against
`RequestLive.module.css`, both passing with no new mismatches beyond
the one pre-existing `feeAmount` compound-selector case from Task
4.3). A real lint/build still needs to confirm this before the task is
considered fully closed.

**Task 4.5d**: `RequestLive.jsx`'s `onComplete` is now wired to the real
`POST /api/live-requests` (Task 4.5c, backend-only until this task).
Upload still fires first if a new file was picked, exactly as 4.4 left
it; once a screenshot URL exists (just uploaded, or from an earlier
visit to this step), a second request — `api.post('/live-requests',
{ payment_screenshot_url })`, default `auth: true` this time, unlike the
upload call — submits the actual Live request. The owner's bearer token
is attached automatically via `tokenStorage` (Task 3.1), populated by an
earlier `/owner/login` (Task 4.2) visit; neither `restaurant_id` nor
`amount` is ever sent, since both are resolved/read server-side (4.5b/
4.5c). A successful submission replaces the upload field with a stated
"submitted, pending admin review" confirmation naming Task 4.6 (the
pending-state screen) as not yet built — same "reserve the next step"
pattern this screen already used at every earlier stage. A submission
failure (most likely today: the restaurant-creation gap noted below)
shows an inline error instead of silently doing nothing.

**Real, standing gap this task doesn't fix**: an owner who has signed up
(Task 4.1) but has no `restaurants` row yet — no endpoint creates one —
gets a 403 from `attachOwnerRestaurant` when submitting here, so this
screen can't actually be completed end-to-end by a real new owner today.
Flagged, not silently worked around; a real product gap for a later
task (most likely somewhere in registration) to close.

This session had real npm registry access — the first time this file's
own "no registry access" caveat has been closed. Ran the actual
`npm install` (280 packages), `npm run lint` (clean), and `npm run
build` (`vite build`, 133 modules transformed, succeeds) against the
real `frontend/` package. `node_modules`/`dist` removed before
packaging.

**Task 4.6** — the real pending-state screen. New
`frontend/src/pages/LiveStatus/` (`.jsx` + CSS module + `index.js`),
routed at `/owner/live-status`. Fetches the new, owner-authenticated
`GET /api/live-requests/latest` (backend's own 4.6 entry,
`backend/README.md`) via `useApiQuery`, and renders one of four states
off the response:
- no request yet (`live_request: null`) — points back at
  `/owner/request-live`.
- `status: 'pending'` — "Awaiting admin approval", this task's own named
  case, with a "Check again" manual refetch (`useApiQuery`'s `refetch`)
  since nothing pushes a status change to this screen yet.
- `status: 'approved'` — "You're Live!", linking to `/owner/dashboard`.
  Nothing drives this state for real yet (Phase 6 admin approval isn't
  built) — this task builds the render path anyway so Task 4.7's manual
  DB flip has something real to verify against, rather than needing its
  own follow-up build.
- `status: 'rejected'` — points back at `/owner/request-live` to
  resubmit, per `docs/DB_SCHEMA.md`'s own "owner reapplies" note for
  `live_requests`.

**Status-tone map kept local to this screen**
(`LIVE_REQUEST_STATUS_TONE`), not added to `StatusBadge`'s shared
`STATUS_TONE` — same precedent `TrackOrder.jsx` (3.17) and
`OrderHistory.jsx` (3.18c) already set for `orders.status`, and exactly
the seam `StatusBadge.jsx`'s own doc comment names for this situation:
`live_requests.status` isn't shown in any reference-UI image either, so
assigning it real colors is a per-screen call, not a shared-component
change.

**A 403 here is called out by name, not treated as a generic "couldn't
load" retry state** — `attachOwnerRestaurant` 403s an owner with no
`restaurants` row at all, the same standing gap 4.5d's own entry above
(and `LiveStatus.jsx`'s doc comment) already flag; retrying that 403
would never succeed, so it gets its own message instead of the
Retry-button shell every other error uses.

**`RequestLive.jsx` updated**: `onComplete`'s successful-submission path
now calls `navigate('/owner/live-status')` instead of showing its own
former inline "submitted, pending admin review" `EmptyState` — the
`submittedRequest` state (the created row) is gone entirely, replaced by
a plain `hasSubmitted` boolean that only exists to keep `isNextDisabled`
true for the brief window before the navigation unmounts the screen,
since the created row itself is never rendered here anymore (4.6's
screen re-fetches it via `GET /api/live-requests/latest` instead).

**No npm registry access this session** (`node_modules` fully absent,
same gap `backend/README.md`'s own 4.6 entry hit) — verified by hand:
brace/paren/bracket balance on every changed/added file, a two-way
`styles.*` class-name parity check between `LiveStatus.jsx` and
`LiveStatus.module.css` (clean both directions), and every import in
`LiveStatus.jsx`/`RequestLive.jsx`/`App.jsx` cross-checked against its
actual export in its source file. A real `npm install`/`npm run
lint`/`npm run build` still need to confirm this task before it's
considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 4.7 — Live-state verification (Phase 4 complete)

A real `npm install` resolved this session, so `LiveStatus.jsx`/
`RequestLive.jsx` got a real `npx eslint` (clean) and `npx vite build`
(136 modules, no errors) instead of the hand-traced verification recent
sessions had to fall back on. The task itself ("manual DB stub/test...
confirm owner sees Live state") was verified by tracing `LiveStatus.jsx`'s
real render logic against the exact `{ live_request: { status:
'approved', ... } }` shape the backend half's DB-flip test (see
`backend/README.md`'s 4.7 entry) confirmed the API really returns: the
`status === 'approved'` branch renders "You're Live!", a `StatusBadge`
via this screen's own `tone: 'success'` override, and a "Go to
dashboard" button — and `RequestLive.jsx`'s successful-submission path
really does navigate to `/owner/live-status` (4.5d) first, so the two
screens chain into one real, complete flow end to end.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.1 — Owner nav wiring (Dashboard, Orders, Restaurant, Account)

New `src/pages/OwnerDashboard/` (real content — keeps the old
placeholder's "Request to go Live" link, adds a new "Check Live status"
link), `OwnerOrders/`, `OwnerRestaurant/`, `OwnerAccount/` (deliberate
placeholders, each naming the later task that fills it in: 5.12-5.16,
5.2-5.11, and 5.22 respectively). All four wrapped in `RoleShell
role="owner"` — the first owner screens to use it. Wired into `App.jsx`
at `/owner/dashboard` (replacing the old inline `Placeholder`),
`/owner/orders`, `/owner/restaurant`, `/owner/account`.

Verified with a real `npx eslint` (clean) and `npx vite build` (148
modules). See `/docs/PROJECT_STATUS.md` for the full write-up, including
one flagged (not fixed) pre-existing gap: `attachOwnerRestaurant.js`
still has no restaurant-creation endpoint to resolve it, so a brand-new
owner can't complete the Request Live flow end-to-end yet.

## Task 5.2 — Restaurant profile form

`OwnerRestaurant.jsx` replaced its Task 5.1 placeholder with a real
fetch-then-edit form for the restaurant's `name`/`description` — a new
shape for this codebase: every prior `FormField` form (login,
registration, customer info, request-live) started from a blank or
cart-seeded draft, never an existing server row. Reads/writes the two
new owner-authenticated backend routes this task added,
`GET`/`PATCH /api/restaurants/me` (see `backend/README.md`'s 5.2 entry).

`values` starts `null` (nothing to render while the `GET` is in flight)
and is seeded exactly once from the response via a `seededRef` guard —
deliberately not reseeded on the `refetch()` a successful save triggers,
so a save can't stomp an edit already in progress for the *next* change.
Save state (`useMutation`) is kept separate from load state
(`useApiQuery`): a `justSaved` banner shows after a successful `PATCH`
and clears the moment the owner edits anything again, same "don't leave
a stale success state next to a fresh unsaved change" reasoning a
lingering error message would need to avoid too.

**The `attachOwnerRestaurant` gap gets its own explicit state here,
not a generic retry**: a 403 (still open — see backend's 5.2 entry)
renders as "No restaurant set up yet" rather than the "check your
connection, try again" `EmptyState` this screen's own fetch-error branch
otherwise uses, since retrying a 403 caused by a missing `restaurants`
row can never succeed.

**Raised with the user rather than resolved unilaterally**: the standing
restaurant-creation gap was flagged again before starting this task; the
decision was to build 5.2 as scoped (profile form + the two endpoints
it needs) and keep the gap open, not to fold a fix into this task.

**No npm registry access this session** (`node_modules` fully absent,
same standing gap) — verified by hand: a two-way `styles.*` class-name
parity check between `OwnerRestaurant.jsx` and
`OwnerRestaurant.module.css` (clean both directions), a brace/paren/
bracket balance pass, and every import (`api`/`ApiError`/`useApiQuery`/
`useMutation`/`EmptyState`/`FormField`/`RoleShell`) cross-checked against
its actual export in its source file. A real `npm install`/`npx
eslint`/`npx vite build` still need to confirm this task before it's
considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.3 — Logo + cover image upload

`OwnerRestaurant.jsx` gained two `ImageUploadField`s (cover above logo,
matching the restaurant-profile header's own visual stacking) above the
name/description form from 5.2. `ImageUploadField` itself uploads
nothing (per its own doc comment — it only hands back a compressed
`File` via `onChange`); the new `saveImage` here does the actual
multipart `api.post` to one of the two new backend routes this task
added (`POST /api/uploads/restaurant-logo`/`restaurant-cover` — see
`backend/README.md`'s 5.3 entry), then immediately chains a
`PATCH /me` with the returned URL and refetches — picking a new image
saves right away, rather than waiting for the name/description form's
own Save button.

**One shared save-status banner for the whole screen**: `saveImage`
reuses 5.2's own `mutate`/`saveError`/`justSaved` for the actual save
step, rather than each of the three fields (name+description, logo,
cover) getting its own "Saved."/error banner — all three edit the same
restaurant row. Each image field does track its own local
`uploading`/`error` state, since that covers the upload-to-Object-
Storage step, which precedes `mutate` and has nothing to do with what
`saving`/`saveError` describe.

**No npm registry access this session** — verified by hand: class-name
parity between `OwnerRestaurant.jsx` and `OwnerRestaurant.module.css`
(clean both directions, including the new `.imageFields` class), a
brace/paren/bracket balance pass, and every import — including the new
`ImageUploadField` — cross-checked against its actual export. A real
`npm install`/`npx eslint`/`npx vite build` still need to confirm this
task before it's considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.11 — Menu management: Edit Food form (reuse Add Food form)

No new file — `docs/TASKS.md`'s own wording ("reuse Add Food form") was
taken literally. `AddFood.jsx` (5.10) now serves both
`/owner/restaurant/menu/new` and `/owner/restaurant/menu/:id/edit`,
switching modes off `useParams()`'s `id` (`isEditing = Boolean(foodId)`)
rather than existing as two near-identical files — the same
"one component, mode-derived from a value" shape
`OwnerRestaurant.jsx`'s own category/service-area/payment-method modals
already use for their own add/edit split (`categoryModal.mode`), just
keyed off a route param here instead of local modal state.

**Edit mode fetches the existing food** via `GET /api/foods/:id`
(`foodController.js`'s `getOne`, unchanged since 1.15d, already behind
`ownershipMiddleware` so another owner's food 404s the same way it does
everywhere else) and seeds `values`/the photo preview from it exactly
once via a `seededRef` guard — same shape `OwnerRestaurant.jsx`'s own
profile-form seeding (5.2) already uses, so nothing could ever stomp an
owner's in-progress edits. `price` is seeded as `String(existingFood.price)`
since `FormField`'s controlled `type="number"` input wants a string
like every other field in this codebase, not the raw number the API
returns. A fetch error (another owner's food, a deleted food) shows the
same `EmptyState` shape `FoodDetails.jsx` (3.9) already established for
a single-resource load failure — no half-working form left showing for
something that isn't really there to edit.

**Photo behavior in Edit**: `ImageUploadField`'s `value` falls back to
the food's existing `image_url` whenever no new file has been picked
yet, so reopening Edit shows the current photo — the "editing a form
that already has one" case that component's own doc comment describes.
`POST /api/uploads/food-photo` (5.10's new route) is reused as-is for a
photo change here too; it only ever turns a file into a URL and was
never mode-specific to begin with.

**One `saveFood`/`validate` pair covers both modes** — `saveFood` is a
single-line branch (`foodId ? api.patch(...) : api.post(...)`), which
only works cleanly because both modes always submit the exact same full
payload shape (every field, not a partial update) even though
`PATCH /api/foods/:id` (`updateFoodSchema`) would accept a partial one.
On submit, if no new photo was picked, the existing `image_url` (Edit)
or `null` (Add) is sent through unchanged — see `AddFood.jsx`'s own doc
comment for the fuller reasoning.

**No backend changes were needed for this task** —
`PATCH /api/foods/:id` (1.15e) and 5.10's new `POST
/api/uploads/food-photo` already covered everything Edit needed.

**npm registry was reachable this session** — real `npm install` +
`npx eslint src` (clean) + `npx vite build` (154 modules, unchanged
from 5.10's own count, since Edit adds no new files) all confirmed for
real.

`docs/TASKS.md`'s 5.11 checkbox ticked.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.10 — Menu management: Add Food form

New `AddFood.jsx` (+ `AddFood.module.css`) at
`/owner/restaurant/menu/new`, replacing the `Placeholder` `App.jsx`
had pointed there since 5.9b. Wrapped in `RoleShell role="owner"`, same
as every other owner screen. A full page, not a `Modal` — 5.9b's own
header comment already made this call for Menu management generally
("an Add/Edit form... substantial enough to want its own screen").

**Fields**: `ImageUploadField` for photo, `FormField` for
name/description/price/category(select) — no new form primitives
needed, just composing the ones 2.10/2.11 already built.

**Photo upload is deferred to submit, not immediate-on-pick** — unlike
`OwnerRestaurant.jsx`'s logo/cover fields (5.3), which upload the moment
a file is chosen because there's already a saved `restaurants` row to
`PATCH`, there's no `foods` row yet here to attach a URL to. Same
"hold the compressed `File` in local state until the actual submit"
shape `PaymentScreenshot.jsx` (3.14) already established for this exact
"uploading is a step of creating something new" case. On submit, if a
photo was picked, it's uploaded first (`FormData` to the new
`POST /api/uploads/food-photo` — see `backend/README.md`'s own "Task
5.10" entry for that route) to get a real `image_url`; only then is
`POST /api/foods` (`foodController.js`'s `create`, unchanged since
1.15d) called with the full payload. A failed photo upload surfaces its
own inline error next to the image field and stops there — this screen
deliberately does not create a food with no photo just because the
upload step failed.

**Category is optional** ("uncategorized allowed" per
`docs/DB_SCHEMA.md`) — the select's first option is a real,
always-selectable "Uncategorized" choice, not `FormField`'s own
`placeholder` prop (which renders a `disabled hidden` option meant for
"must actively pick one" fields and can't stay selected as a real
value). Choosing it resolves to `category_id: null`, matching
`foodController.js`'s `categoryIdSchema` explicit-null shape. Categories
are fetched via a plain `GET /api/categories?limit=100` +
`useApiQuery`, reshaped down to just the array this `<select>` needs —
deliberately not `usePaginatedQuery` the way `OwnerRestaurant.jsx`'s own
Categories *section* (5.4) uses it: a `<select>`'s option list isn't a
browsable, paged resource the way `OwnerMenu.jsx`'s food list (5.9b) is,
and reusing `usePaginatedQuery` here would also inherit that section's
own already-flagged `{ rows, meta }`-reshaping bug for no benefit. An
empty categories list (a new restaurant that hasn't touched 5.4 yet)
still renders a working form — just the one "Uncategorized" option —
rather than blocking food creation on category setup first.

**On success**: navigates back to `/owner/restaurant/menu` so the new
food shows up in 5.9b's list immediately via that screen's own
fetch-on-mount, rather than lingering on a stale form or threading a
success banner across the navigation the way `OwnerRestaurant.jsx`'s
single persistent form does with `justSaved`.

**Validation mirrors `foodController.js`'s `createFoodSchema` limits
exactly** (`NAME_MAX_LENGTH`/`DESCRIPTION_MAX_LENGTH`/`MAX_PRICE`,
copied as named constants same as `OwnerRegistration.jsx` already does
for `authController.js`'s signup limits) — including the same
"at-most-2-decimal-places" price check that schema's own `.refine`
uses, via `toFixed(2)` rather than a naive modulo, for the same
floating-point-representation reason that file's own comment gives.

**npm registry was reachable this session** — real `npm install` +
`npx eslint src` (clean) + `npx vite build` (154 modules, up from 3.18d's
124, succeeds) all confirmed for real.

`docs/TASKS.md`'s 5.10 checkbox ticked.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.9b — Menu management: food list screen (Edit/Delete/Hide)

The frontend half of Task 5.9 — 5.9a (backend) added
`PATCH /api/foods/:id/visibility` and had `GET /api/foods`/
`GET /api/foods/:id` start returning `is_hidden`; see
`backend/README.md`'s own "Task 5.9a" entry for that side.

**A new page, not another `OwnerRestaurant.jsx` section** — unlike
Categories/Opening hours/Service areas/Payment methods (5.4-5.7), which
are each one `<section>` on that already-large page, Menu management is
three tasks (5.9 list, 5.10 add, 5.11 edit) with an Add/Edit form
substantial enough to want its own screen rather than a `Modal` — and
that file's own header comment already flagged itself as a candidate to
revisit once it got unwieldy. So this is a new `OwnerMenu.jsx` at
`/owner/restaurant/menu`, reached via a link that replaces
`OwnerRestaurant.jsx`'s former "Menu management lands here in a later
task" placeholder line — not a fifth `RoleShell` owner nav tab, since
`docs/NATRA_MASTER_PROMPT.md`'s "Restaurant owner navigation" names
exactly four and Menu isn't one of them (the same sub-page-of-a-tab
relationship Track Order/Order History, Task 3.17/3.18, have to their
own bottom-nav tab).

**List**: `ListWithPagination` against `GET /api/foods`, reshaping its
`{ foods, meta }` response to the `{ rows, meta }` shape
`usePaginatedQuery` expects — same rename `fetchPaymentMethods` (5.7)
already does, done correctly here rather than repeating the
`fetchCategories`/`fetchServiceAreas` gap that file's own header comment
flags. Each row shows the food's name, price (the same `formatPrice`
"250 ETB" convention duplicated across `FoodDetails.jsx`/`Home.jsx`/
`RestaurantProfile.jsx`/`OrderBuilder.jsx`), and a `StatusBadge` for its
current Hidden/Visible state — reusing that component's `success`/
`error` tones the same way `is_open`'s Open/Closed badge (5.8) already
does (available-to-customers = success), not an invented color for a
status the reference UI never shows.

**Edit/Delete/Hide**: `docs/TASKS.md`'s own wording for this task names
all three as same-shaped actions, so Hide is a link-style text button
(flipping between "Hide"/"Show") right alongside Edit/Delete, not a
`ToggleSwitch` the way Payment methods' `is_active` (5.7) is — with its
own per-row `togglingFoodId`/`toggleErrors` state, the same "inline
one-field PATCH, no modal" shape 5.5b's per-day save and 5.7's toggle
both already use. **Edit** links to `/owner/restaurant/menu/:id/edit`
and **Add food** to `/owner/restaurant/menu/new` — both still
`Placeholder`-backed in `App.jsx` until 5.10/5.11 build them for real,
same "wire the destination now" convention that file already uses for
`/admin/login`/`/admin/dashboard`. **Delete** reuses the same
`Modal`-confirmation shape as Categories/Service areas (5.4/5.6): a
dedicated confirmation `Modal`, since this screen has no add/edit modal
of its own (those are 5.10/5.11's full pages, not a `Modal`) to
repurpose.

**No npm registry access this session** — verified by hand: a brace/
paren/bracket balance pass on `OwnerMenu.jsx`/`App.jsx`/
`OwnerRestaurant.jsx`, and every import (`ListWithPagination`, `Modal`,
`StatusBadge`, `EmptyState`, `RoleShell`) cross-checked against its
actual export. A real `npm install`/`npx eslint`/`npx vite build` still
need to confirm this task, same caveat several earlier Phase 5 entries
above carry.

`docs/TASKS.md`'s 5.9 checkbox ticked (5.9a + 5.9b both done).

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.8 — Open/Closed toggle (no confirmation)

New row at the top of `OwnerRestaurant.jsx`'s content, above the
logo/cover fields: a `StatusBadge` (Open/Closed, reusing the same
`is_open ? 'Open' : 'Closed'` convention `Home.jsx`/`RestaurantProfile.jsx`
already use) plus a `ToggleSwitch` that PATCHes `restaurants.is_open`
directly. "No confirmation" (the task's own name for it) means no modal
or are-you-sure step, not "no feedback" — `handleOpenToggle` fires
`mutate` the instant the switch flips, the same "commit immediately, no
separate Save click" shape `saveImage` already established for logo/cover
(Task 5.3), rather than the name/description form's "type, then click
Save changes."

**Shares the name/description form's `mutate`/`saveError`/`justSaved`,
not its own state** — same reasoning that group already gives for
folding logo/cover in: `is_open` is a column on the exact same
restaurant row, so a second "toggle saved" banner would be describing
the same underlying fact twice, not a genuinely separate concern the
way Categories/Service areas/Payment methods (their own tables) are. A
failed toggle surfaces through that shared banner and skips `refetch()`,
so the `ToggleSwitch` snaps back to `data.restaurant.is_open`'s real,
last-known-good value rather than a UI that silently disagrees with the
server.

**Backend**: `updateProfileSchema`/`updateMe` gained `is_open`
(boolean-in, 0/1-stored, converted via a new `toIsOpenNumber` — same
shape `paymentMethodController.js`'s `is_active` already established),
plus a real test-isolation bug fixed along the way
(`restaurant.routes.test.js` never set `JWT_SECRET`, unlike every
sibling routes-test file). Full writeup in `backend/README.md`'s "Task
5.8" entry.

**`npm install`/`npx eslint`/`npx vite build` all ran for real this
session** — `vite build` succeeds clean; `eslint` shows zero new errors
from this task's additions. Class-name parity between
`OwnerRestaurant.jsx` and `OwnerRestaurant.module.css` (the three new
classes: `.openToggleRow`/`.openToggleStatus`/`.openToggleHint`)
confirmed clean both directions via a scripted check, same for a
brace/paren/bracket balance pass.

`docs/TASKS.md`'s 5.8 checkbox ticked.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.7 — Payment methods CRUD screen

Unlike Categories (5.4)/Service areas (5.6), this is deliberately NOT a
copy of that one-field shape — `paymentMethodController.js`'s own header
comment (Task 1.16c) already explains why: `/api/payment-methods` has no
`DELETE` route at all (an un-guardable FK from
`orders.payment_method_id`, on a table that's never hard-deleted), so
`is_active`, PATCHed like any other field, is the only supported way to
retire one. `OwnerRestaurant.jsx` gained a "Payment methods" section
(below Service areas) with the same `ListWithPagination` + add/edit
`Modal` pattern as the other two, but no delete-confirmation `Modal` —
instead each row gets an inline `ToggleSwitch` (Task 2.11, already used
by 5.5b's opening hours) wired straight to `is_active` via a one-field
`PATCH`, with its own `togglingPaymentMethodId`/`toggleErrors` state
mirroring 5.5b's per-day `savingDayId`/`dayErrors` shape rather than the
add/edit modal's shared mutation state. The add/edit form itself has
four fields (`method_name`, `account_number`, `account_name`, and an
optional `instructions` textarea) instead of Categories/Service areas'
one, each capped to `docs/DB_SCHEMA.md`'s column lengths (60/60/120/500)
same as `paymentMethodController.js`'s own server-side schemas.

No new backend needed: `/api/payment-methods`' full CRUD (list/create/
get/update, no delete) already existed from Task 1.16c, fully tested
(`paymentMethod.routes.test.js`).

**A real bug noticed in 5.4/5.6, not fixed here**: `usePaginatedQuery`'s
own doc comment says `queryFn` must resolve to `{ rows, meta }` — the
shape `paginate.js` returns internally, before each controller renames
`rows` to its own resource key (`categories`/`service_areas`/
`payment_methods`) on the way out. `fetchPaymentMethods` (this task)
reshapes the response to account for that rename;
`fetchCategories`/`fetchServiceAreas` (5.4/5.6) don't, and appear to
hand `usePaginatedQuery` a `rows: undefined` today — meaning those two
lists likely never actually render any rows. Flagged rather than fixed
here since it's not this task's own section that's broken, and fixing
it means re-verifying two already-shipped screens rather than building
this one; worth a dedicated fix pass.

**No delete-confirmation `Modal` needed, unlike Categories/Service
areas** — the only per-row action besides Edit is the `ToggleSwitch`,
which is a direct, immediately-visible state flip rather than a
destructive action, so it doesn't get a confirmation step the way an
actual delete does.

**`npm install`/`npx eslint`/`npx vite build` all ran for real this
session** (npm registry was reachable, unlike every prior 5.x session's
"no npm registry access" note) — `vite build` succeeds clean; `eslint`
on this file shows zero *new* errors from this task's own additions.
The two `react/no-unescaped-entities` hits on this file's new
"Couldn't save this payment method..." text are pre-existing repo-wide
(`Home.jsx`, `LiveStatus.jsx`, `OwnerDashboard.jsx`,
`RestaurantProfile.jsx`, and this file's own pre-existing "Couldn't..."
strings from 5.2/5.4/5.5/5.6 all have the same unescaped-apostrophe
issue already) — matching existing convention, not a regression.
Class-name parity between `OwnerRestaurant.jsx` and
`OwnerRestaurant.module.css` confirmed clean both directions via a
scripted check, and a scripted brace/paren/bracket balance pass on the
`.jsx` file also came back clean.

`docs/TASKS.md`'s 5.7 checkbox ticked.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.6 — Service areas CRUD screen

A near-exact copy of Task 5.4's Categories section — same shape
`serviceAreaController.js`'s own header comment already calls out
("Same shape as categoryController.js ... one real field"). No new
backend needed: `/api/service-areas`' full CRUD already existed from
Task 1.16b. `OwnerRestaurant.jsx` gained a "Service areas" section
(below Opening hours) with the same `ListWithPagination` + add/edit
`Modal` + delete-confirmation `Modal` pattern as Categories, differing
only in the field name (`area_name` vs `name`) and its length cap
(120 vs 80 chars, per `docs/DB_SCHEMA.md`).

**Copied, not extracted into a shared component** — same call this
file's own header comment already makes explicit: there's no third
user of this exact one-field-CRUD shape yet (Payment methods, Task 5.7,
is a genuinely different shape — its own `is_active` toggle and no
`DELETE` route per Task 1.16c's design), so abstracting now would be
speculative generalization from two data points.

**No npm registry access this session** — verified by hand: full
brace/paren/bracket balance on `OwnerRestaurant.jsx` (clean), complete
`styles.*` class-name parity with `OwnerRestaurant.module.css` in both
directions (zero mismatches), and a scratch (not shipped) trace of the
add/edit/delete request shapes (`POST`/`PATCH`/`DELETE
/service-areas...` with the right body) against
`serviceAreaController.js`'s real schemas. A real
`npm install`/`npx eslint`/`npx vite build` still need to confirm this
task before it's considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.5b — Opening hours screen (editing/save)

Completes Task 5.5. Each of the 7 rows now edits and saves
independently via a `openingHoursDrafts` map keyed by `opening_hours.id`
(with its own per-row `savingDayId`/`dayErrors`/`justSavedDayIds`
state) — not one shared form the way 5.2's name/description fields are,
since editing Tuesday shouldn't block or get tangled with saving
Monday. `dayDraft(day)` falls back to the fetched row whenever no draft
entry exists yet; no seeding `useEffect`/ref is needed the way 5.2's
`values` needs `seededRef`, since a successful save only ever updates
that one day's own map entry from the response — nothing here calls a
full-list `refetch()` that could stomp an unsaved edit elsewhere in the
list.

**The PATCH is a genuine partial update**: `is_closed` is always sent,
but `open_time`/`close_time` are only included when the day isn't
closed — closing a day never sends (and so never clears) its times, in
case it's reopened later with the same hours. Turning a closed day open
with no times filled in is **not** blocked client-side; it's sent as-is
so the backend's own merged-state check
(`openingHoursController.js`'s `assertConsistentHours`) is the one
thing enforcing the rule, and its exact message ("open_time and
close_time are required when is_closed is false") is surfaced verbatim
in that row's own error slot — `err.message` already carries it, since
the frontend `ApiError` reads straight from the `{ error }` shape every
controller in this codebase throws.

**No `useMutation`** for the per-row save, unlike the name/description
form and Categories above it — `saveDay` is a plain async function with
its own `savingDayId`/`dayErrors` state, same shape
`confirmDeleteCategory` (5.4) already uses for a single, independent
async action outside a `<form>` submit.

**No npm registry access this session** — verified by hand: full
brace/paren/bracket balance on `OwnerRestaurant.jsx` (clean), complete
`styles.*` class-name parity with `OwnerRestaurant.module.css` in both
directions (zero mismatches), and a scratch (not shipped) Python port
of the payload-construction + the backend's real `assertConsistentHours`
merged-state check, run against three cases: closing an already-open
day (times correctly omitted from the payload, no validation error),
reopening a closed day with no times filled in (correctly reproduces
the backend's 400), and reopening with both times filled in
(correctly succeeds). A real `npm install`/`npx eslint`/`npx vite
build` still need to confirm this task before it's considered fully
closed. **Task 5.5 is now fully complete, 5.5a + 5.5b.**

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.5a — Opening hours screen (read-only scaffold)

Task 5.5 was split into 5.5a (this task — fetch and render) and 5.5b
(wire editing/save). `OwnerRestaurant.jsx` gained an "Opening hours"
section below Categories: `useApiQuery` against the existing
`GET /api/opening-hours` (Task 1.16d), rendered as 7 rows sorted by
`day_of_week` (the backend's own `orderBy` already guarantees the
order) — day name (`docs/DB_SCHEMA.md`: `0=Sunday … 6=Saturday`), a
`ToggleSwitch` (Task 2.11 — this is that component's first real usage
outside `ComponentSandbox`) reflecting `is_closed`, and open/close
`FormField` `type="time"` inputs shown only when the day isn't closed.

**Every control renders `disabled`** — this is explicitly a read-only
scaffold, not a partial implementation of editing. `onChange` handlers
are no-ops; 5.5b replaces them with real state + a save path, following
the same fetch-then-edit/`useMutation` shape the Categories section
(5.4) already established.

**No pagination**: a restaurant always has exactly 7 rows
(`UNIQUE (restaurant_id, day_of_week)`), so this uses plain
`useApiQuery`, not `usePaginatedQuery` — same reasoning as the customer
Home screen's Categories chip row (Task 3.4).

**The backend's own known seeding gap surfaces here as a real, expected
empty state**: `openingHoursController.js`'s header comment already
flags that no task yet seeds the 7 rows on restaurant creation, so
`list` can legitimately return `[]`. Rendered as its own `EmptyState`
("No opening hours yet"), not folded into the generic connection-error
state, since retrying doesn't fix it.

**No npm registry access this session** — verified by hand:
brace/paren/bracket balance on `OwnerRestaurant.jsx` (clean), full
`styles.*` class-name parity between it and
`OwnerRestaurant.module.css` in both directions (zero mismatches), and
a scratch (not shipped) Python trace of the day-label/closed/time
rendering logic against a response shape matching
`openingHoursController.js`'s real `list` output. A real
`npm install`/`npx eslint`/`npx vite build` still need to confirm this
task before it's considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.4 — Categories CRUD screen

`OwnerRestaurant.jsx` gained a "Categories" section below the
name/description form: a `ListWithPagination` list plus an "Add
category" button, each row with Edit/Delete actions. Needed no new
backend — `/api/categories`' full CRUD already existed from Phase 1
(Task 1.16a), already tested (10 passing tests).

**First real use of `Modal` in this codebase**, for both of its two
named purposes at once: an add/edit form dialog (the footer's Save
button submits the body's `<form>` via the HTML `form` attribute, since
Modal's footer and body are separate DOM nodes) and a delete
confirmation dialog, as two separate `Modal` instances
(`categoryModal`/`categoryToDelete`) rather than one branching on mode.

**Categories get their own save/delete state**, deliberately not folded
into 5.2/5.3's shared `mutate`/`saveError`/`justSaved` — those describe
"the restaurant row was saved," and a category is a genuinely separate
sub-resource with its own lifecycle, unlike logo/cover/name/description
which really do all edit the same row.

**Layout call, not a reference-image requirement**: single-scroll, each
management area its own labeled `<section>`, chosen since nothing in
`docs/NATRA_MASTER_PROMPT.md` or the reference images dictates
single-scroll vs. sub-tabbed for the owner's Restaurant screen — see
`docs/PROJECT_STATUS.md`'s 5.4 entry for the full reasoning and the
"revisit if it gets unwieldy" flag for 5.5-5.8.

**A stale doc comment noticed, not fixed**: `ListWithPagination.jsx`'s
own header comment still cites task numbers ("6.4 restaurant
management") that don't match this task's actual number (5.4) or
anything else in current `docs/TASKS.md`. Flagged, not chased down as
part of a screen-building task.

**No npm registry access this session** — verified by hand: class-name
parity between `OwnerRestaurant.jsx` and `OwnerRestaurant.module.css`
(clean both directions across all classes now used), a brace/paren/
bracket balance pass, and every import (`ListWithPagination`/`Modal`
newly added) cross-checked against its actual export. A real `npm
install`/`npx eslint`/`npx vite build` still need to confirm this task
before it's considered fully closed.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.12b — Orders screen (`ListWithPagination`) wired to `GET /api/orders`

Replaces the plain static placeholder Task 5.1 left at `RoleShell`'s
(2.18) "Orders" tab (`/owner/orders`) with a real screen:
`pages/OwnerOrders/OwnerOrders.jsx` now fetches the caller's own
restaurant's orders via `usePaginatedQuery` (Task 3.1) against Task
5.12a's new `GET /api/orders`, and renders them through
`ListWithPagination` (Task 2.16) — same shape `OrderHistory.jsx` (3.18c)
already established for the customer-facing equivalent.

**Reshapes the response, doesn't fetch it raw**: `orderController.list`
(5.12a) returns `{ orders, meta }`; `fetchOrders` maps that to the
`{ rows, meta }` shape `usePaginatedQuery` expects, same "controller
names its own resource key, screen renames it back" pattern
`OwnerRestaurant.jsx`'s own `fetchPaymentMethods` already uses for
`paymentMethodController.js`'s `{ payment_methods, meta }`.

**No `{ auth: false }`** — the first owner-authenticated fetch on this
screen; `api.get`'s own default (`auth: true`) already attaches the
stored bearer token via `tokenStorage`.

**`noRestaurantYet` (403) handling** copies `OwnerRestaurant.jsx`'s own
`error instanceof ApiError && error.status === 403` check verbatim, for
the identical underlying cause (`attachOwnerRestaurant`, 1.15a, 403ing
an owner with no restaurant row yet) — reachable in practice only via a
direct URL visit, since every real nav path to this screen assumes a
restaurant already exists, same assumption `OwnerRestaurant.jsx` itself
makes.

**Each row** shows `order_code`, `customer_name`, `status` (via
`StatusBadge`, reusing `OrderHistory.jsx`'s local `ORDER_STATUS_TONE`
map rather than widening `StatusBadge`'s own shared one — no reference
image shows these statuses, same reasoning that file's own comment
already gives), `created_at` (formatted the same way `OrderHistory.jsx`
does), and `total`. Rows are plain non-interactive cards — no per-item
breakdown (`GET /api/orders` doesn't join `order_items`) and no
tap-through to a detail view, since that's explicitly Task 5.13's job,
not this one's; flagged in the component's own doc comment rather than
guessed at.

**No status filter/tabs** — deliberately out of scope, same call
`orderController.list`'s (5.12a) own comment already makes; worth
reconsidering once Task 5.14 (Accept/Reject) gives an owner a real
reason to want just the actionable orders in view.

**No npm registry access this session** (`npm install` 403s against the
registry, same recurring gap as most sessions on this project;
`node_modules`/`react-router-dom`/`jsdom` all absent) — verified by
hand: full two-way class-name parity between `OwnerOrders.jsx` and
`OwnerOrders.module.css` (brace/paren/bracket balance also checked,
clean), and every import (`ListWithPagination`, `EmptyState`,
`StatusBadge`, `RoleShell`, `usePaginatedQuery`, `api`/`ApiError`)
cross-checked against its actual export. A real `npm install`/
`npx eslint`/`npx vite build` still need to confirm this task before
it's considered fully closed.

`docs/TASKS.md`'s 5.12b checkbox ticked — **Task 5.12 is now fully
complete, 5.12a/5.12b**.

**Note found at the start of the 5.14 session**: Task 5.13
(`OrderDetail.jsx`, order detail view) had already been built and
checked off in `docs/TASKS.md`, confirmed against the actual code, but
never got its own entry in this file — the same "write-up went
missing" gap `docs/PROJECT_STATUS.md`'s own 3.14/3.15 entry already
documents happening once before on this project. Not backfilled here;
picked up directly at 5.14b instead.

## Task 5.14b — Orders: Accept/Reject actions on `OrderDetail.jsx`

The frontend half of Task 5.14 — 5.14a (backend) added
`PATCH /api/orders/:id/status`, wired through `statusTransition` (Task
1.7) via a new `services/updateOrderStatus.js`; see
`backend/README.md`'s own "Task 5.14a" entry for that side.

**Buttons only render for `data.order.status === 'New'`** —
`updateOrderStatus`'s own transitions map would 409 an Accept/Reject
attempt from any other status anyway, so there's no reason to show a
button whose only possible outcome is that error. An `Accepted`/
`Completed`/`Rejected` order shows no action row at all here (Complete,
Task 5.15's job, is the only next action a real `Accepted` order has).

**Wired through a new `useMutation(patchOrderStatus)` instance** — same
"fire on click, `refetch()` on success, leave the error in a banner on
failure, no optimistic status flip" shape `OwnerRestaurant.jsx`'s own
`handleOpenToggle` (Task 5.8) already established for its Open/Closed
toggle: a failed PATCH leaves `StatusBadge` showing the real last-known
status rather than one that never actually saved. `refetch` is this
screen's own pre-existing `useApiQuery` refetch (Task 5.13), not a new
fetch function — a successful Accept/Reject just re-pulls the same
`GET /api/orders/:id` this screen already renders from.

**`patchOrderStatus(id, status)` takes no `AbortSignal`** — same
reasoning every other `useMutation`-backed request function in this
codebase already documents (`updateMyRestaurant`, `saveFood`, etc.): a
button press isn't something that naturally races a superseded request
the way a `useApiQuery`/`usePaginatedQuery` fetch does.

New `.actionRow`/`.actionButton`/`.acceptButton`/`.rejectButton`/
`.actionError` classes in `OrderDetail.module.css`. `.acceptButton`
reuses `.retryButton`'s own `--color-primary` treatment; `.rejectButton`
reuses the same `--color-error` `.dangerButton` treatment
`OwnerMenu.jsx`'s/`OwnerRestaurant.jsx`'s own delete-confirmation
buttons already use for a destructive action (a reject is equally
final/one-way for the order) — both via `composes: actionButton` (the
same CSS-modules `composes:` pattern those two files' own
`linkButtonDanger` classes already use), rather than restating the
shared button-reset properties a third time.

**No new frontend test file** — this codebase has no page-level
`.test.jsx` files anywhere yet (frontend correctness has been
`tsc`/`eslint`/`vite build`-verified only, since Task 2.10's sandbox
network loss), so this follows that same existing pattern rather than
introducing a new one unilaterally for just this screen.

**No npm registry access this session** (`npm install` 403s against the
registry, same recurring gap as most sessions on this project) —
verified by hand: the new import (`useMutation`, already exported from
`hooks/index.js` since Task 3.1) resolves against its actual export and
documented `{ mutate, data, error, loading, reset }` shape, the new
conditional JSX block's braces/parens balance, and full two-way
class-name parity between `OrderDetail.jsx`'s new classes and the new
CSS block in `OrderDetail.module.css`. A real `npm install`/
`npx eslint`/`npx vite build` still need to confirm this task before
it's considered fully closed.

`docs/TASKS.md`'s 5.14b checkbox ticked — **Task 5.14 is now fully
complete, 5.14a/5.14b**.

See `/docs/PROJECT_STATUS.md` and `/docs/TASKS.md`.

## Task 5.17 — Dashboard: new orders count + order counts summary

`OwnerDashboard.jsx` (Task 5.1's placeholder) now fetches real order
counts via `useApiQuery` against the new `GET /api/orders/counts` (Task
5.17, backend), replacing the static "lands here in a later task" copy.
Renders a headline "N new order(s)" count plus the full 4-status
breakdown (New/Accepted/Completed/Rejected) via `StatusBadge` + a
duplicated `ORDER_STATUS_TONE` map — same "not worth a cross-screen
dependency for one small object" duplication every prior order-status
screen (`OrderHistory`/`OrderDetail`/`TrackOrder`/`OwnerOrders`) already
uses for its own copy — plus a "View orders" link to `/owner/orders`.

**`noRestaurantYet` (403) handling** mirrors `OwnerOrders.jsx`'s own
`error instanceof ApiError && error.status === 403` check: for a
brand-new owner with no `restaurants` row yet (the standing gap this
project's `docs/PROJECT_STATUS.md` already flags at Task 4.6), the whole
Orders section is simply omitted rather than shown as an error — the
"Get your restaurant Live" card underneath it already tells that owner
what to do next. A genuine (non-403) fetch failure gets its own small
inline retry instead, same "don't let one section's error block the
rest of the page" call `Home.jsx`'s Categories chip row already made.

**No npm registry access this session** (same standing gap as most
sessions on this project) — verified by hand: full two-way `styles.*`
class-name parity between `OwnerDashboard.jsx` and its `.module.css`
(zero mismatches either direction) and a brace/paren/bracket balance
check on the changed file. A real `npm install`/`npx eslint`/
`npx vite build` still needs to confirm this before it's considered
fully closed.

`docs/TASKS.md`'s 5.17 checkbox ticked.

## Task 5.18b — Dashboard: sales summary widget (frontend)

The frontend half of Task 5.18 — 5.18a (backend) added
`GET /api/orders/sales-summary`, a hand-written raw-SQL read via a new
`services/salesSummary.js`; see `backend/README.md`'s own "Task 5.18a"
entry for that side.

`OwnerDashboard.jsx` gains a second, independent `useApiQuery` call
(`fetchSalesSummary`, against the new endpoint) alongside 5.17's own
`fetchOrderCounts` one — a separate fetch rather than folding this into
the counts response, so this section's loading/error/`noRestaurantYet`
states can't get tangled with the Orders section's. New "Sales" card
(same `.card`/`.cardTitle`/`.cardBody` shell 5.17's Orders card already
established) shows today's and all-time completed-order revenue plus a
"N completed orders" line, `formatPrice`-formatted the same "250 ETB" /
"199.50 ETB" way `OrderDetail.jsx`/`OrderHistory.jsx`/`OwnerOrders.jsx`
already do — duplicated into this file rather than imported, same
"not worth a cross-screen dependency for one small function" reasoning
`ORDER_STATUS_TONE` above already uses for itself.

**`salesNoRestaurantYet` (403) handling** is its own separate flag, not
a reuse of the Orders card's `noRestaurantYet` — both ultimately trip on
the same `requireRestaurantScope` gap (Task 4.6's standing "no
`restaurants` row yet" case), but computed independently so a future
divergence between the two endpoints' scoping wouldn't leave one
section silently trusting the other's result. A genuine (non-403) fetch
failure gets the same small inline retry the Orders card's own
`countsError`/`retryButtonInline` classes already provide (reused
as-is, not duplicated, since the visual treatment is identical).

Updated the page's subheading — it used to read "A sales summary and
quick actions land here in a later task"; now that the sales summary is
built, it just says "Quick actions land here in a later task" (Task
5.19, still open).

New `.salesSummary`/`.salesRow`/`.salesLabel`/`.salesAmount`/
`.salesMeta` classes in `OwnerDashboard.module.css` — a lighter-weight
label/value row than the Orders card's `.statusSummaryRow` (no
`StatusBadge` here, just a label and an amount), with `.salesAmount`
sized at `--font-size-title` so the two dollar figures read as the
card's own visual anchor the way `.newOrdersCount` does for the Orders
card, without competing with it at the full `--font-size-heading` size.

**No new frontend test file** — same standing "no page-level `.test.jsx`
files anywhere yet" pattern `5.14b`'s own entry above already documents,
followed rather than introduced unilaterally for just this screen.

**No npm registry access this session** (`npm install` → 403, same
recurring gap as most sessions on this project) — verified by hand:
full two-way `styles.*` class-name parity between `OwnerDashboard.jsx`
and its `.module.css` (zero mismatches either direction, confirmed via
a small Python script diffing both class-name sets) and a brace/paren/
bracket balance check on the changed file. A real `npm install`/
`npx eslint`/`npx vite build` still needs to confirm this before it's
considered fully closed.

`docs/TASKS.md`'s 5.18b checkbox ticked — **parent 5.18 is now fully
complete, 5.18a + 5.18b.**

## Task 5.19 — Dashboard: quick actions (Add Food, Open/Close toggle, View Orders shortcuts)

No backend work — all three actions reuse endpoints that already exist
(`GET`/`PATCH /api/restaurants/me` from Task 5.8, `POST
/api/uploads/food-photo` + `POST /api/foods` from Task 5.10, `GET
/api/orders` from Task 5.12a). Per
`docs/NATRA_MASTER_PROMPT.md`'s own "Quick actions: Add Food,
Open/Close Restaurant, View Orders" list, `OwnerDashboard.jsx` gains a
third card, "Quick actions", below the existing Orders (5.17) and
Sales (5.18b) ones.

Add Food and View Orders are plain `Link`s to already-built screens —
`AddFood.jsx` (5.10) at `/owner/restaurant/menu/new`, `OwnerOrders.jsx`
(5.12b) at `/owner/orders` — nothing to wire beyond the link itself.
"View orders" now appears twice on this page (once inside the Orders
card from 5.17, once here) — kept as two separate links rather than
deduplicated, since the master prompt names it as one of exactly three
quick actions and this card should read as that complete set on its
own, without depending on a reader also noticing it repeats a link
from a different card above.

Open/Close is the only genuinely new piece of state: a third,
independent `useApiQuery`/`useMutation` pair (`fetchMyRestaurant`/
`updateMyRestaurant`, duplicated from `OwnerRestaurant.jsx`'s own copy
rather than shared across page files, same convention this file's
`fetchOrderCounts`/`fetchSalesSummary`/`formatPrice` already follow),
reusing `OwnerRestaurant.jsx`'s own `handleOpenToggle` (Task 5.8)
shape verbatim: `ToggleSwitch` flips → `mutate({ is_open: checked })`
fires immediately (no confirmation) → `refetch()` on success, leave
the switch showing the last-fetched value on failure rather than an
optimistic flip that might not have saved. A failed toggle shows its
own small inline `.quickActionError` message (same `--color-error`/
`--font-size-caption` treatment `OrderDetail.jsx`'s own `.actionError`
already uses).

**Gated behind the same 403 (`noRestaurantYet`) check** as the Orders
and Sales cards above — computed independently, as its own
`quickActionsNoRestaurantYet` flag, same "don't let a future scoping
divergence between endpoints leave one section trusting another's
result" reasoning 5.18b's own `salesNoRestaurantYet` entry already
gives for itself. All three quick actions need a `restaurants` row to
act on (Task 4.6's standing "no restaurant-creation endpoint yet"
gap), so the whole card is hidden rather than shown half-broken; the
"Get your restaurant Live" card already tells that owner what to do
next.

New `.openToggleRow`/`.openToggleStatus`/`.openToggleHint`/
`.quickActionError` classes in `OwnerDashboard.module.css` — the first
three are a lighter version of `OwnerRestaurant.module.css`'s own
`.openToggleRow` (Task 5.8), with the border/background dropped since
this row already sits inside `.card`, which provides that chrome
itself; duplicating a shared component's layout classes across page
files rather than sharing them is the same call this file already
makes everywhere else (`.card`/`.cardTitle`/`.cardBody` originated
here rather than in a shared layout file too).

Removed the subheading's stale "Quick actions land here in a later
task" line (already trimmed down from "A sales summary and quick
actions land here in a later task" at 5.18b) — replaced with "Here's
what's happening with your restaurant today," since there's no
remaining not-yet-built section left for it to point at.

**No new frontend test file** — same standing "no page-level
`.test.jsx` files anywhere yet" pattern this file's own 5.14b/5.18b
entries already document.

**No npm registry access this session** (`npm install` → 403 on
`yocto-queue`, same recurring gap most sessions on this project hit) —
verified by hand instead: a brace/paren/bracket balance check on the
changed file (100/100 `{}`, 88/88 `()`, 7/7 `[]`) and a full two-way
`styles.*` class-name diff between `OwnerDashboard.jsx` and its
`.module.css` (zero mismatches either direction, confirmed via a small
Python script, same approach 5.18b's own entry used). A real `npm
install`/`npx eslint`/`npx vite build` still needs to confirm this
before it's considered fully closed.

`docs/TASKS.md`'s 5.19 checkbox ticked.

## Task 5.20a — Order notifications: new-order detection (polling)

The first of three lettered pieces behind Task 5.20 ("browser
notification + sound on new order") — see `docs/TASKS.md`'s own 5.20a/
5.20b/5.20c breakdown for why it was split at all: no polling
infrastructure existed anywhere in this codebase to build on, and
detection/notification/sound are three genuinely separable concerns.
This task is detection only — no `Notification` call and no sound yet
(5.20b/5.20c).

New `frontend/src/hooks/useNewOrderDetection.js`, exported alongside
this codebase's other hooks (`hooks/index.js`). No new backend
endpoint: it polls `GET /api/orders?page=1` (Task 5.12a, already
newest-first by `id`) on a 20s interval (a judgment call, same
"reasonable default, not a measured value" reasoning
`useDebouncedValue`'s own 300ms already documents for itself), comparing
each poll's top rows against a `lastSeenId` ref rather than adding a
`since_id` backend filter — `paginate.js`'s own `DEFAULT_LIMIT` (20) is
plenty of headroom for more than one new order landing within a single
interval at any realistic single-restaurant volume. For each row with
`id > lastSeenId`, a `GET /api/orders/:id` (Task 5.13) fetch fills in
`items.length`/`customer_location_text`/`total` — the one thing the
list response doesn't already carry, and exactly what Task 5.20b's
notification message will need.

**First poll seeds instead of reporting** — the current newest `id` is
recorded as the baseline with no callback fired, otherwise every
pre-existing `New` order would look like a fresh arrival the instant
the dashboard loads. `enabled` flipping to `false` (this codebase's
`noRestaurantYet`-style 403 gate) resets that seed rather than just
pausing — an owner going Live mid-session shouldn't have every order
placed while gated off reported as "new" the moment polling resumes.
An in-flight guard skips a tick if the previous poll's requests are
still outstanding, and cleanup aborts any in-flight request when
`enabled` flips off or the component unmounts — same
`AbortController`/`mountedRef` shape `useApiQuery` (Task 3.1) already
established, applied to a `setInterval` loop instead of a single fetch.

`OwnerDashboard.jsx` wires it in: `enabled: !noRestaurantYet` (the same
flag the Orders card already computes from `fetchOrderCounts`'s own
403), and an `onNewOrders` handler (`handleNewOrders`) that does two
things for now — `refetch()`/`refetchSales()` so the Orders/Sales cards
reflect a just-arrived order immediately rather than waiting on their
own one-shot fetch-on-mount (a real, in-scope improvement: those two
cards had no periodic refresh of their own before this task), and a
`console.info` line per detected order as an explicit, temporary
placeholder for exactly where 5.20b's `Notification` and 5.20c's sound
will hook in next.

**No new frontend test file** — same standing "no page-level
`.test.jsx` files anywhere yet" pattern this file's own 5.14b/5.18b/
5.19 entries already document; this hook has no test file either, for
the same reason.

**No npm registry access this session** (`npm install` → 403, same
recurring gap) — verified by hand: brace/paren/bracket balance on both
changed/new files (clean) and the same two-way `styles.*` class-name
diff against `OwnerDashboard.module.css` 5.18b/5.19 already used
(unchanged — this task added no new CSS classes). Logic was traced by
hand against `backend/src/controllers/orderController.js`'s `list`/
`getOne` response shapes (`{ orders, meta }` / `{ order, items,
payment_method }`) to confirm the field names this hook reads actually
exist. A real `npm install`/`npx eslint`/`npx vite build`, and ideally
an actual browser session watching the poll fire against a running
backend, still need to confirm this before it's considered fully
closed.

`docs/TASKS.md`'s 5.20a checkbox ticked.

## Task 5.20b — Order notifications: browser Notification

Fills in the `console.info` placeholder Task 5.20a's own `handleNewOrders`
left behind. `OwnerDashboard.jsx` gains:

- A new "Order notifications" card, gated on the same `noRestaurantYet`
  flag `useNewOrderDetection`'s own `enabled` prop already uses (Task
  5.20a) — there's no reason to offer this to an owner the polling isn't
  even running for yet — and hidden entirely (not just disabled) when
  `Notification` isn't present in the runtime at all, per this task's own
  "unavailable is a no-op, not an error" line in `docs/TASKS.md`.
- `notificationPermission` state seeded from the browser's real current
  `Notification.permission` (not assumed `'default'`), so a returning
  owner who already granted/denied it doesn't see a stale "ask again"
  button.
- `handleEnableNotifications` — the explicit UI affordance the task
  requires: `Notification.requestPermission()` is only ever called from
  this real click handler, never on mount, since browsers silently ignore
  a permission request that didn't originate from a user gesture.
- `showOrderNotification(order, items)` — fires one native notification
  per order Task 5.20a's `handleNewOrders` reports, titled with
  `docs/NATRA_MASTER_PROMPT.md`'s own message template verbatim ("New
  order from <location> — N items — <total> ETB", same singular/plural
  item-count handling 5.20a's own placeholder already used), auto-closed
  after `NOTIFICATION_AUTO_CLOSE_MS` (6s — a judgment call, same
  "reasonable default" reasoning 5.20a's own 20s poll interval already
  documents for itself) per the master prompt's "disappears after a few
  seconds" line. Reads `Notification.permission` live rather than
  trusting the React state value, so a permission changed outside this
  app (the browser's own site settings) is respected on the very next
  detected order, not just after a re-render. A denied/unavailable
  permission is a silent no-op — Task 5.20c's sound is independent of
  this and will still fire either way once it's built.

No new CSS — reuses `.card`/`.cardTitle`/`.cardBody`/`.actionRow`/
`.secondaryButton`, already defined in `OwnerDashboard.module.css`;
confirmed via the same two-way `styles.*` class-name parity check prior
entries in this file already use (zero mismatches either direction).
Brace/paren/bracket balance on the changed file also checked clean.

**Verification (deferred at the end of the prior session) is now done.**
Same standing constraint as every task since roughly Task 3.13 — no npm
registry access this session either (`npm install` → 403), so this
isn't a real Jest/RTL run. Went one step further than a plain hand-trace
where it actually mattered, since 5.20b is the first task in this file
whose entire job is a browser API this project has no existing fake for
(unlike `fetch`/`localStorage`, which `client.js`/`tokenStorage.js`
already abstract behind something mockable):

- **A scratch-only (not shipped) Node harness** extracted the real,
  unmodified module-level functions from `OwnerDashboard.jsx` — everything
  above the component itself (`getNotificationPermission`,
  `buildOrderNotificationMessage`, `showOrderNotification`,
  `NOTIFICATION_AUTO_CLOSE_MS`) needs no JSX/React runtime, so this ran
  the actual file contents (via `vm.createContext`/`vm.runInContext`, not
  a re-typed copy) against a hand-rolled `Notification` global —
  the same "stub the low-level dependency this module actually touches"
  approach `orderCounts.test.js`/`liveCategories.test.js` already use for
  `withConnection`, applied here to a browser global instead of a DB
  call. 13 checks, all passing: `getNotificationPermission()` correctly
  reports `'unsupported'` with no `Notification` global present and
  otherwise reads `Notification.permission` live; `showOrderNotification`
  is a silent no-op (no throw) with `Notification` absent entirely, and
  constructs nothing for both `'default'` and `'denied'`; when `'granted'`,
  it constructs exactly one `Notification` with the master-prompt's
  message template verbatim (plural and singular item counts both
  checked, including that a 1-item order reads "1 item" not "1 items");
  the close is scheduled via `setTimeout` at exactly
  `NOTIFICATION_AUTO_CLOSE_MS` (6000) and the notification is actually
  `.close()`d once that timeout fires (not just that a timer was
  scheduled); `formatPrice`'s existing whole-number-vs-decimal behavior
  carries through correctly into the notification title for both a round
  total and a fractional one; and a permission value changed mid-session
  (simulating the browser's own site-settings UI, not this app) is picked
  up on the very next call with no re-render/re-mount needed — confirming
  `showOrderNotification`'s own header comment claim ("reads
  `Notification.permission` live rather than trusting a possibly-stale
  React state value") is actually true of the shipped code, not just
  asserted in a comment.
- **The component-level wiring** (`handleEnableNotifications`, the
  `notificationPermission` state seeded from `getNotificationPermission()`,
  and the card's three-way `granted`/`denied`/else render branch) can't
  run through this same harness — it's JSX plus `useState`, and this
  sandbox still has no bundler/jsdom available to mount it for real (no
  cached `esbuild`/`jsdom` left over from an earlier session this time,
  unlike a few Phase 2/3 verification passes that got lucky that way).
  Traced by hand instead: `handleEnableNotifications` only ever calls
  `Notification.requestPermission()` from the `onClick` on the "Enable
  notifications" button (never on mount/effect), guarded by the same
  `typeof Notification === 'undefined'` check the rest of this file uses,
  satisfying the task's own "must come from a real click" requirement;
  the outer card is hidden entirely (not just its button disabled) when
  `notificationPermission === NOTIFICATION_UNSUPPORTED`, matching "hidden
  entirely for a browser with no `Notification` API" in this file's own
  header comment; and the three render branches (`granted` → status text
  only, `denied` → "blocked, check your browser settings" text only,
  anything else → prompt text + the Enable button) are mutually exclusive
  and exhaustive over `Notification.permission`'s only three real values.
- Full two-way `styles.*` class-name parity (already noted above) and a
  brace/paren/bracket balance pass on `OwnerDashboard.jsx` were re-run
  this session as part of closing this out, not just carried over from
  the prior session's claim — both still clean.

Still outstanding, same as every prior task relying on browser-only APIs
in this codebase: a real `npm install`/`npx eslint`/`npx vite build`, and
ideally an actual browser session granting permission and confirming a
real `Notification` appears and auto-closes on screen — none of that is
possible from this sandbox regardless of session. `docs/TASKS.md`'s 5.20b
checkbox stays ticked, now on the basis of the above rather than a
deferral.

## Task 5.20c — Order notifications: synthesized sound

The last of Task 5.20's three lettered pieces. Fills in the second half
of `handleNewOrders` — 5.20a's original `console.info` placeholder was
already replaced by 5.20b's `showOrderNotification`; this adds the sound
alongside it, independent of that function's `Notification` permission
gate, exactly per this task's own line in `docs/TASKS.md` ("independent
of 5.20b's permission state").

`OwnerDashboard.jsx` gains:

- `getAudioContextClass()` / `getSharedAudioContext()` — resolves
  `window.AudioContext`, falling back to the legacy `window.webkitAudioContext`
  name for older Safari (the one prefixed browser global this codebase
  tolerates, same reasoning it never needed a `fetch`/`localStorage`
  polyfill: the unprefixed name covers the real-world installed base
  everywhere else). A single `AudioContext` instance is created lazily
  and reused across every call rather than a fresh one per beep — both
  because browsers cap how many can be live at once, and because
  reusing one instance means only the very first beep after page load
  risks being silently suppressed by the browser's autoplay policy, not
  every one thereafter.
- `playNewOrderSound()` — a short synthesized tone (`OscillatorNode`,
  sine wave, 880Hz/A5, 0.3s, gain 0.15 — quiet by design, a notification
  chime an owner hears repeatedly all day, not an alarm) routed
  oscillator → gain → `context.destination`. A `suspended` context (the
  autoplay-policy state a freshly-created `AudioContext` starts in until
  a user gesture unlocks it) is `resume()`d first, with the tone emitted
  once that resolves; a missing/unsupported `AudioContext` entirely is a
  silent no-op, same "unavailable is a no-op, not an error" precedent
  5.20b's own `Notification` handling already set in this file for a
  different browser API.
- `handleNewOrders` calls `playNewOrderSound()` once per detection batch,
  **not once per order** inside its existing per-order `forEach` (which
  still separately calls `showOrderNotification` per order, unchanged) —
  several orders landing within one 20s poll interval should announce
  themselves with a single beep, not several overlapping ones fired back
  to back. Neither the reference UI nor `docs/NATRA_MASTER_PROMPT.md`
  calls for anything more granular than "a sound plays when a new order
  arrives," so this is the simpler reading of that line, not a scope cut.

**No UI of its own** — nothing to opt into/out of in-app beyond the
browser's own audio/autoplay controls, which this function already
defers to (via the `resume()` branch above) rather than fighting. No new
CSS classes; confirmed via the same two-way `styles.*` class-name parity
check every prior task in this file already uses (unchanged — zero
mismatches either direction) and a brace/paren/bracket balance pass on
the changed file (clean).

**Verified the same way this session's 5.20b write-up was** — no npm
registry access (`npm install` → 403, same recurring gap), so this is a
scratch Node harness, not a real browser/Jest run: extracted the real,
unmodified module-level functions from `OwnerDashboard.jsx` (everything
above the component itself, including this task's own additions, needs
no JSX/React runtime) and ran them via `vm.createContext`/
`vm.runInContext` against a hand-rolled `window`/`AudioContext`/
`OscillatorNode`/`GainNode` stub that records every node created,
connected, started, and stopped. 11 checks, all passing:
`playNewOrderSound` is a silent no-op with no `AudioContext` at all and
with no `window` global at all (this project's own scratch harnesses,
including this one's sibling 5.20b script, don't stub a `window` either);
a beep is emitted immediately when the context is already `running`,
correctly as a sine wave at 880Hz with gain 0.15 (not full volume), wired
oscillator → gain → `destination`, with `stop()` scheduled at exactly
`currentTime + 0.3`s; a single shared `AudioContext` is reused (not
recreated) across repeated calls; a `suspended` context is `resume()`d
and the tone still plays once that resolves; the legacy
`window.webkitAudioContext` name is used correctly when the unprefixed
one is absent; and two separate calls (simulating two separate detection
batches) each get their own independent oscillator rather than reusing
one that's already been started and stopped. Also re-ran the existing
5.20b harness against the edited file as a regression check — all 13 of
those checks still pass unchanged, confirming this task's edits didn't
disturb the notification logic sitting right above it in the same file.

Still outstanding, same as 5.20a/5.20b: a real `npm install`/`npx eslint`/
`npx vite build`, and ideally an actual browser session confirming a real
audible beep plays (and that the autoplay-suspended-context path behaves
the same in a real browser as the stubbed one above assumes) — none of
that is possible from this sandbox. `docs/TASKS.md`'s 5.20c checkbox
ticked — **Task 5.20 is now fully complete, 5.20a + 5.20b + 5.20c.**

## Task 5.21 — Order notifications: dashboard badge/count persists after browser notification disappears

`Notification.close()` (Task 5.20b) already auto-dismisses itself after
`NOTIFICATION_AUTO_CLOSE_MS`, and the beep (5.20c) is a one-off — neither
leaves anything behind for an owner who wasn't looking at the exact
moment either fired. This task adds the thing that does stick around.

- New `src/hooks/useOwnerOrderBadge.js`: a small `localStorage`-backed
  unseen-new-order counter (`natra.ownerOrderBadgeCount`, prefixed the
  same way `src/api/tokenStorage.js`'s `natra.authToken` already is —
  `localStorage`, not `useOrderCart.js`'s sessionStorage, since this
  isn't tied to one order-in-progress session and shouldn't reset when a
  tab closes). Exports `addToOwnerOrderBadge(n)`, `clearOwnerOrderBadge()`,
  and `useOwnerOrderBadgeCount()` — the last a small hook that seeds from
  the persisted value and then stays live via both a custom same-tab
  `window` event (the native `storage` event never fires in the tab that
  made the write) and the real cross-tab `storage` event, so every
  mounted `RoleShell` reflects the same count regardless of which
  tab/screen detected or cleared it.
- `OwnerDashboard.jsx`'s `handleNewOrders` (Task 5.20a) now also calls
  `addToOwnerOrderBadge(newOrders.length)` alongside the existing
  notification/sound calls — no second polling loop, this rides the same
  detection batch 5.20b/5.20c already react to.
- `RoleShell.jsx`'s bottom-nav render (Task 2.18's owner variant) reads
  `useOwnerOrderBadgeCount()` and overlays a small numbered badge on the
  "Orders" tab's icon whenever the count is above zero — visible from
  *any* owner screen this shell wraps (Restaurant, Account, ...), not
  just the Dashboard where it's detected. Capped at "99+" display; an
  `aria-hidden` bare-number badge plus a visually-hidden
  `(N new orders)` suffix folded into the tab's own accessible label, so
  a screen reader announces the count as part of the link rather than
  reading a lone digit. Customer/admin variants are unaffected — the
  hook is called unconditionally (hooks can't be conditional) but only
  ever rendered for `role === 'owner'`.
- `OwnerOrders.jsx` (Task 5.12b) calls `clearOwnerOrderBadge()` in a
  mount-only `useEffect` — landing on the real orders list is what
  "seen" means here, same all-or-nothing semantics a phone's own
  per-app badge uses (opening the app clears it, no per-row read/unread
  tracking), which fits this app's flat order list with no such concept
  anywhere else in the schema.

**Verified for real** — this session had npm registry access. Ran the
actual `npm install`, `npm run lint` (clean), and `npm run build`
(`vite build`, 159 modules — up from 157, the new hook file). Beyond
that, since this is genuinely new interactive/cross-component state (not
just markup), wrote a scratch (not shipped) verification script:
esbuild-bundled the real, unmodified `useOwnerOrderBadge.js` against a
real jsdom `window`/`localStorage`, then mounted a small test component
calling `useOwnerOrderBadgeCount()` via `react-dom/client` + `act()` to
confirm the whole loop end-to-end — 8 checks, all passing: starts unset;
`addToOwnerOrderBadge` persists and accumulates correctly (2, then +3 →
5); `clearOwnerOrderBadge` resets to 0; a live-mounted hook instance
reflects an update the instant `addToOwnerOrderBadge`/
`clearOwnerOrderBadge` are called from outside the component (the
same-tab custom-event path, not just the initial read); and a
non-positive `n` passed to `addToOwnerOrderBadge` is correctly a no-op.
Scratch script/bundle and the `jsdom`/`esbuild`/`react-dom` devDependencies
used only for this (installed `--no-save`) were removed afterward;
`node_modules`/`dist` removed before packaging, same as every prior
frontend task. `docs/TASKS.md`'s 5.21 checkbox ticked.

## Task 5.22 — Account tab: owner profile/password settings

`OwnerAccount.jsx` (previously a placeholder since Task 5.1) is now
real — the last piece of Phase 5's four-tab owner shell, landing after
Dashboard, Orders, and Restaurant all already shipped their content.
`docs/NATRA_MASTER_PROMPT.md`'s account-fields list (full name, phone,
email, password) is exactly this screen's scope, split into two
independent forms:

- **Profile** — `full_name`/`email`/`phone`, the same fetch-then-edit
  shape `OwnerRestaurant.jsx` (5.2) established first: a `GET
  /api/auth/me` call via `useApiQuery`, seeded into local `values`
  exactly once via a `seededRef` (so a successful save's own `refetch()`
  can't overwrite an in-progress edit toward the *next* save), edited
  through the usual `FormField` + `touched`/`error` pattern, saved via a
  dedicated `useMutation(updateProfile)` hitting the new `PATCH
  /api/auth/me` (backend/README.md's own 5.22 entry). A `409` (email
  already taken by a different account) is attached to the email
  `FormField` specifically, not a form-level banner — unlike the
  password form below, the conflict here names a specific field.
- **Password** — `current_password`/`new_password`/`confirm_password`
  (the confirm field is client-side-only, never sent — the backend only
  ever sees `current_password`/`new_password`), a separate, always-blank
  form with its own `useMutation(changePassword)` hitting the new
  `PATCH /api/auth/me/password`. A `401` (wrong current password) is
  shown as one form-level error, matching the backend's own plainer
  `WRONG_CURRENT_PASSWORD_MESSAGE` reasoning — no email-enumeration
  concern here since the caller is already authenticated as this exact
  account. On success, the form is explicitly reset back to blank
  (`EMPTY_PASSWORD_VALUES`) rather than staying populated with a
  password that's no longer current.

Two independent forms with two independent `useMutation`s (not one
shared save state) so a failed password change can't blank out an
in-progress profile edit sitting in the other form, or vice versa — same
"one status area per actually-related field group" reasoning
`OwnerRestaurant.jsx`'s own header comment already gives for keeping its
own several save states separate.

**Log out** — the first logout affordance anywhere in this codebase.
`src/api/tokenStorage.js`'s `clear()` has had no caller since Task 3.1
shipped it, and nothing in `docs/TASKS.md` names a dedicated logout
task; this screen is the only sensible home for one, since an owner has
to go *somewhere* to end their session and there's no other
settings/menu screen anywhere in the owner app. Clears the stored token
(`tokenStorage.clear()`) and the per-device new-order badge count
(`clearOwnerOrderBadge()`, Task 5.21) before navigating to
`/owner/login` — clearing the badge too so a stale unread count doesn't
carry over into whichever owner logs in next on the same device. No
confirmation dialog: unlike a category delete (`OwnerRestaurant.jsx`'s
confirm-`Modal` use), logging out loses nothing — the token is just a
bearer credential, not owner data.

No new components; `FormField`/`EmptyState`/`RoleShell` all reused
as-is. `OwnerAccount.module.css` follows the same `.page`/`.section`/
`.sectionHeading`/`.form`/`.formError`/`.successBanner`/`.submitButton`
class shapes `OwnerRestaurant.module.css` already established, plus one
new `.logoutButton` (bordered, `--color-error`, matching
`OwnerLogin.module.css`'s `.linkButton`-style "secondary action" weight
rather than the primary `.submitButton` treatment).

**No npm registry access this session** (`npm install` → 403, same
recurring gap) — so no real `npm run lint`/`npm run build` was possible.
Verified by hand instead: a brace/paren balance pass on the new/changed
files (clean), a full line-by-line re-read of the returned JSX tree
confirming every opened tag/conditional branch closes correctly (4
`<button>` opens / 4 `</button>` closes, matching `<FormField>`/
`<section>`/`<form>` counts, etc.), and a class-name parity check
between `OwnerAccount.jsx`'s `styles.*` references and
`OwnerAccount.module.css`'s definitions (every referenced class is
defined; no unused leftover classes from the old placeholder file). The
backend half (`PATCH /api/auth/me`/`PATCH /api/auth/me/password`) has
its own 21-check scratch-harness verification — see
`backend/README.md`'s own 5.22 entry — but nothing this session actually
exercised the two together through a real browser/dev server. A real
`npm install`/`npm run lint`/`npm run build`, and ideally a manual
click-through (edit profile, trigger both the email-conflict and
validation-error paths, change password and confirm re-login with the
new one, log out and confirm landing back on `/owner/login` with the
token actually cleared), still needs to confirm this before it's
considered fully closed.

`docs/TASKS.md`'s 5.22 checkbox ticked — **Phase 5 is now fully complete,
5.1–5.22.**

## Task 6.1 — Admin login screen wired to auth

`frontend/src/pages/AdminLogin/AdminLogin.jsx` is a new screen, the
admin counterpart to `OwnerLogin.jsx` (Task 4.2) — same form shape,
same `useMutation`-wrapped call to `POST /api/auth/login` (Task 1.13),
same generic "Invalid email or password." on a real `401`. That
endpoint is role-agnostic by design (`authController.js`'s
`loginSchema` takes only email/password; `signToken` embeds whatever
`role` the matched row has), so no backend change was needed for this
task.

The one real difference from `OwnerLogin.jsx`: after a *successful*
login, this screen checks `data.user.role === 'admin'` before doing
anything else. A real account was matched and the password verified,
so a wrong-role result is shown as its own message ("This account is
not an admin account.") rather than the shared invalid-credentials
copy, and — the part that actually matters — the token is never handed
to `tokenStorage` in that case. Nothing under `/admin/*` enforces
server-side role authorization yet (Phase 6's backend routes, 6.4
onward, don't exist yet), so this client-side check is currently the
only thing standing between a non-admin account and the admin shell;
it's deliberately not skipped just because the backend doesn't need it
yet.

Routed at `/admin/login` in `App.jsx`, replacing that route's former
`Placeholder`. No `justRegistered`-style router state (no admin
self-registration screen exists anywhere in the roadmap — admin
accounts aren't a public signup flow) and no `RoleShell` wrapper (same
"not authenticated yet" reasoning every other login screen here uses).
Styling reuses `OwnerLogin.module.css` verbatim as `AdminLogin.module.css`
— same design tokens, same card/form layout, nothing admin-specific to
differentiate visually at the login step itself.

**No npm registry access this session** (same recurring gap) — verified
by hand: brace/paren/bracket balance clean on the new file (56/56 parens,
48/48 braces, 5/5 brackets), and its four imports (`api`/`ApiError` from
`api/client.js`, `tokenStorage` from `api/tokenStorage.js`, `FormField`,
`useMutation`) checked directly against those modules' actual `export`
statements rather than assumed from `OwnerLogin.jsx`'s own usage.

`docs/TASKS.md`'s 6.1 checkbox ticked.

## Task 6.2 — `RoleShell` admin sidebar nav (Dashboard, Restaurants, Orders, Platform Settings)

Checked against `docs/ROADMAP.md`'s Phase 6 item 2 before starting:
the nav shape itself (`RoleShell.jsx`'s `role === 'admin'` sidebar
branch, plus the four-entry `NAV_ITEMS_BY_ROLE.admin` list) already
existed, built as part of the Phase 2 component kit at Task 2.19. So
this task's real job was giving the sidebar's four destinations actual
routes and wrapping each in `RoleShell role="admin"` — the same
"nav wiring now, real content later" split Task 5.1 used for the
owner role's four tabs.

Three brand-new deliberate-placeholder pages —
`AdminRestaurants.jsx`, `AdminOrders.jsx`, `AdminSettings.jsx` — plus a
new `AdminDashboard.jsx` replacing `App.jsx`'s old inline `Placeholder`
for `/admin/dashboard`. Each is a minimal heading + one line of body
text naming the later task(s) that fill it in, matching exactly how
`OwnerOrders.jsx`/`OwnerRestaurant.jsx`/`OwnerAccount.jsx` named 5.12-
5.16/5.2-5.11/5.22 at Task 5.1:

- `AdminDashboard.jsx` → names Task 6.3 (totals + recent activity feed)
- `AdminRestaurants.jsx` → names Tasks 6.4-6.8 (list, detail, Live-request
  review, Approve/Reject, Suspend/Reactivate)
- `AdminOrders.jsx` → names Tasks 6.9-6.11 (view-all list, filters,
  detail view)
- `AdminSettings.jsx` → names Tasks 6.12-6.13 (registration fee/payment
  config, order timeout config)

Deliberately not using the `EmptyState` component kit piece here —
`EmptyState` is for "no data yet" (an owner's menu with nothing added,
a search with 0 results), a different situation from "this screen's
feature isn't built yet"; reusing it for the latter would be
misapplying a component for something it doesn't mean — so plain
heading + text, matching the original Task 5.1 placeholder shape
instead.

All four wired into `App.jsx`: `/admin/dashboard` (replacing the old
inline `Placeholder`), plus new `/admin/restaurants`, `/admin/orders`,
`/admin/settings` routes that did not exist at all before this task.

**No npm registry access this session** (same recurring gap) — verified
by hand: brace/paren/bracket balance clean on all four new files and on
the edited `App.jsx`, and the one import each placeholder needs
(`RoleShell`, via `components/RoleShell/index.js`'s default re-export)
checked directly against that module.

`docs/TASKS.md`'s 6.2 checkbox ticked.

## Task 6.11b — Order management: order detail view, read-only admin mode

**Note found at the start of this session**: Tasks 6.3b, 6.4b, 6.5b,
6.6d-6.6f, 6.7d, 6.8, 6.9, and 6.10b — the frontend halves of most of
Phase 6 — had all already been built and checked off in `docs/TASKS.md`
(confirmed against the actual code: `AdminDashboard.jsx`,
`AdminRestaurants.jsx`, `AdminRestaurantDetail.jsx`,
`AdminLiveRequests.jsx`, `AdminLiveRequestDetail.jsx`, `AdminOrders.jsx`
all have real content, not placeholders), but none of them has its own
log entry in this file — the same "the write-up went missing" gap this
file's own history already had once before (see `docs/PROJECT_STATUS.md`'s
own 6.11a entry for the backend side of the identical note). Also found
two pre-existing, unrelated bugs while getting a real `npx vite build`
running to verify this task's own changes: `pages/AdminLiveRequestDetail/`
and `pages/AdminLiveRequests/` were both missing the one-line `index.js`
barrel export every other `pages/*` directory has (e.g.
`pages/AdminRestaurantDetail/index.js`: `export { default } from
'./AdminRestaurantDetail';`) — `App.jsx`'s own `import ... from
'./pages/AdminLiveRequestDetail'` line has apparently never actually
been build-verified since it was added, since Rollup fails to resolve
either directory without one. Fixed both with the same one-line pattern
every sibling directory already uses — not this task's own gap, but it
blocked verifying this task's own build, so fixed rather than left open,
same "worth fixing since it's now visibly blocking real work" reasoning
this file's own Task 5.10 entry already used for a similar pre-existing
test-isolation bug. Neither Phase 6 backfill was attempted — picked up
directly at 6.11b instead.

**6.11b is done.** `OrderDetail.jsx` (5.13) is now reused directly for
the admin, read-only order detail screen, per `docs/TASKS.md`'s own
wording ("make `OrderDetail.jsx` reusable in a read-only admin mode") —
not a second, near-identical `AdminOrderDetail.jsx` screen the way
`AdminRestaurantDetail.jsx` (6.5b) was built for its own resource (a
genuinely different call there: Suspend/Reactivate has no owner-side
equivalent for that screen to accidentally leak into if it were shared,
where here the very screen this task reuses already IS the owner-side
version).

A single new `role` prop (`OrderDetail({ role = 'owner' })`) drives
every difference between the two modes:
- `fetchOrderDetail(id, role, signal)` now takes `role` and picks
  `GET /api/admin/orders/:id` (6.11a, no ownership check) instead of the
  owner-scoped `GET /api/orders/:id` (5.13a) when `role === 'admin'`.
  Both return the identical `{ order, items, payment_method }` shape
  (6.11a's own backend comment is explicit about this), so nothing else
  about how the response is read/rendered needed to change.
- `RoleShell role={role}` — `"admin"` renders the admin sidebar nav
  instead of the owner's 4-tab bottom nav.
- The back button now navigates to `/admin/orders` or `/owner/orders`
  depending on `role`, instead of a hard-coded owner path.
- Not-found copy branches on `isAdmin`: the admin route's 404 is a real
  "doesn't exist" (no ownership ambiguity the way the owner-scoped
  route's is — same distinction `AdminRestaurantDetail.jsx`'s own doc
  comment already draws for its own admin-only read), so the "or isn't
  yours to view" half is dropped for that case.
- The entire Accept/Reject/Complete/Call Customer action row (and its
  error banner) is now gated on `!isAdmin`, on top of the existing
  `status`-based branching — an admin never sees any of it, regardless
  of order status, since 6.11a's route is a bare `GET` with no matching
  admin-scoped `PATCH` to wire a click to.

New route `/admin/orders/:id` in `App.jsx`, rendering
`<OrderDetail role="admin" />`, mounted the same way
`/admin/restaurants/:id` (6.5b) sits alongside `/admin/restaurants`.

`AdminOrders.jsx` (6.9/6.10b) rows are real tap targets now — same
clickable-row shape (`onClick`/`onKeyDown`/`role="button"`/`tabIndex`)
`AdminRestaurants.jsx`'s own rows (6.5b) already established, navigating
to `/admin/orders/:id`. That file's own doc comment, which had
explicitly flagged "no tap-through yet (that's Task 6.11's job)", is
updated to describe the real tap-through instead.
`AdminOrders.module.css`'s `.row` picked up the matching `cursor:
pointer` + `:focus-visible` styling `AdminRestaurants.module.css`'s own
`.row` already carries — its own comment had explicitly deferred that
styling "until Task 6.11 wires up the detail view."

**npm registry was reachable this session** — real `npm install` +
`npx eslint src` (clean, no errors or new warnings) + a real
`npx vite build` (183 modules, succeeding only after the two missing
`index.js` files above were added) all passed. No frontend test runner
exists in this codebase (backend-only, via Jest) — build + lint is the
same verification bar every other frontend-only task in this file
relies on.

`docs/TASKS.md`'s 6.11b checkbox ticked — **Task 6.11 (backend 6.11a +
frontend 6.11b) is now fully complete.**

## Task 6.12b — Platform settings: registration fee + payment method config (frontend)

**6.12b is done.** `AdminSettings.jsx` (6.2's placeholder) now has real
content: a single form for the five `registration_*` fields — fee,
payment method name, account number, account name, instructions — wired
to 6.12a's new `GET`/`PATCH /api/admin/settings`.

Same "fetch-then-edit" shape `OwnerAccount.jsx` (5.22) and
`OwnerRestaurant.jsx` (5.2) both already establish: `values` starts
`null` while the `GET` is in flight, seeded exactly once via
`seededRef` so a successful save's own `refetch()` can't stomp an
in-progress edit. `GET /api/admin/settings` returns the *whole* settings
row (unlike the public, five-field-only `GET /api/admin-settings/registration`
`RequestLive.jsx`, 4.3, reads) — this screen only ever seeds/renders/
`PATCH`es the five fields it owns, leaving the `order_timeout_*`/
`notify_before_expiry` columns Task 6.13 will add its own section for
untouched.

One form, one `useMutation`, unlike `OwnerAccount.jsx`'s two independent
forms — there's no second, unrelated field group on this screen yet
(6.13b adds one). Client-side field-length caps mirror
`docs/DB_SCHEMA.md`'s own `admin_settings` VARCHAR2 widths, the same
"client cap mirrors the real DB column" convention every other
`FormField` form in this codebase follows, and the same values
`adminController.js`'s own `updateAdminSettingsSchema` (6.12a) enforces
server-side. The registration fee field follows `AddFood.jsx`'s own
`price` field exactly — kept as a string in form state (not a live
`Number`, to avoid the usual controlled-number-input "can't type a
trailing decimal point" awkwardness), validated with the same
floating-point-safe "at most 2 decimal places" check — except
`.nonnegative()`-shaped (`>= 0`, not `> 0`): a registration fee of
exactly 0 is a real admin choice (a promotional free period) 6.12a's own
backend schema already allows, and this form mirrors that boundary
rather than the stricter "must be greater than 0" rule a menu item's
price uses.

**No npm registry access this session** (same standing gap every prior
no-access session in this file and `backend/README.md` already carries)
— no `node_modules` at all, so neither a real `npx eslint` nor `npx vite
build` is runnable here. Reviewed by hand instead: every `FormField`
prop used here (`as`, `type`, `min`, `step`, `maxLength`, `helperText`,
`error`, `disabled`) already exists on the component (confirmed against
`FormField.jsx`'s own source) and matches an existing usage elsewhere in
this codebase (`AddFood.jsx`'s own `price`/`name`/`description` fields);
every CSS custom property referenced in `AdminSettings.module.css` was
checked against the real token list in `frontend/src/styles/*.css`
(`--font-size-caption` used in place of a `--font-size-body-small` that
doesn't actually exist as a token, corrected before this was written up)
rather than assumed. `validate()`'s own logic (required-field checks,
the zero-fee-accepted / negative-fee-rejected / 3-decimal-rejected
boundaries) was run standalone against a scratch harness (plain
`node -e`, no React/JSX involved — just the same function extracted
verbatim) confirming all six cases behave as intended. A real `npm
install`/`npx eslint`/`npx vite build` still needs to confirm this
before it's considered fully closed — same standing caveat every
no-registry-access session in this file already carries.

`docs/TASKS.md`'s 6.12b checkbox ticked — **Task 6.12 (backend 6.12a +
frontend 6.12b) is now fully complete.**

## Task 6.13b — Platform settings: order timeout config (frontend)

**6.13b is done, completing Task 6.13 and Phase 6.** `AdminSettings.jsx`
(6.12b) now has a second section, "Order timeout", extending the *same*
form rather than adding a separate one — see this task's own comment in
the component for why (no real product reason to let an admin save one
section without the other, and 6.13a's `updateAdminSettingsSchema`
already accepts a partial body with any subset of all eight fields, so
this page just always resends all eight on every save, same as 6.12b's
own five already did).

Three new controls, one per remaining `admin_settings` column:

- **`order_timeout_mode`** — a `FormField` `as="select"`, options
  `Off`/`15 minutes`/`30 minutes`/`1 hour`/`Custom` mapped to the exact
  `off`/`15m`/`30m`/`1h`/`custom` values `adminController.js`'s own
  `ORDER_TIMEOUT_MODES` (6.13a) validates server-side — no free text, no
  placeholder option (the row always has a real seeded value, `'off'` by
  default per migration 0010, so there's never a genuinely empty state
  to placeholder).
- **`order_timeout_custom_minutes`** — a numeric `FormField`, only
  rendered at all when `order_timeout_mode === 'custom'`, mirroring
  6.13a's own "required only when mode is custom" rule exactly on the
  client. Switching the select away from `'custom'` clears this field
  back to `''` in local state (so a stale number can't silently resurface
  if the admin flips back to Custom later expecting a blank field) *and*
  `handleSubmit` sends an explicit `null` for it whenever the mode being
  saved isn't `'custom'` — so switching away from Custom actually clears
  the stored value server-side too, not just hides it in this form.
  Validation matches 6.13a's own `orderTimeoutCustomMinutesSchema`:
  required, a positive whole number, capped at 99999 (`NUMBER(5)`, same
  `MAX_ORDER_TIMEOUT_CUSTOM_MINUTES` bound `adminController.js` uses).
- **`notify_before_expiry`** — a `ToggleSwitch` (same component
  `OwnerRestaurant.jsx`'s `is_open`/opening-hours toggles already use for
  a real boolean column), laid out in a labeled row
  (`.toggleRow`/`.toggleStatus`/`.toggleLabel`/`.toggleHint`) modeled
  directly on `OwnerRestaurant.module.css`'s own `.openToggleRow` shape.
  Converted `Boolean(data.notify_before_expiry)` on read and back to a
  real boolean in the `PATCH` payload (the server-side 0/1 conversion is
  `adminController.js`'s own `toNotifyBeforeExpiryNumber`'s job, not this
  form's). Deliberately does *not* mutate on flip the way
  `OwnerRestaurant.jsx`'s `is_open` toggle does — it's part of this
  page's one form/one Save button, since there's no operational reason a
  notify preference needs to take effect instantly the way "stop
  accepting orders right now" does.

New `.sectionDivider`/`.toggleRow`/`.toggleStatus`/`.toggleLabel`/
`.toggleHint` classes in `AdminSettings.module.css` — all built from
tokens already used elsewhere in this same file or in
`OwnerRestaurant.module.css` (`--color-border`, `--radius-md`,
`--color-surface`, `--font-size-caption`, `--font-weight-semibold`), no
new tokens invented.

**No npm registry access this session** (same standing gap every prior
no-access session in this file/`backend/README.md` already carries) — no
`node_modules`, so neither `npx eslint` nor `npx vite build` is runnable
here. Reviewed by hand instead: confirmed `FormField`'s `as="select"`
mode (options array, no children) and `ToggleSwitch`'s props
(`checked`/`onChange` receiving the new boolean directly, `label`,
`disabled`) both against their real component source, matching an
existing usage elsewhere (`AddFood.jsx`'s own `as="select"` category
field; `OwnerRestaurant.jsx`'s own `ToggleSwitch` usage). The whole file
was also round-tripped through `esbuild`'s JSX loader (bundled with
external stubs for React/CSS-module/sibling imports) to confirm it's
free of JSX/syntax errors, since no bundler config for this project is
installed to run a real `vite build`. `validate()`'s new
`order_timeout_custom_minutes` branch (the genuinely new logic this task
adds, extracted verbatim into a standalone scratch harness, no React
involved) was checked against nine cases: off-mode needs no minutes;
empty/zero/negative/non-integer/over-99999/non-numeric minutes each
rejected while `custom`; 45 and the 99999 ceiling itself both accepted.
All nine passing. A real `npm install`/`npx eslint`/`npx vite build`
still needs to confirm this before it's considered fully closed — same
standing caveat every no-registry-access session in this file already
carries.

`docs/TASKS.md`'s 6.13b checkbox ticked — **Task 6.13 (backend 6.13a +
frontend 6.13b) is now fully complete, which completes Phase 6's own
exit check** (an admin can approve a pending owner from Phase 4, and the
platform-settings screens Phase 6 built — restaurant/order management,
live-request review, and now both settings sections — are all in place).
