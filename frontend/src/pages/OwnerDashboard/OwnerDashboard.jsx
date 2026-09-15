import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useApiQuery, useMutation } from '../../hooks';
import { NOTIFICATION_UNSUPPORTED, getNotificationPermission } from '../../utils/browserNotifications';
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
  const {
    data: restaurantData,
    error: restaurantError,
    loading: restaurantLoading,
    refetch: refetchRestaurant,
  } = useApiQuery(fetchMyRestaurant, []);
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
        <h1 className={styles.heading}>Dashboard</h1>
        <p className={styles.subheading}>Here's what's happening with your restaurant today.</p>

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
            <h2 className={styles.cardTitle}>Sales</h2>
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
                <div className={styles.salesRow}>
                  <span className={styles.salesLabel}>Today</span>
                  <span className={styles.salesAmount}>{formatPrice(sales.todayTotal)}</span>
                </div>
                <div className={styles.salesRow}>
                  <span className={styles.salesLabel}>All time</span>
                  <span className={styles.salesAmount}>{formatPrice(sales.allTimeTotal)}</span>
                </div>
                <p className={styles.salesMeta}>
                  {sales.completedOrderCount === 1
                    ? '1 completed order'
                    : `${sales.completedOrderCount} completed orders`}
                </p>
              </div>
            )}
          </div>
        )}

        {!quickActionsNoRestaurantYet && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Quick actions</h2>
            {restaurantLoading ? (
              <p className={styles.cardBody}>Loading…</p>
            ) : restaurantError ? (
              <div className={styles.countsError}>
                <p className={styles.cardBody}>Couldn't load your restaurant's status.</p>
                <button
                  type="button"
                  className={styles.retryButtonInline}
                  onClick={refetchRestaurant}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className={styles.openToggleRow}>
                  <div className={styles.openToggleStatus}>
                    <StatusBadge status={restaurantData.restaurant.is_open ? 'Open' : 'Closed'} />
                    <span className={styles.openToggleHint}>
                      {restaurantData.restaurant.is_open
                        ? 'Customers can order from you right now.'
                        : "Customers can't place new orders while you're closed."}
                    </span>
                  </div>
                  <ToggleSwitch
                    checked={restaurantData.restaurant.is_open === 1}
                    onChange={handleOpenToggle}
                    disabled={openToggleSaving}
                    label={restaurantData.restaurant.is_open ? 'Open' : 'Closed'}
                  />
                </div>
                {openToggleFailed && (
                  <p className={styles.quickActionError}>
                    Couldn't update your Open/Closed status. Try again.
                  </p>
                )}
                <div className={styles.actionRow}>
                  <Link to="/owner/restaurant/menu/new" className={styles.primaryButton}>
                    Add Food
                  </Link>
                  <Link to="/owner/orders" className={styles.secondaryButton}>
                    View orders
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

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
            <Link to="/owner/live-status" className={styles.secondaryButton}>
              Check Live status
            </Link>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
