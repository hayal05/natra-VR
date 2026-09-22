import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import DashboardHeader from '../../components/DashboardHeader';
import EmptyState from '../../components/EmptyState';
import Greeting from '../../components/Greeting';
import QuickActionTile from '../../components/QuickActionTile';
import RoleShell from '../../components/RoleShell';
import StatTile from '../../components/StatTile';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useMutation } from '../../hooks';
import { NOTIFICATION_UNSUPPORTED, getNotificationPermission } from '../../utils/browserNotifications';
import HourlySalesChart from './HourlySalesChart';
import styles from './OwnerDashboard.module.css';

// Same tone map `OwnerOrders.jsx`'s (5.12b) own doc comment already
// explains and `TrackOrder.jsx` (3.17) originated: New/Accepted/
// Completed/Rejected aren't in `StatusBadge`'s shared `STATUS_TONE`
// (Task 2.4) because neither reference image shows them. Duplicated
// here rather than imported from that screen — same "not worth a
// cross-screen dependency for one small object" reasoning every prior
// order-status screen (OrderHistory/OrderDetail/TrackOrder/OwnerOrders)
// already gives for its own copy.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
};

// Fixed display order for the summary row — same 4-value vocabulary
// `backend/src/services/orderCounts.js`'s own `ORDER_STATUSES` enforces,
// duplicated here rather than shared across the frontend/backend package
// boundary (no shared-code mechanism exists in this project, same
// "duplicated rather than imported" call every other frontend copy of a
// backend-owned vocabulary already makes, e.g. `docs/DB_SCHEMA.md`'s
// CHECK-constraint values re-typed into `updateStatusSchema`,
// `ORDER_STATUS_TONE` above, etc.).
const ORDER_STATUS_LABELS = ['New', 'Accepted', 'Completed', 'Rejected'];

function fetchOrderCounts(signal) {
  return api.get('/orders/counts', { signal }).then(({ counts }) => counts);
}

// Task 5.18b — backs the new Sales card below.
function fetchSalesSummary(signal) {
  return api.get('/orders/sales-summary', { signal }).then(({ summary }) => summary);
}

// Task 10.3e2-ii — backs the Sales Overview hourly line chart
// (`HourlySalesChart.jsx`), via Task 10.3e2-i's `GET /orders/sales-hourly`.
// Its own independent fetch, same reasoning as `fetchSalesSummary`: a
// failed chart must not take down the totals above it.
function fetchHourlySales(signal) {
  return api.get('/orders/sales-hourly', { signal }).then(({ hourly }) => hourly.hours);
}

// Task 10.3f-i — the Recent Order Notifications card's list (real
// `notifications` rows, Task 7.5b's `GET /api/notifications`: newest
// first, scoped to the caller's own user id). `limit=5` keeps it a
// "recent" glance rather than a full inbox. Its own fetch, separate from
// the header's unread-*count* fetch above (that one asks for `limit=1`
// and reads only `meta.total`).
function fetchRecentNotifications(signal) {
  return api
    .get('/notifications?page=1&limit=5', { signal })
    .then(({ notifications }) => notifications);
}

// Same `Intl.DateTimeFormat` default `OrderDetail.jsx`'s own
// `formatDateTime` uses (duplicated rather than imported, same reasoning
// as `formatPrice` above), minus the year: these are *recent*
// notifications, so a short "Sep 20, 3:41 PM" reads fine in a row.
function formatNotificationTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Task 5.19's Open/Close quick action needs the restaurant's current
// `is_open` value and a way to flip it — the exact same `GET`/
// `PATCH /api/restaurants/me` pair `OwnerRestaurant.jsx` (Task 5.8)
// already uses for its own Open/Closed toggle. Duplicated here rather
// than imported, same "small fetcher, not worth a cross-screen
// dependency" reasoning `fetchOrderCounts`/`fetchSalesSummary` above
// and `formatPrice` below already give for themselves.
function fetchMyRestaurant(signal) {
  return api.get('/restaurants/me', { signal });
}

function updateMyRestaurant(data) {
  return api.patch('/restaurants/me', data);
}

// Task 10.3a-ii — the real unread count `DashboardHeader`'s
// notification indicator (Task 10.0b-iv) needs. `GET /api/notifications`
// (Task 7.5b) has no dedicated "unread count" endpoint of its own, but
// `is_read` is in `models/notifications.js`'s own `columns` allow-list,
// so it's a legal equality filter for `paginate()` (Task 1.9) to accept
// — `is_read=0` scopes the count to unread rows the same way any other
// filtered list screen in this codebase already does. `limit=1` keeps
// the actual row payload to the minimum `paginate()` will allow (this
// call only ever reads `meta.total`, never `notifications`), rather than
// fetching a real page of rows just to throw them away — `meta.total` is
// already computed from a `count()` run against the same filters
// (`utils/paginate.js`'s own doc comment), so it's the real total
// regardless of how many rows this one page happens to return.
function fetchUnreadNotificationCount(signal) {
  return api
    .get('/notifications?is_read=0&limit=1', { signal })
    .then(({ meta }) => meta.total);
}

// Identical to OrderDetail.jsx's/OrderHistory.jsx's/OwnerOrders.jsx's own
// `formatPrice` — same "250 ETB" / "199.50 ETB" convention, duplicated
// rather than imported for the same reason none of those screens import
// it from one another.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return '';
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

/**
 * OwnerDashboard — Task 5.1's "Dashboard" wiring, now filled in by Task
 * 5.17 ("new orders count + order counts summary"), Task 5.18 ("sales
 * summary widget"), and Task 5.19 ("quick actions") on top of it.
 *
 * **New orders count + status summary**, wired to Task 5.17's new
 * `GET /api/orders/counts` via `useApiQuery` (Task 3.1) — a single
 * fetch, not `usePaginatedQuery`, since this is one small fixed-shape
 * object (4 status counts + a total), not a list. The "New" count gets
 * its own headline treatment (the number a dashboard badge/glance
 * actually needs — how many orders are waiting on this owner right
 * now) with the full 4-status breakdown underneath it, each rendered
 * through `StatusBadge` (Task 2.4) + its own `ORDER_STATUS_TONE` map so
 * the same status reads with the same color everywhere in the app
 * (Orders list, Order Detail, this dashboard).
 *
 * **`noRestaurantYet` (403) handling** mirrors `OwnerOrders.jsx`'s own
 * `error instanceof ApiError && error.status === 403` check for the
 * same underlying cause this screen's own "Get your restaurant Live"
 * card already exists to address: a brand-new owner who hasn't gone
 * Live yet (or, per the standing gap `docs/PROJECT_STATUS.md`'s Task
 * 4.6 entry flags, hasn't even had a `restaurants` row created for them
 * yet) has nothing for an orders-count endpoint to scope by. Rather
 * than surface that as a scary error, the orders-summary section is
 * simply omitted in that case — the "Get your restaurant Live" card
 * below it already tells that owner exactly what to do next, and a
 * second "no orders because no restaurant" message would just repeat
 * that in a more alarming tone. A genuine (non-403) fetch failure still
 * gets its own small inline retry, same "don't let one section's error
 * block the rest of the page" reasoning `Home.jsx`'s own Categories
 * chip row already established for a non-critical section.
 *
 * **Sales summary** (Task 5.18, split into 5.18a backend / 5.18b this
 * frontend half) is wired the same way, as its own independent
 * `useApiQuery` call to the new `GET /api/orders/sales-summary` (5.18a) —
 * a second, separate fetch rather than folding it into the counts one,
 * so this section's own loading/error/`noRestaurantYet` states don't get
 * tangled with the Orders section's (same "don't let one section's
 * error block the rest of the page" reasoning the Orders card's own
 * comment above already establishes, applied a second time here). Shows
 * today's and all-time completed-order revenue plus a completed-order
 * count, `formatPrice`-formatted the same "250 ETB" way every other
 * price on this app already is (OrderDetail.jsx/OrderHistory.jsx/
 * OwnerOrders.jsx's own duplicated copy of the same function).
 *
 * **Quick actions (Task 5.19)** fills in the third card, per
 * `docs/NATRA_MASTER_PROMPT.md`'s own "Quick actions: Add Food,
 * Open/Close Restaurant, View Orders" list verbatim. Add Food and View
 * Orders are plain `Link`s to already-built screens (`AddFood.jsx`,
 * Task 5.10, at `/owner/restaurant/menu/new`; `OwnerOrders.jsx`, Task
 * 5.12b, at `/owner/orders`) — a shortcut, not a new capability, so
 * there's nothing to wire beyond the link itself. Note that "View
 * orders" already exists once on this page, inside the Orders card
 * above (Task 5.17) — kept as a second, separate link here rather than
 * removed, since the master prompt lists it as one of the three named
 * quick actions and a returning owner scanning for "the quick actions
 * row" shouldn't find it silently missing one of its three items.
 *
 * **Open/Close is the one genuinely new piece of state** this task
 * adds: a third, independent `useApiQuery` (`fetchMyRestaurant`) +
 * `useMutation` (`updateMyRestaurant`) pair, reusing the exact
 * `GET`/`PATCH /api/restaurants/me` endpoints and "commit the instant
 * the `ToggleSwitch` flips, no separate Save click, no are-you-sure
 * step" behavior `OwnerRestaurant.jsx`'s own `handleOpenToggle` (Task
 * 5.8) already established — this is the same restaurant row and the
 * same toggle, just a second place in the app that can flip it. A
 * failed toggle here surfaces its own small inline error and leaves
 * the switch showing the last-fetched `is_open` (re-fetched via this
 * hook's own `refetch`, not optimistically flipped) rather than a
 * state that never actually saved, matching 5.8's own reasoning for
 * itself. This card is hidden entirely under the same `noRestaurantYet`
 * (403) condition as the Orders/Sales cards above — Add Food, View
 * Orders, and the Open/Closed toggle all need a `restaurants` row to
 * act on (Task 4.6's standing "no creation endpoint yet" gap), so none
 * of the three quick actions have anything to do until that's resolved;
 * the "Get your restaurant Live" card below already tells that owner
 * what to do next.
 *
 * **Header (Task 10.3a-i)** — the old plain `<h1>Dashboard</h1>` is
 * replaced with the shared `DashboardHeader` (Task 10.0b), passing
 * `subtitle="Owner Dashboard"` per `docs/reference_ui/
 * phase10_owner_dashboard_reference.jpg` (the "NATRA" wordmark itself
 * is that component's own hardcoded content, not something this screen
 * supplies). **10.3a-iii — `accountHref="/owner/account"`**, the real,
 * already-built screen (`OwnerAccount.jsx`) this owner's profile/
 * password settings live on. `accountLabel` is left unpassed —
 * `DashboardHeader`'s own default ("Account") is used rather than
 * fetching the owner's name (`GET /auth/me`, `OwnerAccount.jsx`'s own
 * `fetchMe`) just for this label: this task's own wording only asks for
 * the link, and a fifth independent fetch on this screen for one label
 * word isn't this task's own scope — worth a look if a future task
 * explicitly asks for a name-based label instead of the generic one.
 *
 * **Notification indicator (Task 10.3a-ii)** — `notificationCount` is
 * now wired to a fourth, independent `useApiQuery` call
 * (`fetchUnreadNotificationCount`, above) against the real
 * `notifications` table (Task 7.5), not an invented placeholder.
 * `notificationHref` points at `/owner/orders`: every notification this
 * codebase creates today is a `new_order` row (see
 * `useOwnerNewOrderAlerts.js`'s own `NEW_ORDER_NOTIFICATION_TYPE`), and
 * there is no dedicated notification-list screen anywhere in this app
 * for the count to link to instead — `/owner/orders` is the real,
 * already-built screen where an owner actually acts on what those
 * notifications are about. Flagged as a decision, not a dead link
 * dressed up as one: `10.3f`'s own "Recent Order Notifications" card
 * (still to come, on this same page) may give this indicator a more
 * specific in-page destination once real per-notification rows are
 * rendered here — revisit then rather than assuming this href is final.
 * Passed only once the fetch actually resolves (`typeof
 * notificationCountData === 'number'`) — while loading or on a fetch
 * failure, `notificationCount` is left `undefined` so `DashboardHeader`
 * shows the plain "Notifications" link with no parenthetical figure,
 * same "don't show an invented/stale number" reasoning every other
 * secondary section on this screen already gives for degrading in place
 * rather than blocking or guessing (see the Orders/Sales cards' own
 * `noRestaurantYet`/error handling below). No separate error UI is
 * shown for this one fetch — `DashboardHeader`'s notification link
 * itself already degrades to "no count" on failure, and a broken
 * unread-count fetch isn't a reason to block the header from rendering
 * at all the way a broken Orders/Sales fetch gets its own inline retry.
 * The old `.subheading` paragraph ("Here's what's happening with your
 * restaurant today.") is now the shared `Greeting` component's own
 * `subtitle` (Task 10.3b, below) — `Greeting` itself supplies the
 * "Good afternoon!"-style time-of-day headline (Task 10.0c-i), so this
 * screen only needed to supply the second line.
 *
 * The subheading's "Quick actions land here in a later task" line is
 * dropped now that they're built.
 *
 * **New-order polling, notification, sound, and the nav badge (Tasks
 * 5.20a-c/5.21) moved to `RoleShell`-level as of Task 7.5c** —
 * previously this screen owned a `useNewOrderDetection` poll of `GET
 * /api/orders` and fired the browser `Notification`/beep/badge itself
 * from a local `handleNewOrders`. That whole path is now
 * `useOwnerNewOrderAlerts.js` (see its own header comment for the full
 * design), called once from `RoleShell` so those three effects fire
 * from *any* owner screen, not just while this Dashboard happens to be
 * mounted — the exact "real trigger, not just UI" gap
 * `docs/PROJECT_STATUS.md`'s Phase-7 note and `docs/TASKS.md`'s own
 * 7.5c line named. This screen no longer polls anything for that
 * purpose and has no `handleNewOrders` of its own; the Orders/Sales
 * cards below still only refresh on mount (via their own `useApiQuery`
 * calls) or a manual retry — the previous "refetch the instant a new
 * order is detected" behavior was tied to `handleNewOrders` and is not
 * reproduced here, an accepted trade-off of moving detection out of
 * this component.
 *
 * **The "Order notifications" opt-in card is still this screen's own
 * job** — `docs/TASKS.md`'s 5.20b line needs a real user click to
 * request permission (`Notification.requestPermission()` silently does
 * nothing from a bare page-load call), and this Dashboard remains a
 * reasonable, discoverable place to offer that click. It now reads/sets
 * permission via the shared `browserNotifications.js` util (the same
 * one `useOwnerNewOrderAlerts.js` uses to decide whether to actually
 * fire a `Notification`) rather than its own copy, and is no longer
 * gated on `noRestaurantYet` — `GET /api/notifications` (what the alert
 * hook actually polls) is scoped by the caller's own user id, not a
 * restaurant, so granting permission is useful to a brand-new owner
 * with no `restaurants` row yet too.
 */
export default function OwnerDashboard() {
  const { data: counts, error, loading, refetch } = useApiQuery(fetchOrderCounts, []);
  const {
    data: sales,
    error: salesError,
    loading: salesLoading,
    refetch: refetchSales,
  } = useApiQuery(fetchSalesSummary, []);
  // Task 10.3e2-ii — see `fetchHourlySales` above.
  const {
    data: hourlySales,
    error: hourlySalesError,
    loading: hourlySalesLoading,
    refetch: refetchHourlySales,
  } = useApiQuery(fetchHourlySales, []);
  // Task 10.3f-i — see `fetchRecentNotifications` above.
  const {
    data: recentNotifications,
    error: recentNotificationsError,
    loading: recentNotificationsLoading,
    refetch: refetchRecentNotifications,
  } = useApiQuery(fetchRecentNotifications, []);
  const {
    data: restaurantData,
    error: restaurantError,
    loading: restaurantLoading,
    refetch: refetchRestaurant,
  } = useApiQuery(fetchMyRestaurant, []);
  // Task 10.3a-ii — see this file's header comment for why loading/error
  // both fall back to `undefined` rather than a `0`/stale count.
  const { data: unreadNotificationCount } = useApiQuery(fetchUnreadNotificationCount, []);
  const { mutate: mutateRestaurant, loading: openToggleSaving } = useMutation(updateMyRestaurant);
  const [openToggleFailed, setOpenToggleFailed] = useState(false);

  // Task 5.20b — seeded from the browser's actual current permission
  // (not assumed 'default') so a returning owner who already
  // granted/denied it in a past session sees the right state on load,
  // not a stale "ask again" button.
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);

  const noRestaurantYet = error instanceof ApiError && error.status === 403;
  // Independent of `noRestaurantYet` above — same underlying cause
  // (`requireRestaurantScope`, shared by both `/orders/counts` and
  // `/orders/sales-summary`), but computed from this section's own
  // fetch rather than reused, so a hypothetical future where the two
  // endpoints' scoping ever diverges doesn't leave one section silently
  // trusting the other's result.
  const salesNoRestaurantYet = salesError instanceof ApiError && salesError.status === 403;
  // Same reasoning again, a third time, for the Quick actions card
  // (Task 5.19) — see this file's header comment for why all three
  // cards are gated the same way rather than sharing one flag.
  const quickActionsNoRestaurantYet =
    restaurantError instanceof ApiError && restaurantError.status === 403;

  // Open/Close (Task 5.19) — mirrors `OwnerRestaurant.jsx`'s own
  // `handleOpenToggle` (Task 5.8): fire the PATCH the instant the
  // `ToggleSwitch` flips, no confirmation step, and only `refetch()` on
  // success so a rejected PATCH leaves the switch reflecting the real
  // last-known `is_open` instead of a value that never saved.
  const handleOpenToggle = (checked) => {
    setOpenToggleFailed(false);
    mutateRestaurant({ is_open: checked })
      .then(() => refetchRestaurant())
      .catch(() => setOpenToggleFailed(true));
  };

  // Task 5.20b — the explicit UI affordance `docs/TASKS.md`'s own 5.20b
  // line requires ("browsers won't grant it from a bare page-load
  // call"): only ever called from a real click handler below, never on
  // mount. Unsupported browsers have no button wired to this at all (see
  // the render guard below), so this never runs there either. Note this
  // updates only this component's own local `notificationPermission`
  // state for the card's own display — `useOwnerNewOrderAlerts.js`'s
  // `RoleShell`-level instance reads the browser's live permission
  // itself (`getNotificationPermission()`, not React state) the next
  // time it has a notification to show, so granting here takes effect
  // there immediately regardless of this screen still being mounted.
  const handleEnableNotifications = () => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
    });
  };

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        <DashboardHeader
          subtitle="Owner Dashboard"
          notificationCount={unreadNotificationCount ?? undefined}
          notificationHref="/owner/orders"
          accountHref="/owner/account"
          className={styles.dashboardHeader}
        />
        <Greeting
          subtitle="Here's what's happening with your restaurant today."
          className={styles.greeting}
        />

        {/* Task 10.3c — the four `StatTile`s (Task 10.0d), assembled into
            the reference's 2×2 grid by 10.3c-v. All four derive from the
            one `GET /orders/counts` response (`orderCounts.js`), so no
            backend work: Total = `counts.total` (10.3c-i), Completed =
            `counts.Completed` (10.3c-ii), Rejected = `counts.Rejected`
            (10.3c-iii), Pending = `counts.New + counts.Accepted`
            (10.3c-iv). One shared render gate for the whole grid — shown
            only once `counts` has resolved, since the Orders card below
            owns the loading/error/`noRestaurantYet` messaging and a
            made-up `0` here would contradict it. Variants match the
            reference's tints (orange/green/red/blue; `info` is the
            closest existing blue-ish variant, see `StatTile`). The
            reference's per-tile icons and sub-lines ("0 new", "0% of
            total", "Waiting for action") are not built — `StatTile` has
            no icon/caption slot by design (Task 10.0d). */}
        {!noRestaurantYet && !loading && !error && counts && (
          <div className={styles.statGrid}>
            <StatTile count={counts.total} label="Total Orders" variant="primary" />
            <StatTile count={counts.Completed} label="Completed" variant="success" />
            <StatTile count={counts.Rejected} label="Rejected" variant="error" />
            <StatTile count={counts.New + counts.Accepted} label="Pending" variant="info" />
          </div>
        )}

        {!noRestaurantYet && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Orders</h2>
            {loading ? (
              <p className={styles.cardBody}>Loading order counts…</p>
            ) : error ? (
              <div className={styles.countsError}>
                <p className={styles.cardBody}>Couldn't load your order counts.</p>
                <button type="button" className={styles.retryButtonInline} onClick={refetch}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className={styles.newOrdersHeadline}>
                  <span className={styles.newOrdersCount}>{counts.New}</span>
                  <span className={styles.newOrdersLabel}>
                    {counts.New === 1 ? 'new order' : 'new orders'}
                  </span>
                </div>
                <div className={styles.statusSummary}>
                  {ORDER_STATUS_LABELS.map((status) => (
                    <div key={status} className={styles.statusSummaryRow}>
                      <StatusBadge status={status} tone={ORDER_STATUS_TONE[status.toLowerCase()]} />
                      <span className={styles.statusSummaryCount}>{counts[status]}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.actionRow}>
                  <Link to="/owner/orders" className={styles.secondaryButton}>
                    View orders
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Task 5.20b, un-gated from `noRestaurantYet` as of Task 7.5c —
            see this file's header comment: the alert polling this card
            enables (`useOwnerNewOrderAlerts.js`, `RoleShell`-level) is
            scoped by the caller's own user id, not a restaurant, so a
            brand-new owner with no `restaurants` row yet can still
            usefully grant permission here. Hidden entirely (not just
            disabled) for a browser with no `Notification` API at all,
            per this task's own "unavailable is a no-op, not an error"
            line — nothing here for that owner to enable. */}
        {notificationPermission !== NOTIFICATION_UNSUPPORTED && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Order notifications</h2>
            {notificationPermission === 'granted' ? (
              <p className={styles.cardBody}>
                Browser notifications are on — you'll get an alert the moment a new order comes
                in.
              </p>
            ) : notificationPermission === 'denied' ? (
              <p className={styles.cardBody}>
                Browser notifications are blocked. Enable them for this site in your browser's
                settings to get alerted about new orders.
              </p>
            ) : (
              <>
                <p className={styles.cardBody}>
                  Turn on browser notifications to get alerted the moment a new order comes in.
                </p>
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleEnableNotifications}
                  >
                    Enable notifications
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!salesNoRestaurantYet && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Sales Overview</h2>
            {salesLoading ? (
              <p className={styles.cardBody}>Loading sales summary…</p>
            ) : salesError ? (
              <div className={styles.countsError}>
                <p className={styles.cardBody}>Couldn't load your sales summary.</p>
                <button type="button" className={styles.retryButtonInline} onClick={refetchSales}>
                  Retry
                </button>
              </div>
            ) : (
              <div className={styles.salesSummary}>
                {/* Task 10.3e-i — Today/All-time totals restyled from two
                    label-left/amount-right rows into two side-by-side
                    tinted stat blocks, per the reference's Sales
                    Overview card. Same real data (`sales.todayTotal`/
                    `allTimeTotal`, `formatPrice`) — no new fetch. The
                    reference's "Today" dropdown, Total Revenue tile and
                    chart are not built here (no period selector exists;
                    the chart is 10.3e2). */}
                <div className={styles.salesTotals}>
                  <div className={styles.salesTotal}>
                    <span className={styles.salesLabel}>Today</span>
                    <span className={styles.salesAmount}>{formatPrice(sales.todayTotal)}</span>
                  </div>
                  <div className={styles.salesTotal}>
                    <span className={styles.salesLabel}>All time</span>
                    <span className={styles.salesAmount}>{formatPrice(sales.allTimeTotal)}</span>
                  </div>
                </div>
                {/* Task 10.3e-ii — the completed-order-count line, restyled
                    the same way as the totals above (tinted block, count
                    emphasized over its label). Same real copy: the count
                    plus "completed order(s)" reads exactly as the old
                    single sentence did, just split so the number can be
                    bold — no new text. Full-width beneath the two totals
                    rather than the reference's separate Total Revenue
                    tile, which would duplicate the All-time total. */}
                <div className={styles.salesCompleted}>
                  <span className={styles.salesCompletedCount}>{sales.completedOrderCount}</span>
                  <span className={styles.salesLabel}>
                    {sales.completedOrderCount === 1 ? 'completed order' : 'completed orders'}
                  </span>
                </div>
                {/* Task 10.3e2-ii — hourly line chart (the named Phase 10
                    exception). Loads and fails independently of the totals
                    above: the totals already rendered, so a chart problem
                    shows a small inline message + Retry here instead of
                    replacing them. The whole Sales card is already hidden
                    on a 403, so no separate no-restaurant case here. */}
                {hourlySalesLoading ? (
                  <p className={styles.cardBody}>Loading chart…</p>
                ) : hourlySalesError ? (
                  <div className={styles.countsError}>
                    <p className={styles.cardBody}>Couldn't load the hourly sales chart.</p>
                    <button
                      type="button"
                      className={styles.retryButtonInline}
                      onClick={refetchHourlySales}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  hourlySales && <HourlySalesChart hours={hourlySales} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Task 10.3f-i — Recent Order Notifications card: real
            `notifications` rows (Task 7.5), each restyled as a tinted row
            with the notification's own `message` (already pre-formatted
            server-side, e.g. "New order NTR-12345 from … — 2 items — 250
            ETB"), a short timestamp, and an unread marker. Not gated on
            `noRestaurantYet`: notifications are scoped by the caller's
            own user id, not a restaurant (same reasoning as the opt-in
            card above). Loads/fails independently, with its own inline
            error + Retry. The empty case is the shared `EmptyState`
            (10.3f-ii, below); the reference's "0 new" pill isn't built (the header already shows the unread
            count). **Placement:** right after the Sales card; the
            reference orders the page differently (Quick actions before
            Sales), and reordering existing cards isn't part of any
            10.3f task. */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent order notifications</h2>
          {recentNotificationsLoading ? (
            <p className={styles.cardBody}>Loading notifications…</p>
          ) : recentNotificationsError ? (
            <div className={styles.countsError}>
              <p className={styles.cardBody}>Couldn't load your notifications.</p>
              <button
                type="button"
                className={styles.retryButtonInline}
                onClick={refetchRecentNotifications}
              >
                Retry
              </button>
            </div>
          ) : recentNotifications && recentNotifications.length > 0 ? (
            <ul className={styles.notificationList}>
              {recentNotifications.map((notification) => {
                const unread = notification.is_read === 0;
                return (
                  <li
                    key={notification.id}
                    className={[styles.notificationRow, unread && styles.notificationRowUnread]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={styles.notificationDot} aria-hidden="true" />
                    <div className={styles.notificationBody}>
                      <span className={styles.notificationMessage}>
                        {unread && <span className={styles.srOnly}>Unread: </span>}
                        {notification.message}
                      </span>
                      <span className={styles.notificationTime}>
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            // Task 10.3f-ii — the shared `EmptyState` (title + description,
            // no icon: the reference's bell illustration has no asset in
            // this codebase, and `EmptyState` itself documents that it
            // reserves the icon slot rather than inventing one), replacing
            // 10.3f-i's bare placeholder line. Title says "yet" rather than
            // the reference's "No new notifications": this list shows
            // recent notifications read *or* unread, so "no new" would be
            // wrong — empty here means none at all. Description follows
            // this app's own empty-state phrasing (`OwnerOrders.jsx`: "New
            // orders placed with your restaurant will show up here.").
            <EmptyState
              title="No notifications yet"
              description="Alerts about new orders will show up here."
              className={styles.notificationsEmpty}
            />
          )}
        </div>

        {/* Task 10.3d-v — the single Quick Actions row, replacing the old
            Quick actions card's toggle row + Add Food/View orders
            buttons and the temporary standalone tiles 10.3d-i..iv added.
            Tiles, in the reference's order: Open/Closed (10.3d-i, wraps
            the real `ToggleSwitch` with `handleOpenToggle`/
            `openToggleSaving`, Task 5.19; caption reuses the old hint
            copy verbatim), Add Food (10.3d-ii → `/owner/restaurant/menu/
            new`), View Orders (10.3d-iii → `/owner/orders`), Check Live
            Status (10.3d-iv → `/owner/live-status`). No other captions/
            icons: no existing copy/asset, and no invented text.

            The card keeps the restaurant fetch's own messaging that the
            old card owned: "Loading…", an inline error + Retry for a real
            failure, and the `openToggleFailed` line. The first three
            tiles need a `restaurants` row, so they render only once that
            fetch has resolved cleanly — a 403 (`quickActionsNoRestaurantYet`,
            a brand-new owner) or any error hides them, and 403 shows no
            error message at all, as before (the "Get your restaurant Live"
            card below already says what to do next). **Check Live Status
            is always rendered**, including on 403 — the owner who most
            needs it is the one with a pending request and no restaurant
            row yet (see 10.3d-iv). So the card itself is never hidden
            now, unlike the old one. */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quick actions</h2>
          {restaurantLoading && <p className={styles.cardBody}>Loading…</p>}
          {restaurantError && !quickActionsNoRestaurantYet && (
            <div className={styles.countsError}>
              <p className={styles.cardBody}>Couldn't load your restaurant's status.</p>
              <button type="button" className={styles.retryButtonInline} onClick={refetchRestaurant}>
                Retry
              </button>
            </div>
          )}
          {openToggleFailed && (
            <p className={styles.quickActionError}>
              Couldn't update your Open/Closed status. Try again.
            </p>
          )}
          <div className={styles.quickActionsRow}>
            {!restaurantLoading && !restaurantError && restaurantData && (
              <>
                <QuickActionTile
                  label={restaurantData.restaurant.is_open ? 'Open' : 'Closed'}
                  caption={
                    restaurantData.restaurant.is_open
                      ? 'Customers can order from you right now.'
                      : "Customers can't place new orders while you're closed."
                  }
                  toggle={{
                    checked: restaurantData.restaurant.is_open === 1,
                    onChange: handleOpenToggle,
                    disabled: openToggleSaving,
                  }}
                  className={styles.quickActionTile}
                />
                <QuickActionTile
                  label="Add Food"
                  to="/owner/restaurant/menu/new"
                  className={styles.quickActionTile}
                />
                <QuickActionTile
                  label="View Orders"
                  to="/owner/orders"
                  className={styles.quickActionTile}
                />
              </>
            )}
            <QuickActionTile
              label="Check Live Status"
              to="/owner/live-status"
              className={styles.quickActionTile}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Get your restaurant Live</h2>
          <p className={styles.cardBody}>
            Pay the one-time registration fee and upload your payment screenshot to request
            approval, or check the status of a request you've already submitted.
          </p>
          <div className={styles.actionRow}>
            <Link to="/owner/request-live" className={styles.primaryButton}>
              Request to go Live
            </Link>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
