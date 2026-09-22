# NATRA — Radical UI Redesign Roadmap

Status: **5 reference images received; 4 pages built (Phase 10.1–10.4),
1 page scheduled (10.5, Owner Restaurant — awaiting two project-owner
decisions before it can be built, see that page's own findings below).**
This file is the working roadmap/spec for the redesign effort — created
before any new reference images were supplied, capturing the agreed
process so work can start the moment images arrive.

## Background

NATRA's current UI was built against the two images now archived at
`docs/reference_ui/` (also copied out as `current_ui_reference_1_home.jpg`
and `current_ui_reference_2_restaurants_row.png`):

- `1000065033.jpg` — mobile customer Home screen ("HomeEats" branding,
  orange primary color, search bar, Restaurants scroller, Categories
  chips, Popular Foods grid, bottom tab nav).
- `560d4168-0f66-443a-9fbc-c9625f83d15e.png` — a detail crop of the
  Restaurants horizontal scroller (logo badge, Open/Closed status pill,
  distance + service-area count).

Phases 0–8 of the original build (see `docs/PROJECT_STATUS.md`) are
fully implemented and visually/behaviorally match those two images
pixel-by-pixel, per Task 2.22's own QA pass. This redesign is a
**deliberate visual break from that reference** — not a bug-fix or
continuation of Phase 8 — driven by a new set of reference images the
project owner will supply.

## Scope (agreed)

- **All three roles are in scope**: Customer, Restaurant Owner, Admin.
- **Not a full-app pass** — only specific pages the project owner
  selects (either named up front, or pointed at once new reference
  images are uploaded and mapped to existing screens).
- Redesign is "radical": expect new visual language (colors,
  typography, spacing, possibly component shapes), not just a
  refresh of the existing tokens — so scope includes both
  `docs/DESIGN_TOKENS.md` and the shared component kit
  (`frontend/src/components/*`), not just individual pages.

## Working process (agreed)

Tasks will be scheduled the same way the existing project log already
works — **very small, single-purpose tasks**, not one big "redesign
page X" task — following the exact convention already established in
`docs/TASKS.md`/`docs/PROJECT_STATUS.md` throughout Phase 8:

1. **Split before building.** A page with multiple independent
   sections (e.g. a dashboard with several cards, or a form plus a
   sub-list) gets split into lettered/numbered sub-tasks up front
   (e.g. `10.2b-i`, `10.2b-ii`), same pattern as `8.2b`'s six-way split.
2. **One concern per task.** Layout shell, then one section/component
   at a time, then a cross-section/verification pass at the end —
   never bundled.
3. **Reference-driven, not guessed.** Each task traces the new
   reference image(s) for that specific page/section before touching
   code, the same way the original build treated `docs/reference_ui/`
   as visual source of truth (Task 2.22).
4. **Log every task**, including "verified, no change needed" outcomes
   — not just the tasks that changed code — so the trail stays
   trustworthy the way `PROJECT_STATUS.md` already is.
5. **Flag, don't silently fix, scope mismatches** — if a reference
   image implies a change to a shared component that other
   already-redesigned pages depend on, that gets named and
   sequenced explicitly rather than patched in passing.
6. **Responsive compatibility is a standing, non-negotiable rule
   (project owner, Phase 10).** No task may trade device-size support
   for visual fidelity. Every task — not just the `10.x-h`/`10.x-f`
   verification passes — must leave its screen working at every device
   size, not only the size the reference image happens to show:
   - **Range:** the project's 4 breakpoints (mobile 320px / tablet
     768px / desktop 1024px / large desktop 1280px, `ResponsiveGrid`,
     Task 2.7) *and the widths between and beyond them*: nothing may
     break from a 320px phone up to 1920px+, portrait or landscape.
   - **Build rules:** no fixed pixel widths on containers (use
     `width: 100%` + `max-width`, flex/grid, relative units); no
     horizontal page scroll (genuinely wide content scrolls inside its
     own container); nothing clipped or escaping its card; text wraps
     rather than truncates; images `max-width: 100%`; interactive
     controls keep the 44px touch-target floor (Task 8.9a).
   - **References are phone mockups, not pixel specs.** Match a
     reference's look (colors, rounding, proportions, rhythm), never by
     hard-coding the mockup's own dimensions. Wide viewports need a
     deliberate behavior of their own (e.g. the login card capping at
     420px and centering), not a stretched or stranded copy of the
     mobile layout.
   - **If a reference conflicts with responsiveness, responsiveness
     wins**, and the deviation is flagged in `docs/PROJECT_STATUS.md`
     rather than silently taken either way.
   - **Verify in a real render before ticking any task** (headless
     Chromium works in this environment; not just reading CSS): at
     minimum 320, 390, 768, 1024, 1280 and 1920px wide, plus one short
     landscape phone (~667x375), checking for page-level horizontal
     overflow, elements escaping their container, clipped text, and
     sub-44px tap targets. The formal `10.x-h`/`10.x-f` pass still
     happens at the end of each screen and additionally covers every
     state (banners, errors, empty/loading) at all 4 breakpoints.

## Governing rule (confirmed by project owner)

**The redesign restyles what the app actually does — it does not add
features the code doesn't support**, with exactly one named exception:
the Owner Dashboard's graphical/data-visualization presentation (e.g.
a sales chart) may include new supporting code if none exists yet,
since that's a real, useful capability gap rather than an invented
flow. Everywhere else, a reference image is a **visual/style
reference only** — colors, shapes, spacing, layout rhythm — not a
literal feature spec. Where a reference shows something the schema/
backend/frontend has no support for, the task list below either
(a) substitutes the real equivalent data/behavior, or (b) omits the
element and flags it, rather than building a fake/dead affordance.

**No fake icons, logos, or invented text anywhere**, with exactly two
named exceptions: (1) the Owner Dashboard chart above, and (2) the
literal text **"NATRA"** may appear as a plain-text header on every
redesigned page — with **no accompanying logo mark/icon** (no dot,
no monogram, no store tile, nothing graphical alongside it, just the
word). Checked directly against the codebase: NATRA has exactly 7
icon assets total, all nav icons defined inline in `RoleShell.jsx`
(Home/Categories/Orders/Profile/Login/Dashboard/Storefront/Settings)
— no bell icon exists anywhere, no avatar/photo field exists on
`users`, no chevron component exists, no logo file exists in
`frontend/src/assets`. So every other icon-shaped element the
reference images show (notification bell, profile avatar, stat-tile
icons, quick-action icons, category icons, a greeting sun/moon icon)
is a fake addition and is **dropped**, not built — replaced with
plain text/typography where an affordance is still needed, or with
one of the 7 real nav icons where one of those genuinely fits.

**The Login reference image applies to both `OwnerLogin.jsx` and
`AdminLogin.jsx`** — restyled using exactly what each screen's own
code already supports (which differs slightly between the two, per
the findings below), not a new unified login screen.

## Reference images received so far (4)

Saved to `docs/reference_ui/` (added alongside the 10.0/10.1 work —
this folder existed but was empty when Phase 10 started):

1. **Login** ("Zoble Chat" reference) → `docs/reference_ui/phase10_login_reference.jpg` → `OwnerLogin.jsx` + `AdminLogin.jsx`
2. **Customer Home** (Natra-branded) → `docs/reference_ui/phase10_customer_home_reference.jpg` → `Home.jsx`
3. **Owner Dashboard** → `docs/reference_ui/phase10_owner_dashboard_reference.jpg` → `OwnerDashboard.jsx`
4. **Admin Dashboard** → `docs/reference_ui/phase10_admin_dashboard_reference.jpg` → `AdminDashboard.jsx`
5. **Owner Restaurant** (profile/categories/hours/areas/payments) → `docs/reference_ui/phase10_owner_restaurant_reference.jpg` → `OwnerRestaurant.jsx`

## Feasibility findings (checked against real code, not assumed)

### Login → `OwnerLogin.jsx` / `AdminLogin.jsx`
- Restyle only (card/gradient shell, logo mark, rounded inputs, pill
  button, orange links) — no functional change.
- **"Username, email, or phone number"** — `authController.js`'s login
  is email-only (`email: z.string().email()`, no username/phone
  lookup exists anywhere). Field stays labeled **"Email"** on both
  screens; the reference's field label is a style reference, not a
  spec to implement.
- **"Forgot password?"** — no forgot-password flow exists in the
  backend at all. **Not added** — a link with nowhere to go is a dead
  affordance, not a restyle. Flagged as a real future feature, not
  built speculatively here — confirmed again in Task 10.1g; see
  "Flagged future features" below for what a real implementation needs.
- **"Don't have an account? Create one"** — real on `OwnerLogin.jsx`
  (owner self-registration exists, `OwnerRegistration.jsx`). **Does
  not appear on `AdminLogin.jsx`** — no admin self-registration exists
  by design (confirmed in `docs/PROJECT_STATUS.md`'s own 8.3a entry:
  "no admin signup screen exists anywhere in this codebase"). This is
  a real, intentional difference between the two screens, not an
  oversight to fix.
- Both screens' existing real states (`successBanner`/session-expired
  notice from Task 8.7e, inline "Invalid email or password" error)
  carry over restyled, not rebuilt.

### Customer Home → `Home.jsx`
- **"Sign up" button + notification bell** — customers have no
  accounts at all (`docs/DB_SCHEMA.md`: "Customers never get a row
  here (no accounts)") and no notification records target them
  (`notifications` table only covers owner/admin recipients).
  **Dropped**, not built.
- **Star rating / review count** on restaurant cards — no
  ratings/reviews table or column anywhere in the schema. Cards keep
  the real fields instead: name, `location_text`, service-area count,
  Open/Closed status (derived from `live_status`/`is_suspended`).
- **Bottom nav "Profile"** — the real customer nav
  (`RoleShell.jsx`'s `NAV_ITEMS_BY_ROLE.customer`) is Home / Categories
  / Orders / **Login**, not Profile — there's no customer account to
  have a profile screen for. Restyle keeps the real 4 items.
- **Popular Foods "+"quick-add button** — checked `useOrderCart.js`
  and `Home.jsx`'s existing `EntityCard` wiring: today, tapping a food
  card is a real link straight to `FoodDetails`/the order flow; there
  is no add-to-cart action that fires directly from the grid. The "+"
  becomes the new **visual style of that same existing link** (icon
  button instead of an "Order Now" bar) — tapping it still navigates
  to `FoodDetails`, exactly like today. Not building a new instant-add
  cart interaction.

### Owner Dashboard → `OwnerDashboard.jsx`
- **4-stat grid (Total/Completed/Rejected/Pending)** — real data.
  `GET /orders/counts` already returns per-status counts
  (New/Accepted/Completed/Rejected); "Total" and "Pending"
  (New+Accepted) are simple derivations of that same response, not
  new backend work.
- **Quick Actions (Open toggle, Add Food, View Orders, Check Live
  status)** — all 4 actions are real today, just split across two
  cards (Open/Add Food/View Orders in "Quick actions"; "Check Live
  status" in a separate "Get your restaurant Live" card, linking to
  the real `/owner/live-status` route). Redesign reorganizes these 4
  real actions into one tile row — no new action invented.
- **Sales Overview** — real Today/All-time totals + completed-order
  count already exist (`GET /orders/sales-summary`).
- **🟡 Hourly sales line chart — the one named exception.** No hourly
  breakdown exists anywhere (`salesSummary.js` only buckets
  Today/All-time). Since this falls under the owner-dashboard-graphics
  exception, this is scheduled as **real new backend work** (an hourly
  aggregation endpoint), not faked with placeholder data.
- **Recent Order Notifications card** — real, backed by the
  `notifications` table (owner-targeted rows already exist per Task
  7.5).

### Admin Dashboard → `AdminDashboard.jsx`
- **Totals grid (Restaurants/Live/Pending/Orders)** — real data,
  checked directly against `adminDashboardSummary.js`: the endpoint
  already returns exactly `{ restaurants, live, pending, orders }`.
  No backend change needed, restyle only.
- **Recent activity feed** — real, already merges live-request and
  order events into one chronological list with real status values.
  Restyle (status-pill treatment) only.
- **Bottom nav (Dashboard/Restaurants/Orders/Settings)** — matches the
  real `NAV_ITEMS_BY_ROLE.admin` items exactly. Note: today this bottom
  bar is the **<768px fallback** next to a sidebar for wider viewports
  (Task 8.3g); the reference implies it as primary chrome. This is
  flagged as an open layout decision for the admin task, not assumed
  either way.

### Owner Restaurant → `OwnerRestaurant.jsx`
Checked directly against the current file (1,345 lines, Tasks 5.2–5.8):
every section the reference shows already exists and is wired to a real
endpoint — this page is a restyle, same as the other four, with two
open items flagged below rather than assumed.

- **Hero: cover photo with an overlaid "Change cover photo" button, logo
  badge overlapping its bottom-left corner** — real fields
  (`cover_url`/`logo_url`, Task 5.3's `ImageUploadField`). Today the two
  upload fields render as two separate labeled controls, not a
  photo-with-overlay + overlapping badge; this is a layout/restyle
  change to the same two existing fields and their existing
  upload/error/"Uploading…" states, not new functionality.
- **Restaurant name (large heading) + a one-line tagline under it** —
  the name is real (`values.name`). The "tagline" is **not a second
  field**: `docs/DB_SCHEMA.md`'s `restaurants` table has exactly one
  `description` column (CLOB, nullable), no separate tagline/subtitle
  column. The reference reuses that same field twice — a one-line
  preview in the hero, the full editable textarea in the form below —
  which is a legitimate real-data restyle (per the governing rule: the
  *presentation* is new, the data isn't), not an invented field. A
  restaurant with no saved description yet has nothing to preview here;
  that empty case needs a real fallback (omit the line, or a plain
  "Add a description" prompt), not blank space pretending to be content.
- **Open/Closed status badge + "Customers can order from you right now"
  toggle, side by side under the name** — both real
  (`is_open`, Task 5.8's `ToggleSwitch` + `StatusBadge`), just
  currently rendered lower on the page as a standalone control. Restyle
  moves them, doesn't change what they do — still fires `mutate`
  immediately on flip, per that task's own "no confirmation" note,
  which this restyle doesn't reopen.
- **Restaurant name field + Description textarea + Save changes
  button** — real (Task 5.2), restyle only (rounded card, filled
  button). The reference shows a **live "0/500" character counter** on
  Description; today's `FormField` textarea has **no `maxLength` at
  all** on this field (`description` is a CLOB — unlike `name`/
  `Category`/`Area`/payment-method fields above it in this same file,
  none of which are CLOB, there's no server-enforced cap to mirror the
  way `NAME_MAX_LENGTH` etc. mirror theirs). **Decided by the project
  owner: option (b) — drop the counter, keep the textarea uncapped**
  ("don't fake anything — consider what's in the code only"). A "0/500"
  counter would display a limit the backend doesn't enforce; not built.
- **Categories / Service areas / Payment methods cards** — all three
  real, restyle only: each already has its real add/edit/delete (or
  add/edit/active-toggle, for payment methods — Task 5.7 deliberately
  has no delete, per that section's own doc comment) `Modal` flow and
  its own real `EmptyState` copy. The reference's icon+title+action-
  button card header (matching the panel treatment `10.3`/`10.4`
  already established for Quick Actions/Totals) applies directly; the
  list rows/chips inside restyle to match, same data.
- **Opening hours card, shown in its real error state** — the
  reference's exact copy, *"Couldn't load opening hours. Check your
  connection and try again."*, is this screen's real
  `openingHoursError` string verbatim (not paraphrased), so this is the
  screen's own existing error state, restyled — same for its loading/
  empty/per-day-editing states, all real and already built (5.5a/5.5b).
- **Menu management note ("manage your foods" link)** — real, existing
  link to `OwnerMenu.jsx` (Task 5.9b), restyle only.
- **Top bar: search input + notification bell + circular avatar ("T")
  with a dropdown chevron.** `OwnerRestaurant.jsx` is wrapped in
  `RoleShell role="owner"`, whose owner chrome is the existing 4-tab
  bottom nav (`docs/NATRA_MASTER_PROMPT.md`'s "Exactly four main
  sections") — there is no top search/bell/avatar bar anywhere in the
  owner or admin chrome today, and nothing this screen (or `RoleShell`)
  fetches would back a search box here. **Decided by the project owner:
  drop all three of the search input, the bell, and the dropdown
  chevron** ("don't fake anything — consider what's in the code only"),
  per the roadmap's own governing rule (no bell icon or avatar/photo
  field exists anywhere in this codebase; every icon-shaped element with
  nothing real behind it is dropped, same as Customer Home's bell,
  10.2z2). Only a plain-letter avatar stays — the owner's real first
  initial (from their real name/email on `users`, not an uploaded
  photo), linking to `/owner/account`, same spirit as `DashboardHeader`'s
  existing text-based notification indicator on the other two
  dashboards.

## Flagged future features (deliberately NOT built in Phase 10)

Real capability gaps that a reference image shows or implies, recorded
here so they are tracked decisions rather than forgotten omissions. None
of these is a restyle; each needs real backend work, so none may be
faked with a dead link/button (governing rule).

### Forgot password (login reference's "Forgot password?" link)

**Status: not built, on either login screen (Task 10.1g).** Verified
against the code, not just the docs: no forgot/reset flow exists in the
frontend or backend. The auth routes that exist are `signup`, `login`,
`GET/PATCH /me`, and `PATCH /me/password` (`changePassword`, Task 5.22)
— the last requires being logged in *and* knowing the current password,
so it is not a recovery path. `OwnerRegistration.jsx`'s own comment
already notes "no Phase 4/5 task adds password reset yet".

**Why it can't be a link-only restyle.** A working flow would need, none
of which exists today:
1. **A delivery channel.** The backend has no email or SMS dependency at
   all (`backend/package.json`), so there is currently no way to deliver
   a reset code/link. This is the largest missing piece and a product
   decision (email? SMS? which provider/cost?) before it is a coding one.
2. **Reset-token storage:** a new migration/table (hashed token, expiry,
   single-use, linked to `users.id`) — no such column/table exists in
   `docs/DB_SCHEMA.md`.
3. **Two endpoints** (request a reset; confirm with token + new password)
   with rate limiting, reusing the existing password length rules from
   `authController.js`.
4. **Two frontend screens** (request form; set-new-password form) — the
   link on the login card would go to the first.
5. **Anti-enumeration parity:** the request step must answer identically
   whether or not the email exists, matching the deliberately generic
   "Invalid email or password." login message (`authController.js`'s
   `INVALID_CREDENTIALS_MESSAGE` reasoning).
6. **A decision for admin accounts** (self-service reset vs. none —
   admin has no self-registration by design, see Task 8.3a).

**Operational gap to be aware of until it exists:** a locked-out owner or
admin has no self-service way back in, and admin has no "reset an
owner's password" tool either (admin scope is deliberately lightweight,
`docs/NATRA_MASTER_PROMPT.md`). Recovery today means a manual database
fix by whoever operates the deployment.

**Where the UI goes when it is built:** per the login reference, a
centered bold-orange "Forgot password?" text link directly under the
"Log in" button and above the "create account" row, on both screens,
styled like `OwnerLogin`'s `.linkButton` (Task 10.1e), and — per the
standing device-size rule — wrapping/centering correctly from 320px up.

## Next step

These findings are now built out into **Phase 10** in `docs/TASKS.md`,
broken into the same tiny per-section tasks (shared kit first, then
one screen/section at a time, then a verification pass) used
throughout Phases 2 and 8.
