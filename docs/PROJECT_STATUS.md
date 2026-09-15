# NATRA — Project Status

Last updated: 2026-09-14 (7.6d)

## Current stage
NOTE (added alongside the 2.17 entry below): this section, and the
"Next step" section near the bottom of this file, had fallen well behind
both `docs/TASKS.md`'s checkboxes and the actual codebase — they still
described Task 1.15 as in progress despite 1.15g, all of 1.16 (a–e), and
2.1–2.16 already being complete and checked off in TASKS.md, with no log
entries here for any of that work. Rewritten below to match reality;
backfilling individual log entries for the untracked 1.16/2.1–2.16 work
itself is not part of this task and is left for whoever next has reason
to touch that history.

Phase 0 (Foundation) — all 16 tasks checked off; its real-DB exit check
is still pending (see "Not started yet" below). Phase 1 (backend generic
handlers) is fully complete: the shared kit (`crudFactory`,
`ownershipMiddleware`, `uploadToObjectStorage`, `statusTransition`,
`paginate`, `phoneLookup`, `passwordHash`, auth signup/login/middleware,
1.1–1.14) plus every real endpoint wired on top of it — `foods` (1.15,
including its `food_visibility` companion-row transaction) and
`categories`/`service_areas`/`payment_methods`/`opening_hours` (1.16a–e).
Phase 3 (customer flow) is now underway: the API client/hooks (3.1), the
Home screen's header + search bar (3.2, static layout), the Restaurants
row wired to the real (new, public) `/api/restaurants` endpoint (3.3),
the Categories chip row wired to a second new public endpoint,
`/api/categories/live` (3.4), and the Popular Foods grid wired to a
third new public endpoint, `/api/foods/popular` (3.5) — are all done;
see their own log entries below. All three Home-screen sections named in
`docs/NATRA_MASTER_PROMPT.md`'s "Customer home UI" list are now real.
The customer order flow (3.6–3.14: restaurant profile/menu, food
details, order builder/cart, customer info, payment method, payment
screenshot upload) is also all done. Task 3.15 (submit order endpoint)
is now **fully complete (4/4)**: its data layer (3.15a), transactional
business logic (3.15b), `POST /api/orders` route + controller (3.15c),
and route-level/integration tests (3.15d) are all done — see 3.15d's own
log entry for the full writeup. Next up: 3.16 (order confirmation
screen).
Phase 2 (frontend component kit) is now **fully complete (22/22)**:
design tokens (2.1–2.2), all three `RoleShell` nav variants (2.17–2.19),
all 16 named reusable components (2.3–2.16 plus `Wizard`, 2.20 —
`Stepper/Wizard` named `Wizard` in code to avoid clashing with the
already-shipped `QuantityStepper`), the component sandbox page (2.21,
`/dev/components`) rendering all 16 of them live against mock data, and
now the visual QA pass (2.22) — comparing that sandbox's actual
components against `docs/reference_ui/`'s two images pixel-by-pixel and
fixing what didn't match: `EntityCard`'s badge/logo placement and an
image double-rounding bug, plus a `SearchBar` color miss (see 2.22's own
log entry for the full writeup). Phase 4 (owner registration/Live flow)
is underway: registration (4.1), login (4.2), the "Request Live"
screen's both wizard steps — fee/payment info (4.3) and payment
screenshot upload (4.4) — Task 4.5 (submit endpoint: data layer,
transactional business logic, route/controller, and route-level tests +
frontend wiring, 4.5a–d), and now **Task 4.6 (the pending-state
screen)** are all done — **Phase 4's own registration/Live-request
submission path, plus reading its status back, is now real end to end
at the API layer**, save for the same flagged, standing gap 4.5 already
named: no endpoint yet creates the `restaurants` row a brand-new owner
needs before `attachOwnerRestaurant` will let them past either the
submit or the status-read endpoint (see 4.6's own log entry). Next up:
4.7 — a manual DB test flipping a `live_requests` row to `approved` and
confirming the owner sees the Live state on 4.6's own new screen; no
further build expected, since 4.6 already renders that state for real.

NOTE (added alongside the 4.6 entry below): the NOTE just above this one
promised a dedicated 4.5a–d log entry "below" — it never actually got
written; only this section's own narrative paragraph ended up covering
that work. Same drift this file has now caught twice before (see the
two NOTEs above) — reconstructing that missing entry after the fact
isn't this task's job either, per the same "left for whoever next has
reason to touch that history" reasoning the first NOTE already gives.
4.6's own log entry below is real and complete for the work this task
actually did.

NOTE (added alongside the 5.12a entry below): same drift as the three
NOTEs above, a fourth time — this section's "Task progress" block still
said Phase 5 was only at 5.1–5.6 with "Next: 5.7", despite 5.7–5.11
already being checked off in `docs/TASKS.md` with no log entries here
for any of them. Corrected numerically below; backfilling individual
log entries for the untracked 5.7–5.11 work is, once again, left for
whoever next has reason to touch that history rather than reconstructed
here.

NOTE (added alongside the 5.20c entry below): same drift as the four
NOTEs above, a fifth time — this section's "Task progress" block still
said Phase 5 was only at 5.1–5.18 with "Next: 5.19", despite 5.19 and
all of 5.20 (5.20a/b/c) already being checked off in `docs/TASKS.md`
with no update to this block for any of them (5.19/5.20a/5.20b/5.20c do
each have their own entry in this file's own bottom narrative, just not
reflected up here). Corrected numerically below, incrementing from the
last count this section actually recorded (94) by the 5 newly-checked
boxes (5.19, the 5.20 parent, 5.20a, 5.20b, 5.20c) rather than a fresh
full recount, which would risk compounding the still-unresolved 5.7–5.11
drift those earlier NOTEs already flagged instead of fixing; backfilling
that older gap remains, as ever, left for whoever next has reason to
touch that history.

NOTE (added alongside the 7.2b entry below): same drift as the five
NOTEs above, a sixth time — this section's own "Next" line still said
"Next: 6.12b", despite all of 6.12b/6.13a/6.13b (closing out Phase 6
entirely, 6.1–6.13b) and 7.1 (all of 7.1a–d) and 7.2a already being
checked off in `docs/TASKS.md`, with no update to this block for any of
them (each does have its own real entry in this file's own bottom
narrative log, just not reflected up here until now). "Next" corrected
below to the real current position; the "Completed" count just below
is, as the line already says, deliberately not incremented for Phase
6/7 work and that stays true here too, not re-litigated a seventh time.

NOTE (added alongside the 7.5d entry below): same drift as the six NOTEs
above, a seventh time — this section's "Next" line still said "Next:
7.5", despite 7.5a/7.5b/7.5c already being real and complete in the
codebase (`services/submitOrder.js`'s `notifyOwnerOfNewOrder`,
`controllers/notificationController.js` + `routes/notification.routes.js`,
and `frontend/src/hooks/useOwnerNewOrderAlerts.js` wired into
`RoleShell.jsx` — each file's own header comment already names its exact
`docs/TASKS.md` sub-task and describes real, shipped behavior, not a
stub), with `docs/TASKS.md`'s own 7.5a/7.5b/7.5c checkboxes left
unticked and not one line anywhere in this file's "Completed tasks log"
mentioning any of the three. Unlike the six NOTEs above (each of which
found a checkbox/count lag *behind* real log entries this file already
had, just not rolled up into this section), this is the first time the
gap ran the other way: real, working code with no corresponding
`docs/TASKS.md` checkbox or log entry at all — not even a deferred one.
`docs/TASKS.md`'s 7.5a/7.5b/7.5c checkboxes are ticked now, alongside
7.5d's own (see that entry below for 7.5d's actual new work); the
narrative writeups for 7.5a/7.5b/7.5c's own original implementation
work remain unwritten, same "left for whoever next has reason to touch
that history" reasoning the first NOTE at the top of this section
already gives for 1.16/2.1–2.16, not re-litigated here — but note that
this is closer to a real gap than the six checkbox-only NOTEs above,
since it's also missing from `docs/TASKS.md` itself, not just this
file's summary.

## Task progress
- Total tasks: 139 (see TASKS.md)
- Completed: 101 (see TASKS.md's checkboxes — 5.22 is now checked off on
  top of 5.18-5.21; the drift the NOTE above flags for 5.7-5.11 still
  stands, not re-narrated a fifth time here). Phase 6 and Phase 7 work
  past 5.22 (6.1 onward, including 7.1/7.2a/7.2b below) is tracked
  directly in `docs/TASKS.md`'s own checkboxes and this file's bottom
  narrative log, same as the still-unresolved 5.7-5.11 gap the NOTEs
  above flag — not re-summed into this bullet's own number each time,
  to avoid a seventh instance of exactly the drift those NOTEs already
  describe.
- **Phase 4 is fully complete (4.1–4.7); Phase 5 is fully complete
  (5.1–5.22); Phase 6 is now fully complete (6.1–6.13b); Task 7.1
  (popularity aggregation) and Task 7.2 (grid ranking) are fully
  complete.** **Task 7.3 (order timeout/expiry cron job) is now fully
  complete, 7.3a–7.3f.** **Task 7.4 (notify-before-expiry) is now fully
  complete, 7.4a–7.4d.** **Task 7.5 (end-to-end new-order notification
  wiring) is now fully complete, 7.5a–7.5d** — see the NOTE just above
  and 7.5d's own log entry below. **Task 7.6 (customer notified on
  Accept/Reject) is now fully complete, 7.6a–7.6d — Phase 7 (7.1–7.6) is
  now fully complete.**
- **Next: 8.1** — Phase 8's first task, a responsive pass over every
  customer screen at mobile/tablet/desktop/large-desktop breakpoints.


## Phases 0–7 summary (detailed log trimmed for size)
Phase 0 (Foundation, 0.1–0.16) scaffolded the repo, frontend (Vite/React),
backend (Node/Express/Oracle), env/gitignore setup, and CI — all tasks
checked off, though the real-DB/live-Oracle exit check is still pending.
Phase 1 (1.1–1.16) built the shared backend kit — `crudFactory`,
`ownershipMiddleware`, `uploadToObjectStorage`, `statusTransition`,
`paginate`, `phoneLookup`, `passwordHash`, auth signup/login/JWT
middleware — and wired the first real endpoints (restaurants, foods).
Phase 2 (2.1–2.22) built the full reusable frontend component kit (cards,
badges, forms, nav shells, etc.). Phase 3 delivered the customer flow
(browse, order, checkout, tracking). Phase 4 (4.1–4.7) added owner
registration/login and the "Live" request flow. Phase 5 (5.1–5.22) built
out owner order/menu/restaurant management. Phase 6 (6.1–6.13b) built the
admin dashboard, restaurant/order/live-request management. Phase 7
(7.1–7.6) added popularity ranking, order-expiry cron, and end-to-end
order notifications. All of Phases 0–7 are now fully complete.

## What's finalized
- Master product/UX/technical prompt (see NATRA_MASTER_PROMPT.md) — complete and locked.
- Reference UI images identified as visual source of truth (see reference_ui/).
- Reusable component/backend "kit" identified to avoid duplicated screen-by-screen work.
- Full build roadmap defined (see ROADMAP.md), phased from foundation → kit → customer flow → owner flow → admin flow → cross-cutting logic → polish → deployment.

## Estimated scope
- Full-scope build (all 3 roles, no feature cuts), built with shared components/handlers instead of one-off screens: **~12,000–16,500 lines of code**, excluding tests.
- With unit/integration test coverage added: **~26,000–36,000 lines** (rough, includes prior larger estimate range for reference).

## Key architectural decisions
- No delivery infrastructure (no drivers, GPS, delivery fees, or payment gateway) — restaurants self-deliver, payments verified manually via uploaded screenshots.
- Three roles: Customer (no account, phone-based tracking), Restaurant Owner, Admin.
- "Live" (admin-approved) and "Open/Closed" (accepting orders) are separate restaurant states.
- Order statuses limited to: New, Accepted, Completed, Rejected.
- Stack: Oracle Cloud VM (Ubuntu), GitHub, Oracle Autonomous AI Database, Oracle Object Storage.
- Reusable frontend kit (~16 components: cards, badges, forms, steppers, modals, nav shells, etc.) and backend kit (crudFactory, statusTransition, ownershipMiddleware, uploadToObjectStorage, paginate, phoneLookup) designed to be built once, reused across all role-specific screens.

## Not started yet
- Running migrations 0006–0010, `npm run db:test`, `npm run storage:test`,
  `npm run seed:restaurants`, and hitting `GET /api/health` against real,
  live Oracle credentials/network — the pool/client/scripts/route from
  0.11–0.15 exist and are now covered by CI's lint+build checks (0.16),
  but none of that touches a real DB/bucket. This is Phase 0's exit check
  and is the main remaining gap before Phase 0 can be called fully done,
  not just "all tasks checked off"
- A real GitHub Actions run of `.github/workflows/ci.yml` (0.16) — needs
  an actual `git push` to a real GitHub repo, not available in this sandbox
- Rest of Phase 1's backend generic handlers: wiring real endpoints
  (1.15–1.16) — auth middleware (1.14) itself is now done
- Running the real `npm test`/`npm run lint` for 1.9's, 1.10's, 1.11's,
  1.12's, and 1.13's new/extended test files (`paginate.test.js`,
  extended `crudFactory.test.js`, `phoneLookup.test.js`,
  `passwordHash.test.js`, `authController.test.js` — now covering both
  signup and login) — this sandbox has had no npm registry access the
  last several sessions; verified by hand instead (see the
  1.9/1.10/1.11/1.12/1.13 log entries above). This matters most for
  1.12/1.13: they're the only files relying on `express`/`zod`/
  `supertest`/`jsonwebtoken`, none of which have real installs here, and
  the checked-in tests use real `supertest` against the real `app.js` —
  the hand-verification instead called the controller functions directly
  with req/res doubles, which doesn't exercise Express's own routing/
  JSON-body-parsing/error-handler wiring the way the checked-in tests do.
- Frontend component kit implementation
- Any role-specific screens (customer, owner, admin)
- Deployment pipeline

## Next step
---

**Flag (not fixed):** this log's entries stop at Task 7.2a, but a fresh
`docs/TASKS.md` read against this session's uploaded snapshot shows
7.2b/7.2c, all of Phase 7 (7.3-7.6), and Phase 8's 8.1 (8.1a-8.1i) are
already checked off and complete in the codebase — the same
"`PROJECT_STATUS.md` fell behind `TASKS.md`/the real code" gap this
project has hit before (see the Phase 1→2 transition). Individual log
entries for that stretch were not backfilled here, same as that prior
occurrence; `docs/TASKS.md`'s checkboxes are the source of truth for
what's actually done, re-read fresh each session rather than trusting
this file's own last-recorded position.

**Note on the "Next" line above:** superseded by this file's own later
entries — as of this session, 8.2a through 8.2g are all done and
`docs/TASKS.md`'s checkboxes reflect it; only 8.2h remains before `8.2`
as a whole is complete (see this section's bottom-most entry). Not
rewritten here, same "leave the trail rather than edit history"
approach every drift-correction NOTE in this file already takes.

**Task 8.2a (`OwnerRegistration.jsx`/`OwnerLogin.jsx` responsive pass)
is done this session:** verified both screens at all 4 breakpoints
(mobile/tablet/desktop/large-desktop). No code changes were needed —
both already use the centered `width:100%; max-width:420px` `.card`
inside a `.page` flex-center, with every child control (`FormField`'s
inputs, the primary button) already `width:100%` within that card —
the same "centered, capped single column" shape Task 8.1e's
`CustomerInfo.jsx`/`PaymentMethod.jsx` `.page` already established,
just wrapped in a bordered card since these two screens sit outside
`RoleShell` (no account yet to hang a nav off of, per
`OwnerRegistration.jsx`'s own doc comment). Added an explanatory
comment to each `.module.css` documenting the verification and why no
changes were needed, rather than leaving 8.2a's completion undocumented
in the code itself. `OwnerLogin.jsx`'s `successBanner` (shown after a
`justRegistered` redirect) also checked — it wraps normally with no
fixed width or `white-space` override, so it doesn't overflow at
mobile widths.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no build tooling exists to actually render these
at each breakpoint, so verification was a manual trace through both
`.module.css` files and their shared `FormField`/button styles
confirming every dimension is either a fluid `%`/`var(--space-*)` value
or a `max-width` cap, with nothing fixed-pixel-width that could
overflow a 320px viewport or look stranded at 1280px+.

`docs/TASKS.md`'s 8.2a checkbox ticked. Next: **8.2b** — `OwnerDashboard.jsx`
widgets (new-orders count, sales summary, quick actions from 5.17-5.19)
reflow at all 4 widths.

---

**Task 8.2b split into lettered sub-subtasks** (8.2b-i through 8.2b-vii),
same convention as Task 8.1's a-i split — this screen has one
page-level layout question (grid vs. capped single column) plus four
independently-laid-out cards (Orders, Order notifications, Sales,
Quick actions) to verify separately, rather than one flat "reflow at
all 4 widths" checkbox.

**8.2b-i (layout decision) is done this session:** kept
`OwnerDashboard.jsx`'s existing single-column `max-width: 640px`
capped `.page` shell at every breakpoint rather than introducing a
page-level multi-column card grid. Reasoning, documented as a comment
above `.page` in `OwnerDashboard.module.css`:
`AdminDashboard.module.css` (Task 6.3b) already uses this identical
shell for its own multi-card dashboard, so it's the established
convention, not a blank slate; every other owner/customer screen that's
been through the responsive pass so far made the same capped-single-
column call; owner's `RoleShell` variant is the bottom-tab nav (Task
2.18), not a sidebar, so there's no side rail squeezing the content
column at desktop that a grid would need to relieve; and the four
cards are independent stats/actions rather than tabular data, so a
grid would only fill wide-viewport whitespace, not add function.

`docs/TASKS.md`'s 8.2b-i checkbox ticked. Next: **8.2b-ii** — verify
the page shell (heading/subheading spacing, the `.page` cap itself) at
all 4 widths.

---

**8.2b-ii (page shell verification) is done this session:** traced
`OwnerDashboard.module.css`'s `.page`/`.heading`/`.subheading` against
`ResponsiveGrid.module.css`'s own 768/1024/1280 breakpoints (Task 2.7)
— no media query exists on this shell and none was needed:
`.page` has no fixed-pixel width, only the `max-width: 640px` cap
8.2b-i kept, so below 640px it's fluid (100% minus `space-lg` side
padding) and above it centers with that same padding never closing to
zero; at the narrowest supported width (320px) that leaves a 288px
column, enough for the 22px bold heading and every card's content to
wrap without overflowing. Heading/subheading margins (`space-sm`/
`space-xl`) are the same fixed values at every width, consistent with
`docs/DESIGN_TOKENS.md`'s Font scale section never having defined a
breakpoint-dependent type scale anywhere else in the app. Also
confirmed `RoleShell`'s `.content` (this page's parent) already
reserves bottom padding for the fixed owner nav bar at every width
(Task 8.1i), so this page's last card is never obscured by it. No code
changes were needed — same "verify, document, no modification" shape
as 8.2a and 8.2b-i before it — so the reasoning above was written as a
comment above `.page` in `OwnerDashboard.module.css` itself rather than
left only in this log.

Same standing gap as every session since Task 2.10: no npm-registry
access (`npm ping` → 403), so no real build/browser render exists to
visually confirm this — verification is a manual trace through the CSS
and its actual computed values at each breakpoint's width, not a
screenshot comparison.

`docs/TASKS.md`'s 8.2b-ii checkbox ticked. Next: **8.2b-iii** — Orders
card (`.newOrdersHeadline`, each `.statusSummaryRow`, and the
loading/error `.countsError`+retry states) at all 4 widths.

---

**8.2b-iii (Orders card verification) is done this session:** traced
`.newOrdersHeadline`, `.statusSummaryRow`, and `.countsError` against
the same ~256px worst-case content column 8.2b-ii established (320px
viewport minus `.page`'s and `.card`'s own `space-lg` padding on both
sides). No changes needed:
- The headline (count + label) and each status row (`StatusBadge` +
  count) hold only short, non-wrapping content —
  `StatusBadge.module.css`'s own `.badge` is `white-space: nowrap` and
  never the constrained side of its row — so nothing overflows or wraps
  awkwardly even at that narrowest width.
- `.countsError` has no `flex-wrap`, which looked like a possible bug at
  first glance (a flex row that can't wrap could force itself wider than
  its container), but isn't one here: a flex item's `min-width: auto`
  default resolves to *min-content* (the longest unbreakable word in the
  `<p>`), not the full unwrapped line, so the paragraph wraps onto 2-3
  lines within the row instead of pushing the inline "Retry" button out
  of the card. Flagged the same reasoning in a comment for
  `AdminDashboard.module.css`'s own identical (not yet verified — that's
  Task 8.3) copy of this class, so whoever gets there next doesn't
  re-derive it from scratch.

Documented directly above `.newOrdersHeadline` in
`OwnerDashboard.module.css`. Same standing no-npm-registry-access
caveat as every prior verification session — manual trace against
computed widths, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2b-iii checkbox ticked. Next: **8.2b-iv** — Order
notifications card (plain text + button, and all three permission-state
variants: default/granted/denied) at all 4 widths.

---

**8.2b-iv (Order notifications card verification) is done this
session:** traced all three `notificationPermission` states
(`default`/`granted`/`denied`, `OwnerDashboard.jsx`) against the same
~256px worst-case card column 8.2b-ii/8.2b-iii already established.
This card has no CSS classes of its own — just `.cardBody` (shared by
every card's body text on this page) and, in the `default` state only,
an `.actionRow` + `.secondaryButton` (shared with the Orders card's
"View orders" link, already covered by 8.2b-iii). No changes needed:
- `.cardBody` has no `white-space` or fixed/`max-width` rule, so plain
  text wraps normally at any width — checked this specifically against
  the `denied` state's copy, the longest of the three ("Browser
  notifications are blocked. Enable them for this site in your
  browser's settings to get alerted about new orders."), and no word in
  it is long enough to force the ~256px column wider.
- The `default` state's "Enable notifications" button is a plain
  `.secondaryButton` in an `.actionRow` — same flex-wrap shrink/wrap
  behavior as every other button on this page, already established by
  8.2b-iii for the Orders card's own link.
- The `granted`/`denied` states render strictly less than `default`
  (a paragraph only, no button), so if `default` holds up at every
  width, the other two — being simpler — hold up too.

Documented as a comment above `.actionRow` in
`OwnerDashboard.module.css` (right after the `.cardBody` rule it's
about). Same standing no-npm-registry-access caveat as every prior
verification session (`npm ping` → 403, since Task 2.10) — manual
trace against computed widths and actual copy, not a rendered/
screenshotted check.

`docs/TASKS.md`'s 8.2b-iv checkbox ticked. Next: **8.2b-v** — Sales
card (`.salesRow`/`.salesMeta` and its loading/error states) at all 4
widths.

---

**8.2b-v (Sales card verification) is done this session:** traced
`.salesRow`/`.salesMeta` and the loading/error states against the same
~256px worst-case card column established by 8.2b-ii/8.2b-iii. No
changes needed:
- `.salesRow` (`.salesLabel` + `.salesAmount`, `justify-content:
  space-between`, no `flex-wrap`) is the same shape as `.statusSummaryRow`
  (8.2b-iii) — each span's text has a natural break point (a space), so
  a flex item's default `min-width: auto`/min-content lets the longer
  span wrap onto a second line rather than force the row wider, if it
  ever needed to. At `font-size-title` (16px), even a large all-time
  total like "999999.50 ETB" comfortably fits beside "All time" at
  320px, so this stayed single-line at every breakpoint checked.
- `.salesMeta`'s completed-order-count sentence has no fixed width,
  wrapping the same way every other plain paragraph on this page does.
- Loading/error states reuse `.cardBody`/`.countsError`, already
  verified for the Orders card (8.2b-iii) and Order notifications card
  (8.2b-iv) — same classes, same conclusion, nothing new to check.

Documented as a comment above `.salesSummary` in
`OwnerDashboard.module.css`. Same standing no-npm-registry-access
caveat as every prior verification session (`npm ping` → 403, since
Task 2.10) — manual trace against computed widths and actual copy, not
a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2b-v checkbox ticked. Next: **8.2b-vi** — Quick
actions card (`.openToggleRow` status text + `ToggleSwitch`, and
`.actionRow` button wrapping) at all 4 widths.

---

**8.2b-vi (Quick actions card verification) is done this session:**
traced `.openToggleRow` (`StatusBadge` + `.openToggleHint` inside
`.openToggleStatus`, beside a `ToggleSwitch`) and `.actionRow`
(Add Food/View orders buttons) against the same ~256px worst-case card
column 8.2b-ii/iii/v established. `.actionRow` needed no changes — it's
the same shared `display: flex; flex-wrap: wrap` class already verified
for the Orders card's "View orders" link (8.2b-iii) and the
notifications card's "Enable notifications" button (8.2b-iv), just with
two buttons instead of one/zero, wrapping the same way if it ever ran
out of room, which it doesn't at 320px for "Add Food"/"View orders".

`.openToggleRow` was different — the first row on this page combining
two independently-sized nowrap-ish chunks (a `StatusBadge` + hint-text
min-content on one side, a fixed-track `ToggleSwitch` + one-word label
on the other) rather than one paragraph or one row of short badges.
Summing both sides' min-content (badge ~55-65px + `space-md` + the
hint sentence's longest unbreakable word, "Customers", ~60-65px at
`font-size-caption`; plus this row's own `space-lg` gap; plus
`ToggleSwitch`'s own 44px track + `space-sm` + its "Open"/"Closed"
label ~35-45px at `font-size-body`) lands right around ~250-260px —
effectively the same width as the ~256px column itself, with only a
few px of slack given the actual current copy. Nothing overflows today
against the real "Customers can('t) ... closed."/"right now." strings,
but the margin is thin enough that this row, unlike every other row
verified so far this task, had no fallback if it ever did — no
`flex-wrap` was set, unlike `.actionRow`'s own long-standing one.

Fix (the first actual CSS change since 8.2b-i's shell decision): added
`flex-wrap: wrap` to `.openToggleRow`, so a too-tight width drops the
`ToggleSwitch` to its own line below the status block instead of
forcing the row wider than its card column. Documented inline above
`.openToggleRow` in `OwnerDashboard.module.css` with the full min-content
math, rather than only in this log, same as every other 8.2b-* entry.
No visual change at any of the 4 verified breakpoints' actual widths —
this is a safety margin against future copy/locale changes, not a fix
to an observed break.

Same standing no-npm-registry-access caveat as every prior verification
session (`npm ping` → 403, since Task 2.10) — manual trace against
computed widths and actual copy, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2b-vi checkbox ticked — that completes 8.2b's own
lettered sub-split (i through vi); only **8.2b-vii** (the final
cross-card verification pass + status-update checkbox) remains before
8.2b as a whole, and then 8.2 as a whole, can be ticked.

---

**8.2b-vii (cross-card verification + status update) is done this
session:** the six prior sub-subtasks (8.2b-i through vi) each traced
one card's own internal layout in isolation; this pass looks at the
five `.card` divs together as `.page` actually renders them, at all 4
`ResponsiveGrid` breakpoints (320/768/1024/1280px, Task 2.7), plus the
one card (`Get your restaurant Live`) that never got its own lettered
subtask.

One real, non-breakpoint-specific gap surfaced: `.card` had no
`margin-bottom`, unlike `AdminDashboard.module.css`'s own
byte-for-byte-identical `.card` (already named as this page's layout
model in 8.2b-i's own comment) — which carries `margin-bottom:
var(--space-lg)`. With no rule producing space between siblings, the
Orders/Order notifications/Sales/Quick actions/Get-your-restaurant-Live
cards would stack border-to-border into one fused block at every width
equally, rather than reading as a column of distinct cards the way
`AdminDashboard.jsx`'s own stack already does. Not something any of
8.2b-ii through vi's own per-card checks could have caught, since each
only verified content *inside* one card, never the space *between*
cards.

Fix: added `margin-bottom: var(--space-lg)` to `.card`, matching
`AdminDashboard.module.css`'s value exactly. Checked against
`RoleShell`'s `.content` bottom padding (8.2b-ii) that the trailing
margin after the last card never collides with the fixed bottom nav at
any width. Documented inline above `.card` in
`OwnerDashboard.module.css`.

The unlettered fifth card, "Get your restaurant Live" (always
rendered, never gated behind any of the three `noRestaurantYet` flags)
has no CSS of its own beyond the shared `.card`/`.cardTitle`/
`.cardBody`/`.actionRow`/`.primaryButton`/`.secondaryButton` set —
every piece of which 8.2b-iii through vi already verified for other
cards using the same classes — so it needed no separate lettered
subtask of its own; this session's pass confirms it explicitly rather
than leaving it implicit.

Same standing no-npm-registry-access caveat as every prior verification
session (`npm ping` → 403, since Task 2.10) — manual trace against
computed widths and actual copy/markup, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.2b-vii checkbox ticked, which completes 8.2b's own
lettered sub-split and lets **8.2b** itself be ticked too. `8.2` as a
whole stays unticked — 8.2c through 8.2h (OwnerOrders/OrderDetail,
OwnerRestaurant, OwnerMenu/AddFood, OwnerAccount, RequestLive/
LiveStatus, and the final owner-nav-treatment check) are still
pending.

---

**Task 8.2c split into two lettered sub-subtasks** (8.2c-i, 8.2c-ii),
same convention as 8.2b's i-vii split. 8.2c as originally written bundled
two independently-laid-out screens — `OwnerOrders.jsx`
(`ListWithPagination`/`FilterBar`) and `OrderDetail.jsx` (owner mode) —
under one checkbox, so it's split by screen rather than left as a single
multi-screen task:
- 8.2c-i — `OwnerOrders.jsx`: `ListWithPagination`/`FilterBar` layout at
  all 4 widths
- 8.2c-ii — `OrderDetail.jsx` (owner mode) layout at all 4 widths

No verification-only closing sub-subtask was added (unlike 8.2b-vii),
since each of the two only touches one screen — the per-screen check
in 8.2c-i/8.2c-ii is the verification.

`docs/TASKS.md` updated accordingly. Next: **8.2c-i** — `OwnerOrders.jsx`
(`ListWithPagination`/`FilterBar`) layout at all 4 widths.

---

**8.2c-i (`OwnerOrders.jsx` verification) is done this session.** First,
a reference-vs-reality note: 8.2c's own title (and the roadmap entry
copied over from Task 5.12) names "`ListWithPagination`/`FilterBar`",
but `OwnerOrders.jsx` never imports `FilterBar` — its own doc comment
is explicit that a status filter is out of scope for this screen
("arguably Task 5.14's concern... not this screen's to invent ahead of
it"). `FilterBar` is only used by `Home.jsx` and `AdminOrders.jsx`
(6.9's search/filter task), not here. Treated as a stale label, not a
missing component — nothing to build or verify that isn't already
correctly absent.

Traced `OwnerOrders.module.css` and `ListWithPagination.module.css`
against the same 320/768/1024/1280 breakpoints and ~256px/~288px
worst-case columns 8.2b-ii/iii established. Two real gaps found and
fixed, both now documented as comments in their own files:

- **`.page` had no `max-width` cap.** Every other owner screen
  (Dashboard, Restaurant, Menu, Account) and the equivalent customer
  screen (`OrderHistory.jsx`, Task 8.1h — the same "`ListWithPagination`
  in a padded page" shape) already caps at 640px; this screen was
  missed. Above 640px (tablet/desktop/large-desktop) the order rows and
  pagination controls were stretching full-bleed edge to edge instead
  of centering in a 640px reading column like every sibling screen.
  Fixed by adding the same `max-width: 640px; margin: 0 auto; width:
  100%;` `OrderHistory.jsx` already uses.
- **`.pagination` (`ListWithPagination`, shared by this screen and
  6.4/6.9's own lists) had no `flex-wrap`.** At the narrowest supported
  width (320px), "Previous" + "Page X of Y" + "Next" fit today's
  typical page counts, but a restaurant with enough orders to reach a
  high `totalPages` (e.g. "Page 100 of 999") pushes the row past the
  ~288px worst-case column with three unbreakable pieces and no wrap —
  which would force the row wider than its container rather than
  degrade gracefully. Added `flex-wrap: wrap` plus a matching
  `row-gap`, so "Next" drops to its own line instead of overflowing;
  the common low-page-count case is visually unchanged.

Row content itself (`.rowHeader`'s `order_code` + `StatusBadge`,
`.customerName`, `.rowMeta`'s date + total) needed no changes:
`order_code` is a fixed-length `NTR-#####` format (5.15's
`submitOrder.js`) and `StatusBadge` is `white-space: nowrap` with short
text (8.2b-iii already established this for the same badge), so
`.rowHeader`'s unwrapped flex row never overflows; `.customerName` sits
in a column-flex row and wraps normally rather than overflowing for a
long name, the same `min-width: auto` reasoning 8.2b-iii's `.countsError`
finding already covered.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2c-i checkbox ticked. Next: **8.2c-ii** —
`OrderDetail.jsx` (owner mode) layout at all 4 widths.

---

**8.2c-ii (`OrderDetail.jsx`, owner mode, verification) is done this
session.** Traced `OrderDetail.module.css` against the same
320/768/1024/1280px breakpoints and ~256px worst-case card column
(`.page` padding + `.card` padding, both `space-lg`) 8.2b-ii/8.2c-i
already established. Three real gaps found and fixed, all now
documented inline in `OrderDetail.module.css` itself:

- **`.page` had no `max-width` cap** — the same gap 8.2c-i just found
  on `OwnerOrders.jsx`. This is a single-resource detail screen, the
  same shape as `AdminRestaurantDetail.jsx`/`AdminLiveRequestDetail.jsx`
  (both already capped at 640px) and `FoodDetails.jsx`, but had no cap
  of its own — above 640px the order card was stretching full-bleed
  instead of centering in a reading column like every comparable detail
  screen. Fixed to match.
- **`.actionRow`'s `New`-order buttons (Accept/Reject/Call Customer)
  had no `flex-wrap`**, unlike every other multi-button `.actionRow`
  this responsive pass has already covered (`OwnerDashboard.module.css`,
  `ListWithPagination.module.css`'s `.pagination`). Unlike 8.2b-vi's
  `.openToggleRow` finding (a thin margin, nothing overflowing yet),
  this one's min-content sum with today's real button copy — "Accept" +
  "Reject" + "Call Customer" (longest word "Customer") plus their
  padding and two `space-md` gaps — comes to roughly 272px against the
  ~256px worst-case column, an actual overflow at the narrowest
  supported width, not just future-proofing. Fixed with the same
  `flex-wrap: wrap` convention used elsewhere. The `Accepted`-order row
  (`Complete` alone) was never at risk — a lone `flex: 1` item can't
  overflow its own row.
- **`.item` (each order-line row: qty × food name, price) had no wrap
  fallback either**, and unlike `.header`'s order code or `.totalRow`'s
  "Total" label, `food_name_snapshot` is a `VARCHAR2(120)`
  (`docs/DB_SCHEMA.md`) field with no shorter enforced cap anywhere in
  this app, so — unlike 8.2b-iii's `.countsError` finding, where the
  realistic copy was already known to be safe — a single long unbroken
  word in a food name is a real, uncovered possibility here specifically.
  Added the same defensive `flex-wrap: wrap` 8.2b-vi already applied to
  `.openToggleRow` on the same "no observed break today, but no
  fallback either" reasoning: drops price to its own line under the
  name rather than ever forcing the row wider than the card.

Two areas checked and found to need no change: `.header` (order code +
`StatusBadge`) — order codes are a fixed `NTR-#####` format (5.15) and
every status value (`New`/`Accepted`/`Completed`/`Rejected`/`Expired`,
migration 0011) is short, so their combined min-content sits well under
the ~256px column even at 320px, same "fixed-format content" reasoning
8.2c-i already gave for this screen's own `order_code`. `.detailList`'s
`dt`/`dd` pairs (name/phone/location/note) are stacked in a
`flex-direction: column` list, so each takes the full column width and
wraps normally with no min-content risk, the same shape `OwnerDashboard`
plain-paragraph fields already established.

`ImageViewer`'s payment-screenshot thumbnail (`.screenshotThumbnail`,
fixed 96×96px) wasn't re-verified from scratch — it's a shared
component (Task 2.6) with no screen-specific sizing here, same
"shared-class conclusions carry over, not re-derived" approach 8.2b-iv
took for its own shared `.cardBody`/`.actionRow`.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths and actual copy/markup (including the DB column length
for `food_name_snapshot`), not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2c-ii checkbox ticked, which completes 8.2c's own
lettered sub-split and lets **8.2c** itself be ticked too. Next:
**8.2d** — `OwnerRestaurant.jsx` (profile fields, logo/cover upload,
hours/service-area/payment-method sub-sections) at all 4 widths.

---

**Task 8.2d split into two lettered sub-subtasks** (8.2d-i, 8.2d-ii),
same convention as 8.2c's i-ii split. 8.2d as originally written bundled
two independently-laid-out groups of sections on one page — the
profile-fields/logo/cover group (which, per this file's own header
comment on `OwnerRestaurant.jsx`, shares one `mutate`/`saveError`/
`justSaved` save-status banner) and the three separate CRUD
sub-resource sections (opening hours, service areas, payment methods)
below it, each with its own independent state — under one checkbox, so
it's split by section-group rather than left as a single
whole-page task:
- 8.2d-i — `OwnerRestaurant.jsx`: profile fields (name/description
  form) and logo/cover upload at all 4 widths
- 8.2d-ii — `OwnerRestaurant.jsx`: opening hours, service areas, and
  payment methods sub-sections at all 4 widths

No verification-only closing sub-subtask was added (unlike 8.2b-vii),
same reasoning 8.2c gave: each half's own pass is its own verification.

`docs/TASKS.md` updated accordingly. Next: **8.2d-i** —
`OwnerRestaurant.jsx` profile fields (name/description form) and
logo/cover upload layout at all 4 widths.

---

**8.2d-i (`OwnerRestaurant.jsx` profile-fields/logo/cover verification)
is done this session.** First, a scope note: neither 8.2d-i's own title
nor the original 8.2d title it was split from names the Open/Closed
toggle (`.openToggleRow`, Task 5.8) or the Categories section (5.4),
even though both render on this same page. Treated the toggle as
in-scope for this half and Categories as in-scope for 8.2d-ii instead
of leaving either unverified by either half — this file's own header
comment is explicit that Open/Closed (5.8) deliberately shares the
name/description/logo/cover form's `mutate`/`saveError`/`justSaved`
state ("not its own state... folding logo/cover in alongside
name/description"), which puts it with this half's group, while
Categories is called out in that same comment as "a genuinely separate
sub-resource" with its own modal-scoped state — the same shape as the
opening-hours/service-areas/payment-methods sections 8.2d-ii covers.

Traced `OwnerRestaurant.module.css` against the same 320/768/1024/1280
breakpoints 8.2a-8.2c already used. `.page`'s `max-width: 640px` cap
was already in place (confirmed correct per `OwnerOrders.module.css`'s
own comment, which names this screen as one of the three that already
had it) — no page-shell change needed.

One real gap found and fixed: **`.openToggleRow` had no `flex-wrap`.**
This is the same `.openToggleStatus`/`.openToggleHint`-vs-`ToggleSwitch`
shape `OwnerDashboard.module.css`'s own `.openToggleRow` already
worked through for Task 8.2b-vi (same class names, same components,
copied markup) — badge + hint sentence on one side, a fixed-size
`ToggleSwitch` on the other, no wrap declared. Re-measured for this
screen's own column: `.page`'s 288px inner width at the narrowest
320px viewport, minus this row's own `space-md` side padding (it isn't
inside a `.card` the way `OwnerDashboard`'s version is), leaves 264px —
against the same ~256px worst-case content sum 8.2b-vi's comment
derived (`.openToggleStatus` ~145px + this row's `space-lg` gap +
`ToggleSwitch` ~95px). That's only ~8px of slack, thinner than
`OwnerDashboard`'s own case, with the same "no fallback if a
translation or font substitution lengthens it" risk. Added the same
`flex-wrap: wrap` fix, documented in a comment above the rule
cross-referencing 8.2b-vi's derivation rather than re-deriving it from
scratch. No visual change at any of the 4 verified breakpoints' actual
widths/copy — a safety margin, not a fix to an observed break.

`.imageFields` (two `ImageUploadField`s, Task 5.3) and `.form`
(`FormField` name/description, Task 5.2) needed no changes: both are
the same shared components already verified at all 4 breakpoints in
8.1e (`FormField`, `CustomerInfo.jsx`/`PaymentMethod.jsx`) and 8.1f
(`ImageUploadField`, `PaymentScreenshot.jsx`) — `width: 100%` controls
and a flex-column field/preview layout with no fixed widths beyond
`ImageUploadField`'s own 240px preview cap, which already shrinks
below that on narrow viewports since it's `max-width` not `width`.
Shared-class conclusions carried over rather than re-derived, same
approach 8.2b-iv took for `ImageViewer`'s shared styling.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2d-i checkbox ticked. Next: **8.2d-ii** —
`OwnerRestaurant.jsx` opening hours, service areas, and payment
methods sub-sections (plus, per this session's scope note above,
Categories) at all 4 widths.

---

**8.2d-ii (`OwnerRestaurant.jsx` categories/opening-hours/service-areas/
payment-methods verification) is done this session** — no code changes
needed, verified as-is at all 4 breakpoints. Traced each piece against
the same 320px-viewport/~262px-column figures 8.2d-i established:

- **`.sectionHeader`** (shared by all three CRUD sections, plus
  Categories per this session's scope note): `.sectionHeading` and
  `.addButton` both wrap freely — neither has `white-space: nowrap` —
  so even the longest pairing ("Payment methods" + "Add payment
  method") shrinks to per-word min-content well under the available
  column, the same text-wrapping reasoning 8.2b-iii's `.countsError`
  finding already relied on. Unlike `.openToggleRow` (8.2d-i), nothing
  here pairs unbreakable text against a fixed-size non-text control.
- **`.listRow`/`.listRowActions`**: `.listRowActions` is `flex-shrink: 0`
  (Edit/Delete links for Categories/Service areas; `ToggleSwitch` +
  Edit for Payment methods, with the same ~95px `ToggleSwitch`
  min-content floor 8.2d-i derived), but `.listRowName` and
  `.paymentMethodInfo` (already `min-width: 0`) both shrink and wrap
  normally — same `.customerName` reasoning 8.2c-i gave for an
  analogous name-vs-fixed-actions row.
- **`.openingHoursRow`** already had `flex-wrap: wrap` from Task 5.5b —
  the one row in this file that did before 8.2d-i brought
  `.openToggleRow` in line with it. Its four children (fixed-basis day
  label, `ToggleSwitch`, the two `type="time"` `FormField`s, row
  actions) drop to their own line as a unit rather than overflowing.
- **`Modal`** (`size="sm"`, 360px cap, used by all three add/edit and
  delete-confirm dialogs): first responsive-pass use of this component,
  so nothing to carry over from an earlier task — checked fresh.
  `.dialog` is `width: 100%` under its cap, already shrinking to fit
  `.overlay`'s `space-lg`-padded width at 320px; the footer's two
  buttons are both short single words and fit comfortably. The
  `FormField`s inside each modal's form are the same shared,
  already-verified (8.1e) component.

Added one consolidated comment above `.sectionHeader` in
`OwnerRestaurant.module.css` documenting all of the above, same "record
the verification even when nothing changed" approach Task 8.2a used.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2d-ii checkbox ticked, which completes 8.2d's own
lettered sub-split and lets **8.2d** itself be ticked too. `8.2` as a
whole stays unticked — 8.2e through 8.2h (OwnerMenu/AddFood,
OwnerAccount, RequestLive/LiveStatus, and the final owner-nav-treatment
check) are still pending. Next: **8.2e** — `OwnerMenu.jsx` (list) and
`AddFood.jsx` (add/edit form) at all 4 widths.

---

**Task 8.2e split into two lettered sub-subtasks** (8.2e-i, 8.2e-ii),
same convention as 8.2c's i-ii split. 8.2e as originally written bundled
two independently-laid-out screens — `OwnerMenu.jsx` (list) and
`AddFood.jsx` (add/edit form) — under one checkbox:
- 8.2e-i — `OwnerMenu.jsx`: food list layout at all 4 widths
- 8.2e-ii — `AddFood.jsx`: add/edit form layout at all 4 widths

`docs/TASKS.md` updated accordingly.

**8.2e-i (`OwnerMenu.jsx` verification) is done this session — no code
changes needed.** This screen turned out to already have every
defensive pattern 8.2d-i/8.2d-ii had to add or confirm on
`OwnerRestaurant.jsx`:
- `.page` already 640px-capped.
- `.foodNameRow` (name + `StatusBadge`) already had `flex-wrap: wrap`
  from Task 5.9b — the same wrap `.openingHoursRow` already had and
  `.openToggleRow` was missing before 8.2d-i's fix.
- `.foodInfo` already sets `min-width: 0`, same as `.paymentMethodInfo`.
- `.listRowActions` holds three short link-style actions (Edit/
  Hide-Show/Delete) rather than two, but all three are single-word
  text with no fixed-size non-text control — its ~134px min-content
  sits comfortably under the ~137px `ToggleSwitch`+Edit floor 8.2d-ii
  already found safe in the same ~262px worst-case column, with
  `.foodInfo` still free to shrink into the remainder.
- `.sectionHeader`'s heading/`.addButton` pairing is the same
  wraps-freely shape 8.2d-ii verified, and shorter here ("Menu"/"Add
  food" vs. "Payment methods"/"Add payment method").
- The delete-confirmation `Modal` (`size="sm"`) is the same
  already-verified (8.2d-ii) shape.

Documented all of it in one comment above `.listRow` in
`OwnerMenu.module.css`, same "record the verification even when
nothing changed" approach used for 8.2a/8.2d-ii.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2e-i checkbox ticked. Next: **8.2e-ii** —
`AddFood.jsx` add/edit form layout at all 4 widths.

---

**8.2e-ii (`AddFood.jsx` verification) is done this session — no code
changes needed.** This is the simplest screen checked in this whole
pass: one `ImageUploadField` (already verified 8.1f) followed by four
stacked `FormField`s — name/description/price/category-select,
already-verified 8.1e, including the `select.control` branch for
Category — and one `align-self: flex-start` submit button, all inside
a single `flex-direction: column` `.form`. No sibling elements ever
share a row, so there's no min-content-sum/flex-wrap question to work
through the way `.openToggleRow`, `.sectionHeader`, or
`.listRowActions` needed elsewhere in this pass — every control is
already `width: 100%` (or sized to its own short label, for the submit
button) inside a `.page` that matches every other owner screen's
640px cap. Documented in a comment above `.form` in
`AddFood.module.css`, same "record the verification even when nothing
changed" approach used throughout this pass.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2e-ii checkbox ticked, which completes 8.2e's own
lettered sub-split and lets **8.2e** itself be ticked too. `8.2` as a
whole stays unticked — 8.2f through 8.2h (OwnerAccount, RequestLive/
LiveStatus, and the final owner-nav-treatment check) are still
pending. Next: **8.2f** — `OwnerAccount.jsx` at all 4 widths.

---

**8.2f (`OwnerAccount.jsx` verification) is done this session — no code
changes needed.** Same "no custom row, nothing to analyze" shape
8.2e-ii's `AddFood.jsx` just was: two independent stacked `FormField`
forms (Profile — full name/email/phone; Password — current/new/confirm
— both the same already-verified 8.1e component) plus one full-width
`.logoutButton`, with no element ever sharing a row with another.
`.page` matches every other owner screen's 640px cap. Documented in a
comment above `.page` in `OwnerAccount.module.css`, same "record the
verification even when nothing changed" approach used throughout this
pass.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 — manual trace against computed widths and
actual copy/markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2f checkbox ticked. `8.2` as a whole stays
unticked — 8.2g (`RequestLive.jsx`/`LiveStatus.jsx`) and 8.2h (the
owner-nav-treatment check) are still pending. Next: **8.2g** —
`RequestLive.jsx` (`Wizard` component) and `LiveStatus.jsx` at all 4
widths.

---

**8.2g (`RequestLive.jsx`/`LiveStatus.jsx` verification) is done this
session — no code changes needed.** Both screens already use the same
"centered, capped `width:100%; max-width:480px` card, bordered shell
since this screen sits outside `RoleShell`" shape `OwnerRegistration.jsx`
(8.2a, 420px) established, so the page-shell half of this check was
already covered by precedent. The real new ground here is Wizard (Task
2.20) — this is its **first responsive verification against a real
screen**, since `ComponentSandbox`'s own preview (2.21/2.22) only ever
did visual QA against mock data, not a breakpoint pass.

Traced all three files against the same ~256px worst-case content
column (`.page`'s and `.card`'s own `space-lg` padding on both sides)
every `.card`-based screen in this pass has landed on:

- `RequestLive.jsx`'s Step 1 `.feeInfo` (`dl`/`dt`/`dd` pairs, each in
  its own `flex-direction: column` `.feeInfoRow`) wraps like any other
  plain-paragraph field already verified elsewhere in this pass — no
  side-by-side pairing to create a min-content-sum question, including
  for the optional, uncapped-length `registration_instructions` value.
- Step 2's `ImageUploadField` is the same shared, already-verified
  (8.1f) component — nothing screen-specific to re-check.
- `Wizard.module.css`'s `.indicator`: each `.indicatorItem` is
  `flex: 1`, giving ~128px per item at this screen's real 2-step usage;
  `.indicatorLabel` has no `white-space: nowrap`, so even its longest
  word ("Screenshot", ~70px) fits inside that share without needing to
  wrap at any of the 4 breakpoints checked, with real wrapping as the
  graceful fallback if a future caller's label were longer.
  `.indicatorLine`'s intentional overflow past its own item's right
  edge (the connecting-line effect between circles) is by-design
  geometry, not a viewport-width bug.
- `Wizard.module.css`'s `.actions`: two buttons, no `flex-wrap` — unlike
  the 3+-button `.actionRow`s elsewhere in this pass that needed one
  (`OrderDetail.jsx`'s Accept/Reject/Call Customer, 8.2c-ii). Measured
  against `RequestLive.jsx`'s real longest button text
  ("Submitting…"): combined min-content of both buttons plus their gap
  totals ~212px, comfortably under the 256px column — real margin to
  spare, not a thin-margin case like 8.2b-vi's `.openToggleRow`
  (~8px slack) or an actual overflow like 8.2c-ii's `.actionRow`, so no
  defensive `flex-wrap` was added.
- `LiveStatus.jsx`'s `.statusHeader` (heading + `StatusBadge`,
  `justify-content: space-between`, no `flex-wrap`) was the one row
  worth checking explicitly, superficially resembling 8.2b-vi's
  `.openToggleRow` finding. Different conclusion: a flex item's default
  `min-width: auto` resolves to *min-content* (longest unbreakable
  word), so the heading can shrink-wrap without an explicit
  `min-width: 0` the way rows with *multiple* short fixed-size siblings
  needed one elsewhere in this pass. Checked against all three real
  headings ("Awaiting admin approval", "You're Live!", "Your request
  was rejected") — longest word under 90px, comfortably inside the
  ~179px remaining after the badge's own ~65px min-content and the
  row's `space-md` gap. No overflow at any width; a heading wrapping to
  2 lines next to a single-line badge is a cosmetic
  `align-items: center` quirk, not a broken layout.
- `LiveStatus.jsx`'s `.primaryButton`/`.retryButton` are always alone
  on their own row, so no min-content-sum question applies to them the
  way multi-button `.actions`/`.actionRow`s elsewhere needed checking.

All of the above documented inline as comments above `.page` in both
`RequestLive.module.css` and `LiveStatus.module.css`, and above
`.wizard` in `Wizard.module.css` (the shared component's own first
real-use verification, for whoever next builds a second Wizard-based
screen to find already worked out) — same "record the verification
even when nothing changed" approach used throughout this pass.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths and real copy/markup, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.2g checkbox ticked. `8.2` as a whole stays
unticked — only **8.2h** (verify `RoleShell`'s owner nav switches from
bottom tabs to its wider-viewport treatment correctly on every owner
screen checked so far) remains before `8.2` itself can be ticked. Next:
**8.2h**.

---

**8.2h (`RoleShell` owner-nav cross-screen verification) is done this
session — no code changes needed.** This is Task 8.2's own closing
check, mirroring 8.2b-vii's "the per-card checks never looked at the
cards *together*" reasoning, but at the level of the whole owner
section: 8.2a-8.2g each verified one screen's own *internal* content
layout; this task verifies the *shared nav chrome* (`RoleShell
role="owner"`) those screens sit inside, together, across all of them
at once, rather than trusting seven independent internal-content checks
to have implicitly covered it.

First, a scope correction worth recording plainly rather than silently
working around: this task's own title (inherited from the original
roadmap wording) asks to verify the owner nav "switches from bottom
tabs to whatever wider-viewport treatment Task 2.18 defined" — but per
`RoleShell.jsx`'s own header comment, Task 2.18 never defined a
different wide-viewport treatment for the owner role at all. Owner
deliberately shares the exact same bottom-nav render path as customer
(Task 2.17); only the admin role (2.19) gets a genuinely different
layout (a sidebar). The only wide-viewport accommodation either
bottom-nav role gets is Task 8.1i's own shared `.navInner` 480px cap.
Treated as a stale task title, not a missing feature to build — same
"stale label, not a missing component" call 8.2c-i already made for its
own title's mismatched `FilterBar` reference — so this session verified
the real thing (the shared bottom-nav chrome, including 8.1i's cap)
against all seven owner screens instead.

Confirmed, on behalf of all seven `RoleShell role="owner"` screens
(`OwnerDashboard.jsx`, `OwnerOrders.jsx`, `OrderDetail.jsx` in owner
mode, `OwnerRestaurant.jsx`, `OwnerMenu.jsx`, `AddFood.jsx`,
`OwnerAccount.jsx`) at once, since none passes a `className` override
to `RoleShell` and none renders anything outside its
`<RoleShell>...</RoleShell>` boundary — making the nav chrome itself
byte-for-byte identical across all seven, not independently breakable
per screen:
- `.content`'s `padding-bottom` (reserving the nav bar's own height
  plus safe-area-inset) lives entirely on `RoleShell`'s own wrapper,
  outside any of the seven screens' own CSS, so nothing screen-specific
  could shrink or override it — already individually confirmed for
  `OwnerDashboard.jsx` in 8.2b-ii, and structurally guaranteed to hold
  the same way for the other six.
- The "Orders" nav badge (Task 5.21) is positioned off a fixed-size
  icon, not relative to `.navInner`'s own capped width, so it's
  unaffected by breakpoint the same way `StatusBadge` (8.2b-iii) and
  every other short nowrap badge in this pass already were.
- `OrderDetail.jsx`'s `role={role}` prop only resolves to `"owner"` on
  the owner-side route this task covers; its admin-mode sidebar
  rendering is explicitly out of scope, left for Task 8.3.

Documented as a comment above `.shell` in `RoleShell.module.css` itself
— the shared component, not any one of the seven screens — since the
conclusion belongs to the chrome, not to any single caller.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths, real markup, and each screen's own route wiring in
`App.jsx`, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.2h checkbox ticked, which completes **Task 8.2 as a
whole** (8.2a through 8.2h, all owner-screen responsive work) — the
second of Phase 8's three per-role responsive passes (8.1 customer,
now 8.2 owner) is done. Next: **8.3** — the admin responsive pass,
starting with **8.3a**, `AdminLogin.jsx` at all 4 widths.

---

**8.3a (`AdminLogin.jsx` verification) is done this session — no code
changes needed.** Same shape as `OwnerLogin.jsx` (8.2a): a
`width:100%; max-width:420px` `.card`, centered, with every child
(`FormField`'s inputs, the `width:100%` `.primaryButton`) already
fluid inside it — the identical "centered, capped single column,
bordered card since this screen sits outside `RoleShell`" pattern 8.2a
established, same 420px cap. `FormField` is the same shared,
already-verified (8.1e) component. No multi-element rows anywhere on
this screen (heading, instructions, two stacked fields, an error
message, one full-width button — nothing ever shares a row with a
sibling), so there's no min-content-sum/flex-wrap question the way
other, denser screens in this pass needed to work through.

One non-responsive observation recorded while here rather than
silently worked around: `.successBanner`/`.linkButton` in
`AdminLogin.module.css` are unused, copy-pasted-over dead code from
`OwnerLogin.module.css` — `AdminLogin.jsx` has no self-registration
flow (no admin signup screen exists anywhere in this codebase) and so
never renders a `justRegistered` banner or a register link, unlike
`OwnerLogin.jsx` which genuinely uses both. Left as-is: cleanup, not a
layout bug, and out of scope for a verification-only responsive-pass
session — flagged in a comment in the file itself for whoever next has
reason to touch its markup.

Documented in a comment above `.page` in `AdminLogin.module.css`, same
"record the verification even when nothing changed" approach used
throughout Task 8.1/8.2.

Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths and real copy/markup, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.3a checkbox ticked. Next: **8.3b** —
`AdminDashboard.jsx` (`adminDashboardSummary`, Task 6.3) widgets reflow
at all 4 widths.

---

**8.3b (`AdminDashboard.jsx` verification) is done this session — no
content-layout changes needed, but one real, cross-cutting finding
recorded rather than silently worked around.** `.page`'s own
`max-width: 640px; margin: 0 auto` shell is the exact one
`OwnerDashboard.module.css`'s 8.2b-i comment already names *this* file
as the original source of — so the page-shell question was already
settled before this session even started; running the actual
verification pass against it is what this task did.

**The real finding: the admin sidebar's fixed 220px width makes the
320px ("mobile") breakpoint unusable on every admin screen today, not
just this one** — `RoleShell.jsx`'s own header comment already flags
this as deliberate (Task 2.19's sidebar is single-breakpoint,
always-visible, no collapse/hamburger, with Task 8.3 — this phase —
named as where it gets addressed) and confirmed by re-reading
`RoleShell.module.css` directly: no media query anywhere collapses or
hides `.sidebar`/`.contentSidebar` below any width. At a 320px
viewport, `.contentSidebar`'s `margin-left: 220px` leaves roughly
100px for content — nowhere near enough regardless of what any
individual screen's own CSS does. This is a shared-shell problem, not
something `AdminDashboard.module.css`'s totals grid or activity feed
could meaningfully patch around on its own, same "the shared chrome,
not any one caller" scoping `RoleShell.module.css`'s own 8.2h comment
already used for the equivalent owner-nav question. **Task 8.3g (this
pass's own closing task, occupying the same end-of-pass position
8.1i/8.2h held for their own passes) is where the sidebar's actual
mobile treatment gets decided** — this session's own 768/1024/1280px
checks below assume 8.3g resolves the sub-768px case once, for every
admin screen at once, rather than each of 8.3b-8.3f needing to
separately flag or patch around it.

At 768px (the first width where this screen is actually usable):
content area is 768 − 220 (sidebar) = 548px, comfortably inside
`.page`'s own 640px cap; at 1024/1280px it only grows. Within that:
- `.totalsGrid`'s `@media (min-width: 480px)` 2-col→4-col switch is a
  viewport-width query (no container queries anywhere in this
  codebase), so it fires correctly at 768px+ regardless of the
  sidebar's own offset — four short stat columns fit easily.
- `.activityRow`'s `.activityMain` (`min-width: 0`) correctly reserves
  space for the fixed `.activityTime` via a deliberate
  `text-overflow: ellipsis` truncation on `.activityDescription` —
  genuinely different from the "let it wrap" pattern most rows
  elsewhere in this pass use, and the right call here since this is a
  single-line list row where wrapping would make every row a different
  height as the feed mixes short/long restaurant names.
- `.countsError` repeats the same button+text row `OwnerDashboard.jsx`'s
  identical class already had verified (8.2b-iii) — same conclusion,
  nothing new to check.

Documented as a comment above `.page` in `AdminDashboard.module.css`.
Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths and real markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.3b checkbox ticked. Next: **8.3c** —
`AdminRestaurants.jsx` (`ListWithPagination`/`SearchBar`) and
`AdminRestaurantDetail.jsx` at all 4 widths.

---

**8.3c (`AdminRestaurants.jsx`/`AdminRestaurantDetail.jsx` verification)
is done this session — no code changes needed.** Both screens share the
same `max-width: 640px; margin: 0 auto` `.page` shell every admin/owner
dashboard-or-list screen in this pass already uses, and the same
deferred-320px-sidebar caveat 8.3b's own comment documents in full
(not re-litigated per-screen — see that entry, or the two files' own
8.3c comments, for the complete reasoning); both are genuinely usable
starting at 768px, where the sidebar leaves 548px+ of content area.

`ListWithPagination`'s own `.pagination` already carries the
`flex-wrap: wrap` fix Task 8.2c-i added for `OwnerOrders.jsx`'s
identical use of the same shared component — automatic here too, not
something this screen needed to repeat.

One real piece of reasoning worth recording explicitly rather than
just asserting "safe": `AdminRestaurants.jsx`'s `.rowHeader` pairs a
`nowrap`/`ellipsis`-truncated `.name` against a `flex-shrink: 0`
`.badges` group with no explicit `min-width: 0` on `.name` — at a
glance this looks like the same missing-`min-width:0` gap 8.2c-i/
8.2d-i had to fix elsewhere in this pass. It isn't one: `.name`'s own
`overflow: hidden` (needed for the ellipsis truncation itself) already
triggers the CSS Flexbox spec's "automatic minimum size is zero when
the item's own overflow isn't `visible`" rule, distinct from the
*wrap*-based min-content shrinking (longest unbreakable word) every
other row in this whole pass has relied on instead. Confirmed correct
as authored, not silently assumed.

`AdminRestaurantDetail.jsx` was already careful before this session:
`.headerText`'s `min-width: 0` (the wrap-based pattern, since its own
`.name` has no truncation rule and instead wraps normally — the right
call for a detail-page heading vs. a scannable list row), `.badges`'
own `flex-wrap: wrap`, `.coverThumbnail`'s negative-margin bleed staying
contained by `.card`'s `overflow: hidden`, and `.actionRow`'s lone
`flex: 1` button (Suspend XOR Reactivate, never both, so nothing to
overflow) all held up with no changes needed. `ImageViewer` (Task 2.6)
is used here for the first time in an *admin* context — logo/cover
photos — but it's the same shared, already-verified component.

Documented as comments above `.page` in both files' own
`.module.css`. Same standing no-npm-registry-access caveat as every
verification session since Task 2.10 (`npm ping` → 403) — manual trace
against computed widths and real markup, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.3c checkbox ticked. Next: **8.3d** —
`AdminLiveRequests.jsx` and `AdminLiveRequestDetail.jsx` at all 4
widths.

---

**8.3d (`AdminLiveRequests.jsx`/`AdminLiveRequestDetail.jsx`
verification) is done this session — no code changes needed.** Same
`.page` shell and deferred-320px-sidebar caveat as every admin screen
checked so far (see `AdminDashboard.module.css`'s 8.3b comment for the
full reasoning, not repeated per-screen).

`AdminLiveRequests.jsx`'s `.rowHeader` is the same nowrap-ellipsis
pattern `AdminRestaurants.jsx`'s own `.rowHeader` already worked
through (8.3c) — `.name`'s own `overflow: hidden` already zeroes its
automatic min-width per the CSS Flexbox spec, so it correctly shrinks
against `.amount`'s `flex-shrink: 0` without needing an explicit
`min-width: 0`. Same conclusion, not re-derived from scratch.

`AdminLiveRequestDetail.jsx`'s `.header` is the same wrap-based
`.name`-next-to-a-badge shape `LiveStatus.module.css`'s own
`.statusHeader` already worked through (8.2g) — safe for the same
reason (min-content is only the longest word, not the full line).

The one thing genuinely re-measured rather than assumed by analogy:
`.actionRow`'s two buttons (Approve/Reject) — superficially like
`OrderDetail.jsx`'s own 3-button `.actionRow` finding (8.2c-ii, a real
overflow needing `flex-wrap: wrap`), but different once actually
summed. Both are `flex: 1`, but `min-width: auto` still floors each at
its own min-content regardless of `flex-basis: 0%`. Real min-content
sum ("Approve" + "Reject" + the row's own gap) lands around ~184px
against the same ~256px worst-case column this whole pass has used —
~72px of genuine margin, not a thin-margin case (8.2b-vi's
`.openToggleRow`, ~8px slack) or an actual overflow (8.2c-ii's
3-button row). No defensive `flex-wrap` added; two short-word buttons
at this column width don't need it the way three longer ones did.

Documented as comments above `.page` in both files. Same standing
no-npm-registry-access caveat as every verification session since Task
2.10 (`npm ping` → 403) — manual trace against computed widths and
real markup, not a rendered/screenshotted check.

`docs/TASKS.md`'s 8.3d checkbox ticked. Next: **8.3e** —
`AdminOrders.jsx` and `OrderDetail.jsx` (admin mode, Task 6.11b) at
all 4 widths.

---

**8.3e (`AdminOrders.jsx`/`OrderDetail.jsx` admin-mode verification) is
done this session — no code changes needed.** Same `.page` shell (640px
cap) and deferred-320px-sidebar caveat as every admin screen checked so
far in this pass (see `AdminDashboard.module.css`'s 8.3b comment for the
full reasoning, not repeated per-screen) — both screens are genuinely
usable starting at 768px, where the sidebar leaves 548px+ of content
area.

`AdminOrders.jsx`'s own `.filters` row (6.10b's restaurant/status
`FilterBar` dropdowns plus the date `FormField`) already wraps
(`flex-wrap: wrap`) with no min-content-sum risk — a native `<select>`'s
own width is intrinsic to its options' text, not forced onto one
unbreakable line the way multi-button `.actionRow`s elsewhere in this
pass were. `.row`'s `.rowHeader`/`.rowMeta` are the same fixed-format-
content shapes (`order_code`'s `NTR-#####` format, formatted price/date
strings) `OwnerOrders.module.css`'s own row already established as safe
(8.2c-i); `.restaurantName`/`.customerName` are plain block-level divs,
not flex siblings sharing a row, so they simply wrap regardless of
`restaurants.name`'s (`VARCHAR2(80)`) or `orders.customer_name`'s
(`VARCHAR2(120)`) length — no min-content-sum question a block-level
div doesn't have.

`OrderDetail.jsx`'s `role="admin"` mode (reached via this screen's own
6.11b tap-through) renders strictly less than the owner mode 8.2c-ii
already verified and fixed: `!isAdmin &&` guards the entire
Accept/Reject/Call-Customer/Complete `.actionRow` block, including the
one real overflow (three unwrapped buttons) 8.2c-ii already found and
fixed there — since admin mode shares the identical `.page`/`.card`/
`.item` DOM and CSS with owner mode and simply omits that block, every
fix already made carries over unchanged rather than needing to be
re-derived for a second role.

Documented as comments above `.filters` in `AdminOrders.module.css` and
above 8.2c-ii's own comment block in `OrderDetail.module.css`. Same
standing no-npm-registry-access caveat as every verification session
since Task 2.10 (`npm ping` → 403) — manual trace against computed
widths and real markup/DB column lengths, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.3e checkbox ticked. Next: **8.3f** —
`AdminSettings.jsx` at all 4 widths.

---

**8.3f (`AdminSettings.jsx` verification) is done this session — no
code changes needed.** Same `.page` 640px cap and deferred-320px-
sidebar caveat as every admin screen checked so far (see
`AdminDashboard.module.css`'s 8.3b comment for the full reasoning, not
repeated per-screen) — usable starting at 768px, where the sidebar
leaves 548px+ of content area.

`.form`'s stacked `FormField`s (including the `as="select"` Timeout
field and the conditionally-rendered Custom-minutes field) are the
same shared, already-verified (8.1e) component in a single-column
layout — no sibling-row pairing anywhere in the form itself.

The one custom row, `.toggleRow` (Notify-before-expiry label+hint vs.
`ToggleSwitch`), superficially resembles the `.openToggleRow` shape
`OwnerDashboard.module.css` (8.2b-vi) and `OwnerRestaurant.module.css`
(8.2d-i) each needed a defensive `flex-wrap: wrap` fix for — but this
one turned out to already be built correctly, with no fix needed:
`.toggleStatus` already carries `min-width: 0` (present from this
screen's original build, not added this session), which those two
other rows' status blocks were missing. With `min-width: 0` set,
`.toggleStatus` can shrink below its own min-content and let its text
wrap internally, bounding the row's total width by its container
rather than by the sum of both children's natural widths — the same
root cause those two other fixes addressed via `flex-wrap: wrap` on
the row itself, just solved one level down here, on the one shrinking
child, which works equally well since `ToggleSwitch`'s own fixed-width
track is correctly never the side asked to give. Checked against the
real, longest hint copy at 768px's ~548px content column — wraps onto
2 lines with room to spare.

Documented as a comment above `.page` in `AdminSettings.module.css`.
Same standing no-npm-registry-access caveat as every verification
session since Task 2.10 (`npm ping` → 403) — manual trace against
computed widths and real copy/markup, not a rendered/screenshotted
check.

`docs/TASKS.md`'s 8.3f checkbox ticked. Next: **8.3g** — verify
`RoleShell`'s admin sidebar (Task 2.19) collapses/hides correctly at
the mobile breakpoint on every admin screen checked so far in this
pass (8.3a-8.3f), since a sidebar nav is desktop-first unlike the
other two roles' bottom nav — this is Task 8.3's own closing task,
same position 8.1i/8.2h held for their own passes, and where the
standing deferred-320px-sidebar caveat every 8.3a-8.3f entry has
flagged finally gets resolved one way or another.

---

**8.3g (`RoleShell` admin sidebar mobile treatment) is done this
session — a real fix, not a verify-only pass like 8.3a-8.3f.** Unlike
8.1i/8.2h (each confirming an *existing* wide-viewport nav behavior
already worked), the standing gap every 8.3a-8.3f entry flagged was
real and unfixed: `RoleShell.jsx`'s own header comment had explicitly
deferred "narrow-screen adaptation" for the admin sidebar to this
exact task, and no media query anywhere collapsed or hid `.sidebar`
below any width — at 320-767px, the fixed 220px rail plus its content
offset left every admin screen unusably cramped, confirmed and
re-confirmed by every 8.3a-8.3f session's own caveat rather than fixed
by any of them (each was scoped to that screen's own *content* layout,
not the shared chrome around it — same split 8.2b-vii/8.2h already
drew between "one screen's internal layout" and "the shared nav chrome
around all of them").

**Decision: below 768px, hide `.sidebar` and render the same four
admin destinations as a bottom tab bar instead — reusing the exact
`.nav`/`.navInner`/`.navItem`/`.icon`/`.label` markup and classes
already built and verified for the customer/owner roles (2.17/2.18,
8.1i/8.2h)** — not a new hamburger/off-canvas drawer. `RoleShell.jsx`'s
own header comment had previously raised "building a collapsing/
off-canvas sidebar now would be guessing at a mobile admin UX nothing
in the spec asks for" as the reason to defer this; that reasoning still
holds against inventing a *new* interaction pattern, but reusing a
pattern this codebase already has — built, styled, and verified at
every breakpoint for two of the three roles — isn't a guess the same
way. `docs/NATRA_MASTER_PROMPT.md`'s own "Keep admin lightweight" line
(cited in this file's own `RoleShell.jsx` header comment) also points
the same direction: a bottom tab bar is the lighter-weight choice
next to a JS-driven slide-out drawer, which would need its own open/
close state, a scrim/overlay, focus-trapping, and an entry point
(hamburger icon) this task would otherwise have to design and build
from nothing.

**Implementation, real code, both files:**
- `RoleShell.module.css`: `.shellSidebar` now also declares
  `--roleshell-nav-height: 56px` (previously only declared on `.shell`,
  which the admin branch never renders — without it, a `var()` read
  from inside `.shellSidebar`'s own subtree would have nothing to
  resolve from). A `@media (max-width: 767px) { .sidebar { display:
  none; } }` block, placed *after* `.sidebar`'s own base rule (source
  order matters at equal specificity — an earlier draft of this file
  had it placed before the base rule by mistake, which the base rule's
  own later, unconditional `display: flex` would have silently
  overridden at every width; caught before finalizing, not shipped).
  `.contentSidebar` gets a matching `@media (max-width: 767px)` rule
  dropping its `margin-left` to 0 (no sidebar to offset for) and adding
  the same `padding-bottom: calc(var(--roleshell-nav-height) +
  env(safe-area-inset-bottom))` shape `.content` already uses for the
  customer/owner bottom nav, so the new mobile tab bar doesn't overlap
  the last element of whichever admin screen is rendering.
  `.adminMobileNav` is a marker class with exactly one rule,
  `@media (min-width: 768px) { display: none; }` — the complement of
  `.sidebar`'s own query, so the two are always mutually exclusive at
  one shared breakpoint.
- `RoleShell.jsx`: the admin branch now renders a second `<nav
  className={[styles.nav, styles.adminMobileNav].join(' ')}>` after
  `.contentSidebar`, mapping the same `navItems` the sidebar already
  uses into the identical bottom-nav markup shape the customer/owner
  branch renders below it — no new state, no toggle, no `useState`;
  visibility is 100% CSS-driven by the shared breakpoint above, so
  there's no open/close interaction to build, test, or get wrong.
  `NAV_ITEMS_BY_ROLE.admin`'s `settings` entry gained a `mobileLabel:
  'Settings'` (only read by this new render, not the sidebar) since
  "Platform Settings" — fine as sidebar link text — is long for a
  narrow bottom tab beside three single-word siblings; route/icon/
  active-state are unaffected, label-only. The new tab bar
  deliberately omits the owner-only `showBadge`/`ownerOrderBadgeCount`
  branching the customer/owner render has — Task 5.21's badge is an
  owner-specific feature with no admin equivalent anywhere in
  `docs/NATRA_MASTER_PROMPT.md`'s "Admin" section.

**Verified against all six of 8.3a-8.3f's own screens** (`AdminLogin.jsx`
renders with no `RoleShell` wrapper at all — same pre-auth reasoning
`OwnerLogin.jsx`/`OwnerRegistration.jsx` already established for 8.2a —
so it was never affected by this gap and isn't re-counted here): none
of `AdminDashboard.jsx`/`AdminRestaurants.jsx`/`AdminRestaurantDetail.jsx`/
`AdminLiveRequests.jsx`/`AdminLiveRequestDetail.jsx`/`AdminOrders.jsx`/
`OrderDetail.jsx` (admin mode)/`AdminSettings.jsx` passes a `className`
override to `RoleShell` or renders anything outside its
`<RoleShell>...</RoleShell>` boundary, so this fix reaches all seven at
once — the same "shared chrome, not independently breakable per screen"
generalization `RoleShell.module.css`'s own 8.2h comment already relied
on for the owner-role equivalent check.

Same standing no-npm-registry-access caveat as every session since Task
2.10 (`npm ping` → 403) — no real build/browser exists to render and
click through the new breakpoint switch; verified by manual trace
through the CSS cascade/specificity (including catching and fixing the
source-order bug described above) and the JSX markup, not a rendered/
screenshotted or interaction-tested check. This is a real gap in this
session's own verification method worth naming plainly: a CSS-only
show/hide at a shared breakpoint is simple enough to trace by hand with
reasonable confidence, but this is the first genuinely new interactive
markup (a second `<nav>` conditionally shown) this whole responsive
pass has introduced, rather than a wrap/cap fix to markup that already
existed — an actual rendered check at 767px vs. 768px, the first time
npm/browser tooling is available, would be worth prioritizing over the
remaining unverified fixes in this pass.

`docs/TASKS.md`'s 8.3g checkbox ticked, which completes **Task 8.3 as a
whole** (8.3a-8.3g) — the third and final of Phase 8's three per-role
responsive passes (8.1 customer, 8.2 owner, 8.3 admin) is done. `8.1`'s
own top-level checkbox is still unticked in `docs/TASKS.md` despite all
of 8.1a-8.1i already being checked off — noticed while updating 8.3's
own top-level box alongside 8.3a-8.3g, but left as-is rather than
silently fixed in passing: same "flag, don't fix in passing" approach
this file's own string of NOTEs above already takes for unrelated
drift, not this task's own scope to correct. Next: **8.4** — image
pipeline audit (compression, responsive sizes, lazy loading).

---

**8.4a/8.4b (upload-path compression/thumbnail audit) are done this
session, together** — 8.4b's own wording ("adjust 8.4a's scope
accordingly") already treats them as one pass, not two.

**8.4a's backend half checked out clean, no changes needed there:**
traced all four upload routes (`upload.routes.js`) through to
`uploadController.js`'s four handlers, confirming each really does
call `uploadToObjectStorage` (Task 1.6), not some older un-compressed
path:
- `uploadRestaurantLogo`/`uploadRestaurantCover` (`OwnerRestaurant.jsx`)
  and `uploadFoodPhoto` (`AddFood.jsx`) all call it at its own defaults
  (`compress: true, generateThumbnail: true`) — correct, since all
  three are shown downscaled in list/grid contexts (`EntityCard` on
  Home/RestaurantProfile, `OwnerMenu`'s list, the Restaurant Profile
  header) that want exactly what the default thumbnail/downscaled-main
  image already provide.
- `uploadPaymentScreenshot` (`PaymentScreenshot.jsx`) already passes
  `compress: false, generateThumbnail: false`, with its own header
  comment already citing the exact reasoning 8.4b asks this session to
  decide ("only ever viewed full-size... a reviewer may want to zoom
  into exact pixels/text"). **8.4b's own question is answered — by code
  already shipped in Task 3.14, not new this session:** yes, payment
  screenshots should skip thumbnailing, and they already do.

**The real finding, and this session's one actual fix, is client-side,
not backend:** `ImageUploadField.jsx` (Task 2.10) always recompresses
every picked file through a `<canvas>` at its own defaults —
1600px longest side, JPEG quality 0.8, always re-encoded to JPEG
regardless of source type — *before* any file ever reaches whichever
backend route the caller posts to. `PaymentScreenshot.jsx` was using
`ImageUploadField` at those unmodified defaults, meaning every payment
screenshot was already downscaled and lossily recompressed on-device
ahead of the upload — silently working against
`uploadPaymentScreenshot`'s own `compress: false` intent, which only
governs the backend's *second* pass over bytes that had already lost
quality in the first one. 8.4a's own instruction to "re-check... is
actually invoked" surfaced this by tracing the whole pipeline
end-to-end (client compression step included) rather than stopping at
confirming the backend call existed.

**Fix:** `PaymentScreenshot.jsx`'s `ImageUploadField` call now passes
`maxDimension={2400}` (above the backend's own 2000px
`DEFAULT_MAX_DIMENSION`, so the client-side step is never the tighter
of the two limits) and `quality={0.95}` (near-lossless JPEG, versus the
default 0.8) — both already-supported props on the component, so no
change to `ImageUploadField` itself was needed. `OwnerRestaurant.jsx`'s
cover/logo and `AddFood.jsx`'s photo calls are deliberately left at the
unmodified defaults — those really are downscaled-for-a-grid images,
where the default's bandwidth-saving tuning is exactly right, unlike a
screenshot whose whole value is legible text. Documented inline at the
`PaymentScreenshot.jsx` call site and in that file's own header
comment.

**Named but not built, flagged as real scope for a future task rather
than guessed at now:** this fix narrows the quality-loss gap, it
doesn't close it — `ImageUploadField` still always re-encodes to JPEG
(so a PNG screenshot loses lossless-ness regardless) and there's no way
for a caller to skip client-side compression entirely. A real fix would
need a new prop on `ImageUploadField` itself (e.g. `skipCompression`),
which is a component-level change past this audit task's own scope —
left named in the code's own comment for whoever next has reason to
touch that component, not built speculatively here.

Same standing no-npm-registry-access caveat as every session since Task
2.10 (`npm ping` → 403) — traced by reading `ImageUploadField.jsx`'s
own `compressImage` implementation and every call site's props by hand,
not measured against real output file sizes/dimensions from an actual
browser upload.

`docs/TASKS.md`'s 8.4a and 8.4b checkboxes both ticked. Next: **8.4c**
— add `srcset`/responsive `sizes` (or equivalent) for the food/
restaurant thumbnails already generated by 1.6, wherever `EntityCard`/
grids currently request only one image size.

---

**8.4c split before starting** (see `docs/TASKS.md`'s note at 8.4c)
into 8.4c-i (`EntityCard`'s own `srcSet`/`sizes` support) and 8.4c-ii
(wiring real thumbnail/main URLs into those new props at the two call
sites) — the component change and the per-screen data wiring are
independently-completable units, same reasoning as 8.2d/8.2e's earlier
i-ii splits.

**8.4c-i (`EntityCard` component change) done this session.** Added
`imageSrcSet`/`imageSizes` and `logoSrcSet`/`logoSizes` as optional
props, passed straight through to the `.image`/`.logo` `<img>`
elements' own `srcSet`/`sizes` attributes. Deliberately kept as plain
passthroughs rather than EntityCard building a `srcset` string itself
from some `{ url, thumbnailUrl }`-shaped prop: `.card`'s own existing
CSS comment already establishes that EntityCard sizes itself to
whatever places it (`HorizontalScroller`'s `itemWidth` vs
`ResponsiveGrid`'s per-breakpoint column count, Tasks 2.6/2.7), so only
each call site actually knows the right `sizes` value for its own
layout — the same "shouldn't assume the shape" reasoning this
component's docstring already gives for why `badge`/`cta` are passed
as pre-built nodes, just applied to image candidates instead of
markup. `image`/`logo` stay required as the plain `src` fallback;
when `imageSrcSet`/`logoSrcSet` are omitted (every call site today —
see 8.4c-ii below), React doesn't render the `srcset`/`sizes`
attributes at all, so this is a strictly additive change — today's
three call sites (`Home.jsx` x3, `RestaurantProfile.jsx`,
`ComponentSandbox.jsx`) keep rendering exactly as before.

**A real blocker for 8.4c-ii surfaced while tracing where the actual
thumbnail URLs would come from, flagged here rather than fixed in
passing (past this component-only task's own scope):** `docs/
DB_SCHEMA.md`'s `restaurants`/`foods` tables have exactly one URL
column each for logo/cover/photo (`logo_url`, `cover_url`,
`image_url` — no `*_thumbnail_url` counterpart anywhere), and
`uploadController.js`'s three thumbnail-generating handlers
(`uploadRestaurantLogo`/`uploadRestaurantCover`/`uploadFoodPhoto`) do
return `thumbnailUrl` in their JSON response alongside `url`, but
`OwnerRestaurant.jsx`/`AddFood.jsx` only ever read `url` off that
response when saving — `thumbnailUrl` is silently discarded, never
persisted, never round-tripped through a later GET. So 8.4c-ii as
literally worded ("wire the actual thumbnail/main-image URLs into
8.4c-i's new props") has no thumbnail URL to wire yet for real
restaurant/food data — it'll need a schema change (a `*_thumbnail_url`
column per table, migration, and the two owner-facing save paths
actually persisting it) before the `Home.jsx`/`RestaurantProfile.jsx`
call sites can pass a real `imageSrcSet`. Not built here since it's a
backend/migration change, not a call-site prop-wiring one — named so
whoever picks up 8.4c-ii doesn't rediscover it from scratch.

`docs/TASKS.md`'s 8.4c-i checkbox ticked (8.4c's own top-level box and
8.4c-ii both still open). Next: **8.4c-ii** — once the thumbnail-URL
persistence gap above is addressed, wire the real thumbnail/main-image
URLs into 8.4c-i's new props at `Home.jsx` and `RestaurantProfile.jsx`.

---

**8.4c-ii done this session, prerequisite gap included** — the
thumbnail-URL persistence gap 8.4c-i's log entry above flagged (no
`*_thumbnail_url` DB column, upload response's `thumbnailUrl` silently
discarded by both owner-facing save paths) turned out to be a hard
blocker for 8.4c-ii as worded, not a "nice future improvement" —
without it there's no real thumbnail URL anywhere to wire into
8.4c-i's new props. Closed it as part of this task rather than
splitting it into a further sub-task, since it's small, mechanical,
and entirely in service of 8.4c-ii's own stated goal:

- **Migration 0012** (`backend/migrations/0012_thumbnail_url_columns.
  {up,down}.sql`) — adds `restaurants.logo_thumbnail_url`/
  `cover_thumbnail_url` and `foods.image_thumbnail_url`, all nullable
  `VARCHAR2(500)` (matching their non-thumbnail counterparts' length),
  no backfill (nothing to backfill *from* — a thumbnail generated
  before this migration was never saved anywhere at all). `docs/
  DB_SCHEMA.md` and `backend/migrations/README.md`'s status list
  updated first/alongside, per that README's own "update the doc
  first" convention.
- **`models/restaurants.js`/`models/foods.js`** — new columns added to
  each `crudFactory` instance's column allow-list, so
  `restaurantsCrud`/`foodsCrud` reads (`restaurantController.list`/
  `getProfile`/`getMe`, `foodController.list`/`getOne`) already return
  them for free — `crudFactory`'s `SELECT` is built from that
  allow-list, not hand-written per caller.
- **`restaurantController.js`/`foodController.js`** — added
  `logo_thumbnail_url`/`cover_thumbnail_url`/`image_thumbnail_url` to
  the relevant `.strict()` zod schemas (`updateProfileSchema`,
  `createFoodSchema`, `updateFoodSchema`), reusing the existing
  `imageUrlSchema` shape (an `image_thumbnail_url`-specific message
  variant added in `foodController.js` so a validation error names the
  right field).
- **`OwnerRestaurant.jsx`/`AddFood.jsx`** — both save paths now read
  `thumbnailUrl` off the upload response (previously destructured and
  dropped) and send it through as `logo_thumbnail_url`/
  `cover_thumbnail_url`/`image_thumbnail_url` alongside the main URL,
  `?? null` in both cases so replacing an existing photo with a gif
  (no thumbnail generated — `uploadToObjectStorage`'s own
  `COMPRESSIBLE_MIME_TYPES` check) actually clears a stale thumbnail
  from an earlier upload rather than leaving it in place.
- **A second, less obvious gap found while wiring the actual call
  sites**: `Home.jsx`'s Popular Foods grid, its search results, and
  `RestaurantProfile.jsx`'s menu all read from hand-written raw-SQL
  joins (`services/popularFoods.js`, `services/search.js`,
  `services/restaurantMenu.js` — Tasks 3.5/3.6/3.8), each with an
  explicit `SELECT` column list rather than `SELECT *` (the same
  reason `crudFactory`'s own column allow-list exists: these predate
  `crudFactory` reads too, `foods`/`restaurants` aren't read through
  it here). Adding the DB column and the `crudFactory` allow-list
  entries above was invisible to these three files — they needed the
  new columns added to their own `SELECT` lists by hand, same as any
  other column those queries already select. Done for all five
  affected queries (`popularFoods.js` x2, `search.js` x2,
  `restaurantMenu.js` x1); `restaurantController.js`'s own
  `list`/`getProfile`/`getMe` didn't need this since those already go
  through `restaurantsCrud`. Existing tests for these three files
  (`popularFoods.test.js`/`search.test.js`/`restaurantMenu.test.js`)
  assert their SQL via `toMatch`/regex substrings against specific
  clauses, not exact full-string equality, so adding a column to a
  `SELECT` list shouldn't break any of them — not independently
  confirmed by an actual `npm test` run this session (still no npm
  registry access), consistent with every other backend change logged
  in this file.

**The actual 8.4c-ii wiring**: new `frontend/src/utils/
entityCardImages.js` — a small shared module rather than repeating
this logic at each of the five `EntityCard` call sites now using it:
`buildImageSrcSet(mainUrl, thumbnailUrl)` builds the `srcSet` string
8.4c-i's new prop expects, using `320w`/`2000w` as the two width
descriptors — not estimated, those are `uploadToObjectStorage`'s own
`DEFAULT_THUMBNAIL_WIDTH`/`DEFAULT_MAX_DIMENSION` (Task 1.6), i.e. the
pipeline's own real caps. Returns `undefined` (so `EntityCard` falls
back to plain `src`, exactly today's behavior) whenever there's no
thumbnail to offer — an older row saved before migration 0012, or a
gif (`uploadToObjectStorage` never thumbnails those). Also exports
four `sizes` constants, one per distinct layout context, each derived
from that context's own CSS rather than guessed: `SCROLLER_CARD_SIZES`
('220px', `HorizontalScroller`'s fixed `itemWidth`),
`POPULAR_FOODS_GRID_SIZES` (`ResponsiveGrid`'s own 2/3/4/5-column,
768/1024/1280px breakpoints, capped by `Home.module.css`'s 1280px page
max-width at the xl tier), `MENU_LIST_CARD_SIZES` (`RestaurantProfile.
module.css`'s `.menuSection`, capped at 640px), and `LOGO_SIZES`
('40px', `EntityCard.module.css`'s fixed circular logo size — wiring
this one also fixes a real pre-existing waste: the logo `<img>` was
loading the same up-to-2000px main `logo_url` image as everything
else, for a 40px circular badge).

Wired at all five call sites: `Home.jsx`'s restaurants row, Popular
Foods grid, and both search-results grids (foods + restaurants), and
`RestaurantProfile.jsx`'s menu list — each now passes
`imageSrcSet`/`imageSizes` (and, for the two restaurant card contexts,
`logoSrcSet`/`logoSizes`) built from that row's own `*_url`/
`*_thumbnail_url` pair.

**Not done, deliberately out of scope for this task**: `OwnerRestaurant.
jsx`'s own restaurant-card preview (if any) and `ComponentSandbox.jsx`'s
mock `EntityCard` entries weren't touched — neither is one of the two
call sites 8.4c/8.4c-ii's own task text names (`Home.jsx`/
`RestaurantProfile.jsx`), and `ComponentSandbox`'s mock data has no
real thumbnail URL to demonstrate this with anyway. No automated test
coverage was added for `entityCardImages.js` itself or for the five
updated raw-SQL queries' new columns — flagged here rather than
silently skipped, but this task's own scope (from the 8.4c split note)
was "wire real URLs into 8.4c-i's props," not "add test coverage for
a change this size"; a reasonable follow-up, not assumed to be free.

`docs/TASKS.md`'s 8.4c-ii checkbox ticked, and since that closes out
its only two sub-items, 8.4c's own top-level checkbox ticked too. Next:
**8.4d** — add `loading="lazy"` to below-the-fold images: Home's food/
restaurant grids, `RestaurantProfile`'s menu grid, `OwnerMenu`'s list.
Worth noting for whoever picks that up: `EntityCard`'s own `<img>`
elements (both `.image` and `.logo`) already had `loading="lazy"`
hardcoded before this session touched the file at all — unclear which
earlier task added it, `docs/TASKS.md`/`docs/PROJECT_STATUS.md` don't
mention it under 8.4d or anywhere else searched this session — so
Home's and RestaurantProfile's grids (both `EntityCard`-based) may
already satisfy 8.4d's letter without further work; `OwnerMenu`'s
list is a real gap though — a quick look this session found no
`EntityCard`/image rendering there at all, so 8.4d's own start should
confirm what that screen currently renders before assuming there's an
`<img>` to add `loading="lazy"` to.

---

**8.4d checked, not coded** — confirmed the prediction the 8.4c-ii
entry above flagged, by actually reading all three named screens
rather than assuming:

- **Home's food/restaurant grids** (restaurants row, Popular Foods
  grid, both search-results grids) — every image on these four is an
  `EntityCard` `<img>` (`.image`/`.logo`); no other `<img>` anywhere
  in `Home.jsx`. Already `loading="lazy"`, unchanged by this session
  (see 8.4c-i's own entry for the other reason that file was touched
  this session — this isn't from that edit, it predates it).
- **`RestaurantProfile`'s menu grid** — same, every menu-row image is
  an `EntityCard` `<img>`, already lazy. (The screen's other two
  `<img>` elements — `RestaurantHeader`'s cover photo and logo,
  `RestaurantProfile.jsx` lines ~248/264 — are the header, not the
  menu grid, and above-the-fold by construction: the first thing a
  customer sees on this screen. Correctly out of 8.4d's own scope,
  which names "below-the-fold images" specifically; left untouched.)
- **`OwnerMenu`'s list** — actually the odd one out, and not in the
  way the prior entry guessed: this screen's `ListWithPagination`
  `renderItem` renders name, a Hidden/Visible `StatusBadge`, price,
  and Edit/Hide/Delete actions per row — no `<img>` at all, not even
  a broken/fallback one. An owner managing their menu currently can't
  see each food's photo from this list (only from Edit, which opens
  `AddFood.jsx`). That's a real, pre-existing gap, but it's a
  different-shaped task than 8.4d's own ("add `loading=\"lazy\"` to
  \[existing images\]") — there's nothing to add the attribute *to*
  here without first designing and building a thumbnail into this
  screen's row layout, which is new UI, not a one-line attribute add.
  Not built here, flagged instead of guessed at: same "don't quietly
  expand a task's shape" reasoning this project's other split/flag
  notes already follow.

`docs/TASKS.md`'s 8.4d checkbox ticked on that basis — its two
image-bearing targets (Home's grids, RestaurantProfile's menu grid)
were already fully lazy before this session, and the third
(`OwnerMenu`'s list) has no image for the attribute to apply to.
Next: **8.4e** — manual check: confirm no layout shift (reserve image
dimensions/aspect-ratio box) on the screens touched by 8.4c/8.4d.

---

**8.4e checked, also clean** — read every image-bearing element on the
screens 8.4c/8.4d actually touched (Home.jsx, RestaurantProfile.jsx;
OwnerMenu has no images per 8.4d's own finding above, so nothing to
check there):

- **`EntityCard.module.css`** — `.media` (the main image's wrapper)
  already has `aspect-ratio: 4 / 3` plus `width: 100%`, so its box is
  fully sized before the `<img>` (`width/height: 100%` inside it)
  ever loads — no shift regardless of the real image's intrinsic
  dimensions. `.logo` has fixed `width/height: 40px` and
  `position: absolute`, so it's both explicitly sized and out of
  normal flow entirely — can't push anything else on the card even if
  it briefly renders at its `alt`-text size before loading. This
  covers every 8.4c/8.4d-touched image: Home's restaurants row,
  Popular Foods grid, both search-results grids, and
  `RestaurantProfile`'s menu list all render exclusively through this
  component.
- **`RestaurantProfile.module.css`**'s `.cover`/`.logo` (the
  `RestaurantHeader` cover photo/logo, `RestaurantProfile.jsx`'s other
  two `<img>` elements, ~lines 248/264) — not themselves an 8.4c/8.4d
  edit (they're above-the-fold, outside 8.4d's own "below-the-fold"
  scope), but checked anyway since they're on a screen 8.4c/8.4d did
  touch and CLS doesn't care which task added an image. Same result:
  `.cover` has a fixed `height: 200px` (`width: 100%`, no
  `aspect-ratio` needed when height is already pinned), `.logo` has
  fixed `72px` dimensions and `position: absolute`, same as
  `EntityCard`'s own logo. Both fully reserved.

No gaps found, nothing to fix — all of this predates this session
(likely built in alongside each component at Tasks 2.3/3.7/8.1b, going
by the CSS's own comments), 8.4e's own job was confirming it, not
building it. `docs/TASKS.md`'s 8.4e checkbox ticked; since that was
the last open item under 8.4, its own top-level checkbox ticked too.
Next: **8.5** — DB indexing pass (8.5a-8.5e): index `orders` for the
phone-based lookup `orderTracking`/`OrderHistory` use, index
`popularity_stats`' join (Task 7.2a), index(es) for
`adminRestaurantsList.js`/`adminOrdersList.js`'s filter columns, the
corresponding migration, and an `EXPLAIN`/query-plan verification that
each new index is actually used.

---

**8.5a checked, already done — no migration needed.** Traced both
customer-facing phone-lookup queries (`orderController.js`'s `track`/
`history`, both routed through `utils/phoneLookup.js`'s
`findOneByCode`/`findAllByPhone`, Task 1.10) back to `orders`'
own migration: `backend/migrations/0008_orders_order_items.up.sql`
already has `CREATE INDEX ix_orders_customer_phone ON orders
(customer_phone)`, with its own comment calling it out by name —
"Sole lookup key for customer tracking/history — hot path" — i.e.
Task 0.8 (which predates 3.17/3.18 existing at all) already anticipated
exactly this need and built the index in from the start, rather than
this being an audit-pass gap. `order_code` (the other half of Track
Order's `WHERE order_code = :code AND customer_phone = :phone`) is
separately covered too, via `uq_orders_order_code UNIQUE (order_code)`
— Oracle backs a UNIQUE constraint with its own index automatically, no
separate `CREATE INDEX` needed for that one. Checked every migration
file for a `CREATE INDEX`/`orders` combination in case a later
migration duplicated or superseded this one — it doesn't, 0008's index
is still the only one on this column.

Not built here since there was nothing missing: `findAllByPhone`'s
`ORDER BY id DESC` (Order History's pagination) does mean a composite
`(customer_phone, id)` index would let Oracle skip a sort step
entirely rather than index-scan-then-sort the matched rows, but that's
a genuinely different, more speculative optimization than what 8.5a's
own task text asks for ("add index ... for the phone-based lookup") —
one phone number's own order count is small (a single customer's
lifetime order history, not the whole table), so the extra sort over
an already-narrow result set isn't the kind of thing worth a
migration without a real slow-query signal to justify it. Flagged
here rather than added speculatively, same "don't guess at scope"
reasoning this project's other audit-pass entries already follow.

`docs/TASKS.md`'s 8.5a checkbox ticked on verification, not a code
change. Next: **8.5b** — add index supporting the `popularity_stats`
join `popularFoods.js` uses (Task 7.2a).

---

**8.5b checked, also already done.** `popularFoods.js`'s `BASE_FROM`
joins `LEFT JOIN popularity_stats ps ON ps.food_id = f.id` — both
sides of that join condition are already indexed: `foods.id` is that
table's own primary key (indexed by definition), and
`popularity_stats.food_id` is covered by `backend/migrations/
0010_....up.sql`'s own `CONSTRAINT uq_popularity_stats_food_id UNIQUE
(food_id)` — that migration's own comment says as much directly ("No
separate index needed on food_id: the UNIQUE constraint above already
creates one"), and Task 7.2a (which added the join itself, per this
task's own naming) came after 0.10 had already built the table this
way. Same situation as 8.5a: a later audit-pass task finding that an
earlier task already did the actual indexing work, not a gap.

`docs/TASKS.md`'s 8.5b checkbox ticked on verification, not a code
change. Next: **8.5c** — add index(es) supporting
`adminRestaurantsList.js`/`adminOrdersList.js`'s filter columns
(status, restaurant_id, created_at).

---

**8.5c — a real gap this time, migration 0013 added.** Traced both
named files' actual filter columns rather than assuming the task text's
own column list applied evenly to both:

- **`adminRestaurantsList.js`** (6.4a) — its only filter is a
  `LIKE`-based case-insensitive name search; no `status`/
  `restaurant_id`/`created_at` filter exists on this file at all (it
  lists every restaurant platform-wide, not scoped to one, and
  `restaurants` doesn't have a `created_at`-filtered access pattern
  here either). The task text's "(status, restaurant_id, created_at)"
  column list doesn't actually describe anything this file does — it
  describes `adminOrdersList.js` entirely. Nothing added for this file:
  a plain b-tree index can't meaningfully help a `'%term%'` substring
  search (no fixed prefix to seek on), and standing up Oracle Text
  search infrastructure to actually index free-text name search is a
  different, much larger task than "add index(es)" — not built here,
  flagged instead of guessed at.
- **`adminOrdersList.js`** (6.9, extended by 6.10a) — this is where all
  three named columns actually live: optional `restaurant_id`/
  `status`/`date` (→ `created_at` range) filters, ANDed together, an
  admin can pick any subset of. Two of the three were already covered
  by migration 0008: `ix_orders_restaurant_id` (restaurant_id alone)
  and `ix_orders_restaurant_status` (restaurant_id + status together).
  Neither helps a `status`-only or `date`-only filter (no
  `restaurant_id` picked) — `ix_orders_restaurant_status`'s leading
  column is `restaurant_id`, high-cardinality enough that an index
  skip-scan on it wouldn't be worth much, and nothing touches
  `created_at` at all. **Migration 0013**
  (`backend/migrations/0013_orders_admin_filter_indexes.{up,down}.sql`)
  adds `ix_orders_status`/`ix_orders_created_at` as plain single-column
  indexes, letting the optimizer combine them with the existing
  `restaurant_id`-based ones per-query rather than pre-building one
  composite index for every filter combination an admin might pick.

**`docs/DB_SCHEMA.md`'s "Deferred to later tasks" note updated** (per
`migrations/README.md`'s own "update the doc first" convention) — it
was stale: written before 0008/0010 existed, it still named
`orders.customer_phone`/`orders(restaurant_id, status)`/
`notifications(recipient_id, is_read)` as deferred to this same Task
8.5, when all three actually landed early, right alongside their own
migrations (0008/0010) — 8.5a/8.5b's own log entries above are exactly
where that got confirmed. Rewritten to credit what already shipped and
point at 8.5a/8.5b/8.5c's log entries instead of re-deferring
something already done. `backend/migrations/README.md`'s status list
also updated with 0013.

`docs/TASKS.md`'s 8.5c checkbox ticked. Next: **8.5d** — write the
corresponding up/down migration for 8.5a-8.5c. Worth noting for
whoever picks that up: this is likely already satisfied as a
byproduct of how 8.5a-c actually went — 8.5a/8.5b needed no new
index at all (both already existed), and 8.5c's own migration 0013
above already is that up/down pair for the one real gap found. 8.5d's
own start should confirm there's truly nothing further to write
rather than assume it from this note alone.

---

**8.5d confirmed, no further migration needed.** Re-checked the
premise rather than taking the prior entry's own note at face value:
8.5a (`orders.customer_phone`) and 8.5b (`popularity_stats.food_id`)
both verified as already-existing indexes with no code/migration
change made for either (see their own log entries above); 8.5c
(`orders.status`/`orders.created_at`) is the one place a real gap
existed, and its migration — `backend/migrations/
0013_orders_admin_filter_indexes.{up,down}.sql` — was already written
as part of doing 8.5c itself, not deferred to this task. Reread both
files here to confirm: `up` creates exactly the two indexes 8.5c's log
entry describes, `down` drops them in a straightforward pair (no
ordering dependency between the two, unlike e.g. a FK-backed index
that would need to drop before a constraint), same numbered-pair
convention `migrations/README.md` already documents. Nothing else
under 8.5a-c produced a schema change this migration would need to
capture.

`docs/TASKS.md`'s 8.5d checkbox ticked on confirmation, not a new
migration. Next: **8.5e** — verify with `EXPLAIN`/query plan (or
equivalent) that each indexed query actually uses the new index.

---

**8.5e — the "(or equivalent)" branch, no live Oracle instance
available.** Same constraint every backend task this session has
logged (no `npm`/DB access) applies here too, and it's a real one for
this specific task: an actual `EXPLAIN PLAN FOR ...` /
`DBMS_XPLAN.DISPLAY` run isn't possible without a live connection, so
this is a manual predicate-to-index alignment check — reasoning
through Oracle's cost-based optimizer against each query's actual
`WHERE`/`ON` clause and each index's actual column list — not a
captured plan. Flagged here rather than silently treated as
equivalent-in-confidence to a real `EXPLAIN` run:

- **`ix_orders_customer_phone`** — `phoneLookup.findAllByPhone`'s
  `WHERE customer_phone = :normalized` is a plain equality predicate
  on the index's sole column: an INDEX RANGE SCAN is the expected
  access path (followed by a sort on `id` for the `ORDER BY id DESC`,
  since `id` isn't part of this index — a small in-memory sort over
  one phone's own order count, not a concern). `findOneByCode`'s
  `WHERE order_code = :code AND customer_phone = :phone` has a second,
  even more selective option available: `uq_orders_order_code`'s
  UNIQUE index guarantees at most one matching row, so the optimizer
  should drive from that instead and apply `customer_phone` as a
  cheap filter on the single row found — `ix_orders_customer_phone`
  itself isn't even needed for this particular query, which is fine
  (it exists for `findAllByPhone`, not this one).
- **`uq_popularity_stats_food_id`** — `popularFoods.js`'s `LEFT JOIN
  popularity_stats ps ON ps.food_id = f.id` is exactly the shape a
  UNIQUE index on the joined-to column supports best: for each `foods`
  row the outer query already produced, a NESTED LOOPS join with an
  INDEX UNIQUE SCAN on `ps.food_id` is the expected plan — at most one
  matching row per lookup, which is what makes nested-loops-with-
  unique-scan the right join method here rather than a hash join.
- **`ix_orders_status`/`ix_orders_created_at`** — `adminOrdersList.js`'s
  filters are all optional and ANDed, so which index (if any) the
  optimizer picks genuinely depends on which filters a given admin
  request actually supplies: `status` alone → INDEX RANGE SCAN on
  `ix_orders_status`; `date` alone → INDEX RANGE SCAN on
  `ix_orders_created_at` (a real range predicate,
  `created_at >= :dateStart AND created_at < :dateEnd`, which is
  exactly what a b-tree range scan is for); `restaurant_id` present at
  all → one of migration 0008's two indexes takes over as the more
  selective driving path instead, with `status`/`date` applied as
  filters — all of this matches migration 0013's own header comment,
  which anticipated exactly this "optimizer combines per-query" split
  rather than one index covering every combination. A request with
  only the free-text `q` search (or no filters at all) still forces a
  full table scan — expected and already flagged as out of this
  migration's scope in 8.5c's own log entry (a `LIKE '%term%'` pattern
  has no fixed prefix for a b-tree index to seek on).

No mismatch found between any query's actual predicates and its
intended index's columns — everything above is exactly the access
path each index was built for. Genuine confirmation via `DBMS_XPLAN`
against a real Oracle instance is still open and worth doing whenever
this project actually gets DB access in a session — not assumed to be
unnecessary just because the reasoning above holds up, only that it's
the best available substitute right now.

`docs/TASKS.md`'s 8.5e checkbox ticked, and since that was the last
open item under 8.5, its own top-level checkbox ticked too — Task 8.5
(DB indexing pass) is now fully done. Next: **8.6** — loading states
pass across all data-fetching screens (8.6a-8.6e): audit
`useApiQuery`/`usePaginatedQuery` call sites for screens that render
blank while pending, add/standardize loading UI across customer/owner/
admin screens, and add a submitting/disabled state to mutation-firing
buttons so double-submit isn't possible.

---

**8.6a — full audit, one root cause found.** Read every
`useApiQuery`/`usePaginatedQuery` call site (23 page files) for how
`loading` is actually rendered, not just whether it's destructured.
One clear pattern explains every blank screen found:
**`ListWithPagination` itself has no visible loading UI** — its own
source only sets `aria-busy={isLoading}` on the `<ul>`; `isEmpty =
!isLoading && items.length === 0` deliberately keeps `emptyState` from
showing while loading (so a slow request doesn't flash "no results"
first), but nothing fills that gap with a visible spinner/text of its
own. A screen that passes `isLoading` straight to `ListWithPagination`
and renders nothing else conditional on `loading` shows a genuinely
blank list region — no "no items", no spinner, no text — until the
first response lands.

**Screens/sections confirmed blank** (bare `ListWithPagination`
usage, no separate page-level loading text anywhere near it):
- `AdminLiveRequests.jsx` — the requests list
- `AdminOrders.jsx` — the orders list
- `AdminRestaurants.jsx` — the restaurants list
- `OwnerMenu.jsx` — the food list
- `OwnerOrders.jsx` — the orders list
- `OwnerRestaurant.jsx` — three of its five sub-sections: Categories,
  Service Areas, Payment Methods (its own main profile-form load *is*
  covered by a `loading || !values` → `<p>Loading…</p>` branch, and so
  is its Opening Hours section — those two aren't part of this gap,
  only the three `ListWithPagination`-backed sub-sections are)
- `OrderHistory.jsx` — the results list itself is blank the same way,
  though not silent overall: the "View history" submit button does
  switch to a disabled "Searching…" label while `loading` is true, so
  there's *some* visible feedback, just not in the region where
  results actually appear.

**Screens already fine, verified rather than assumed** — every other
`useApiQuery`/`usePaginatedQuery` call site has its own explicit
`loading`-branched `<p>Loading…</p>`-shaped element (sometimes several,
one per independently-loading section): `AddFood.jsx`,
`AdminDashboard.jsx`, `AdminLiveRequestDetail.jsx`,
`AdminRestaurantDetail.jsx`, `AdminSettings.jsx`, `FoodDetails.jsx`,
`Home.jsx` (all four of its independently-loading sections —
restaurants row, categories chips, Popular Foods grid, search),
`LiveStatus.jsx`, `OrderBuilder.jsx`, `OrderDetail.jsx`,
`OwnerAccount.jsx`, `OwnerDashboard.jsx` (all three of its
sections — order counts, sales summary, restaurant), `PaymentMethod.
jsx`, `RequestLive.jsx`, `RestaurantProfile.jsx` (both its header and
menu sections). None of these need 8.6b/c/d's own work, despite some
of them (`Home`, `RestaurantProfile`, `OwnerDashboard`, `OrderDetail`,
`AdminDashboard`) being named in 8.6b/c/d's own task text alongside
screens that do — worth flagging now so 8.6b/c/d doesn't spend effort
re-covering ground that's already solid.

**One name from 8.6b's own task text doesn't fit this audit's scope**:
`TrackOrder.jsx` never calls `useApiQuery`/`usePaginatedQuery` at all
— it's a `useMutation`-driven single lookup fired on submit, same
shape `TrackOrder.jsx`'s own doc comment describes ("fires once per
explicit action"), with its own submit button already showing
"Searching…" while pending. Not a gap this audit found, just a
mismatch between 8.6b's naming ("TrackOrder/OrderHistory results" as
one pairing) and the actual hook each screen uses — noted so 8.6b
doesn't go looking for a `useApiQuery` call site in `TrackOrder.jsx`
that isn't there.

Not fixed here — 8.6a's own job was the audit, not the fix; that's
8.6b/8.6c/8.6d's job, now with a concrete list instead of a blind
re-scan. Given the shared root cause, whoever picks up 8.6b/c/d should
consider whether the real fix belongs in `ListWithPagination` itself
(one shared loading-visible change covering all seven bullets above)
rather than seven separate per-screen patches — a call worth making
explicitly when that work starts, not decided here.

`docs/TASKS.md`'s 8.6a checkbox ticked. Next: **8.6b** — add/
standardize a loading UI (skeleton or spinner — pick one convention)
for the customer screens found in 8.6a: per this audit, that's just
`OrderHistory.jsx`'s results list — `Home`, `RestaurantProfile`, and
`FoodDetails` (also named in 8.6b's own task text) were all already
covered.

---

**8.6b done this session — fixed at the shared-component level, not
per-screen.** 8.6a's own log entry above already named the root cause
as one shared gap in `ListWithPagination` itself (no visible loading
UI, only an invisible `aria-busy`) affecting seven call sites across
all three roles, and explicitly left the "fix once vs. seven patches"
call for whoever started 8.6b/8.6c/8.6d. Decided here, in favor of the
shared fix: the exact same gap recurs unchanged on the owner/admin
screens 8.6c/8.6d cover, so patching only `OrderHistory.jsx` (8.6b's
one customer-scoped instance) would leave the other six to be
independently rediscovered and fixed later — same "shared chrome, not
independently breakable per caller" reasoning `RoleShell.module.css`'s
own 8.2h/8.3g comments already used for nav-chrome fixes, applied here
to a shared list component instead.

**Convention chosen: plain loading text, not a skeleton/spinner** —
matching every other loading state already built in this codebase
(`Home.module.css`'s `.sectionStatus`, `OwnerDashboard.jsx`'s
`<p>Loading…</p>` branches, etc.), not introducing a second convention
alongside it.

**Implementation:** `ListWithPagination.jsx` now tracks
`isInitialLoading` (`isLoading && items.length === 0`) separately from
the existing `isEmpty` (`!isLoading && items.length === 0`) check, and
renders a new `loadingLabel`-driven `<p role="status" aria-live="polite">`
in that case instead of nothing — only on the genuinely-blank first
fetch; a page/filter change that already has prior `items` still shows
them (`aria-busy`) while the new page loads, unchanged from before,
since that case was never actually blank. `loadingLabel` defaults to
`'Loading…'` and is an optional prop each caller can override with its
own noun, the same way each screen's own pre-existing `useApiQuery`
loading text already does — this component still doesn't guess a
shared noun across its three different row shapes (foods/restaurants/
orders). New `.loadingStatus` class in `ListWithPagination.module.css`,
styled identically to `Home.module.css`'s own `.sectionStatus`. Full
reasoning recorded in `ListWithPagination.jsx`'s own doc comment, not
just here.

**This session's own call-site wiring is customer-scoped, per 8.6b's
task text**: `OrderHistory.jsx` now passes
`loadingLabel="Loading your orders…"` — the one customer instance
8.6a's audit found. The other six call sites (`AdminLiveRequests.jsx`,
`AdminOrders.jsx`, `AdminRestaurants.jsx`, `OwnerMenu.jsx`,
`OwnerOrders.jsx`, and `OwnerRestaurant.jsx`'s three
`ListWithPagination`-backed sub-sections) already stopped being blank
the moment this fix landed, courtesy of the shared component and its
generic `'Loading…'` default — but none of them got their own
specific `loadingLabel` wired in this session, since doing so is
8.6c's/8.6d's own task text, not 8.6b's. Flagged here so whoever
starts 8.6c/8.6d knows the blank-screen part of their own audit
findings is already resolved by this change — their remaining job is
only wiring a more specific `loadingLabel` per screen (e.g. "Loading
orders…", "Loading restaurants…"), not fixing a second blank-region
bug from scratch.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist anywhere in
this codebase to run against this change either (confirmed by search;
all existing `.test.js` files are backend-only), so verification is a
manual trace of the new conditional against `usePaginatedQuery`'s own
state shape (`items: []`, `loading: true` on mount and on every fresh
`deps` change) confirming `isInitialLoading` is true exactly when the
list was previously blank, and false in every case that already
rendered content correctly.

`docs/TASKS.md`'s 8.6b checkbox ticked. Next: **8.6c** — add/
standardize loading UI for owner screens: `OwnerDashboard`,
`OwnerOrders`, `OwnerMenu`, `OrderDetail` — per the note just above,
the `ListWithPagination`-backed ones (`OwnerOrders`, `OwnerMenu`) may
only need a `loadingLabel` prop added now, not a structural fix;
`OwnerDashboard`/`OrderDetail` don't use `ListWithPagination` at all
(per 8.6a's own audit, both already had working loading branches), so
double-check 8.6a's findings before assuming there's a gap to fix on
either.

---

**8.6c done this session.** Confirmed both non-`ListWithPagination`
screens first, rather than trusting the note above at face value:
`OwnerDashboard.jsx` already has its own explicit
`<p>Loading order counts…</p>`/`<p>Loading sales summary…</p>`/
`<p>Loading…</p>` branches for its three independently-loading
sections, and `OrderDetail.jsx` already has `<p>Loading…</p>` guarding
its whole detail view — both exactly as 8.6a's audit found, no gap on
either, no change made.

`OwnerOrders.jsx` and `OwnerMenu.jsx` — the two `ListWithPagination`-
backed screens this task actually names — each got a `loadingLabel`
prop wired in (`"Loading your orders…"`, `"Loading your menu…"`), same
as `OrderHistory.jsx` got in 8.6b. The blank-region bug itself was
already fixed for both by 8.6b's shared `ListWithPagination` change
(they'd have shown the generic `'Loading…'` default even without this
session's edit); this session's own work was only replacing that
generic default with a screen-specific noun, matching the convention
`OwnerDashboard.jsx`'s own pre-existing branches already set.

**One scope gap surfaced and closed, not left for later:**
`OwnerRestaurant.jsx`'s three `ListWithPagination`-backed sub-sections
(Categories, Service Areas, Payment Methods) — flagged by 8.6a's own
audit as blank the same way `OwnerOrders`/`OwnerMenu` were — aren't
named in 8.6c's own task text (nor 8.6b's or 8.6d's), an omission in
the original task list rather than a deliberate exclusion: it's an
owner screen with the exact same shared-component gap 8.6b/8.6c both
exist to close, just missed when the phase was written. Treated as
in-scope for this task rather than left to accumulate as a third,
never-assigned gap — same "stale label, not a missing component"
precedent 8.2c-i/8.2h already set for a task-text mismatch discovered
mid-pass. All three got their own `loadingLabel`
(`"Loading categories…"`, `"Loading service areas…"`,
`"Loading payment methods…"`), closing out every `ListWithPagination`
call site 8.6a's audit found blank across all three roles — none
remain with only the generic default.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run
either (same as 8.6b); verified by re-reading each edited file's
`ListWithPagination` call to confirm the new prop is spelled/passed
correctly and doesn't collide with any existing prop.

`docs/TASKS.md`'s 8.6c checkbox ticked. Next: **8.6d** — add/
standardize loading UI for admin screens: `AdminDashboard`,
`AdminRestaurants`, `AdminOrders`, `AdminLiveRequests`. Worth noting
for whoever picks that up: per 8.6a's own audit, `AdminDashboard.jsx`
doesn't use `ListWithPagination` and needs checking fresh (not yet
confirmed to have its own loading branch the way `OwnerDashboard`/
`OrderDetail` did going into this task); the other three
(`AdminRestaurants`, `AdminOrders`, `AdminLiveRequests`) are
`ListWithPagination`-backed and, per this session's own pattern,
already stopped being blank via 8.6b's shared fix — likely only need
their own `loadingLabel` wired in, same as this session's work.

---

**8.6d done this session — the last of the three per-role loading-UI
tasks (8.6b customer, 8.6c owner, now 8.6d admin).** Checked
`AdminDashboard.jsx` fresh rather than assuming, per the note above:
it already has its own `<p className={styles.cardBody}>Loading
dashboard…</p>` branch guarding its one `useApiQuery`-driven summary
section — no gap, no change made, same "already covered" outcome
`OwnerDashboard`/`OrderDetail` had in 8.6c.

The other three — `AdminRestaurants.jsx`, `AdminOrders.jsx`,
`AdminLiveRequests.jsx` — are the `ListWithPagination`-backed screens
this task actually names, and matched this session's now-established
pattern exactly: each already stopped being blank via 8.6b's shared
component fix (the generic `'Loading…'` default), so this session's
only work was wiring a screen-specific `loadingLabel`
(`"Loading restaurants…"`, `"Loading orders…"`,
`"Loading live requests…"`), same mechanical change as every
`ListWithPagination` call site fixed in 8.6c.

**This closes out every gap 8.6a's original audit found** — all nine
`ListWithPagination` call sites across all three roles
(`OrderHistory`; `OwnerOrders`, `OwnerMenu`, and `OwnerRestaurant`'s
three sub-sections; `AdminRestaurants`, `AdminOrders`,
`AdminLiveRequests`) now render visible, screen-specific loading text
on first load instead of a blank region, and every non-`ListWithPagination`
screen 8.6a checked (`AddFood`, `AdminDashboard`, `AdminLiveRequestDetail`,
`AdminRestaurantDetail`, `AdminSettings`, `FoodDetails`, `Home`,
`LiveStatus`, `OrderBuilder`, `OrderDetail`, `OwnerAccount`,
`OwnerDashboard`, `PaymentMethod`, `RequestLive`, `RestaurantProfile`)
was already fine before this whole 8.6b-d pass started.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run
either (same as 8.6b/8.6c); verified by re-reading each edited file's
`ListWithPagination` call to confirm the new prop is spelled/passed
correctly.

`docs/TASKS.md`'s 8.6d checkbox ticked. Next: **8.6e** — add a
submitting/disabled state to buttons that fire mutations
(`useMutation` call sites) so double-submit isn't possible during a
pending request — the last item under 8.6, after which Phase 8 moves
to **8.7** (error states).

---

**8.6e — full audit, no code changes needed.** Traced every real
`useMutation` import (13 files: `AddFood`, `AdminLiveRequestDetail`,
`AdminLogin`, `AdminRestaurantDetail`, `AdminSettings`,
`OrderConfirmation`, `OrderDetail`, `OwnerAccount`, `OwnerDashboard`,
`OwnerLogin`, `OwnerRegistration`, `OwnerRestaurant`, `TrackOrder` —
`OrderHistory.jsx` was a false positive from a plain-text mention of
"useMutation" in its own doc comment, not an actual import) through to
every button that fires its `mutate`, plus the hand-rolled equivalents
that manage their own `loading`-shaped state instead of going through
the hook (`OwnerRestaurant.jsx`'s per-day opening-hours save and
per-row payment-method toggle, Tasks 5.5b/5.7; `OwnerMenu.jsx`'s
per-row Hide/Show toggle and Delete-confirm, Task 5.9b;
`RequestLive.jsx`/`PaymentScreenshot.jsx`'s own upload/submit state,
Tasks 3.14/4.4) — the same "double-submit during a pending request"
risk exists regardless of which state mechanism a screen happens to
use, so all of them were checked, not only the literal `useMutation`
call sites the task text names.

**Every one of them already had a `disabled`/label-swap state wired in
before this session touched anything** — every login/registration
submit button (`disabled={loading}`), every save form
(`AddFood`/`AdminSettings`/`OwnerAccount`'s profile+password/
`OwnerRestaurant`'s profile form, all `disabled={isSaving}`-shaped),
every status-transition action row (`OrderDetail` Accept/Reject/
Complete, `AdminLiveRequestDetail` Approve/Reject,
`AdminRestaurantDetail` Suspend/Reactivate, all
`disabled={statusUpdating}`-shaped), every per-row toggle
(`OwnerDashboard`'s Open/Closed `ToggleSwitch`, `OwnerRestaurant`'s
payment-method-active `ToggleSwitch`, `OwnerMenu`'s Hide/Show button —
each keyed to its own row/id so toggling one row doesn't disable
sibling rows), every modal Save/Delete-confirm pair across
`OwnerRestaurant`'s three CRUD sub-resources and `OwnerMenu`'s delete
confirm, and `OrderConfirmation`'s own submit-on-mount + "Try again"
retry. None needed a fix.

**Buttons/forms deliberately not touched, and why each is out of
scope rather than a missed gap:**
- `CustomerInfo.jsx`, `PaymentMethod.jsx`, `OrderBuilder.jsx`'s own
  "Add another item"/checkout button, and `FoodDetails.jsx`'s "Buy
  Now" — none fire a network request at all; each only updates
  `useOrderCart`'s local state and calls `navigate(...)` synchronously,
  so there's no pending request for a second click to race against
  (a double-click just navigates to the same route twice, a no-op).
- Every plain "Retry"/"Check again" button on a failed read
  (`Home.jsx`'s three section retries, `RestaurantProfile.jsx`'s
  profile/menu retries, `LiveStatus.jsx`'s "Check again",
  `OwnerMenu.jsx`'s/`OwnerRestaurant.jsx`'s/`OwnerOrders.jsx`'s own
  list-error retries, etc.) re-fires a `useApiQuery`/`usePaginatedQuery`
  refetch, not a `useMutation` write — those hooks already have their
  own out-of-order-response guard (`usePaginatedQuery`'s own doc
  comment, Task 3.1), and a repeated idempotent GET isn't the
  "duplicate side effect" 8.6e's own wording is protecting against.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run
either (same as 8.6b/c/d); verified by reading every flagged button's
`onClick`/`disabled` pair and each screen's own state declarations by
hand, not a click-tested/rendered check.

`docs/TASKS.md`'s 8.6e checkbox ticked on verification, not a code
change — since that was the last item under 8.6, its own top-level
checkbox is ticked too, closing out **Task 8.6 (loading states pass)
in full**. Next: **8.7** — error states pass, starting with **8.7a**,
auditing `useApiQuery`/`useMutation` error handling for screens with
no visible error UI on a failed request.

---

**8.7a — full audit, two real gaps found (not fixed here — that's
8.7b's job).** Traced every `useApiQuery`/`usePaginatedQuery`/
`useMutation` call site across all 26 page files that use any of the
three (the same population 8.6a's own audit covered, plus the
`useMutation`-only screens it didn't need to touch for loading state)
for whether a failed request actually surfaces something visible, not
just whether `error` is destructured.

**24 of 26 files are already fully covered** — every query's `error`
is checked and rendered (an `EmptyState`-with-Retry for a screen's
primary data, an inline `role="alert"` banner for a form-level
mutation failure, or both, depending on the screen), matching this
codebase's own established pattern throughout Phases 3-7. Not
re-listed file-by-file here since none needed anything — the two real
findings below are the exception, not the rule.

**Gap 1 — `AddFood.jsx`'s category-dropdown fetch, silent *and*
actively misleading.** `fetchCategories` is called via `useApiQuery`
but only `data`/`loading` are destructured — `error` isn't captured at
all, let alone rendered. On a failed fetch, `categoryOptions` falls
back to `categories ?? []` (just the always-present "Uncategorized"
entry), and the field's own `helperText` logic reads
`categoryOptions.length === 1` as "no categories exist yet" and shows
"No categories yet — you can add some from the Restaurant tab." — a
confident, wrong explanation for what's actually a network failure,
not merely a missing one. Worse than the plain "nothing visible" gap
this task's own title names: an owner would have no reason to retry
or suspect a fetch failure at all.

**Gap 2 — `AdminOrders.jsx`'s restaurant-filter-options fetch, silent
with a self-contradicted precedent claim.** `restaurantsOptionsError`
is captured, but only ever read to decide whether to include the
restaurant dropdown in `FilterBar`'s `groups` array
(`if (restaurants && !restaurantsOptionsError)`) — no visible error or
retry anywhere when it's true; the dropdown just isn't there, with
nothing telling the admin that restaurant filtering was ever supposed
to be available. This file's own doc comment claims this "mirrors...
the same 'degrade a secondary section without blocking the page'
precedent Home.jsx's own Categories chip row sets... just omission
instead of an inline retry line" — checked against `Home.jsx` directly
rather than taking that claim at face value, and it doesn't hold:
`Home.jsx`'s Categories section (line ~497) shows a real
`Couldn't load categories.` + inline Retry button on
`categoriesError`, it doesn't just vanish. The precedent the comment
cites doesn't actually exist; this is a real, undocumented-as-such gap,
not a deliberate, already-reasoned degrade.

**Everything else checked and confirmed fine**, including several
spots worth naming since they're easy to mistake for gaps at a glance:
`OwnerDashboard.jsx`'s Open/Closed toggle uses its own
`openToggleFailed` boolean (not `useMutation`'s own `error`) but does
render it; `OwnerRestaurant.jsx`'s five independent sub-resource
sections (profile/logo/cover, opening hours, categories, service
areas, payment methods) each have their own query-error and
save-error banners, all wired; every admin/owner status-transition
mutation (`OrderDetail`, `AdminLiveRequestDetail`,
`AdminRestaurantDetail`) shows its `statusError`/`suspensionError`
inline; every login/registration screen shows its mutation error next
to the form.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run
either; verified by reading every hook destructure and its
corresponding render branch by hand, and, for Gap 2, by re-reading
`Home.jsx`'s actual Categories-error markup to check the doc comment's
own claim rather than trusting it.

`docs/TASKS.md`'s 8.7a checkbox ticked. Next: **8.7b** — add a
network/server-error UI (`EmptyState` or a dedicated error variant) to
the two screens this audit found: `AddFood.jsx`'s category dropdown
(capture and surface `fetchCategories`' `error`, replacing the
misleading empty-list message) and `AdminOrders.jsx`'s restaurant
filter (surface `restaurantsOptionsError` with a visible retry,
matching the standard this file's own doc comment mistakenly claimed
it already met).

---

**8.7b done this session — both gaps 8.7a's audit found are fixed,
inline rather than via `EmptyState`** (neither screen's primary content
is unavailable — both are secondary, in-page fetches next to a form
that's otherwise fully usable, so a full-page `EmptyState` swap-out
would have been the wrong shape; the existing `Home.jsx` Categories-row
inline-error-plus-retry pattern already established in this codebase
fits a "secondary section degrades in place" failure better, and both
fixes reuse it):

- **`AddFood.jsx`** — `fetchCategories`'s `error`/`refetch` are now
  captured (previously only `data`/`loading` were). The Category
  `FormField` now gets a real `error="Couldn't load categories."` on a
  failed fetch, which `FormField`'s own `error || helperText` rule
  means takes over from the old misleading helper text automatically —
  the "No categories yet — you can add some from the Restaurant tab."
  message can no longer show on a network failure, only on a genuine
  zero-category restaurant. A `Retry` line (new `.categoryFieldFooter`/
  `.retryButtonInline` in `AddFood.module.css`, calling `refetchCategories`)
  sits directly below the field. The rest of the form (name/description/
  price, photo upload, submit) is untouched and stays fully usable while
  categories are broken — same "degrade the one broken piece, not the
  whole screen" shape as before, just no longer silent/misleading.
- **`AdminOrders.jsx`** — `useApiQuery`'s `refetch` is now destructured
  for the restaurant-options fetch (`refetchRestaurantOptions`). On
  `restaurantsOptionsError`, a new inline line ("Couldn't load
  restaurants." + Retry, new `.restaurantFilterError`/`.sectionStatus`/
  `.retryButtonInline` in `AdminOrders.module.css`, copied from
  `Home.module.css`'s own Categories-row trio) now renders above
  `FilterBar` instead of the dropdown group just silently not being
  there. The doc comment's own prior claim that this already matched
  `Home.jsx`'s precedent (checked and found false by 8.7a's own audit)
  is corrected in place rather than left standing. Status/date filtering
  and the rest of the page are unaffected by this one dropdown's
  failure, same as before.

Both fixes are additive/conditional-render only — neither changes any
existing success-path markup, props, or behavior when the fetch
succeeds (the common case), so nothing about either screen's already-
covered 8.1/8.2/8.3/8.6 responsive/loading-state work needed
re-verification.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either
(same as every 8.6b-e entry); verified by re-reading both edited files'
new conditional branches and confirming `error`/`refetch` are actually
returned by `useApiQuery` (checked against that hook's own source,
which does return both) and correctly wired, not a rendered/
screenshotted or click-tested check.

`docs/TASKS.md`'s 8.7b checkbox ticked. Next: **8.7c** — confirm every
`FormField`-based form (registration, login, restaurant profile, add
food, etc.) surfaces validation errors inline, not just via a blocked
submit.

---

**8.7c — full audit, one real gap found and fixed.** Traced every
`FormField`-based form in the codebase (13 files: `AddFood`,
`AdminLogin`, `AdminSettings`, `CustomerInfo`, `OrderHistory`,
`OwnerAccount` (profile + password, two separate forms),
`OwnerLogin`, `OwnerRegistration`, `OwnerRestaurant` (main profile
form + its category/service-area/payment-method modals),
`TrackOrder`) for the same three things: (1) a `validate(values)`
function whose `errors` are recomputed fresh every render, not just
once; (2) a per-field `error={touched.field ? errors.field : undefined}`
prop actually wired to `FormField`, not just an `errors` object that's
computed and then never rendered; (3) `handleSubmit` marking every
relevant field `touched` before its own `if (Object.keys(errors).length
> 0) return` bail, so a submit attempt with untouched fields still
reveals every blocking error at once rather than silently refusing to
proceed with nothing visible changing. `OwnerRestaurant.jsx`'s Opening
Hours section (no `validate`/`touched` pair at all — Task 5.5b's own
per-day inline editing) was checked on its own terms instead of being
held to that same three-part shape: it has no client-side validation to
begin with, but a failed save is never silently swallowed either —
`dayErrors[day.id]` renders inline right under the row that failed, so
it still meets 8.7c's actual underlying concern (no error a person
can't see) even without a `validate()` function.

**12 of the 13 already fully met all of this** — nothing to change.

**The one real gap: `OwnerRegistration.jsx`'s duplicate-email message
went stale instead of clearing when the field it was attached to
changed.** `isDuplicateEmail` (derived from the mutation's own `error`,
a 409) is merged into the email `FormField`'s own `error` prop
(`touched.email ? errors.email : isDuplicateEmail ? '...' : undefined`)
— so unlike the modal save-errors and login-screen credential banners
checked elsewhere in this pass (all separate, standalone banners below
the form, not merged into one specific field's own message), this one
is presented as if it were live, per-field validation. `useMutation`'s
own `error` only resets at the *start* of the *next* `mutate(...)`
call, not on every keystroke, and `handleChange` here never called the
hook's own `reset()` in between — so editing the email to a different,
perfectly valid address left "An account with this email already
exists" sitting under the field, now describing an address that was no
longer even in the box. Checked against this exact same shape
elsewhere first, since it looked like it might be systemic:
`OwnerAccount.jsx`'s own equivalent (`emailConflict`, same 409-merged-
into-`FormField`-error pattern for its profile form) already calls its
own `resetProfileSave()` inside `handleProfileChange` for exactly this
reason — so the fix pattern already existed in this codebase,
`OwnerRegistration.jsx` just hadn't been wired the same way.

**Fix:** `OwnerRegistration.jsx` now destructures `reset` from its own
`useMutation(registerOwner)` call and calls it inside `handleChange`,
matching `OwnerAccount.jsx`'s own `handleProfileChange` exactly.
Documented inline at the new `reset()` call. No other field on this
form merges a server error into its own `FormField` `error` prop the
same way (`fullName`/`phone`/`password` are pure client-side
`validate()` checks with no server-conflict counterpart), so this was
the only field on this screen the gap could apply to.

**Checked and deliberately left as-is, not a gap under this task's own
scope:** `AdminLogin.jsx`/`OwnerLogin.jsx`'s "invalid credentials"
banners have the same underlying `useMutation`-`error`-persists-until-
next-submit mechanism and also don't call `reset()` on change, but
neither merges that error into a specific field's own `FormField`
`error` prop the way `OwnerRegistration.jsx`'s email field did — both
render it as a separate, standalone banner below the form, the same
shape as `OwnerRestaurant.jsx`'s own modal save-errors
(`categorySaveError`/`areaSaveError`/`paymentMethodSaveError`), all of
which are fine to persist until the next submit attempt (a common,
unsurprising pattern for a whole-form failure banner). The problem
`OwnerRegistration.jsx` actually had was specific to a *field-level*
message pointing at a value the person had since changed, not the more
general "does a failed-submit banner linger" question — not
re-litigated as a second gap here, since it isn't one by the same
reasoning.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either;
verified by reading each form's `validate`/`touched`/`handleSubmit`
triplet and every `FormField`'s own `error` prop by hand, and by
re-checking the fix against `OwnerAccount.jsx`'s own already-correct
equivalent rather than assuming the pattern from description alone.

`docs/TASKS.md`'s 8.7c checkbox ticked. Next: **8.7d** — confirm
unmatched routes (`*` in `App.jsx`) and unmatched resource IDs (e.g.
`/food/:id`, `/owner/orders/:id` for a missing/foreign record) both
render a proper 404, not the raw dev `Placeholder`.

---

**8.7d done this session — one half already fine, the other a real gap,
now fixed.**

**Unmatched resource IDs were already fully covered, verified rather
than assumed:** every single-resource detail screen that can be reached
by a bad/foreign ID — `FoodDetails.jsx`, `RestaurantProfile.jsx`,
`OrderDetail.jsx`, `AdminRestaurantDetail.jsx`,
`AdminLiveRequestDetail.jsx`, and `AddFood.jsx`'s own Edit mode — already
derives `notFound = error instanceof ApiError && error.status === 404`
and renders a distinct, resource-specific `EmptyState` title ("Food not
found", "Order not found", etc.) rather than a generic connection-error
message or the raw `Placeholder`. This was built in as each of those
screens' own original task (3.9, 3.7, 5.13, 6.5b, 6.6f, 5.10/5.11), not
something this pass needed to add — confirmed by reading each, not
inferred from the pattern being common elsewhere.

**The `*` catch-all route was the real gap: it rendered `App.jsx`'s own
inline dev `Placeholder`** (an unstyled `<div>`, "NATRA" + "Not Found —
not built yet." in plain browser-default sans-serif, no navigation back
anywhere) for any unmatched URL — a leftover from before any real
screen existed at any route, never replaced because nothing ever
explicitly named this one route as needing to be. `Placeholder`'s own
top-of-file comment was explicit it was meant to mark an unbuilt screen
during development, not something meant for an actual visitor to land
on — exactly the "raw dev `Placeholder`" 8.7d's own title already
called out by name, not a hypothetical.

**Fix: new `src/pages/NotFound` (`NotFound.jsx`/`.module.css`/
`index.js`)**, wired as the `*` route's element in place of
`Placeholder`. Deliberately outside every `RoleShell` variant — same
"no reliable role signal to hang a nav shell off of" reasoning
`OwnerLogin.jsx`/`OwnerRegistration.jsx`/`AdminLogin.jsx` already give
for their own pre-auth screens, just applied to "no idea what this URL
was even trying to be" instead of "no account yet." Renders the same
`EmptyState` component every one of the six resource-404 screens above
already uses (own centered `.page`, `min-height: 100vh` since there's
no surrounding screen chrome here the way an in-page `EmptyState` has),
with a "Go to Home" button (`navigate('/')`, not `navigate(-1)` — a
mistyped/stale/bookmarked URL's own history may have nothing worth
returning to). `Placeholder` itself is removed outright from `App.jsx`
rather than left as unused dead code now that its one remaining caller
is gone — the historical doc comments elsewhere in that file and in
`frontend/README.md` that mention it by name are left as-is, same "these
are notes about what a route used to render, not references to code
that still exists" reasoning this project's own drift-NOTEs already
apply to stale documentation generally.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either;
verified by reading `App.jsx`'s full route list end to end for every
`:id`-shaped route and confirming each target screen's own `notFound`
branch by hand, and by reading `NotFound.jsx`'s own JSX/import graph to
confirm it renders and navigates correctly, not a rendered/browser-
navigated check.

`docs/TASKS.md`'s 8.7d checkbox ticked, which was the last item under
8.7 — **Task 8.7 (error states pass) is now fully complete, 8.7a-8.7d.**
Next: **8.8** — empty states pass (no orders, no foods, no restaurants,
no search results), starting with **8.8a**, `Home.jsx` — no restaurants
live yet / no popular foods yet.

---

**8.8a checked, already done — no code changes needed.** Both named
cases were already built correctly, distinct from their own equivalent
error states, back when Tasks 3.3/3.5 first wired each section to a
real endpoint:

- **Restaurants row** — `restaurants.length === 0` renders
  `EmptyState` with `"No restaurants yet"` / `"Check back soon — new
  restaurants go live all the time."`, a separate branch from
  `restaurantsError`'s own `"Couldn't load restaurants"` +
  Retry — a person on a slow connection or a genuinely-empty platform
  get two different, accurate messages, not one generic fallback
  covering both.
- **Popular Foods grid** — same shape, `popularFoods.length === 0` →
  `"No foods yet"` / `"Check back soon — restaurants are still building
  out their menus."`, distinct from `popularFoodsError`'s own
  `"Couldn't load popular foods"` + Retry.

Checked one adjacent thing this task's own title doesn't name, to rule
out a related gap rather than assume it away: the Categories chip row's
`selectedCategory` state doesn't actually filter the Restaurants row or
Popular Foods grid at all (a real, already-flagged-and-documented gap —
see this file's own header comment, "selecting a chip still doesn't
filter anything," deliberately left open since Task 3.6) — so there's
no "no restaurants *in this category*" case this task's own empty
states would need to distinguish from "no restaurants at all" the way,
say, `AdminOrders.jsx`'s own `hasActiveFilter` ternary does for its
list. Confirmed this isn't an 8.8a-shaped gap masquerading as a
different one: since category selection has no filtering effect yet,
`restaurants.length === 0`/`popularFoods.length === 0` really do mean
"no restaurants/foods exist right now," which is exactly what their
current copy says.

Also checked for icon consistency against 8.8's own sibling screens
(`OwnerOrders.jsx`/`OwnerMenu.jsx`/every other "no X yet" `EmptyState`
already shipped) — none of them pass an `icon` prop either (the one
`icon` usage anywhere in this codebase is `ComponentSandbox.jsx`'s own
mock demo, not a real screen), so `Home.jsx`'s own icon-less usage
already matches the app's own real, established convention rather than
being an oversight.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either;
verified by reading `Home.jsx`'s own conditional branches directly, not
a rendered/screenshotted check with an actually-empty dataset.

`docs/TASKS.md`'s 8.8a checkbox ticked. Next: **8.8b** —
`RestaurantProfile.jsx` — restaurant with no foods in a category.

---

**8.8b — stale task title, real thing underneath already correct, no
code changes needed.** Checked the premise before checking the screen:
this task's own title ("no foods *in a category*") implies
`RestaurantProfile.jsx`'s menu is grouped or filterable by category the
way, say, a restaurant-menu app with tabs per category might be — it
isn't, and was never built that way. `docs/NATRA_MASTER_PROMPT.md`'s
own "Restaurant menu" section (Task 3.8's own header comment quotes it
directly) specifies a single-column list of food cards with no
category grouping/filtering UI at all, and `restaurantMenu.js`'s own
header comment is explicit that a flat `f.name ASC` order was the
deliberate choice, "since nothing... specifies a category-grouped or
otherwise ranked order for a single restaurant's own menu." So there is
no per-category subsection or filter on this screen for a "no foods
*in a category*" case to distinguish from "no foods at all" — same
"stale label, not a missing feature" call this project's own log has
already made more than once for a task-text mismatch found mid-pass
(8.2c-i's `FilterBar` reference, 8.2h's owner-nav-treatment wording).

**The real, existing thing this task text was almost certainly getting
at — a restaurant with zero visible foods — is already handled
correctly**, and was checked directly rather than assumed from 8.8a's
own finding carrying over: `menuFoods.length === 0` renders `EmptyState`
with `"No foods yet"` / `"This restaurant hasn't added any visible
foods yet."`, a separate branch from `menuError`'s own `"Couldn't load
the menu"` + Retry — same "distinct copy for empty vs. broken" shape
8.8a already confirmed for `Home.jsx`'s own two sections. Built in
alongside Task 3.8's original menu-list work, not something this pass
needed to add.

Also checked, since it's the one place "category" and this screen
genuinely intersect even though the menu itself isn't grouped by one:
`AddFood.jsx`'s own optional Category select (Task 5.10) has no
customer-facing counterpart here at all — a food's `category_id` is
never read or displayed anywhere in `RestaurantProfile.jsx`, confirmed
by grep rather than assumed, so there's genuinely no category-scoped
view of this screen anywhere for an empty state to belong to.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either;
verified by reading `RestaurantProfile.jsx`'s own conditional branches
and cross-checking the "no category grouping" premise against
`docs/NATRA_MASTER_PROMPT.md`'s and `restaurantMenu.js`'s own words
rather than assuming it from the screen's current shape alone.

`docs/TASKS.md`'s 8.8b checkbox ticked. Next: **8.8c** — customer
search (`customerSearchController`) — no results for a query.

---

**8.8c checked, already done — no code changes needed.** Confirmed the
whole path end to end rather than trusting `Home.jsx`'s search section
by inspection alone, since this task names the backend controller
specifically: `Home.jsx`'s `fetchSearchResults` hits `GET /api/search`
(`customerSearch.routes.js`, mounted in `app.js`), which is
`customerSearchController.js`'s own `search` handler — the exact
function this task names — backed by `services/search.js`'s
`searchFoodsAndRestaurants`.

The empty-results case was already built correctly, same session Task
3.6 first wired this up:
`searchResults.restaurants.length === 0 && searchResults.foods.length
=== 0` renders `EmptyState` with `"No results"` /
`` `Nothing matched "${trimmedSearch}". Try a different search.` `` — a
query-specific message (unlike `Home.jsx`'s other two sections' generic
"no X yet" copy, this one echoes the actual search term back), and a
separate branch from `searchError`'s own `"Couldn't search"` + Retry.

**One adjacent case checked and confirmed already handled well, not a
gap**: a query that matches only restaurants or only foods (not zero
results overall, just zero in one half) doesn't get its own dedicated
"no matching foods" sub-message — the "Restaurants"/"Foods"
`searchSubsection` headings are each independently gated on
`.length > 0`, so a half with no matches simply doesn't render its own
subheading rather than showing an empty section with nothing under it.
Confirmed this isn't a masked gap: nothing in
`docs/NATRA_MASTER_PROMPT.md`'s search description calls for a
per-category "no matches" line, and a bare heading with nothing below
it would be worse UX than omitting it entirely — same "degrade a
missing subsection by omission, not with a redundant empty message"
shape already established elsewhere on this same screen (the
Categories chip row, per that section's own doc comment).

**Backend-side edge case also checked**: `customerSearchController.js`
requires `q` to be non-blank (a blank/missing `q` is a 400, not a
"zero results" response) — but the frontend's own `isSearching` guard
(`trimmedSearch.length > 0`) already ensures this endpoint is never
called with a blank query in the first place, so that 400 path is
unreachable from the real UI, not a gap the empty-state handling needs
to additionally cover.

No npm-registry access this session (`npm ping` → 403, same standing
gap since Task 2.10) — no automated frontend tests exist to run either;
verified by reading `Home.jsx`'s conditional branches together with
`customerSearchController.js`'s/`search.js`'s own validation, not a
rendered/screenshotted check against a real zero-result query.

`docs/TASKS.md`'s 8.8c checkbox ticked. Next: **8.8d** —
`OwnerOrders.jsx`/`OwnerMenu.jsx` — no orders yet / no menu items yet.

---

**8.8d checked, already done — no code changes needed.** Checked both
named screens rather than assuming from 8.8a-c's pattern that this one
would also already be built:

- **`OwnerOrders.jsx`** — `items.length === 0 && !loading` (inside
  `ListWithPagination`, Task 2.16) renders its `emptyState` prop: an
  `EmptyState` with `"No orders yet"` / `"New orders placed with your
  restaurant will show up here."` — a separate branch from this screen's
  own `error`-driven `"Couldn't load your orders"` + Retry, and from its
  own `noRestaurantYet` (403) branch's `"No restaurant set up yet"` —
  three distinct states, not one generic fallback covering all of them.
  Built in at Task 5.12b, alongside the screen's original wiring to
  `GET /api/orders`.
- **`OwnerMenu.jsx`** — same shape: `foods.length === 0 && !loading`
  renders `EmptyState` with `"No foods yet"` / `"Add a food to your menu
  to get started."`, plus an "Add food" action button linking to
  `/owner/restaurant/menu/new` — again a separate branch from this
  screen's own `"Couldn't load your menu"` + Retry. Built in at Task
  5.9b, alongside the screen's original wiring to `GET /api/foods`.

Both already match this pass's own established shape from 8.8a-c:
distinct copy for "genuinely empty" vs. "failed to load", using the
shared `EmptyState` component rather than ad hoc markup.

**One adjacent thing checked, not assumed away**: `OwnerOrders.jsx` has
no per-status empty case (e.g. "no New orders" while Accepted/Completed
ones exist) — same as the already-flagged absence of status filtering on
this screen (that file's own header comment, "No status filter/tabs...
out of scope for this task"). Since there's no filtering UI to produce a
"no results for this filter" state, `items.length === 0` really does
mean "this restaurant has no orders at all," which is exactly what its
current copy says — not a masked 8.8d gap.

No npm-registry access this session (`npm ping` → 403, same standing gap
since Task 2.10) — no automated frontend tests exist to run either;
verified by reading both screens' own conditional branches directly, not
a rendered/screenshotted check against genuinely-empty accounts.

`docs/TASKS.md`'s 8.8d checkbox ticked. Next: **8.8e** —
`TrackOrder.jsx`/`OrderHistory.jsx` — no order found for the given
ID+phone / no history for the given phone.

---

**8.8e checked, already done — no code changes needed.** Checked both
named screens rather than assuming from 8.8a-d's pattern:

- **`TrackOrder.jsx`** (Task 3.17) — a 404 from `GET /api/orders/track`
  (`notFound = error instanceof ApiError && error.status === 404`)
  renders a distinct message: `"We couldn't find an order with that
  Order ID and phone number. Double-check both and try again."` — kept
  separate from any other error's generic `error.message || 'Something
  went wrong...'` fallback in the same `resultError` slot. This is a
  deliberate design choice already logged in the screen's own doc
  comment: the backend's `getOrThrowByCode` treats a wrong code, a wrong
  phone, or a genuine mismatch between the two as one indistinguishable
  404, so the frontend doesn't invent a field-level error on either
  input that the backend's own response can't actually support.
- **`OrderHistory.jsx`** (Task 3.18c) — a submitted phone with zero
  matching orders renders `ListWithPagination`'s `emptyState` slot: an
  `EmptyState` with `"No orders found"` / `"We couldn't find any orders
  placed with that phone number."` — this is a real `200` with an empty
  list, not an error (the backend's `history` handler deliberately never
  404s for "no matches," per the screen's own doc comment), so it's
  gated on `hasSearched && !error`, correctly distinct from both the
  pre-search state (nothing rendered yet) and a genuine fetch failure
  (`"Something went wrong..."` in the `resultError` slot above it).

**One adjacent thing checked, not assumed away**: `OrderHistory.jsx`
never renders anything before a phone is submitted (`hasSearched =
submittedPhone !== null` gates the whole `ListWithPagination` block) —
so there's no risk of a premature "no orders found" flashing before the
customer has searched at all, the same "don't guess an answer before a
real request happens" shape 8.8a-d's own screens already established.

No npm-registry access this session (`npm ping` → 403, same standing gap
since Task 2.10) — no automated frontend tests exist to run either;
verified by reading both screens' own conditional branches and their
paired backend handlers' (`orderController.js`'s `track`/`history`)
comments on the 404-vs-200 distinction, not a rendered check against
real not-found data.

`docs/TASKS.md`'s 8.8e checkbox ticked. Next: **8.8f** —
`AdminRestaurants.jsx`/`AdminOrders.jsx`/`AdminLiveRequests.jsx` — no
results, and no results for the current filter (distinct copy from
"none exist at all").

---

**8.8f checked, already done — no code changes needed.** Checked all
three named screens:

- **`AdminOrders.jsx`** (Task 6.10b) — its own `hasActiveFilter =
  Boolean(debouncedSearch || restaurantId || status || date)` already
  drives distinct `EmptyState` copy: `"No matching orders"` / `"No
  orders match the current search/filters."` when any filter is active,
  vs. `"No orders yet"` / `"Orders placed across the platform will show
  up here."` when none is — exactly the "distinct copy from 'none exist
  at all'" this task asks for.
- **`AdminRestaurants.jsx`** (Task 6.4b) — same shape, keyed off
  `debouncedSearch` alone (its only filter): `"No matching restaurants"`
  / a message that echoes the actual search term back, vs. `"No
  restaurants yet"` / `"Restaurants will show up here once owners
  register."` when the search box is empty.
- **`AdminLiveRequests.jsx`** (Task 6.6d) — checked the premise before
  checking the screen: this task's own title implies a filter exists to
  have "no results for" — it doesn't. 6.6a's own backend query is
  hardcoded to `status = 'pending'` server-side (that file's own header
  comment: "this is specifically the admin's review to-do list"), and
  this screen has no `SearchBar`/`FilterBar`/any filter control at all
  (that same comment explains why: "no `status` query param... already
  hardcoded... server-side"). With no filter to distinguish "no results
  for the current filter" from "none exist," there is only one real
  empty case here — `"No live requests"` / `"Requests will show up here
  once owners submit their registration fee."` — and it already has one
  correct `EmptyState`. Confirmed by grep that no filter state
  (`useState` for search/status/etc.) exists anywhere in this file, not
  assumed from the visible JSX alone.

No npm-registry access this session (`npm ping` → 403, same standing gap
since Task 2.10) — no automated frontend tests exist to run either;
verified by reading all three screens' own conditional branches and
their paired backend list handlers' comments on filter support, not a
rendered check against real filtered/unfiltered admin data.

`docs/TASKS.md`'s 8.8f checkbox ticked, closing out **8.8** (all six
sub-tasks now done). Next: **8.9** — Accessibility/touch-target pass,
starting with **8.9a** — audit tap targets (buttons, nav items,
`QuantityStepper`, `ToggleSwitch`) against a 44×44px minimum on mobile
widths.

---

**8.9a — audit only, real gaps found.** This task's own title is
"Audit," not "audit and fix" (unlike, say, 8.7a/8.7b's explicit
audit/fix split) — so this pass documents every gap found below rather
than patching them inline, and a new **8.9a2** has been added to
`docs/TASKS.md` (same a/b/c-then-split convention as 8.2c, 8.7, Phase 7)
to apply the fixes as its own task. Measurements are computed from each
component's own `.module.css` (padding + line-height/icon-size), not a
rendered/screenshotted check — same standing no-npm-registry-access
caveat as every session since Task 2.10.

**Clear violations (well under 44px in at least one dimension):**

- **`QuantityStepper`'s `.button`** (the +/- controls) — explicit
  `width: 32px; height: 32px`. Used on `FoodDetails.jsx`/`OrderBuilder.jsx`
  to adjust cart quantities — a customer-facing, frequently-tapped
  control.
- **`Modal`'s `.closeButton`** — explicit `width: 32px; height: 32px`.
  Appears on every `Modal` instance across all three roles (delete
  confirmations, etc.).
- **`SearchBar`'s `.clearButton`** — explicit `width: 20px; height:
  20px`, the smallest single control found. Appears on `Home.jsx`'s
  customer search and every admin list's `SearchBar` (`AdminRestaurants.jsx`/
  `AdminOrders.jsx`).
- **`ToggleSwitch`'s clickable area** — the actual tap target is the
  `<label className={styles.wrapper}>` (native label-click-toggles-input
  behavior), not just the visible `.track`. `.wrapper` has no padding of
  its own, so its height is `max(.track's 24px, the label text's own line
  height)` ≈ 24px — well under 44px — despite gating real actions
  (Open/Closed on `OwnerDashboard.jsx`/`OwnerRestaurant.jsx`, a payment
  method's Active state, each opening-hours day's Closed toggle,
  `AdminSettings.jsx`'s notify-before-expiry).
- **The `.linkButton`/`.linkButtonDanger` family** — `padding: 0`, tap
  height ≈ the caption font's own line height (~16-18px). Present in 7
  files: `OwnerMenu.module.css` (Edit/Delete/Hide), `TrackOrder.module.css`
  /`OrderHistory.module.css` (the "View order history"/"Track it here"
  cross-links), `OwnerLogin.module.css`/`AdminLogin.module.css`/
  `OwnerRegistration.module.css` (auth-adjacent text links), and
  `OwnerRestaurant.module.css`.

**Borderline (short only in height, by a few px — width is generous from
horizontal padding):**

- **`FilterBar`'s `.chip`** and **`.dropdown`** — `space-sm` (8px)
  vertical padding + ~20px body-text line height ≈ 36px tall.
- **`ImageUploadField`'s `.button`** ("Upload photo") — same `space-sm`
  vertical padding shape, ≈ 36px tall.

**Confirmed already meeting the minimum — checked, not assumed:**

- **`RoleShell`'s bottom-nav `.navItem`** (customer/owner tab bar) — full
  56px nav height, `flex: 1` width; comfortably over 44px on both axes.
  This file's own header comment already documents the "full-height,
  equal-width tap target... rather than sizing to icon+label content"
  choice as deliberate.
- **`RoleShell`'s admin `.sidebarLink`** — `space-md` (12px) padding
  top/bottom + a 20px icon (the tallest content) ≈ 44px exactly — right
  at the floor, not under it.
- **The `.primaryButton`/`.secondaryButton` pattern** (the full-width CTA
  buttons repeated per-screen, e.g. `TrackOrder.module.css`) — `space-md`
  (12px) padding top/bottom + ~20px text ≈ 44px, same "right at the
  floor" result as the sidebar link, not a gap.

`docs/TASKS.md`'s 8.9a checkbox ticked (audit complete); the new **8.9a2**
line added right below it lists every item above for whoever picks up
the fix. Next: **8.9a2** — apply those fixes.

---

**8.9a2 — all seven items fixed.** Two different techniques, chosen per
item's own layout constraints:

- **Grown the visible box directly** (room to spare, no neighboring
  layout to disturb):
  - `QuantityStepper`'s `.button` — 32×32 → 44×44, `font-size` (the
    +/- glyph) left at 18px so the icon doesn't visually grow with the
    box.
  - `ToggleSwitch`'s `.wrapper` — added `padding: 10px 0` (vertical
    only), bringing the real clickable area (the `<label>`, since a
    label click toggles its linked input) from ~24px to ~44px tall.
    `.track`'s own 44px *width* — referenced by `OwnerRestaurant.module.css`'s
    own min-content math for this component — is untouched.
  - `FilterBar`'s `.chip`/`.dropdown` and `ImageUploadField`'s `.button`
    — vertical padding bumped `space-sm` (8px) → `space-md` (12px),
    closing the ~36px-measured gap to ~44px.
  - The `.linkButton`/`.linkButtonDanger` family (`OwnerMenu.module.css`,
    `TrackOrder.module.css`, `OrderHistory.module.css`,
    `OwnerLogin.module.css`, `AdminLogin.module.css`,
    `OwnerRegistration.module.css`, `OwnerRestaurant.module.css`) — added
    `min-height: 44px; display: inline-flex; align-items: center;`
    alongside the existing `padding: 0`, so the underlined text itself
    stays visually identical while its clickable box grows to 44px tall.
    `.linkButtonDanger` (`composes: linkButton` in the two files that
    define it) inherits the fix automatically.

- **Invisible expanded hit area, visible box unchanged** (both of these
  sit in space genuinely too tight to grow into without disturbing
  something else):
  - `Modal`'s `.closeButton` — stayed 32×32 visually (growing it at its
    existing `top`/`right: var(--space-md)` offsets would've eaten
    further into `.title`'s own margin than the current box already
    does); a `.closeButton::after` adds a 44×44 invisible layer centered
    on the same visible button. `.dialog`'s own `overflow-y: auto`
    doesn't clip it — the extra 6px/side stays inside `.dialog`'s 24px
    padding. A click anywhere in that invisible area still dispatches to
    `.closeButton` itself (a `::after` isn't a separate event target), so
    no JS/markup change was needed.
  - `SearchBar`'s `.clearButton` — stayed 20×20 visually (`.bar` has no
    fixed height, so growing this box would grow the whole search pill's
    height with it, everywhere `SearchBar` is used); same `::after`
    technique, `position: relative` added to `.clearButton` so the
    `::after`'s `position: absolute` resolves against it rather than an
    ancestor — `.clearButton` itself stays in the flex row's normal flow,
    so `.bar`'s height is unaffected.

No npm-registry access this session (`npm ping` → 403, same standing gap
since Task 2.10) — no automated frontend tests exist to run either (this
codebase has none yet); every change verified by re-reading each edited
`.module.css` file and manually computing the resulting box height
(padding + line-height/icon-size), plus a brace-count check across all
13 touched files to catch any accidental syntax break. No `.jsx` files
needed changes — every fix was CSS-only.

`docs/TASKS.md`'s 8.9a2 checkbox ticked. Next: **8.9b** — run a contrast
check on `DESIGN_TOKENS.md`'s color pairs (text-on-background,
`StatusBadge` variants, disabled states) against WCAG AA.

---

**8.9b — audit only, real failures found.** Same "audit, not audit-and-
fix" posture as 8.9a: computed WCAG relative-luminance contrast ratios
for every color pair `DESIGN_TOKENS.md` actually produces, by hand
(sRGB → linear → luminance → ratio, the standard formula — no
browser/screenshot tool available to read it off a rendered page). Each
pair is judged against the **correct** threshold for how it's actually
used, not a single blanket number: WCAG 2.1 AA needs **4.5:1** for
normal text, but only **3:1** for large text (≥24px regular, or
≥18.66px/14pt bold) *and* for non-text UI components/graphical objects
(SC 1.4.11) — a badge's own fill color as a status indicator, or a
toggle track's color, falls under that second, easier bar; only where a
pair's foreground is literal *text* does the 4.5:1 bar apply. Font
sizes/weights checked against each pair's real call site in
`docs/DESIGN_TOKENS.md`'s own font scale (`docs/TASKS.md`'s own linked
component files), not assumed.

| Pair | Ratio | Real usage (size/weight) | Normal-text AA (4.5:1) | Large-text/UI AA (3:1) |
|---|---|---|---|---|
| `color-text-primary` on `color-background` | 17.02:1 | headings/body, 14-22px | **PASS** | PASS |
| `color-text-primary` on `color-surface` | 17.48:1 | headings/body, 14-22px | **PASS** | PASS |
| `color-text-secondary` on `color-background`/`color-surface` | 4.22-4.34:1 | caption meta text (dates, "1.2 km · 5 areas"), 12px regular | **FAIL** | PASS |
| `color-text-secondary` on `color-surface-muted` (disabled fields/buttons) | 4.00:1 | disabled `FormField`/`QuantityStepper`/`ImageUploadField`/`Wizard` text, 12-14px | **FAIL** | PASS |
| `color-text-on-primary` on `color-primary` (`.primaryButton`, the CTA pattern repeated on ~30 screens) | 3.09:1 | button label, `font-size-body` (14px) semibold | **FAIL** | PASS |
| `color-text-on-primary` on `color-primary-pressed` | 3.89:1 | same CTA, pressed state | **FAIL** | PASS |
| `color-text-on-primary` on `color-primary-tint` (`SearchBar`'s `onPrimary` variant, `Home.jsx`'s header search) | 2.45:1 | input text/placeholder, 14px | **FAIL** | **FAIL** — the one pair that misses even the easier bar |
| `StatusBadge`'s `.success`/`.error` (white text on green/red fill) | 3.33-3.37:1 | badge label text, 12px semibold | **FAIL** | PASS |
| `StatusBadge`'s `.neutral` (text-secondary on surface-muted) | 4.00:1 | badge label text, 12px semibold | **FAIL** | PASS |
| `color-primary` text on `color-surface` (`.linkButton`'s own text color) | 3.09:1 | "Edit"/"View order history" etc., 12px semibold | **FAIL** | PASS |
| `color-error` text on `color-surface` (`.linkButtonDanger`) | 3.33:1 | "Delete", 12px semibold | **FAIL** | PASS |

**The pattern**: every pairing that puts *text* in the brand orange, its
white-on-orange inverse, the muted grey, or the two status colors misses
the 4.5:1 normal-text bar — only the near-black `color-text-primary` on
either light surface clears it. All of them (except the `primary-tint`
search bar) do clear the easier 3:1 bar, which is genuinely the right
bar for a few of these (a `StatusBadge`'s fill as a status *indicator*,
a `ToggleSwitch` track's color) but not for the ones listed above where
the color is literally behind or in front of readable text — those
genuinely fail AA as written today.

**Root cause, not a per-component bug**: `color-primary` (`#F2690C`)
and `color-success`/`color-error` are all **measured**, pulled directly
from the reference images' own pixel colors (`DESIGN_TOKENS.md`'s own
"measured" tag) — this project's own standing rule has been to trust
that measurement over a guess. Accessibility contrast was never one of
the things `DESIGN_TOKENS.md`'s Task 2.1/2.22 passes checked for, so
this is the first time anyone has. Fixing it means either accepting a
color that doesn't match the reference pixel-for-pixel, or accepting
these failures — a real design trade-off, not a padding/sizing tweak
like 8.9a2's fixes were. Left undecided here, split into **8.9b2** for
whoever makes that call, with three real options worth naming rather
than picking one unasked:
1. Darken `color-primary`/`color-success`/`color-error` enough to clear
   4.5:1 wherever they carry text (breaks the "measured, not invented"
   provenance those tokens currently have).
2. Add separate darker "text-safe" variants of each color, used only
   where the color sits behind/in front of text, keeping the original
   measured tones for large-scale fills/icons/borders that only need
   3:1.
3. Accept the failures as a known, documented gap (common for
   brand-orange palettes) and rely on redundant cues (icons, position,
   already-passing large-text contexts) rather than color+small-text
   contrast alone.

No npm-registry access this session (same standing gap since Task
2.10) — verified by hand-computing sRGB→relative-luminance→ratio for
every pair directly from `DESIGN_TOKENS.md`'s own hex values, not a
browser contrast-checker extension or rendered screenshot.

`docs/TASKS.md`'s 8.9b checkbox ticked; the new **8.9b2** line added
right below it, listing the three options above for whoever makes the
color-vs-accessibility call. Next: **8.9b2** — resolve those failures
(pending that decision), then **8.9c** — confirm every `FormField` has
a properly associated `<label>` and every icon-only button has an
`aria-label`.

---

**8.9b2 — resolved: darkened the measured colors.** Project owner chose
option 1 of 8.9b's three named options (darken the colors themselves,
accepting they no longer match the reference images pixel-for-pixel)
over the separate-text-safe-variant or accept-as-gap alternatives.

Darkened six tokens in HSL space (hue/saturation preserved, lightness
reduced only as far as needed) to clear 4.5:1 against every
background/foreground each one actually pairs with in the app:
`color-primary` `#F2690C`→`#C1540A`, `color-primary-pressed`
`#D65C08`→`#A44708` (kept meaningfully darker than the new primary so
the pressed state still reads as a state change, not just re-derived as
a flat 12% delta), `color-primary-tint` `#F88834`→`#BF5607`,
`color-success` `#1DA143`→`#188738`, `color-error` `#FA4F50`→`#EC0708`,
`color-text-secondary` `#707A8A`→`#687180` (this one checked against
all three backgrounds it appears on — white, `color-background`, and
the harder `color-surface-muted` — since it's the one token used as
foreground text against more than one surface). Computed via a scratch
Python script (sRGB→linear→relative-luminance→ratio, the same formula
8.9b's audit used by hand) rather than eyeballing; worst-case ratio for
every token is now 4.53–6.01, all clearing AA.

Applied in `frontend/src/styles/global.css`'s `:root` block only — grepped
the whole frontend for the six old hex values first and confirmed no
component hardcodes any of them outside that one file, so this was a
single-file change. `docs/DESIGN_TOKENS.md` updated with a new "Task
8.9b2" subsection recording old→new values, the ratio each clears, and
which background was the binding constraint, without deleting the
original measured-value tables (kept as historical record of what the
reference images actually show).

No npm-registry access this session (same standing gap since Task
2.10) — no visual/browser verification possible; correctness rests on
the same hand-computed contrast math 8.9b itself used, applied to the
new values as a self-check (shown in the DESIGN_TOKENS.md table above).
No component logic changed, only CSS variable values, so no test files
were affected.

`docs/TASKS.md`'s 8.9b2 checkbox ticked. Next: **8.9c** — confirm every
`FormField` has a properly associated `<label>` and every icon-only
button has an `aria-label`. (Note: `8.7e`, confirming expired/invalid-
token API responses redirect to the correct role's login, is still
unchecked and was skipped over by earlier sessions before 8.8/8.9
started — flagged here since it's now the only unchecked item earlier
than 8.9c in task order; not addressed in this session, which stayed
scoped to 8.9b2.)

---

**8.9c — audit only, no violations found; nothing to fix.** Same
"confirm" framing as the task text, not a fix task — checked both halves
programmatically rather than eyeballing 46+ call sites by hand:

1. **`FormField` label association.** `FormField.jsx` itself always
   renders a real `<label htmlFor={fieldId}>` when its `label` prop is
   truthy, and `fieldId` (explicit `id` or a `useId()` fallback) is
   shared with the control's own `id` — correct by construction. The
   open question was whether any of the app's call sites omit `label`
   entirely. Scanned all 46 `<FormField` usages across every page
   (`OwnerRegistration`, `OwnerLogin`, `OwnerAccount`, `AddFood`,
   `OwnerRestaurant`, `TrackOrder`, `AdminLogin`, `CustomerInfo`,
   `AdminOrders`, `AdminSettings`, `OrderHistory`, `ComponentSandbox`) —
   every single one passes a `label`. No violations.

2. **Icon-only buttons.** The 8.9a2 tap-target pass had already added
   `aria-label` to the app's genuine icon-only controls — confirmed
   still present: `Modal`'s close button ("Close"), `SearchBar`'s clear
   button ("Clear search"), `QuantityStepper`'s +/- buttons ("Decrease
   quantity"/"Increase quantity"), `ImageViewer`'s lightbox close button
   ("Close"). Swept every `<button>` in `components/` and `pages/`
   (~35 files) for ones whose only content is an icon/SVG with no
   plain-text child anywhere in the render tree — none turned up beyond
   the four already labeled above. Adjacent checks that came up clean
   while looking: `ImageViewer`'s thumbnail-trigger button has no
   separate `aria-label` but its only child is an `<img alt=...>`,
   which supplies the button's accessible name natively; `ToggleSwitch`
   wraps its checkbox in a real `<label>` and every one of its 5 call
   sites (`OwnerDashboard`, `OwnerRestaurant` ×3, `AdminSettings`)
   passes a `label` prop, so none render as an unlabeled switch;
   `RoleShell`'s nav links (all three role variants) pair every icon
   with a visible `<span>{label}</span>`, never icon-alone; the phone
   "Call Customer"/`tel:` links (`OrderDetail`, `RestaurantProfile`)
   render the number or "Call Customer" as visible text, not an icon.

No code changes this task — audit confirmed the app already meets both
bars, largely because 8.9a2's fixes and the components' own original
design (FormField's label-or-nothing API, ToggleSwitch's native
`<label>` wrapper) already covered this ground. No npm-registry access
this session (standing gap) — verification was static analysis (grep +
a scratch Python JSX-tag scanner) plus manual re-reads of each
flagged/borderline case, not a browser accessibility tool (axe, Lighthouse).

`docs/TASKS.md`'s 8.9c checkbox ticked. Next: **8.9d** — confirm visible
focus states exist for keyboard navigation on all interactive elements,
since admin is desktop/sidebar-first and likely to be keyboard-driven.
(Reminder, unchanged from last session: `8.7e` — expired/invalid-token
redirect — is still the one unchecked item earlier than 8.9d in task
order and was not addressed here.)

---

**8.9d — audit found one real gap, fixed.** Swept every `.module.css`
file (components/ and pages/) for `outline` rules — this codebase's
convention everywhere else is additive (`:focus-visible { outline: 2px
solid var(--color-primary); outline-offset: ... }` on cards/rows made
keyboard-focusable via `tabIndex=0` — `EntityCard`, `OwnerOrders`,
`AdminRestaurants`, `AdminOrders`, `AdminLiveRequests` all already do
this correctly) or a `outline: none` + `box-shadow` ring replacement on
the same selector (`FormField.control`, `FilterBar.dropdown`,
`ToggleSwitch.input+.track`, all `:focus-visible`-scoped and all fine).

`SearchBar.module.css`'s `.input` was the one exception: `outline: none`
with no replacement anywhere in the file — a real, all-of-Home.jsx's-
header-search-and-every-admin-list's-SearchBar-wide gap, since Tab-ing
into any search field in the app showed no focus indicator at all.
Fixed by adding the ring to `.bar` (the pill wrapper) via `:focus-within`
rather than `.input` itself, since `:focus-visible` doesn't apply to a
non-focusable wrapper and the pill shape has no clean room for a
squared outline on the input without clipping — same reasoning
`Modal`/`ImageViewer`'s own non-input focus rings already use elsewhere
in this codebase. Also added a second `.onPrimary:focus-within` rule
using `--color-text-on-primary` instead of `--color-primary`, since the
plain ring would be orange-on-orange-tint (nearly invisible) on the
header's `onPrimary` variant — same light-on-dark-background reasoning
`ImageViewer.module.css`'s own second `outline` rule already uses.

No other genuine gaps found: `RoleShell`'s nav links, `Wizard`'s
back/next buttons, `ListWithPagination`'s Previous/Next, and every
plain `<button>`/`<a>` elsewhere in the app rely on the browser's own
default focus ring, which nothing in `global.css` resets (checked — no
global `outline: none` or CSS reset touches focus anywhere).

No npm-registry access this session (standing gap) — verified via
static analysis (grep across every CSS file for `outline`) plus a
manual re-read of each hit's surrounding rule, not a real browser
Tab-through. `docs/TASKS.md`'s 8.9d checkbox ticked, completing all of
**8.9 in full**.

Next: the whole of Phase 8 (`8.1`-`8.9`) is now checked off except
**8.7e** (expired/invalid-token API responses should redirect to the
correct role's login) — flagged repeatedly the last two sessions as the
one earlier-numbered item skipped by whichever session jumped ahead to
8.8/8.9; picking that up now is the natural next task before moving to
Phase 9 (production deployment, `9.1`-`9.10`, all still unchecked).

---

**8.7e — real gap found, fixed (not just an audit this time).** Checked
`api/client.js`, `useApiQuery`/`useMutation`, and every owner/admin
screen for what actually happens on a 401 — found nothing: `authMiddleware.js`
(Task 1.14) returns one generic 401 for every expired/invalid/missing-
token shape, but the frontend had zero handling for it. A stale token
would just make every owner/admin screen render its normal 8.7b
network/server-error UI forever, with no way back to a working login
short of manually clearing localStorage.

Fixed with a small handler-registration pattern rather than a
full auth context/route-guard system (out of scope for a one-task
fix): `api/client.js` exports `setUnauthorizedHandler(fn)`; its
`request()` now checks `res.status === 401 && auth` (the `auth` flag is
what distinguishes a real expired-session 401 from `OwnerLogin`/
`AdminLogin`'s own `auth: false` "wrong password" 401 — those two
screens are completely unchanged, still show their existing inline
"Invalid email or password" message) — on a match it clears the stale
token via `tokenStorage.clear()` (so it can't keep getting re-attached
and re-rejected) and calls the registered handler, before still
throwing the `ApiError` as before (existing callers' `error` states are
unaffected; they just won't be looked at, since the redirect below
unmounts the screen). `App.jsx` is the one registrant (it's the only
component with `react-router`'s `navigate`/`location`, which the plain
`client.js` module has no access to): on mount and on every navigation,
it registers a handler that reads the *current* pathname to pick
`/admin/login` vs `/owner/login`, passing `state: { sessionExpired:
true }`, with a same-path guard so a stray authenticated call firing
right as a login screen itself mounts can never turn into a redirect
loop. Both login screens gained a new neutral `.noticeBanner` (grey,
not the existing green `.successBanner` or red `.formError` — a
genuinely different message tone) reading "Your session expired.
Please log in again." when that state flag is set — same
`location.state`-read pattern `OwnerLogin`'s existing `justRegistered`
banner already established, so refreshing or bookmarking either login
screen just shows the normal form with nothing to clean up.

No npm-registry access this session (standing gap) — verified via
`tsc --noEmit --noResolve --allowJs --jsx react-jsx --esModuleInterop
--skipLibCheck` on all 4 changed files (clean) plus a scratch
(unshipped) Node smoke test patching `import.meta.env` out of a copy of
the real `client.js` and running it against a faked `fetch`/
`localStorage`: confirmed an authenticated 401 clears the token and
fires the handler exactly once, a login-form 401 (`auth: false`) never
touches the token or fires the handler, and a successful authenticated
call never fires it either. Not a real browser end-to-end run (would
need a live expired token against a running backend).

`docs/TASKS.md`'s 8.7e checkbox ticked, **completing all of Phase 8**
(`8.1`-`8.9`) in full. Next: **Phase 9** (production deployment,
`9.1`-`9.10`) — provisioning a real Oracle Cloud VM, env/secrets,
reverse proxy/process manager, GitHub→VM deploy pipeline, pointing at
real Oracle Autonomous DB/Object Storage, per-role smoke tests, and
uptime/error monitoring. Every task in this phase needs real
infrastructure/credentials this sandbox has never had access to
(flagged standing gap throughout the project) — worth surfacing to the
project owner before starting 9.1, since this phase can't be
meaningfully hand-verified the way 0-8 were.
