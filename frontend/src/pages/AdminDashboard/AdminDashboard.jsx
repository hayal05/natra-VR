import { api } from '../../api/client';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { useApiQuery } from '../../hooks';
import styles from './AdminDashboard.module.css';

// Fixed display order + label for the totals row — mirrors
// `docs/TASKS.md`'s own 6.3 wording ("totals (restaurants, live,
// pending, orders)") and `services/adminDashboardSummary.js`'s
// `getTotals()` return shape verbatim. Duplicated here rather than
// shared across the frontend/backend package boundary, same
// "duplicated rather than imported" call every other frontend copy of
// a backend-owned shape already makes in this codebase (e.g.
// `OwnerDashboard.jsx`'s own `ORDER_STATUS_LABELS`).
const TOTAL_ITEMS = [
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'live', label: 'Live' },
  { key: 'pending', label: 'Pending' },
  { key: 'orders', label: 'Orders' },
];

// Same tone map `OwnerDashboard.jsx`'s own `ORDER_STATUS_TONE` already
// establishes for order statuses (New/Accepted/Completed/Rejected
// aren't in `StatusBadge`'s shared `STATUS_TONE` since neither
// reference image shows them) — extended here with `live_requests`'
// own pending/approved/rejected vocabulary, since the activity feed
// mixes both kinds of item. Duplicated rather than imported, same
// "not worth a cross-screen dependency for one small object" reasoning
// every prior copy of this map already gives for itself.
const ACTIVITY_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
  pending: 'neutral',
  approved: 'success',
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

/**
 * AdminDashboard — Task 6.2's placeholder, filled in by Task 6.3b on
 * top of 6.3a's new `GET /api/admin/dashboard-summary`.
 *
 * A single `useApiQuery` call (Task 3.1) backs both the totals row and
 * the recent-activity feed below it — unlike `OwnerDashboard.jsx`'s
 * three independent fetches (Orders/Sales/Quick-actions each scoped to
 * one owner's restaurant and each with its own `noRestaurantYet` 403
 * case to handle separately), this screen has exactly one data source
 * and no per-section scoping question: `requireAdmin` either lets the
 * whole request through or the whole page never renders past its one
 * loading/error state.
 *
 * **Totals** render as a plain 4-up stat grid (Restaurants/Live/
 * Pending/Orders, `TOTAL_ITEMS`'s order) rather than a dedicated KPI
 * card component — no such component exists in this project's Phase 2
 * kit (`docs/DESIGN_TOKENS.md`'s 15-component list has no KPI/stat-card
 * entry, unlike the sibling NATRA project this one is sometimes
 * confused with), so this reuses the same plain `.card` shell
 * `OwnerDashboard.jsx` already established rather than inventing a new
 * component for one screen.
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

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Dashboard</h1>

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
              <div className={styles.totalsGrid}>
                {TOTAL_ITEMS.map(({ key, label }) => (
                  <div key={key} className={styles.totalItem}>
                    <span className={styles.totalValue}>{data.totals[key]}</span>
                    <span className={styles.totalLabel}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recent activity</h2>
              {data.recentActivity.length === 0 ? (
                <EmptyState title="No activity yet" description="New live requests and orders will show up here." />
              ) : (
                <ul className={styles.activityList}>
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
