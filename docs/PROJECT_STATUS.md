# NATRA — Project Status

Last updated: 2026-09-22 (11.5a-iii through 11.8)

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

**Second note on the "Next" line above (this session):** superseded
again — Phase 8 (8.1-8.9) and Phase 9 (deferred by the project owner,
see its own entry below) are both long since closed out, and Phase 10's
own Task 10.1 (Login screens) is now fully complete, 10.1a-10.1h,
ending with this session's 10.1h verification pass (see this section's
own bottom-most entry). Same "leave the trail" approach as the first
note — not rewritten, just superseded again. **Next: 10.2** — Customer
Home (`Home.jsx`) restyle, starting with 10.2a-i.

**Third note on the "Next" line above (this session):** superseded once
more — the project owner asked for one more fix ahead of 10.2, tracked
as the inserted **Task 10.1z** (image sizing/aspect-ratio, not login-
specific), now also complete (see this section's own bottom-most entry).
**Next: 10.2** — Customer Home (`Home.jsx`) restyle, starting with
10.2a-i, unchanged from the note just above.

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

---

**Phase 9 deferred, Phase 10 started instead.** Project owner confirmed
the app is already deployed to the Oracle VM (Phase 9's own work, done
outside this codebase's tracked history) and asked to move to **Phase
10** (Radical UI Redesign) instead. Per `docs/UI_REDESIGN_ROADMAP.md`'s
own "reference-driven, not guessed" rule, work only started once all 4
reference images named in that doc (login card, Customer Home, Owner
Dashboard, Admin Dashboard) were actually supplied — they now are.

**Task 10.0 — shared redesign kit — complete (10.0a–10.0e; 10.0f was
already dropped, see its own struck-through entry in `docs/TASKS.md`).**

- **10.0a** — sampled real pixel colors (Python/Pillow, same
  median-region method `DESIGN_TOKENS.md`'s original tokens used) from
  all 4 new reference images rather than eyeballing. The header
  gradient's sampled stops landed close enough to the app's *existing*
  `--color-primary`/`--color-primary-tint` that no new brand hex was
  needed — just a new `--gradient-header` token combining the two
  already-shipped colors. The login page's soft peach corner had no
  existing token, so one new color (`--color-page-glow`, `#FCF1E8`) plus
  `--gradient-page-preauth` were added; the gradient's other end reuses
  the existing `--color-surface-muted`. Both added to
  `docs/DESIGN_TOKENS.md` (full measured/inferred breakdown there) and
  `frontend/src/styles/global.css`. Deliberately did **not** reopen the
  Task 8.9b2/9.1 WCAG-darkening-vs-brighter-revert tradeoff on
  `--color-primary` itself — out of scope for this task, and the
  sampled reference matches the currently-shipped brighter values
  anyway.
- **10.0b** — new `DashboardHeader` component
  (`frontend/src/components/DashboardHeader/`): gradient shell, "NATRA"
  wordmark (reusing the existing `--font-family-brand`/'Astra' font
  already shipped for this exact purpose on `Home.jsx` and `RoleShell`'s
  admin sidebar, not a new font), a `subtitle` prop, and plain-text
  notification/account links (no bell/avatar icon — neither exists in
  the codebase) that only render when a real `href` is passed in. Not
  wired into `Home.jsx`'s customer header — that header has a search bar
  and no notification/account affordance at all, different enough
  content that `10.2a` keeps its own markup, just sharing this
  component's gradient/font tokens.
- **10.0c** — new `Greeting` component
  (`frontend/src/components/Greeting/`): client-computed time-of-day
  text (5–11 morning / 12–16 afternoon / 17–20 evening / else night —
  a standard convention, not measured; neither reference shows the
  boundary hours) plus a `subtitle` prop for each dashboard's own
  second line.
- **10.0d** — new `StatTile` component
  (`frontend/src/components/StatTile/`): count + label shell, no icon;
  a `variant` prop (`neutral`/`primary`/`success`/`error`/`info`) tints
  background/text via CSS `color-mix()` off the existing brand/status
  tokens rather than adding 4 more hardcoded hex values; an optional
  `to` prop renders the tile as a link with a plain text arrow
  ("→"), not an icon.
- **10.0e** — new `QuickActionTile` component
  (`frontend/src/components/QuickActionTile/`): text label + optional
  caption, no icon; a `toggle` prop renders the tile wrapping the real
  `ToggleSwitch` (Task 2.11) re-centered via one small CSS override,
  not a reimplementation: the Open/Closed tile is the only one of the
  4 Quick Actions that needs this, the other 3 (Add Food/View
  Orders/Check Live status) use the plain `to`-link shape instead.

No npm-registry access this session (standing gap, same as every prior
session) — verified via manual review plus a scratch Node bracket-
balance check on each new `.jsx` file (angle-bracket and brace counts
match), not a real build/render. `docs/TASKS.md`'s 10.0/10.0a–10.0e
checkboxes ticked. Next: **10.1** — restyle `OwnerLogin.jsx` +
`AdminLogin.jsx` against the login reference image, starting with
`10.1a`'s shared card/gradient shell (using `--gradient-page-preauth`
from 10.0a).

---

**10.1a — pre-auth card/page shell, both login screens.** CSS-only
change to `OwnerLogin.module.css`/`AdminLogin.module.css`'s `.page`/
`.card` rules — no JSX/markup touched, no other class in either file
touched (heading/banners/form/link styling is `10.1c`–`h`'s job).

- `.page`: `background` switched from flat `--color-background` to the
  new `--gradient-page-preauth` (Task 10.0a) — the soft peach-corner
  glow behind the card in the reference.
- `.card`: `border-radius` bumped `--radius-md` → `--radius-lg` (more
  generously rounded, matching the reference); the old `1px solid
  --color-border` outline dropped (reference shows no visible border,
  just the existing `--shadow-card` lift); `position: relative` +
  `overflow: hidden` added to host the new accent bar.
- New `.card::before`: a 6px solid `--color-primary` bar across the
  card's top edge — a pseudo-element, not a new DOM node, since it's
  pure decoration.

Applied identically to both files, since `10.1a` names this as the one
shared shell. `AdminLogin.module.css`'s own pre-existing Task 8.3a
verification comment and its separate dead-code note (`.successBanner`/
`.linkButton` are copy-pasted-but-unused in this file, per that
screen's own no-self-registration design) were both preserved, not
deleted, alongside the new Task 10.1a comment explaining the shell
change itself.

No npm-registry access this session (standing gap) — verified via
manual re-read of both files plus a scratch brace-count check (13/13
matched in both). Not a real browser render. `docs/TASKS.md`'s 10.1a
checkbox ticked. Next: **10.1b** — the "NATRA" plain-text header on the
card (no logo mark).

---

**10.1b — "NATRA" wordmark, both login screens.** Added a `<span
className={styles.brandName}>NATRA</span>` above the existing `<h1>` in
both `OwnerLogin.jsx`/`AdminLogin.jsx` — plain text only, no dot/mark,
per the governing rule's one named exception. Reuses
`--font-family-brand` (the 'Astra' font already shipped for this exact
wordmark elsewhere), styled dark (`--color-text-primary`) rather than
orange: the reference's "Zoble Chat" text itself is dark, with only the
(dropped) dot carrying brand color, so matching that text treatment is
closer to the reference than inventing an orange wordmark it doesn't
show.

Kept the existing "Owner login"/"Admin login" `<h1>` and instructions
paragraph unchanged, underneath the new wordmark rather than replacing
it — the reference's single generic form has nothing to distinguish,
but this app has two real, different login screens, and that's real
content this restyle isn't dropping. New `.brandName` CSS rule added to
both `.module.css` files, identical values.

No npm-registry access this session (standing gap) — verified via
manual re-read plus a scratch brace-count check (all 4 touched files
balanced). Not a real browser render. `docs/TASKS.md`'s 10.1b checkbox
ticked. Next: **10.1c** — restyle the Email/Password `FormField`s to
the rounded, filled-gray input style.

---

**10.1c-i — rounded, filled-gray Email input, both login screens.**
Restyled the Email `FormField` on `OwnerLogin.jsx`/`AdminLogin.jsx` only;
the Password field is deliberately unchanged (that is 10.1c-ii, kept as
its own task per the one-concern-per-task rule).

- **Scoped, not global.** `FormField` is shared by checkout,
  registration, settings and every other form, so per the roadmap's
  rule 5 (shared-component changes get named and sequenced, not patched
  in passing) `FormField.jsx`/`.module.css` are **untouched**. Instead
  the Email `FormField` gets `className={styles.inputField}` (its
  existing `className` prop already lands on the wrapper `<div>`), and a
  new `.inputField input { ... }` descendant rule in each login
  `.module.css` reaches the control. Same block in both files.
- **Measured from `docs/reference_ui/phase10_login_reference.jpg`**
  (Pillow median sampling, same method as `DESIGN_TOKENS.md`): fill
  `#F3F4F6`, 1px border ~`#E8E9EC`, corner radius ~9px and height ~42px
  at the capture's 2x scale. Existing tokens were close enough, so **no
  new tokens**: `background` -> `--color-surface-muted` (#F4F6F6);
  `padding` -> `--space-md`/`--space-lg` with `min-height: 44px` (keeps
  Task 8.9a's touch-target floor; reference is ~42px). `border` is
  intentionally *not* re-declared: existing `--color-border` (#DDE1E6)
  is slightly darker than the reference's ~#E8E9EC but not worth a new
  token, and leaving the shorthand alone lets FormField's own error and
  focus rules keep winning. Radius already equals `--radius-md` (12px),
  the nearest step to ~9px.
- **Contrast:** placeholder `#687180` on `#F4F6F6` = 4.54:1 (was 4.93:1
  on white) — still clears the 4.5:1 AA bar from Task 8.9b2, narrowly.
  Input text on the new fill is 16.1:1.

**Verification (real, unlike prior sessions' manual-only checks):** this
session had npm-registry access, so ran `npm ci` + `vite build`
(191 modules, passes) and rendered both screens in headless Chromium at
390px. Computed styles confirmed on both screens — Email: fill
rgb(244,246,246), 44px tall, 12px radius; Password: still white/34px
(unchanged, as intended). Error state (`aria-invalid`) still shows the
red border; focus still shows the orange ring; no console/page errors.
Compiled CSS shows the two `.inputField` rules under distinct hashed
class names, so neither leaks to other screens.

Noted, not fixed (out of scope): `eslint src` cannot run — the repo has
no ESLint config file, though `package.json` has a `lint` script.
`docs/TASKS.md`'s 10.1c-i checkbox ticked. Next: **10.1c-ii** — same
restyle on the Password `FormField` (apply `styles.inputField` to it;
no new CSS should be needed).

---

**10.1c-ii — rounded, filled-gray Password input, both login screens.**
Added `className={styles.inputField}` to the Password `FormField` in
`OwnerLogin.jsx`/`AdminLogin.jsx` — the exact rule 10.1c-i already
shipped, opted into by the second field. **No new CSS**; the only
stylesheet edit is refreshing the `.inputField` comment in both
`.module.css` files, which said "Email only" and would now be stale.
`FormField.jsx`/`.module.css` still untouched (same shared-component
reasoning as 10.1c-i).

**Verification:** `vite build` passes; rendered both screens in headless
Chromium at 390px. Email and Password now compute identically on both
screens — fill rgb(244,246,246), 44px tall, 12px radius, 12px/16px
padding. Password error state (`aria-invalid`) still shows the red
border; focus still shows the orange ring on the gray fill; typed-text
color is the primary text token. No horizontal overflow at 320/768/
1440px; no console/page errors. (10.1h still owns the formal 4-
breakpoint pass — these are spot checks, not a substitute for it.)

`docs/TASKS.md`'s 10.1c-ii checkbox ticked. Next: **10.1d** — restyle
the primary submit button (bold orange full-width pill, "Log in" on both
screens).

---

**10.1d — primary "Log in" button, both login screens.** Restyled
`.primaryButton` in `OwnerLogin.module.css`/`AdminLogin.module.css`
(identical block in each); added one additive token to `global.css`. No
JSX change — both buttons already read "Log in" (and "Logging in…" while
loading).

Measured from `docs/reference_ui/phase10_login_reference.jpg`: button
533x83px (same width and ~same height as the inputs), vertical gradient
`#FF691C` -> `#E75D12`, corner radius ~15px, bold label ~1.18x the
field-label size, faint orange-tinted glow beneath.

- `background`: new token `--gradient-button-primary` =
  `linear-gradient(180deg, --color-primary, --color-primary-pressed)`.
  Existing colors bracket the reference within ~17/255 per channel, so
  no new hex — only a new gradient, same approach as 10.0a's
  `gradient-header`. Documented in `docs/DESIGN_TOKENS.md` (new Task
  10.1d section).
- `font-size` 14px -> `--font-size-title` (16px), `font-weight` 600 ->
  `--font-weight-bold` (700).
- `min-height: 44px` (matches the 10.1c inputs and the 8.9a touch-target
  floor); soft `box-shadow` from `color-mix()` on `--color-primary`
  (same technique `StatTile` already uses); reset to `none` on
  `:disabled` so a gray loading button doesn't keep an orange glow.
- Existing `:active` (flat `--color-primary-pressed`) and `:disabled`
  (gray) rules untouched apart from that shadow reset.

**Flagged — task-wording vs. reference mismatch (reference followed):**
`docs/TASKS.md` describes this as a "pill". The reference's button is a
rounded rectangle with the same ~15-19px-at-2x rounding as the inputs; a
true pill at this height would be ~41px. Per the roadmap's "reference-
driven, not guessed" rule, kept `--radius-md` (12px, same as the inputs)
instead of `--radius-pill`. If a full pill is actually wanted, it is a
one-token swap (`border-radius: var(--radius-pill)`) in both files.

**Flagged — contrast (unchanged tradeoff, not reopened):** white label
on the gradient is 3.09:1 (top) to 3.89:1 (bottom); the old flat fill
was 3.09:1, so nothing regresses. Still below 4.5:1 — that is Task 9.1's
standing decision to restore the brighter brand orange.

**Verification:** `vite build` passes (191 modules); headless Chromium
at 390px on both screens. Computed: 44px tall, 12px radius, 16px/700,
gradient background-image, glow present. Pressed state falls back to
flat `rgb(214,92,8)`. Loading state (request held open, since a first
attempt raced the response) confirmed disabled: gray fill, no gradient,
no shadow, `not-allowed` cursor, still 44px. 401 path shows "Invalid
email or password." above the re-enabled button. No horizontal overflow
at 320/768/1440px; no console errors. (10.1h still owns the formal
4-breakpoint pass.)

`docs/TASKS.md`'s 10.1d checkbox ticked. Next: **10.1e** — `OwnerLogin.jsx`
only: restyle the "Don't have an account? Register your restaurant" link
and the existing `successBanner`/session-expired notice to the new
palette.

---

**Standing rule recorded — device-size compatibility (project owner
reminder, no task number).** Written into `docs/UI_REDESIGN_ROADMAP.md`
as Working process rule 6 (full build rules + verification bar) and
summarized under Phase 10's intro in `docs/TASKS.md`, so it travels with
the zip and applies to every remaining Phase 10 task. Core of it: no
task may trade device-size support for visual fidelity; references are
phone mockups, not pixel specs; if a reference conflicts with
responsiveness, responsiveness wins and the deviation is flagged; every
task is verified in a real render (320/390/768/1024/1280/1920px + a
landscape phone) before being ticked, on top of each screen's own
`10.x-h`/`10.x-f` pass.

**Retroactive audit of 10.1a–10.1d against the new rule** (headless
Chromium against the production build): both login screens x 11
viewports (320x568, 360x640, 390x844, 414x896, 600x900, 768x1024,
1024x768, 1280x800, 1440x900, 1920x1080, 667x375 landscape) x 3 states
each (default; session-expired/"account created" banners on owner, the
session-expired notice on admin; 401 error with a deliberately very long
email) = 66 combinations. Checked per combination: no page-level
horizontal overflow, card inside the viewport, no child element escaping
the card, no clipped text, every input/button >= 44px tall, button width
== input width. **0 issues.** Card is 288px at 320px wide (256px
content column, same worst case earlier phases established) and caps at
420px from 768px up. This audit is a spot check, not 10.1h — that formal
task is still open and now also runs against this rule.

No code changed this step (docs only). Next: **10.1e** — `OwnerLogin.jsx`
only: restyle the "Don't have an account? Register your restaurant"
link and the `successBanner`/session-expired notice, verified at all
sizes per the rule above.

---

**10.1e — `OwnerLogin.jsx` only: "create account" link + banners.**
Files touched: `OwnerLogin.jsx`, `OwnerLogin.module.css`. `AdminLogin.*`
untouched (its own notice is 10.1f). Other pages' `linkButton`/
`successBanner` classes are separate per-page CSS modules and were
confirmed unaffected by grep.

**Link row.** Reference: plain gray "Don't have an account?" followed by a
bold orange link, no underline, centered, ~14px (sampled gray ~#63666F,
orange ~#EA6C15, no underline row present). The single underlined
12px button became `<p class="altAction"><span>Don't have an
account?</span><button class="linkButton">…</button></p>` — same
`navigate('/owner/register')` handler, only the actionable part is the
button. `.altAction` is a wrapping, centered flex row; `.linkButton` is
now 14px/700 `--color-primary`, no underline at rest, underline on
`:hover`/`:focus-visible`, still `min-height: 44px` (8.9a2), and the old
`align-self: center` was removed (no longer a direct child of the card's
column).

**Banners.** The reference shows none, so they follow its visual language
rather than copying a shape: 12px radius and 12px/16px padding (same as
the restyled inputs), soft tinted fill, tinted 1px border.
`.successBanner`: 10% `--color-success` tint + 35% border via
`color-mix()` (the old `--color-success-subtle` fallback var was never a
real token). `.noticeBanner`: `--color-page-glow` peach (10.0a's login-
reference token) + 30% brand-orange border — clearly distinct from the
green success banner. **Text on both is now `--color-text-primary`, not
green/gray:** green text is only 4.60:1 on plain white and falls under
AA on any visible tint (4.04:1 at 10%, 4.37:1 even at 4%), so meaning is
carried by fill+border and text stays >15:1.

**Flagged decisions:**
- *Copy:* kept the real "Register your restaurant" text rather than the
  reference's "Create one" (governing rule: no invented text). It is
  longer, so the row wraps — see below.
- *Link distinguishability:* orange vs. the gray neighbour text is only
  1.60:1, below the 3:1 WCAG 1.4.1 wants when color is the only cue.
  Following the reference (no resting underline), the non-color cues are
  bold weight plus underline on hover/keyboard focus. If a resting
  underline is preferred for accessibility, it is a one-line change.
- *Orange on white* is 3.09:1 (14px bold) — the standing Task 9.1 brand-
  color tradeoff, same as the old link, not reopened.
- *Notice color:* peach/orange tint for "session expired" is a judgment
  call (the reference has no banner); a neutral gray would also fit.

**Verification per the new device-size rule** (real render, headless
Chromium, production build): 11 viewports (320x568, 360x640, 390x844,
414x896, 600x900, 768x1024, 1024x768, 1280x800, 1440x900, 1920x1080,
667x375 landscape) x 3 states (default; both banners; 401 error with a
very long email) = 33 combinations, **0 issues** — no page overflow, card
in viewport, nothing escaping the card, no clipped text, all inputs/
buttons >= 44px, banners inside the card. Link row: single centered line
from 600px up (card caps at 420px, 388px column, content 366px); below
~415px the link wraps to its own centered line with symmetric gaps (a
wider fallback font in the test container makes this conservative — real
phone fonts may keep it on one line at 390px; both outcomes are
handled). Behavior: link underline none at rest / underline on hover and
keyboard focus; click navigates to `/owner/register`; banner computed
styles as designed. Visually inspected at 390px and 320px. Note: my
first "line count" metric compared `top` values and wrongly reported 2
lines everywhere (centered items of different heights); re-measured with
vertical centers before trusting it.

`docs/TASKS.md`'s 10.1e checkbox ticked. Next: **10.1f** — `AdminLogin.jsx`
only: restyle its existing session-expired notice / inline error to the
new palette (and confirm no create-account link is added — none exists
for admin by design).

---

**10.1f — `AdminLogin` session-expired notice + inline error.** File
touched: `AdminLogin.module.css` only (no JSX change needed — the
markup/roles were already right). `OwnerLogin.*` untouched.

- `.noticeBanner`: restyled to exactly the values Task 10.1e gave
  `OwnerLogin.module.css` (peach `--color-page-glow` fill, 30% brand-
  orange border via `color-mix()`, 12px radius, 12px/16px padding,
  `--color-text-primary` text at 15.7:1) so the two screens' notices are
  identical.
- `.formError` (both the invalid-credentials message and the wrong-role
  "This account is not an admin account." message share it, both
  `role="alert"`): from bare red text to the same tinted-banner family —
  8% `--color-error` fill, 30% border, 12px/16px padding, semibold, dark
  text. Same contrast constraint as 10.1e's success banner: red text is
  4.56:1 on white but 3.97:1 on an 8% tint (4.12:1 even at 6%), under
  AA, so the fill/border carry "error" and text stays at 15.2:1.
- **Confirmed: no create-account link exists or was added.** Code check
  (`AdminLogin.jsx` has no register/forgot/link markup at all — admin
  self-registration doesn't exist by design, per 8.3a) plus a render
  assertion in every state at every size: zero `a`/link-class elements
  and no "register"/"forgot"/"don't have an account" text in the card.
  The pre-existing dead `.successBanner`/`.linkButton` CSS in this file
  is unchanged and still dead (out of scope, same note as before).

**Flagged — gap, now tracked as new task 10.1f2:** `OwnerLogin`'s own
`.formError` ("Invalid email or password.") is still bare red text; no
existing task assigned it (10.1e = link + banners, 10.1f = admin). Left
untouched here because it is outside 10.1f's stated file scope, and
added to `docs/TASKS.md` as an explicit unchecked subtask (CSS-only, the
values are already decided). Confirmed in render: owner's error still
computes to plain rgb(236,7,8) with no fill/padding, i.e. the two login
screens currently differ until 10.1f2 lands.

**Verification per the device-size rule** (real render, headless
Chromium, production build): 11 viewports (320x568, 360x640, 390x844,
414x896, 600x900, 768x1024, 1024x768, 1280x800, 1440x900, 1920x1080,
667x375 landscape) x 5 states (default; notice; 401 error with a very
long email; wrong-role message via a stubbed 200 non-admin login;
notice + error together) = 55 combinations, **0 issues** — no page
overflow, card in viewport, nothing escaping the card, no clipped text,
inputs/buttons >= 44px, messages inside the card edges. Visually
inspected at 390px (notice + error together).

`docs/TASKS.md`'s 10.1f checkbox ticked; 10.1f2 added. Next: **10.1f2**
(small CSS-only gap-closer, keeps the two screens consistent) then
**10.1g** — confirm no "Forgot password?" link on either screen.

---

**10.1f2 — `OwnerLogin` inline error restyle (gap-closer from 10.1f).**
`OwnerLogin.module.css`'s `.formError` moved from bare red text to the
same tinted-banner treatment `AdminLogin` got in 10.1f: 8% `--color-error`
fill, 30% border via `color-mix()`, 12px radius, 12px/16px padding,
semibold, `--color-text-primary` text (15.2:1; red text is under AA on
the tint, same reasoning as 10.1e/10.1f). Confirmed in render that the
owner and admin inline errors now compute to identical styles, so the two
login screens match again. No JSX change.

**Bug found by the stress test, fixed in both screens (device-size
rule):** a server error message containing a long *unbroken* token (an
ID, URL, etc.) spilled out of its banner at every viewport width, even
1920px — ordinary sentences wrap fine, only space-less text didn't. Fix:
`overflow-wrap: break-word` (broad support, incl. older Android
WebViews) followed by `overflow-wrap: anywhere` (newer; also corrects
min-content sizing), added to `.formError` in **both**
`OwnerLogin.module.css` and `AdminLogin.module.css`. The latter is a
correction to my own 10.1f work: that task's `.formError` comment
claimed a long message "can't overflow the card at 320px", which was
only true for ordinary text; the comment is corrected and the same fix
applied. (The other message classes, `.successBanner`/`.noticeBanner`,
render fixed developer-authored copy, so were not changed.)

**Verification per the device-size rule** (real render, headless
Chromium, production build): both screens x 11 viewports (320x568,
360x640, 390x844, 414x896, 600x900, 768x1024, 1024x768, 1280x800,
1440x900, 1920x1080, 667x375 landscape) x 6 states (default; banners;
401 with a very long email; 500 with a long sentence; 500 with a long
unbroken token; banners + 401) = 132 combinations. Before the overflow
fix: owner 11/66 failing (all the unbroken-token state, every width).
After: **0/132 issues** — no page overflow, card in viewport, nothing
escaping the card, no message content overflowing its own box, no
clipped text, inputs/buttons >= 44px. Visually inspected the worst case
(unbroken token at 320px) and the normal 401 look.

Process note: one build in this step failed only because `npx vite` was
run from the project root (no `node_modules`), so npx fetched a
different Vite; rerun from `frontend/` with the project's own Vite
5.4.21 built cleanly (191 modules). No code was affected.

`docs/TASKS.md`'s 10.1f2 checkbox ticked. Next: **10.1g** — confirm no
"Forgot password?" link is added to either screen (no backend flow
exists), and flag it as a real future feature in the roadmap doc.

---

**10.1g — confirm no "Forgot password?" on either login screen; flag as
a future feature.** Docs-only; **no code changed** (the correct outcome
for a "confirm nothing was added" task).

**Verified against the code, not just the roadmap's claim:**
- Frontend `src/`: no forgot/reset-password UI. The only grep hits are
  unrelated — `OwnerAccount.jsx`'s `resetPasswordSave` is a `useMutation`
  state-reset helper, and `OwnerRegistration.jsx`'s comment itself says
  no task adds password reset yet.
- Backend: no forgot/reset route, controller, service, model or
  migration. Auth routes are `signup`, `login`, `GET/PATCH /me`,
  `PATCH /me/password` (requires login + current password, so not a
  recovery path).
- Backend has **no email or SMS dependency at all** — the biggest reason
  this can't be a link-only restyle (no way to deliver a reset code).
- Render check (headless Chromium, production build): 2 screens x 5
  widths (320/390/768/1280/1920) x 3 states (default, banners, 401) = 30
  checks, **0** forgot/reset/recover affordances. Owner screen has
  exactly two buttons ("Log in", "Register your restaurant") and zero
  anchors; admin has exactly one ("Log in") and zero anchors — so also
  re-confirms 10.1f's "no create-account link on admin".

**Recorded:** new "Flagged future features (deliberately NOT built in
Phase 10)" section in `docs/UI_REDESIGN_ROADMAP.md` (existing Login
finding now cross-references it). It lists what a real implementation
needs (delivery channel decision, reset-token table, two endpoints with
rate limiting, two screens, anti-enumeration parity with the generic
login error, an admin-account decision) and where the UI link would go
per the reference, held to the device-size rule.

**Flagged for the project owner — operational gap, not a UI issue:**
until such a feature exists, a locked-out owner or admin has no self-
service recovery, and admin has no "reset an owner's password" tool
(admin is deliberately lightweight). Recovery today = a manual database
fix by whoever operates the deployment. Worth deciding whether that is
acceptable for launch, independent of this redesign.

`docs/TASKS.md`'s 10.1g checkbox ticked. Next: **10.1h** — the formal
responsive/verification pass at all 4 breakpoints for both restyled
screens (all states, against the device-size rule and the login
reference image), which closes out task group 10.1.

---

**10.1h — formal responsive/verification pass, both login screens; no
code changes needed.** **No npm-registry access this session**
(`npm ping` → 403 — confirmed fresh, not assumed) and no `node_modules`
anywhere in this checkout, so the real-render/headless-Chromium method
10.1c-10.1f2 used wasn't available here — this pass falls back to the
same manual CSS/markup trace every no-npm-access session before Task
10.1c used, applied against every class 10.1a-g actually touched
(`.page`/`.card`/`.card::before`, `.brandName`/`.heading`/
`.instructions`, `.successBanner`/`.noticeBanner`/`.formError`,
`.inputField input`, `.primaryButton` (+`:active`/`:disabled`),
`.altAction`/`.linkButton`), at this project's own established 4
breakpoints (320/768/1024/1280px, `ResponsiveGrid`'s own breakpoints,
Task 2.7) rather than the wider 11-viewport set 10.1e/10.1f/10.1f2's
own real-render sessions additionally covered — a narrower check than
those sessions ran, flagged plainly rather than presented as equivalent.

**Worst-case content column, re-derived from the actual current CSS**
(not assumed from an earlier phase's figure): at 320px, `.page`'s own
`space-lg` (16px) horizontal padding each side leaves a 288px `.card`
(unchanged from Task 8.2a's own figure — `.card`'s `max-width: 420px`
was never touched by 10.1a, only its radius/border/shadow), and `.card`'s
own `space-lg` horizontal padding each side leaves a 256px content
column — the same figure every `.card`-based screen since Task 8.1 has
used, confirming 10.1a's shell restyle didn't change the width math,
only the visual treatment (gradient background, radius, dropped border,
top accent bar).

**Traced every element against that 256px column, all states, both
screens:**
- `.brandName` (\"NATRA\", `--font-size-heading` 22px bold) and `.heading`
  (\"Owner login\"/\"Admin login\", same size/weight) — short strings,
  comfortably under 256px at every breakpoint; `.instructions` is a
  plain paragraph with no `white-space` override, wraps normally like
  every other plain-paragraph field this whole pass has already
  established is safe (8.2b-ii onward).
- `.successBanner`/`.noticeBanner`/`.formError` — all three now share
  the same shape (`space-md`/`space-lg` padding, `radius-md`, no fixed
  width beyond the card's own column). `.formError` specifically was
  stress-tested for a long *unbroken* token by 10.1f2's own real-render
  session and fixed there (`overflow-wrap: break-word`/`anywhere`); that
  fix is unchanged and confirmed still present in both files' current
  CSS. `.successBanner`'s real copy (\"Account created — log in to
  continue.\") and `.noticeBanner`'s (\"Your session expired. Please log
  in again.\") both wrap onto 2 lines well inside 256px at the narrowest
  width — no unbroken word in either is close to that limit.
- `.inputField input` — `FormField.module.css`'s own `.control` is
  `width: 100%` (confirmed by re-reading that file directly, not
  assumed), so the 10.1c override only changes padding/background/
  min-height, never width; both Email and Password fields fill the
  256px column at every breakpoint with no risk of overflow regardless
  of typed content, same as every other `FormField` usage already
  verified across Tasks 8.1e/8.2a.
- `.primaryButton` — `width: 100%`, `min-height: 44px` (still meeting
  the Task 8.9a floor), label text (\"Log in\"/\"Logging in…\") far under
  the column width at every breakpoint; `:disabled` (loading state) and
  `:active` (pressed) only change fill/shadow, not geometry.
- `.altAction`/`.linkButton` (owner-only) — already given a dedicated
  real-render check across 11 viewports in Task 10.1e's own session
  (wraps to 2 centered lines below ~415px, single line at 600px+); this
  session's own manual trace over the same CSS reaches the same
  conclusion and finds nothing to add — not re-verified from scratch,
  cross-checked against that entry's own numbers instead.
- `.card::before` (the 6px top accent bar) — absolutely positioned,
  `left: 0; right: 0`, inside `.card`'s own `overflow: hidden` — spans
  the card's actual rendered width at every breakpoint by construction,
  not a fixed pixel value that could mismatch a resized card.

**Vertical/landscape check** (the one axis the 4 named breakpoints don't
by themselves cover): `.page` is `min-height: 100vh`, not `height`, with
no `overflow: hidden` on it or `.card` — so on a landscape phone
(~375px tall) where the full card (heading + instructions + banner(s) +
two 44px inputs + button + link row, each separated by `space-lg` gaps)
exceeds the viewport height, the page scrolls vertically rather than
clipping anything. Confirmed no ancestor introduces a fixed height or
`overflow: hidden` that would prevent that scroll (`index.html`/`App.jsx`
were checked, neither sets one).

**Every state checked**: default; owner's `justRegistered` banner;
both screens' `sessionExpired` notice; both screens' 401
`isInvalidCredentials` error; admin's `wrongRole` error; a client-side
validation error (`touched.email && errors.email`, `FormField`'s own
already-verified error-message slot, Task 8.7c); banner+error shown
together (owner: notice + 401; admin: notice + wrongRole). All reuse
classes/components already traced above — no state introduces a new
element shape this pass hadn't already covered.

**Against the login reference image**
(`docs/reference_ui/phase10_login_reference.jpg`): re-compared both
screens' current markup/CSS side-by-side with the reference one more
time before closing out 10.1 — gradient page background, white rounded
card with the orange top bar, \"NATRA\" wordmark, filled-gray rounded
inputs, gradient primary button, and (owner only) the gray-text-plus-
bold-orange-link row are all present and match; the two flagged,
already-recorded deviations (10.1d's rounded-rectangle button radius
instead of a true pill; 10.1g's deliberately-omitted \"Forgot password?\"
link, flagged as a future feature) are unchanged, not re-litigated here.

**Gap acknowledged, not fixed here**: this session's manual trace has
less confidence than a real rendered check — it can't catch a genuine
CSS cascade/specificity bug (the kind Task 8.3g's own source-order bug
was, caught only by a careful manual reread) or a browser-specific
rendering quirk the way 10.1c-10.1f2's actual headless-Chromium runs
could. Nothing in this trace contradicts any of those sessions' own
real-render results (all of which already passed 0 issues at 11
viewports each), so this pass finds no new issue to report — but a real
browser re-run of the full 11-viewport/all-states matrix, the first time
npm/build access is available again, would be worth doing before
treating 10.1 as fully browser-verified rather than CSS-trace-verified.

`docs/TASKS.md`'s 10.1h checkbox ticked, which closes out every
sub-item under **Task 10.1 (Login screens)** — its own top-level
checkbox ticked too. Next: **10.2** — Customer Home (`Home.jsx`)
restyle, starting with **10.2a-i**, the header's solid orange band
container (layout shell only, no content placement yet).

---

**10.1z — project owner request, inserted before 10.2: fix restaurant
cover/profile and food thumbnail/card image sizing so none of them
expand to the uploaded photo's own pixel size.** Not a login-screen
task (kept out of 10.1's own numbering, which is why it's `10.1z` —
this project's convention for an inserted, sequence-breaking task, same
idea as `8.9a2`/`10.1f2`), and done before starting 10.2 per the
project owner's own ordering request.

**Full audit, every `<img>` in the frontend traced to its container's
CSS** (7 components/pages: `EntityCard`, `ImageUploadField`,
`ImageViewer`, `RestaurantProfile`, `FoodDetails`, `OrderBuilder`,
`OrderDetail`/`AdminLiveRequestDetail`/`AdminRestaurantDetail`) rather
than trusting Task 8.4e's own older CLS-focused pass, which checked a
narrower set of screens for a different concern (layout shift, not
uploaded-photo-size independence) and predates several of these files'
current state.

**Six of seven already had this right, confirmed by re-reading each,
not assumed from 8.4e's earlier finding:** `EntityCard`'s `.media`
(4:3 `aspect-ratio`), `ImageUploadField`'s `.preview` (4:3
`aspect-ratio`, 240px cap), `RestaurantProfile`'s `.cover`/`.logo`
(fixed 200px/72px), `FoodDetails`'s `.image` (fixed 280px),
`OrderBuilder`'s `.itemImage` (fixed 72x72px) all bake a real, fixed
size into their **own** base CSS class — not something delegated to
whatever page renders them — so every restaurant cover/logo, every food
card in `EntityCard` (Home's Popular Foods grid and restaurant row,
RestaurantProfile's menu list), the FoodDetails hero photo, and the
cart-line thumbnail were already independent of the uploaded photo's
own pixel dimensions before this session touched anything. Each got a
short confirming comment (`ImageViewer.module.css`'s Task 10.1z
comment is the substantive one; these five just cross-reference it)
rather than being silently assumed fine with no trail.

**The real gap: `ImageViewer`'s `.thumbnail`.** Unlike every other
image-bearing component above, `.thumbnail` had `object-fit: cover` and
nothing else — no `width`/`height`/`aspect-ratio` of its own at all.
`object-fit` has no effect on an `<img>` with no resolved box size, so
this component's sizing depended **entirely** on whichever page
rendered it also supplying a sizing `className`/`thumbnailClassName`
(`OrderDetail.jsx`'s/`AdminLiveRequestDetail.jsx`'s
`.screenshotThumbnail`, `AdminRestaurantDetail.jsx`'s
`.coverThumbnail`/`.logoThumbnail` — the restaurant cover/logo an admin
sees on that screen). **Every current caller does pass one**, so this
wasn't reproducible from today's own three call sites as wired — but
that safety held only because the caller's class happens to win the
CSS cascade against this file's own class at equal specificity, a tie
broken by which stylesheet a bundler happens to inject last, not
anything guaranteed by the component's own contract. That's exactly
the "delegates sizing entirely to caller CSS with no built-in fallback"
pattern `10.1z`'s own task text called out by name, and the one
component here that actually had it — a real architectural gap, even
though this session's own trace couldn't reproduce it as a visible bug
against the current three callers.

**Fix, in `ImageViewer.module.css`:** `.thumbnail` now has its own real
default — 96px square, `aspect-ratio: 1 / 1`, `max-width: 100%`,
`flex-shrink: 0`, `background: var(--color-surface-muted)` (matching
the muted placeholder background every other fixed-size image container
above already has) — the same "component owns its own fallback size"
pattern as the six already-correct files. Every current caller keeps
its own more-specific override unchanged (96px already matches
`OrderDetail`'s/`AdminLiveRequestDetail`'s own `.screenshotThumbnail`;
`AdminRestaurantDetail`'s wider/shorter `.coverThumbnail` stays as its
own deliberate override, now commented as such) — so no screen's actual
rendered size changes, only the safety net underneath all of them.
`.thumbnailButton` (the wrapping trigger) also gained `max-width: 100%`,
since an inline-block wrapper with no width cap of its own could still
let an ancestor stretch it past its container even with `.thumbnail`
itself now correctly sized.

**Checked and confirmed out of scope, not silently skipped:**
`OwnerMenu.jsx`'s food list — Task 8.4d already found this screen
renders **no** image at all per food row (not an expanding one, an
absent one), a different, separately-flagged gap this task's own
"currently expandable" framing doesn't describe; not built here.

No npm-registry access this session (standing gap since Task 2.10) —
verified by re-reading every edited/re-confirmed file's actual CSS
rules by hand (not assumed from an earlier task's summary) plus a
brace-balance check across all 9 touched files (all matched) — not a
rendered/screenshotted check against a real oversized upload.

`docs/TASKS.md`'s 10.1z checkbox ticked. Next: **10.2** — Customer Home
(`Home.jsx`) restyle, starting with **10.2a-i**, the header's solid
orange band container (layout shell only, no content placement yet) —
unblocked now that 10.1z's cross-cutting image-sizing fix is in place
ahead of it, per the project owner's own request.

---

**10.2b-ii — restaurant card content restyle (`EntityCard`), scoped to
photo/name/location line only** — `10.2b-iii`'s own badge-placement work
is untouched here. `10.2a-i`/`10.2a-ii`/`10.2b-i` were already checked
off in `docs/TASKS.md` ahead of this session (confirmed by rereading
that file's own checkboxes fresh rather than trusting this file's last-
recorded position — same standing drift-risk every NOTE earlier in this
file already flags).

Compared both restaurant cards in
`docs/reference_ui/phase10_customer_home_reference.jpg` against
`EntityCard`'s current CSS rather than assuming the existing
photo/name/`location_text` wiring (already real, from Task 3.3) needed
new data — it didn't; every field this card shows is already backed by
a real `/api/restaurants` column. The actual gap was visual, not data:

1. **Logo repositioned** — top-left over the photo (small rounded
   square, `--radius-md`), replacing the circular avatar centered on
   the image/body seam that Task 2.22 had measured off the *old*
   `560d4168...png` reference. That old reference doesn't govern this
   new one; re-measured fresh rather than assumed still correct.
   `.body`'s old logo-clearance `padding-top` override is removed along
   with it — nothing overlaps the body from above now that the logo
   lives inside `.media`.
2. **Name weight**: semibold (600) → bold (700), matching the
   reference's heavier restaurant/food-card name text.
3. **`location_text` line size**: caption (12px) → body (14px), same
   reasoning.

Both 2/3 are shared CSS classes with the Popular Foods card (`.title`/
`.metaLine`, its other caller) — confirmed against the same reference
image that its own name/price text reads the same size/weight, so this
isn't a restaurant-only override bleeding into a screen it wasn't meant
for.

**Confirmed, not built:** no star rating/review count (no ratings/
reviews column anywhere in `docs/DB_SCHEMA.md`, per
`docs/UI_REDESIGN_ROADMAP.md`'s own deviation note) and no
location-pin icon ahead of the `location_text` line — no such icon
asset exists anywhere in this codebase, and Phase 10's governing rule
is restyle-only with real data/icons, never inventing a new one (same
reasoning `10.2d-ii`'s own "+" character and `10.2c-i`'s icon-less chips
elsewhere in this phase already follow). Full reasoning recorded in
`docs/DESIGN_TOKENS.md`'s new "Task 10.2b-ii" section, not just here.

Only `Home.jsx` (this task's own target) and `ComponentSandbox.jsx`
(mock data, not a Phase 10 page) pass a `logo` prop to `EntityCard` —
confirmed by grep — so this shared-component change reaches exactly the
intended caller plus one inconsequential mock screen, nothing else.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout either, so no
real build/render was possible; verified via manual re-read of both
edited files plus a brace-count check (39/39 `EntityCard.jsx`, 14/14
`EntityCard.module.css`), not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.2b-ii checkbox ticked. Next: **10.2b-iii** —
Open/Closed status badge placement/restyle on the restaurant card (text/
color badge, no icon) — per the reference image, this moves the badge
from its current in-body position onto the photo itself (top-right),
distinct from this task's own untouched `.badgeSlot`.

---

**10.2b-iii — Open/Closed badge placement/restyle (`EntityCard`).**
Re-checked Task 2.22's own "badge sits in the card body, not on the
photo" finding against the new reference rather than assuming it still
applies — it doesn't: both restaurant cards in
`docs/reference_ui/phase10_customer_home_reference.jpg` show the
Open/Closed pill sitting on top of the photo's top-right corner, not
below it in the white body. That earlier finding was measured off the
now-superseded `560d4168...png` image, same "old reference doesn't
govern the new one" situation `10.2b-ii`'s own logo/name/location-line
changes already ran into.

**Fix:** `badge` moved from an in-flow element at the top of `.body`
back to an absolutely-positioned overlay on `.media` — `.badgeSlot` now
sits `top`/`right: var(--space-sm)`, the opposite corner from
`10.2b-ii`'s repositioned top-left logo. `StatusBadge`'s own solid-fill/
white-text styling (unchanged) already has enough contrast to sit
directly on a photo, so `StatusBadge.module.css` itself needed no
change — only `EntityCard.jsx`'s render order (the badge now renders
inside `.media`, after the logo) and `.badgeSlot`'s own CSS.

Only `Home.jsx` (restaurants row + search results, both restaurant
cards) and `ComponentSandbox.jsx` (mock data) pass a `badge` prop to
`EntityCard` — confirmed by grep, same two-caller shape `10.2b-ii`'s own
`logo` check found — so this reaches exactly the intended cards. The
Popular Foods card never passes `badge` and is unaffected.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout either, so no
real build/render was possible; verified via manual re-read of both
edited files plus a brace-count check (39/39 `EntityCard.jsx`, 14/14
`EntityCard.module.css`), not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.2b-iii checkbox ticked, which closes out every
sub-item under **10.2b** (restaurant card section: grid shell, content,
badge) — its own top-level checkbox stays unticked in `docs/TASKS.md`
pending the rest of `10.2` (`10.2c` onward), same "top-level box only
ticks when every sub-item is" convention this file's `8.x` sections
already used. Next: **10.2c-i** — Categories section: row layout of
plain text tiles/chips (no per-category icons — none exist to draw
from, see `10.0f`'s own drop note), with an always-present "All" tile.

---

**10.2c-i — Categories row tile restyle (`FilterBar` chips), layout-shell
only.** Confirmed `type: 'chips'` (`.chip`/`.chipActive`) has exactly one
real caller — `Home.jsx`'s Categories row — before touching this shared
component: `AdminOrders.jsx`, the only other `FilterBar` user, is
`type: 'dropdown'`-only (grep-confirmed).

Compared the row against
`docs/reference_ui/phase10_customer_home_reference.jpg`'s own compact,
rounded-rectangle tile shape (icon-on-top/label-below), not the wide
pill `.chip` had (itself measured off the old, pre-redesign
`1000065033.jpg`). No per-category icon is added — categories are
owner-defined free text with no icon field and no icon set exists in
this codebase to draw one from (`docs/TASKS.md`'s own struck-through
`10.0f` note), so per the redesign's real-data/real-icons-only rule this
collapses to a text-only tile.

**Changes:** `border-radius` pill → `--radius-md`; horizontal padding
`space-lg` → `space-md` (squares a short label off instead of stretching
it into a pill; vertical padding, and the Task 8.9a2 44px touch-target
floor it protects, is untouched); inactive fill `--color-surface-muted`
→ `--color-page-glow` (Task 10.0a's own peach token, a closer match to
this reference's light-peach tile and already a real shipped token, not
a new one). `.chipActive`'s solid-orange/white-text fill is unchanged —
already matches the reference. `FilterBar.jsx`'s own doc comment updated
to point at the new reference instead of the superseded one.

Real category data/active-selection wiring (`Home.jsx`, Task 3.4) is
untouched — this task is shape-only, per its own "layout... no per-
category icons" scope; re-verified fresh (not re-built) in 10.2c-ii.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via
manual re-read of both edited files plus a brace-count check (32/32
`FilterBar.jsx`, 9/9 `FilterBar.module.css`), not a rendered check.

`docs/TASKS.md`'s 10.2c-i checkbox ticked. Next: **10.2c-ii** — wire the
restaurant's real category list into the tiles (active/selected state
on the currently-selected category) — likely already satisfied by Task
3.4's existing wiring, per this session's own note above; 10.2c-ii's own
start should confirm that rather than assume it.

---

**10.2c-ii checked, already done — no code changes needed.** Confirmed
this session's own prediction (10.2c-i's log entry above) by rereading
`Home.jsx` directly rather than assuming: the real category list is
already fetched from `GET /api/categories/live` (`fetchLiveCategories`,
Task 3.4) into `categoryNames`, `selectedCategory` is real `useState`
(defaulting to `ALL_CATEGORIES_VALUE`, the always-present leading "All"
tile), and the `FilterBar` group passed to the (now `10.2c-i`-restyled)
chip row already wires `value={selectedCategory}`/
`onChange={setSelectedCategory}` — `FilterBar.jsx`'s own chip-rendering
(`isActive = option.value === group.value`) applies `.chipActive` to
whichever tile matches, "All" included. This is exactly the "real
category list + active-state" wiring this task asks for, built at Task
3.4 and untouched by `10.2c-i`'s own shape-only restyle.

**One standing, already-flagged gap re-confirmed, not newly found:**
selecting a category tile still doesn't filter the Restaurants row or
Popular Foods grid below it — `Home.jsx`'s own header comment has called
this out since Task 3.4 as a deliberate, real follow-up (not silently
dropped), and `10.2c-ii`'s own task text only asks for the tiles'
*visual* active state, not filtering behavior, so this isn't a gap this
task needs to close.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — verified by rereading `Home.jsx`'s and
`FilterBar.jsx`'s actual state/prop wiring, not a rendered/clicked-
through check.

`docs/TASKS.md`'s 10.2c-ii checkbox ticked, which completes **10.2c** in
full (tile layout + real data/active-state wiring). Next: **10.2d-i** —
Popular Foods grid: 3-column layout shell (no CTA restyle yet).

---

**10.2d-i — Popular Foods grid, 3-column layout shell.** Compared
against `docs/reference_ui/phase10_customer_home_reference.jpg`'s own
Popular Foods grid, which is 3 columns even at phone width —
`ResponsiveGrid`'s own default (`{ base: 2, md: 3, lg: 4, xl: 5 }`,
Task 2.7) is a column short at every tier for this grid specifically.

**Fix, `Home.jsx` only, via `ResponsiveGrid`'s existing `columns` prop**
(no change to `ResponsiveGrid` itself, which stays the right default for
the Restaurants grid right above it, Task 10.2b-i, and for every other
real caller — `RestaurantProfile.jsx`'s menu grid, not a Phase 10 page —
same "per-instance override, not a shared-default change" approach
`EntityCard`'s own `mediaAspectRatio` prop already took for this same
page): new `POPULAR_FOODS_GRID_COLUMNS = { base: 3, md: 4, lg: 5, xl: 6
}`, carried one tier higher than the default at every breakpoint (not
just the base tier) so the grid still grows at each larger breakpoint
instead of `md` sitting at the same column count the new base already
has. Applied to **both** `ResponsiveGrid` instances that render food
cards through `styles.popularFoodsGrid` — the actual Popular Foods
section and the search-results Foods sub-grid — matching `10.2b-i`'s
own choice to treat the two `.restaurantsGrid` instances (browse row +
search results) as one shared shell rather than styling the browse
section alone and leaving search results on the old column count.

**Confirmed, not touched:** the CTA slot (`.orderNowCta`, the "Order
Now" bar) is unchanged — that's `10.2d-ii`'s own task, and this session
deliberately left it as-is per this task's "no CTA restyle yet" scope.
`.popularFoodsGrid`'s own CSS (padding-inline only, no fixed/min-width
assumption anywhere) needed no change to accommodate the extra column.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via a
brace/paren-balance check on `Home.jsx` (142/142, 194/194) and a
manual re-read of both edited `ResponsiveGrid` call sites, not a
rendered/screenshotted check.

`docs/TASKS.md`'s 10.2d-i checkbox ticked. Next: **10.2d-ii** — restyle
each Popular Foods card's CTA from the "Order Now" bar to a compact
round button showing a plain "+" character (typography, not an icon
asset) — same underlying link to `FoodDetails` as today.

---

**10.2d-ii — Popular Foods card CTA: "Order Now" bar → round "+".**
Reference (`docs/reference_ui/phase10_customer_home_reference.jpg`) shows
each Popular Food card's price and cta side by side (price left, small
solid-orange circle with a plain "+" right), not the old full-width
"Order Now" text bar stacked below the price.

**`EntityCard.jsx`/`.module.css` change (shared, affects every caller):**
`metaLine` and `cta` used to render as separate stacked children of
`.body`; they now share one new `.metaRow` flex row
(`justify-content: space-between`) so a caller passing both gets them
side-by-side. Conditional on either slot being passed, so the
restaurant card (`metaLine` only, no `cta`) is unaffected — a lone
flex child under `space-between` renders exactly like the old stacked
paragraph did. `.ctaSlot`'s old `margin-top: var(--space-sm)` (needed
when it sat below `.metaLine`) is dropped now that it's a row sibling
instead.

**`Home.module.css` change:** `.orderNowCta` (text bar: `--radius-md`,
horizontal-pill-ish padding, "Order Now" label) replaced with `.addCta`
— a fixed 32×32px circle (`--radius-pill`), centered "+" at
`--font-size-title`/`--font-weight-bold`, same `--color-primary`/
`--color-text-on-primary` pairing as before (already the WCAG-safe
Task 8.9b2 values, so no new contrast check needed). 32px chosen to
match the reference's button-to-price size ratio, not a tap-target
figure — this cta has no `onClick` of its own (the whole card is the
real click target, unchanged since Task 3.9), so it isn't an
independently-tabbable control and sits outside Task 8.9a2's 44px
audit scope.

**`Home.jsx` change:** both Popular Foods `EntityCard` call sites
(browse grid + search-results grid) swapped
`cta={<span className={styles.orderNowCta}>Order Now</span>}` for
`cta={<span className={styles.addCta} aria-hidden="true">+</span>}` —
`aria-hidden` since the glyph is decorative and the card's own
accessible name/role (`title`, `role="button"`) already covers what
activating it does. Stale doc comments referencing "Order Now" updated
in both files (`EntityCard.jsx`'s slot-shape comment, `Home.jsx`'s two
`goToFood`-adjacent comments).

**Confirmed, not touched:** `ComponentSandbox.jsx`'s two `EntityCard`
demo cards still use their own local `.demoButton` "Order Now" span —
that page demos the generic slot capability with mock data, isn't part
of the Phase 10 reference-driven redesign scope (10.2's own task list
is `Home.jsx`-only), and 10.2b-iii's own precedent only carried a change
into `ComponentSandbox.jsx` when the change was inside the *shared*
component itself (badge positioning); this task's cta content is
`Home.module.css`/`Home.jsx`-local, so `ComponentSandbox.jsx` keeps
showing the older label — flagged, not changed. (`ComponentSandbox.jsx`
cards do still pick up the new `.metaRow` side-by-side layout for free,
since that half of the change lives in shared `EntityCard.jsx`.)

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via a
brace/paren-balance check on `Home.jsx` (142/142, 194/194 — unchanged
from 10.2d-i, as expected for a same-shape swap) and `EntityCard.jsx`
(41/41, 31/31), plus a manual re-read of all four edited files, not a
rendered/screenshotted check.

`docs/TASKS.md`'s 10.2d-ii checkbox ticked, which closes out all of
**10.2d** (Popular Foods grid: layout shell + CTA restyle). Next:
**10.2e** — Bottom nav restyle to the new active-state treatment,
reusing the real existing nav icons (`HomeIcon`/`CategoriesIcon`/
`OrdersIcon`/`LoginIcon`) with the real 4 items (Home/Categories/
Orders/Login) — confirm no Profile tab is added.

---

**10.2d-ii correction, same session:** the write-up above measured the
Popular Food cta's colors from the earlier full-page screenshot, not a
pixel-level crop, and got the fill backwards — a fresh tight crop of a
single card's cta shows a **pale-peach circle with a solid-orange "+"**,
not a solid-orange circle with white "+". Fixed in `Home.module.css`:
`.addCta` now uses `background: var(--color-page-glow)` (the same
`#FCF1E8` peach token `10.2c-i`'s category-tile restyle already reused,
and a close match to this circle's own sampled fill) with
`color: var(--color-primary-pressed)` for the glyph — plain
`--color-primary` only clears 4.16:1 against this lighter background
(a 16px bold glyph doesn't qualify for WCAG's "large text" 3:1
exemption), so the next-darker Task 8.9b2 token (5.42:1) is used
instead, same escalate-one-step-darker call `color-text-secondary`'s
own 8.9b2 fix already made for a similar near-miss. No JSX change —
`Home.jsx`'s two call sites are unaffected. Re-verified via a manual
re-read of the new CSS only (no render available this session).

---

**10.2e checked, already done — no code changes needed.** Compared the
current `RoleShell.jsx`/`.module.css` bottom nav (built at Task 2.17,
measured off the *old* `1000065033.jpg` reference) fresh against
`docs/reference_ui/phase10_customer_home_reference.jpg`'s own bottom
bar, rather than assuming the old measurement still holds — same
"re-measure, don't assume" approach `10.2b-ii`/`10.2c-i` already used
for other components carried over from before Phase 10.

Found the two references agree on every element this task covers: **no
background pill/highlight behind the active tab** — same plain
color+bold-label treatment `.navItemActive`/`.navItemActive .label`
already implement (`color: var(--color-primary)`,
`font-weight: var(--font-weight-bold)` on the label); the four icon
shapes (house / 2×2 grid / lined document / person outline) match
`HomeIcon`/`CategoriesIcon`/`OrdersIcon` pixel-for-pixel and the real
fourth tab is **Login**, not the reference's **Profile** — already a
deliberate, previously-documented deviation (this component's own
header comment, "the product spec is explicit customers have no
accounts") that this task's own "confirm no Profile tab is added"
wording asks to re-confirm, not reconcile. Nav bar chrome (white fill,
soft box-shadow lifting it off the content above, thin top border) also
already matches.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — verified via the pixel comparison above plus a
re-read of `RoleShell.jsx`/`.module.css`'s actual CSS values, not a
rendered/screenshotted check of the live app.

`docs/TASKS.md`'s 10.2e checkbox ticked. Next: **10.2f** — Responsive/
verification pass on `Home.jsx` at all 4 breakpoints, which closes out
all of **10.2** (Customer Home).

---

**10.2f — formal responsive/verification pass, `Home.jsx`; one real bug
found and fixed.** No npm-registry access this session (`npm ping` →
403, standing gap since Task 2.10) and no `node_modules` in this
checkout, so this is the same manual CSS/markup trace `10.1h` used, at
this project's own established 4 breakpoints (320/768/1024/1280px,
`ResponsiveGrid`'s own scale, Task 2.7), against every element `10.2a`-
`10.2e` touched: `.header`/`.headerInner` (brand row + search bar),
`.restaurantsGrid` (2/3/4/5 cols), `.categoriesFilterBar` (chip row),
`.popularFoodsGrid` (3/4/5/6 cols) including the new `.metaRow`/
`.addCta` from `10.2d-ii`, and the search-results variant of both grids
(same classes, reused as-is per `.searchSubsection`'s own comment).

**Worst-case column widths, derived from the actual current CSS** (not
assumed): at 320px, `.headerInner`/`.restaurantsGrid`/
`.popularFoodsGrid`'s shared `space-lg` (16px) padding-inline leaves a
288px content column. Restaurants grid at its 2-column base: (288 −
16px gap) ÷ 2 = **136px** per card. Popular Foods grid at its 3-column
base (`POPULAR_FOODS_GRID_COLUMNS`, Task 10.2d-i): (288 − 32px gaps) ÷
3 = **85px** per card.

**Bug found:** at that 85px Popular Food card width, `EntityCard`'s
`.body` padding (`space-lg` each side) leaves ~53px for `.metaRow`;
`.ctaSlot`'s fixed 32px cta + the row's `space-sm` gap already claims
40px of that, leaving only ~13px for the price `.metaLine` — less than
"ETB"'s own min-content word width. `.metaLine` had no `min-width`/
overflow handling (unlike `.title`/`.subtitle`, which already
ellipsis-truncate), so a flex item's default `min-width: auto` would
force the row wider than its 53px container, clipped by `.card`'s own
`overflow: hidden` rather than laying out cleanly. **Fixed** in
`EntityCard.module.css`: `.metaLine` now gets `min-width: 0` plus the
same `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
`.title`/`.subtitle` already use, so it shrinks and truncates instead
of overflowing. Side effect, not a regression: the restaurant card's
own (cta-less) `metaLine` (`location_text`) now also ellipsis-truncates
on one line instead of wrapping to two — brings it in line with
`.title`/`.subtitle`'s existing convention on the same card rather than
being the one text field on it that still wrapped.

**Flagged, not fixed (out of this task's scope):** at the 320px/3-column
extreme, a food price can still truncate down to a near-illegible
sliver (roughly one digit) before the fix's ellipsis kicks in — a real
rough edge of `10.2d-i`'s own "3 columns even at phone width" decision,
which this verification-pass task isn't the place to re-decide.

**Everything else traced clean at all 4 breakpoints:** `.headerInner`'s
brand row (`"NATRA"` ~90px + Sign-up pill + bell icon, well under even
the 288px floor, unchanged since Task 8.1a — Phase 10 only swapped
`.header`'s background to `--gradient-header`, not this width math);
`SearchBar` (`width: 100%`, no fixed-width content); the Categories
chip row (`HorizontalScroller`, scrolls rather than wraps, so no width
ceiling applies); `.restaurantsGrid`'s 136px floor (badge/logo/title/
subtitle/metaLine all fit or already ellipsis-truncate, no cta sharing
the row); and the `768px`/`1024px` gutter step-ups
(`space-xl`/`space-2xl`) applying identically to every section-level
selector per the existing shared media-query block, so the whole page's
left/right edge stays aligned at every breakpoint.

`docs/TASKS.md`'s 10.2f checkbox ticked, closing out all of **10.2**
(Customer Home) — its own top-level checkbox ticked too. Next: **10.3**
(Owner Dashboard) — `10.3a-i`, wiring the shared `DashboardHeader`
(Task 10.0b) with "Owner Dashboard" as its subtitle.

---

**10.3a-i — wire `DashboardHeader` into `OwnerDashboard.jsx`.** Replaced
the old plain `<h1 className={styles.heading}>Dashboard</h1>` with
`<DashboardHeader subtitle="Owner Dashboard" className={styles.dashboardHeader} />`,
per `docs/reference_ui/phase10_owner_dashboard_reference.jpg` — the
"NATRA" wordmark itself is `DashboardHeader`'s own hardcoded content
(Task 10.0b-ii), not something this screen passes in.

`notificationHref`/`accountHref`/`notificationCount` deliberately left
unpassed: `DashboardHeader` renders nothing for that row without them
(its own "no invented placeholder" rule), and real values are `10.3a-ii`
(notification count, once Task 7.5's owner-notification data has a real
unread figure) / `10.3a-iii` (account link to `/owner/account`) — each
its own task, not bundled in here.

`.subheading` ("Here's what's happening with your restaurant today.")
is untouched — the reference shows that line inside the separate
`Greeting` block (Task 10.0c) below the header band, not inside the
header itself; wiring `Greeting` in is `10.3b`'s job.

**CSS:** removed the now-dead `.heading` rule (its one usage is gone);
added `.dashboardHeader { margin-bottom: var(--space-sm) }` to preserve
the gap `.heading`'s own bottom margin used to provide before
`.subheading` — `DashboardHeader` itself carries no bottom margin, being
a shared component with no opinion on what follows it.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via a
brace/paren-balance check (`OwnerDashboard.jsx` 114/114, 120/120;
`OwnerDashboard.module.css` 28/28) and a manual re-read of both edited
files, not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.3a-i checkbox ticked. Next: **10.3a-ii** — wire the
real notification count (owner notifications, Task 7.5) into
`DashboardHeader`'s text-based indicator.

---

**10.3a-ii — real unread-notification count wired in, with a real
backend prerequisite gap closed along the way (same "small gap closed as
part of the frontend task that needed it" shape Task 8.4c-ii already
took for its own thumbnail-URL persistence gap).**

**The gap:** `GET /api/notifications`'s `list` handler (Task 7.5b) only
ever forwarded `req.query`'s pagination params (`page`/`limit`/`offset`)
to `paginate()` — its `filters` argument was hardcoded to
`{ recipient_id: req.user.id }`, with no way for a caller to additionally
scope by `is_read`. `is_read` was already in `models/notifications.js`'s
own `columns` allow-list (so `crudFactory`'s `_buildFilterWhere` already
accepts it as an equality filter with zero model changes needed), but
nothing in the controller ever read it off the query string. Without
that, there was no reliable way to ask this endpoint "how many of my
notifications are unread" — fetching every page and counting client-side
isn't reliable either, since `utils/paginate.js`'s own `MAX_LIMIT` caps
any one page well below what a long-lived account could accumulate.

**Fix, `notificationController.js`:** new `parseIsReadFilter(raw)`, same
"exact-match filter, parsed and rejected with a 400 on anything else,
not silently matched-to-zero-rows" shape `adminOrdersList.js`'s own
`parseStatusFilter`/`parseRestaurantIdFilter` already established for
their own exact-match filters — the DB's own `ck_notifications_is_read`
CHECK (migration 0010) only ever allows `0`/`1`, so anything else
(`is_read=yes`, `is_read=2`) is almost certainly a caller bug worth a
400. `list` now merges a parsed `is_read` into its filters object when
the query param is present, leaving the no-filter case (every existing
caller — `useOwnerNewOrderAlerts.js`'s own poll included) completely
unchanged. Two new route-level tests added to
`notification.routes.test.js`: `is_read=0` scoping both `meta.total` and
the returned rows to unread-only (with a `limit=1` case confirming
`meta.total` still reflects the real full count, not just the one
returned row — the exact property the frontend fetch below depends on),
and a non-`0`/`1` value 400ing.

**Frontend, `OwnerDashboard.jsx`:** new `fetchUnreadNotificationCount`,
calling `GET /api/notifications?is_read=0&limit=1` and reading only
`meta.total` — `limit=1` keeps the actual row payload to the minimum
`paginate()` allows, since this call only ever needs the count, never
the rows themselves. Wired as a fourth, independent `useApiQuery` call
(fourth alongside the existing order-counts/sales-summary/my-restaurant
ones), passed into the `DashboardHeader` already wired in Task 10.3a-i
as `notificationCount={unreadNotificationCount ?? undefined}` — `null`
(the hook's initial/loading state) and a fetch error both fall through
to `undefined` rather than a `0`/stale placeholder, so `DashboardHeader`
shows the plain "Notifications" text with no parenthetical figure until
a real count actually resolves, same "don't show an invented/stale
number" reasoning every other secondary section on this screen already
uses for degrading in place. No separate inline-retry error UI was
added for this one fetch — unlike the Orders/Sales cards' own 403/500
handling, a broken unread-count fetch isn't a reason to block the header
from rendering at all, it just leaves the indicator textually plain.

**`notificationHref="/owner/orders"` — a flagged decision, not a dead
link.** No dedicated notification-list screen exists anywhere in this
app for the indicator to link to, and every notification this codebase
creates today is a `new_order` row (`useOwnerNewOrderAlerts.js`'s own
`NEW_ORDER_NOTIFICATION_TYPE`), so `/owner/orders` — the real,
already-built screen where an owner actually acts on what those
notifications are about — is the closest real destination rather than
an invented one. Task 10.3f's own "Recent Order Notifications" card
(still to come, on this same page) may give this indicator a more
specific in-page destination once real per-notification rows are
rendered there; this href is worth revisiting then, not assumed final
now.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) and no `node_modules` in either checkout — verified via
`node --check` on both edited backend files (controller, test file),
`tsc --noEmit --noResolve --allowJs --jsx react-jsx --esModuleInterop
--skipLibCheck` on `OwnerDashboard.jsx` (clean beyond expected
unresolved-module noise), and a brace/paren-balance check on
`OwnerDashboard.jsx` (119/119, 138/138) — not a real Jest run against the
two new route tests or a rendered/screenshotted frontend check.

`docs/TASKS.md`'s 10.3a-ii checkbox ticked. Next: **10.3a-iii** — wire
the account text link to `/owner/account`.

---

**10.3a-iii — account text link wired, closing out `10.3a` in full.**
`DashboardHeader`'s `accountHref` is now `/owner/account` —
`OwnerAccount.jsx`, the real, already-built screen for an owner's
profile/password settings, matching `App.jsx`'s own existing route.
`accountLabel` was left unpassed, so `DashboardHeader`'s own default
("Account") renders: fetching the owner's real name for a more
personalized label would need a fifth independent fetch on this screen
(`GET /auth/me`, the same call `OwnerAccount.jsx`'s own `fetchMe`
makes), and this task's own wording asks only for the link, not a
name-based label — flagged as a possible future refinement rather than
built speculatively here, same "don't quietly expand a task's shape"
reasoning this project's other split/flag notes already follow (e.g.
`docs/PROJECT_STATUS.md`'s own 10.2d-ii "Confirmed, not touched" note).

This closes every sub-item under **10.3a** (header wiring: 10.3a-i
DashboardHeader itself, 10.3a-ii notification count, 10.3a-iii account
link) — its own grouping isn't a separately-numbered checkbox in
`docs/TASKS.md`, so nothing else to tick beyond 10.3a-iii's own line.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) and no `node_modules` in this checkout — verified via
`tsc --noEmit --noResolve --allowJs --jsx react-jsx --esModuleInterop
--skipLibCheck` on `OwnerDashboard.jsx` (clean beyond expected
unresolved-module noise) and a brace/paren-balance check (119/119,
141/141) — not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.3a-iii checkbox ticked. Next: **10.3b** — wire the
shared `Greeting` (Task 10.0c) above the stat grid, with this screen's
own subtitle copy ("Here's what's happening with your restaurant
today." — the existing `.subheading` paragraph this task should move
into `Greeting`'s own subtitle slot, per that component's own doc
comment, rather than leaving it as a separate plain `<p>`).

---

**10.3b — `Greeting` wired in, replacing the old `.subheading` `<p>`.**
`OwnerDashboard.jsx`'s plain `<p className={styles.subheading}>Here's
what's happening with your restaurant today.</p>` is now
`<Greeting subtitle="Here's what's happening with your restaurant
today." className={styles.greeting} />` — the exact same real copy,
just moved into `Greeting`'s own `subtitle` slot rather than dropped or
reworded (no invented text, per the redesign's own governing rule).
`Greeting` itself supplies the time-of-day headline ("Good morning!"/
"Good afternoon!"/etc., Task 10.0c-i) this screen never had before —
the reference image's own "Good afternoon!" line, now real rather than
a static heading.

**CSS:** `.subheading` (font/color/margin rules for the old plain `<p>`)
removed outright — same "remove the now-dead rule in the same task that
made it dead" approach `10.3a-i`'s own `.heading` removal already took,
not deferred to a later cleanup pass. New `.greeting { margin-bottom:
var(--space-sm) }` added in its place: `Greeting`'s own component CSS
already gives it `padding: var(--space-lg)` (16px) on every side, so
this page-local top-up (8px) brings the total gap before the Orders
card back to roughly what `.subheading`'s own `margin: 0 0
var(--space-xl)` (24px) used to provide, rather than leaving whatever
gap the unmodified 16px padding alone happens to produce — same
"fills the gap the old margin used to provide" reasoning `10.3a-i`'s own
`.dashboardHeader { margin-bottom: var(--space-sm) }` rule already used
for the header above it.

**Historical CSS comments left as-is, not rewritten:** `.page`'s own
Task 8.2b-ii verification comment still refers to "the heading/
subheading" by their old names — same "these are notes about what a
class used to be, not references to code that still exists" reasoning
this project's own drift-NOTEs and Task 8.7d's `Placeholder`-removal
entry already established for stale historical documentation elsewhere
in this codebase.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) and no `node_modules` in this checkout — verified via
`tsc --noEmit --noResolve --allowJs --jsx react-jsx --esModuleInterop
--skipLibCheck` on `OwnerDashboard.jsx` (clean beyond expected
unresolved-module noise) and a brace/paren-balance check on both edited
files (`OwnerDashboard.jsx` 119/119, 142/142; `OwnerDashboard.module.css`
28/28) — not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.3b checkbox ticked. Next: **10.3c-i** — Total
Orders `StatTile` (Task 10.0d), derived from the existing `GET
/orders/counts` response.

---

**10.3c-i — Total Orders `StatTile` on `OwnerDashboard.jsx`.** Imported
the shared `StatTile` (Task 10.0d) and rendered one instance right after
`Greeting`: `count={counts.total}`, `label="Total Orders"`,
`variant="primary"` (the orange tint the reference gives this tile).
`counts.total` is the `total` field `GET /orders/counts` already returns
(`orderCounts.js`), so no backend change. Only rendered once `counts` has
resolved (`!noRestaurantYet && !loading && !error && counts`) — the Orders
card below already owns the loading/error/403 messaging, and a placeholder
`0` here would contradict it. New `.statTile` class adds a `space-lg`
bottom margin so the tile doesn't fuse into the Orders card; it is
intentionally temporary, since 10.3c-v's 2×2 grid supplies the real
spacing.

Not built, per the governing rule: the reference's leading bag icon and
"0 new" sub-line (`StatTile` has no icon/caption slot by design). The
Orders card and its New/Accepted/Completed/Rejected rows are left in place
— replacing them is 10.3d-v's/10.3g's territory, not this task's.

Verification: `npm ci` + `vite build` pass in this session (the registry
was reachable). No headless browser is available in this sandbox, so the
rendered check at 320/390/768/1024/1280/1920px + landscape (the standing
Phase 10 device-size rule) was **not** run; a single full-width tile has
no fixed width to overflow, but that render pass is still owed.

`docs/TASKS.md`'s 10.3c-i checkbox ticked. Next: **10.3c-ii** — Completed
`StatTile` (`variant="success"`, `counts.Completed`), same data source.

---

**10.3c-ii — Completed `StatTile` on `OwnerDashboard.jsx`.** Second tile,
rendered directly after the Total Orders tile: `count={counts.Completed}`,
`label="Completed"`, `variant="success"`, same `.statTile` class and same
render gate (`!noRestaurantYet && !loading && !error && counts`). Data is
the existing `GET /orders/counts` response; no backend change. The
reference's "0% of total" sub-line and check icon are not built
(`StatTile` has no caption/icon slot, Task 10.0d). The two tiles currently
stack full-width; 10.3c-v assembles all four into the 2×2 grid.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3c-ii checkbox ticked. Next: **10.3c-iii** — Rejected
`StatTile` (`variant="error"`, `counts.Rejected`).

---

**10.3c-iii — Rejected `StatTile` on `OwnerDashboard.jsx`.** Third tile,
after Completed: `count={counts.Rejected}`, `label="Rejected"`,
`variant="error"`, same `.statTile` class and render gate
(`!noRestaurantYet && !loading && !error && counts`). Data is the existing
`GET /orders/counts` response; no backend change. The reference's "0% of
total" sub-line and X icon are not built (`StatTile` has no caption/icon
slot, Task 10.0d). Tiles still stack full-width until 10.3c-v's 2×2 grid.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3c-iii checkbox ticked. Next: **10.3c-iv** — Pending
`StatTile` (`variant="info"`, `counts.New + counts.Accepted`).

---

**10.3c-iv — Pending `StatTile` on `OwnerDashboard.jsx`.** Fourth and last
tile, after Rejected: `count={counts.New + counts.Accepted}`,
`label="Pending"`, `variant="info"`, same `.statTile` class and render gate.
Pending is derived client-side from the existing `GET /orders/counts`
response (both keys are always present, `orderCounts.js`), so no backend
change. `info` is the closest existing variant to the reference's blue
(`StatTile` maps it to the primary tint family, Task 10.0d) — a possible
visual mismatch to revisit in 10.3h, not a new color added here. The
reference's "Waiting for action" sub-line and clock icon are not built.

All four tiles now exist but still stack full-width; **10.3c-v** wraps
them in the 2×2 grid and removes the temporary `.statTile` margin.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3c-iv checkbox ticked. Next: **10.3c-v** — assemble
the four tiles into the 2×2 grid.

---

**10.3c-v — the four stat tiles assembled into a 2×2 grid.** The four
separate gated `StatTile` blocks (10.3c-i..iv) are now one
`<div className={styles.statGrid}>` under a single render gate
(`!noRestaurantYet && !loading && !error && counts`), in the reference's
order: Total Orders, Completed, Rejected, Pending. `.statGrid` is
`repeat(2, minmax(0, 1fr))` with a `space-md` gap and `space-lg` bottom
margin; the temporary per-tile `.statTile` class and its CSS were removed,
as 10.3c-i's comment said they would be.

Device-size reasoning (recorded in the CSS): two columns at every width, as
in the reference; `minmax(0, 1fr)` stops a tile from forcing the grid wider
than the column. At 320px that is ~138px per tile and ~106px of content
after `StatTile`'s padding, enough for a 22px bold count and the longest
label; longer labels would wrap. The 640px page cap keeps it at 2 columns
above that.

Not changed: the Orders card (with its New/Accepted/Completed/Rejected
rows) is still below the grid — removing it is the remit of the later
10.3d-v/10.3g work, not this task. `info` still maps to the primary-tint
family rather than a true blue; flagged for the 10.3h visual pass.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320/390/768/1024/1280/1920px + landscape render pass (the standing
Phase 10 device-size rule) is still owed, and this is the first task in
10.3c with real layout risk.

`docs/TASKS.md`'s 10.3c-v checkbox ticked, closing 10.3c. Next:
**10.3d-i** — Open/Closed `QuickActionTile`, wrapping the existing
`ToggleSwitch`/`is_open` mutation.

---

**10.3d-i — Open/Closed `QuickActionTile` on `OwnerDashboard.jsx`.**
Imported the shared `QuickActionTile` (Task 10.0e) and rendered its
`toggle` shape: `label` "Open"/"Closed" from `restaurant.is_open`,
`caption` reusing the existing hint copy verbatim, and
`toggle={{ checked, onChange: handleOpenToggle, disabled: openToggleSaving }}`
— the exact handler/state Task 5.19 already built, so no new fetch,
mutation or state (the tile wraps `ToggleSwitch` rather than
reimplementing it, as 10.0e-iii intended). Rendered only once the
restaurant fetch has resolved without error
(`!quickActionsNoRestaurantYet && !restaurantLoading && !restaurantError
&& restaurantData`); the old Quick actions card keeps the
loading/error/retry messaging and the `openToggleFailed` line.

New `.quickActionTile` adds border/shadow (the tile has only a surface
fill) and a `space-lg` bottom margin so it reads as a card. Full-width
column-flex, caption wraps, so nothing has a fixed width to overflow at
320px.

**Known, temporary duplication:** the old Quick actions card still has its
own Open/Closed toggle for the same `is_open` value, so the page currently
shows two toggles until 10.3d-v replaces both old cards with the assembled
tile row. Both call the same `handleOpenToggle`, so they cannot disagree.
Not built: the reference's toggle-above-label tile styling (orange pill,
centered "Open" beneath) — `ToggleSwitch` renders its own label beside the
track; a closer match is a 10.3h visual-pass question.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3d-i checkbox ticked. Next: **10.3d-ii** — Add Food
`QuickActionTile` (link to `/owner/restaurant/menu/new`).

---

**10.3d-ii — Add Food `QuickActionTile` on `OwnerDashboard.jsx`.** Second
tile, right after the Open/Closed one: `label="Add Food"`,
`to="/owner/restaurant/menu/new"` (the existing `AddFood.jsx` route, Task
5.10 — the same destination as the old Quick actions card's Add Food
button), reusing the `.quickActionTile` class from 10.3d-i. Same render
gate as that tile (restaurant fetch resolved, no error, not
`quickActionsNoRestaurantYet`), since adding a food needs a `restaurants`
row.

No `caption`: the reference's small line under the tile has no existing
copy in this app to reuse, and the redesign's rule is no invented text.
The `QuickActionTile` link shape is a plain `Link` with `min-height: 44px`,
so the touch-target floor (Task 8.9a) holds. Not built: the reference's
plus-in-a-document icon (no such asset).

**Known, temporary duplication:** the old Quick actions card still has its
own Add Food button until 10.3d-v.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3d-ii checkbox ticked. Next: **10.3d-iii** — View
Orders `QuickActionTile` (link to `/owner/orders`).

---

**10.3d-iii — View Orders `QuickActionTile` on `OwnerDashboard.jsx`.**
Third tile, after Add Food: `label="View Orders"`, `to="/owner/orders"`
(the existing `OwnerOrders.jsx` route, Task 5.12b — same destination as
the old card's "View orders" button), reusing `.quickActionTile`. Same
render gate as the other two tiles (restaurant fetch resolved, no error,
not `quickActionsNoRestaurantYet`), since the orders list is scoped by
`restaurant_id`. No `caption` (no existing copy to reuse; no invented
text), no icon (no such asset). 44px touch-target floor holds via the
tile's own `min-height`.

**Known, temporary duplication:** the old Quick actions card still has its
own "View orders" button until 10.3d-v (the Orders card keeps its own link
too, which is outside this row's scope).

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3d-iii checkbox ticked. Next: **10.3d-iv** — Check
Live status `QuickActionTile` (link to `/owner/live-status`), moved out of
the "Get your restaurant Live" card into this row.

---

**10.3d-iv — Check Live Status `QuickActionTile`, moved out of the "Get
your restaurant Live" card.** Fourth tile: `label="Check Live Status"`,
`to="/owner/live-status"` (the existing `LiveStatus.jsx` route), reusing
`.quickActionTile`. Per this task's "moved out" wording, the old
`Check Live status` link was **removed** from the "Get your restaurant
Live" card, which now holds only its "Request to go Live" button — so this
one is a move, not a temporary duplicate like the tiles before it.

**Deliberately not gated on the restaurant fetch**, unlike the other three
tiles: the old link rendered unconditionally, including for a brand-new
owner with no `restaurants` row yet (the 403 case) — the owner who most
needs to check a pending request. Gating it would have been a regression.
No `caption` (no existing copy; no invented text), no icon (no asset).

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3d-iv checkbox ticked. Next: **10.3d-v** — assemble
the four tiles into the single Quick Actions row, replacing the old Quick
actions card (and its now-duplicate toggle/Add Food/View orders controls).
Heads-up for that task: the old card also owns the loading/error/retry UI
and the `openToggleFailed` message for the restaurant fetch — those need a
new home when the card goes, and the Check Live tile must stay visible
when that fetch 403s.

---

**10.3d-v — the four quick-action tiles assembled into one row, old
Quick actions card replaced.** The standalone tiles from 10.3d-i..iv and
the old card's toggle row (`StatusBadge` + hint + `ToggleSwitch`) and Add
Food/View orders buttons are gone; in their place is one "Quick actions"
`.card` containing a `.quickActionsRow` grid: Open/Closed, Add Food, View
Orders, Check Live Status. This resolves every "temporary duplication"
flagged in 10.3d-i..iii — the page now has one Open/Closed toggle again.

The card keeps what the old one owned: "Loading…", an inline error +
Retry for a real restaurant-fetch failure, and the `openToggleFailed`
line (moved to the top of the card). The first three tiles render only
once the fetch resolves cleanly; on a 403 (brand-new owner) or any error
they're hidden and, as before, a 403 shows no error text. **Check Live
Status is always rendered**, so the card itself is no longer hidden on
403 (the old one was) — as flagged in 10.3d-iv, a no-restaurant owner with
a pending request still needs that link.

**Responsive decision (device-size rule): 2 columns by default, 4 from
640px**, not the reference's always-4. Four tiles in a 320px phone column
would be ~50px each; the 640px switch is where `.page`'s cap is reached,
so wider viewports get a constant ~135px tile. At 320px the 2-column
tracks are ~118px (~94px of content), where the toggle+label (~95px) is
right at the edge — `minmax(0, 1fr)` stops it forcing the grid wider and
`ToggleSwitch`'s row can wrap its label. That is the tightest spot and the
first thing to check in a real render. Deviation from the reference
(4-across on phones) flagged: responsiveness wins per the standing rule.

Cleanup: removed the dead `.openToggleRow`/`.openToggleStatus`/
`.openToggleHint` rules (and their Task 8.2b-vi verification comment) and
10.3d-i's temporary `.quickActionTile` margin/shadow; dropped the
now-unused `ToggleSwitch` import. `.quickActionError` kept, re-commented.
The "Get your restaurant Live" card still says "check the status of a
request you've already submitted" though its link now lives in the
tiles — copy left as-is (no invented text; revisit in 10.3h).

Verification: `vite build` passes. No headless browser in this sandbox, so
the 320/390/768/1024/1280/1920px + landscape render pass is **not run** —
and this is the riskiest layout change in 10.3 so far, so it should be
done before 10.3h closes.

`docs/TASKS.md`'s 10.3d-v checkbox ticked, closing 10.3d. Next:
**10.3e-i** — restyle the existing Today/All-time totals into the new
card treatment.

---

**10.3e-i — Today/All-time totals restyled (Sales card).** The two
label-left/amount-right `.salesRow`s became two tinted stat blocks
(`.salesTotal`: small label above, 22px bold amount below, `surface-muted`
fill, `radius-lg`) in a `.salesTotals` grid. Same real data
(`sales.todayTotal`/`allTimeTotal` via `formatPrice`); no new fetch. The
card heading changed from "Sales" to "Sales Overview" — the name the
reference and `docs/UI_REDESIGN_ROADMAP.md` both use for this card, not
invented copy. The completed-orders line (`.salesMeta`) is untouched:
that's 10.3e-ii.

**Responsive (device-size rule):** `repeat(auto-fit, minmax(140px, 1fr))`
— side by side when the card column fits two 140px blocks (~292px+, e.g. a
390px phone), stacked full-width below that (the 320px case, 256px
column). Chosen over an always-2-column grid because a bold 22px amount
("1250 ETB", ~100px) would overflow ~88px of content in a ~120px 2-column
block at 320px. `overflow-wrap: anywhere` is the fallback for a huge
total. The old `.salesRow` rule was removed as dead; the 8.2b-v comment
above it is left as a historical note.

Not built: the reference's "Today" period dropdown (no period selector
exists), the Total Revenue tile, and the chart (10.3e2).

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3e-i checkbox ticked. Next: **10.3e-ii** — restyle
the completed-order-count line the same way.

---

**10.3e-ii — completed-order-count line restyled.** The plain `.salesMeta`
caption ("N completed orders") is now a `.salesCompleted` tinted block
under the two totals: same fill/radius/padding as 10.3e-i's `.salesTotal`,
with the count in bold (`.salesCompletedCount`, 16px) and the label
("completed order"/"completed orders") reusing `.salesLabel`. Read
together it's the same sentence as before, split only so the number can be
emphasized — no new text. Same data (`sales.completedOrderCount`), no new
fetch.

Deliberately **not** the reference's separate "Total Revenue" tile: that
would repeat the All-time total already shown above, and inventing a
duplicate figure isn't restyling. Flagged in case a two-column
totals-plus-revenue layout is wanted later.

Responsive: full-width block; `flex-wrap: wrap` lets a very large count
drop the label to its own line, `overflow-wrap: anywhere` on the count as
last resort — nothing fixed-width to overflow at 320px. Old `.salesMeta`
rule removed as dead.

Verification: `vite build` passes; no headless browser in this sandbox, so
the 320–1920px + landscape render pass is still owed.

`docs/TASKS.md`'s 10.3e-ii checkbox ticked. Next: **10.3e2-i** — the
exception task: new backend hourly-sales aggregation endpoint (bucket
today's `Completed` orders by hour), alongside `salesSummary.js`.

---

**10.3e2-i — hourly-sales aggregation endpoint (the named backend
exception).** New `services/hourlySales.js` (`getHourlySales(restaurantId)`),
new `orderController.salesHourly`, new `GET /api/orders/sales-hourly`
(registered before `GET /:id`, same `authMiddleware` → `attachOwnerRestaurant`
chain and `requireRestaurantScope` guard as `/counts` and `/sales-summary`).
Response: `{ hourly: { hours: [{ hour: 0..23, total, orderCount }] } }`.

Design, mirroring `salesSummary.js` on purpose: same raw-SQL query
(`Completed` orders for one restaurant), rows bucketed in JS rather than
with Oracle `TRUNC`/`EXTRACT`, "today" and the hour both in the Node
process's **local** timezone (the same single-timezone assumption
`salesSummary.js` documents — there's no restaurant timezone column). Always
returns all 24 buckets with zeros, so the chart needs no gap-filling; which
hours to plot (the reference shows ~8am–11pm) is left to the frontend
(10.3e2-ii). Totals are rounded to cents per bucket.

**Verification (real, this session had npm access):** `npm ci` OK;
`services/hourlySales.test.js` — 6 tests, all pass (empty day, hour
bucketing/summing, earlier days excluded, string totals + UPPERCASE keys,
cent rounding, bind scoping); `node --check` on all three edited files.
`eslint` couldn't run (no config file in the repo — the same standing gap
noted in 10.1c-i).

**Two things found and NOT fixed (outside this task), worth knowing:**
1. **Row-key casing mismatch across the backend.** Real oracledb
   (`OUT_FORMAT_OBJECT`, unquoted identifiers) returns UPPERCASE keys, and
   existing services (`salesSummary.js`, `orderCounts.js`, …) read
   `row.TOTAL`/`row.STATUS`; but `fakeDb` and the existing unit-test mocks
   return lowercase keys. Result: in this checkout, existing
   `salesSummary.test.js` (4/7 fail), `orderCounts.test.js` (2/5 fail) and
   `order.routes.test.js` (login fails with "Stored password hash is missing
   or invalid" because of the same casing, so most route tests error out)
   fail — independent of this task. The deployed app presumably works
   because it uses real Oracle. The new `hourlySales.js` reads both casings
   (`row.TOTAL ?? row.total`) so its tests are meaningful and it's correct
   on real Oracle; the siblings are untouched. Worth its own task: pick one
   casing convention (or normalize in `withConnection`) and fix
   `fakeDb`/mocks. I did not run the full suite to completion (it exceeded
   the sandbox time limit).
2. **No route-level tests for `/sales-hourly`.** They'd follow
   `order.routes.test.js`'s pattern, but that harness is broken here by
   item 1, so I couldn't verify them; adding unverifiable tests seemed
   worse than none. The route is thin (same chain as `/sales-summary`).
   Also couldn't load `app.js` here (no Oracle Instant Client), so route
   registration order was confirmed by reading `order.routes.js`, not by
   an HTTP call.

`docs/TASKS.md`'s 10.3e2-i checkbox ticked. Next: **10.3e2-ii** — render
this data as a line chart in the Sales Overview card (frontend; needs a
charting decision — no chart library is installed, so a small inline SVG
chart is the likely fit).

---

**10.3e2-ii — hourly sales line chart in the Sales Overview card.** New
`pages/OwnerDashboard/HourlySalesChart.jsx` (+ `.module.css`): a small
hand-rolled inline SVG (no chart library exists in this project, and one
line chart doesn't justify adding one) — baseline, polyline, soft
orange-gradient area fill, a dot per hour, and an hour label every 3 hours
(8am, 11am, … 11pm). `OwnerDashboard.jsx` gets a fifth independent
`useApiQuery` (`fetchHourlySales` → `GET /orders/sales-hourly`, Task
10.3e2-i) and renders the chart under the totals/completed block, with its
own "Loading chart…" and inline error + Retry — a chart failure never
replaces the already-rendered totals. The Sales card is already hidden on a
403, so there's no separate no-restaurant case.

Design decisions: **plotted window** is 8am–11pm like the reference, but
starts earlier if any sale happened before 8am, so a real sale is never
silently dropped from the chart. A zero day draws a flat line on the
baseline (the reference's empty state). No y-axis labels or tooltips (the
reference shows none); instead the SVG is `role="img"` with an
`aria-label` giving the real day total (e.g. "Hourly sales today, 8am to
11pm: 400.50 ETB in total."), so the number isn't lost to screen readers.
The reference's "Today" dropdown is still not built (no period selector).

**Responsive (device-size rule):** fixed 320×140 viewBox, `width: 100%;
height: auto`, so it can never exceed the card column at any width and has
no pixel width to overflow at 320px. Trade-off: text scales with the SVG,
~0.8× in a 256px phone column (12px labels → ~9.6px), so labels are kept
few and short; that's the thing to eyeball first in a real render.

**Verification:** `vite build` passes. Additionally server-rendered the
component with three datasets via Vite's bundled esbuild + `react-dom/
server` (empty day, busy day, sale at 5am): no `NaN`/`undefined` in the
output; 16/16/19 dots and 6/6/7 labels (window correctly widens for the
5am sale); aria-labels as above. Not a browser render — no headless
browser in this sandbox — so the 320–1920px + landscape pass and a look at
the actual curve/label legibility are still owed. The chart's data path
also depends on the new endpoint, which couldn't be exercised over HTTP
here (see the 10.3e2-i entry).

`docs/TASKS.md`'s 10.3e2-ii checkbox ticked. Next: **10.3f-i** — restyle
the Recent Order Notifications list rows (real `notifications` data). Note
for that task: this screen has **no** notifications list yet (only the
unread *count* in the header and the opt-in card), so it will need a
list fetch (`GET /api/notifications`, Task 7.5b) as well as the restyle —
worth confirming the intended scope first.

---

**10.3f-i — Recent Order Notifications card (list rows).** As flagged at
the end of 10.3e2-ii, the dashboard had no notifications *list* at all
(only the header's unread count and the opt-in card), so "restyle the
rows" meant building the card too. `OwnerDashboard.jsx` gets a sixth
independent `useApiQuery` (`fetchRecentNotifications` → `GET
/api/notifications?page=1&limit=5`, Task 7.5b: newest first, scoped to the
caller's own user id) and a "Recent order notifications" card rendered
right after the Sales card.

Rows are real data only: the notification's own pre-formatted `message`
(e.g. "New order NTR-12345 from … — 2 items — 250 ETB", written by
`submitOrder.js`), a short timestamp (`Intl` default, same as
`OrderDetail.jsx` minus the year), and an unread marker. Styling: tinted
`surface-muted` blocks (same look as the 10.3e Sales blocks); unread rows
get a light orange tint, a filled CSS dot (no icon asset exists) and
semibold text. Unread is not conveyed by color alone — semibold plus a
visually-hidden "Unread: " prefix for screen readers. Read rows keep the
dot's space (hidden) so text doesn't shift.

Not gated on `noRestaurantYet` (notifications are per user, not per
restaurant). Own "Loading notifications…" and inline error + Retry, so a
failure never affects other cards. The empty case is a deliberate **bare
placeholder line** ("No notifications yet.") — restyling it is 10.3f-ii.
Not built: the reference's "0 new" pill (the header already shows the
unread count) and any mark-as-read action (none asked for; the endpoint
exists from 7.5b).

Decisions to flag: (1) **placement** — right after Sales; the reference
puts Quick actions before Sales and this page's card order still differs
from it in general (Orders/opt-in cards are older), and no 10.3 task
covers reordering; (2) the card title is "Recent order notifications"
though `notifications.type` can also be `order_expiring_soon` — still
order-related, so kept; (3) rows aren't links (a notification's `order_id`
could deep-link to the order, but that's a new behavior, not a restyle).

**Responsive:** full-width column of blocks, no fixed widths;
`min-width: 0` + `overflow-wrap: anywhere` on the message so a long
unbroken location wraps inside the row at 320px (~220px of text).

**Verification:** `vite build` passes. Not rendered — no headless browser
in this sandbox — so the 320–1920px + landscape pass is still owed, as is
a check with real rows (the list/`is_read` handling wasn't exercised
against the API here; the endpoint's own route tests are among those the
casing problem noted in 10.3e2-i breaks in this checkout).

`docs/TASKS.md`'s 10.3f-i checkbox ticked. Next: **10.3f-ii** — restyle
the empty state (currently the bare "No notifications yet." line).

---

**10.3f-ii — notifications empty state restyled.** The bare "No
notifications yet." line from 10.3f-i is now the shared `EmptyState`
(centered title + description, `role="status"`), the same component every
other screen's empty state uses. New `.card .notificationsEmpty` trims its
whole-screen `space-2xl` padding to `space-lg` vertical / 0 side, since it
sits inside an already-padded card (two-class selector so it wins over
`EmptyState`'s own rule whatever the stylesheet order).

Copy decisions, flagged: title "No notifications yet" (not the reference's
"No new notifications" — this list shows recent notifications read *or*
unread, so "no new" would be inaccurate; empty means none at all);
description "Alerts about new orders will show up here." follows this app's
own empty-state phrasing (`OwnerOrders.jsx`), rather than the reference's
longer "order updates, status changes and more" line, which promises
things this app doesn't send. **No icon:** the reference's bell
illustration has no asset in this codebase, and `EmptyState` documents
reserving the icon slot rather than inventing one.

Responsive: centered text, `EmptyState`'s 32ch description cap, no fixed
widths — wraps at any width.

Verification: `vite build` passes; not rendered (no headless browser in
this sandbox), so the 320–1920px + landscape pass is still owed.

`docs/TASKS.md`'s 10.3f-ii checkbox ticked. Next: **10.3g** — restyle the
owner bottom nav to the new active-state treatment, reusing the real
existing nav icons. Note: `RoleShell`'s owner nav is shared with the
customer nav (Task 10.2e already restyled that one), so this should reuse
that work rather than start over.

---

**10.3g — owner bottom nav active-state treatment.** Correction first: the
10.3f-ii entry said 10.2e "already restyled" the shared nav; it actually
concluded *no code change was needed* (the customer reference has no
special active treatment), so there was nothing to reuse. Compared the
owner reference's bar fresh (cropped and enlarged): icons and labels
already match — orange icon + semibold orange label when active, gray
otherwise, real `DashboardIcon`/`OrdersIcon`/`StorefrontIcon`/
`ProfileIcon`, real labels Dashboard/Orders/Restaurant/Account (no Profile
tab invented). The one difference is a **short rounded orange bar under the
active tab's label** (the dark bar at the very bottom of the reference is
the phone's home indicator, not app UI).

Added it as a pseudo-element (`.navInnerOwner .navItemActive::after`, 3px
tall, `min(56px, 70%)` wide, `bottom: 4px`), no new markup. **Owner-only**:
`RoleShell.jsx` adds `.navInnerOwner` to `.navInner` when `role ===
'owner'`, because the customer reference has no such bar and admin's
mobile tabs (8.3g) share these classes — putting it on `.navItemActive`
would have changed all three. `.navItem` gained `position: relative` (the
Orders badge is positioned against `.iconWrap`, so it's unaffected).

Geometry check (by arithmetic, in the CSS comment): 56px bar, content
36px centered → label ends 10px above the bottom, bar occupies 4–7px, so
~3px clear of the label at every width; `min(56px, 70%)` keeps it inside
an ~80px tab at 320px and inside the 120px max tab (480px cap ÷ 4). It's
decorative; the active state is still announced by `NavLink`'s
`aria-current="page"`. Touch targets unchanged (full-height tabs).

Verification: `vite build` passes; not rendered (no headless browser in
this sandbox), so the 320–1920px + landscape pass — including a check with
the Orders badge showing on the active Orders tab, the one place the bar
and another element sit close together — is still owed.

`docs/TASKS.md`'s 10.3g checkbox ticked. Next: **10.3h** — the formal
responsive/verification pass on the whole Owner Dashboard at 320/390/768/
1024/1280/1920px + landscape, which closes out 10.3. It's the biggest
outstanding debt in this phase: nothing since 10.3c-v has been looked at
in a real render, so it needs a browser — the sandbox has none, so expect
either a CSS/markup trace again or a request that you run it locally.

---

**10.3h — formal responsive/verification pass, `OwnerDashboard.jsx`; three
tap-target gaps found and fixed, one proportion issue flagged.** Unlike
every session since Task 2.10, this one had a real browser: headless
Chromium is installed in this sandbox (the one thing every earlier
"not rendered" note said was missing). There is still no npm-registry
access (`npm ping` → 403) and no `node_modules`, so this did **not** run
the project's own Vite build — instead a small throwaway harness bundles
the *real* `OwnerDashboard` tree with esbuild (real components, hooks,
`api/client.js`, CSS Modules, `global.css`, the brand font), swaps only
`react-router-dom` for a ~15-line `Link`/`NavLink` shim (the only router
APIs this tree touches), and has Playwright answer `/api/*` with mocked
responses shaped from the backend services' own doc comments
(`orderCounts.js`, `salesSummary.js`, `hourlySales.js`, `notifications`).

**What was checked.** 12 data scenarios × 7 viewports = **84 real
renders**: viewports 320×640, 390×844, 768×1024, 1024×768, 1280×800,
1920×1080 and a 667×375 landscape phone (the 4 project breakpoints plus
the extra widths `UI_REDESIGN_ROADMAP.md` rule 6 requires). Scenarios:
typical data; singular counts (1 new / 1 completed, for the
"order"/"orders" labels); stress data (10-digit revenue, 99,999
notifications, 120-character unbroken locations, a Closed restaurant);
all-zero/empty; loading (requests never resolve); every endpoint 500;
403 on every restaurant-scoped endpoint (brand-new owner); a failed
Open/Closed `PATCH`; the hourly chart failing alone; the notification
list failing alone; and browser-notification permission `default`
(shows "Enable notifications") and `granted`. Each render is audited in
the page for: document horizontal overflow; any element's box past the
viewport edge; any element past its own card's edge; text clipped by
`overflow: hidden`; interactive controls under 44px (judged by the
**actual clickable pixels** via `elementFromPoint`, not just the element
box, so a `::after` hit area counts); the last card against the fixed
nav; and console/page errors. Separately, the bottom nav was swept at 5
viewports × active tab (Dashboard / Orders) × Orders badge (none / 3 /
150 → "99+"), measuring tab, label, badge and the 10.3g active bar for
overlap or clipping — this closes the check 10.3g's entry said was owed.

**Clean at every viewport and state:** no page-level horizontal scroll;
nothing escaping the viewport or its card; no clipped text (long
unbroken strings wrap inside their rows even at 320px; 10-digit amounts
wrap onto two lines rather than truncating); the last card clears the
nav by a constant 40px; all loading/error/403/empty/toggle-failure
states lay out correctly; the nav bar/badge/label never collide, even
active-Orders + "99+" at 320px; no console or page errors from the app
(the only console lines were the browser logging my own mocked 403/500
responses). Wide viewports cap the content in a centered column, so
nothing is stranded or stretched at 1920px.

**Bugs found (all tap targets under the 44px floor of Task 8.9a) and
fixed, CSS-only, no markup/JS change:**

1. **`.primaryButton` / `.secondaryButton`** (`OwnerDashboard.module.css`)
   — "Request to go Live" measured 32px tall, "View orders" 34px, and
   "Enable notifications" shares the same class. Root cause: this file's
   own copy of the pattern used `space-sm` vertical padding; 8.9a's
   "≈44px" finding was measured on the `space-md` copies in other screens
   and never checked this one. Fix: `display: inline-flex; align-items:
   center; justify-content: center; min-height: 44px` (8.9a2's
   `.linkButton` technique — text and horizontal padding unchanged, the
   box just grows). Confirmed 44px in the render afterwards, including
   the notification-permission `default` state.
2. **`.retryButtonInline`** — 43×16 (`padding: 0`), used in 5 error
   states (Orders, Sales, chart, notifications, Quick actions). Same
   fix, plus `min-width: 44px`. Only visible in error states; each use
   sits in a `.countsError` row (`align-items: center`), so the row just
   centers a slightly taller box.
3. **`DashboardHeader`'s Notifications / Account links** (shared
   component, `DashboardHeader.module.css`) — each is one caption line,
   ~14px tall, and the two sit 22px apart, so two *disjoint* 44px boxes
   can't exist at that pitch; growing the links would have made the
   header ~40px taller than the reference. Used 8.9a2's invisible
   `::after` technique instead (Modal close / SearchBar clear): the two
   hit areas split at the midpoint of the gap between the links and each
   extends 44px away from that line, so they never overlap. Measured
   clickable areas afterwards: 110×44 (Notifications), 56×44 (Account),
   144×44 (Notifications with a 5-digit count). Header height (98px) and
   both links' positions are **identical before and after** (measured),
   so nothing visible changed. Anchored to a new `--actions-gap` custom
   property rather than a hard-coded 4px. **Carries over to 10.4a** —
   the admin dashboard uses this same component and inherits the fix.

**Flagged, not fixed — new task 10.3z in `TASKS.md`.** The hourly sales
chart's text doesn't hold a stable size. It is a fixed 320-unit SVG
viewBox scaled by CSS `width: 100%`, so its 12px axis labels render
(measured) at **~9.5px at 320px** (SVG 254px wide), ~12px at 390px
(324px wide), and **~21.5px at every width from 768px up** (SVG 574px
wide — the content column's cap), against ~12–14px surrounding text.
Nothing overflows or clips, and the SVG carries an `aria-label` with the
day's total, so this is legibility/proportion, not breakage — but it's a
real visible defect at tablet/desktop. My audit's font-size check
missed it because it reads computed `font-size`, which ignores SVG
scaling; it was caught by measuring `svgWidth / viewBoxWidth × 12`. The
fix is a design decision (keep text constant by using the measured
container width as the viewBox — which changes the chart's aspect ratio
at wide widths — vs. cap and center the chart vs. leave it), so it's
filed for you rather than picked here, same call 10.2f made about the
Popular Foods price sliver.

**Caveats on this verification.** (1) The harness ran **React 19.2.5**
(the only React installed in the sandbox); the project pins `^18.3.1`.
Nothing here is 19-specific, but it isn't the exact runtime. (2) CSS
Modules were compiled by esbuild, not Vite — same rules, different
generated class names. (3) API responses were mocked from reading the
backend code, not from a running backend/Oracle, so real payload quirks
(e.g. `is_read` typing) weren't exercised; `useOwnerNewOrderAlerts`'s
poll got empty responses, so its sound/browser-notification path wasn't
fired. (4) Chromium only — no Safari/Firefox, no real touch device. (5)
Playwright's full-page screenshots draw the `position: fixed` nav
mid-image; that's a capture artifact (the bar-at-bottom check used real
viewport-sized shots and geometry, not those images). (6) The rest of
the visible content — card order differing from the reference, the lone
half-width "Check Live Status" tile on the 403 state (10.3d-iv's
intended behavior), the badge sitting over the tab icon (Task 5.21) —
is unchanged pre-existing design, noted only so it isn't rediscovered.

`docs/TASKS.md`'s 10.3h checkbox ticked, closing out all of **10.3**
(Owner Dashboard) — its own top-level checkbox ticked too; **10.3z**
added, unticked. Next: **10.4a-i** (Admin Dashboard, wiring
`DashboardHeader`), noting **10.4a-iii** (account link destination) and
**10.4e** (bottom-tab vs. sidebar chrome) are both flagged in
`TASKS.md` as needing your input before they're built.

---

**10.4a-i — wire `DashboardHeader` into `AdminDashboard.jsx`.** Replaced the
plain `<h1 className={styles.heading}>Dashboard</h1>` with
`<DashboardHeader subtitle="Admin Dashboard" className={styles.dashboardHeader} />`
per `docs/reference_ui/phase10_admin_dashboard_reference.jpg` — same shape
as 10.3a-i. The "NATRA" wordmark is the component's own content.
`notificationHref`/`notificationCount`/`accountHref` are deliberately not
passed: the component renders no link row without them (its "no invented
placeholder" rule), and those are 10.4a-ii and 10.4a-iii.

**CSS:** removed the dead `.heading` rule (no other users — grepped);
added `.dashboardHeader { margin-bottom: var(--space-xl) }`, preserving the
24px gap `.heading`'s own margin gave before the Totals card.
`DashboardHeader` has no bottom margin of its own. Revisit when 10.4b adds
`Greeting` between the two (it brings its own padding, so this may need
trimming to `space-sm` as 10.3a-i's did).

**Verified in a real render** (the Chromium harness from 10.3h, pointed at
`AdminDashboard`; router shimmed, `/api/admin/dashboard-summary` mocked from
`adminDashboardSummary.js`'s documented shape): 4 states (typical incl. a
~100-character restaurant name, empty, 500, loading) × 7 viewports (320,
390, 768, 1024, 1280, 1920, 667×375 landscape) = 28 renders. No
horizontal overflow, nothing outside the viewport, no page errors, subtitle
reads "Admin Dashboard" everywhere, and no links render in the header
(correct until 10.4a-ii/iii). The header is the same 98px band as the
owner's, and the content column caps at 608px inside `.page`'s 640px.
Same caveats as 10.3h (React 19 harness, esbuild not Vite, mocked API,
Chromium only).

**Flagged, not fixed — both already belong to later tasks:**
1. **Duplicate wordmark at ≥768px.** The admin sidebar's brand ("NATRA
   ADMIN") and this header's "NATRA" are both on screen at once. On phones
   there's no sidebar (8.3g bottom tabs), so no duplication. This is the
   chrome question **10.4e** already asks you to decide (bottom tabs at all
   widths vs. sidebar ≥768px); it will resolve it either way (drop the
   sidebar, or drop/adjust one brand mark).
2. **No `<h1>` on the page now.** Replacing the heading with the header
   removes the only `<h1>` (the wordmark is a `<span>`). 10.3a-i did the
   same on the owner dashboard, so this is a shared-component question
   (should `DashboardHeader` render its subtitle or wordmark as a heading?)
   rather than an admin one — worth deciding once for both dashboards.
Also noted, pre-existing and owned by 10.4d: at 390px the recent-activity
descriptions truncate hard ("New order NTR…") because of 8.3b's deliberate
single-line ellipsis; the status-pill restyle there is where to revisit it.

`docs/TASKS.md`'s 10.4a-i checkbox ticked. Next: **10.4a-ii** — wire the
real notification count into the header's indicator. Unlike the owner's
(scoped by user id, Task 7.5), first confirm whether any admin-scoped
notifications exist to count before assuming the same endpoint applies.

---

**10.4a-ii — real unread-notification count wired in. No backend gap
this time** (unlike 10.3a-ii, which had to add `is_read` filtering to
`notificationController.js` first) — that filter already exists and
`notificationController.js`'s own header comment already confirms both
routes are scoped by `req.user.id` with no role-specific branching, so
the same `GET /api/notifications?is_read=0&limit=1` call the owner
dashboard uses works for an admin caller unchanged.

**Checked first, per the prior entry's own "confirm before assuming"
note:** grepped every writer of a `notifications` row —
`submitOrder.js` and `notifyBeforeExpiry.js`, both of which resolve
`recipient_id: restaurant.owner_id`. Neither, nor anything else in
`backend/src`, ever sets `recipient_id` to an admin's `users.id`. So
today this count will always resolve to 0 for an admin caller — not a
bug in this wiring, just a real reflection of there being no
admin-targeted notifications yet. Wiring the real endpoint now (rather
than waiting) is still the right call: it's not an invented number, it
costs nothing extra, and it starts working the moment some future task
adds an admin-recipient writer, with no further frontend change needed.

**Frontend, `AdminDashboard.jsx`:** new `fetchUnreadNotificationCount`
(identical body to `OwnerDashboard.jsx`'s own copy, same "small
fetcher, not worth a cross-screen dependency" duplication convention),
wired as a second, independent `useApiQuery` call alongside the
existing dashboard-summary one — kept separate so this fetch's own
loading/failure can't block the Totals/Recent-activity content, same
reasoning `OwnerDashboard.jsx` already established. Passed into
`DashboardHeader` (wired in 10.4a-i) as
`notificationCount={unreadNotificationCount ?? undefined}` — same
"`null`/error both fall through to `undefined`, never a `0`/stale
placeholder" rule 10.3a-ii used, so the indicator reads as plain
"Notifications" (no parenthetical figure) until a real count resolves.

**`notificationHref="/admin/live-requests"` — a flagged decision, not
assumed final.** `DashboardHeader` renders nothing in this row without
an `href`, so one had to be chosen even though (per the point above)
the count itself is inert today. No dedicated admin notification-list
screen exists. Picked `/admin/live-requests` over `/admin/orders`
because this same dashboard's own "Recent activity" card, just below
the header, already surfaces the orders half of that feed in-page — a
pending live request is the one item on this screen that isn't already
shown elsewhere and that genuinely benefits from a direct link.
Revisit once a real admin-notification writer exists: its `type` may
point at a more specific destination than either list screen.

No npm-registry access needed this session — `tsc` was already
available locally. Verified with `tsc --noEmit --noResolve --allowJs
--jsx react-jsx --esModuleInterop --skipLibCheck` on `AdminDashboard.jsx`
(clean, zero errors) and a brace/paren/bracket-balance check on the same
file (57/57, 61/61, 5/5) — not a real rendered/screenshotted frontend
check.

`docs/TASKS.md`'s 10.4a-ii checkbox ticked. Next: **10.4a-iii** — wire
the account text link, once the real destination is confirmed (no
dedicated admin account page exists today; likely `/admin/settings`,
per that task's own note not to assume without checking).

---

**10.4a-iii — investigated, not wired. A real "decision needed" block,
same shape as 10.3z/10.4e, not a straightforward wire-up.**

**Checked `/admin/settings` first, per the task's own instruction not
to assume.** `AdminSettings.jsx` (6.12b/6.13b) is registration-fee/
payment-method/order-timeout config — platform settings an admin sets
*for the app*, not anything about the admin's own identity. No name,
email, phone, password, or logout control anywhere on that screen.
Pointing `DashboardHeader`'s "Account" link there would land an admin
on a screen with nothing to do with their account — worse than no link
at all, since it looks like a real destination and isn't one.

**Checked for any other admin-account screen — none exists.**
`OwnerAccount.jsx` (Task 5.22) is the only account screen in this
codebase, and it's owner-specific top to bottom: hardcoded
`RoleShell role="owner"`, its logout navigates to `/owner/login`, and
its header comment explains it's "the only sensible home" for a
logout button because *no other admin/owner settings screen exists* —
true for admin too, checked `RoleShell.jsx`'s admin sidebar/nav
directly, no logout anywhere.

**The backend is actually ready for this — it's a frontend-only gap.**
`auth.routes.js`'s own comment on `PATCH /me`/`PATCH /me/password`:
"Task 5.22 — owner (or admin) editing their own account... scoped to
`req.user.id`." Both routes already work for an admin caller with zero
backend change. What's missing is a page.

**Why this isn't built now anyway:** a real `AdminAccount` screen
(profile form + password form + the still-missing admin logout) is new
feature work — closely modeled on `OwnerAccount.jsx`, but a new route,
a new component, and closing a real pre-existing gap (admin has no
logout today, at all). Phase 10's own governing rule is restyle only,
real app data/behavior, no invented features — building a new screen
to give this one header link somewhere to go is exactly the kind of
scope Phase 10 is scoped to exclude, not a restyle of something that
already exists the way `/owner/account` was for 10.3a-iii.

**Left `accountHref`/`accountLabel` unpassed**, same as 10.4a-i left
them — `DashboardHeader` already renders nothing for that slot without
an `href` (its own "no dead link" rule), so this is inaction, not a
broken link.

`docs/TASKS.md`'s 10.4a-iii line updated to a flagged decision (not
ticked). **Needs your call:** build a minimal `AdminAccount` page now
(closing the logout gap along with it), or leave this link unset and
defer to a later phase. Next, independent of that decision: **10.4b** —
wire the shared `Greeting` above the totals grid.

---

**10.4b — shared `Greeting` wired in, straightforward this time: no
open questions, no backend involved.**

**`AdminDashboard.jsx`:** added `<Greeting subtitle="Here's what's
happening with your business today." className={styles.greeting} />`
right after `DashboardHeader`, importing the same shared component
`OwnerDashboard.jsx`'s own 10.3b already wired — `Greeting.jsx`'s own
header comment already named this exact second line for this task
("...your business today.", vs. the owner's "...your restaurant
today."), so the copy itself was a given, not a fresh decision:
"business" fits an admin who oversees the whole platform, not one
restaurant.

**Checked first whether this was a swap or a pure addition** — unlike
10.3b, which replaced `OwnerDashboard.jsx`'s old `.subheading`
paragraph, grepped `docs/PROJECT_STATUS.md`'s own history for this
screen and confirmed `AdminDashboard.jsx` never had a subheading: Task
6.3b's original build went straight from the old `<h1>Dashboard</h1>`
to the Totals card. So this is a pure addition, not a removal-plus-
replacement.

**CSS:** trimmed `.dashboardHeader`'s `margin-bottom` from `space-xl`
to `space-sm` — the exact revisit `AdminDashboard.module.css`'s own
10.4a-i comment already flagged as needed once `Greeting` landed
between the header and the Totals card, and the same value
`OwnerDashboard.module.css`'s own `.dashboardHeader` rule uses for the
identical header-before-Greeting gap. Added `.greeting { margin-bottom:
var(--space-sm) }`, matching `OwnerDashboard.module.css`'s own
`.greeting` value — copied for visual consistency between the two
dashboards rather than derived from a removed class, since (per the
point above) there was no old subheading margin here to top up.

**Verified:** `tsc --noEmit --noResolve --allowJs --jsx react-jsx
--esModuleInterop --skipLibCheck` on `AdminDashboard.jsx` (clean) and a
brace/paren/bracket-balance check on both the `.jsx` (59/59, 63/63,
5/5) and the `.module.css` (71/71, 20/20) — not a rendered/screenshotted
check, so the actual on-screen gap between `DashboardHeader` and
`Greeting` (and `Greeting` and the Totals card) isn't confirmed against
a real viewport yet; worth a look during **10.4f**'s own responsive
pass, same as every other Phase 10 screen's spacing was only really
confirmed at that screen's own closing verification task.

`docs/TASKS.md`'s 10.4b checkbox ticked. Next: **10.4c-i** through
**10.4c-v** — the four `StatTile`s (Restaurants/Live/Pending/Orders)
assembled into the 2×2 grid, same shape 10.3c already used for the
owner dashboard's own four stats.

---

**10.4c (i through v) — all four `StatTile`s wired in one pass, same
shape 10.3c used for the owner dashboard's own four stats. One real
finding along the way: the reference's color-to-tile mapping isn't
what `StatTile.jsx`'s own comment guessed.**

**Data:** no new fetch — `TOTAL_ITEMS` (already in the file since
6.3b) maps straight onto the one `GET /admin/dashboard-summary`
response's `totals` object (`restaurants`/`live`/`pending`/`orders`),
same as before this task.

**Checked the reference image directly before picking variants**, same
"match the reference's tints" rule `OwnerDashboard.jsx`'s own 10.3c
comment established (`primary`/`success`/`error` for orange/green/red,
`info` as "the closest existing blue-ish variant" for whichever tile
is blue). `docs/reference_ui/phase10_admin_dashboard_reference.jpg`
shows the same four-color pattern as the owner reference, just on
different tiles: **Restaurants** is the orange storefront tile
(`primary`), **Live** is the green signal tile (`success`), **Pending**
is the blue clock tile (`info`), **Orders** is the red/pink document
tile (`error`).

**This does not match what `StatTile.jsx`'s own header comment said**
before this task (`info` for "Admin's Live/Orders", i.e. tiles that are
"neither a success nor an error state") — that line was written back
at 10.0d, before any task had actually opened the admin reference image
against the real four-variant palette. Fixed it in the same commit as
this task rather than leaving a stale/misleading comment behind: it now
points at each screen's own header comment for its actual mapping
instead of guessing an admin-specific one inline, since (as this
mapping shows) Owner's and Admin's tiles don't share labels or colors
in the same order.

**`AdminDashboard.jsx`:** `TOTAL_ITEMS` gained a `variant` field per
entry; the render swapped 6.3b's plain `.totalItem` divs for real
`<StatTile count label variant />` elements, same as `counts`' → 4
`StatTile`s pattern `OwnerDashboard.jsx` established first. No `to`
link on any tile — matches Owner's own precedent (its four tiles don't
link out either), so `StatTile`'s optional link affordance stays unused
on both dashboards for now.

**CSS:** replaced `.totalsGrid`/`.totalItem`/`.totalValue`/
`.totalLabel` outright with a new `.statGrid` — fixed 2 columns at
every width (the reference never shows four across, so the old rule's
`@media (min-width: 480px)` 4-column switch was doing something the
design never called for), same `minmax(0, 1fr)` overflow-safety
`OwnerDashboard.module.css`'s own `.statGrid` already uses. **One real
difference from the owner's copy, not a divergence to fix**: no
`margin-bottom` here — the owner's grid sits directly on the page next
to a sibling card, this one is the last child *inside* the "Totals"
card, whose own `gap`/`padding` already handle both the spacing above
and below it. Also fixed the file's own top-of-file 8.3b verification
comment, which named the now-removed `.totalsGrid` 480px breakpoint —
updated to note the rule it described no longer exists, while
confirming the underlying verification claim (four short stats fit
comfortably at 548px+) still holds under the new, simpler rule.

**Verified:** `tsc --noEmit --noResolve --allowJs --jsx react-jsx
--esModuleInterop --skipLibCheck` on `AdminDashboard.jsx` and the
edited `StatTile.jsx` (both clean), plus a brace/paren/bracket-balance
check on `AdminDashboard.jsx` (71/71, 62/62, 5/5),
`AdminDashboard.module.css` (67/67, 15/15), and `StatTile.jsx` (22/22,
15/15, 5/5) — not a rendered/screenshotted check, so the real on-screen
tile colors against the reference image aren't confirmed pixel-for-
pixel yet; that's this phase's own **10.4f** responsive/verification
pass, same closing-task shape every other Phase 10 screen has used.

`docs/TASKS.md`'s 10.4c-i through 10.4c-v checkboxes ticked. Next:
**10.4d-i/ii** — the status-pill treatment for each recent-activity
row.

---

**10.4d-i/ii — recent-activity row status pills, done together.** The
leading `StatusBadge` was already the first child of `.activityMain`
(built alongside the feed itself, Task 6.3b) — 10.4d-i's real work was
color, not position: `docs/reference_ui/phase10_admin_dashboard_
reference.jpg`'s own row pills use distinct tints per status (gray
Pending/Accepted, blue New, green Completed, orange Approved), but
`ACTIVITY_STATUS_TONE` only ever had `success`/`error`/`neutral` to
choose from (`StatusBadge`'s own `TONES` set) — not enough colors for
five different-looking statuses.

**`StatusBadge` extended, additively:** two new tones, `info` and
`primary`, added to `TONES` and given tinted (`color-mix`) styling in
`StatusBadge.module.css` — same technique `StatTile`'s own variants
already use (Task 10.0d), not the solid-fill treatment `success`/
`error`/`neutral` keep. Left those three untouched on purpose: several
existing callers (`EntityCard`'s Open/Closed badge, Task 10.2b-iii)
place this component directly over a photo and rely on the solid
fill's contrast there — changing that styling globally to match one
new screen's tinted-pill look would have risked every on-photo caller,
which this task's own scope doesn't cover. `info` reuses the
primary-tint-derived color `StatTile.jsx`'s own 10.0d comment already
established as "the closest existing blue-ish variant" for the same
reference's blue tiles, since this codebase has no real blue token —
flagged in `StatusBadge.module.css` that this makes `info`/`primary`
visually close where the reference shows blue vs. orange, a real gap
left for whoever adds a blue token later, not guessed here.

**`ACTIVITY_STATUS_TONE` remapped:** `new` → `info`, `approved` →
`primary`; `pending`/`accepted` stay `neutral` (already tinted gray,
already matched the reference); `completed`/`rejected` stay `success`/
`error` (solid — a flagged, accepted deviation from the reference's
tinted green for Completed, kept rather than touching the shared solid
tone; `rejected` never actually appears in this feed's real data today
per `adminDashboardSummary.js`, kept for robustness rather than removed
as dead code).

**10.4d-ii (row restyle around the pill):** the row's existing
ellipsis-truncated description + fixed-width timestamp shape (Task
6.3b, verified at 8.3b) needed no structural change — the pill was
already leading, the description already truncates, the timestamp was
already right-aligned and non-shrinking. The one real decision: the
reference's trailing chevron ("›") was **not** added — same "don't add
a directional/clickable cue a row can't back up" call `10.3f-i`'s own
notification-row comment already made, since no activity row is
actually a link/button here (no `onClick`, no route). Documented
inline in `AdminDashboard.jsx` as a flagged, revisitable decision, not
silently omitted.

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via a
brace/paren-balance check on all three edited files
(`AdminDashboard.jsx`, `StatusBadge.jsx`, `StatusBadge.module.css`, all
balanced) and a manual re-read against the reference image, not a
rendered/screenshotted check.

`docs/TASKS.md`'s 10.4d-i and 10.4d-ii checkboxes both ticked. Next:
**10.4e** — decision needed from the project owner (bottom-tab nav as
primary admin chrome at all widths, vs. staying the <768px-only
fallback alongside a separately-restyled sidebar) before 10.4f's
closing responsive pass can be scoped. **10.4a-iii** (admin account
link destination) is also still an open decision, flagged earlier in
this file and in `docs/TASKS.md` — both are project-owner calls, not
addressed in this session.

---

**10.4a-iii — decided and built: `AdminAccount.jsx`, a new profile +
password + logout screen for the admin role.** The project owner chose
"build a minimal profile page with password management and a logout
button now" over leaving `accountHref` unset — closing the one open
decision this task had been waiting on since Task 10.4a-i first flagged
it.

**Built as a near-verbatim port of `OwnerAccount.jsx` (Task 5.22), not a
from-scratch screen** — `users` is one shared table/shape for both
roles (`docs/DB_SCHEMA.md`), and `PATCH /api/auth/me`/`PATCH
/api/auth/me/password` were already confirmed role-agnostic by reading
`authController.js` directly (scoped by `req.user.id` via
`authMiddleware`, no owner-specific branching) — so no backend change
was needed, same "already supports an admin caller" finding this task
flagged when it was first opened. Same two independent `useMutation`s
(profile / password), same fetch-then-edit seeding shape, same
wrong-current-password-is-a-form-banner vs. email-conflict-is-a-field-
error split, same `FormField`/`EmptyState` components — copied rather
than imported (no shared-screen mechanism exists in this codebase for
two role variants of the "same" screen, same precedent every duplicated
per-role file here already sets, e.g. `AdminDashboard.jsx`'s own
`ACTIVITY_STATUS_TONE` comment).

**Deliberate differences from the owner version:**
- `RoleShell role="admin"`; logout navigates to `/admin/login`, not
  `/owner/login`.
- No `clearOwnerOrderBadge()` call on logout — that badge (Task 5.21) is
  an owner-only concept with no admin equivalent to clear.
- No "restaurant" anywhere in the copy.
- **Not added to `RoleShell`'s own 4-item admin nav** (Dashboard/
  Restaurants/Orders/Platform Settings) — that's a separate, still-open
  decision (Task 10.4e), not something this task's own scope extends.
  Reached instead via `DashboardHeader`'s account link and a direct
  `/admin/account` route, same "not every reachable screen has to be a
  nav tab" shape — a genuine difference from the owner side (where
  `/owner/account` *is* one of its 4 tabs), not an oversight.

**Wiring:** new `frontend/src/pages/AdminAccount/` (`.jsx`/`.module.css`/
`index.js`, the `.module.css` an identical copy of `OwnerAccount.
module.css`'s own already-8.2f-verified shell). New `/admin/account`
route in `App.jsx`, placed right after `/admin/settings`. `AdminDashboard.
jsx`'s `DashboardHeader` now passes `accountHref="/admin/account"`
(`accountLabel` left unpassed, same "don't fetch a fifth value just for
a label this task didn't ask for" reasoning `OwnerDashboard.jsx`'s own
10.3a-iii comment gives for its identical choice — `DashboardHeader`'s
own "Account" default renders).

No npm-registry access this session (`npm ping` → 403, standing gap
since Task 2.10) — no `node_modules` in this checkout; verified via a
brace/paren-balance check on all four edited/new files (`AdminAccount.
jsx`, `AdminAccount.module.css`, `App.jsx`, `AdminDashboard.jsx`, all
balanced) and a manual re-read against `OwnerAccount.jsx`'s own
already-verified shape, not a rendered/screenshotted check — this
screen's own responsive pass isn't a named Phase 10 sub-task (it wasn't
in original scope), so it should get at least a spot-check the next
time a real browser is available in this sandbox, same standing note
every no-npm-access session leaves.

`docs/TASKS.md`'s 10.4a-iii checkbox ticked. Next: **10.4e** is still
the one remaining open decision (bottom-tab nav at all widths vs. the
current <768px-only fallback) — needed before **10.4f**'s closing
responsive pass can be scoped; not addressed this session.


---

**10.4e — decided; 10.4f — done.** The project owner chose option (b) for
10.4e: the admin bottom tabs stay the <768px fallback (Task 8.3g) and the
sidebar stays the ≥768px chrome, restyled. That is what `RoleShell`
already did, so the decision needed no structural change — 10.4e is a
"confirmed, no change" outcome, logged as such (Working process rule 4).
`AdminAccount` stays out of the 4-item nav (reached via the header's
account link), consistent with the same decision.

**This session had a working npm registry and headless Chromium** (the
log's standing note since Task 2.10 says earlier sessions did not) —
`npm ci`, `vite build` (passes) and a real Playwright render all worked,
so 10.4f was verified in real renders, not by tracing CSS. (`npm run lint` could not run: the uploaded zip has no
ESLint config file, only `package.json`'s script — dotfiles were not in
the archive. Not investigated further.) API calls were mocked in the
browser (`/api/**` intercepted with fixture responses for
`dashboard-summary`, `notifications`, `auth/me` and empty admin lists);
no backend was involved.

**Built (CSS + one class in `RoleShell.jsx`, no new elements/icons/text,
no new tokens):**
- **Sidebar restyle** (`RoleShell.module.css`, `.sidebar*`). Same 220px
  fixed rail, same four links/icons, same "NATRA Admin" brand text. Links
  are now rounded pills (`--radius-md`) inset from the rail edge, 44px
  `min-height`; hover = `--color-surface-muted`; active = the primary tint
  already used by `StatTile`/`StatusBadge`
  (`color-mix(in srgb, var(--color-primary) 14%, var(--color-surface))`),
  orange icon + semibold label, and a short rounded orange bar on the
  pill's left edge (the bottom bar's underline turned vertical) replacing
  the old full-height 3px left border; keyboard focus gets the same 2px
  primary ring `StatTile` uses (there was no `:focus-visible` rule
  before). The admin reference is phone-width and shows only the bottom
  bar, so this carries that bar's vocabulary across; it is not a copy of
  a reference sidebar.
- **Admin bottom-bar active underline.** The admin reference shows the
  short orange bar under the active tab; the admin mobile bar (8.3g) had
  it missing because 10.3g made the underline owner-only
  (`.navInnerOwner`). Added `.navInnerAdmin` to the same selector and put
  it on the admin `.navInner`. Customer is unchanged (its reference has
  no bar).

**Verified (real render, headless Chromium 141):** widths 320, 390, 767,
768, 1024, 1280, 1920 and 667x375 landscape × 6 admin routes
(`/admin/dashboard`, `/restaurants`, `/orders`, `/settings`,
`/live-requests`, `/account`) = 48 renders, all passing:
- no page-level horizontal overflow at any width;
- exactly one nav visible at every width — bottom bar at 767 and below,
  sidebar at 768 and above, no overlap at the boundary;
- sidebar links ≥44px tall, none clipped or escaping the rail, rail never
  scrolls; bottom tabs ≥44px, labels not clipped;
- underline bar never overlaps its label (label bottom ≤ bar top by
  ≥2.5px in every render), never wider than its tab (56px in tabs from
  80px up);
- content is not hidden under the bottom bar (scrolled to the end);
- `DashboardHeader`'s two links keep their 44px hit areas (10.3h's
  `::after`; probed with `elementFromPoint` 14px outward from each link);
- dashboard loading / error / empty states at 320, 667x375, 768, 1280:
  no overflow, one nav.

**`AdminAccount` spot-check (owed since 10.4a-iii): rendered and fine** at
320–1920 — form, both buttons and Log out fit, sidebar/bottom bar
correct (no tab is active there, by design).

**Flagged, not fixed — new task 10.4z in `TASKS.md`:** the Recent
activity rows leave almost no room for the description on phones (9–45px
of 186–245px at 320px; 79–115px at 390px). Pre-dates this session
(10.4d-i added the status pill). Needs an owner decision because the
reference itself shows ellipsis at phone width; options are in the task.

**Flagged — contrast (unchanged convention, slightly lower number):** the
active sidebar label is primary `#f2690c` on the 14% tint (`#fdeadd`):
**2.65:1**. The old active state (primary on `--color-surface-muted`) was
2.85:1, and the bottom-bar active label (primary on white) is 3.09:1 —
all below 4.5:1 for 14px text. This is the same bright-orange-as-text
tradeoff Task 9.1 knowingly reverted to (see `DESIGN_TOKENS.md`'s 10.0a
note), and the same primary-on-14%-tint pair `StatTile`/`StatusBadge`
already ship, so it was not re-opened here. Inactive sidebar labels are
4.93:1.

**Shared-component note (Working process rule 5):** `RoleShell` is shared
— the sidebar is the chrome for *every* admin screen, not just the
dashboard (Restaurants, Orders, Live requests, Settings, Account), none
of which are Phase 10 pages. They picked up the new sidebar and the
bottom-bar underline; each was checked for overflow/nav correctness above
but not restyled internally.

**Observation, not changed:** at ≥768px the sidebar's "NATRA Admin" brand
and `DashboardHeader`'s "NATRA" wordmark are both visible on the
dashboard. The sidebar brand is the only identity on the other admin
screens (they have no header band), so it was left; say if you want it
dropped or simplified.

`docs/TASKS.md`: 10.4e, 10.4f and the 10.4 parent ticked; 10.4z added.
**Phase 10's in-scope pages are all ticked**; the only open items are the
two owner-decision follow-ups, **10.3z** (hourly-sales chart label size)
and **10.4z** (activity-row description width).


---

**10.3z — decided (option (a)) and built.** The project owner chose to
measure the container and use its real width as the viewBox width, so the
axis labels stay 12px at every size.

**Built (`HourlySalesChart.jsx`; one comment rewritten in
`HourlySalesChart.module.css`; no new dependency, no new visual elements):**
- The viewBox is now `0 0 <measured width> <height>` instead of a fixed
  `0 0 320 140`, so 1 SVG unit = 1 CSS px. Width comes from a small
  `useElementWidth` hook: measured in `useLayoutEffect` (first paint already
  correct), kept current with a `ResizeObserver` (window `resize` listener
  if `ResizeObserver` is missing). Falls back to the old 320 until measured
  or if a measurement is 0, and is floored at 160 so the plot width can
  never go negative. The CSS (`width: 100%; height: auto`) is unchanged and
  now yields exactly the viewBox height.
- **Aspect ratio (the trade-off the task named):** height grows with width,
  `clamp(0.4375 × width, 120, 180)`px (0.4375 = the old 140/320), so a wide
  card gets a wide chart of at most 180px rather than a very flat 140px one
  or the old 251px-tall enlargement. The bounds are my choice, not from the
  task or the reference — easy to retune (`MIN_HEIGHT`/`MAX_HEIGHT`/
  `HEIGHT_RATIO`).
- **Label spacing** is now derived from the real plot width: every 3 hours
  as before, or the smallest N that keeps ≥40px between label centres (a
  24-hour window at 320px now labels 12am/5am/10am/3pm/8pm instead of
  running 8 labels together).
- **Side fix:** `PAD_LEFT`/`PAD_RIGHT` 16→20. The old chart already clipped
  the last label ("11pm") by about 1px at 320px and about 2px at every
  wider width (bounding box past the SVG's right edge); with 12px labels the
  half-width of "12am"/"11pm" is ~18px, so 16 would still have clipped.
- Dot radius and line width are now constant px (they used to scale with the
  card: fat at wide widths, thin on phones). Not a change in the CSS values.

**Verified (real render, headless Chromium, API mocked):** rendered label
size, before → after: 320px **9.52 → 12.00px**; 390px 12.15 → 12.00px;
768px and up **21.53 → 12.00px**. Chart size after: 254×120 (320px), 324×142
(390px), 574×180 (768px and up, the card is capped by the page column). At
7 viewports (320/390/768/1024/1280/1920 and 667×375): no page-level
horizontal overflow, no label clipped or overlapping, in the normal day, a
24-hour window (sales at midnight) and a flat zero day. Live resize without
reload (1280→900→600→480→414→360→320→500→1280) tracks correctly at every
step with no console errors. Sales Overview totals, loading and error
states are untouched (checked visually at 390 and 1280).

`docs/TASKS.md`: 10.3z ticked. **The only open Phase 10 item now is
10.4z** (Admin activity-row description width) — the closing sentence of
the 10.4f entry above that names both is superseded.


---

**10.4z — built as option (a).** The project owner moved on ("Next") without
choosing between the task's three options, so this took the one recommended
in the task and in the last two summaries: stack the timestamp under the
row on narrow phones. **This is an assumed decision, not a confirmed one**
— reverting or swapping it is a single media-query block in
`AdminDashboard.module.css`.

**Built (`AdminDashboard.module.css` only):** `@media (max-width: 389px)` on
`.activityRow` (`flex-wrap: wrap`, `row-gap: var(--space-xs)`) and
`.activityMain`/`.activityTime` (`flex: 1 1 100%`) — the timestamp moves to
its own left-aligned line beneath the status pill + description, which keep
their single-line ellipsis. The 390px breakpoint is deliberate: at 390px the
description showed 79-115px, about what the reference image itself shows at
phone width, so 390px and up is left exactly as it was.

**Verified (real render, API mocked), visible px of each description
(shortest-longest of 5 rows), before → after:** 320px 9-45 → 157-201 (of
186-245); 360px 49-85 → 186-239 (4 of 5 rows now fully visible); 375px and
389px full or within ~10px of full. 390, 414, 480, 600, 767, 768, 1280:
unchanged from before, to the pixel. No row escapes its card, no timestamp
clipped, no page-level horizontal overflow at any of those widths; stacked
rows are 55px tall (single-line rows 37px). Re-ran the whole 10.4f matrix
(8 viewports × 6 admin routes = 48 renders): still no problems.

`docs/TASKS.md`: 10.4z ticked. **Every Phase 10 checkbox is now ticked** — the
Phase 10 exit check (each screen against its reference, data traced to real
endpoints, responsive pass) is the remaining formal step, not run as a
single closing pass; the per-screen passes 10.1h, 10.2f, 10.3h and 10.4f are
each done.


---

**Phase 10 exit check — run (2026-09-20).** The closing pass named in
`docs/TASKS.md`: each restyled screen against its reference image, every
data-bearing element traced to a real endpoint/field, and a responsive
pass — run in real headless-Chromium renders with the API mocked (no
backend/Oracle in this sandbox). **Result: two open findings (10.2z,
10.2z2), one fix made, everything else clean.** Pages checked: `OwnerLogin`,
`AdminLogin`, `Home`, `OwnerDashboard`, `AdminDashboard`.

**1. Responsive pass.** 5 screens × 7 viewports (320, 390, 768, 1024, 1280,
1920, 667×375 landscape) = 35 renders, plus the 48-render admin matrix from
10.4f re-run after the fix below (still 48/48). Checked in every render:
page-level horizontal overflow (none), any element escaping the viewport
outside a scroll container (none), clipped non-ellipsis text (none — the
one hit is `OwnerDashboard`'s visually-hidden `.srOnly` "Unread:" label,
intentional), images wider than the viewport (none). Tap targets under 44px:
- `DashboardHeader`'s two links (14px tall) — the 10.3h `::after` hit areas
  are present and work (probed with `elementFromPoint`).
- The Open/Closed toggle's checkbox is 1×1 by design; its `<label>` is
  89×44.
- Food cards' round "+" is 32px but is not separately interactive — the
  whole card is the `role="button"` target (109×175 at 390px).
- **Fixed — Categories chips were 40px tall** (and "All" 44×40), and the
  `FilterBar` dropdown likewise. Task 8.9a2's "≈44px" was a paper estimate
  (it assumed a 20px line box; a 14px font has ~16px), never measured in a
  browser. Added `min-height: 44px` (+ `min-width: 44px` on `.chip`) in
  `FilterBar.module.css`. `FilterBar`'s only other caller is `AdminOrders`
  (re-checked, no overflow at any width).
- **Not fixed — `SearchBar`'s `<input>` is 18px tall** inside a 36px pill
  (Home header). Known since 8.9a2, which deliberately kept the pill at the
  reference's height and only extended the *clear button's* hit area; the
  pill itself isn't a click target for the input. Not a Phase 10
  regression; an option if wanted is making a tap anywhere on the pill
  focus the input.

**2. Data tracing — every element maps to a real route and field** (read
from the route files, controllers and services; response shapes matched by
name, not exercised against a real DB):

| Page | Element | Endpoint (route file) | Fields |
|---|---|---|---|
| OwnerLogin / AdminLogin | login | `POST /api/auth/login` (`auth.routes.js`) | `{ user, token }`, `user.role` |
| Home | restaurant cards | `GET /api/restaurants?limit=` (`restaurant.routes.js`, public) | `name`, `location_text`, `is_open`, `logo_url`, `cover_url`, thumbnails |
| Home | category chips | `GET /api/categories/live` | `categories[].name` |
| Home | Popular Foods | `GET /api/foods/popular?limit=` | `name`, `price`, `restaurant_name`, `image_url`, `image_thumbnail_url` |
| Home | search results | `GET /api/search?q=` | foods + restaurants |
| OwnerDashboard | 4 stat tiles, status list | `GET /api/orders/counts` | `counts.{total,New,Accepted,Completed,Rejected}` |
| OwnerDashboard | Sales Overview totals | `GET /api/orders/sales-summary` | `summary.{todayTotal,allTimeTotal,completedOrderCount}` |
| OwnerDashboard | hourly chart *(named exception)* | `GET /api/orders/sales-hourly` | `hourly.hours[24]` |
| OwnerDashboard | notification rows + header count | `GET /api/notifications` | `id`, `message`, `is_read`, `created_at`, `meta.total` |
| OwnerDashboard | Open/Closed tile | `GET`/`PATCH /api/restaurants/me` | `restaurant.is_open` |
| AdminDashboard | 4 stat tiles, activity feed | `GET /api/admin/dashboard-summary` (`requireAdmin`) | `totals.{restaurants,live,pending,orders}`, `recentActivity[]` |

One gap in the trail, not a code defect: task **10.2b-ii** mentions a
"service-area count line" on the restaurant card. The card shows
`location_text` only — the list endpoint returns no service-area data — and
the 10.2b-ii log doesn't say that count was left out. Recorded here.

**3. Governing-rule audit (no invented icons/logos/text).** SVGs on the
in-scope pages: the hourly chart (the named exception), `SearchBar`'s
search/clear icons and `RoleShell`'s nav icons (all pre-existing real
assets), the `FALLBACK_IMAGE` placeholder — and **`Home.jsx`'s `BellIcon`**
(finding below). No emoji or symbol characters in rendered copy; no
logo/mark next to any "NATRA" wordmark; the reference's tagline
("Good Food • Great Moments"), star ratings, "See All →", category icons and
stat-tile icons are all correctly absent.

**Finding 10.2z2 — Home's header has a decorative bell.** A non-functional
`aria-hidden` bell next to "Sign up", both from Task 8.7h. Task 10.2a-ii is
ticked with "confirm no 'Sign up' button or notification bell are added",
and the governing rule drops the bell. The customer reference does show
both. Owner decision needed (keep as accepted exception / drop bell / drop
both) — logged as 10.2z2.

**4. Reference comparison, per screen** (side-by-side at 390px):
- **Login:** card, orange top bar, rounded filled inputs, orange gradient
  pill, peach glow all match. Deliberate differences (rule-driven): text
  "NATRA" with no dot, "Email" label, no "Forgot password?" (no backend
  flow), existing copy kept. **Small difference not in the log:** the
  reference card is vertically centered on the phone screen; ours is
  top-aligned (`align-items: flex-start`, pre-Phase 10). Left as is; a
  one-line change if wanted.
- **Home:** header band + search, 2-column restaurant grid, category
  tiles, 3-column food grid with "+" all present. Deviations are the
  documented real-data ones (no ratings/tagline/See All/category icons).
  **Finding 10.2z — the price is truncated on phones** (below).
- **Owner Dashboard:** header, greeting, 2×2 tiles, Quick Actions,
  Sales Overview + chart, notifications all present. Card **order** differs
  from the reference and 4 quick tiles are 2-across on phones, both already
  logged (10.3d-v, 10.3h). The "Get your restaurant Live" card is kept
  deliberately (it holds the real "Request to go Live" button); its copy
  still mentions checking a request's status though that link now lives in
  the tiles (left "as-is" in 10.3d-v, "revisit in 10.3h" — never revisited).
- **Admin Dashboard:** header, greeting, 2×2 tiles, activity list with
  status pills match; the sidebar/bottom bar and the narrow-phone
  activity rows are the 10.4e/f/z work.

**Finding 10.2z — Popular Foods price truncated on phones.** Measured (px of
the price "120 ETB" that's visible; it needs 58): 320px → 13, 390px → 37
("12…"), 768px+ → all. Titles show about half at 390px ("Specia…"); restaurant
cards clip ~10px ("Test2's Resta…"). Cause: at 390px a food card is 109px,
body 77px after padding, and the 32px "+" plus gap leave the price 37px. The
reference's cards are the same ~110px but use smaller type and a ~15px "+".
Options and a recommendation are in the task (recommended: on narrow
widths, move the "+" to the photo's bottom-right corner and trim the body
padding). Not fixed — it changes how the most reference-sensitive screen
looks, so it's your call.

**Also confirmed (no action):** loading/error/empty states of both
dashboards at 320/667×375/768/1280 (10.4f); chart labels 12px at every
width (10.3z); `vite build` passes.

**Exit-check verdict:** every Phase 10 checkbox is ticked, the responsive
pass and data trace are clean, and the exit check can be called **passed
once 10.2z and 10.2z2 are decided/resolved** — until then Phase 10 has two
known, tracked gaps rather than zero.


---

**10.2z — decided (option (b)) and built.** The project owner chose to hide
the "+" on phones ("just clicking leads to the next pages" — the whole card
is already the link to `FoodDetails`; the "+" was `aria-hidden` with no
`onClick`, so nothing functional is lost).

**Built (CSS + one `className`; no new elements):**
- `EntityCard.module.css`: two opt-in hooks, both defaulting to the old
  values so every other caller is byte-for-byte unchanged —
  `--entity-card-cta-display` on `.ctaSlot` (default `block`) and
  `--entity-card-pad-x` on `.body` (default `--space-lg`). The CTA hook hides
  the *slot*, not just the "+", so its flex gap goes too.
- `Home.jsx`: `className={styles.foodCard}` on the two food `EntityCard`s
  (browse grid and search results).
- `Home.module.css`: below **520px**, `.foodCard` sets the CTA to `none` and
  the side padding to `--space-md`. 520px (not the ~420px in the task text)
  is where the "+" fits again beside even a fractional price ("130.50 ETB",
  80px): a card is (viewport − 64px)/3, so 152px there.

**One addition beyond the option as worded — say if you want it out:** the
padding trim (16→12px). Hiding the "+" alone was measured first and still
left "120 ETB" 5px short at 320px (53px column vs 58px needed). Deleting the
`--entity-card-pad-x` line in `.foodCard`'s media query undoes it.

**Verified (real render, API mocked), visible/needed px of the price:**
whole-number prices ("120/150/50 ETB") now fit in full at every width tested
(320, 360, 390, 414, 479, 519, 520, 600, 768, 1280); the "+" returns exactly
at 520px. Fractional "130.50 ETB" (80px) fits from 390px up; at 320px it
shows 61px and at 360px 75px — an edge (whole-birr prices are the norm), not
fixed. Card padding checked in computed styles: food cards 12px below 520px,
16px above; restaurant cards 16px at every width (untouched). Home matrix
re-run at 7 viewports: no overflow/escaping/clipping. Food-card *titles*
still ellipsize on phones ("Special…" at 390px) — unchanged; the reference
uses smaller type there.

`docs/TASKS.md`: 10.2z ticked. **Only 10.2z2 (Home's decorative bell) is
still open**; the exit check can be called passed once that's decided.


---

**10.2z2 — decided (option (b): drop the bell) and built. Phase 10 exit
check: passed.**

**Built:** `Home.jsx` — `BellIcon` (the function and its one use) deleted,
and the `.headerActions` wrapper that only existed to group "Sign up" with
the bell deleted with it, so the button is now a direct child of
`.brandRow` (`space-between` puts it opposite the wordmark). `Home.module.css`
— `.bellIcon` and `.headerActions` removed. Doc comments that described the
bell as a deliberate visual match were rewritten to say it was removed in
10.2z2 (the header note, the 10.2a-ii note, the 8.7g `.brandName` note).
Kept: "Sign up" (a real link to `/owner/register`) and `SearchBar`'s own
search icon.

**Verified (real render):** Home header at 320, 390 and 1280px — "Sign up"
84×44px (still ≥44px tall), right edge lined up with the search bar's, no
overflow, wordmark unaffected; the header now holds exactly one SVG (the
search icon, down from two). `vite build` passes.

**Final exit-check tally (after 10.2z and 10.2z2):** 5 screens × 7
viewports = 35 renders — no page overflow, no escaping elements, no
clipped text, no over-wide images (7 of the 35 flag only the visually
hidden `.srOnly` "Unread:" label on `OwnerDashboard`, which is intentional);
admin matrix from 10.4f re-run: 48/48. Every data-bearing element traced
to a real route and field (table in the exit-check entry above); the only
non-real icon found (the bell) is gone. Every Phase 10 checkbox in
`docs/TASKS.md` is ticked apart from the struck-through, dropped 10.0f.

**Deviation from the reference, now on the record:** the customer Home
reference shows a bell; the app doesn't, by the owner's decision, because
customers have no notifications for it to open. (The reference also shows a
tagline, star ratings, "See All →" and category icons, all long absent for
the same real-data reason.)

**Still-open non-task notes** (each documented above, none blocking):
login card top-aligned vs. vertically centered in the reference;
`SearchBar`'s 18px `<input>` inside a 36px pill; the Owner Dashboard's
"Get your restaurant Live" card copy that still mentions checking status
after that link moved into the tiles; Owner Dashboard card order and the
2-across quick tiles on phones (logged in 10.3d-v/10.3h); fractional prices
("130.50 ETB") still clipped at 320–360px on Home food cards.

---

**Phase 10 scope extended: `10.5` (Owner Restaurant) added, project
owner request.** The exit check just above closed out the 4 pages that
were in scope at the time (Login, Customer Home, Owner Dashboard, Admin
Dashboard) — it was correct when written, not superseded by anything
missed. After it ran, the project owner asked for a fifth page,
`OwnerRestaurant.jsx`, against the newly-supplied
`docs/reference_ui/phase10_owner_restaurant_reference.jpg`. Per the
roadmap's own "reference-driven, not guessed" rule, `docs/UI_REDESIGN_ROADMAP.md`
got a full feasibility-findings pass against the real current file (own
"Owner Restaurant" section, checked against all 1,345 lines of
Tasks 5.2–5.8) before any task was split or built — every section the
reference shows already exists and is wired to a real endpoint; this is
a restyle, same as the other four. Two items needed a project-owner
decision before building (the Description character counter, and the
top bar's search/bell/avatar) — both resolved in the roadmap doc, so
`docs/TASKS.md`'s new `10.5` list (`10.5a-i` through `10.5i`) has no
open decisions blocking it. Next: **10.5a-i** — cover-photo hero layout
shell.

---

**10.5a-i — cover-photo hero layout shell, `OwnerRestaurant.jsx`.** Per
the roadmap's own finding for this section: real field (`cover_url`,
Task 5.3), restyle only — no new upload logic, no new state. Today's
Cover photo `ImageUploadField` (labeled block, fixed 240px preview,
separate "Change image" button underneath) becomes a full-width hero
photo with the button overlaid on its bottom-right corner, matching the
reference; the Logo field, restaurant name/tagline, and the Open/Closed
badge+toggle are deliberately untouched here — those are 10.5a-ii
through 10.5a-iv's own tasks, named in this task's own "no logo/name/
status content yet" scope.

**Built as an additive, opt-in extension to the shared `ImageUploadField`
component, not a one-off markup fork in this page** — same "component
owns the hook, caller owns the CSS" split `EntityCard`'s own
`mediaAspectRatio`/`mediaClassName`-shaped props already established for
Task 10.2, chosen over duplicating this component's upload/compression/
error-state logic (`compressImage`, the hidden real `<input>`, the
processing/disabled states) into `OwnerRestaurant.jsx` by hand. New
props, all defaulted so every pre-existing call site (Logo here,
`AddFood.jsx`'s food photo, `PaymentScreenshot.jsx`, `RequestLive.jsx`)
renders byte-for-byte unchanged:
- `overlay` (bool) — switches the preview box from the capped 240px
  square to a full-width box (sizing controlled by the caller's own
  `mediaClassName`, not a new fixed default) and moves the button inside
  it as an absolutely-positioned pill instead of a separate element
  below; the field's own visible `<label>` becomes screen-reader-only
  text in this mode (new `.srOnly` class, same shape as
  `RoleShell.module.css`'s/`OwnerDashboard.module.css`'s own `.srOnly`,
  Tasks 8.2h/10.3f-i) — the reference shows no separate "Cover photo"
  caption, just the photo itself.
- `mediaClassName` — merged onto the preview box only in overlay mode,
  so the page controls the hero's actual size. `OwnerRestaurant.module.css`'s
  new `.coverHero` sets `aspect-ratio: 21 / 5`, measured (not guessed)
  from the reference image's own hero crop (~597×140px there); kept as a
  ratio rather than `RestaurantProfile.module.css`'s own fixed
  `height: 200px` precedent, since that screen's cover has no
  page-width cap to scale against the way this one's 640px-capped
  `.page` does — a fixed height would read squat at 320px and
  disproportionately tall at 640px, where a ratio holds the reference's
  own proportion at every width.
- `chooseLabel`/`changeLabel` — override the default "Choose image"/
  "Change image" copy so this call site can show the reference's own
  real "Add cover photo"/"Change cover photo" wording instead.

**Touch target:** the reference's own overlay button reads visually
smaller than 44px, but `.buttonOverlay` sets `min-height: 44px` anyway —
consistent with every other icon-less actionable control this project's
own Task 8.9a/8.9a2 pass already brought to that floor, not reopening
that decision for one new button. Checked against the hero's own
worst-case height (320px viewport → 288px `.page` column →
~69px-tall hero at the 21:5 ratio): the button's 44px plus `space-sm`
padding on both sides (16px total) fits inside that with ~9px to spare,
so the overlay is never taller than the photo behind it even at the
narrowest supported width — full reasoning left as a comment on
`.coverHero` itself, not just here.

**No icon** on the overlay button (a camera glyph, as the reference
shows) — no such asset exists anywhere in this codebase, same "real
assets only, never invented" rule every other Phase 10 task has already
followed (10.2c-i's icon-less category tiles, 10.3d-ii/iii/iv's
icon-less quick-action tiles). Text-only, translucent-dark-pill
treatment carries the same affordance instead.

**Dropped, not carried over:** the old field's resting helper caption
("Shown at the top of your public restaurant profile.") — the hero
placement now *is* that "top of your profile" position, so the sentence
would only restate what's visually obvious; the reference itself shows
no caption under the hero. The real "Uploading…" state and a real
upload error still render below the hero exactly as before (`coverError`/
`coverUploading` are unchanged) — only the resting, non-error caption
was dropped.

**Verification:** no npm-registry access this session and no
`node_modules` in this checkout (this sandbox's network is disabled for
the container, not just a registry 403 this time — confirmed, not
assumed) — no real build/render was possible, same standing gap as
every prior no-npm-access session since Task 2.10. Verified via manual
re-read of all four edited files (`ImageUploadField.jsx`/`.module.css`,
`OwnerRestaurant.jsx`/`.module.css`) plus a brace/paren-balance check
(`ImageUploadField.jsx` 55/55 braces, 83/83 parens; `OwnerRestaurant.jsx`
410/410 braces, 471/471 parens) — not a rendered/screenshotted check.
The formal 4-breakpoint responsive pass for this whole page is its own
later task (`10.5i`), same "layout shell now, verification pass at the
end" split every other 10.x page has used.

`docs/TASKS.md`'s 10.5a-i checkbox ticked. Next: **10.5a-ii** — logo
badge, overlapping the cover photo's bottom-left corner (same
`logo_url` field/upload control, repositioned — not a new field).

---

**10.5a-ii — logo badge overlapping the cover photo, `OwnerRestaurant.jsx`.**
Real field (`logo_url`, Task 5.3), same `handleLogoChange`/`logoUploading`/
`logoError` as before — a layout/restyle of the existing Logo upload, no new
upload logic and no new field. The old standalone Logo block (labeled field,
4:3 preview, separate "Change image" button, helper caption) is gone; a
rounded-square badge now straddles the cover's bottom-left edge, per
`docs/reference_ui/phase10_owner_restaurant_reference.jpg`.

**Built as a second additive, opt-in mode on `ImageUploadField`**, same
approach 10.5a-i took for `overlay`. New props, all defaulted:
- `badge` (bool) — a compact square tile in which the *whole tile is the
  upload button*. Empty state: the `chooseLabel` text ("Add logo") fills the
  tile. With an image: the image plus a short bottom caption.
- `badgeCaption` — the short visible caption (default: `changeLabel`).
  Separate from the accessible name because "Change logo" measured ~82px at
  the 12px caption size against ~66px of room on the smallest badge; it
  wrapped and covered half the logo. The page passes `changeLabel="Edit logo"`
  (accessible name) with `badgeCaption="Edit"` (visible), so the visible text
  stays inside the accessible name (WCAG 2.5.3). While client-side
  compression runs the tile says "Wait…" (~72px "Processing…" would break
  mid-word in ~66px).
- `messageId` — when set, the field renders no error/helper `<p>` itself; the
  caller renders it under that id and the field still wires
  `aria-describedby`/`aria-invalid` to it.

**Layout.** The badge sits in its own `.identityRow` *after* the cover and is
pulled up by half its own height with a negative margin, rather than being
absolutely positioned inside the cover: the cover's `overflow: hidden` (needed
to round its photo) would clip a badge hanging below it. `position: relative;
z-index: 1` on the badge is required — the cover preview is positioned, so it
would otherwise paint over the badge. Size is `--logo-badge-size:
clamp(72px, 17%, 96px)`: 17% is the reference's own ratio (~95px in a ~560px
hero), the 72px floor keeps the tile a real tap target with a legible caption
at 320px, the 96px cap matches the reference. Both `width` and `margin-top`
read that one variable, and CSS percentages for a flex item's width and margin
resolve against the same container width, so the overlap stays exactly 50% at
every width (measured, below). `.identityRow` is a flex row so 10.5a-iii/iv's
name/tagline/status block slots in beside the badge. `.imageFields` (its only
use was the removed block) is deleted.

**Two changes beyond the literal task, found in the real render:**
1. *Messages moved.* Because the badge hangs over the area under the cover,
   neither field can host its own message (it would be overlapped, or wrap in
   an ~80px column). Both fields' upload/error text is now rendered by the
   page in `.heroMessages`, under the badge row. Side by side, two raw server
   errors were indistinguishable (previously position did that job), so the
   wording is now "Uploading cover photo…" / "Uploading logo…" and errors are
   prefixed "Cover photo: …" / "Logo: …". This also gives a screen reader the
   field context it would otherwise lose.
2. *Resting helper captions dropped* — the cover's "Shown at the top of your
   public restaurant profile." (already dropped in 10.5a-i) and the logo's
   "Shown on your restaurant card and profile." The reference shows no text
   under the hero, and the placement now says the same thing.

**Deviation from the reference, on the record:** the reference badge shows no
edit control. This tile is now the *only* way to change the logo, so it keeps a
visible text cue ("Edit" / "Add logo"); an unlabeled badge would have silently
removed a real capability. Text only — no camera icon (none exists in the
codebase, same rule as every other Phase 10 task).

**Verification — a real render this time.** Unlike 10.5a-i (no network, no
`node_modules`), this session could `npm ci` and run headless Chromium, so this
was checked in a real browser with the API mocked at the network layer:
- `vite build` passes after the final edit.
- Geometry at 320/360/390/768/1024/1280/1920 and 667×375 landscape, plus 14
  in-between widths (330–720) where the clamp transitions: badge is square,
  overlaps the cover by exactly 50% at every width (72px→96px, scaling
  smoothly), inset 16px, never above the cover's top edge (tightest case:
  320px, 69px cover), never within the "Change cover photo" pill, ≥8px clear of
  the form (24px in practice), no page-level horizontal overflow, caption on
  one line and unclipped, all tap targets ≥44px. 0 problems in 22 widths.
- Behavior, 20/20: empty state; clicking the badge opens the file chooser; a
  full upload → PATCH → badge shows the new image and clears the message;
  in-flight state (badge disabled, "Uploading logo…", `aria-describedby`
  pointing at the page-rendered message, no duplicate message from the field);
  a failed upload (`role="alert"`, `aria-invalid`, text clear of the badge at
  320px); both errors at once; visible keyboard focus ring.
- **Regression:** the original `ImageUploadField` (from the 10.5a-i zip) and
  the new one were rendered through React's server renderer with identical
  props and their HTML diffed after normalizing CSS-module hashes: all 6
  default-mode and 10.5a-i overlay-mode cases are byte-identical, so
  `AddFood`, `PaymentScreenshot` and `RequestLive` are unaffected. (Checked
  that the diff isn't blind: the new `badge`/`messageId` paths do differ.)

**Not verified / still open:** no `eslint` config exists in this checkout
(`npx eslint src` finds none), so lint wasn't run — pre-existing, not touched.
The mocked API means real backend upload responses weren't exercised (the
error shape used matches `backend/src/app.js`'s `{ error: "..." }`). At 320px
the hero is only ~69px tall (a 10.5a-i consequence of the 21:5 ratio); the
72px badge fits but nearly equals it. The Open/Closed row still sits *above*
the cover — that is 10.5a-iv's to move, deliberately untouched here. The
formal all-states 4-breakpoint pass for the whole page remains 10.5i.

`docs/TASKS.md`'s 10.5a-ii checkbox ticked. Next: **10.5a-iii** — restaurant
name as a large heading beside/below the badge, plus a one-line description
preview under it (real `description`, with a real empty fallback).

---

## Task 10.5a-iii — Owner Restaurant: name heading + description preview (2026-09-21)

Added the restaurant name (large heading) and a one-line `description`
preview into `.identityRow`, beside the logo badge — the block that row's
own 10.5a-ii comment (`.logoBadge`'s `flex: 0 0 auto`) was already reserving
space for.

- New `.identityText` wrapper (`flex: 1 1 auto; min-width: 0`) sits next to
  `.logoBadge` inside the existing `.identityRow`. No negative margin like
  the badge, so it starts at the row's own top edge, under the cover — not
  pulled up over the photo.
- `.restaurantName` — real `data.restaurant.name`, `--font-size-heading` /
  `--font-weight-bold`, same treatment `Greeting.module.css`'s `.headline`
  already uses for "large heading" elsewhere in Phase 10.
- `.descriptionPreview` — real `data.restaurant.description`, trimmed.
  One-line clamp via plain `overflow: hidden; white-space: nowrap;
  text-overflow: ellipsis` — no JS truncation needed, since normal CSS
  whitespace collapsing already folds a multi-line description's own
  newlines into single spaces before the clamp ever sees them.
- Real empty-description fallback (roadmap's own requirement): "Add a
  description below to tell customers about your restaurant." — a prompt
  pointing at the real Description field in the form below, not an
  invented placeholder tagline. Same size/color/line-height as the
  non-empty preview so the row's height doesn't jump between the two
  states.

**One addition beyond the literal task:** gave `.restaurantName` the same
one-line ellipsis clamp as the description, rather than letting long names
wrap. This column is only ever as wide as the row minus the fixed-size
badge, so an unclamped name could wrap to a second line and push the
description down by an inconsistent amount from one restaurant to the
next; clamping keeps the hero's height predictable the way the description
preview already does.

**Not changed here, deliberately:** the Open/Closed `StatusBadge` +
`ToggleSwitch` row still sits above the hero in its current
`.openToggleRow` position — moving it beside the name is 10.5a-iv's own
task.

**Not verified this session:** no `node_modules`/network in this
container (`npm install`/`npx eslint` both fail — `403 Forbidden` against
the registry), so no `vite build`, lint, or real-browser render was run.
Checked by hand instead: JSX braces/tags balanced around the edited hero
block, `styles.identityText`/`.restaurantName`/`.descriptionPreview`/
`.descriptionPreviewEmpty` all defined and only used once each, no other
call site references the fields touched. The formal all-states,
all-breakpoint render (10.5i) and this task's own device-size check are
still outstanding, same gap the 10.5a-ii entry already flagged for its own
session.

`docs/TASKS.md`'s 10.5a-iii checkbox ticked. Next: **10.5a-iv** — move the
Open/Closed `StatusBadge` + "Customers can order from you right now"
toggle to sit beside the name/description block, under the hero.

---

## Task 10.5a-iv-i — Owner Restaurant: move StatusBadge into the hero (2026-09-21)

10.5a-iv was split into two (see `docs/TASKS.md`'s note above 10.5a-iv-i):
this task moves only the `StatusBadge` (Open/Closed) itself down into the
hero, beside the restaurant name; the `ToggleSwitch` and its explanatory
sentence stay in `.openToggleRow` above the hero for now — that's
10.5a-iv-ii.

- New `.nameRow` (`OwnerRestaurant.module.css`) wraps `.restaurantName`
  and `StatusBadge` in a flex row inside `.identityText`, so the pill
  sits right next to the (possibly-truncated) name rather than in its
  old spot above the hero.
- `StatusBadge` is passed `className={styles.nameBadge}` (`flex: 0 0
  auto`) — needed because `StatusBadge` renders `display: inline-flex`
  internally, which would otherwise default to `flex-shrink: 1` once
  it's a flex child of `.nameRow` and get squeezed next to a long name.
  `.restaurantName` itself gained `flex: 1 1 auto; min-width: 0` so its
  existing one-line ellipsis is what absorbs a narrow column instead.
- `.openToggleRow` no longer renders `StatusBadge` or the now-removed
  `.openToggleStatus` wrapper — just `.openToggleHint` (unchanged text)
  and `ToggleSwitch`. `.openToggleStatus`'s CSS rule was deleted as
  dead code, and the row's own sizing comment was updated to reflect
  one fewer element sharing its 320px-width budget (still comfortably
  inside it).
- Same real `is_open`-derived value both places (`data.restaurant.is_open
  ? 'Open' : 'Closed'`) — no new field, no new state, no change to
  `handleOpenToggle`/`mutate`.

**Not verified this session:** no `node_modules`/network in this
container (`npm install`/`npx eslint`/`npx esbuild` all fail — `403
Forbidden` against the registry), so no `vite build`, lint, or
real-browser render was run — the same standing gap 10.5a-iii's own
entry flagged. Checked instead: the edited `.jsx` parses cleanly under
TypeScript's own JSX-aware transpiler (`ts.transpileModule`, 0
diagnostics) rather than just hand-counting braces; the `.css` file's
braces balance; every renamed/added class (`nameRow`, `nameBadge`) is
defined exactly once and used exactly once; `openToggleStatus` has no
remaining references anywhere in either file. No layout was measured in
a real browser, so `.nameRow`'s wrapping behavior at 320px with a long
name + "Open"/"Closed" pill is unconfirmed by eye — that's covered by
10.5a-iv-ii's own re-verification (once the toggle joins it) and the
formal all-states pass, 10.5i.

`docs/TASKS.md`'s 10.5a-iv-i checkbox ticked. Next: **10.5a-iv-ii** —
move the `ToggleSwitch` (and its hint sentence) out of `.openToggleRow`
to sit next to the now-relocated `StatusBadge`, confirming the existing
immediate-commit `is_open` update still fires correctly from the new
position, then remove `.openToggleRow` once it's empty.

---

## Task 10.5a-iv-ii — Owner Restaurant: move ToggleSwitch into the hero, remove `.openToggleRow` (2026-09-21)

Second half of the 10.5a-iv split: the `ToggleSwitch` and its hint
sentence move out of the standalone `.openToggleRow` card (above the
hero) down into `.identityText`, as a new `.statusRow` directly under
`.nameRow` (name + `StatusBadge`, moved there by 10.5a-iv-i). With both
elements gone, `.openToggleRow` has nothing left in it and is removed
entirely — JSX and CSS.

- `.statusRow` (`OwnerRestaurant.module.css`) holds `.statusHint` (the
  same real `is_open`-derived sentence, unchanged text) and
  `ToggleSwitch`, `justify-content: space-between` + `flex-wrap: wrap`ping
  the same way `.openToggleRow` did — same failure mode being guarded
  against (unbreakable hint text next to a fixed ~95px toggle
  min-content), just in `.identityText`'s narrower column instead of the
  page's full width.
- No new state, no new handler: `ToggleSwitch` still calls the existing
  `handleOpenToggle`, still reads `data.restaurant.is_open`/`saving` from
  the same component scope — moving its JSX position doesn't touch any
  of that, so the immediate-commit behavior (fires on flip, no Save
  click, `saveError` banner on failure, toggle reflects the re-fetched
  `data.restaurant.is_open` rather than an optimistic flip) is
  unchanged.
- `.openToggleRow`/`.openToggleHint` CSS rules deleted; their JSX block
  (the standalone card above `.hero`) removed. Surrounding comments in
  both files (on `.identityRow`, `.nameBadge`, and the hero's own header
  comment) updated to stop describing 10.5a-iv-ii as upcoming.

**Not verified this session:** no `node_modules`/network in this
container (`npm ping` → 403 Forbidden), so no `vite build`, lint, or
real-browser render — the same standing gap every 10.5a-* entry has
flagged. Checked instead: the edited `.jsx` parses cleanly under
TypeScript's own JSX-aware transpiler (`ts.transpileModule`, 0
diagnostics); the `.css` file's braces balance (48/48); `statusRow`/
`statusHint` are each defined once and used once; no remaining live
reference to `openToggleRow`/`openToggleHint` in either file (only
historical prose in unrelated comments). No layout was measured in a
real browser, so `.statusRow`'s wrapping behavior at 320px (hint text +
toggle, inside the hero's narrower column) is unconfirmed by eye —
covered by the formal all-states pass, 10.5i.

`docs/TASKS.md`'s 10.5a-iv-ii checkbox ticked, closing out 10.5a-iv.
Next: **10.5b-i** — restyle the Restaurant name + Description form
fields into the new card treatment (rounded card, restyled `Save
changes` button, existing save-error/"Saved" states carried over
unchanged).


---

## Task 10.5b-i — Owner Restaurant: name + Description form card (2026-09-21)

Restyled the profile form (Restaurant name + Description + `Save changes`)
into the card treatment the other Phase 10 panels already use, per
`docs/reference_ui/phase10_owner_restaurant_reference.jpg`. Pure restyle —
same `<form>`, same two `FormField`s, same `handleSubmit`, same
`saveError`/`justSaved` states and copy; no state, data or handler touched.

- `.form` (`OwnerRestaurant.module.css`) is now a card: `--color-surface`
  fill, 1px `--color-border`, `--radius-md`, `--shadow-card`, `--space-lg`
  padding (same recipe as `OwnerDashboard`'s `.card`), plus
  `box-sizing: border-box` / `min-width: 0` so it can't be held open by a
  long field value. No bottom margin — the following `.section` already
  carries `margin-top: var(--space-xl)`, so the gap down to Categories is
  unchanged (its `border-top` divider stays until 10.5c-i).
- `Save changes` uses a new `.saveButton` class: `--radius-pill`, explicit
  `min-height: 44px`, wider horizontal padding, flat `--color-primary`
  fill, same `:active`/`:disabled` colors as before. **Deliberately not an
  edit to `.submitButton`** — that class is also the Save button in the
  Category / Service area / Payment method modal footers (three other
  call sites), which belong to 10.5c–10.5f. The one JSX change is
  `styles.submitButton` -> `styles.saveButton` on this form's button.
- Per the project owner's 10.5b-ii decision, no character counter was added
  and Description stays uncapped; that sub-task is otherwise still open.

**Bug found and fixed (not part of this task's scope, but it blocked
verifying it):** `OwnerRestaurant.jsx` computed
`const restaurantDescription = data.restaurant.description ? … : ''`
unconditionally on every render (added by 10.5a-iii). While the initial
request is in flight `data` is `null`, so the page threw `Cannot read
properties of null (reading 'restaurant')` and white-screened before the
Loading / error / no-restaurant states could ever show. Fixed with optional
chaining (`data?.restaurant?.description`), one expression, comment added
at the site. Every 10.5a-* entry above flagged that no browser was
available; this is the kind of thing that gap hid.

**Verification (real, this session):** `npm ci` worked this time, so unlike
the 10.5a-* sessions this was built and rendered rather than hand-checked.
- `vite build` passes (208 modules). `npm run lint` could not be run: the
  zip contains no ESLint config (dotfiles such as `.eslintrc*` weren't
  included), so ESLint exits with "couldn't find a configuration file".
- Rendered the production build in headless Chromium (Playwright) with the
  API mocked, at 320 / 390 / 768 / 1280px, in default, "Saved." and
  save-error states: no horizontal overflow at any width
  (`scrollWidth == innerWidth`), card 288px wide at 320px (fields ~254px),
  button exactly 44px tall with pill radius, card radius/shadow/padding as
  specified, error and success banners intact inside the card.
- After the null fix, the page's load-error ("Couldn't load your
  restaurant" + Retry), no-restaurant (403) and Loading… states all render
  with no page errors.
- Not covered: 1024/1920 and short-landscape widths, real backend data
  (mock data only, no cover/logo images), and the sections below the form
  — those belong to the formal pass, 10.5i.

`docs/TASKS.md`'s 10.5b-i checkbox ticked. Next: **10.5b-ii** — the
Description field with no counter and no client-side `maxLength` (project
owner's decision, option (b)); check what, if anything, is left to build
there beyond what 10.5b-i's restyle already covers.

---

## Task 10.5b-ii — Owner Restaurant: Description field, no counter/no cap (2026-09-21)

Verification-only task, no code change. 10.5b-i's restyle already left the
Description `FormField` exactly as the project owner's option (b) decision
requires — checked both directions before closing this out rather than
assuming the earlier session's note was still accurate:

- `OwnerRestaurant.jsx`'s Description `FormField` (the one below Restaurant
  name in `.form`) passes no `maxLength` prop at all — confirmed by reading
  the JSX directly, not just trusting 10.5b-i's log entry. It's the only
  `FormField` in this file without one; every other text field (`name`,
  category/area/payment-method fields) has its own `*_MAX_LENGTH` constant
  from `docs/DB_SCHEMA.md`, deliberately not extended to `description`
  since (per the project owner) that column has no real DB cap to mirror.
- `FormField.jsx` itself has no character-counter rendering of any
  kind — no count of `value.length`, no "x/y" text, nothing gated on
  `maxLength` being present or absent. So there was no shared-component
  behavior to suppress either; a counter would have had to be added new,
  and 10.5b-i never added one.
- Grepped `OwnerRestaurant.jsx` and `OwnerRestaurant.module.css` for
  `count`/`/500`/`charCount`/`maxLength` — the only `description`-adjacent
  hits are the unrelated `*_MAX_LENGTH` constants for the other fields
  above and `EmptyState`'s own `description` prop (a different, unrelated
  "description" — component copy, not the restaurant column).
- `npm ci` + `vite build` both still pass (208 modules) with no changes
  made, confirming the existing build already reflects this state.

Nothing to build. `docs/TASKS.md`'s 10.5b-ii checkbox ticked on that basis.
Next: **10.5c-i** — Categories card icon+title+"Add category" header
restyle, matching the `10.3d`/`10.4c` panel-header treatment.

---

## Task 10.5c-i-a — Owner Restaurant: `.sectionCard` shell on Categories (2026-09-21)

First of the 56 small tasks 10.5c-i … 10.5i were split into (the split itself
is now in `docs/TASKS.md`; see the note under 10.5c-i there). Gives the
**Categories** section the same card treatment 10.5b-i gave the profile form,
per `docs/reference_ui/phase10_owner_restaurant_reference.jpg`. Shell only: no
header re-layout (10.5c-i-b), no button restyle (10.5c-i-c), no row/chip work
(10.5c-ii-*).

- `OwnerRestaurant.module.css`: new `.sectionCard` (`--color-surface` fill,
  1px `--color-border`, `--radius-md`, `--shadow-card`, `--space-lg` padding,
  `box-sizing: border-box`, `min-width: 0`, `margin-top: var(--space-xl)`) —
  the same recipe as `.form` / `OwnerDashboard`'s `.card`.
- `OwnerRestaurant.jsx`: the Categories `<section>` uses `styles.sectionCard`.
  That is the only JSX change (plus a comment).
- **New class, not an edit to `.section`**: `.section` still wraps Opening
  hours, Service areas and Payment methods until 10.5d-i-a / 10.5e-i-a /
  10.5f-i-a move them over; 10.5f-iii deletes it. The old `border-top` +
  `padding-top` divider is not carried onto the card (its border replaces
  it). `margin-top` matches `.section`'s, so the gap from the form card is
  unchanged.
- Expected, temporary: Opening hours still draws its own `.section` divider
  line right under the Categories card until 10.5d-i-a; and each category row
  (still `.listRow`, bordered) now sits as a bordered box inside a bordered
  card until 10.5c-ii restyles it into a chip.

**Verification (real, this session):** `npm ci` + `vite build` pass. Rendered
the production build in headless Chromium with the API mocked, once for this
change and once for a pristine build of the uploaded zip, at 320 / 390 / 768 /
1024 / 1280 / 1920 and 667x375 landscape, in populated / empty / load-error /
multi-page / long-name states (35 renders):
- Card computed style at every width: white fill, 1px border, 12px radius,
  shadow, 16px padding on all sides. Same left edge and width as the profile
  form card at every width (288px at 320, 358px at 390, 608px from 768).
- Gap from the form card to the Categories card: exactly 24px, as before.
- No page-level horizontal overflow at any width in populated, empty, error
  and paged states; no page errors.
- Before/after: the form card's rect and style, and the other three
  sections' left edge, width and style, are identical to the original build at
  every width (Opening hours / Service areas / Payment methods are untouched).
  Categories itself grows 9px in height (25px of old top border+padding
  replaced by 34px of card border+padding).
- Not run: `npm run lint` (no ESLint config in the zip, as in 10.5b-i); the
  card's own header/rows/states are still being restyled, so the full
  every-state pass stays with 10.5i.

**Flag (pre-existing, not introduced here; not fixed, per the roadmap's
"flag, don't silently fix" rule): a category name that is one very long
unbreakable word overflows the page at 320px.** `.listRowName` has no wrap
rule and `.listRow` cannot shrink, so a ~34-character single word (tested:
"Supercalifragilisticexpialidocious-and-extraordinarily-long-…") makes the
page 357px wide in the *original* build. This task makes that case 17px worse
(374px) because the card's border + side padding push the row in by 17px.
Normal names, and long names with spaces, wrap and are unaffected at every
width. The fix is a one-line wrap rule and belongs to **10.5c-ii-a** ("long
names wrap, never truncate"), which is now worded to include it. Service
areas uses the same `.listRowName` class, so it very likely has the same gap
(not tested here) — check it in 10.5e-ii-a; Payment methods' name/account
lines are likewise untested and should be checked in 10.5f-ii-b.

`docs/TASKS.md`'s 10.5c-i-a checkbox ticked. Next: **10.5c-i-b** — Categories
header row (title left, action right, both wrap, no icon).

---

## Task 10.5c-i-b — Owner Restaurant: section-heading typography (2026-09-21)

Heading typography only, no icon (per the task's own wording and the split
note's "icons decision" above `.sectionCard`) — brings `.sectionHeading` in
line with the same title convention `OwnerDashboard.module.css`'s /
`AdminDashboard.module.css`'s own `.cardTitle` already established for
every one of *their* card headers (`font-size-title`/16px +
`font-weight-semibold`/600), replacing this page's own previous
`font-size-body`/14px + `font-weight-bold`/700. That reading of "same
panel-header treatment 10.3d/10.4c already established" is `.cardTitle`
itself, not `QuickActionTile`'s/`StatTile`'s own tile-label styles — those
are centered, tinted tile labels for a different shape of element (a
tappable tile, not a section heading), not a left-aligned card-header
convention; `.cardTitle` is the actual card-header precedent 10.3d-v's own
"Quick actions" heading and every `AdminDashboard` card heading already use.

- `OwnerRestaurant.module.css`: `.sectionHeading`'s `font-size`/`font-weight`
  only. Color and margin unchanged.
- No JSX change and no layout change: `.sectionHeader`'s flex row (heading
  left, action right, `justify-content: space-between`, no `white-space:
  nowrap` on either child) already does "title left, action slot right,
  both wrap" — Task 8.2d-ii already verified that shape at all 4 breakpoints.
  This task's own job was the heading's type size/weight, not its layout.
- **Applies to all four section headings at once, not just Categories.**
  `.sectionHeading` is shared by all four `<h2 className={styles.
  sectionHeading}>` call sites (Categories/Opening hours/Service
  areas/Payment methods) and is deliberately **not** in the split note's
  "new class per section, don't touch the shared one" list
  (`.section`/`.addButton`/`.linkButton`) — unlike a card shell or a
  button, a heading's type size has no reason to differ section-to-section,
  so waiting for each section's own later migration task would just mean
  three headings sitting in the *old* type size for no benefit. The other
  three sections keep every other part of today's look (the `.section`
  divider, `.addButton`'s square outline button) until their own tasks —
  only the font changed early, everywhere it's used.

**Verification:** no npm-registry access this session (`npm ci` returns
`403 Forbidden` from `registry.npmjs.org` — confirmed by trying it, not
assumed) and no `node_modules` in this checkout, so no real build/render
was possible — same standing gap as most sessions since Task 2.10 (10.5c-i-a's
own headless-Chromium verification was a different session with registry
access; not available here). Verified via manual re-read of the one changed
file, plus a re-check (not just a carried-over assumption) of the wrap
budget 8.2d-ii's own comment gives for the longest pairing, "Payment
methods" + "Add payment method": going from 14px/700 to 16px/600 is a small,
partially-offsetting change (larger size, lighter weight) to each word's own
min-content width, nowhere near enough to close a gap that started at
~165px combined against a ~250px available budget (262px column at 320px,
less `space-md`) — the wrap behavior 8.2d-ii verified still holds; this
isn't a rendered re-check of it.

**Not touched, on purpose:** the icon slot (dropped per the split note's
already-made icon decision — no per-section icon exists anywhere in the
codebase to draw from) and the "Add category" button's own shape
(`.addButton`'s square outline treatment stays until `.addPill` replaces
it, 10.5c-i-c).

`docs/TASKS.md`'s 10.5c-i-b checkbox ticked. Next: **10.5c-i-c** — new
`.addPill` class (outlined orange pill, 44px min-height), applied to "Add
category" only.

---

## Task 10.5c-i-c — Owner Restaurant: `.addPill` on "Add category" (2026-09-21)

Third and last piece of 10.5c-i. Gives the Categories header's action the
outlined orange pill the reference draws
(`docs/reference_ui/phase10_owner_restaurant_reference.jpg`). Button only: no
row/chip work (10.5c-ii-*), and no change to Service areas or Payment methods.

- `OwnerRestaurant.module.css`: new `.addPill`, placed right after
  `.addButton`. Same font (12px / 600), orange text and 1px orange outline, no
  fill as `.addButton`; what changes is the shape — `--radius-pill` instead of
  `--radius-md` — and the tap height: an explicit `min-height: 44px` (the same
  touch-target floor `.saveButton` and `.linkButton` use) with `inline-flex`
  centering, `padding: --space-sm --space-lg`, `text-align: center`.
  `:active` swaps text + outline to `--color-primary-pressed`, the same press
  cue `.saveButton` has. No `white-space: nowrap`, so the label may wrap
  instead of pushing `.sectionHeader` wider (Task 8.2d-ii's finding).
- `OwnerRestaurant.jsx`: the Categories "Add category" button uses
  `styles.addPill`. That is the only JSX change (plus a comment). `onClick`,
  label and `type` are untouched.
- **New class, not an edit to `.addButton`**, same reasoning 10.5b-i and
  10.5c-i-a used: `.addButton` still styles "Add area" and "Add payment
  method" until 10.5e-i-c / 10.5f-i-c move them onto `.addPill`; 10.5f-iii then
  deletes `.addButton`.
- **Expected side effect:** the button is 12px taller (32 → 44px), so the
  Categories header row and everything below it shifts down 12px. Nothing
  else about those elements changed (see below).
- **10.5c-i (the parent) is ticked** now that a, b and c are all done. Its
  title still says "icon+", but per the split note above `.sectionCard` the
  header is text-only (no per-category icon exists in the codebase). That
  **"Decision pending — icons" question is now resolved: the project owner
  picked option (a) — stay text-only, no code change** (2026-09-22). No new
  SVG icons will be added to the Categories/Opening hours/Service
  areas/Payment methods card headers; this applies to every remaining
  10.5-series header, not just this one.

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with the API mocked, next to a pristine build of the uploaded zip,
at 320 / 390 / 768 / 1024 / 1280 / 1920 in populated / empty / load-error /
very-long-name states (24 renders per build, no page errors):
- "Add category": 124.3 x 44px at every width (was 116.3 x 32), computed
  radius 9999px, `1px solid rgb(242,105,12)`, text `rgb(242,105,12)`,
  transparent fill, 12px / 600.
- Heading and button stay on one row at every width, including 320px (32px gap
  at 320, so no wrap was needed).
- "Add area" and "Add payment method": across all 48 comparisons they are
  identical to the original build in width, height, radius, border, color,
  font and padding. The only difference is the uniform 12px downward shift.
- No page-level horizontal overflow in any state at any width except the
  long-name state at 320px, which measures the same 54px in the original
  build — that's the known pre-existing gap 10.5c-i-a flagged, still
  owned by 10.5c-ii-a. Not touched here.
- Interaction: pressing the button opens the Add-category modal; the pressed
  state computes to `rgb(214,92,8)` (`--color-primary-pressed`); the button
  takes keyboard focus.
- Not run: `npm run lint` (no ESLint config in the zip, as in 10.5b-i /
  10.5c-i-a). The every-state pass across the whole page stays with 10.5i.

**Flag for 10.5f-i-c (not tested here):** "Add payment method" is the longest
label. In the *original* build it is 144px wide at 320px (wrapped to two lines,
46px tall), so with `.addPill` it will wrap inside a fully rounded pill at
that width. Check that it looks acceptable there rather than assuming it does.

`docs/TASKS.md`'s 10.5c-i-c and 10.5c-i checkboxes ticked. Next: **10.5c-ii-a**
— category name as a tinted rounded chip; long names wrap, never truncate
(also fixes the long-unbreakable-word overflow at 320px).

---

## Task 10.5c-ii-a — Owner Restaurant: category name as a tinted chip (2026-09-21)

First piece of 10.5c-ii (restyling the Categories list rows). Gives each
category name the peach rounded-pill treatment the reference draws
(`docs/reference_ui/phase10_owner_restaurant_reference.jpg`), replacing
the plain-text name.

- `OwnerRestaurant.module.css`: new `.categoryChip`, placed right before
  `.listRow`. **New class, not an edit to `.listRowName`** — same
  "new class per section" reasoning 10.5c-i-a/10.5c-i-c already used:
  `.listRowName` still renders Service areas' `area_name` and Payment
  methods' `method_name` as plain text until their own tasks
  (10.5e-ii-a / 10.5f-ii-b) decide their own treatment. Background/text
  pairing reuses the peach `--color-page-glow` + `--color-primary-pressed`
  pair Task 10.2d-ii's `.addCta` fix already contrast-checked (5.42:1,
  clears AA) — not a new color decision.
- `OwnerRestaurant.jsx`: the category `renderItem`'s name `<span>` swaps
  `styles.listRowName` for `styles.categoryChip`. Edit/Delete are
  untouched (`.linkButton`/`.linkButtonDanger` — that's 10.5c-ii-b).
- **Also fixes the long-unbreakable-word overflow at 320px** 10.5c-i-a's
  own log entry flagged (`.listRowName` has no wrap rule): `.categoryChip`
  adds `overflow-wrap: anywhere` (breaks a single long unbroken token
  instead of forcing `.listRow` wider than its column) plus `min-width: 0`
  (lets the chip actually shrink inside `.listRow`'s flex row — a flex
  item's default `min-width: auto` would otherwise hold it to its own
  min-content width regardless of the `overflow-wrap` rule) and
  `max-width: 100%` (caps the chip at its row once it does shrink).
- **Not touched, on purpose:** `.listRow`/`.listRowActions` themselves —
  the "chip + actions side by side when wide, wrap below when narrow"
  row layout is 10.5c-ii-c's own task, not this one. Edit/Delete link
  styling is 10.5c-ii-b's.

**Verification:** no npm-registry access this session (`npm ci` → 403,
confirmed by trying it) and no `node_modules` in this checkout, so no
real build/render was possible — same standing gap as most sessions
since Task 2.10. Verified via a brace/paren-balance check on both edited
files (`OwnerRestaurant.jsx` 440/440 braces, 495/495 parens;
`OwnerRestaurant.module.css` 56/56 braces, 273/273 parens) and a manual
re-read of both, not a rendered/screenshotted check. A real headless-
Chromium render pass (available in some earlier sessions, not this one)
would be worth running before 10.5i closes this section out, same
standing note every no-npm-access session in this file already carries.

`docs/TASKS.md`'s 10.5c-ii-a checkbox ticked. Next: **10.5c-ii-b** — Edit
/ Delete as underlined orange / red text links, ≥44px hit area, scoped
to Categories rows (`.linkButton` also serves Opening hours' Save,
Payment Edit, the menu link).

## Task 10.5c-ii-b — Owner Restaurant: Categories' Edit/Delete as scoped link classes (2026-09-21)

Second piece of 10.5c-ii. Gives the Categories row's Edit/Delete buttons
their own classes instead of the shared `.linkButton`/`.linkButtonDanger`.

- `OwnerRestaurant.module.css`: new `.categoryEditLink` and
  `.categoryDeleteLink`, placed right before `.listRow` (after
  `.categoryChip`). **New classes, not edits to `.linkButton`/
  `.linkButtonDanger`** — same "new class per section" reasoning
  `.sectionCard` (10.5c-i-a), `.addPill` (10.5c-i-c) and `.categoryChip`
  (10.5c-ii-a) already used: `.linkButton` also backs Opening hours'
  per-day Save link, Payment methods' Edit link, and the "manage your
  foods" menu link at the foot of the page — none of which this task
  restyles, so editing it in place would have restyled all three.
- Full property duplication, not `composes: linkButton`. `.linkButtonDanger`
  itself is built with `composes`, but composing here would still tie
  Categories to any future edit of `.linkButton` — the coupling this
  split exists to avoid. The duplicated properties are otherwise
  identical to `.linkButton`/`.linkButtonDanger` as they stand today:
  Task 8.9a2's 44px `min-height` tap-target fix, underlined text,
  `--color-primary` (Edit) / `--color-error` (Delete) — no new look,
  since neither the reference
  (`docs/reference_ui/phase10_owner_restaurant_reference.jpg`) nor this
  task calls for one, just an independent class to hang the existing
  look on.
- `OwnerRestaurant.jsx`: the category `renderItem`'s Edit/Delete
  `<button>`s swap `styles.linkButton`/`styles.linkButtonDanger` for
  `styles.categoryEditLink`/`styles.categoryDeleteLink`. Every other
  `.linkButton`/`.linkButtonDanger` call site (Opening hours' Save link,
  Service areas' Delete, Payment methods' Edit, the menu link) is
  untouched.
- **Not touched, on purpose:** `.listRow`/`.listRowActions` — the "chip
  + actions side by side when wide, wrap below when narrow" row layout
  is 10.5c-ii-c's own task.

**Verification:** same no-npm-access gap as every recent session in this
file (`npm ci` → 403, no `node_modules`). Verified via a brace/paren-
balance check on both edited files (`OwnerRestaurant.jsx` 441/441 braces,
496/496 parens; `OwnerRestaurant.module.css` 58/58 braces, 286/286
parens) and a manual re-read, not a rendered/screenshotted check. A real
headless-Chromium render pass would still be worth running before 10.5i
closes this section out.

`docs/TASKS.md`'s 10.5c-ii-b checkbox ticked. Next: **10.5c-ii-c** — Row
layout: chip + actions side by side when wide, actions wrap below when
narrow.

## Task 10.5c-ii-c — Owner Restaurant: Categories' row layout, wrap when narrow (2026-09-21)

Third piece of 10.5c-ii. Lets a Categories row's chip and Edit/Delete
actions wrap onto their own lines when the row is too narrow to hold
both side by side, instead of squeezing them onto one line.

- `OwnerRestaurant.module.css`: new `.categoryRow` and
  `.categoryRowActions`, placed right before `.listRow`. **New classes,
  not edits to `.listRow`/`.listRowActions`** — same "new class per
  section" reasoning `.sectionCard`/`.addPill`/`.categoryChip`/
  `.categoryEditLink`/`.categoryDeleteLink` already used: `.listRow`/
  `.listRowActions` still lay out Service areas' and Payment methods'
  rows (their own row-layout tasks are 10.5e-ii-c and 10.5f-ii-a).
- **Revisits Task 8.2d-ii's own "no `flex-wrap` needed" finding, scoped
  to Categories only.** That finding was reasoned from `.listRowName`'s
  plain text, which shrinks/wraps *within* the row so the row itself
  never needed to wrap. `.categoryChip` (10.5c-ii-a) wraps a pill around
  that text instead — cheaper to drop below the actions than to keep
  squeezing sideways against a fixed-width Edit/Delete pair. `.categoryRow`
  adds `flex-wrap: wrap` (same `space-between` + `flex-wrap` pairing
  `.openToggleRow` uses, Task 8.2d-i) so the chip and
  `.categoryRowActions` drop to separate lines instead. `.categoryRowActions`
  keeps `.listRowActions`' `flex-shrink: 0` — Edit/Delete's combined
  min-content is a real floor, not something to squeeze further.
- `OwnerRestaurant.jsx`: the category `renderItem`'s outer `<div>` and
  actions `<div>` swap `styles.listRow`/`styles.listRowActions` for
  `styles.categoryRow`/`styles.categoryRowActions`. Service areas' and
  Payment methods' rows are untouched, still on `.listRow`/
  `.listRowActions`.

**Verification:** same no-npm-access gap as every recent session
(`npm ci` → 403, no `node_modules`). Verified via a brace/paren-balance
check on both edited files (`OwnerRestaurant.jsx` 442/442 braces,
498/498 parens; `OwnerRestaurant.module.css` 60/60 braces, 297/297
parens) and a manual re-read, not a rendered/screenshotted check. A real
headless-Chromium render pass at 320px (to confirm the wrap actually
triggers where expected) would still be worth running before 10.5i
closes this section out.

`docs/TASKS.md`'s 10.5c-ii-c checkbox ticked. Next: **10.5c-ii-d** —
Inline load error ("Couldn't load categories…") restyled inside the
card, copy unchanged.

### Task 10.5c-ii-d — Categories inline load error restyle

Fourth piece of 10.5c-ii. Restyles the "Couldn't load categories…"
inline error so it sits inside the new Categories card, matching this
task's copy-unchanged rule.

- `OwnerRestaurant.jsx`: the `categoriesError` branch's `<p>` swaps
  `styles.formError` for `styles.categoryLoadError`; `role="alert"` and
  the exact copy are unchanged.
- `OwnerRestaurant.module.css`: new `.categoryLoadError` class,
  `composes: formError` — same color/size/font every other inline error
  on this page already uses, no new rules of its own. **New class, not
  an edit to `.formError`** — same "new class per section" reasoning
  `.sectionCard`/`.addPill`/`.categoryChip`/`.categoryRowActions`/
  `.categoryEditLink`/`.categoryDeleteLink` already used: `.formError`
  still serves the profile form above and Opening hours' own
  `.openingHoursError` until 10.5d-ii-a. Unlike `.openingHoursError`
  (which adds `flex: 1 0 100%` to sit inside `.openingHoursRow`'s flex
  row), this error replaces the whole `ListWithPagination` slot rather
  than sitting alongside other row content, so no extra layout rules
  were needed.

**Verification:** same no-npm-access gap as every recent session
(`npm ping` → 403). Verified via `tsc --noEmit --noResolve --jsx
react-jsx --esModuleInterop --skipLibCheck --allowJs` against the edited
`.jsx` (clean, no genuine TS1xxx errors) and a brace/paren-balance check
on both edited files (`OwnerRestaurant.jsx` 442/442 braces, 499/499
parens; `OwnerRestaurant.module.css` 61/61 braces, 299/299 parens), plus
a manual re-read — not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.5c-ii-d checkbox ticked. Next: **10.5c-ii-e** —
`EmptyState` inside the card, copy unchanged.

### Task 10.5c-ii-e — Categories EmptyState restyle

Fifth piece of 10.5c-ii. Restyles the "No categories yet" `EmptyState`
so it sits comfortably inside the new Categories card instead of
carrying its whole-screen-sized padding, copy unchanged.

- `OwnerRestaurant.jsx`: the Categories `emptyState` prop's `EmptyState`
  gains `className={styles.categoriesEmpty}` — no other props touched.
- `OwnerRestaurant.module.css`: new `.sectionCard .categoriesEmpty`
  rule, `padding: var(--space-lg) 0` — same fix
  `OwnerDashboard.module.css`'s `.card .notificationsEmpty` (Task
  10.3f-ii) already applied to the same "EmptyState's own padding
  doubles up inside an already-padded card" problem. Two-class selector
  so it wins over `EmptyState`'s own single-class `.emptyState` rule
  regardless of stylesheet injection order.

**Verification:** same no-npm-access gap as every recent session
(`npm ping` → 403). Verified via `tsc --noEmit --noResolve --jsx
react-jsx --esModuleInterop --skipLibCheck --allowJs` against the edited
`.jsx` (clean, no genuine TS1xxx errors) and a brace/paren-balance check
on both edited files (`OwnerRestaurant.jsx` 443/443 braces, 500/500
parens; `OwnerRestaurant.module.css` 62/62 braces, 305/305 parens), plus
a manual re-read — not a rendered/screenshotted check.

`docs/TASKS.md`'s 10.5c-ii-e checkbox ticked. Next: **10.5c-ii-f**
(*verify only*) — confirm `ListWithPagination`'s loading label and
pager look right inside the card; no code change expected unless a
clash is found.


### Task 10.5c-ii-f — Categories: `ListWithPagination` loading label + pager inside the card (verify only) (2026-09-21)

Last piece of 10.5c-ii. **Verify only — no code changed** (`ListWithPagination`
is shared by seven call sites; per the task, flag a clash, don't edit it).

**Method — first real render pass since 10.5c began.** `npm ci` works in
this session (unlike the 403s the entries above record), and headless
Chromium (Playwright) is available, so this was checked in a real browser
instead of by brace-counting: Vite dev server + Playwright with `/api/*`
mocked (`/restaurants/me`, `/opening-hours`, `/categories?page=N`, etc.).
Scenarios: first load held in flight, 3 rows, 5 rows × 3 pages, 5 rows ×
999 pages, an over-long category name, empty, and a page change held in
flight. Widths 320 / 390 / 768 / 1280.

**Loading label — OK.** "Loading categories…" renders at 14px in
`--color-text-secondary`, left-aligned with the card's content edge (x=33 at
320, x=353 at 1280), no stray margin, 16px tall, no clash with the card
padding or the header row. `role="status"` present.

**Pager — mostly OK, one clash found.**
- No horizontal overflow at any width tested (`documentElement.scrollWidth`
  == viewport, card `scrollWidth` == `clientWidth`), including
  "Page 1 of 999" at 320px.
- Sits 16px below the last row inside the card's padding; centered; looks
  right against the new rows at 390/768/1280.
- Page change keeps the previous rows visible with `aria-busy="true"` and
  both buttons disabled while the next page loads; re-enables after.
  "Page 2 of 3" updates correctly.
- At 320px the pager wraps to two lines ("Previous · Page 1 of 3", then
  "Next" centered below). This is the intentional `flex-wrap` from Task
  8.2c-i (three unbreakable pieces don't fit in the ~254px column), not a
  regression — noted only because it now sits under the new chip rows and
  looks slightly loose there. At 390px and up it is one line.
- **CLASH — pager buttons are 34px tall** (`.pageButton`: 8px vertical
  padding + 14px text), below the 44px tap-target floor this phase applies
  everywhere else (`.addPill`, the Edit/Delete links in 10.5c-ii-b). Same at
  every width. Also: they're neutral grey-outlined buttons, not orange
  pills like "Add category" — acceptable, just visibly a different
  family.

**Not fixed — decision needed (project owner).** `.pageButton` is in the
shared component, so options are:
- **(a)** Add `min-height: 44px` to `.pageButton` in
  `ListWithPagination.module.css` — one line, fixes all seven call sites
  (Categories, Service areas, Payment methods, OwnerMenu, OwnerOrders,
  AdminOrders/Restaurants/Live requests) at once; needs a look at each
  screen afterward.
- **(b)** Scope a 44px override to the Categories/Service areas/Payment
  methods cards via the component's existing `className` prop
  (`.sectionCard`-descendant selector) — no shared-component edit, but the
  other pages keep 34px.
- **(c)** Leave as-is and let 10.5i-g's 44px sweep decide.
My recommendation is (a), since the floor is a project-wide rule. Not
started.

**Decided by the project owner: option (a)** (2026-09-22). Built:
`min-height: 44px` added to `.pageButton` in
`ListWithPagination.module.css` — a one-line change in the shared
component, so all 7 call sites (Categories, Service areas, Payment
methods, OwnerMenu, OwnerOrders, AdminOrders, AdminRestaurants,
AdminLiveRequests) now get the 44px floor at once. **Not yet verified
by a real render** — this session has no network/npm/browser access
(same standing limitation noted on the `10.5i` entry below), so the
"look at each screen afterward" follow-up this option calls for is
still outstanding. Flagging for whoever next has render access: check
all 7 pages at the usual 4+ breakpoints for any layout shift from the
taller buttons (most likely spot: pagers that already sat close to a
wrapping threshold).

**Screenshots** (not committed; regenerable with the same script) showed
the card looks coherent at all four widths apart from the pager points
above.

`docs/TASKS.md`: 10.5c-ii-f ticked, and with it the parent 10.5c-ii (all six
sub-items done). Next: **10.5d-i-a** — apply `.sectionCard` to the Opening
hours section. (If you pick option (a)/(b) above first, that's a small
task to slot in before it.)


### Task 10.5d-i-a — Owner Restaurant: `.sectionCard` on Opening hours (2026-09-21)

- `OwnerRestaurant.jsx`: the Opening hours `<section>` swaps
  `styles.section` for `styles.sectionCard` (the shell Categories adopted
  in 10.5c-i-a: surface, border, `--radius-md`, `--shadow-card`, 16px
  padding, `--space-xl` top margin). Header row untouched (10.5d-i-b). Service
  areas / Payment methods still on `.section` until 10.5e-i-a / 10.5f-i-a.
- **Regression found by real render, fixed in this task:**
  `OwnerRestaurant.module.css`. With the card's extra 16px padding + 1px
  border per side, the two `type="time"` inputs no longer fit at 320px —
  "Closes" spilled ~22px past the row's and the card's right edge. Before
  the card they fit with ~0px to spare. Task 8.2d-ii's "no changes needed
  for `.openingHoursRow`" finding was a manual trace, never rendered.
  Fix: `min-width: 0` on `.openingHoursTimes` (its own min-content was the
  floor) and a scoped `.openingHoursTimes > * { flex: 1 1 0; min-width: 0 }`.
  Shared `FormField` untouched. This is a guard only — the time fields' look
  is still 10.5d-ii-f's job.
- **Verified (real Chromium, API mocked):** 320 / 390 / 768 / 1280 — no
  page overflow, card `scrollWidth` == `clientWidth`, inputs end inside the
  row (320: 274 vs row 287; inputs 108px wide). Caveat: my mock's field names
  for the hours rows didn't match the real response, so toggles/times render
  in their empty/"Closed" state; layout was checked, not real data.
- **Known / expected, not fixed:** each day row is still its own bordered
  box, so the card now holds ~7 nested boxes with double padding — the
  reference's bordered inner box; row shell is 10.5d-ii-d. At 320px each row
  is tall (day/toggle, times, Save on three lines) — 10.5d-ii-c..g.
- Still open from the previous entry: the pager-button 44px decision
  ((a)/(b)/(c)). Not started.

`docs/TASKS.md`: 10.5d-i-a ticked. Next: **10.5d-i-b** — header row: title
only, no action button.

### Task 10.5d-i-b — Owner Restaurant: Opening hours header row, title only (2026-09-21)

- **No code change.** The Opening hours header in `OwnerRestaurant.jsx` is
  already `<div className={styles.sectionHeader}><h2
  className={styles.sectionHeading}>Opening hours</h2></div>` — the heading
  and nothing else. There is no action button in the code to remove (per the
  task's own note), and the heading typography (16px / 600, `--color-text-primary`)
  was applied to all four section headings at once in 10.5c-i-b, so there is
  nothing left to restyle here.
- **Verified (real Chromium, static harness):** `node_modules` isn't present
  and the sandbox has no npm registry access, so I couldn't run the Vite build.
  Instead I rendered the real `global.css` + real `OwnerRestaurant.module.css`
  with markup copied from the Categories and Opening hours headers, at 320 / 390 /
  768 / 1280. At every width: Opening hours heading computes identical
  typography to Categories' (font-size, weight, colour, family, margin); no page
  or card overflow; heading inset 17px left/top (16px padding + 1px border, same
  as Categories); no buttons/links in the header; 16px gap from header to
  first content. Caveat: this checks the header's CSS, not the live React page
  or real data — the full-page render is 10.5i's job.
- **Expected difference, not a bug:** Categories' header row is 44px tall
  (driven by the "Add category" pill); Opening hours' is 19px (heading only), so
  its content starts closer to the card's top edge. The reference image shows
  the same, since that card has no action.
- Still open from earlier entries: the pager-button 44px decision
  ((a)/(b)/(c), from 10.5c-ii-f). Not started.

`docs/TASKS.md`: 10.5d-i-b ticked, and with it the parent 10.5d-i (both
sub-items done). Next: **10.5d-ii-a** — restyle the real `openingHoursError`
state (copy verbatim).

### Task 10.5d-ii-a — Owner Restaurant: Opening hours load error (2026-09-21)

- `OwnerRestaurant.jsx`: the `openingHoursError` branch's `<p>` swaps
  `styles.formError` for `styles.openingHoursLoadError`; `role="alert"` and
  the copy ("Couldn't load opening hours. Check your connection and try
  again.") are unchanged.
- `OwnerRestaurant.module.css`: new `.openingHoursLoadError`,
  `composes: formError` — same "new class per section" reasoning as
  `.categoryLoadError` (10.5c-ii-d).
- **Naming note:** the existing `.openingHoursError` is *not* this error — it
  is the per-day **save** error inside `.openingHoursRow` (needs
  `flex: 1 0 100%`) and stays as-is until **10.5d-ii-g**. The task line's
  "real `openingHoursError` state" refers to the hook's `error` variable
  (`openingHoursError` in the JSX), i.e. the load error.
- **Visual result: effectively unchanged, on purpose.** The reference shows
  plain red text directly under the title, no banner/box, and the code
  already rendered exactly that. What this task buys is an independent hook for
  later per-section tweaks. Reference text looks a touch smaller than 14px;
  I kept `--font-size-body` to match Categories' error and for legibility.
  Say so if you want caption-size for both.
- **Verified (real Chromium, static harness — no `node_modules`/npm access;
  `composes` emulated by applying both class names):** 320 / 390 / 768 / 1280 —
  computed colour/size/family/margin identical to Categories' load error,
  inside the card, no overflow; 320px wraps to two lines cleanly. Not
  checked: the live React page with a real failing request (10.5i-d).
  Brace/paren balance clean on both edited files.

`docs/TASKS.md`: 10.5d-ii-a ticked. Next: **10.5d-ii-b** — Loading state
restyled.

### Task 10.5d-ii-b — Owner Restaurant: Opening hours loading state (2026-09-21)

- `OwnerRestaurant.jsx`: the `openingHoursLoading` branch's `<p>` swaps
  `styles.status` for `styles.openingHoursLoading`. Copy unchanged
  ("Loading…" — Categories' label says "Loading categories…" via
  `loadingLabel`, but this task's rule is copy-unchanged, so not aligned).
- `OwnerRestaurant.module.css`: new `.openingHoursLoading` — margin 0,
  `--font-size-body`, `--color-text-secondary`, left-aligned. Mirrors
  `ListWithPagination`'s `.loadingStatus`, which Categories' loading label
  uses. The bare `.status` is untouched: it is the whole-page loader
  (line ~823) and centres with `--space-xl`/`--space-lg` padding, which
  would have doubled up inside the card's own padding and centred the text
  under a left-aligned title.
- **Visible change:** loading text is now left-aligned under the title with
  a 16px gap and no extra padding (before: centred, ~32px vertical padding).
  The reference has no loading state, so this follows Categories, not the
  image. Plain text, no spinner/skeleton, per the codebase convention.
- **Verified (real Chromium, static harness — no npm access):** 320 / 390 /
  768 / 1280 — computed colour/size/family/margin/padding/alignment identical
  to Categories' loading label; left edge aligned with the title; 16px gap;
  inside the card; no overflow. Not checked: the live page during a real
  in-flight request (10.5i-d). Brace/paren balance clean.

`docs/TASKS.md`: 10.5d-ii-b ticked. Next: **10.5d-ii-c** — Empty state
restyled, copy unchanged.

### Task 10.5d-ii-c — Owner Restaurant: Opening hours empty state (2026-09-21)

- `OwnerRestaurant.jsx`: the Opening hours `<EmptyState>` gets
  `className={styles.openingHoursEmpty}` (the component already accepts
  `className`; shared `EmptyState` untouched). Title and description copy
  unchanged.
- `OwnerRestaurant.module.css`: new `.sectionCard .openingHoursEmpty
  { padding: var(--space-lg) 0 }` — same trim and same two-class
  specificity reasoning as `.categoriesEmpty` (10.5c-ii-e): `EmptyState`'s
  own `--space-2xl` / `--space-lg` padding is sized for a whole-screen
  region and would double up inside the card's 16px padding.
- **Visible change:** empty block is ~32px shorter top and bottom and no
  longer adds side padding. Text stays centred under the left-aligned
  title, as in Categories. The reference has no empty state for this card,
  so this follows Categories.
- **Note, not changed:** the copy is long ("Opening hours are set up when a
  restaurant is created — check back once that's in place.") and wraps to
  3 lines at every width because `EmptyState`'s description is capped at
  32ch. Fine visually; the wording itself is unchanged per the task.
- **Verified (real Chromium, static harness — no npm access):** 320 / 390 /
  768 / 1280 — computed padding identical to Categories' empty state
  (16px 0), description inside the card, no page or card overflow; screenshot
  at 320px looked right. Not checked: the live page with a real empty
  response (10.5i-d). Brace/paren balance clean.

`docs/TASKS.md`: 10.5d-ii-c ticked. Next: **10.5d-ii-d** — day-row shell
(`.openingHoursRow`): day label + row container.

### Task 10.5d-ii-d — Owner Restaurant: day-row shell (2026-09-21)

- **No code change.** `.openingHoursRow` is already a bordered inner box:
  1px `--color-border`, `--radius-md`, `--space-md` padding,
  `--color-surface` background, wrapping flex row — computed-style
  identical to `.listRow`, the shell Payment methods' rows will get in
  10.5f-ii-a. `.openingHoursDay` is already the semibold `--font-size-body`
  label in a fixed 100px slot. No new class needed either: both classes are
  Opening-hours-only, so the "new class per section" reasoning that drove
  `.categoryChip` etc. doesn't apply.
- **Verified (real Chromium, static harness — no npm access):** seven rows
  (Sunday–Saturday) at 320 / 390 / 768 / 1280 — shell matches `.listRow` on
  border width/colour, radius, padding, background; 12px gap between rows;
  rows inside the card; no page overflow. Widest label ("Wednesday", semibold)
  measured 90px in the 100px slot with **DejaVu Sans, a wider face than the
  real `system-ui` stack** (Astra is only `--font-family-brand`, not used
  here), so real devices have more headroom; no label clipped. Row inner
  width at 320px is 260px. Not checked: rows with real toggles / times /
  Save (10.5d-ii-e..g) or live data (10.5i-d).
- **Reference:** none for the Opening hours day rows (the reference only
  shows this card's load-error state). The only bordered inner box in the
  image is the Payment methods row, and the code's shell matches its
  construction. **Possible follow-up, not done:** the reference's inner box
  looks tighter (smaller radius, less padding) than the 12px/12px used
  here. `.listRow` shares those values, so it's better decided once for
  both in 10.5f-ii-a than changed here alone.
- **Known, unchanged:** seven stacked boxes inside a card is visually
  heavy and each row gets tall at 320px once toggle/time/Save wrap — the
  inside of the row is 10.5d-ii-e..g.

`docs/TASKS.md`: 10.5d-ii-d ticked. Next: **10.5d-ii-e** — Closed
`ToggleSwitch` placement inside the row.

### Task 10.5d-ii-e — Owner Restaurant: Closed `ToggleSwitch` placement (2026-09-21)

- **The gap:** before this task, each day row's label
  (`.openingHoursDay`) and its own `Closed` `ToggleSwitch` were two
  independent children of `.openingHoursRow` — siblings of
  `.openingHoursTimes` and `.openingHoursRowActions`, separated only by
  the row's own `gap: var(--space-lg)`. `.openingHoursRow` has been
  `flex-wrap: wrap` since before 10.5d-i-a (the card-fit fix that
  wrapping `.openingHoursTimes` needed), so at a narrow enough column a
  day's label and its own toggle could wrap onto two different lines
  independently — the label ending one line, its toggle starting the
  next, with whichever other row-child happened to fit the remaining
  width on either line. That breaks the "this label names the control
  right next to it" reading 10.5d-ii-d's own entry flagged as still
  open ("the inside of the row is 10.5d-ii-e..g").
- **Fix, both files:** new `.openingHoursDayGroup` (`OwnerRestaurant.jsx`)
  wraps the day `<span>` and the `ToggleSwitch` together;
  `.openingHoursDayGroup` (`OwnerRestaurant.module.css`) is `display:
  flex; align-items: center; gap: var(--space-sm); flex: 0 0 auto`.
  `gap: var(--space-sm)` reuses the exact spacing `.nameRow` already
  established for its own tightly-related label+control pair (heading +
  `StatusBadge`, Task 10.5a-iv-i) — the same "label and the thing right
  next to it" relationship, just inside the Opening hours list instead
  of the hero. `flex: 0 0 auto` keeps the group at its own natural
  width; `.openingHoursTimes` (unchanged, `flex: 1 1 auto; min-width:
  0`) stays the row's one flexible child, same division of labor as
  before this task. `.openingHoursDay`'s own `flex: 0 0 100px` is
  unchanged, so every day's label still lines up at the same width
  inside its new group.
- **`ToggleSwitch`'s `label="Closed"`** (static, not derived from
  `draft.is_closed`) is unchanged — it names what flipping the toggle
  *does* ("mark this day Closed"), not the day's current state, which
  is a pre-existing, correct distinction from the hero's own
  `ToggleSwitch` (Task 10.5a-iv-ii, `label={is_open ? 'Open' : 'Closed'}`,
  which *does* show current state) — not something this placement-only
  task should change.
- **Verified with a real headless-Chromium render**, not a manual CSS
  trace: a throwaway Playwright harness (`npm ci`'d real dependencies —
  the npm registry is reachable this session, confirmed via `npm ping`)
  served the real `vite preview` production build, mocked
  `/restaurants/me`, `/opening-hours`, and the three list endpoints
  (`/categories`, `/service-areas`, `/payment-methods`, all returned
  empty so only the Opening hours card's real 7-row data was exercised),
  and loaded `/owner/restaurant` with a fake bearer token in
  `localStorage`. Checked, per row, at 320×640, 390×844, 768×1024,
  1024×768, 1280×800, 1920×1080, and a 667×375 landscape phone (the same
  7-viewport bar `10.5c-i-a` onward has used): the day label and its
  toggle's vertical centers are within a few px of each other (same
  line), the group never overflows its row, and the page never
  overflows horizontally. **0 issues across all 7 viewports**, run
  twice for stability. One Sunday row was seeded `is_closed: true` (the
  other six `false`) so both toggle states were actually exercised, not
  just the default. The harness (and its own two bugs — a stray syntax
  error, and a `[class*="openingHoursRow"]` selector that also matched
  `.openingHoursRowActions` since the latter contains the former as a
  substring, fixed with an exact-prefix regex instead) was deleted after
  use, same "small scratch script, not committed" pattern this project's
  own earlier real-render sessions already used.
- **Known, unchanged:** the row can still get visually tall at 320px
  once the toggle, times, and Save all wrap onto their own lines under
  the day-group — that's 10.5d-ii-f/g's and 10.5i-d's territory, not
  this task's.

`docs/TASKS.md`: 10.5d-ii-e ticked. Next: **10.5d-ii-f** — Opens/Closes
time fields, scoped so the shared `FormField` is untouched.

### Task 10.5d-ii-f — Owner Restaurant: Opens / Closes time fields (2026-09-21)

- **The bug this found (real render, not a CSS trace).** At 320px each time
  field was 108px wide but needs ~126px to show its whole value
  ("12:30 PM", measured 125.7px). The AM/PM segment was cut off
  ("09:00 A", "09:30 P"), so an owner could not tell 9 AM from 9 PM.
  Cause: the `flex: 1 1 0` overflow guard added in 10.5d-i-a squeezes both
  fields into whatever the row has left. At 360px it only just fit
  (128px vs 125.7px needed). 390px and up were fine.
- **Fix, `OwnerRestaurant.module.css` only (JSX, `FormField` and
  `ToggleSwitch` are byte-identical to the previous zip):**
  1. `.openingHoursTimes` gets `flex-wrap: wrap`, and its children go from
     `flex: 1 1 0` to `flex: 1 1 8.25rem` (~132px, a few px over the
     measured need; rem so it scales with the user's text size). The two
     fields sit side by side when the row has room and stack, each full
     width, when it does not. Content-driven, no breakpoint. `min-width: 0`
     stays as the backstop, so the 10.5d-i-a overflow cannot come back.
  2. New scoped `.openingHoursTimes input { min-height: 44px }` (Task 8.9a's
     floor; inputs measured 38.7px). Same scoped-input approach as 10.1's
     Login `.inputField`.
- **What is deliberately unchanged:** the fields' colours, border, radius,
  label style and focus ring are still `FormField`'s own. They already match
  the reference's input treatment (the profile form above uses them as-is).
  **No reference exists for these editing states** (the reference shows only
  this card's load-error), so I reused the profile-form field treatment
  rather than inventing one. The time display format (12h/24h) is the
  browser's own, by device locale; the value sent to the API is still
  `HH:MM` 24-hour, as `openingHoursController.js` requires.
- **Verified with a real headless-Chromium render** (real `vite build`,
  API mocked, fake bearer token; throwaway scripts outside the project,
  deleted after use). The same check was run against the **original** build
  first, to prove it detects the bug: **168 issues on the original**
  (clipping at 320px in every locale, plus sub-44px inputs everywhere),
  **0 on the fix**. Cases: 320x640, 390x844, 768x1024, 1024x768, 1280x800,
  1920x1080, 667x375 landscape, plus 360x780, 375x667, and 320px in `en-GB`
  and `am-ET` locales. Per case: no page or card horizontal overflow; every
  input inside its row and its card; every input at least as wide as its
  full value; every input >= 44px tall; labels above inputs; fields either
  cleanly side by side or cleanly stacked; no page/console errors.
  Behaviour checked at 320 / 390 / 1280: toggling Closed hides both
  fields and re-opening restores them; typing a time works; keyboard focus
  ring (orange, 2px) still shows; Save success shows "Saved"; a Save error
  renders inside its row with the real backend message; no overflow in any
  of those states. Screenshots at 320 / 390 / 1280 looked right.
- **Trade-off, flagged (project owner's call):** stacking makes an open day's
  row taller at narrow widths. At 320px and 360px an open row goes from
  205px to 286px, and the Opening hours card at 320px from 1499px to
  1987px. From ~375px up the fields stay side by side and a row grows only
  ~5px (the 44px height). **Alternative, not taken:** keep the pair side by
  side at 320px by hiding Chrome's clock icon on the time inputs
  (`::-webkit-calendar-picker-indicator`), which frees ~20px. I did not,
  because on desktop Chrome that icon is the visible way to open the picker,
  and stacking is deterministic across fonts, locales and browsers
  (Firefox/Safari time controls have different intrinsic widths). Say so if
  you would rather have the compact layout.
- **Noted, not changed:** the profile form's Restaurant name and Description
  inputs on this same page are 34px tall (shared `FormField`, no
  `min-height`), so the time fields are now taller than their neighbours
  above. Not touched: that is 10.5i-g's 44px sweep, together with the
  still-open pager-button decision from 10.5c-ii-f ((a)/(b)/(c)). The
  measurements use headless Chromium, where `system-ui` resolves to DejaVu
  Sans, wider than real device faces, so real devices have more headroom.
- Not checked: `npm run lint` (no ESLint config in the zip, as in earlier
  entries); Firefox/Safari rendering (Chromium only, as in earlier
  tasks). The full every-state pass stays with 10.5i-d.

`docs/TASKS.md`: 10.5d-ii-f ticked. Next: **10.5d-ii-g** — Save link +
"Saved" confirmation + per-day error. No reference exists for the editing
states: reuse 10.5c's treatment and say so in the log.

### Task 10.5d-ii-g — Owner Restaurant: Save link, "Saved" confirmation, per-day error (2026-09-21)

- **No reference exists for these editing states** (the reference shows only
  this card's load-error), so, as the task says, this reuses 10.5c's
  treatment: link-style actions get their own scoped class with the same
  properties as `.linkButton` (orange, underlined, caption, semibold, 44px
  `min-height`), as `.categoryEditLink`/`.categoryDeleteLink` did in
  10.5c-ii-b. Errors reuse `formError`, as `.categoryLoadError` did.
- **Save link — built.** `OwnerRestaurant.jsx`: the per-day Save button's
  `className` goes from `styles.linkButton` to `styles.openingHoursSaveLink`
  (plus a comment). `OwnerRestaurant.module.css`: new
  `.openingHoursSaveLink` (full property duplication, no `composes`, same
  reasoning as 10.5c-ii-b: `.linkButton` still serves Payment methods' Edit
  and the menu link, which restyle in 10.5f-ii-e / 10.5g-ii), and a new
  `.openingHoursSaveLink:disabled`. **That state is the one real gap:**
  while a PATCH is in flight the button is disabled and reads "Saving…",
  but it looked identical to an active link (orange, underlined, pointer
  cursor). Now: `--color-text-secondary` (4.93:1 on white), `cursor:
  not-allowed`, underline dropped; this follows `.dangerButton:disabled`, the
  page's other disabled button. Categories' links have no such state
  (their actions open a `Modal`), so 10.5c gave nothing to copy for it.
  Copy is unchanged ("Save" / "Saving…").
- **"Saved" — verified, no change.** `.openingHoursSaved` is already
  caption/semibold in `--color-success` (4.60:1 on white, clears AA), and
  vertically centred with the Save link (both centres at the same y).
- **Per-day error — verified, no change.** `.openingHoursError` already is
  `formError` (red, 4.56:1) plus `flex: 1 0 100%` so it takes its own line in
  the row. It is Opening-hours-only, so, as with 10.5d-ii-d, a new class
  would buy nothing. Checked inside the row at 320 / 390 / 1280; wraps to two
  lines at 320 and 390, one line at 1280; no overflow.
- **Verified with a real headless-Chromium render, A/B.** Built the previous
  task's state and this one side by side and captured Monday (open) and
  Sunday (closed) rows in all four states (idle, saving with the PATCH held
  open, saved, error) at 320 / 390 / 1280: **24 snapshots, 0 geometry
  differences, 0 overflow**; the only computed-style differences are the
  Saving state's colour (`rgb(242,105,12)` → `rgb(104,113,128)`), cursor
  (`pointer` → `not-allowed`) and underline (`underline` → `none`).
  Re-ran last task's suites: time-field check **0 issues** over 11
  viewport/locale cases; behaviour check **0 failures** (Closed toggle, edit,
  focus ring, Save success, Save error, at 3 widths). Keyboard: Save is
  reachable by Tab, shows the browser's default focus ring (as every other
  link on this page does), and Enter saves. Screenshots looked right.
  `.linkButton` itself is untouched (CSS diff is an insertion only).
- **FLAG — the row reflows when you save (found by the render; not fixed;
  decision needed, project owner).** The idle layout leaves almost no spare
  width, and the status text is wider than the idle "Save":
  "Saving…" needs +25px, "Saved" (with its gap) +49px. Measured spare
  width on the first line: **~3px** for an open row on the 640px desktop
  column (768–1920px viewports all show the same), **~42px** for a closed
  row at 390px (27px at 375px, 82px at 430px). So:
  - *Open row, desktop:* clicking Save turns the label to "Saving…", the
    action group no longer fits, wraps under the fields, and the row grows
    **90 → 150px** with Save jumping to the lower left; it stays there
    while "Saved" shows and returns after the next edit.
  - *Closed row, ≤~405px viewport* (e.g. Sunday at 390px): "Saved" tips it
    over: **70 → 130px**, Save moves to the left.
  - At 320px and for open rows at 390px Save already sits on its own line
    with room beside it, so nothing moves.
  Options: **(a) leave it** (current): the jump is transient and idle rows
  stay compact. **(b) reserve the room**: give the action group a constant
  width (Save + "Saving…" + "Saved", ~107px). Stable, but then every open
  row on desktop and every closed row at ≤~430px is permanently two-line,
  about +60px each (roughly +360px on the desktop card). A header-style row
  (Save beside the day name, fields below) costs the same. Recommendation:
  **(a)**, since the project stresses a compact interface and (b) is a
  one-rule change if the jump bothers you in real use. This is also why the
  Save link's width is not padded up to 44px (see below).

  **Decided by the project owner: option (a) — leave it as-is** (2026-09-22).
  No code change; the transient reflow on Save is accepted, and idle rows
  stay compact.
- **Noted, not changed:**
  - *Save is 32.7px wide × 44px tall.* Height meets the floor; width is
    below it, exactly like Categories' Edit/Delete (8.9a2 fixed height only).
    Padding it would eat the ~3px of spare desktop width above, so it is
    left to 10.5i-g's 44px sweep.
  - *"Saved" is not announced to screen readers:* it is a plain `<span>`
    with no `role="status"`. That is a JSX/accessibility fix, not a restyle;
    left for you to schedule.
  - *The error shows the backend's own text verbatim*, e.g. "open_time and
    close_time are required when is_closed is false" (field names and all).
    Copy is unchanged per this task's rule; a friendlier mapping would be a
    small separate task.
  - *Stale comments:* the `.categoryEditLink` comment and the Categories JSX
    comment still say `.linkButton` backs Opening hours' Save link. They were
    true when written; 10.5f-iii's cleanup grep of `.linkButton` users should
    catch them.
  - *Orange link text on white is 3.09:1* — the standing decision from the
    8.9b contrast audit / Task 9.1's brand-orange plan, not reopened here.
- Not checked: `npm run lint` (no ESLint config in the zip, as in earlier
  entries); Firefox/Safari (Chromium only, as in earlier tasks); a real
  backend (API mocked; the error shape matches `client.js`'s
  `data?.error`). Measurements use headless Chromium, where `system-ui`
  resolves to DejaVu Sans, wider than real device faces, so real devices have
  more headroom.

`docs/TASKS.md`: 10.5d-ii-g ticked, and with it the parent **10.5d-ii** (all
seven sub-items done), so the Opening hours card (10.5d) is complete. Next:
**10.5e-i-a** — Service areas card: apply `.sectionCard`. Still open from
earlier entries: the pager-button 44px decision ((a)/(b)/(c), 10.5c-ii-f).

### Task 10.5e-i-a — Owner Restaurant: `.sectionCard` on Service areas (2026-09-21)

- `OwnerRestaurant.jsx` only: the Service areas `<section>` swaps
  `styles.section` for `styles.sectionCard` (plus a comment). No CSS change:
  `.sectionCard` already exists from 10.5c-i-a and Opening hours adopted it in
  10.5d-i-a. The header row and "Add area" button (10.5e-i-b / 10.5e-i-c) and
  the list rows, Edit/Delete links, load error and `EmptyState` (10.5e-ii) are
  untouched. Payment methods still uses `.section` until 10.5f-i-a.
- **Verified with a real headless-Chromium render, A/B.** Built the previous
  task's state and this one side by side, with the API mocked to give Service
  areas eight states: populated (3 names), long name with spaces, long
  unbreakable Latin name, long unbreakable Amharic name, multi-page (10 rows,
  3 pages), empty, load error, and loading (request held open). Each at nine
  viewports (320, 360, 375, 390, 768, 1024, 1280, 1920, and 667x375
  landscape): **72 snapshots per build.**
  - The card's computed style (background, border, radius, shadow, padding,
    margin, box-sizing) is **identical to Categories' card in all 72**, and its
    left edge and width match Categories' exactly.
  - Gap from the Opening hours card to this one: **24px**, unchanged.
    Content inset from the card edge: **0 → 17px** (16px padding + 1px border,
    the same figure 10.5d-i-b measured for the other cards). Card height:
    **+9px** in the normal states (25px of old top border/padding replaced by
    34px), the same as Categories.
  - **No new problem case.** Overflow/escape problems: 13 snapshots before,
    the same 13 after (see the pre-existing item below); nothing else,
    including the long-with-spaces name, which wraps inside its row at every
    width. Header, "Add area", error and empty text all stay inside the card.
  - Behaviour, at 320 and 1280: Add area opens the "Add service area" modal;
    Edit opens prefilled with the area's name; Delete opens its confirmation
    naming the area; no console or page errors. Last tasks' time-field suite
    (0 issues) and behaviour suite (0 failures) still pass.
- **Expected differences, not bugs:**
  - *Pager wraps at 320px.* With the card's extra 34px of horizontal
    border+padding the pager no longer fits on one line: "Previous · Page 1
    of 3", then "Next" below. Before it was one line. Same effect 10.5c-ii-f
    recorded for Categories (the intentional `flex-wrap` from 8.2c-i); the
    multi-page card at 320px goes 931 → 982px tall. At 390px and up it stays
    one line. The pager's own 34px height (the (a)/(b)/(c) decision from
    10.5c-ii-f) is still open.
  - *Payment methods sits directly under this card* and still draws the old
    `.section` divider (24px gap, 1px top border, no card), as Opening hours did
    under Categories until 10.5d-i-a. Temporary until 10.5f-i-a.
- **Pre-existing, not fixed, already scheduled (flag, don't silently fix):** an
  area name that is one long unbreakable word overflows. `.listRowName` has no
  wrapping rule, so with a ~106-character Latin word the row and its
  Edit/Delete links escape the card at every viewport, and the page scrolls
  horizontally up to 1024px wide; a 43-character Amharic name with no spaces
  does the same up to ~390px. **The card does not cause it** (the same 13
  snapshots fail before) **but adds 17px to how far it overflows.** It is the
  same defect flagged for Categories in 10.5c-i-a and fixed there in
  10.5c-ii-a; for Service areas the fix is **10.5e-ii-a** (area name chip)
  and **10.5e-ii-c** (row layout). Names with ordinary spaces wrap fine.
- *Stale comments (historical, not edited):* the Categories comment ("the other
  three sections keep `.section` until …") and the Opening hours one
  ("Service areas / Payment methods keep `.section`…") were true when
  written; 10.5f-iii's cleanup pass should re-read them.
- Not checked: `npm run lint` (no ESLint config in the zip); Firefox/Safari;
  the modals' Save paths (unchanged, and outside this wrapper swap); a real
  backend (API mocked).

`docs/TASKS.md`: 10.5e-i-a ticked (parent 10.5e-i stays open for -b and -c).
Next: **10.5e-i-b** — header row, no icon. Likely verify-only: the shared
`.sectionHeader`/`.sectionHeading` treatment from 10.5c-i-b already applies to
all four sections, as 10.5d-i-b found for Opening hours.

### Task 10.5e-i-b — Owner Restaurant: Service areas header row, no icon (2026-09-21)

- **No code change.** The Service areas header is already
  `<div className={styles.sectionHeader}><h2 className={styles.sectionHeading}>
  Service areas</h2><button …>Add area</button></div>`: the same two classes
  Categories' header uses. 10.5c-i-b applied the 16px / 600 heading type to all
  four section headings at once and left `.sectionHeader`'s flex row as it was
  (title left, action right, no `white-space: nowrap` on either child), so
  there was nothing left to restyle here. There is no icon element to add or
  remove: the header holds exactly an `<h2>` and a `<button>`, and the icon
  slot was dropped by the split note's earlier icon decision.
- **Why this is more than a re-read.** 10.5c-i-b's "title left, action right,
  both wrap" conclusion was a manual trace only (that session had no npm
  access, and its log says so). This time it was measured in a real browser.
- **Verified with a real headless-Chromium render** (real `vite build`, API
  mocked, Service areas populated), at 320, 360, 375, 390, 667x375, 768, 1024,
  1280 and 1920. At every viewport, Service areas' header vs Categories':
  - identical computed layout CSS (`display`, `justify-content`,
    `align-items`, gap, `margin-bottom`, `flex-wrap`) and identical heading
    typography (family, size, weight, colour, margins, line-height);
  - heading inset from the card's left edge and the button's inset from its
    right edge are both **17px** (16px padding + 1px border), in both cards;
  - heading and button vertically centred on each other (|Δ| < 1px), no
    overlap, no header or page overflow, heading on one line, and a 16px gap
    from the header to the content below. **0 differences.**
  - **Squeeze test for "both wrap"** (synthetic; the Service areas card
    forced narrower than anything the app produces — at 320px the real card is
    288px wide): at 240, 200 and 170px the heading wraps to two lines and the
    button's label wraps inside it, still vertically centred, with no overlap
    and no overflow. It only overflows (by a few px) at ~150px, about half the
    narrowest real card. So the header has roughly 130px of margin at 320px.
- **Expected difference, not a bug:** the row is 32px tall here vs 44px in
  Categories, because the button is still the old `.addButton` (32px, 12px
  radius) rather than `.addPill` (44px, full pill). That is 10.5e-i-c's job;
  applying it will make this header 44px too, and the card 12px taller, as it
  did for Categories.
- **Still not rendered:** the longest pairing, "Payment methods" + "Add
  payment method" (10.5c-i-b's manual wrap budget for it is unchecked); that
  card is not on `.sectionCard` yet, so it is checked in 10.5f-i-b/c.
- Not checked: `npm run lint` (no ESLint config in the zip); Firefox/Safari.
  Screenshots looked right (the fixed bottom nav shows in one element crop; it
  is a capture artefact).

`docs/TASKS.md`: 10.5e-i-b ticked (parent 10.5e-i stays open for -c). Next:
**10.5e-i-c** — "Add area" uses `.addPill` (one `className` swap; the Categories
comment saying Service areas keeps `.addButton` until then becomes stale).

### Task 10.5e-i-c — Owner Restaurant: `.addPill` on "Add area" (2026-09-22)

Last piece of 10.5e-i. Gives Service areas' header action the same outlined
orange pill Categories got in 10.5c-i-c. Button only: no row/chip work
(10.5e-ii-*), and no change to Payment methods.

- `OwnerRestaurant.jsx`: the Service areas "Add area" button swaps
  `styles.addButton` for `styles.addPill` (plus a comment noting the swap and
  that Payment methods keeps `.addButton` until 10.5f-i-c). `onClick`, label
  and `type` are untouched. No new CSS — `.addPill` already exists, built by
  10.5c-i-c, and needs no per-section variant.
- `OwnerRestaurant.module.css`: only the `.addPill` doc comment changed, to
  stop calling this task "not yet done" and say Payment methods is now the
  only section left on `.addButton`.
- **Expected side effect**, same as 10.5c-i-c's: the button is 12px taller
  (32 → 44px), so the Service areas header row and the list below it shift
  down 12px. 10.5e-i-b already flagged this as expected, not a bug.
- 10.5e-i (the parent) is ticked now that a, b and c are all done — same
  "verify-only middle step doesn't block the parent" pattern 10.5c-i's log
  used.

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with the API mocked (Categories/Service areas/Payment methods each
populated with one row), at 320, 360, 375, 390, 768, 1024, 1280 and 1920:
- "Add area": 94.9px wide x 44px tall at every width, computed radius
  9999px, `1px solid rgb(242,105,12)`, text `rgb(242,105,12)`, transparent
  fill, 12px / 600 — every property identical to "Add category" except
  width, which differs only because "Add area" is the shorter label (94.9 vs
  124.3px); both wrap the same way (`white-space: normal`) and centre their
  label the same way (`inline-flex`, computed `flex`).
- "Add payment method" unchanged across all 8 widths: still `.addButton`
  (square radius, no explicit `min-height`, 32px or 46/44px depending on
  whether its longer label has wrapped at that width) — confirms the swap
  didn't leak into the still-untouched section.
- No horizontal page overflow at 320, 375 or 1024 (checked
  `scrollWidth - clientWidth === 0` at each).
- Interaction: clicking "Add area" still opens the Add-area modal (checked
  for the "Area name" field's presence after the click); `onClick` wasn't
  touched, so this is a sanity check rather than a real risk.
- Not checked: `npm run lint` (no ESLint config in the zip, as in every prior
  10.5* task); Firefox/Safari; the empty/load-error/very-long-name states
  10.5c-i-c's own render pass covered for Categories (this task changes
  nothing about how Service areas' states render — 10.5e-i-a already
  A/B'd all of those against `.sectionCard`).

`docs/TASKS.md`: 10.5e-i-c and 10.5e-i checkboxes ticked. Next: **10.5e-ii-a**
— area name chip (Service areas' equivalent of 10.5c-ii-a's `.categoryChip`).

### Task 10.5e-ii-a — Owner Restaurant: service area name as a tinted chip (2026-09-22)

First piece of 10.5e-ii (restyling the Service areas list rows). Gives each
area name a rounded-pill treatment, the same shape `.categoryChip`
(10.5c-ii-a) gave Categories — but **not the same color**, once actually
checked against the reference.

- **Checked the reference at high zoom before assuming "same as Categories."**
  `docs/reference_ui/phase10_owner_restaurant_reference.jpg`'s Categories
  chip ("የናለከ ምግቦች") and Service areas chip ("ስዲስ አበጓ, ዑረነብ") are visibly
  different colors side by side — Categories' is peach with orange text,
  Service areas' is a flat light gray with dark gray text, no orange in it
  at all. Pixel-sampled both (Python/Pillow, same median-region method
  `docs/DESIGN_TOKENS.md` uses), several points inside each chip avoiding
  text/background bleed: Service areas' background clusters around
  `#eef1f5`–`#f4f6f6` and its text around `#616874`–`#8894a3` — both bracket
  **existing** tokens (`--color-surface-muted` `#f4f6f6`, `--color-text-secondary`
  `#687180`) closely enough that no new hex value was needed, same
  "measured, maps to a real token" conclusion `docs/DESIGN_TOKENS.md`
  reaches elsewhere. This is exactly the "may or may not end up identical —
  that's each task's own call" question `.categoryChip`'s own comment left
  open; it doesn't turn out identical.
- Font weight is **not** pixel-verifiable at this image's resolution
  (regular vs. semibold don't visibly separate); kept `--font-weight-semibold`
  to match `.categoryChip` and the rest of the page's chip vocabulary
  rather than inventing a third, unverified weight — a judgment call, said
  as one in the CSS comment, not presented as measured.
- `OwnerRestaurant.module.css`: new `.areaChip`, same shape properties as
  `.categoryChip` (pill radius, `space-xs`/`space-md` padding, `font-size-body`)
  but `--color-surface-muted` background / `--color-text-secondary` text
  instead of the peach pairing. **New class, not an edit to `.listRowName`**
  — same reasoning `.categoryChip` used: `.listRowName` still renders
  Payment methods' `method_name` as plain text until 10.5f-ii-b. Updated
  `.categoryChip`'s own comment to point at this resolution instead of
  leaving the question open.
- `OwnerRestaurant.jsx`: the service-area `renderItem`'s name `<span>` swaps
  `styles.listRowName` for `styles.areaChip`. Edit/Delete untouched
  (`.linkButton`/`.linkButtonDanger` — that's 10.5e-ii-b).
- **Also fixes the long-unbreakable-word overflow at 320px** 10.5e-i-a's own
  log entry flagged and pointed at this task ("Service areas uses the same
  `.listRowName` class, so it very likely has the same gap — check it in
  10.5e-ii-a"). Confirmed the gap was real (same as Categories') and fixed
  with the identical `overflow-wrap: anywhere` + `min-width: 0` +
  `max-width: 100%` trio `.categoryChip` uses, same reasoning.
- **Not touched, on purpose:** `.listRow`/`.listRowActions` row layout
  (10.5e-ii-c's job) and Edit/Delete link styling (10.5e-ii-b's).

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with the API mocked, at 320, 360, 375, 390, 768, 1024, 1280 and
1920 (Categories/Service areas each populated with one row):
- "Downtown" (`.areaChip`) vs. "Drinks" (`.categoryChip`) at every width:
  identical radius (9999px), height (24px), padding (4px 12px), font-size
  (14px) and weight (600) — only the background/text color differs
  (`rgb(244,246,246)` / `rgb(104,113,128)` vs. `rgb(252,241,232)` /
  `rgb(214,92,8)`), confirming the shape match and the deliberate color
  difference both landed as intended.
- Long-name case (an 84-character unbroken token, same one 10.5c-ii-a's own
  log used): 0px horizontal page overflow at 320, 375 and 1024 (was a real
  gap before this fix, per 10.5e-i-a's flag) — the chip wraps across
  multiple lines inside the card instead of forcing it wider.
- Screenshot check at 390px with two service areas ("Downtown"/"Uptown")
  confirms the visual match to the reference: gray area chips sitting
  directly under the orange Categories chip, clearly distinct colors in the
  same layout.
- Not checked: `npm run lint` (no ESLint config in the zip, as in every
  prior 10.5* task); Firefox/Safari; Payment methods' own name/account
  styling (still `.listRowName`, untouched, 10.5f-ii-b's job).

`docs/TASKS.md`'s 10.5e-ii-a checkbox ticked. Next: **10.5e-ii-b** — Edit /
Delete as underlined orange / red text links, scoped to Service areas rows
(same `.categoryEditLink`/`.categoryDeleteLink` pattern 10.5c-ii-b used).

### Task 10.5e-ii-b — Owner Restaurant: Service areas' Edit/Delete as scoped link classes (2026-09-22)

Second piece of 10.5e-ii. Gives the Service areas row's Edit/Delete buttons
their own classes instead of the shared `.linkButton`/`.linkButtonDanger`,
matching `.categoryEditLink`/`.categoryDeleteLink` (10.5c-ii-b).

- **Checked the reference first**, same discipline 10.5e-ii-a used before
  assuming a match — zoomed into both rows'
  Edit/Delete in `docs/reference_ui/phase10_owner_restaurant_reference.jpg`.
  Unlike the name chip, these **do** match: Service areas' "Edit"/"Delete"
  are the same underlined orange/red text as Categories', not a different
  pairing. So this task is a straight scoping exercise, no color decision
  to make.
- `OwnerRestaurant.module.css`: new `.areaEditLink` and `.areaDeleteLink`,
  placed right after `.areaChip`. **New classes, not edits to
  `.linkButton`/`.linkButtonDanger`** — same "new class per section"
  reasoning `.categoryEditLink`/`.categoryDeleteLink` used: `.linkButton`
  also backs Opening hours' per-day Save link, Payment methods' Edit link,
  and the "manage your foods" menu link — none of which this task
  restyles. Full property duplication, not `composes: linkButton`, same
  reasoning as before (composing would still tie Service areas to
  whatever `.linkButton` becomes later). Properties are otherwise
  identical to `.linkButton`/`.linkButtonDanger` today: Task 8.9a2's 44px
  `min-height` tap-target fix, underlined text, `--color-primary` (Edit) /
  `--color-error` (Delete).
- `OwnerRestaurant.jsx`: the service-area `renderItem`'s Edit/Delete
  `<button>`s swap `styles.linkButton`/`styles.linkButtonDanger` for
  `styles.areaEditLink`/`styles.areaDeleteLink`. Every other
  `.linkButton`/`.linkButtonDanger` call site (Opening hours' Save link,
  Payment methods' Edit, the menu link) is untouched.
- **Not touched, on purpose:** `.listRow`/`.listRowActions` — the "chip +
  actions side by side vs. wrap below" row layout is 10.5e-ii-c's own
  task.

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with the API mocked (Categories/Service areas/Payment methods each
populated), at 320, 360, 375, 390, 768, 1024, 1280 and 1920:
- Service areas' "Edit"/"Delete" (`.areaEditLink`/`.areaDeleteLink`) are
  identical at every width to Categories' (`.categoryEditLink`/
  `.categoryDeleteLink`) and to Payment methods' still-untouched Edit
  (`.linkButton`): 44px computed `min-height`, `rgb(242,105,12)` (Edit) /
  `rgb(236,7,8)` (Delete), 12px / 600, underlined — expected, since all
  three are the same properties under different class names, but confirms
  no accidental drift.
- Interaction: clicking Service areas' "Edit" still opens the edit-area
  modal (checked for the "Area name" field's presence after the click).
- Not checked: `npm run lint` (no ESLint config in the zip); Firefox/
  Safari.

`docs/TASKS.md`'s 10.5e-ii-b checkbox ticked. Next: **10.5e-ii-c** — Row
layout: chip + actions side by side when wide, actions wrap below when
narrow (Service areas' equivalent of 10.5c-ii-c).

### Task 10.5e-ii-c — Owner Restaurant: Service areas' row layout, wrap when narrow (2026-09-22)

Third piece of 10.5e-ii. Lets a Service areas row's chip and Edit/Delete
actions wrap onto their own lines when the row is too narrow to hold both
side by side, matching `.categoryRow`/`.categoryRowActions` (10.5c-ii-c).

- **No reference divergence to check, unlike 10.5e-ii-a's chip color.**
  This is a responsive-layout rule, not something pixel-sampled from the
  static reference image (which shows no narrow-width wrap state for
  either card) — it's the same behavioral decision 10.5c-ii-c made for
  Categories, carried over unchanged.
- `OwnerRestaurant.module.css`: new `.areaRow` and `.areaRowActions`,
  placed right after `.areaDeleteLink`. **New classes, not edits to
  `.listRow`/`.listRowActions`** — same "new class per section" reasoning
  `.categoryRow`/`.categoryRowActions` used: `.listRow`/`.listRowActions`
  still lay out Payment methods' rows (its own row-layout task is
  10.5f-ii-a) and are untouched here. Updated `.categoryRow`'s own
  comment (it previously listed both "10.5e-ii-c and 10.5f-ii-a" as open
  — now only 10.5f-ii-a is).
- Same reasoning `.categoryRow` used: Task 8.2d-ii's "no `flex-wrap`
  needed" finding on `.listRow`/`.listRowActions` was based on
  `.listRowName`'s plain text, which shrinks/wraps *within* the row.
  `.areaChip` (10.5e-ii-a) is a rounded pill instead — cheaper to drop
  below the actions than to keep squeezing sideways against a
  fixed-width Edit/Delete pair — hence `flex-wrap: wrap` +
  `space-between`, the same pairing `.categoryRow`/`.openToggleRow` use.
  `.areaRowActions` keeps `flex-shrink: 0` for the same reason
  `.categoryRowActions` does.
- `OwnerRestaurant.jsx`: the service-area `renderItem`'s outer `<div>`
  and actions `<div>` swap `styles.listRow`/`styles.listRowActions` for
  `styles.areaRow`/`styles.areaRowActions`. Payment methods' rows are
  untouched, still on `.listRow`/`.listRowActions`.

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with the API mocked, at 320, 360, 375, 390, 768, 1024, 1280 and
1920, using a longer-with-spaces name for both Categories ("Vegetarian and
Vegan Options") and Service areas ("Greater Downtown Metro Area") — long
enough that the chip and Edit/Delete can't share one line at narrow
widths, short enough to wrap at word boundaries rather than exercising
the separate long-unbreakable-word fix (that's `.areaChip`'s own
`overflow-wrap`, already covered by 10.5e-ii-a):
- At every width, Service areas' row (`.areaRow`) computes identically to
  Categories' (`.categoryRow`): same `flex-wrap: wrap`, same
  `justify-content: space-between`, same row width, same row height, and
  the actions wrap onto their own line under the chip at exactly the same
  widths (320–390px: wrapped; 768px and up: side by side) — 0
  differences across all 8 viewports.
- No horizontal page overflow at 320, 360, 375 or 390 (checked
  `scrollWidth - clientWidth === 0` at each).
- Screenshot at 320px confirms the visual: both cards' chip drops to its
  own line(s), Edit/Delete sit on the line below, no overlap, no
  overflow.
- Interaction: clicking Service areas' "Delete" still opens the delete
  confirmation naming the right area ("Downtown"); no page/console
  errors.
- Not checked: `npm run lint` (no ESLint config in the zip); Firefox/
  Safari.

`docs/TASKS.md`: 10.5e-ii-c checkbox ticked. Three of 10.5e-ii's five
sub-items are now done (a, b, c; d and e remain). Next: **10.5e-ii-d** —
inline load error ("Couldn't load service areas…") restyled inside the
card, copy unchanged (Service areas' equivalent of 10.5c-ii-d).

### Task 10.5e-ii-d — Owner Restaurant: Service areas inline load error restyle (2026-09-22)

Fourth piece of 10.5e-ii. Restyles the "Couldn't load service areas…"
inline error so it sits inside the Service areas card, matching this
task's copy-unchanged rule — same treatment `.categoryLoadError`
(10.5c-ii-d) gave Categories.

- `OwnerRestaurant.jsx`: the `serviceAreasError` branch's `<p>` swaps
  `styles.formError` for `styles.areaLoadError`; `role="alert"` and the
  exact copy ("Couldn't load service areas. Check your connection and
  try again.") are unchanged.
- `OwnerRestaurant.module.css`: new `.areaLoadError` class, `composes:
  formError` — same color/size/font every other inline error on this
  page already uses, no new rules of its own. **New class, not an edit
  to `.formError`** — same "new class per section" reasoning
  `.categoryLoadError`/`.openingHoursLoadError` already used:
  `.formError` still serves the profile form above and (until its own
  task) Payment methods' load error. Same situation as Categories': this
  replaces the whole `ListWithPagination` slot rather than sitting
  alongside other row content, so no extra flex rules were needed
  (unlike `.openingHoursError`, which needs `flex: 1 0 100%` to sit
  inside `.openingHoursRow`'s row).

**Verification (real, this session — `npm ci` worked here):** `vite build`
passes (208 modules, unchanged). Rendered the production build in headless
Chromium with `/api/categories` and `/api/service-areas` both mocked to a
500, at 320, 360, 375, 390, 768, 1024, 1280 and 1920:
- Service areas' error (`.areaLoadError`) is identical at every width to
  Categories' (`.categoryLoadError`): `rgb(236,7,8)`, 14px / 400, `margin:
  0`, exact copy unchanged for both.
- No horizontal page overflow at 320, 360, 375 or 390.
- Screenshot at 375px confirms the visual: plain red text directly under
  each card's header, no banner/box, matching the reference's own error
  state for this exact copy.
- Not checked: `npm run lint` (no ESLint config in the zip); Firefox/
  Safari; Payment methods' own load error (still `.formError`, untouched,
  its own task).

`docs/TASKS.md`: 10.5e-ii-d checkbox ticked. Four of 10.5e-ii's five
sub-items are now done (a, b, c, d; e remains). Next: **10.5e-ii-e** —
`EmptyState` inside the card, copy unchanged (Service areas' equivalent
of 10.5c-ii-e).

### Task 10.5e-ii-e — Owner Restaurant: Service areas `EmptyState` restyle (2026-09-22)

Fifth and last piece of 10.5e-ii. Restyles the "No service areas yet"
`EmptyState` so it sits correctly inside the Service areas card —
same trim Categories' (10.5c-ii-e) and Opening hours' (10.5d-ii-c)
empty states already got, for the same reason: `EmptyState`'s own
`padding: var(--space-2xl) var(--space-lg)` is sized for a
whole-screen empty region, and left alone it doubles up inside
`.sectionCard`'s own `--space-lg` padding into an oversized, mostly-
empty box.

- `OwnerRestaurant.jsx`: the service-area `emptyState` prop's
  `EmptyState` gets a new `className={styles.areasEmpty}`; `title`
  ("No service areas yet") and `description` ("Add the neighborhoods
  or areas you deliver to.") are unchanged — same copy-unchanged rule
  this task's parent (10.5e-ii) set for the whole chip/row list restyle.
- `OwnerRestaurant.module.css`: new `.sectionCard .areasEmpty` rule,
  `padding: var(--space-lg) 0` — byte-for-byte the same declaration as
  `.sectionCard .categoriesEmpty` and `.sectionCard .openingHoursEmpty`.
  **New class, not an edit to `.categoriesEmpty`/`.openingHoursEmpty`**
  — same "new class per section" reasoning every other 10.5c–e class on
  this page has used, even though the rule body is identical: each
  section's empty state is scoped independently so a later change to
  one card's spacing can't silently affect another's. The two-class
  selector (`.sectionCard .areasEmpty`) beats `EmptyState`'s own
  single-class `.emptyState` rule regardless of stylesheet injection
  order, same specificity reasoning `.categoriesEmpty` used.

**Verification:** this container has no network access this session, so
`npm ci` could not run (`E403` fetching a transitive dependency from
`registry.npmjs.org`) and no real headless-Chromium render was possible
— unlike every prior 10.5c–e entry's real-render verification. Flagging
this honestly rather than claiming a render that didn't happen. What was
checked instead, by code inspection only:
- `EmptyState.jsx` joins `className` onto its own `styles.emptyState`
  (`[styles.emptyState, className].filter(Boolean).join(' ')`), so
  `.areasEmpty` composes with, not replaces, the base class — same
  mechanism `.categoriesEmpty`/`.openingHoursEmpty` already rely on.
  CSS Modules will scope `.areasEmpty` to a distinct local class name
  from `.categoriesEmpty`/`.openingHoursEmpty`, so there's no
  collision even though the declaration bodies are identical.
  `.sectionCard .areasEmpty` matches the same DOM shape (`<section
  className={styles.sectionCard}>` wrapping the `EmptyState`) the
  other two cards use, so it should win the same way.
- Diffed against `.categoriesEmpty`'s and `.openingHoursEmpty`'s rules
  side by side: identical selector shape, identical declaration.
- Not checked (needs a real render, deferred until network/npm access
  is available): actual computed padding in a browser, visual
  screenshot at any viewport, horizontal-overflow check, and whether
  the trimmed empty state still fits without clipping when Service
  areas has 0 rows.

`docs/TASKS.md`: 10.5e-ii-e checkbox ticked, and with it 10.5e-ii's
parent checkbox too — all five sub-items (a–e) are now done. Next:
**10.5f-i** — Payment methods card: icon+title+"Add payment method"
header restyle, matching 10.5c-i's treatment.

### Task 10.5f-i-a — Owner Restaurant: Payment methods `.sectionCard` (2026-09-22)

First piece of 10.5f-i. Moves the Payment methods `<section>` onto the
shared `.sectionCard` shell — the same treatment Categories (10.5c-i-a),
Opening hours (10.5d-i-a) and Service areas (10.5e-i-a) already got. This
is the fourth and last of the four sections to move.

- `OwnerRestaurant.jsx`: the Payment methods `<section>` swaps
  `styles.section` for `styles.sectionCard`. Nothing else in the section
  changed — header content, the "Add payment method" button
  (`.addButton`, still 10.5f-i-c's job), and everything below stay as
  they are.
- `OwnerRestaurant.module.css`: no CSS change. `.sectionCard` already
  exists (built in 10.5c-i-a); this task only needed the JSX class swap.
- `.section` is now unused anywhere in `OwnerRestaurant.jsx` (confirmed
  by grep — the only remaining occurrence is this task's own code
  comment). Per 10.5f-i-a's own note in `TASKS.md`, the CSS rule itself
  is left in place: deleting `.section`/`.addButton` is explicitly
  10.5f-iii's job, not this one, and `.addButton` still styles "Add
  payment method" until 10.5f-i-c moves it to `.addPill`.

**Verification:** this container still has no network access this
session, so `npm ci`/`vite build` could not run and no real render was
possible — same limitation flagged in the 10.5e-ii-e entry above. By
code inspection: `.sectionCard` (10.5c-i-a's rule — surface fill, 1px
border, `--radius-md`, `--shadow-card`, `--space-lg` padding,
`box-sizing: border-box`, `min-width: 0`) is identical for all four
sections now, since all four reference the same class; no per-section
override exists that would make Payment methods render differently
from Categories/Opening hours/Service areas. Not checked (needs a real
render, deferred until network/npm access is available): actual
computed box style, visual screenshot at any viewport, and whether the
card's border/shadow abuts Service areas' card correctly above it with
no doubled spacing (the old `.section`'s `margin-top` is preserved in
`.sectionCard`, per 10.5c-i-a's own note, so this is expected to match,
but unverified by real render).

`docs/TASKS.md`: 10.5f-i-a checkbox ticked. Next: **10.5f-i-b** — header
row restyle, title only, no icon (matching 10.5c-i-b's / 10.5e-i-b's
already-shared `.sectionHeader`/`.sectionHeading` treatment — likely a
verify-only task, same as those two were).

### Task 10.5f-i-b — Owner Restaurant: Payment methods header row (verify only, 2026-09-22)

Second piece of 10.5f-i. Checked whether Payment methods' header row
already matches the target: title left, action slot right, heading
typography only, no icon — same question 10.5d-i-b (Opening hours) and
10.5e-i-b (Service areas) each answered "yes, already matches" for their
own sections.

- Payment methods' header markup (`OwnerRestaurant.jsx` line ~1309) is
  `<div className={styles.sectionHeader}><h2
  className={styles.sectionHeading}>Payment methods</h2><button ...
  className={styles.addButton}>Add payment method</button></div>` — the
  same shape every other section's header already has.
- `.sectionHeader` (flex, `space-between`, both children free to wrap)
  and `.sectionHeading` (`font-size-title` / `font-weight-semibold`, no
  margin) are shared, page-wide classes: 10.5c-i-b's own comment
  explicitly says the heading-typography edit applied to "all four
  `<h2 className={styles.sectionHeading}>` call sites" at once, Payment
  methods included, rather than waiting for each section's card-
  migration task. So this section's heading has already been on the new
  typography since 10.5c-i-b landed, well before 10.5f-i-a moved its
  card shell.
- No icon exists in this header, or anywhere else on the page (same
  "text-only header" decision the split note above 10.5c-i made for
  every card on this page — confirmed as the project owner's final call,
  option (a), 2026-09-22).
- **No code change made** — same outcome as 10.5d-i-b/10.5e-i-b, for the
  same underlying reason: the header row was already correct before
  this task started.

**Verification:** no network/npm access this session (same standing
limitation as the last two entries), so this was a code-inspection
check only, not a real render. By inspection: Payment methods' header
JSX and the CSS classes it references are byte-for-byte the same as
Categories'/Opening hours'/Service areas' header markup and classes —
no section-specific override exists that would make Payment methods'
header differ. Not checked (needs a real render): actual on-screen
wrap behavior at 320px with "Payment methods" + "Add payment method"
both present (8.2d-ii's own manual trace, cited in `.sectionHeader`'s
CSS comment, already covers this exact pairing and found it fits with
room to spare, but that was a manual trace too, not a render).

`docs/TASKS.md`: 10.5f-i-b checkbox ticked. Next: **10.5f-i-c** — "Add
payment method" moves onto `.addPill`, the longest label of the three
so far — check the wrap at 320px.

### Task 10.5f-i-c — Owner Restaurant: "Add payment method" onto `.addPill` (2026-09-22)

Third and last piece of 10.5f-i. Moves "Add payment method" onto the
shared `.addPill` class — same move "Add category" (10.5c-i-c) and
"Add area" (10.5e-i-c) already got. This is the fourth and last
"Add…" button on this page to move.

- `OwnerRestaurant.jsx`: the Payment methods header's button swaps
  `styles.addButton` for `styles.addPill`. Label text ("Add payment
  method") and `onClick={openAddPaymentMethod}` unchanged.
- `OwnerRestaurant.module.css`: no CSS change — `.addPill` already
  exists (10.5c-i-c). `.addButton` is now unused anywhere in this file
  (confirmed by grep); left in place for 10.5f-iii's own cleanup task
  to remove, same as `.section` was left in place after 10.5f-i-a.

**Wrap check at 320px (this task's specific ask, since "Add payment
method" is the longest of the three pill labels):** no network/npm
access this session, so this is a manual trace, not a real render —
same standing limitation as the last few entries. Reasoning:
- `.sectionHeader` is `display: flex; justify-content: space-between`
  with neither child forced `nowrap` (8.2d-ii's own finding, cited in
  that rule's CSS comment): the heading and the pill are both free to
  wrap or shrink rather than overflow the card.
- 8.2d-ii's finding specifically traced this exact pairing —
  "Payment methods" heading + "Add payment method" button — at 320px
  and found both shrink to their longest-word min-content (~75px +
  ~90px) well under the ~262px column width, with room to spare. That
  trace was against `.addButton` (`--space-md` horizontal padding,
  `--radius-md`); `.addPill` uses `--space-lg` padding instead (wider
  by `--space-lg` − `--space-md` per side) and a 44px `min-height`, so
  the pill sits a bit taller/wider than `.addButton` did, but the
  underlying text ("Add payment method", same longest word "payment")
  and the flex/wrap mechanics are unchanged — the label can still wrap
  onto two lines inside the pill if the pill's own width gets tight,
  the same way `.addPill`'s CSS comment (10.5c-i-c) documents "Add
  area" would.
- 10.5e-i-c's own real-render entry measured "Add area" at 94.9px wide
  (vs. "Add category" at 124.3px) — both comfortably inside a 320px
  viewport's padded content column. "Add payment method" is longer
  text than either, so it will render wider than both, but the same
  headroom 8.2d-ii already established for the *heading + button pair
  as a whole* (not just the button alone) means there's margin before
  this becomes a real overflow risk.
- Not checked (needs a real render, deferred until network/npm access
  is available): actual pixel width of "Add payment method" inside
  `.addPill` at 320px, whether it wraps to two lines, and whether that
  two-line height still clears the header's `gap`/`margin-bottom`
  cleanly. This is flagged as the least-confident verification in this
  session's run of entries, precisely because it's the case the task
  itself called out as worth extra scrutiny — a manual trace is a
  weaker substitute here than it was for 10.5f-i-a/b's changes.

`docs/TASKS.md`: 10.5f-i-c checkbox ticked, and with it 10.5f-i's
parent checkbox too — all three sub-items (a, b, c) are now done. Next:
**10.5f-ii** — restyle the payment-method rows (method/account line +
Active `ToggleSwitch` + Edit — no Delete, per Task 5.7's own deliberate
scope) and `EmptyState` copy, starting with **10.5f-ii-a** — row shell
(the reference shows a bordered inner box).

### Task 10.5f-ii-a — Owner Restaurant: Payment method row shell (2026-09-22)

First piece of 10.5f-ii. Gives Payment methods' rows their own scoped
class for the outer bordered box the reference shows around each row.

**Checked the reference first**, per this section's own established
habit (10.5e-ii-a's chip-color check, 10.5e-ii-b's link-color check):
pixel-zoomed `docs/reference_ui/phase10_owner_restaurant_reference.jpg`
around the Payment methods card. Unlike Categories'/Service areas' bare
chip-and-links rows (no box around the row itself, just the chip), the
"CBE / Hagelom - 0988416048" row sits inside a visibly bordered,
rounded, lighter box distinct from the card's own background — a
genuine visual difference this task's own `TASKS.md` line already
flagged ("the reference shows a bordered inner box").

- Turned out `.listRow` — the class this row already used — is already
  exactly that box: `border: 1px solid var(--color-border)`,
  `border-radius: var(--radius-md)`, `background: var(--color-surface)`,
  `padding: var(--space-md)`. Confirmed by grep that nothing else in
  `OwnerRestaurant.jsx` still uses `.listRow`, `.openingHoursRow`
  (5.5b) and now `.paymentMethodRow` are the only two row shells left
  with this recipe; Categories/Service areas moved to chip-shaped rows
  with no box (10.5c-ii-c/10.5e-ii-c) since the reference doesn't show
  one for those two cards.
- `OwnerRestaurant.jsx`: the payment-method `renderItem`'s outer `<div>`
  swaps `styles.listRow` for `styles.paymentMethodRow`. Inner
  `.listRowName`/`.listRowActions` are untouched — those are 10.5f-ii-b/
  d/e's own tasks.
- `OwnerRestaurant.module.css`: new `.paymentMethodRow`, a byte-for-byte
  duplicate of `.listRow`'s five declarations. **New class, not just
  leaving `.listRow` as-is** — even though `.listRow` had exactly one
  remaining call site, giving Payment methods its own name matches the
  "new class per section" convention every other 10.5c–f section
  already followed (`.categoryRow`, `.areaRow`), and means 10.5f-iii's
  cleanup pass can delete `.listRow` alongside `.section`/`.addButton`
  without needing to special-case a "still has one caller" class.
  Deliberately **no `flex-wrap`** added (unlike `.categoryRow`/
  `.areaRow`, which both needed it for their chip-shaped content):
  8.2d-ii's existing finding, cited in `.sectionHeader`'s own comment,
  already established that `.listRowName`/`.paymentMethodInfo`'s plain
  text shrinks and wraps *within* the row rather than needing the row
  itself to wrap — that reasoning carries over unchanged under the new
  name, so the row shell's layout behavior is unchanged, only the class
  name and comment are new.

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a), so no real render. What was
checked directly: the reference-image pixel-zoom above (a real, visual
check of the actual asset, not a code trace); a grep confirming
`.listRow` has zero remaining JSX call sites and `.paymentMethodRow`'s
declaration block is character-for-character identical to what
`.listRow` had. Not checked (needs a real render): actual on-screen
box appearance next to Categories'/Service areas' cards above it, and
whether the still-unmoved `.listRowActions`/`ToggleSwitch`+Edit content
inside the box looks right at narrow widths (that's 10.5f-ii-d/e's own
scope, not this task's).

`docs/TASKS.md`: 10.5f-ii-a checkbox ticked. Next: **10.5f-ii-b** —
method name + `account_name · account_number` line.

### Task 10.5f-ii-b — Owner Restaurant: Payment method name + account line (2026-09-22)

Second piece of 10.5f-ii. Restyles the method-name text ("CBE") and
checks the account line ("Hagelom · 0988416048") against the reference.

**Checked the reference first**, same habit this section has kept since
10.5e-ii-a: pixel-zoomed the Payment methods row. "CBE" renders bold and
dark; the account line renders smaller and gray, clearly secondary to
the name above it.

- `OwnerRestaurant.jsx`: the method-name `<span>` swaps
  `styles.listRowName` for `styles.paymentMethodName`. The account-line
  `<span>` keeps `styles.paymentMethodMeta` — that class already existed
  before this task (caption size, secondary color) and already matched
  the reference's gray/small treatment, so nothing needed to change
  there; verified by the same pixel-zoom rather than assumed.
- **Separator left unchanged.** The reference image's account line reads
  "Hagelom - 0988416048" (a plain hyphen), but the running code joins
  `account_name` and `account_number` with " · " (a middle dot) — and
  this task's own line in `TASKS.md` already documents the field as
  `account_name · account_number`, i.e. the real separator. A restyle
  task changes appearance, not data formatting; swapping the separator
  to match a static reference image's rendering would be a copy change
  outside this task's scope (and outside every other 10.5 task's
  "copy unchanged" rule), so it was left as " · ".
- `OwnerRestaurant.module.css`: new `.paymentMethodName` — same
  `font-family`/`font-size-body`/`color-text-primary` as `.listRowName`
  had (already correct), plus `font-weight: var(--font-weight-semibold)`
  (new), matching `.categoryChip`'s/`.areaChip`'s own weight choice for
  their name text. New class, not an edit to `.listRowName` — same
  "new class per section" convention `.paymentMethodRow` (10.5f-ii-a)
  just established. `.listRowName` now has no JSX call site (confirmed
  by grep) — left in place for 10.5f-iii, same as `.listRow`.

**Verification:** no network/npm access this session (same standing
limitation). What was checked directly: the reference-image pixel-zoom
above (visual, not a code trace) for both the name's weight and the
meta line's already-correct styling; grep confirming `.listRowName` is
now unused and `.paymentMethodName`'s only call site is the one JSX
edit made here. Not checked (needs a real render): actual computed
bold weight/color rendering in a browser, and whether the two-line
block (`.paymentMethodInfo`, `flex-direction: column`, unchanged) still
lines up correctly against the still-unmoved `ToggleSwitch`+Edit on the
right — that's 10.5f-ii-d/e's own scope.

`docs/TASKS.md`: 10.5f-ii-b checkbox ticked. Next: **10.5f-ii-c** —
optional `instructions` line, shown only when present (no reference —
match the secondary text style).

### Task 10.5f-ii-c — Owner Restaurant: optional instructions line (verify only, 2026-09-22)

Third piece of 10.5f-ii. Checked the optional `instructions` line
against this task's ask: shown only when present, styled to match the
existing secondary text.

- No reference image exists for this one — the reference row's payment
  method ("CBE") has no `instructions` value set, so there's nothing to
  pixel-zoom. The task's own wording anticipates this ("no reference —
  match the secondary text style"), so the bar is internal consistency,
  not a pixel match.
- The code already does both things this task asks for:
  `{paymentMethod.instructions && (...)}` — a plain conditional, nothing
  rendered when the field is empty/null, no invented placeholder text —
  and the `<span>` inside it already uses `.paymentMethodMeta`, the
  exact same class the account-name/account-number line above it uses.
  Same secondary text style, by construction, not by coincidence.
- **No code change made** beyond a clarifying comment — same outcome as
  10.5d-i-b/10.5e-i-b/10.5f-i-b's verify-only findings for other parts
  of this page.

**Verification:** code inspection only (same standing no-network
limitation as every entry this session). Confirmed by reading the JSX
directly rather than assuming: the conditional and the class were both
already exactly as this task specifies before today's session started.
Not checked (needs a real render, and a seeded payment method with a
non-empty `instructions` value): actual visual spacing between the
account line and the instructions line when both are present, and
whether long instructions text wraps cleanly inside
`.paymentMethodInfo`'s `min-width: 0` column.

`docs/TASKS.md`: 10.5f-ii-c checkbox ticked. Next: **10.5f-ii-d** —
Active `ToggleSwitch` + label placement.

### Task 10.5f-ii-d — Owner Restaurant: Active toggle + label placement (2026-09-22)

Fourth piece of 10.5f-ii. Checks and scopes the `ToggleSwitch` + Edit
container that sits on the right of each payment-method row.

**Checked the reference first**, same habit as every 10.5e/10.5f
pixel-check so far: zoomed into the row's right side. Left-to-right
order is toggle → "Active" label → "Edit" link, all on one line,
right-aligned as a group.

- Already correct, no reorder needed: `ToggleSwitch`'s own `label` prop
  (`ToggleSwitch.jsx`) renders the label text *after* the track, and
  the actions `<div>`'s `display: flex` already places the whole
  `ToggleSwitch` (track+label together) before the Edit button. Both
  match the reference's order as-is.
- `ToggleSwitch` itself — track/thumb colors, the label's font/color,
  the 44px-tall tap target — is Task 8.9a2's own shared, already-built,
  already-verified component (its own file header even predates this
  reference, noting it "wasn't in either reference image" at the time
  it was built; it is now, and matches without needing a change). Out
  of scope to re-touch for this one caller.
- `OwnerRestaurant.jsx`: the actions `<div>` swaps `styles.listRowActions`
  for `styles.paymentMethodActions`. The Edit `<button>` inside keeps
  `styles.linkButton` for now — that's 10.5f-ii-e's own job.
- `OwnerRestaurant.module.css`: new `.paymentMethodActions`, a
  byte-for-byte duplicate of `.listRowActions`'s three declarations
  (`display: flex`, `gap`, `flex-shrink: 0`). Same "new class per
  section" convention `.paymentMethodRow`/`.paymentMethodName` already
  set. `.listRowActions` now has no JSX call site (confirmed by grep)
  — left in place for 10.5f-iii, same as `.listRow`/`.listRowName`.

**Verification:** no network/npm access this session (same standing
limitation). What was checked directly: the reference-image pixel-zoom
above (visual) for order/placement; `ToggleSwitch.jsx`'s own source for
label-after-track confirmation; grep confirming `.listRowActions` is
now unused and `.paymentMethodActions` has exactly one call site. Not
checked (needs a real render): actual computed spacing/alignment
on-screen, and whether the "Active" label plus "Edit" link still fit
next to the toggle without wrapping at 320px (8.2d-ii's own finding,
cited in `.sectionHeader`'s CSS comment, already traced this exact
~95px `ToggleSwitch` floor plus Edit's own min-content and found it
fits, but that was a manual trace, not a render).

`docs/TASKS.md`: 10.5f-ii-d checkbox ticked. Next: **10.5f-ii-e** —
Edit link (no Delete, per Task 5.7).

### Task 10.5f-ii-e — Owner Restaurant: Payment method Edit link (2026-09-22)

Fifth piece of 10.5f-ii. Scopes the "Edit" link to its own class and
confirms there's no Delete button to restyle alongside it.

- `OwnerRestaurant.jsx`: the Edit `<button>` swaps `styles.linkButton`
  for `styles.paymentMethodEditLink`. `onClick`/label unchanged.
- **Confirmed no Delete exists**, rather than assumed: read the full
  `renderItem` block for payment methods — one action button only,
  "Edit". This matches Task 5.7's own doc comment (cited in this file's
  header block, and again in `TASKS.md`'s own line for this task):
  payment methods are deactivated via the `ToggleSwitch` (10.5f-ii-d),
  not deleted, a deliberate scope decision from that earlier task, not
  a gap this restyle task should fill. So there's no
  `.paymentMethodDeleteLink` to build — nothing on the "danger" side of
  `.categoryDeleteLink`/`.areaDeleteLink`'s pairing applies here.
- `OwnerRestaurant.module.css`: new `.paymentMethodEditLink`, a
  byte-for-byte duplicate of `.linkButton`'s eleven declarations. Same
  "new class per section" convention `.categoryEditLink`/`.areaEditLink`
  already used, for the same reason: `.linkButton` still backs the
  menu-management link (10.5g's own task, untouched), so it can't be
  edited directly here.

**Verification:** no network/npm access this session (same standing
limitation). What was checked directly: the full JSX for this row to
confirm exactly one action button exists; grep confirming
`.paymentMethodEditLink` has one call site and `.linkButton` still has
its remaining (menu-link) call site, unaffected. Not checked (needs a
real render): visual appearance next to Categories'/Service areas'
Edit links, and whether it still reads as "orange underlined text,
≥44px tap height" on an actual screen — the declarations are identical
to `.categoryEditLink`, which was itself real-render-verified in
10.5e-ii-b, so this is expected to match but unconfirmed by render.

`docs/TASKS.md`: 10.5f-ii-e checkbox ticked. Next: **10.5f-ii-f** —
per-row toggle error (`toggleErrors`).

### Task 10.5f-ii-f — Owner Restaurant: per-row toggle error restyle (2026-09-22)

Sixth piece of 10.5f-ii. Restyles the error shown when flipping a
payment method's Active toggle fails.

- Traced the real source: `toggleActivePaymentMethod`'s `catch` block
  sets `toggleErrors[paymentMethod.id]` to `err.message` when the
  server provides one, else falls back to the existing string "Could
  not update this payment method. Please try again." — both are real,
  pre-existing values; this task changes neither.
- `OwnerRestaurant.jsx`: the `<p>` rendering it swaps `styles.formError`
  for `styles.paymentMethodToggleError`; `role="alert"` and the message
  itself are unchanged.
- `OwnerRestaurant.module.css`: new `.paymentMethodToggleError`,
  `composes: formError` — same pattern `.categoryLoadError`/
  `.areaLoadError` already used. No `flex: 1 0 100%` needed (unlike
  `.openingHoursError`, 10.5d-ii-g): this error sits inside
  `.paymentMethodInfo`, a flex *column*, where every child already
  stacks top-to-bottom with nothing to share row-space with, unlike
  `.openingHoursRow`'s flex *row* of day/toggle/times/actions siblings.
- `.formError` itself is untouched and still has several other call
  sites on this page (the profile form, cover/logo upload errors,
  Payment methods' own section-level load error, the three modals'
  submit errors) — confirmed by grep before editing, not assumed.

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
reading `toggleActivePaymentMethod`'s source to confirm the copy this
task must leave unchanged; grep confirming `.formError` keeps its
other call sites and `.paymentMethodToggleError` has exactly one. Not
checked (needs a real render and a forced-failing PATCH): actual
on-screen appearance of the error inside the row, and whether it still
reads clearly stacked under the optional `instructions` line without
extra spacing looking wrong.

`docs/TASKS.md`: 10.5f-ii-f checkbox ticked. Next: **10.5f-ii-g** —
inline load error + `EmptyState` for the Payment methods list overall
(the section-level states, not this per-row one).

### Task 10.5f-ii-g — Owner Restaurant: Payment methods load error + EmptyState (2026-09-22)

Seventh and last piece of 10.5f-ii — closes out the whole sub-task.
Restyles Payment methods' section-level states: the "Couldn't load
payment methods…" error and the "No payment methods yet" `EmptyState`.
This is the one section where these two states were bundled into a
single task instead of split in two (10.5c-ii-d/e and 10.5e-ii-d/e each
gave them separate tasks); nothing else about the work differs.

- `OwnerRestaurant.jsx`: the load-error `<p>` swaps `styles.formError`
  for `styles.paymentMethodsLoadError`; `role="alert"` and the exact
  copy ("Couldn't load payment methods. Check your connection and try
  again.") are unchanged. The `EmptyState` gets a new
  `className={styles.paymentMethodsEmpty}`; `title`/`description` text
  unchanged.
- `OwnerRestaurant.module.css`: two new classes.
  - `.paymentMethodsLoadError`, `composes: formError` — same pattern
    `.categoryLoadError`/`.areaLoadError`/`.openingHoursLoadError`
    already used; this is the fourth and last of the page's four
    section-level load errors.
  - `.sectionCard .paymentMethodsEmpty { padding: var(--space-lg) 0; }`
    — same trim and two-class specificity reasoning as
    `.categoriesEmpty`/`.openingHoursEmpty`/`.areasEmpty`; the fourth
    and last card to get it.
  Both are straight copies of an already-established pattern, no new
  recipe invented.
- `.formError` remains untouched and still has other call sites
  (confirmed by grep): the profile form's error, cover/logo upload
  errors, and the three add/edit/delete modals' submit errors.

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
grepping both new classes' call sites (one each, as expected) and
confirming `.formError`'s remaining call sites are unaffected. Not
checked (needs a real render, and a mocked `/api/payment-methods` 500 +
empty response): actual visual match against Categories'/Opening
hours'/Service areas' equivalent states side by side — expected to be
identical, since all four now use the identical `composes: formError`/
`padding: var(--space-lg) 0` recipes, but unconfirmed by render.

`docs/TASKS.md`: 10.5f-ii-g checkbox ticked, and with it 10.5f-ii's
parent checkbox too — all seven sub-items (a–g) are now done, closing
out the payment-method row restyle. Next: **10.5f-iii** *(added —
cleanup)* — remove `.section`, `.addButton`, `.listRow`, `.listRowName`,
`.listRowActions`, `.linkButton` (if now fully unused) and any other CSS
no longer referenced after 10.5c–f (grep to confirm before deleting —
`.linkButton` specifically still backs the menu-management link, so it
is expected to survive this cleanup unless that link also moves first).

### Task 10.5f-iii — Owner Restaurant: dead-CSS cleanup after 10.5c–f (2026-09-22)

Cleanup task, not a restyle: 10.5c–10.5f each left its predecessor
class in place rather than editing it (the "new class per section"
convention this whole split has used, so each section's own task never
risked leaking into a section it didn't own). With all four cards
(Categories, Opening hours, Service areas, Payment methods) now moved
onto their own scoped classes, this task removes what's left unused.

- **Method:** listed every top-level class selector in
  `OwnerRestaurant.module.css` (69 before this task) and grepped
  `OwnerRestaurant.jsx` for each one's `styles.<name>` call sites — a
  script, not manual inspection, so nothing was missed or kept on a
  guess. One false hit needed a second look: `styles.section` appears
  once in the file, but only inside a JSX comment (the 10.5f-i-a
  note), not a real `className` — confirmed by reading that line
  directly.
- **Removed (five classes, all zero real call sites):**
  - `.section` — the pre-`.sectionCard` wrapper `.form`'s neighbour
    sections used; every section had already moved off it (10.5c-i-a,
    10.5d-i-a, 10.5e-i-a, 10.5f-i-a).
  - `.addButton` — the pre-`.addPill` "Add …" button style; every
    section's Add button had already moved off it (10.5c-i-c,
    10.5e-i-c, 10.5f-i-c).
  - `.listRow`, `.listRowName`, `.listRowActions` — the shared
    pre-scoped row/name/actions triplet Payment methods was the last
    user of; 10.5f-ii-a/b/d moved its row, name and actions onto
    `.paymentMethodRow`/`.paymentMethodName`/`.paymentMethodActions`
    respectively (byte-for-byte identical declarations in each case,
    so no visual change from this removal).
- **Also removed, beyond `docs/TASKS.md`'s note — `.linkButtonDanger`:**
  not named in the task's own list, but the same grep sweep showed zero
  `styles.linkButtonDanger` call sites. Traced why: it used to back
  Categories' and Service areas' Delete links, but those moved onto
  their own scoped classes in 10.5c-ii-b (`.categoryDeleteLink`) and
  10.5e-ii-b (`.areaDeleteLink`) — both full property duplicates, not
  `composes`, so `.linkButtonDanger` kept compiling but stopped being
  referenced. Payment methods never had a Delete link at all (Task
  5.7's deliberate deactivate-via-`ToggleSwitch` scope), so there was
  no third caller to lose. Removed alongside the other five.
- **Checked and kept — `.linkButton`:** still has one real call site
  (the "manage your foods" link, 10.5g's own scope, untouched by this
  task) — confirmed live, left in place exactly as `docs/TASKS.md`'s
  note anticipated.
- **Not touched — `.subheading`:** has one real call site today (the
  page's `<h1>` area) but 10.5g-i's own task note already flags it for
  a first-check before that task reuses or drops it; deciding that here
  would be scope creep into a task this one isn't.
- Deleted each dead rule's block comment along with the rule itself
  where the comment was *about* that dead rule specifically (e.g. the
  `.listRow`/`.listRowName`/`.listRowActions` "left in place for
  10.5f-iii" notes, now resolved); updated the two comments above
  `.sectionCard` and `.addPill` that explained *why* `.section`/
  `.addButton` still existed, so they now read as closed history
  instead of a forward-looking "until 10.5f-iii" pointer. Left older,
  now-stale task-history comments alone where they're just narrating
  what a *past* task did (e.g. 10.5c-ii-b's own comment still says
  `.linkButton`/`.linkButtonDanger` "still serve Opening hours' Save
  link, Payment methods' Edit link" — true when *that* task was
  written, superseded since by 10.5d-ii-g/10.5f-ii-e, and left as-is
  the same way this file's other per-task comments stay frozen at the
  moment they were written, rather than being kept continuously
  up to date).
- No JSX changes: this task only removes CSS that JSX had already
  stopped referencing; nothing in `OwnerRestaurant.jsx` needed editing.

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
a script-driven grep of every top-level class selector in the stylesheet
against every `styles.<name>` call site in the JSX, both before removal
(to build the exact removal list — zero manual guessing) and after (to
confirm the remaining 63 classes all still have at least one real call
site, and that the five-plus-one removed classes have none); a
brace-balance check on the edited CSS file (78 open / 78 close, matched
before and after); and confirming every remaining `composes: formError`
target (`.formError` itself) is untouched and still exists. Not checked
(needs a real build): that `npm run build`/the dev server still compile
this CSS Modules file cleanly — no syntax was touched beyond deleting
whole rules and editing comments, so this is expected to be safe, but
unconfirmed by an actual build in this session.

`docs/TASKS.md`: 10.5f-iii checkbox ticked. This closes out the whole
10.5c–10.5f card-restyle arc (Categories, Opening hours, Service areas,
Payment methods) with no leftover dead CSS. Next: **10.5g** — restyle
the "Menu management — manage your foods" note at the foot of the page
(10.5g-i's own first step: check whether `.subheading` is used anywhere
else on the page before deciding how to treat it).

### Task 10.5g-i — Owner Restaurant: "Menu management" strip container restyle (2026-09-22)

First of three 10.5g sub-tasks. Restyles the container of the "Menu
management — manage your foods (adding/editing a food lands here in a
later task)." note at the foot of the page into the soft tinted,
rounded, full-width strip the reference shows
(`docs/reference_ui/phase10_owner_restaurant_reference.jpg`, bottom of
the page) — container only, not the link inside it or the copy.

- **Check-first, per the task's own note:** grepped `.subheading` across
  `OwnerRestaurant.jsx` and found exactly one call site — this `<p>`
  itself. CSS Modules scope per file, so no other page can reference it
  either. That means this is the one place in the whole 10.5c–10.5g arc
  where editing the shared class *in place* is safe — every earlier
  section (`.section`, `.addButton`, `.listRow`/`.listRowName`/
  `.listRowActions`) needed a new scoped class instead, specifically
  because each still had other real callers mid-migration. `.subheading`
  never did, so there's no equivalent risk here and no new class was
  added.
- **Color:** pixel-sampled the reference strip (Python/Pillow, same
  method `docs/DESIGN_TOKENS.md` and this file's own `.areaChip` comment
  already used) — median `#F3F6FB` over a clean patch of the strip,
  landing in the same `#eef1f5`–`#f4f6f6` JPEG-noisy cluster
  `.areaChip`'s comment already mapped to the existing
  `--color-surface-muted` token. No new color introduced.
- **Recipe:** rather than inventing a new "tinted strip" shape from
  scratch, reused `OwnerDashboard.module.css`'s existing
  `.salesTotal`/`.salesCompleted` pattern (Task 10.3e-i/ii) —
  `background: var(--color-surface-muted)`, `border-radius:
  var(--radius-lg)`, `padding: var(--space-md) var(--space-lg)` — the
  same established "soft tinted callout block" recipe elsewhere in this
  codebase, not `.sectionCard`'s white-card/border/shadow treatment
  (the reference strip has a flat fill and no visible border or shadow,
  confirmed by the same pixel check).
- **No icon:** the reference draws a small gear icon beside the text,
  but per 10.5c-i's own split note the governing rule drops every icon
  without a real codebase counterpart — the same call already made for
  all four section-card headers above. Not revisited here.
- `margin: var(--space-xl) 0 0` (the gap from Payment methods above)
  carried over unchanged — this task doesn't own that spacing decision,
  same "leave what you don't own" convention 10.5b-i set.
- No `box-sizing`/explicit width added: the `<p>` is a plain block
  element with an auto content width, so the new padding is absorbed
  into that automatic width the same way `.page`'s own padding already
  is — no percentage-width overflow case like `.form`'s to guard
  against.
- No JSX change: the element already used `className={styles.subheading}`,
  so only the CSS rule itself changed.

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
the `.subheading` call-site grep (one, confirmed); the reference-image
pixel sample (Python/Pillow, median over a 80×20px clean patch of the
strip, cropped and re-viewed at 2x to confirm the sampled region was the
strip and not the white page background above/below it); and a
brace-balance check on the edited CSS (78/78, matched). Not checked
(needs a real render): on-screen appearance at 320px and other
breakpoints, and a direct side-by-side against the reference's strip —
expected to match closely since the recipe is a straight reuse of
`OwnerDashboard`'s own tinted block, but unconfirmed by render; that's
10.5i's job, same as every other section on this page.

`docs/TASKS.md`: 10.5g-i checkbox ticked. Next: **10.5g-ii** — restyle
the "manage your foods" link itself (still the same real `Link` to
`/owner/restaurant/menu`).

### Task 10.5g-ii — Owner Restaurant: "manage your foods" link restyle (2026-09-22)

Second of three 10.5g sub-tasks. Restyles the `Link` to
`/owner/restaurant/menu` inside the "Menu management" note
(10.5g-i's own strip container).

- **New class, not an edit to `.linkButton`:** `.linkButton` had exactly
  one call site left in this file after 10.5f-iii (this link) —
  structurally the same situation `.subheading` was in before 10.5g-i
  edited it in place. The two classes got different treatment on
  purpose: `.subheading` was always this note's own container, with no
  identity beyond it, so repurposing it in place carried no risk.
  `.linkButton` is different — the Task 8.9a2 comment above it ties it
  by name to `OwnerMenu.module.css`'s own `.linkButton`, i.e. this
  codebase already treats the name as a shared template pattern to
  duplicate from (exactly what `.categoryEditLink`/`.areaEditLink`/
  `.paymentMethodEditLink` each already did, even though every one of
  them was also a byte-for-byte duplicate with zero property changes).
  Keeping that convention here means `.linkButton` stays untouched as
  the template, and the real, final call site moves onto its own
  `.menuManagementLink`.
- **The one real property change — `font-size`:** `.menuManagementLink`
  is identical to `.linkButton` except `font-size: var(--font-size-
  body)` in place of `var(--font-size-caption)`. Reasoning is
  typographic, not a pixel measurement: this link sits inline inside a
  sentence of `.subheading`'s own body-size text ("Menu management —
  *manage your foods* (adding/editing…)"), unlike every other link this
  page uses `.linkButton`-style treatment for (Edit/Delete/Save), which
  are standalone row actions, not words embedded mid-sentence. An inline
  link conventionally reads at its sentence's own size rather than
  dropping to a smaller caption size mid-line.
  - **What pixel-checking could and couldn't settle:** attempted the
    same Python/Pillow measurement method this file's other tasks have
    used, isolating word-height bounding boxes for "Menu"/"management"
    (definitely body-size, from `.subheading`'s own static text) versus
    "manage your foods" (the link) and the trailing parenthetical.
    Measured heights landed in the same 6–8px band across all of them
    at this image's resolution (597px wide, individual letters only
    ~6-8px tall) — not enough resolution to distinguish a 12px/14px
    (≈15%) difference with any confidence, unlike `.areaChip`'s
    background-color check earlier in this file, which had a wide flat
    color region to sample cleanly. Documented as a judgment call for
    the same reason `.categoryChip`'s font-weight was one: "the stroke
    width doesn't clearly separate regular from semibold" there;
    "the letter heights don't clearly separate 12px from 14px" here.
  - Color, weight, underline, `min-height: 44px`, and `display:
    inline-flex` all carried over unchanged from `.linkButton` — the
    reference's link color already matches the existing orange, and
    nothing about a font-size-only change touches the Task 8.9a2
    tap-target floor, which still applies to this link exactly as it
    did before.
- **`.linkButton` flagged, not deleted:** removing it now would be
  scope creep into a separate cleanup step, the same reasoning that kept
  10.5f-i-c from also deleting `.addButton` on the spot. Added
  `10.5g-iv` *(added — cleanup)* to `docs/TASKS.md`, matching the exact
  sequence `.section`/`.addButton`/`.listRow` family went through
  (flagged across several tasks, removed together in 10.5f-iii) — grep
  confirms `.linkButton` has zero call sites in this file as of this
  task, same confirmation method.
- `OwnerRestaurant.jsx`: the one line changed is the `Link`'s
  `className`, `styles.linkButton` → `styles.menuManagementLink`; the
  `to` prop, the wrapping `<p className={styles.subheading}>`, and the
  surrounding copy are all untouched (still `/owner/restaurant/menu`,
  still 10.5g-i's/10.5g-iii's own scope respectively).

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
grepping `.linkButton`'s call sites before and after (one → zero) and
`.menuManagementLink`'s (zero → one); the word-height pixel measurement
described above, including re-cropping and re-viewing the region at 3x
to confirm the x-ranges measured actually corresponded to the words
named; and a brace-balance check on the edited CSS (79/79, matched
before and after). Not checked (needs a real render): whether
`.subheading`'s line actually looks right with the link at body size
next to the parenthetical's own (unchanged, still-caption-adjacent-
looking-but-actually-inherited-body-size — it was never explicitly
sized, so it inherits `.subheading`'s 14px) text — expected to read as
one consistent sentence now, but unconfirmed by render; also unconfirmed
whether `inline-flex` + `min-height: 44px` on a now-body-sized inline
link causes any visible line-height unevenness inside the paragraph at
narrow widths — flagged for 10.5i's real-render pass, same as every
other open visual question on this page.

`docs/TASKS.md`: 10.5g-ii checkbox ticked. Next: **10.5g-iii** —
decide whether to keep or drop the stale "(adding/editing a food lands
here in a later task)" text (default: keep verbatim, restyle only).

### Task 10.5g-iii — Owner Restaurant: stale footer-text decision (2026-09-22)

Third of three 10.5g sub-tasks — a decision task, not a restyle. The
"(adding/editing a food lands here in a later task)" parenthetical was
accurate when first written but `OwnerMenu`/`AddFood` (Task 5.9b) have
since shipped, so the task's own note flags it as stale and asks for a
keep-vs-drop call.

- **No project-owner input was given this session**, so the task's own
  stated default applies: **kept verbatim.** Not treated as silently
  resolved — the staleness is confirmed and logged below rather than
  glossed over, in case a project-owner decision to drop it comes later.

  **Update, 2026-09-22:** the project owner has since weighed in directly
  and confirmed option (a) — keep the text verbatim. This is no longer a
  default taken in the absence of input; it's now a deliberate call. No
  code change (none was made under the default either).
- **Confirmed the staleness is real, not assumed:** checked
  `frontend/src/App.jsx`'s routes directly — `/owner/restaurant/menu`
  renders `OwnerMenu`, and both `/owner/restaurant/menu/new` and
  `/owner/restaurant/menu/:id/edit` render `AddFood` (the same component
  handling both add and edit, per that route's own doc comment). Both
  "later task[s]" the sentence refers to have, in fact, already landed.
- **Verify only — no code change:** the parenthetical is plain text
  inside `<p className={styles.subheading}>`, no `span`/class of its
  own, so it has never had independent styling to restyle. It already
  inherits `.subheading`'s `font-size`/`color` — both were already set
  before 10.5g-i (that task only added the container's padding/radius/
  background, not the text properties), so nothing about 10.5g-i or
  10.5g-ii left this text out of step with the new card treatment.
  Matches the reference, which shows this exact sentence too (the
  task's own note already points this out).

**Verification:** no network/npm access this session (same standing
limitation as every entry since 10.5f-i-a). What was checked directly:
reading `App.jsx`'s route table for the two paths the sentence
references, and re-reading the `<p>`'s JSX to confirm the parenthetical
carries no class or inline style of its own. Not checked (needs a real
render): the final on-screen look of the whole sentence — now a mix of
static text (`.subheading`), a body-size link (`.menuManagementLink`,
10.5g-ii) and more static text — inside the new tinted strip (10.5g-i);
flagged for 10.5i's real-render pass along with every other open visual
question on this page.

`docs/TASKS.md`: 10.5g-iii checkbox ticked. `10.5g-i`/`ii`/`iii` (the
three restyle sub-items) are now all done, but `10.5g`'s own parent
checkbox stays open until `10.5g-iv` *(added — cleanup, from 10.5g-ii)*
— removing the now-dead `.linkButton` — is also done, same convention
`10.5f-iii` followed for the `.section`/`.addButton` family. Next:
**10.5g-iv**, or **10.5h** — the avatar-only header decision (drop
search/bell/chevron, keep a plain-letter `/owner/account` link),
starting with `10.5h-i`'s *verify only* check of what `GET /auth/me`
returns.

### Task 10.5g-iv — Owner Restaurant: remove dead `.linkButton` (2026-09-22)

Cleanup task flagged by 10.5g-ii's own comment, same "leave it, flag
it, clean it up as its own task" sequence the `.section`/`.addButton`/
`.listRow` family went through before `10.5f-iii` removed them.

- **Reconfirmed by grep before deleting**, per the task's own
  instruction: `grep -n "styles\.linkButton\b"` and a broader
  `className.*linkButton` sweep of `OwnerRestaurant.jsx` both came back
  empty — every remaining `linkButton` hit in the file is inside a
  comment, not a `className`. `.linkButton` had no live call site left.
- **Removed the `.linkButton` rule** from `OwnerRestaurant.module.css`
  and replaced its (now-obsolete) long comment with a short epitaph —
  same pattern `.linkButtonDanger`'s own removal (`10.5f-iii`) used —
  noting where its last call site moved to (`.menuManagementLink`,
  `10.5g-ii`) and which task removed it.
- **Follow-on fix, same file:** the block comment above `.subheading`
  (written at `10.5g-i`, before `10.5g-ii` existed) still named
  `.linkButton` as backing the "manage your foods" link. Left as-is it
  would now point at a deleted class, so it's updated to name
  `.menuManagementLink` instead and note the rename/removal history —
  a documentation fix, not a style or behavior change.
- **Not touched:** every other `.linkButton` mention in this file is a
  comment describing past decisions (why `.categoryEditLink`/
  `.areaEditLink`/`.paymentMethodEditLink` each duplicated it instead of
  editing it, why `.linkButtonDanger`'s own epitaph mentions it, the
  `.sectionHeading` split-note's "new class per section" list). Those
  are historical record of a class that *used to* exist here, same as
  `.linkButtonDanger`'s own comments still read after its removal in
  `10.5f-iii` — left alone rather than rewritten, since rewriting
  every past-tense mention would erase the trail 10.5f-iii/10.5g-ii/
  10.5g-iv's own comments rely on to explain themselves.
- `OwnerMenu.module.css`'s own `.linkButton` (a different file, its
  own class, referenced only for shared history in the 8.9a2 comment
  this task removed) is untouched — out of this task's scope, still
  has real call sites on that page.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`). What was checked
directly: the two greps above (before deleting) and a re-read of the
edited CSS file to confirm no other rule referenced `.linkButton` as a
selector (only in comments, which is expected and fine). Not checked
(needs a real render): visual output is unaffected by this task by
construction — no selector any element resolves to was touched — so
no render-diff was run; `10.5i`'s pass will cover this page's final
look regardless.

`docs/TASKS.md`: 10.5g-iv checkbox ticked. That closes out `10.5g`'s
own parent checkbox — `10.5g-i` through `10.5g-iv` are all done. Next:
**10.5h** — the avatar-only header decision (drop search/bell/chevron,
keep a plain-letter `/owner/account` link), starting with `10.5h-i`'s
*verify only* check of what `GET /auth/me` returns.

### Task 10.5h-i — Owner Restaurant: verify `GET /auth/me`'s shape (2026-09-22)

First of 10.5h's sub-tasks, and verify-only per its own description —
confirming the avatar-initial's data source is real before any of
10.5h-ii onward writes code against it.

- **Route:** `GET /api/auth/me` (`backend/src/routes/auth.routes.js`)
  → `authMiddleware` → `me` (`backend/src/controllers/authController.js`).
  `authMiddleware` itself does the only DB read here (`users.findById`
  on the JWT's `sub`) and attaches the result as `req.user`; the `me`
  handler does no query of its own, just `res.json({ user: req.user })`.
- **Shape attached to `req.user`:** `toPublicUser(user)` — the full
  `users` row minus `password_hash` (the one field explicitly
  destructured off and dropped, `authController.js` line ~81). Cross-
  checked against both the row `users.findById` actually returns
  (`crudFactory`-backed, no column allowlist of its own) and the
  table's real columns (`backend/migrations/0006_users_restaurants.up.sql`,
  matching `docs/DB_SCHEMA.md`'s own `users` table): `id`, `role`
  (`'owner'`/`'admin'`), `full_name`, `email`, `phone`, `created_at`,
  `updated_at`. No `password_hash` reaches the client at any of the
  three call sites that use `toPublicUser` (signup, login, `me`) — same
  helper, reused rather than re-implemented, per that function's own
  comment.
- **Answers the task's question:** yes — `full_name` and `email` are
  both real, always-present (`NOT NULL` in the migration) columns on
  the response `GET /auth/me` returns today. Either is a real source
  for a single-letter initial; no placeholder/invented field needed.
- **Existing callers of this endpoint, for context (not this task's
  scope to change):** `OwnerDashboard.jsx`'s own header comment notes
  it deliberately *doesn't* call `GET /auth/me` and falls back to
  `DashboardHeader`'s default "Account" label instead; `OwnerAccount.jsx`
  and `AdminAccount.jsx` do call it. No existing avatar-circle-with-
  initial component was found anywhere in the codebase (grepped
  `initial`/`Initial`/`avatar`/`Avatar` across `frontend/src` — the only
  hits are unrelated: `ListWithPagination`'s pagination-state variable
  and an unrelated code comment in `OwnerRestaurant.jsx`). `10.5h-iv`
  onward will be building this treatment fresh, not adapting an
  existing one.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`) — nothing here needed a
running server, though: read `auth.routes.js`, `authController.js`
(`me`, `toPublicUser`), `authMiddleware.js`, the `users` migration, and
`docs/DB_SCHEMA.md`'s `users` section directly, and grepped the
frontend for any existing avatar/initial precedent. Not checked (no
server running): an actual live request/response — the field list
above is read from source, not observed over the wire, but the source
is unambiguous (a straight object-destructure, no conditional field
inclusion) so there's no branch a live call could reveal that the code
doesn't already show.

`docs/TASKS.md`: 10.5h-i checkbox ticked. Next: **10.5h-ii** — add an
independent `useApiQuery` for `GET /auth/me` on this page (no render
yet, per that task's own scope).

### Task 10.5h-ii — Owner Restaurant: independent `GET /auth/me` query (2026-09-22)

Second of 10.5h's sub-tasks. Adds the data source 10.5h-i verified is
real; still no render — that's 10.5h-iii (fallback derivation) and
10.5h-iv (the actual `<Link>`)'s job.

- **`fetchMe(signal)`** added to `OwnerRestaurant.jsx`, same local,
  duplicated-not-shared shape `OwnerAccount.jsx`/`AdminAccount.jsx`
  each already define for themselves: `api.get('/auth/me', { signal
  }).then((data) => data.user)`, unwrapping the `{ user }` envelope so
  the hook's own `data` is the user row directly.
- **Wired to its own `useApiQuery(fetchMe, [])` call**, named `me`,
  placed right after the page's existing `useApiQuery(fetchMyRestaurant,
  [])` + `useMutation(updateMyRestaurant)` pair. Deliberately its own
  hook call rather than folded into `fetchMyRestaurant`'s: that query's
  `loading`/`error` already drive the whole page's loading/error/empty
  states (`data === null` gates the entire form below), so combining
  the two would mean an `/auth/me` failure could blank a screen whose
  main content — the restaurant profile — has nothing to do with the
  header avatar. Two independent `useApiQuery` calls means each fails
  on its own; this page already establishes that pattern for Opening
  hours (`fetchOpeningHours`, its own independent call further down),
  so `me` isn't a new pattern, just one more instance of it.
- **`me` (the `data` field) is not read anywhere yet** — only
  destructured, no JSX/logic uses it. Deliberate: this task's own scope
  is "no render yet." `loading`/`error`/`refetch` weren't destructured
  at all (`const { data: me } = useApiQuery(...)`) since nothing needs
  them until 10.5h-iii decides what a failure/loading state looks like
  for this one small element.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so this wasn't exercised
against a running dev server. Checked instead: re-read `useApiQuery.js`
to confirm a second, independent call really does isolate failures
(separate `mountedRef`/`latestRequestRef`/`AbortController` per call,
nothing shared across hook instances) — confirming the reasoning above
isn't just assumed. Also checked for an ESLint config that might flag
`me` as an unused variable (`frontend/package.json` has no `lint`
script and no `.eslintrc`/`eslint.config.*` exists anywhere in the
repo — Task 0.16's CI lint step, if it runs at all today, isn't wired
to this project the way the task list's phrasing implies), so an
unused destructure isn't expected to break anything. Not checked (needs
a real render): the network tab actually showing the request fire, and
what it looks like while `me`'s `loading` is true — both out of scope
for a "no render yet" task and left for 10.5h-iii onward.

`docs/TASKS.md`: 10.5h-ii checkbox ticked. Next: **10.5h-iii** — initial
derivation with a real fallback (name → email → a plain "Account" text
link, never a fake letter).

### Task 10.5h-iii — Owner Restaurant: initial derivation + fallback (2026-09-22)

Third of 10.5h's sub-tasks — the derivation logic itself, still no
render (that's 10.5h-iv).

- **`deriveAccountInitial(user)`** added next to `fetchMe`: reads
  `user?.full_name || user?.email`, trims it, and returns its first
  character uppercased — or `null` if that trimmed source is empty.
  `null` is the "no real letter" signal 10.5h-iv will read to fall back
  to the plain "Account" text link the task calls for, rather than
  guessing or defaulting to a placeholder character. Order follows the
  task's own wording literally: `full_name` tried first, `email` second.
- **Both columns are `NOT NULL`** (`users.full_name`/`users.email`,
  `backend/migrations/0006_users_restaurants.up.sql`, confirmed again
  during 10.5h-i), so the `email` branch and the empty-string `null`
  case are both effectively unreachable *once `me` has loaded* — kept
  anyway, since "never a fake letter" is a correctness property that
  should hold for every shape the data could theoretically take, not
  just the shape it happens to take today, and a blank/whitespace-only
  name is possible in principle even if the schema doesn't allow it at
  the DB layer without an app-level check that isn't this task's scope
  to add.
- **The `me === null` case** — true while `fetchMe` (10.5h-ii) is still
  loading, or if it errored — is handled by the same line: `user?.
  full_name` on a `null` user is `undefined`, short-circuits to
  `user?.email` (also `undefined`), the `|| ''` fallback makes the
  source an empty string, and `.trim()` of that is still falsy, so the
  function returns `null`. No separate branch needed for "no `me` yet"
  vs. "`me` loaded but blank" — same outcome, same reason (nothing real
  to derive from), same "don't invent a placeholder while real data
  hasn't arrived" instinct `OwnerAccount.jsx`'s own `values` (starts
  `null`) already follows.
- **Computed in the component** as `const accountInitial =
  deriveAccountInitial(me);`, plain (not `useMemo`) — one `?.`/`.trim()`/
  character read per render is cheap enough not to need memoizing, same
  judgment call this file already makes for its other small per-render
  derivations. Not read in any JSX yet — that's 10.5h-iv's own scope,
  same "compute now, render later" split 10.5h-ii's query vs. this
  task's derivation already follows.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so `me`'s actual shape
wasn't observed live — traced by hand instead: `full_name`/`email` both
present and non-blank (the normal case) → first letter of `full_name`;
`me === null` (loading/error) → `null`; a hypothetical blank
`full_name` with a real `email` → first letter of `email`; a
hypothetical blank `full_name` *and* blank `email` → `null`. All four
match the task's stated chain. Not checked (needs a real render): the
actual on-screen result — 10.5h-iv/10.5i cover that.

`docs/TASKS.md`: 10.5h-iii checkbox ticked. Next: **10.5h-iv** — render
`accountInitial` as a `<Link to="/owner/account">` circle with the
letter (falling back to the plain "Account" text link when it's
`null`).

### Task 10.5h-iv — Owner Restaurant: account link markup (2026-09-22)

Fourth of 10.5h's sub-tasks — the two possible shapes of the link
itself, built as a local element and not yet inserted into the return
tree. Same "build now, place later" split `10.5h-ii`'s query and
`10.5h-iii`'s derivation already followed; `10.5h-v` decides *where*
this renders, `10.5h-vi` gives it its actual look.

- **`accountLink`**, computed right after `accountInitial`:
  `accountInitial ? <Link ...>{accountInitial}</Link> : <Link ...>
  Account</Link>` — a lettered circle when there's a real letter
  (`10.5h-iii`'s non-`null` case), the plain "Account" text link the
  task's own wording calls for otherwise. Both branches point at
  `/owner/account` — the same route `OwnerAccount.jsx` already mounts
  at (confirmed against `frontend/src/App.jsx`'s route table), so
  neither is a placeholder destination.
- **Two classNames referenced, neither styled yet**:
  `styles.accountAvatar` (the circle branch) and
  `styles.accountFallbackLink` (the text-link branch). Both are new,
  undefined keys in `OwnerRestaurant.module.css` as of this task — a
  CSS Modules import returns `undefined` for a key with no matching
  rule, which React treats as "no class," so both branches render as
  plain unstyled text today. That's expected and left alone: `10.5h-vi`
  is explicitly scoped to the "orange circle, white letter, ≥44px tap
  target" styling, so adding it here would be doing that task's work
  early.
- **`aria-label="Account"` on the circle branch only.** The circle's
  only visible content is a single letter, which tells a screen-reader
  user nothing about the link's destination on its own; the fallback
  branch already has "Account" as real visible text, so it needs no
  separate label (an `aria-label` duplicating visible text would be
  redundant, not helpful).
- **`accountLink` itself is not read in any JSX yet** — same
  "compute/build now, place later" reasoning as `me`/`accountInitial`
  before it. `10.5h-v` is what actually inserts `{accountLink}` into
  the page.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so this wasn't rendered.
Checked instead: `Link` is already imported at the top of this file (no
new import needed); `/owner/account` matches `OwnerAccount`'s real
mounted route in `App.jsx`; both `accountInitial ? ... : ...` branches
read correctly against `10.5h-iii`'s own four traced cases (real
letter → circle with that letter; `null` → fallback text link, in
every one of loading/error/blank-name-and-email). Not checked (needs a
render): the actual unstyled-text appearance described above — expected
given `10.5h-vi` hasn't run yet, and left for `10.5i`'s full pass along
with everything else on this page.

`docs/TASKS.md`: 10.5h-iv checkbox ticked. Next: **10.5h-v** — place
`{accountLink}` at the right end of the `<h1>Restaurant</h1>` row
(placement assumed by the task's own wording — confirm it's actually
right before building on it).

### Task 10.5h-v — Owner Restaurant: account link placement (2026-09-22)

Fifth of 10.5h's sub-tasks — where `accountLink` (10.5h-iv) actually
renders. The task's own wording flags the `<h1>` row as an assumption,
not a settled call, so this confirms it before wiring it in.

- **Checked the assumption against the reference first**
  (`docs/reference_ui/phase10_owner_restaurant_reference.jpg`): the
  avatar there sits inside a full search-input + bell + avatar top bar
  *above* the hero image, not next to a "Restaurant" heading — that
  heading doesn't even appear in the reference at all. So the reference
  itself doesn't literally support "next to `<h1>Restaurant</h1>`."
- **Checked what actually exists in this codebase instead**: grepped
  this file for `SearchBar`/bell/topbar markup — none exists, matching
  10.5h's own parent decision (drop search/bell/chevron; keep only the
  avatar) and its own note that none of the three ever had real backing
  behavior on this page. There is no dedicated top-bar row anywhere in
  `OwnerRestaurant.jsx` for the avatar to join.
- **Conclusion: the `<h1>Restaurant</h1>` row is confirmed, not because
  it matches the reference pixel-for-pixel (it can't — the reference
  never puts the two together), but because it's this page's only
  existing header-level row and therefore the most reasonable real
  anchor available, not an invented one.** This is a placement judgment
  call the reference can't settle either way — flagged as such rather
  than presented as a measurement.
- **Implementation:** new `<div className={styles.headingRow}>`
  wrapping both the existing `<h1>` and `{accountLink}`; `display: flex`,
  `align-items: center` (keeps a short heading and a circular avatar
  vertically centered on each other), `justify-content: space-between`
  (pushes the link to the row's right end). `.heading`'s former
  `margin: 0 0 var(--space-lg)` moved onto `.headingRow` — `.heading`
  has exactly one call site in this file (confirmed by grep, same check
  every "edit in place vs. new class" decision this file makes runs
  first — `.subheading` at 10.5g-i is the most recent example) — so the
  spacing before the hero stays fixed regardless of which child ends up
  taller, rather than `.heading`'s own margin creating an
  avatar-height-dependent gap.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so the row wasn't
rendered. Checked instead: re-viewed the reference image directly to
confirm what it does/doesn't show near the avatar; re-grepped this file
for any search/bell/topbar markup (none, as expected); re-grepped for
`styles.heading` call sites (still exactly one, so editing its margin
in place is safe). Not checked (needs a real render): actual visual
balance of the row at narrow widths — flagged for `10.5i`'s pass, though
a short heading plus a small circular/text link has no realistic
overlap risk at this page's supported breakpoints.

`docs/TASKS.md`: 10.5h-v checkbox ticked. Next: **10.5h-vi** — style
`.accountAvatar`/`.accountFallbackLink`: orange circle, white letter,
≥44px tap target.

### Task 10.5h-vi — Owner Restaurant: account link styling (2026-09-22)

Sixth of 10.5h's sub-tasks — the actual look for the two branches
`accountLink` (10.5h-iv) can take, placed by `.headingRow` (10.5h-v).

- **`.accountAvatar` (circle branch):** `width`/`height: 44px`,
  `border-radius: 50%`, `background: var(--color-primary)`
  (`#F2690C`), `color: var(--color-text-on-primary)` (`#ffffff`) —
  both existing tokens (`docs/DESIGN_TOKENS.md` /
  `frontend/src/styles/global.css`), not new colors picked for this
  task. Flex-centered so the single letter sits centered regardless of
  that letter's own glyph width. `font-size-title` (16px), not
  `font-size-heading` (22px) — a full heading-size glyph would crowd a
  44px circle's padding.
- **44px tap target, no separate trick needed:** unlike `.linkButton`'s
  own 8.9a2 fix (invisible `min-height` padding around a *thin text
  link*), the circle's own `width`/`height: 44px` already **is** the
  full tap target — sizing the visible shape and the hit area are the
  same declaration here, nothing extra required.
- **Focus state:** `.accountAvatar:focus-visible` gets an explicit
  `outline: 2px solid var(--color-text-on-primary)` rather than relying
  on the browser default every other link in this file uses — because,
  same as `DashboardHeader.module.css`'s own `.accountLink:focus-visible`,
  this element sits on a solid orange fill where a default outline risks
  poor visibility. Solved the same way that file already solved the
  identical problem, not re-derived from scratch.
- **`.accountFallbackLink` (text branch):** same properties the
  pre-10.5g-iv `.linkButton` used to have — caption size, semibold,
  `--color-primary` text, underlined, `min-height: 44px` +
  `inline-flex` for its own tap-target floor. Sits on this page's plain
  white background (not a colored fill), so no custom focus outline —
  consistent with every other plain link in this file, none of which
  define one either.
- **Updated the now-stale part of 10.5h-iv's own JSX comment** (it said
  neither class "has any CSS yet" — no longer true) to say plainly that
  was true "as of this task" rather than leaving a comment that reads
  as still-current once it isn't.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so this wasn't rendered.
Checked instead: both new colors traced to their real token definitions
(`--color-primary` in `docs/DESIGN_TOKENS.md`'s measured table,
`--color-text-on-primary` in `global.css`) rather than hand-typed hex;
re-read `DashboardHeader.module.css`'s own focus-visible rule to copy
its reasoning accurately rather than from memory; confirmed no other
rule in this file already used `.accountAvatar`/`.accountFallbackLink`
as a selector before adding these (new classes, no collision). Not
checked (needs a real render): actual visual centering of a letter
inside the circle at real font-rendering, and real contrast/focus-ring
visibility on screen — both flagged for `10.5i`'s pass, same as every
other visual claim this phase has deferred to that task.

`docs/TASKS.md`: 10.5h-vi checkbox ticked. Next: **10.5h-vii** — verify
only: confirm no search input, bell, or chevron exists anywhere on this
page (same idea as `10.1g`).

### Task 10.5h-vii — Owner Restaurant: verify no search/bell/chevron (2026-09-22)

Seventh and last of 10.5h's sub-tasks — verify-only, same idea as
`10.1g`'s "confirm nothing was added" check. **No code changed.**

- **Search:** grepped `OwnerRestaurant.jsx` for `SearchBar`, any
  `<input`, `type="search"`, and search-flavored placeholder text —
  zero real hits. The page has no `<input>` element of any kind.
- **Bell/notifications:** grepped both the `.jsx` and `.module.css` for
  `bell`/`notification` — the only hits are a comment mentioning this
  same task's own reasoning, and an unrelated one:
  `.categoriesEmpty`'s own comment borrows `OwnerDashboard.jsx`'s
  `.notificationsEmpty` *padding-trim naming convention* for its empty
  state, which has nothing to do with a bell icon or notification
  feature on this page.
- **Chevron/dropdown:** grepped for `chevron`/`dropdown`/`caret` —
  the only hit is this task's own reasoning comment (10.5h-v's JSX
  note). No dropdown menu markup anywhere.
- **No icon-rendering path at all:** grepped for icon-library imports,
  inline `<svg`, and any `Icon` component usage in this file — none.
  So even a differently-named bell/chevron glyph couldn't be hiding
  under some other identifier; there's no mechanism in this file that
  renders any icon, named or not.
- **Conclusion:** confirmed, matching this task's own claim — none of
  search, bell, or chevron exists anywhere on this page, today.

**Verification:** no network/npm access this session (same standing
limitation as every entry since `10.5f-i-a`), so no headless-render
double-check like `10.1g`'s own entry ran in its session — source-level
grep only. Given the grep results above (zero real hits across all
three markup patterns, and no icon-rendering mechanism at all in the
file for any of them to hide behind), a render wouldn't be expected to
turn up anything a static read didn't already rule out; still flagged
as unexercised-at-runtime, same disclosure every entry since 10.5f-i-a
has carried.

`docs/TASKS.md`: 10.5h-vii checkbox ticked. This closes out `10.5h`'s
own parent checkbox — `10.5h-i` through `10.5h-vii` are all done. Next:
**10.5i** — the responsive/verification pass at all 4 breakpoints (plus
one short-landscape phone) for the whole page, starting with `10.5i-a`
(whole page, happy path).

### Task 10.5i — blocked this session, deferred (2026-09-22)

`10.5i`'s own sub-tasks all call for "the same real-render bar
`10.2f`/`10.3h`/`10.4f` used" — real headless-Chromium screenshots at
320/390/768/1024/1280/1920 + 667×375 landscape. This session has no
network access (confirmed: `frontend/node_modules` isn't installed and
can't be `npm install`ed, no dev server can be started, no browser can
be launched). None of `10.5i-a` through `10.5i-i` were marked done on a
static read alone — every prior responsive-pass entry in this project
was backed by an actual render, and ticking these on a weaker basis
than that would misrepresent what "verified" means everywhere else in
this doc.

**What a static CSS read did check, for `10.5i-a` specifically** (not
logged as that task's own completion — offered as context for whoever
runs the real pass):
- `.page` stays `max-width: 640px; margin: 0 auto` — no fixed-width
  descendant anywhere in `OwnerRestaurant.module.css` exceeds that.
- This codebase's actual overflow fixes to date (`.identityText`,
  `.nameRow`, `.listRow`, etc., each logged in its own earlier task)
  all follow the same shape: `min-width: 0` on a flex row holding
  variable-length, user-supplied text (a restaurant/category/area name)
  that could in principle be long enough to force the row wider than
  its column.
- `10.5h-v`'s new `.headingRow` doesn't share that risk: both children
  are fixed, short, non-user strings (the literal heading "Restaurant"
  and either one letter or the literal word "Account"), so there's no
  unbounded-length case here for `min-width: 0` to guard against — a
  reasoned distinction, not an oversight, but still not a substitute
  for seeing it rendered.

**Decision (project owner, this session):** the project owner will run
the real render pass independently and report results back for this
log to record. `10.5i`'s checkboxes stay unticked in `docs/TASKS.md`
until that happens — this entry exists so the reason for the gap (and
what's already been reasoned about, for anyone doing the render pass)
is on record rather than the task list just silently stalling.

**Update, 2026-09-22:** the pager-button 44px decision referenced
throughout the entries above (10.5c-ii-f, first raised there and
repeatedly noted as still open) has since been resolved — option (a),
global fix in `ListWithPagination.module.css`. See that task's own
entry for details. The opening-hours row-reflow-on-save question from
`10.5d-ii-g` has also since been resolved — option (a), leave it
as-is, no code change. With the section-header icon question (also
resolved, option (a), text-only) that closes out every open decision
raised during the Owner Restaurant (10.5) build; the only thing still
outstanding for this page is the `10.5i` real-render pass itself.

**Next, once render results come back:** log them against
`10.5i-a` through `10.5i-i` individually (each has its own scope —
whole-page happy path, hero edge cases, each of the four list
sections' states, the 44px tap-target sweep, the 5 modals at 320px/
landscape, and the final reference-image comparison), tick each as its
own results land, then `10.5i-i`'s own comparison-and-log step closes
out `10.5` and the whole of Phase 10's 4-pages-in-scope exit check.
Until then, this session can pick up any task elsewhere in
`docs/TASKS.md` that doesn't itself require a live render.

**Update, 2026-09-22 — Phase 11, Task 11.0a:** Phase 11 ("Merge the
customer checkout flow into one page") begins. Built the new page shell
at the existing `/order/builder` route: `frontend/src/pages/Checkout/`
(`Checkout.jsx` + `.module.css` + `index.js`) replaces
`frontend/src/pages/OrderBuilder/` outright — chosen over renaming
in place because Phase 11's own 11.8c deletion list (`docs/TASKS.md`)
never names `OrderBuilder.jsx`, only `CustomerInfo`/`PaymentMethod`/
`PaymentScreenshot`/`OrderConfirmation`, so this replacement is how
`OrderBuilder.jsx` actually goes away rather than needing a second
deletion pass later. Per this task's own scope, the new page is an
empty shell only — `RoleShell` frame plus an empty content `<div>`,
same 640px capped-column CSS `OrderBuilder.module.css` used. The former
`OrderBuilder.jsx`'s real cart-list rendering/subtotal logic is not
lost, just not carried over yet — that's Task 11.2's job. `App.jsx`'s
import and `/order/builder` route now point at `Checkout` instead of
`OrderBuilder`; its route comment updated to match. Stale prose
mentions of `OrderBuilder.jsx` in other files' comments (formatPrice
cross-references, `RestaurantProfile.jsx`) are left as historical notes
per this codebase's usual convention, not this narrowly-scoped task's
job to chase down.

**Incidental fix found during this task's build verification:** while
bundling the whole app's import graph to confirm nothing broke,
`OwnerRestaurant.jsx` (Task 10.5f-ii-g's own Payment-methods
`emptyState` comment, line 1464) failed to parse — a stray `}` had been
appended directly after the block comment's `*/`, closing the
`emptyState={` JSX attribute one token early and leaving the
`<EmptyState>` element beneath it syntactically orphaned. This broke
the app's build outright (`vite build`/any bundler would have failed),
not just this task's own verification step. Fixed by removing the
stray `}` so the comment/attribute now match the same shape
Categories'/Service areas' own `emptyState` comments already use
(`*/` on its own, `}` only at the block's real close). No behavior
change — the page always rendered fine in dev (React/Babel tolerate
this particular malformed-comment shape at runtime in a way a
standalone bundler parse does not), so this had gone unnoticed until a
full-graph bundle check was run. Sandbox had no npm-registry access
this session (`npm ping` → 403), so verification used the
already-globally-installed `esbuild` (via `tsx`'s own dependency) to
parse-check every touched/new file individually and bundle-resolve
`App.jsx`'s entire import graph (react/react-dom/react-router-dom
marked external, CSS modules stubbed) — no real `vite build`/dev server
run, same standing caveat every session in this project has flagged.
Next up: 11.0b (verify-only: confirm the shared hooks/components carry
over unchanged) and 11.0c (the 8-icon set).

**Update, 2026-09-22 — Phase 11, Task 11.0b (verify only):** confirmed
all 8 shared hooks/components carry over into the merged `Checkout`
page unchanged, no edits needed:
- `useApiQuery`/`useMutation` — fully generic (`{data,error,loading}`
  wrappers with no page-level assumptions); the merged page can call
  each as many times as it needs (one `useApiQuery` for the cart's
  foods, one for the restaurant's payment methods, one `useMutation`
  each for the screenshot upload and the order submit), same as any
  other screen.
- `QuantityStepper`/`FormField`/`ImageUploadField`/`EmptyState` — all
  plain controlled presentational components (value+onChange props,
  no internal fetching, no route/page coupling). Drop-in as sections
  inside one page exactly as they were as whole screens.
- `Modal` — portal-rendered via `createPortal` into `document.body`,
  not a page-level singleton, so two independent instances (11.4c's
  payment-method picker and 11.7's success overlay) can exist on the
  same `Checkout` page at once with independent `isOpen` state and no
  conflict.
- `useOrderCart` — the one hook with a real caveat worth recording: its
  own doc comment says it's deliberately not a Context because
  "each checkout screen... reads it back out fresh on its own mount
  rather than two of them being visible at once." That assumption
  holds for the merged page too, but only if `Checkout.jsx` calls
  `useOrderCart()` exactly **once** at the top and passes `cart` plus
  its setters down to each section as props/callbacks — not once per
  section. Flagging this now so 11.2-11.6 (the tasks that actually wire
  each section to the cart) start from one shared call, not five.

No code changes this task — verify-only, per its own `docs/TASKS.md`
line. Next up: 11.0c (the 8-icon set: back-arrow/cart/person/phone/pin/
note/card/camera), following `RoleShell.jsx`'s existing inline-SVG
convention.

**Update, 2026-09-22 — Phase 11, Task 11.0c:** built the new 8-icon set,
one small file each in a new `frontend/src/components/icons/` folder
(`BackArrowIcon.jsx`, `CartIcon.jsx`, `PersonIcon.jsx`, `PhoneIcon.jsx`,
`PinIcon.jsx`, `NoteIcon.jsx`, `CardIcon.jsx`, `CameraIcon.jsx`), same
`viewBox="0 0 24 24"`/`stroke="currentColor"` feather-style-line
convention `RoleShell.jsx`'s own (not-exported) icons already use —
new glyphs, same shape, each accepting `{...props}` the same way. Given
their own files rather than local functions inside one component (the
way `RoleShell.jsx`'s are) because this set is shared across four later
tasks (11.1/11.3/11.4/11.5), not owned by one. Added a small
`components/icons/index.js` barrel (same one-import-site convention
`hooks/index.js` already uses) so later tasks import
`{ BackArrowIcon, CartIcon, ... }` from one path instead of one import
line per icon. No existing files changed — nothing yet imports these;
that's each of 11.1/11.3/11.4/11.5's own job. Verified by parse-checking
each new file and bundle-resolving both the new barrel and the whole
app's import graph via `esbuild` (still no npm-registry access this
session). Next up: **11.1** (Checkout header — gradient bar shell, back
control using 11.0c-i, "Checkout" title, cart-summary pill using
11.0c-ii).

**Update, 2026-09-22 — Phase 11, Task 11.1a:** added the Checkout
header's gradient bar shell — a full-bleed `<header>` using the existing
`--gradient-header` token, in `Checkout.jsx`/`Checkout.module.css`. No
content inside it yet (11.1b-d's job). Followed `Home.jsx`'s own header
treatment (full-bleed, no border-radius, `env(safe-area-inset-top)` top
padding) rather than `DashboardHeader`'s rounded/margined owner-admin
one, since this is a customer screen and
`docs/reference_ui/phase11_checkout_reference.jpg` shows the same
hard-edge band Home's reference does. Bottom padding is a placeholder
(`--space-md`, smaller than Home's `--space-xl`) pending 11.1b-d's real
content — flagged in the CSS comment to revisit once that's in.
Verified via `esbuild` parse-check + full `App.jsx` bundle-resolve, same
as every task this phase (still no npm-registry access this session).
Next up: **11.1b** (back control → Home, using the new
`BackArrowIcon`).

**Update, 2026-09-22 — Phase 11, Task 11.1b:** added the header's back
control — a plain 44x44px icon button (this codebase's standing
tap-target rule, Task 8.9a) using the new `BackArrowIcon` (11.0c-i),
routing to `/` via `useNavigate` rather than `navigate(-1)`: this screen
is reachable both from Food Details' Buy Now hand-off and directly by
URL, and the reference image's back arrow reads as "leave checkout", not
"undo the last navigation step" — same fixed-destination reasoning
`RoleShell`'s own nav links already use, not history-relative. Styled as
an icon-only button (no fill/border) matching `Modal`'s own close-button
shape, `aria-label="Back to home"` per this codebase's icon-only-button
convention. Verified via `esbuild` parse-check + full `App.jsx`
bundle-resolve. Next up: **11.1c** ("Checkout" title text).

**Update, 2026-09-22 — Phase 11, Task 11.1c:** added the "Checkout"
title text, same `.heading` recipe every other screen's page `<h1>`
uses (font-family/size-heading/weight-bold) with
`--color-text-on-primary` swapped in for the gradient background.
Introduced `.headerInner` (640px-capped, matching `.page` so the
header's content lines up with the page column beneath it, per the
reference image) and `.headerLeft` (groups the back button + title as
one flex item, `space-between`-ready for 11.1d's cart pill to sit
opposite it). Also moved the header's horizontal padding from nowhere
(11.1a/b had none set yet) onto `.headerInner`, and adjusted the back
button's negative margin to offset its own tap-target inset against
that new padding, so the arrow glyph itself lines up flush with the
page content edge below rather than the invisible 44px box. Verified
via `esbuild` parse-check + full `App.jsx` bundle-resolve. Next up:
**11.1d** (cart-summary pill: shell, cart icon, "N items • total ETB"
text).

**Update, 2026-09-22 — Phase 11, Task 11.1d:** built the cart-summary
pill (11.1d-i/ii/iii together — the three sub-boxes are one small,
inseparable render, not three independently-completable pieces the way
11.0's a/b/c splits were). Outlined, non-interactive badge (`.cartPill`
in `Checkout.module.css`) sitting opposite `.headerLeft` via
`.headerInner`'s existing `space-between` (Task 11.1c), holding the new
`CartIcon` (11.0c-ii) plus a "N items • total ETB" `.cartPillText`.
Matches the reference's thin white outline on the orange gradient
(`SearchBar`'s own `.onPrimary` treatment was the closer precedent than
`StatusBadge`'s solid fill).

**This is the first task in Phase 11 that actually calls
`useOrderCart()`** — done once, at the top of `Checkout.jsx`, per
11.0b's own verification note that later sections should read `cart`
back out as a prop from this one call rather than each calling the hook
independently. The item count is a direct `cart.items.length` read, per
11.1d-iii's own wording, but the *total* needed real per-food prices,
and `useOrderCart` deliberately only ever stores `{ foodId, quantity }`
— no price. So this task also added the fetch that gets them: one
`useApiQuery` (`fetchCartFoods`) resolving a `Promise.all` over the
cart's own food ids against the same public `GET /api/foods/detail/:id`
`FoodDetails.jsx` (Task 3.9) already uses, keyed on a joined
`foodIdsKey` string (not the `foodIds` array itself, which is a fresh
reference every render and would otherwise refetch on every unrelated
re-render). `subtotal` is derived from that response — `null` (not `0`)
whenever the fetch hasn't resolved yet or any cart line's food didn't
come back, so the pill can tell "still loading/partial" apart from a
real zero-price total and just omit the "• total" half rather than show
a wrong number, same "don't guess at a price" posture `submitOrder.js`'s
own Task 3.15b already takes server-side.

**Not new price logic, despite being new code**: 11.1d-iii's own
wording says "no new price logic," and none was invented — `subtotal`
is a plain sum of each line's server-fetched `price × quantity`, the
same arithmetic `submitOrder.js` already does, just computed
client-side for display rather than re-derived here as a new rule.
What's genuinely new is the *fetch* itself, since `OrderBuilder.jsx`
(which must have had its own version of this) was deleted by Task 11.0a
before this session and left nothing to carry forward — flagged as a
real gap in 11.0a's own retrospective is out of scope here; this task's
own job was making the pill correct, which needed the fetch to exist
somewhere.

**Positioned for reuse, not just for this pill**: `cartFoods`/`subtotal`
are exactly what Task 11.2 ("Your order" section) will also need to
render each line's own name/price/description — this session left both
at `Checkout.jsx`'s top level, documented in the component's own header
comment, so 11.2 reads them back out rather than re-fetching the same
data a second time.

**11.1e is explicitly *not* ticked this session** — see its own updated
line in `docs/TASKS.md`. Its task text asks to verify "the existing
empty-cart `EmptyState` branch," but there isn't one: `Checkout.jsx`'s
body below the header is still the bare `<div className={styles.page}
/>` Task 11.0a left it as — that branch is 11.2's own job to build, not
retroactively 11.1e's. The one thing 11.1e's own parenthetical already
promises — "no dead/zero badge shown for a genuinely empty cart" — is
real and built today: the pill is wrapped in `{itemCount > 0 && ...}`,
so an empty cart renders no pill at all, not a "0 items" one. Flagged
rather than ticked, so a future session doesn't skip building the
actual `EmptyState` branch on the mistaken belief this box already
covered it.

**Verification — a real one this time, not the standing "no
npm-registry access" trace-only fallback every session since Task
2.10 logged**: `npm ping` succeeded this session (registry reachable),
so `npm install` (280 packages) and a real `npx vite build` were run
against the actual frontend — clean, 217 modules transformed, no
errors. `npx eslint` couldn't run (no `.eslintrc`/flat config file is
present in this checkout — likely a dotfile the zip/export this session
started from didn't carry over, not a regression from this task's own
edit), so lint itself is still unverified, but the build itself (module
resolution, JSX/syntax validity, CSS module class references) is now
confirmed by a real toolchain run rather than a manual trace. Worth
flagging for whoever next has reason to check: if registry access is
reliably available going forward, the standing "no npm-registry access"
caveat repeated throughout this file since Task 2.10 may no longer
apply, and future sessions should try `npm ping` before falling back to
manual verification.

`docs/TASKS.md`'s 11.1d (and its three lettered sub-boxes) checkboxes
ticked; 11.1e's own box deliberately left open with the reasoning above
recorded in its line. Next up: **11.2** — "Your order" section (folds
in `OrderBuilder.jsx`'s cart-rendering content), starting with 11.2a's
section-heading restyle — its own first real step, 11.2c, should reuse
this task's `cartFoods` fetch rather than adding a second one.

**Update, 2026-09-22 — Phase 11, Task 11.2:** built the "Your order"
section (11.2a-e, all five ticked in `docs/TASKS.md`), folding
`OrderBuilder.jsx`'s real cart-rendering content into `Checkout.jsx`.
Section heading (`.sectionHeading`, 11.2a); item rows (`.itemRow` inside
`.itemList`, 11.2b-i) each with a fixed 64×64px `object-fit: cover`
thumbnail (`.itemImage`, 11.2b-ii, same `FALLBACK_IMAGE` placeholder
`FoodDetails.jsx` already uses, and the same "fixed size regardless of
the source photo" rule Task 10.1z established app-wide), name +
2-line-clamped description (`.itemName`/`.itemDescription`, 11.2b-iii),
price via this file's own `formatPrice` (`.itemPrice`, 11.2b-iv), a
`QuantityStepper` wired to `setItemQuantity` (11.2b-v), and a text-only
"Remove" link wired to `removeItem` (`.removeButton`, 11.2b-vi). Subtotal
/ Total summary block (`.summaryBlock`, 11.2d) — **no delivery-fee row**,
the project owner's decision recorded at the top of Phase 11 in
`docs/TASKS.md` — both rows sourced from the same `subtotal`/
`formattedSubtotal` 11.1d already computes for the header pill, not a
second calculation. "Add another item" (`.addItemButton`/`.addItemPlus`,
11.2e) navigates to `/restaurant/${cart.restaurantId}` with
`state: { addingToOrder: true }` — the exact destination/state shape
`RestaurantProfile.jsx`'s own doc comment already documents as coming
from Order Builder's "Add another item," now fired from this merged page
instead; the "+" is a plain styled `<span>` glyph, not a new icon asset,
same call Task 10.2d-ii already made for Home's Popular Foods CTA (this
one filled solid rather than outlined, matching the reference's own
solid-orange-circle treatment).

**11.2c's own verify step**: confirmed `getPublicFoodById`
(`backend/src/services/popularFoods.js`) selects a real `description`
column onto the food it returns — the same query `FoodDetails.jsx`
(Task 3.9) already reads `food.description` from — so the reference
image's one-line description under each item's name is real data, not
invented, and is rendered as-is.

**Two pieces restored beyond the five lettered sub-tasks, both flagged
in `docs/TASKS.md`'s own 11.2 entry rather than silently bundled in:**
1. The Buy Now hand-off itself — a mount-only `useEffect` reading
   `location.state.{foodId,restaurantId,quantity}` (set by
   `FoodDetails.jsx`'s `handleBuyNow`) and calling `addItem`.
   `App.jsx`'s own route comment for `/order/builder` (written back in
   Task 11.0a) already named this as "carried over from the former
   OrderBuilder.jsx into Task 11.2's own job," so this is that
   restoration, not new scope invented here. Empty `[]` deps
   deliberately: a one-time "just arrived from Buy Now" action, not
   something that should re-fire on every later re-render just because
   `location.state` is still sitting there.
2. An empty-cart `EmptyState` branch (`.emptyStateLink` → `/`, "Browse
   restaurants") for a direct/empty visit to `/order/builder` — nothing
   in 11.2's own lettered sub-tasks names this, but the section needed
   *some* real branch for the empty case now that it renders anything at
   all. This also finally lets **11.1e** be checked for real: with a
   genuinely empty cart, this branch renders and 11.1d's own pill
   (guarded on `itemCount > 0`) still shows nothing beside it — no
   "0 items" pill above an empty-state message. **11.1e's own checkbox
   is still left open** pending an actual real-render confirmation of
   this (not done this session, see verification note below) rather than
   ticked on inspection alone.

`setItemQuantity`/`removeItem` were pulled into the single
`useOrderCart()` call 11.1d already made (per that task's own "every
later section reads `cart` and its setters back out as props from this
one call" reasoning) rather than a second hook call here. The
`foodsById` map was factored out of 11.1d's own inline `subtotal`
`useMemo` into its own `useMemo` so this section's item rows can look up
each line's real food from the same `cartFoods` response 11.1d already
fetches — no second fetch added, exactly what that task's own doc
comment flagged as being left ready for this one.

**Verification — no npm-registry/browser access this session either**
(same standing constraint most sessions since Task 2.10 have logged), so
no real `vite build`/browser render was possible. Found and used a
narrower substitute this time: the `esbuild` binary bundled inside the
already-installed `tsx` package
(`~/.npm-global/lib/node_modules/tsx/node_modules/@esbuild/linux-x64/bin/esbuild`)
— `Checkout.jsx` alone bundles clean (JSX parse + resolve), and a full
`App.jsx` bundle (363KB JS / 147KB CSS) resolves every route module in
the app, this one included, with zero errors. Also script-diffed every
`styles.*` class referenced in `Checkout.jsx` against
`Checkout.module.css`'s own class list rather than eyeballing it: zero
missing. This is real toolchain verification of syntax/module-resolution
correctness, but **not** a substitute for an actual rendered check
against `docs/reference_ui/phase11_checkout_reference.jpg` — that real-
render pass (spacing, the 2-line description clamp, wrap behavior at
narrow widths, the 44px tap-target floor on `QuantityStepper`/Remove) is
still outstanding, deferred to Task 11.9 per that task's own scope, the
same way Task 10.5's per-section work deferred its own real-render pass
to 10.5i.

`docs/TASKS.md`'s 11.2 (and all five of its own lettered sub-boxes,
11.2a-e, plus 11.2b's own six i-vi entries) ticked. 11.2's own parent
checkbox stays open (same convention 11.0/11.1 already use: a phase-
group box only ticks once every sub-item under it, including any
deferred-verification ones, is itself ticked) — and 11.1's own parent
box also stays open, since 11.1e is still outstanding. Next up: **11.3**
— "Your details" section (folds in `CustomerInfo.jsx`'s 4 real fields
and their existing validation), starting with 11.3a's section-heading
restyle using the new person icon (11.0c).

---

**Task 11.3 done this session — all six of its own lettered/sub-lettered
items (11.3a-f) built together, same "one section, one task" shape 11.2
already used** (11.2's own five lettered sub-tasks were likewise done as
one pass). Folds in `CustomerInfo.jsx`'s (Task 3.12) four real fields —
Name, Phone, Delivery location, Note — and their existing required-field
validation into the merged page, right below 11.2's "Your order" section.

**A real, additive change to the shared `FormField` component was needed
first, not assumed to already exist:** `docs/reference_ui/phase11_checkout_reference.jpg`
shows a small glyph directly left of each field's own label text (Name's
person icon, Phone's phone icon, etc.) — something no existing `FormField`
caller anywhere in the app has ever needed, since this is the first
screen in the whole codebase to put a per-field icon next to a label.
`FormField.jsx` gained a new, purely-additive `icon` prop (an optional
pre-built element, same "caller supplies markup, component doesn't guess
its shape" split `EntityCard`'s own `badge`/`cta` slots already use, not
a name/type string) rendered inside the existing `<label>` ahead of the
label text; `FormField.module.css`'s `.label` gained `display: flex;
align-items: center; gap: var(--space-xs)` to lay the icon and text out
side by side, and a new `.labelIcon`/`.labelIcon svg` pair sizes whatever
icon element was passed (16px, `currentColor`) without requiring every
call site to also pass its own sizing className. Grepped every other
`<FormField` call site first (the same 46-site sweep Task 8.9c already
did) to confirm none of them pass `icon` today, so this is a strictly
additive change — no other screen's rendering changes.

**`Checkout.jsx`/`Checkout.module.css` additions:**
- `validateCustomerInfo` (module-level function, same shape as
  `CustomerInfo.jsx`'s own `validate`) and the three field-length
  constants (`NAME_MAX_LENGTH`/`LOCATION_MAX_LENGTH`/`NOTE_MAX_LENGTH`),
  both copied verbatim from `CustomerInfo.jsx` (Task 3.12) — same
  `docs/DB_SCHEMA.md`-derived caps, same presence-only validation
  reasoning (no phone-format enforcement, "free text" location).
- `customerInfoValues`/`customerInfoTouched` local state, seeded from
  `cart.customerInfo` the same way `CustomerInfo.jsx`'s own `values`
  state used to be — but **not** committed back into the cart on its own
  anymore. Unlike the five separate Phase-3 screens, this merged page has
  no more per-section "Continue" step to commit on; there's one shared
  final commit point now, Task 11.6's own "Place order" action, which
  will read `customerInfoValues`/`customerInfoErrors` directly once it
  exists rather than through `cart.customerInfo`. Flagged in this file's
  own doc comment so 11.6 doesn't go looking for a `setCustomerInfo` call
  this task deliberately didn't add.
- New `.detailsSection`/`.detailsForm` section — same `.orderSection`-style
  heading+content vertical rhythm, fields laid out in a surfaced card
  (`.detailsForm`, matching `.itemList`/`.summaryBlock`'s own "card on the
  plain page background" shape) rather than `CustomerInfo.module.css`'s
  original un-carded `.form` — that screen had no sibling sections
  competing for the same background, this merged page does.
- `.sectionHeading` gained `display: flex; align-items: center; gap:
  var(--space-xs)` so "Your details" can carry a leading `.sectionHeadingIcon`
  (20px, one step up from a field's own 16px `.labelIcon`, reading as a
  section-level glyph rather than a field-level one) — "Your order"
  (11.2a) keeps rendering with no icon, matching the reference, since a
  bare text node is still a valid flex child.
- Section rendered only when `itemCount > 0`, same guard 11.2's own item
  list/summary block already use — there's nothing to take delivery
  details for against an empty order, and this form sitting next to
  11.2's own empty-cart message would be confusing rather than helpful.

**Verification — same no-npm-registry-access constraint as every session
since Task 2.10** (`npm ping` → 403), so no real `vite build`/browser
render. Used the same `esbuild`-via-`tsx` substitute Task 11.2's own log
entry introduced: `Checkout.jsx` alone bundles clean, and a full
`App.jsx` bundle (every route module, external `react`/`react-dom`/
`react-router-dom`) resolves with zero errors — confirming the new
`FormField` import, the four new icon imports, and every internal
reference resolve correctly across the whole app, not just this one
file. Also script-diffed every `styles.*` class referenced in both
`Checkout.jsx` and `FormField.jsx` against their own `.module.css`
files' class definitions: zero missing in either. Real-render visual
verification against the reference image (icon size/alignment, the
card's spacing, 44px tap targets on the two textarea fields, wrap
behavior at narrow widths) is still outstanding — deferred to Task 11.9,
same as 11.2's own real-render pass.

`docs/TASKS.md`'s 11.3 and all six of its own lettered items (11.3a-f)
ticked. Next up: **11.4** — "Payment method" section (folds in
`PaymentMethod.jsx`), starting with 11.4a's section-heading restyle
using the new card icon (11.0c).

---

**Task 11.4 done this session — all of it (11.4a-d, including 11.4b's
three and 11.4c's four sub-items) built together, same one-section-one-
pass shape 11.2/11.3 already used.** Folds in `PaymentMethod.jsx`'s
(Task 3.13) real data — a restaurant's own active payment methods — but
changes the *interaction*, per the project owner's decision already
recorded at the top of Phase 11 in `docs/TASKS.md`: a summary row instead
of a full-page list, tap-to-open `Modal` (Task 2.15) instead of
tap-to-navigate.

**Data layer**: one `useApiQuery` call at `Checkout`'s own top level
(`paymentMethods`/`paymentMethodsLoading`/`paymentMethodsError`/
`refetchPaymentMethods`), hitting the exact same public
`GET /api/restaurants/:id/payment-methods` endpoint `PaymentMethod.jsx`
already used — not a new endpoint, not a second fetch inside the modal.
11.4c's own wording ("reusing... existing list logic wholesale, no new
fetch/loading/error handling written") is why this sits at the component
level: the modal's body renders these same three states rather than
running its own fetch, and the *closed* summary row can show real
selected-method data immediately rather than needing the modal opened
first to trigger anything.

**11.4b-i's fallback logic**: `selectedPaymentMethod`, a `useMemo` —
`cart.paymentMethodId` if it matches a fetched method, else
`paymentMethods[0]` (the first *active* method; this endpoint already
filters to `is_active`), else `null` (still loading, or the restaurant
has zero active methods — both real, distinct states the summary row's
own render branches on separately, not folded into one generic
fallback).

**Summary row (11.4b-ii/iii)**: method name (bold), then account number
and account name each on their own line — matching the reference image's
own stacked layout for this row, the same field order `PaymentMethod.jsx`'s
original `.methodCard` already used (not the single-line `account_name ·
account_number` format `OwnerRestaurant.jsx`'s own payment-method rows
use — checked, and confirmed the two screens' references genuinely
differ here). A `›` character (`&rsaquo;`) at the row's end, not a new
icon — same "typography, not an icon asset" call this file's own
`.addItemPlus` (11.2e) already made.

**Modal (11.4c)**: `isPaymentModalOpen` (component-level `useState`)
gates the shared `Modal` component, `size="sm"`. Its body is a fresh,
this-file-only port of `PaymentMethod.module.css`'s own method-list
markup/classes (`.modalMethodList`/`.modalMethodCard`/
`.modalMethodCardSelected`/etc.) — deliberately **not** an import of
`PaymentMethod.module.css` itself, since that file (along with
`PaymentMethod.jsx`) is one of Phase 11's own eventual deletions (Task
11.8c); nothing new should come to depend on a file already scheduled to
go away. Selecting a row calls `setPaymentMethod` (Task 3.13's own
`useOrderCart` mutator, already destructured here) and closes the modal
in the same handler (`handleSelectPaymentMethod`) — no separate
"Continue" step, matching 11.4c-iii's own wording.

**11.4c-iv/11.4d, both verified by construction rather than needing new
code**: the modal's backdrop/close-button dismissal (`Modal`'s own
`onClose`) never calls `setPaymentMethod` — only `handleSelectPaymentMethod`
does — so closing without picking anything leaves `cart.paymentMethodId`,
and therefore `selectedPaymentMethod`, untouched; and a restaurant swap
resetting `cart.paymentMethodId` to `null` (`useOrderCart`'s own `addItem`,
unchanged since Task 3.11) simply falls through `selectedPaymentMethod`'s
own `paymentMethods[0]` fallback branch, the same branch a first-time
visit with nothing selected yet already exercises — not a second code
path that needed separately building.

Section rendered only when `itemCount > 0`, same guard 11.2/11.3's own
sections already use.

**Verification — same no-npm-registry-access constraint as every session
since Task 2.10.** `Checkout.jsx` alone and a full `App.jsx` bundle
(external `react`/`react-dom`/`react-router-dom`) both resolve via the
`esbuild`-via-`tsx` substitute with zero errors — including the new
`Modal` import and its own `react-dom` (`createPortal`) dependency.
Script-diffed `Checkout.jsx`'s `styles.*` references against
`Checkout.module.css` both ways this time (used-but-undefined, and
defined-but-unused) — zero in either direction, so no dead CSS was left
behind either. Real-render visual verification (modal open/close at
320px, the summary row's chevron vertical alignment against the
3-line text block, tap-target sizing) is still outstanding — deferred to
Task 11.9, same as 11.2/11.3's own passes.

`docs/TASKS.md`'s 11.4 and all of its own lettered/sub-lettered items
(11.4a, 11.4b + b-i/ii/iii, 11.4c + c-i/ii/iii/iv, 11.4d) ticked. Next
up: **11.5** — "Upload payment screenshot" row (folds in
`PaymentScreenshot.jsx`), starting with 11.5a's collapsed-row restyle
wired to the existing `ImageUploadField`, with the new camera icon
(11.0c).

---

**10.5i — picked up out of order, same "earliest unticked box, not the
narrative's own last-recorded position" reasoning this file has used
before (the 8.7e situation: Phase 11's own 11.1-11.4 work above already
went ahead of it, the same way 8.8/8.9 once went ahead of 8.7e).
`docs/TASKS.md`'s own checkboxes are the source of truth for what's next,
re-read fresh rather than trusting this file's last narrative position —
10.5i (Owner Restaurant's whole-page responsive/verification pass) was
the earliest unticked box in the file, so it's closed out here before
Phase 11 continues at 11.5.**

**A real environment change worth recording before the pass itself:**
this session had working `npm`/registry access (`npm ci` in `frontend/`
succeeded, 280 packages, and `npm run build` produced a clean `vite
build`, 217 modules) — the standing "no npm-registry access" gap every
session since Task 2.10 logged is not present this session. A real
headless-browser render was still not possible, though: `npx playwright
install chromium` completed with no browser actually downloaded (its own
binary host isn't reachable from this sandbox's network egress list),
and `--with-deps` failed outright on an unrelated blocked apt source
(`deb.nodesource.com`, 403). So this is still the same manual CSS/JSX
trace method every pre-10.3h session used, not the real headless-Chromium
renders Tasks 10.3h/10.4f/10.5c-e's own sessions had — flagged plainly,
not presented as equivalent, same as 10.1h's own caveat when it hit the
same gap after 10.1c-10.1f2's real renders.

Traced `OwnerRestaurant.jsx`/`OwnerRestaurant.module.css` in full (1833/
1482 lines) against the 320/390/768/1024/1280/1920px + 667×375-landscape
bar, plus a side-by-side re-check against
`docs/reference_ui/phase10_owner_restaurant_reference.jpg`:

- **10.5i-a (whole page, happy path):** no fixed-px widths anywhere in
  this file beyond `.page`'s own 640px cap (grepped for `width:`/
  `min-width:`/`white-space:`/`flex-wrap:`/`overflow:` across the whole
  stylesheet); every row built across 10.5a-10.5h already carries its own
  `min-width: 0` + `flex-wrap: wrap` or `overflow-wrap: anywhere`
  fallback (`.nameRow`, `.identityText`, `.statusRow`, `.categoryRow`/
  `.areaRow`/`.paymentMethodRow` and their name chips, `.openingHoursRow`
  via its own comment trail). No new gap found.
- **10.5i-b (hero edge cases):** `.coverHero` is `aspect-ratio: 21/5`
  (not a fixed height), so a missing cover photo renders as a plain
  `--color-surface-muted` box at the same proportion as a real one — no
  broken-image state to guard against. `.restaurantName` and
  `.descriptionPreview` both already ellipsis-truncate to one line
  (`overflow: hidden; white-space: nowrap; text-overflow: ellipsis`) via
  `flex: 1 1 auto; min-width: 0` on their row, so a very long name/
  description can't push `.hero` wider than `.page`'s column. A missing
  `description` already has its own real, non-placeholder fallback line
  (`.descriptionPreviewEmpty`, "Add a description below to tell customers
  about your restaurant.") — built at 10.5a-iii, still correct. Logo
  badge fallback (`ImageUploadField`'s own empty-state chrome) is shared,
  already-verified component styling (Task 8.1f), not re-derived here.
- **10.5i-c/d/e/f (Categories/Opening hours/Service areas/Payment
  methods, all states):** each section's loading/error/empty/populated/
  toggle-error states were already individually built and verified by
  real render in their own 10.5c-10.5f sessions (see those entries above
  for the per-state render logs); this pass re-read each one's current
  CSS/JSX together rather than in isolation, checking specifically for a
  cross-section regression (e.g. one section's fix leaking into another's
  markup) — none found. The one shared-component gap this project's own
  history would have caught here, `ListWithPagination`'s sub-44px pager
  buttons, was already fixed globally at Task 10.5c-ii-f (`.pageButton`
  min-height, all 7 call sites including this page's three) — confirmed
  still present, not re-broken by any of 10.5c-10.5h's later edits.
- **10.5i-g (44px tap-target sweep):** every interactive control on this
  page already carries an explicit `min-height: 44px` (or is a fixed
  ≥44px shape) from its own earlier task: `.addPill` (10.5c-i-c),
  `.categoryEditLink`/`.areaEditLink`/`.paymentMethodEditLink`/
  `.categoryDeleteLink`/`.areaDeleteLink` and `.menuManagementLink`
  (each a full `.linkButton`-shaped duplicate, 10.5c-ii-b/10.5e-ii-b/
  10.5f-ii-e/10.5g-ii), `.accountAvatar` (44×44 exactly, 10.5h-vi),
  `.accountFallbackLink` (10.5h-iii/`.linkButton`-shaped), `ToggleSwitch`
  (shared, Task 8.9a2), `.openingHoursSaveLink` (10.5d-ii-g), and
  `ListWithPagination`'s own pager (above). No control found without one.
- **10.5i-h (5 modals at 320px/landscape):** confirmed exactly 5 `Modal`
  instances on this page (category add/edit, category delete, service
  area add/edit, service area delete, payment method add/edit — no
  payment-method delete, per Task 5.7's deliberate scope), all
  `size="sm"` (`Modal.module.css`'s `.sm`, `max-width: 360px`). At the
  320px floor, `.overlay`'s own `space-lg` (16px) padding each side
  leaves 288px, under the 360px cap, so `.dialog`'s `width: 100%` renders
  at 288px on every one of them — same figure Task 8.2d-ii's original
  `Modal` verification already established, unchanged by anything this
  page's own restyle touched (10.5c-10.5f only touched section-card/row
  CSS, never `Modal.module.css` itself). No palette mismatch found: all
  five modals' form fields are the shared, already-restyled `FormField`
  (Task 10.1c's gray-fill treatment does not apply here — that restyle
  was scoped to the two login screens only, confirmed by grep, so these
  modals still use `FormField`'s own base white-background style, which
  is correct and unchanged since Task 5.4-5.7's original modal forms) and
  `.primaryButton`/`.secondaryButton`-equivalent footer buttons, nothing
  page-specific to clash with the new tokens.
- **10.5i-i (reference comparison):** re-viewed
  `docs/reference_ui/phase10_owner_restaurant_reference.jpg` directly
  against the current build. Matches: hero photo + overlapping logo
  badge + name/description/Open-badge/toggle identity block; the
  restyled name/description card; all four section cards in the
  reference's own order (Categories, Opening hours, Service areas,
  Payment methods); the tinted "Menu management" strip at the foot.
  **Known, already-decided deviations, not re-litigated here:** the
  reference's per-card icons (fork/clock/pin/card) were deliberately
  dropped (10.5c-i's own split note, project-owner-decided option (a),
  text-only headers) since no such icon set exists in this codebase; the
  reference's top search bar/bell/chevron were deliberately dropped in
  favor of the plain-letter account avatar (10.5h, project-owner-decided
  option (a)); the Description field's reference shows a "0/500"
  character counter that this build deliberately omits (10.5b-ii,
  project-owner-decided option (b) — `description` has no real
  server-enforced cap, so a counter would display a limit that doesn't
  exist). No new deviation found beyond these three already-recorded
  ones.

No code changes were needed anywhere in this pass — every risk this
task's own six sub-checks look for was already closed by the section-by-
section work in 10.5a-10.5h, and this session's trace found nothing that
work missed. `docs/TASKS.md`'s 10.5i and all of its own lettered
sub-items (10.5i-a through 10.5i-i) ticked, which closes out **Task 10.5
(Owner Restaurant) in full** — its own top-level checkbox ticked too.

**Gap acknowledged, not fixed here, same as 10.1h's own equivalent
note:** a manual trace has less confidence than a real rendered check —
it can catch a wrong CSS value but not a genuine browser-rendering
quirk. A real headless-Chromium (or `vite build` + manual phone/desktop
resize) pass against this page, the first time real browser tooling is
available in this sandbox, would be worth running before treating 10.5
as browser-verified rather than trace-verified — this session confirms
`npm`/`vite build` access is real again, so only the browser binary
itself remains the blocker, not the whole toolchain.

Resuming the narrative's own last position from above this entry: Phase
10 is now fully closed out end to end (the exit check already passed;
this entry closes the one item — 10.5i — that had been skipped past).
Next up, unchanged from before this entry: **11.5** — "Upload payment
screenshot" row (folds in `PaymentScreenshot.jsx`), starting with 11.5a's
collapsed-row restyle wired to the existing `ImageUploadField`, with the
new camera icon (11.0c).

---

**11.5a-i — `ImageUploadField`'s third additive layout mode.** Same
"every pre-existing call site renders unchanged" guarantee `overlay`
(10.5a-i) and `badge` (10.5a-ii) already established: a new `compact`
prop (default `false`), checked *before* `overlay`/`badge` in the JSX so
it wins if more than one is ever passed — not a real scenario today (no
call site passes two), but documented explicitly rather than left as an
accident of source order the way `badge`-over-`overlay` originally was.

**Built:**
- `compact` prop, with a header-comment block matching `overlay`/
  `badge`'s own documentation style, explaining the eventual shape
  (icon + two-line title/subtitle + trailing chevron, one tappable row)
  and this task's own narrower scope (shell only).
- `.fieldCompact` class on the root `.field`, gated behind the prop,
  dropping the base column `gap` the same reason `.fieldOverlay`/
  `.fieldBadge` already do (one visual unit, not stacked blocks).
- A new top-priority JSX branch (`compact ? ... : badge ? ... : ...`):
  a single `<button className={styles.compactShell}>`, `aria-label=
  {buttonLabel}` for its accessible name (same "name via aria-label,
  no visible text yet" approach `badgeButton` already uses), toggling a
  second class `.compactShellEmpty` off `!displayedPreview` for the
  dashed-vs-solid border. Deliberately empty of children — no icon,
  no text, no chevron — per this task's own explicit scope; those are
  11.5a-ii/iii/iv's jobs, not folded in early.
- The standalone `.button` below no longer renders when `compact` is
  true (`!overlay && !badge && !compact`), and the `<label>` is
  visually hidden under `compact` too (`.srOnly`, same as `overlay`/
  `badge`), since the shell's own `aria-label` already carries the
  accessible name — an unhidden label above a content-less button would
  just be an orphaned line of text with nothing to caption yet.
- `.compactShell`/`.compactShellEmpty` CSS: bordered/rounded/padded row
  shell, `min-height: 44px` from the start (Task 8.9a floor), dashed
  border in the empty state.

**Verification this session:** same `esbuild`-via-`tsx` method 11.2's
own entry used (still no npm-registry/browser access). The edited
component alone bundles clean; a full `App.jsx` bundle (398KB JS/151KB
CSS, every route including `OwnerRestaurant`/`AddFood`, the two other
`ImageUploadField` call sites) also resolves with zero errors — neither
of those two call sites passes `compact`, so they take the unchanged
`overlay`/base branches exactly as before. Every `styles.*` class
referenced in the component script-diffed against the CSS module's own
class definitions: zero missing, zero newly-dead. No real-render visual
check (the empty shell's border/padding/dashed-vs-solid look) has been
done — nothing to compare against yet either, since this shell has no
visible content until 11.5a-ii/iii/iv add it; a combined visual pass
across all four sub-tasks is the more useful point to do that, same
reasoning 10.5's own per-letter sub-tasks deferred their real-render
pass to 10.5i.

`docs/TASKS.md`'s 11.5a-i ticked. Next up: **11.5a-ii** — the `icon`
prop, rendered left-aligned inside the compact shell.

---

**11.5a-ii — `ImageUploadField`'s `icon` prop for the `compact` shell.**
Same name/shape as `FormField`'s own `icon` prop (Task 11.3): a
pre-built node the caller passes (e.g. `<CameraIcon />` from
`components/icons`, Task 11.0c), not a name/type string — this
component places the glyph, it doesn't choose it. Purely additive
(`icon` is optional, `undefined` for every call site that doesn't pass
one), and scoped to the `compact` branch only — `overlay`/`badge`/base
rendering is untouched.

**Built:**
- `icon` prop, documented with a header-comment block cross-referencing
  `FormField`'s own `icon` doc comment for the shared convention, and
  explaining the one real difference: `FormField`'s `.labelIcon` is a
  bare glyph, but the reference
  (`docs/reference_ui/phase11_checkout_reference.jpg`) shows this one
  sitting inside its own small tinted square, so it needed its own
  wrapper class rather than reusing `.labelIcon` as-is.
- JSX: the compact `<button>` (previously self-closing, 11.5a-i) now
  renders one optional child — `icon` wrapped in an `aria-hidden="true"`
  `<span className={styles.compactIcon}>` — same "decorative glyph,
  accessible name still comes from `aria-label`" pattern `FormField`'s
  `labelIcon` and this same component's `badge` branch already use.
  Nothing else in the button changed; title/subtitle text (11.5a-iii)
  and the trailing chevron (11.5a-iv) still don't exist.
- `.compactIcon` CSS: a fixed 36×36px rounded-square tile
  (`--radius-md`), centered flex, `color-mix(in srgb, var(--color-primary)
  14%, var(--color-surface))` background with `--color-primary` as the
  icon's `currentColor` — reusing the exact tint approach
  `StatTile`/`StatusBadge` already use for their own tinted fills,
  rather than a new flat hex token in `docs/DESIGN_TOKENS.md`. Inner
  `svg` sized to 18px, `margin-right: var(--space-sm)` ahead of the
  still-nonexistent text block.

**Verification this session:** same `esbuild`-via-`tsx` method 11.5a-i's
own entry used (still no npm-registry/browser access). The edited
component alone bundles clean; a full `App.jsx` bundle (403KB JS/151KB
CSS, every route including the two other `ImageUploadField` call sites)
also resolves with zero errors — neither of those two passes `icon`, so
they're unaffected. Every `styles.*` class referenced in the component
script-diffed against the CSS module's own class definitions: zero
missing, zero newly-dead. No real-render visual check yet (same
reasoning as 11.5a-i's own entry — nothing wires an actual `<CameraIcon
/>` into this prop until 11.5c-ii, so there's nothing to compare
against the reference until then; the combined visual pass stays
deferred to 11.9).

`docs/TASKS.md`'s 11.5a-ii ticked. Next up: **11.5a-iii** — the
title/subtitle two-line text block (`chooseLabel` as the bold title,
`helperText` as the subtitle line).

---

**11.5a-iii — `ImageUploadField`'s title/subtitle text block for the
`compact` shell.**

NOTE: this entry, 11.5a-iv's, and 11.5a-v's below are written alongside
11.5b (the first task after them this session actually has reason to
touch), backfilling — same drift, same "whoever next has reason to
touch that history" resolution the file's earlier NOTEs already use.
The code for all three was already in `ImageUploadField.jsx`/`.module.css`
before this session started (this session's own diff is 11.5b only);
`docs/TASKS.md`'s three checkboxes and these three log entries are the
only things that hadn't caught up. Verified against the actual
component source rather than re-derived from memory, so this reflects
what's really built, not a guess.

**Built (previously, logged now):**
- Title — no new prop: the compact button's second child renders
  `buttonLabel` (the same `chooseLabel`/`changeLabel` string already
  computed for the `aria-label`) as visible text in `.compactTitle`.
- Subtitle — reuses `helperText` as-is (no new/renamed prop), rendered
  under the title in `.compactSubtitle` only `helperText && …`-gated,
  same "reuse an existing prop as visible copy" move `label`/
  `helperText` already make elsewhere in this component.
- The whole `.compactText` block is `aria-hidden="true"`: the button's
  accessible name is still `buttonLabel` via `aria-label`, so this
  visible text would otherwise be announced twice.
- `.compactText` CSS: `flex: 1; min-width: 0` so it claims the row's
  remaining width and actually truncates (`.compactTitle`/
  `.compactSubtitle` both get `overflow: hidden; text-overflow:
  ellipsis; white-space: nowrap`) instead of overflowing past
  11.5a-iv's chevron slot.

`docs/TASKS.md`'s 11.5a-iii ticked (backfilled). Next up (at the time):
**11.5a-iv** — the trailing chevron.

---

**11.5a-iv — `ImageUploadField`'s trailing chevron for the `compact`
shell.** Same backfill note as 11.5a-iii's entry above applies here too.

**Built (previously, logged now):**
- `.compactChevron` — a plain `>` text character as the button's third/
  last child, same precedent 11.4b-iii already set for this codebase
  (no new icon asset). `aria-hidden="true"`, same reason as the icon/
  text block: decorative, doesn't change the button's `aria-label`
  accessible name.
- CSS: `flex-shrink: 0` so a long, already-truncating title/subtitle
  can never squeeze it out of view; `margin-left: var(--space-sm)` for
  breathing room off `.compactText`'s `flex: 1`.

`docs/TASKS.md`'s 11.5a-iv ticked (backfilled). Next up (at the time):
**11.5a-v** — verify the whole row is wired as the click target.

---

**11.5a-v — *Verify:* whole compact row wired as the click target.**
Same backfill note applies. Unlike iii/iv this was never separate code
to add: the `<button className={styles.compactShell}>` itself carries
`onClick={() => inputRef.current?.click()}` from 11.5a-i's very first
version of the shell (a click target is what makes the shell function
as an upload control at all, so it couldn't have been deferred to a
later sub-task the way the icon/text/chevron *content* could). Same
delegated-click pattern the `overlay` button's `.buttonOverlay` and the
`badge` button's `.badgeButton` already use — one hidden real `<input
type="file">` plus a styled sibling button that proxies the click via
a ref, not three separate implementations.

**Verified this session:** re-read `ImageUploadField.jsx`'s compact
branch directly — the `onClick` prop is present on `.compactShell`
exactly as described above, `disabled={disabled || isProcessing}` is
also carried over from the same pattern, and no `compact`-specific
click handling exists anywhere else in the file that could conflict
with it.

`docs/TASKS.md`'s 11.5a-v ticked (backfilled), which completes **11.5a
(4/4 sub-tasks, now all built/verified)**. Next up: **11.5b** — the
selected state inside the compact row (thumbnail swap + title/subtitle
swap once a file is picked or `value` already holds an uploaded URL).

---

**11.5b — Selected state inside the `compact` row (thumbnail swap +
title/subtitle swap).** Covers all three sub-tasks (11.5b-i/ii/iii)
together since they're one small, tightly-coupled change to the same
handful of JSX lines, same "one entry for a few-line group" precedent
smaller multi-part sub-tasks elsewhere in this file already use.

**Built:**
- 11.5b-i — the compact button's leading slot now branches on
  `displayedPreview` (the same existing local-state-or-`value` variable
  every other layout already reads, no second preview source added):
  when it's set, a new `.compactThumbnail` wrapping an `<img
  src={displayedPreview} alt="" />` renders instead of `icon`; when it
  isn't, `icon` renders exactly as 11.5a-ii left it. `icon` itself
  isn't touched or dropped — it's just not the thing on screen while a
  preview exists, and reappears the moment `displayedPreview` goes back
  to `null` (e.g. an external `value` reset).
- 11.5b-ii — no separate "become `changeLabel`" logic was needed for
  the title: `buttonLabel` (used for both the `aria-label` and the
  visible `.compactTitle` text) already resolves to `changeLabel` once
  `displayedPreview` is truthy, from 11.5a-iii/the original
  `buttonLabel` computation. The actual change is the subtitle:
  `.compactSubtitle` now renders only when `helperText && !displayedPreview`,
  so the empty-state prompt copy (e.g. "Take a screenshot…") disappears
  once a screenshot is selected rather than staying visible and stale
  underneath the now-`changeLabel` title. No replacement subtitle
  string invented, per the task's own explicit scope — a filled row is
  just a thumbnail + single title line.
- `.compactThumbnail`/`.compactThumbnailImage` CSS: same 36×36px
  footprint and `margin-right` as `.compactIcon` so the icon-vs-
  thumbnail swap changes only the tile's contents, not the row's
  layout (title/subtitle/chevron don't shift), `object-fit: cover` +
  `overflow: hidden` for the crop, `border-radius: var(--radius-md)`
  to match `.compactIcon`'s own corner.

**Verification this session:** same `esbuild`-via-`tsx` method the
11.5a-i/ii entries used (still no npm-registry/browser access). The
edited component alone bundles clean (16.7KB JS/6.1KB CSS in
isolation); a full `App.jsx` bundle (400.6KB JS/152.2KB CSS, every
route including the two other `ImageUploadField` call sites, neither of
which passes `compact`) also resolves with zero errors beyond the one
pre-existing `import.meta`/IIFE warning `api/client.js` has always
produced under this same bundling method (unrelated to this change).
Every `styles.*` class referenced in the component script-diffed
against the CSS module's own definitions: the two lists match exactly,
zero missing, zero newly-dead. 11.5b-iii's verification is by
inspection of the source rather than a real render: both branches that
populate `displayedPreview` (`previewUrl` from a freshly-compressed
local file, or `value` from a prop) feed the exact same
`{displayedPreview}` reference into the same `<img>` in the same
`.compactThumbnail` wrapper — there's only one render path for either
case, not two that could drift apart, so "renders identically" holds
structurally rather than needing a side-by-side screenshot. Real-render
visual/responsive verification against the reference image is still
deferred to 11.9, same as every other Task 11 component/sub-task so far.

`docs/TASKS.md`'s 11.5b (and all three of 11.5b-i/ii/iii) ticked, which
completes **11.5 → the `compact` `ImageUploadField` variant itself is
now fully built** (groundwork 11.5a plus its selected state 11.5b).
Nothing yet actually renders this mode on screen — `Checkout.jsx`
doesn't call `ImageUploadField` with `compact` yet, same "component
exists, nothing wires it up" gap 11.5a-ii's own entry already flagged
for `icon`/`<CameraIcon />`. Next up: **11.5c** — wiring the compact
row into `Checkout.jsx` itself, under the Payment method section
(local `pendingScreenshotFile`/`screenshotFieldError` state, the new
section heading + row, `value` from `cart.paymentScreenshotUrl`,
`onChange`/`onError` wired to the new local state).

---

**11.5c/11.5d — Wire the `compact` `ImageUploadField` row into
`Checkout.jsx`, under Payment method.** Covers 11.5c's four sub-tasks
plus 11.5d's verify-only line together — one small addition to one
file, same "one entry for a tightly-coupled group" precedent 11.5b's
own entry above already used.

**Built:**
- 11.5c-i — `pendingScreenshotFile`/`screenshotFieldError` local state,
  added to this file's existing top-level `useState` cluster right
  after the payment-method modal state, mirroring the old
  `PaymentScreenshot.jsx`'s `pendingFile`/`fieldError` (Task 3.14)
  one-for-one under new names that stay unambiguous next to 11.3's own
  `customerInfo*` state. `handleScreenshotChange`/`handleScreenshotError`
  are thin setters only — no upload call anywhere in them.
- 11.5c-ii — a new `<section className={styles.screenshotSection}>`
  after the Payment method section, gated on the same `itemCount > 0`
  every other section already checks. Its own `.sectionHeading` reads
  "Upload payment screenshot" with the `CameraIcon` (11.0c), same
  heading shape `.detailsSection`/`.paymentSection` already use.
  `.screenshotSection` CSS mirrors `.paymentSection`'s own bare
  `flex-direction: column` rhythm — no extra card-shell rule needed
  since `ImageUploadField`'s `compact` mode already draws its own
  bordered row (11.5a).
- 11.5c-iii — `value={cart.paymentScreenshotUrl}`, so a screenshot from
  an earlier visit (same `sessionStorage`-backed cart every other field
  on this page already reads/writes) shows selected via 11.5b's own
  thumbnail-swap branch, no new code path.
- 11.5c-iv — `onChange={handleScreenshotChange}` /
  `onError={handleScreenshotError}`, both from 11.5c-i above. `required`
  is passed (mirroring the old screen's own call) but doesn't block
  anything by itself yet — enforcing it is 11.6a's combined-gate job,
  not this task's.
- 11.5d — `maxDimension={2400}`/`quality={0.95}` carried over unchanged
  from the old `PaymentScreenshot.jsx` call site onto this new one, same
  reasoning that screen's own doc comment already gives (a legible-text
  screenshot needs closer-to-lossless client-side recompression than
  this component's default photographic-image tuning).
- `chooseLabel`/`changeLabel`/`helperText` copy: "Upload payment
  screenshot" / "Change screenshot" / "Take a screenshot or choose from
  gallery" — the first and third match
  `docs/reference_ui/phase11_checkout_reference.jpg`'s own row text
  exactly; "Change screenshot" (the row's title once one's selected)
  isn't shown in that reference image at all (it draws only the empty
  state) and isn't named anywhere in `docs/NATRA_MASTER_PROMPT.md`
  either, so it's this task's own invented copy, kept short and in the
  same voice as `badgeCaption`'s own "Edit logo"-style precedent
  elsewhere in this component rather than reusing the generic
  `changeLabel` default ("Change image").

**Verification this session:** same `esbuild`-via-`tsx` method every
prior Task 11 entry has used (still no npm-registry/browser access).
`Checkout.jsx` alone bundles clean (73.0KB JS/25.2KB CSS); a full
`App.jsx` bundle (402.6KB JS/152.3KB CSS, every route) also resolves
with zero errors beyond the one pre-existing `import.meta`/IIFE warning
already flagged in 11.5b's own entry (unrelated to this change). Every
`styles.*` class referenced in `Checkout.jsx` script-diffed against
`Checkout.module.css`'s own definitions: zero missing, zero newly-dead.
Real-render visual/responsive verification against the reference image
— including whether this section's own heading should actually sit
flush under the payment-method card rather than as a separately-spaced
section, which the reference's own layout suggests but this task's
`docs/TASKS.md` wording doesn't call out either way — is still deferred
to 11.9, same as every other Task 11 sub-task so far.

`docs/TASKS.md`'s 11.5c (all four sub-tasks) and 11.5d ticked, which
completes **Task 11.5 in full (11.5a–11.5d)** — the "Upload payment
screenshot" row is now real, rendered, and wired on the merged Checkout
page, with only the actual upload/submit call still outstanding. Next
up: **11.6** — the "Place order" action (combined enablement gate
across 11.3/11.4/11.5, uploading the pending screenshot and calling
`POST /orders` on press, a single loading label, and error handling).

---

**11.6 — "Place order" action, folded into `Checkout.jsx`.** Moves
`OrderConfirmation.jsx`'s (Task 3.15/3.16) submit logic from an
on-mount effect on its own separate screen to a button press on this
merged page. Covers all four sub-tasks (11.6a–d) together.

**Built:**
- 11.6a — `canPlaceOrder`, a plain `useMemo`-free boolean derived each
  render from `hasValidCustomerInfo` (`customerInfoErrors` — already
  computed by 11.3's own `validateCustomerInfo` — has zero keys),
  `hasPaymentMethod` (`selectedPaymentMethod` non-null, 11.4b-i's own
  fallback-resolved value) and `hasScreenshot` (`pendingScreenshotFile`
  or `cart.paymentScreenshotUrl`, 11.5's own state), `&&`-ed with
  `itemCount > 0`. Same three checks the three old separate screens
  each made on their own "Continue" button, now evaluated together
  against the one button this merged page has instead of three.
- 11.6b — `placeOrder`, a `useCallback`'d async function passed into
  `useMutation` (the same hook every other write call in this codebase
  uses, Task 3.1): if `pendingScreenshotFile` is set, it uploads via
  `POST /uploads/payment-screenshot` (`FormData`, the exact call the
  old `PaymentScreenshot.jsx` made) and commits the returned URL via
  `setPaymentScreenshotUrl` *before* going on to submit — so a
  screenshot that uploaded fine but was followed by a failed
  `POST /orders` doesn't get silently re-uploaded (and duplicated in
  Object Storage) on retry; the retry just reuses the already-committed
  URL and goes straight to retrying the order call. If nothing new was
  picked, the existing `cart.paymentScreenshotUrl` is reused untouched,
  same "no redundant re-upload" behavior the old screen's own
  `handleContinue` already had. The `POST /orders` payload itself is
  byte-for-byte the same shape `OrderConfirmation.jsx`'s own
  `submitOrder` built — `customer_name`/`customer_phone`/
  `customer_location_text`/`customer_note`/`payment_method_id`/
  `payment_screenshot_url`/`items` (`food_id`/`quantity` pairs) — with
  one deliberate difference: `payment_method_id` is
  `selectedPaymentMethod?.id` (the fallback-resolved method the summary
  row actually shows) rather than the raw `cart.paymentMethodId`, which
  stays `null` whenever the customer never explicitly opened 11.4c's
  modal and is only relying on 11.4b-i's "first active method" default
  — the submitted order now agrees with what's actually on screen
  rather than a still-`null` id that would 400 against the backend's
  own required field.
- 11.6c — `isPlacingOrder` (this same `useMutation`'s own `loading`)
  drives one label, `"Placing your order…"`, covering both the upload
  and submit legs of `placeOrder` — replacing the old two-screen split
  (`PaymentScreenshot.jsx`'s `"Uploading…"` / `OrderConfirmation.jsx`'s
  `"Placing your order…"`), since from this one button's perspective
  there's now a single combined action in flight, not two the customer
  ever sees separately.
- 11.6d — `placeOrderError` (same hook's own `error`) renders as an
  inline `role="alert"` paragraph above the button when set, reading
  `placeOrderError.message` with the exact same
  `|| 'Something went wrong. Please try again.'` fallback
  `OrderConfirmation.jsx`'s own error branch used — no new copy
  invented. There's no separate "Try again" control the way that old,
  now-effectively-retired screen had one: `handlePlaceOrder` is the only
  thing that ever calls `placeOrderMutate`, so a second press on the
  same "Place order" button *is* the retry, re-running 11.6b's combined
  logic from the top (including reusing an already-uploaded screenshot
  URL per 11.6b's own note above, so a retry after an order-submission
  failure never re-uploads).
- New `.placeOrderSection`/`.placeOrderError`/`.placeOrderButton`/
  `.placeOrderIcon` CSS: a full-width solid button using
  `--gradient-button-primary` (the same fill `OwnerLogin.module.css`'s/
  `AdminLogin.module.css`'s own primary submit buttons already use for
  "the one action that finishes a form," rather than `.buyNowButton`'s
  flat color or `.addItemButton`'s outlined pill — neither of those two
  carries the same "this is what finishes the whole page" weight this
  one needs to), the `CardIcon` (11.0c, already imported for the
  Payment method heading) inline before the label, and the button's own
  text reading `"Place order • {formattedSubtotal}"` when not loading —
  matching `docs/reference_ui/phase11_checkout_reference.jpg`'s own
  "Place order • 200 ETB" copy, reusing 11.1d's already-computed
  `formattedSubtotal` rather than a third total calculation on this
  page.

**Explicitly NOT built this task** (per `docs/TASKS.md`'s own 11.7b
line, not an oversight): no success modal opens on a successful
`placeOrderMutate()`, and `clearCart()` never fires here. Both are
11.7's own named job — "wire the modal open state to a successful
`mutate()` result from 11.6; `clearCart()` still fires immediately on
success, same as today." A successful order today therefore places for
real (the row lands in the DB, `placeOrderError` stays `null`,
`isPlacingOrder` returns to `false`) but nothing yet visibly changes on
screen — the button just becomes clickable again with no on-screen
confirmation, until 11.7 wires that up. Also not built: the button also
isn't positioned as `docs/reference_ui/phase11_checkout_reference.jpg`'s
own sticky bottom bar treatment — it renders inline at the end of
`.page`'s normal scroll instead, since no `docs/TASKS.md` sub-task
under 11.6 names that layout explicitly and real-render visual
positioning against the reference is 11.9's own deferred job, same as
every other Task 11 sub-task so far; flagged here rather than guessed
at.

**Verification this session:** same `esbuild`-via-`tsx` method every
prior Task 11 entry has used. `Checkout.jsx` alone bundles clean
(76.4KB JS/26.2KB CSS); a full `App.jsx` bundle (405.3KB JS/153.3KB
CSS, every route) also resolves with zero errors beyond the one
pre-existing `import.meta`/IIFE warning already flagged in prior
entries (unrelated). Every `styles.*` class referenced in `Checkout.jsx`
script-diffed against `Checkout.module.css`'s own definitions: zero
missing, zero newly-dead. The `payload`/response shapes were
cross-checked directly against `backend/src/controllers/orderController.js`'s
own `createOrderSchema` and its `res.status(201).json({ order, items })`
— `{ order }` is destructured the same way `OrderConfirmation.jsx`'s
own `.then((data) => data.order)` already relied on. No real network
call/real-render check (still no npm-registry/browser access) — this
is verified by reading both ends of the contract, not by exercising it.

`docs/TASKS.md`'s 11.6 (all four sub-tasks) ticked. Next up: **11.7** —
the success state, a centered `Modal` overlay reusing
`OrderConfirmation.jsx`'s exact existing success markup, wired to a
successful `mutate()` result from this task's own `placeOrderMutate`,
firing `clearCart()` on open.

---

**11.7 — success state, the existing `Modal` component reused as a
centered overlay, per the project owner's own decision recorded at the
top of Phase 11 in `docs/TASKS.md`.** Covers all three sub-tasks
(11.7a–c) together, same "one small, tightly-coupled task" grouping
11.6's own entry used.

**Built:**
- `clearCart` is now destructured alongside `cart`/`addItem`/etc. from
  this file's single `useOrderCart()` call (11.1d's own "every later
  section reads `cart` and its setters back out as props from this one
  call" convention, extended to the one mutator this task is the first
  to actually need).
- `placeOrder`'s own `useMutation(placeOrder)` call now also destructures
  `data: placedOrder` and `reset: resetPlaceOrder` (11.6 only ever needed
  `mutate`/`error`/`loading`). **11.7b** — `handlePlaceOrder` now chains
  `.then(() => clearCart())` onto `placeOrderMutate()`, exactly
  `OrderConfirmation.jsx`'s own mount effect's `mutate().then(() =>
  clearCart())` shape (Task 3.16), so a successful placement empties the
  cart immediately, same as today. The modal's own `isOpen` needs no
  separate boolean state of its own — it's simply `Boolean(placedOrder)`
  (this same hook's `data`), which `useMutation` itself already resets to
  `null` at the start of every fresh `mutate()` call, so a second
  "Place order" press (impossible today since the button's own section is
  hidden once `itemCount` hits zero, but kept correct in case that ever
  changes) can't leave a stale modal open across two different orders.
- **11.7a** — the modal's body is `OrderConfirmation.jsx`'s own success
  markup (Task 3.16), ported line-for-line: the same checkmark glyph,
  "Order placed!" heading, the same instructions sentence, `order_code`
  in a highlighted box, and the same two buttons — not re-worded or
  restructured, per this task's own "reuse... exact existing success
  markup" wording. Classes are new (`.successModalContent`/`.successIcon`/
  `.successHeading`/`.successInstructions`/`.successOrderCode`/
  `.successPrimaryButton`/`.successSecondaryButton` in
  `Checkout.module.css`), ported rather than imported from
  `OrderConfirmation.module.css` — that file is one of Phase 11's own
  eventual deletions (11.8c), the same "nothing new here should come to
  depend on it" reasoning this file's own header comment already gives
  for `.modalMethodCardSelected` not importing `PaymentMethod.module.css`
  either. `Modal`'s own `size="sm"` (360px cap) and its own
  background/radius/padding chrome supply the card shell — these new
  classes are only the content inside it, matching how the existing
  `size="sm"` payment-method modal (11.4c) already uses this component.
  No `title` prop is passed (unlike that payment-method modal): the
  reference's success card is its own centered icon+heading, not a
  left-aligned modal title bar, so `ariaLabel="Order placed"` names the
  dialog for assistive tech instead, per `Modal.jsx`'s own
  `aria-label={!title ? ariaLabel : undefined}` branch.
- **11.7c** — "Track order"/"Back to home" navigate to the exact same two
  destinations `OrderConfirmation.jsx` already used (`/track`, `/`) — no
  new destinations. Each button also calls the new
  `handleCloseSuccessModal` (`resetPlaceOrder()`, clearing `placedOrder`
  back to `null`) immediately before navigating, even though the
  navigation itself unmounts this whole page either way — a small
  defensive step in case a future refactor ever keeps `Checkout` mounted
  across that navigation (e.g. a shared layout route), so `placedOrder`
  never lingers stale in that case. `handleCloseSuccessModal` is also
  `Modal`'s own `onClose` (backdrop click, Escape, the built-in close
  button) — per the project owner's own decision, dismissing the modal
  any other way doesn't navigate anywhere; it just closes the modal and
  leaves the customer on this same checkout page, which is already
  showing 11.2's own empty-cart `EmptyState` underneath by this point
  (`cart.items` was already cleared by 11.7b), "which is fine since
  there's nothing left to resume," per that same decision's own wording.

**Verification this session:** same `esbuild`-via-`tsx` method every
prior Task 11 entry has used, now confirmed with the real installed
`esbuild` binary directly (`--external react/react-dom/react-router-dom`,
since this checkout still has no `node_modules`): `Checkout.jsx` alone
bundles clean (74.0KB JS/28.3KB CSS), and a full `App.jsx` bundle
(386.2KB JS/155.4KB CSS, every route) also resolves with zero errors.
Every `styles.*` class referenced in `Checkout.jsx` script-diffed against
`Checkout.module.css`'s own definitions: zero missing, zero newly-dead.
`docs/global.css`'s own `--color-surface-muted`/`--gradient-button-primary`
tokens (both already used elsewhere on this same page, e.g.
`.placeOrderButton`) were re-confirmed present before reuse in the new
success-button classes, rather than assumed. No real network call/render
check (still no npm-registry/browser access) — this is verified by
reading both ends of the `useMutation`/`Modal` contract, not by exercising
it in a browser; real-render visual/responsive verification against the
reference image remains 11.9's own deferred job, same as every other
Task 11 section so far.

`docs/TASKS.md`'s 11.7 (all three sub-tasks) ticked. Next up: **11.8** —
routing/cleanup: verify nothing else references the four routes being
retired, remove `/order/customer-info`, `/order/payment-method`,
`/order/payment-screenshot`, and `/order/confirm` from `App.jsx`, and
delete `CustomerInfo.jsx`/`PaymentMethod.jsx`/`PaymentScreenshot.jsx`/
`OrderConfirmation.jsx` plus their `.module.css` files once confirmed
unreferenced.

---

**11.8 — routing/cleanup, all three sub-tasks done this session, with
real npm-registry/browser access for once** (unlike almost every prior
Task 11 session, `npm ping` succeeded this time, so this task's own
verification is a real `vite build` + a real headless-Chromium
click-through, not the `esbuild`-via-`tsx`/manual-trace fallback every
earlier Task 11 entry had to use).

- **11.8a (verify only)** — re-confirmed the premise before deleting
  anything, not just trusted the earlier "only FoodDetails.jsx's Buy Now"
  note: grepped the whole frontend for the four retiring route strings
  (`order/customer-info`/`order/payment-method`/
  `order/payment-screenshot`/`order/confirm`) and for the four component
  names (`CustomerInfo`/`PaymentMethod`/`PaymentScreenshot`/
  `OrderConfirmation`). Every hit outside `App.jsx` and the four
  components' own files was either a doc-comment mention (e.g.
  `Checkout.jsx`'s own header comment explaining what it folded in from
  each) or an unrelated identifier that happens to share a word
  (`useOrderCart.js`'s `setPaymentMethod`/`setCustomerInfo` setters,
  `OwnerRestaurant.jsx`'s own restaurant-side `fetchPaymentMethods`/
  `savePaymentMethod` — a different, still-in-use feature: an owner's
  payment *methods* list, Task 5.7, not the customer checkout screen
  being retired) — none a real import or route reference. A direct
  `^import.*` grep confirmed only `App.jsx` imports any of the four
  components. Nothing needed fixing before 11.8b/c could proceed safely.
- **11.8b** — removed all four imports and all four `<Route>` elements
  (plus their doc comments) from `App.jsx`, replacing them with one new
  comment explaining the retirement and pointing at 11.8a's verification
  rather than leaving four gaps with no explanation. `/order/builder`
  (Checkout) and every other route are untouched.
- **11.8c** — deleted the four now-fully-unreferenced directories
  outright (`pages/CustomerInfo/`, `pages/PaymentMethod/`,
  `pages/PaymentScreenshot/`, `pages/OrderConfirmation/`, each with its
  own `.jsx`/`.module.css`/`index.js`) — re-grepped immediately
  beforehand (import-path grep for `pages/CustomerInfo` etc., plus a
  scan of every `.test.*` file) to reconfirm zero remaining references,
  same convention `10.5f-iii`/`10.5g-iii` used before their own deletions.

**Verification, real this time:** `npm ci` (280 packages, clean) +
`npx vite build` — 205 modules transformed, zero errors, output
identical in size/hash before and after 11.8c's deletion
(`index-CoOPD2qa.js` 361.67 kB / `index-BvQPzsni.css` 126.67 kB both
times) — confirming the four deleted files were genuinely dead weight,
not still being bundled in under another path. `npx eslint src` still
can't run (no ESLint config file in the repo, same standing gap noted
since Task 10.1c-i — not this task's to fix). Then a real headless
Chromium (Playwright, also newly available this session) served the
production build via `vite preview` and navigated to all four retired
paths plus `/order/builder` and `/`: all four retired routes now render
the real `NotFound` screen ("Page not found" / "Go to Home", Task
8.7d) instead of 404ing at the server or throwing, `/order/builder`
still renders Checkout's own empty-cart `EmptyState` correctly, and `/`
renders Home normally — zero console/page errors on any of the six
navigations.

`docs/TASKS.md`'s 11.8 (all three sub-tasks plus its own top-level box)
ticked. Next up: **11.9** — the formal responsive/verification pass on
the whole merged Checkout page at 320/390/768/1024/1280/1920px + a
667×375 landscape phone, the same real-render bar 10.2f/10.3h/10.4f/
10.5i already used — which closes out all of Phase 11. Worth noting for
whoever picks that up: this session had real npm-registry/browser
access, worth checking whether it's still available before falling back
to a manual CSS trace.

---

**11.9e — 44px tap-target sweep across every control on the Checkout
page, one real gap found and fixed.**

**Verification access this session:** `npm ping` failed (403, no
registry access) — back to the standing `esbuild`-via-`tsx` fallback
every non-11.8 Task 11 entry has used, not the real `vite build`/
Playwright pass 11.8 got to use for once.

Swept every interactive control rendered by `Checkout.jsx` against the
44×44px floor Task 8.9a/8.9a2 established as this codebase's standing
rule:

- **`.backButton`** (header icon button) — already 44×44px explicitly,
  from Task 11.1b.
- **`.removeButton`**, **`.retryButtonInline`** (both instances —
  order-section and payment-section), **`.addItemButton`**,
  **`.paymentSummaryRow`**, **`.placeOrderButton`**,
  **`.successPrimaryButton`**, **`.successSecondaryButton`** — all
  already carry `min-height: 44px` (plus `inline-flex`/`align-items:
  center` on the text-link-style ones), each built with Task 8.9a2's
  rule already in mind at its own construction time.
- **`.modalMethodCard`** — no explicit `min-height`, but its own
  content is always 2-3 lines (method name + account number + account
  name, sometimes instructions too) plus `--space-md` padding on all
  sides, so real height is always well over 44px regardless of content
  length — same "content naturally clears the floor" reasoning already
  accepted elsewhere in this codebase for multi-line cards, no fix
  needed.
- **`QuantityStepper`, `Modal`'s close button, `ImageUploadField`'s
  compact upload button** — shared components, already fixed at Task
  8.9a2; nothing page-specific to redo here.
- **`.emptyStateLink`** ("Browse restaurants," the empty-cart
  `EmptyState`'s action) — **real gap.** Plain underlined text with no
  `min-height`/`inline-flex` floor, added in Task 11.2 before this
  file's later sections (11.2b-vi's `.removeButton`, 11.4/11.6's inline
  retry buttons) had each independently re-applied Task 8.9a2's rule —
  this one earlier instance was missed. At `font-size-body`'s normal
  line-height it sits at roughly 20px tall. Fixed: added
  `display: inline-flex; align-items: center; min-height: 44px;` to
  `.emptyStateLink`, same shape `.removeButton`/`.retryButtonInline`
  already use — no change to the visible underlined text itself, and
  `EmptyState`'s own `.actionSlot` wrapper (a plain centered block, not
  flex) needs no change for the taller inline-flex child to still sit
  centered.

**Flagged, not fixed (out of scope for a page-specific sweep):**
`FormField`'s own `.control` (the Name/Phone/Delivery-location/Note
inputs) has no explicit height floor either — `--space-sm` (8px)
padding + `font-size-body`'s line-height computes to roughly 36px for a
single-line input, the same "~36px borderline" category Task 8.9a
already logged for `ImageUploadField`'s upload button before that one
got fixed at 8.9a2. This is a shared component used by every form
screen in the app (owner/admin login, restaurant profile, etc.), not
something introduced by or specific to Checkout — a cross-cutting fix
belongs in its own task against `FormField` directly, not folded
silently into this page's sweep.

**Verification:** `esbuild`-bundle of the full `App.jsx` (390.8kb JS /
147.8kb CSS, only the standing `import.meta` warning, zero errors) plus
a script diff of every `styles.*` reference in `Checkout.jsx` against
`Checkout.module.css`'s own class definitions (0 missing) — confirms
the one-line CSS-only edit didn't break anything and touches no JSX.
Real-render/visual confirmation that `.emptyStateLink` now measures
44px tall in a browser is still outstanding, same standing no-browser-
access gap every non-11.8 Task 11 entry has flagged.

`docs/TASKS.md`'s 11.9e ticked. Next up: **11.9f** — compare the
finished Checkout page to `docs/reference_ui/phase11_checkout_reference.jpg`,
log deviations in this file, and tick the top-level 11.9 box, which
closes out all of Phase 11 (pending **11.9az**'s still-open project-
owner decision on the header-overflow finding, which sits outside
11.9's own six lettered sub-tasks).

---

**11.9f — Compared the finished Checkout page to
`phase11_checkout_reference.jpg`, section by section, both JSX/CSS
against the image. Closes out Phase 11's own six lettered 11.9
sub-tasks (11.9az stays open separately, see below).**

**Verification access this session:** same standing gap — `npm ping`
403s (no registry access), so this is a manual side-by-side read of
the reference image against `Checkout.jsx`/`Checkout.module.css`, not
a real rendered screenshot diff.

**Matches confirmed, no findings:** header (back arrow / "Checkout"
title / outlined cart-summary pill reading "N items • total ETB");
"Your order" heading (no icon, matching the reference); item rows
(64px image, name/description/price, stepper+Remove stacked at the
row's trailing edge); "Add another item" pill (orange-outlined, solid
round "+" glyph, matching the reference's filled-circle treatment
rather than an outlined one); "Your details" heading + all four
field icons (person/phone/pin/note, each left of its own label,
per-field, matching the reference exactly); "Payment method" heading
icon; the screenshot row's dashed-bordered shell/camera icon/title-
subtitle/chevron shape; "Place order • [total] ETB" button (card icon,
solid gradient fill, full width).

**Expected, already-decided non-matches (not new findings):**
1. **No "Delivery fee" row** in the Subtotal/Total block — matches the
   project owner's own decision #2 at the top of Phase 11 in
   `docs/TASKS.md`, not a gap.
2. **"Upload payment screenshot" has its own `<h2>` section heading**
   (with `CameraIcon`) where the reference shows that row sitting
   directly under the payment-method card with no heading between
   them. Already self-flagged in `Checkout.jsx`'s own 11.5c-ii comment
   at build time as a known scope choice, per that task's explicit
   `docs/TASKS.md` wording — reconfirmed here, not a new finding.
   Recommend leaving as-is: every other section on this page gets its
   own heading, and a headed screenshot row is more consistent with
   that pattern than a literal reference match would be.

**New finding, not fixed — logged with options, same
flag-don't-pick-unasked convention `11.9az`/`10.2z` already
established for this codebase:**

3. **`.paymentSummaryRow` (the tappable payment-method preview) is
   missing the reference's selected-radio dot and a leading
   payment-type icon.** The reference row shows, left to right: a
   filled orange radio circle, a small device/card glyph, then the
   method name / account number / account holder text, then the
   trailing chevron. The built row renders only the text block plus
   chevron — no radio indicator, no leading icon. This sits outside
   decision #3's own wording ("preview + tap-to-open list") — that
   decision covers the row's *behavior*, not this specific radio+icon
   visual treatment, so it wasn't resolved by it. No payment-specific
   icon (CBE vs. Telebirr) exists in the codebase's built icon set
   (11.0c's 8 icons), and `CardIcon` is already used twice elsewhere on
   this same page (the "Payment method" heading, the place-order
   button) — reusing it a third time here is possible but duplicates
   one glyph three times on one screen. Options for the project owner:
   (a) add a small leading `CardIcon` reuse + a plain decorative
   selected-radio dot before the text block, closest to the reference;
   (b) drop the radio+icon idea and keep today's text-only summary row,
   since the modal it opens already gives a clearer per-method
   selection affordance than a static preview radio would; (c) accept
   as-is, no visual change. **Awaiting project owner decision** —
   logged here rather than fixed, same as `11.9az`.

**Verification:** visual/structural comparison only (see access note
above); no code changed this task, so no `esbuild`/class-diff check
was needed.

`docs/TASKS.md`'s 11.9f ticked, and the top-level 11.9 box ticked —
this closes out all six of Phase 11's 11.9 sub-tasks. **11.9az** (the
320px header-overflow finding) and the new payment-summary-row finding
above both remain open, awaiting the project owner's decision on each;
neither blocks 11.9's own box per that entry's own framing. Phase 11
is otherwise complete: 11.0-11.8 fully built, 11.9's verification pass
done. Next up, once the project owner weighs in on 11.9az and the new
payment-summary-row finding: Phase 12 (see `docs/ROADMAP.md`) or
whatever the project owner scopes next.

## Task 11.1e + 11.9az — project owner decisions resolved

**11.1e** (verify no dead/zero cart pill shows over an empty-cart
`EmptyState`): checked against the real, now-built `Checkout.jsx` —
the cart-summary pill (`.cartPill`) is gated on `itemCount > 0` and
the "Your order" section renders `EmptyState` exactly when
`itemCount === 0`, so the two are mutually exclusive by construction:
a genuinely empty cart shows the empty-state message with no pill
above it, never a "0 items" pill. No code change needed — this was a
verify-only task, and 11.2's own empty-cart branch (built after 11.1e
was first flagged as blocked) is what finally made the check possible.
Ticked in `docs/TASKS.md`.

**11.9az** (320px header overflow — cart pill + title/back-row can't
both fit): project owner decision — collapse the pill to an icon-only
badge below 400px rather than wrapping it to a second line or
shrinking its text. Implemented in `Checkout.module.css`: a
`@media (max-width: 400px)` block visually hides `.cartPillText` (the
same off-screen-clip pattern `ToggleSwitch`/`RoleShell`/
`ImageUploadField`/`OwnerDashboard` already use for icon-only controls,
so the item count/total stay announced to assistive tech) and tightens
`.cartPill`'s padding so the badge reads as a small circle around
`CartIcon` rather than an oval sized for text that's no longer there.
400px was chosen with margin over both of the finding's own computed
minimums (≈322px for a tiny cart, ≈372px for a larger one), so one
breakpoint covers every real cart content length. No JSX change — the
pill's markup (icon + text span) is unchanged; only the text's
visibility is media-gated. Verified by trace at 320/390/400/401px:
overflow is gone at 320/390, and the full pill (with text) still
renders normally at 401px and above. Ticked in `docs/TASKS.md`.

Still open, awaiting project owner decision (not part of this task):
the payment-summary-row radio-dot/leading-icon finding logged just
above this entry (#3) — untouched by either of today's two decisions.

## Payment-summary-row finding (#3) resolved — plain dot only

Project owner decision on the open `.paymentSummaryRow` finding logged
under 11.9f: add back the reference's selected-radio dot, but not its
leading payment-type icon (option (a) as partially worded, minus the
`CardIcon` reuse half). Implemented in `Checkout.jsx`/`.module.css`: a
new decorative `<span className={styles.paymentSummaryDot} />`
(`aria-hidden="true"`) rendered before `.paymentSummaryInfo` inside the
tappable summary row, styled as a small solid `--color-primary` circle
(10px, `border-radius: 50%`). No icon added — `CardIcon` still appears
only in its existing two spots on this page (the section heading, the
place-order button). The dot is purely decorative: this closed row
only ever shows the one currently-selected method, so there's nothing
for assistive tech to gain from it beyond the row's own text; the
modal's own `.modalMethodCardSelected` (11.4c) remains the real
selected-state indicator once it's open. No other findings open from
11.9f — Phase 11 is fully resolved.

## Task 11.10 (logged, not yet built) — ghost cart item blocks checkout permanently

Found during a post-completion bug review of the whole Phase 11 merge,
not during a numbered task session. Traced end-to-end, not yet fixed —
`docs/TASKS.md`'s 11.10 breakdown is the fix plan.

**Root cause chain, in `Checkout.jsx` as it stands today:**
1. Each cart line is rendered by looking up `foodsById.get(item.foodId)`
   (the "Your order" section's item map). If a restaurant hides or
   deletes a food after it was added to the cart, this lookup fails and
   the row is skipped outright: `if (!food) return null;` — no message,
   no placeholder.
2. `cart.items` itself is never filtered to match — the ghost item
   stays in it. The `Remove` button only exists inside that same
   per-item render, so there is no control anywhere on the page that
   can reach an item whose row isn't rendering.
3. The `subtotal` `useMemo` aborts to `null` the instant *any* item's
   food is missing, so Subtotal/Total and the header pill all show "—"
   with no explanation of why.
4. `canPlaceOrder` never checks any of this — none of the three
   required checks (customer info, payment method, screenshot) touch
   `foodsById` — so "Place order" stays enabled and pressing it sends
   `cart.items.map(...)` (still including the ghost item's `food_id`)
   straight to `POST /orders`.
5. The backend (`submitOrder.js`) correctly rejects it —
   `"${food.name}" is no longer available"` — naming the food, but the
   customer has no way to act on that: it isn't visible in their cart
   to remove.
6. The only existing escape hatch is `useOrderCart`'s own
   restaurant-swap behavior in `addItem` (buying from a *different*
   restaurant wipes the whole cart) — there's no way to drop just the
   one bad item and keep the rest.

**Why this wasn't caught by 11.9's own passes:** 11.9c's error-states
work (see that entry above) fixed the *whole-fetch-failed* case
(`cartFoodsError`/loading) but never the *per-item-missing* case, and
this project has had no real browser access all session to actually
trigger a food going hidden mid-cart and observe the dead end.

**Fix plan** (see `docs/TASKS.md`'s 11.10a-d): filter `cart.items`
against `foodsById` before it feeds `subtotal`, the `/orders` payload,
or `canPlaceOrder`; surface a one-line dismissible notice per dropped
item and actually call `removeItem` for it; recompute totals from only
the resolved items instead of aborting to `null` on the first miss.

**Secondary, lower-severity finding from the same review (11.10e):**
the Buy Now hand-off effect (`useEffect(..., [])`, Task 11.2) assumes
it fires exactly once. `addItem` (`useOrderCart`) adds to an existing
line's quantity rather than replacing it, and `main.jsx` renders inside
`<React.StrictMode>`, which double-invokes mount effects in
development — so a dev build silently doubles the cart quantity on
every Buy Now arrival. Production builds don't double-invoke (React's
own StrictMode behavior), so real customers aren't affected today, but
the effect should be made idempotent (e.g. a `useRef` guard) rather
than relying on that staying true.

## Task 11.10a (built) — filtered `resolvedCartItems`

Filters `cart.items` down to lines that resolve in `foodsById` before
subtotal/the header pill, the `/orders` payload, and `canPlaceOrder`
ever see them. Full detail in `docs/TASKS.md`'s 11.10a entry. Doesn't
touch `cart.items` itself or show the customer anything — that's
11.10b below.

## Task 11.10b (built) — notice + real removal, plus a fetch-isolation prerequisite

Full detail in `docs/TASKS.md`'s 11.10b entry. One thing worth calling
out here specifically: this task surfaced that 11.10's own root-cause
chain above was itself incomplete. It describes `foodsById.get(item.foodId)`
failing gracefully for one ghost line while the rest of the cart keeps
rendering — but `fetchCartFoods`'s old implementation wrapped one
`api.get` per cart line in a single `Promise.all`, and `api.get` throws
on `getPublicFoodById`'s 404 — so in the actual old code, *any* ghost
line rejected the whole batch and the "Your order" section showed
`cartFoodsError` (an endless-loop Retry button) instead of quietly
skipping just that one row. Fixed as part of this task: each per-line
promise now catches a 404 specifically and resolves to `null` rather
than rejecting; any other failure (network, a real 500) still rejects
and reaches `cartFoodsError` exactly as before. Without this, 11.10b's
own notice+removal effect would never get a `foodsById` to compare
against for a real ghost-item case — worth knowing if a future session
finds this file's `fetchCartFoods` again and wonders why the per-line
`.catch` is there.

## Task 11.10e (built) — Buy Now hand-off idempotency

Full detail in `docs/TASKS.md`'s 11.10e entry. New `buyNowHandledRef`
(`useRef(false)`) guards the Buy Now hand-off effect: a second
same-mount invocation (`React.StrictMode`'s dev-only double-invoke)
now returns immediately instead of calling `addItem` a second time.
Verified by a scripted simulation of the double-invoke (quantity stays
1, not 2), including a control run of the old, unguarded shape against
the same scenario to confirm it really did double before this fix.

Phase 11's own 11.10 (all five sub-tasks, a-e) is now fully closed.
