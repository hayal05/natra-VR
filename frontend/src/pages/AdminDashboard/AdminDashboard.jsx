import { api } from '../../api/client';
import DashboardHeader from '../../components/DashboardHeader';
import EmptyState from '../../components/EmptyState';
import Greeting from '../../components/Greeting';
import RoleShell from '../../components/RoleShell';
import StatTile from '../../components/StatTile';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery } from '../../hooks';
import styles from './AdminDashboard.module.css';

// Fixed display order + label + `StatTile` variant for the totals row —
// mirrors `docs/TASKS.md`'s own 6.3 wording ("totals (restaurants, live,
// pending, orders)") and `services/adminDashboardSummary.js`'s
// `getTotals()` return shape verbatim. Duplicated here rather than
// shared across the frontend/backend package boundary, same
// "duplicated rather than imported" call every other frontend copy of
// a backend-owned shape already makes in this codebase (e.g.
// `OwnerDashboard.jsx`'s own `ORDER_STATUS_LABELS`).
//
// Task 10.4c — `variant` added, one per tile, chosen the same way
// `OwnerDashboard.jsx`'s own 10.3c comment already established: "match
// the reference's tints ... `info` is the closest existing blue-ish
// variant" — checked directly against
// `docs/reference_ui/phase10_admin_dashboard_reference.jpg`, which
// shows the same four-color pattern as the owner reference (orange/
// green/blue/red), just assigned to different tiles: Restaurants is
// the orange storefront tile (`primary`), Live is the green signal
// tile (`success`), Pending is the blue clock tile (`info`, same
// "closest existing blue-ish variant" reasoning), Orders is the red/
// pink document tile (`error`). `StatTile.jsx`'s own header comment
// updated alongside this file to point at each screen's own mapping
// instead of guessing one inline, since Owner's and Admin's tiles
// don't share labels/order and (as this mapping shows) "Live"/"Orders"
// aren't actually the blue-ish ones here.
const TOTAL_ITEMS = [
  { key: 'restaurants', label: 'Restaurants', variant: 'primary' },
  { key: 'live', label: 'Live', variant: 'success' },
  { key: 'pending', label: 'Pending', variant: 'info' },
  { key: 'orders', label: 'Orders', variant: 'error' },
];

// Same tone map `OwnerDashboard.jsx`'s own `ORDER_STATUS_TONE` already
// establishes for order statuses (New/Accepted/Completed/Rejected
// aren't in `StatusBadge`'s shared `STATUS_TONE` since neither
// reference image shows them) — extended here with `live_requests`'
// own pending/approved/rejected vocabulary, since the activity feed
// mixes both kinds of item. Duplicated rather than imported, same
// "not worth a cross-screen dependency for one small object" reasoning
// every prior copy of this map already gives for itself.
//
// Task 10.4d-i — `new`/`approved` moved off `neutral`/`success` onto
// the two new tinted tones StatusBadge.jsx just added (`info`/
// `primary`), matching `docs/reference_ui/phase10_admin_dashboard_
// reference.jpg`'s own leading pill per row: Pending/Accepted stay
// `neutral` (already tinted gray, already matched); Completed stays
// `success` (solid green — a flagged, accepted deviation from the
// reference's tinted green, not worth restyling the shared solid-fill
// tone other callers rely on for on-photo contrast, see
// StatusBadge.module.css's own comment); Rejected stays `error` for
// the same reason, even though it never actually appears in this
// feed's real data today (`services/adminDashboardSummary.js` only
// ever surfaces pending live requests and new orders — kept for
// completeness/robustness, not dead code with no path to it).
const ACTIVITY_STATUS_TONE = {
  new: 'info',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
  pending: 'neutral',
  approved: 'primary',
};

// Identical to OrderDetail.jsx's own `formatDateTime` — a chronological
// feed benefits from the time, not just the date, same reasoning that
// file's own header comment gives for why it shows more than
// OwnerOrders.jsx's row-summary `formatDate` does. Duplicated rather
// than imported, same "no shared date util exists yet" precedent every
// other copy of this function in this codebase already sets.
function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// One line of copy per activity item's `type` — `services/
// adminDashboardSummary.js`'s own header comment documents the two
// shapes this can be (`'live_request'` | `'order'`), each carrying
// `restaurantName` + `status` + `createdAt`, with `orderCode` only
// present on the order kind.
function describeActivityItem(item) {
  if (item.type === 'order') {
    return `New order ${item.orderCode} — ${item.restaurantName}`;
  }
  return `Live request — ${item.restaurantName}`;
}

function fetchDashboardSummary(signal) {
  return api.get('/admin/dashboard-summary', { signal });
}

// Task 10.4a-ii — the real unread count for `DashboardHeader`'s
// notification indicator (Task 10.0b-iv), same call as
// `OwnerDashboard.jsx`'s own `fetchUnreadNotificationCount` (Task
// 10.3a-ii): `GET /api/notifications?is_read=0&limit=1`, reading only
// `meta.total`. Duplicated here rather than imported, same "small
// fetcher, not worth a cross-screen dependency" reasoning that file's
// own copy already gives for itself. `notificationController.js`'s own
// header comment confirms both routes are scoped by `req.user.id`
// with no restaurant/role-specific branching, so this same endpoint
// already works for an admin caller unchanged — no backend work needed
// for this task, same as the roadmap's own admin-dashboard findings.
function fetchUnreadNotificationCount(signal) {
  return api
    .get('/notifications?is_read=0&limit=1', { signal })
    .then(({ meta }) => meta.total);
}

/**
 * AdminDashboard — Task 6.2's placeholder, filled in by Task 6.3b on
 * top of 6.3a's new `GET /api/admin/dashboard-summary`.
 *
 * One `useApiQuery` call (Task 3.1) backs both the totals row and the
 * recent-activity feed below it — unlike `OwnerDashboard.jsx`'s three
 * independent fetches (Orders/Sales/Quick-actions each scoped to one
 * owner's restaurant and each with its own `noRestaurantYet` 403 case
 * to handle separately), this screen has exactly one data source for
 * its main content and no per-section scoping question: `requireAdmin`
 * either lets the whole request through or the whole page never renders
 * past its one loading/error state. A second, independent
 * `useApiQuery` (Task 10.4a-ii, `fetchUnreadNotificationCount`) backs
 * only the header's notification indicator — kept separate so that
 * fetch's own loading/failure can't block the totals/activity content
 * from rendering, same "don't let one section's error block the rest
 * of the page" reasoning `OwnerDashboard.jsx` already established for
 * itself.
 *
 * **Totals (Task 10.4c)** render as real `StatTile`s (Task 10.0d) in a
 * 2×2 grid — `TOTAL_ITEMS`' order (Restaurants/Live/Pending/Orders),
 * each with a `variant` matched against
 * `docs/reference_ui/phase10_admin_dashboard_reference.jpg`'s own
 * tinted tiles (see `TOTAL_ITEMS`' own comment for the exact mapping).
 * Replaces 6.3b's original plain `.totalItem` divs inside the same
 * `.card` shell `OwnerDashboard.jsx` already established.
 *
 * **Recent activity** merges `live_requests` and `orders` server-side
 * (see `adminDashboardSummary.js`'s own header comment for why that
 * merge happens in the service, not here) — this screen just renders
 * the already-sorted, already-capped list: each row gets a
 * `StatusBadge` (extending `OwnerDashboard.jsx`'s own
 * `ORDER_STATUS_TONE` map with `live_requests`' pending/approved/
 * rejected vocabulary, since the feed mixes both kinds), a one-line
 * description (`describeActivityItem`), and a timestamp
 * (`formatDateTime`, matching `OrderDetail.jsx`'s choice to show time
 * as well as date for a genuinely chronological list). An empty feed
 * renders `EmptyState` (Task 2.8) rather than an empty card — a
 * brand-new platform with no restaurants/orders yet is the expected
 * first-run state here, not an error.
 */
export default function AdminDashboard() {
  const { data, error, loading, refetch } = useApiQuery(fetchDashboardSummary, []);
  // Task 10.4a-ii — see `fetchUnreadNotificationCount` above for why
  // loading/error both fall back to `undefined` rather than a `0`/stale
  // count (identical reasoning to `OwnerDashboard.jsx`'s own Task
  // 10.3a-ii comment: `DashboardHeader` already degrades to the
  // no-parenthetical "Notifications" link on `undefined`, and this
  // fetch failing isn't a reason to block the rest of the header).
  const { data: unreadNotificationCount } = useApiQuery(fetchUnreadNotificationCount, []);

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        {/* Task 10.4a-i — the old plain `<h1>Dashboard</h1>` is replaced by
            the shared `DashboardHeader` (Task 10.0b) with this screen's own
            "Admin Dashboard" subtitle, per
            `docs/reference_ui/phase10_admin_dashboard_reference.jpg`; the
            "NATRA" wordmark is that component's own content.

            Task 10.4a-iii — `accountHref` now points at the new
            `/admin/account` screen (`AdminAccount.jsx`), the project
            owner's own answer to this task's "no real destination
            exists yet" decision: a minimal profile/password/logout
            screen, ported from `OwnerAccount.jsx`. `accountLabel` is
            left unpassed, same "don't fetch a fifth value just for a
            label this task didn't ask for" reasoning `OwnerDashboard.
            jsx`'s own 10.3a-iii comment already gives for its identical
            choice — `DashboardHeader`'s own default ("Account") renders.

            Task 10.4a-ii — `notificationCount` is now the real unread
            count (`fetchUnreadNotificationCount` above), passed only once
            the fetch resolves to a number, same "no invented/stale figure"
            rule `OwnerDashboard.jsx`'s own 10.3a-ii already follows.
            `notificationHref` has to be supplied too, or `DashboardHeader`
            renders nothing for this row at all (its own "no dead link"
            rule cuts both ways). No dedicated admin notification-list
            screen exists to point at, and — checked against
            `submitOrder.js`/`notifyBeforeExpiry.js`, the only two writers
            of a `notifications` row today — nothing in this codebase
            currently creates one for an admin recipient (`recipient_id` is
            always resolved to `restaurants.owner_id`), so this count reads
            as 0 in practice until that changes; wiring it to the real
            endpoint now is still correct (not an invented number) and
            matches what the roadmap's own Customer-Home finding already
            says the schema is meant to support. Pointed at
            `/admin/live-requests` rather than `/admin/orders`: this
            dashboard's own "Recent activity" card just below already
            covers the orders half of that feed, and a pending live
            request is the one admin-facing item that genuinely needs a
            timely look. Flagged as a decision, not assumed final — revisit
            if a future task adds a real admin-notification writer whose
            `type` implies a more specific destination. */}
        <DashboardHeader
          subtitle="Admin Dashboard"
          notificationCount={unreadNotificationCount ?? undefined}
          notificationHref="/admin/live-requests"
          accountHref="/admin/account"
          className={styles.dashboardHeader}
        />
        {/* Task 10.4b — the shared `Greeting` (Task 10.0c), same component
            `OwnerDashboard.jsx`'s own 10.3b already wired, with this
            screen's own subtitle copy: "business" rather than owner's
            "restaurant", since an admin oversees the whole platform, not
            one restaurant — matches `Greeting.jsx`'s own header comment,
            which already names this exact second line for 10.4b. No old
            subheading paragraph existed on this screen to replace (unlike
            10.3b, `AdminDashboard.jsx` never had one — Task 6.3b's
            original build went straight from the old `<h1>` to the Totals
            card), so this is a pure addition, not a swap. */}
        <Greeting
          subtitle="Here's what's happening with your business today."
          className={styles.greeting}
        />

        {loading ? (
          <div className={styles.card}>
            <p className={styles.cardBody}>Loading dashboard…</p>
          </div>
        ) : error ? (
          <div className={styles.card}>
            <div className={styles.countsError}>
              <p className={styles.cardBody}>Couldn't load the dashboard.</p>
              <button type="button" className={styles.retryButtonInline} onClick={refetch}>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Totals</h2>
              {/* Task 10.4c-i..v — real `StatTile`s (Task 10.0d), replacing
                  6.3b's original plain `.totalItem` divs. All four derive
                  from the one `GET /admin/dashboard-summary` response
                  already fetched above (`data.totals`), so no backend
                  work — same "no new fetch needed" shape 10.3c-i..iv used
                  for the owner's four stats. Assembled into the reference's
                  2×2 grid (`.statGrid`, 10.4c-v) rather than reusing the
                  old `.totalsGrid`'s 2-col/4-col toggle — the reference
                  never shows four across, so `.totalsGrid` was widening
                  past what the actual design ever called for. See
                  `TOTAL_ITEMS` above for each tile's real data key, label,
                  and reference-matched `variant`. No `to` link on any
                  tile, matching Owner's own 10.3c precedent (its four
                  tiles don't link out either) — `StatTile`'s link
                  affordance stays unused here too. */}
              <div className={styles.statGrid}>
                {TOTAL_ITEMS.map(({ key, label, variant }) => (
                  <StatTile key={key} count={data.totals[key]} label={label} variant={variant} />
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recent activity</h2>
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No activity yet" description="New live requests and orders will show up here." />
              ) : (
                <ul className={styles.activityList}>
                  {/* Task 10.4d-i/ii — the leading `StatusBadge` pill (moved
                      onto the new tinted `info`/`primary` tones, see
                      `ACTIVITY_STATUS_TONE` above) was already the first
                      child of `.activityMain`, so no reordering was needed
                      here — 10.4d-i's own work was the color mapping, not
                      the layout. Reference shows a trailing chevron ("›")
                      on every row; deliberately not added here, same
                      "don't add a directional/clickable cue a row can't
                      back up" call Task 10.3f-i's own comment already made
                      for its own notification rows — nothing in this
                      screen makes an activity row a link/button (no
                      `onClick`, no route), and 10.4d-ii's own task text
                      allows a plain text arrow "if a directional cue is
                      wanted", not requires one. Revisit if a future task
                      makes these rows tap-through to the underlying
                      order/live-request (flagged, not built speculatively
                      here). */}
                  {data.recentActivity.map((item) => (
                    <li key={`${item.type}-${item.id}`} className={styles.activityRow}>
                      <div className={styles.activityMain}>
                        <StatusBadge
                          status={item.status}
                          tone={ACTIVITY_STATUS_TONE[String(item.status).toLowerCase()]}
                        />
                        <span className={styles.activityDescription}>
                          {describeActivityItem(item)}
                        </span>
                      </div>
                      <span className={styles.activityTime}>{formatDateTime(item.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </RoleShell>
  );
}
