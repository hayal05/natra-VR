import { useNavigate } from 'react-router-dom';

import EmptyState from '../../components/EmptyState';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import { usePaginatedQuery } from '../../hooks';
import { api } from '../../api/client';
import styles from './AdminLiveRequests.module.css';

// `GET /api/admin/live-requests` (Task 6.6b) returns `{ live_requests, meta }`
// — reshaped to the `{ rows, meta }` shape `usePaginatedQuery` expects, same
// "controller renames `rows` to its own resource key, screen renames it
// back" reshaping `AdminRestaurants.jsx`'s own `fetchRestaurants` already
// does for `adminController.js`'s `{ restaurants, meta }`.
//
// A plain `({ page }, signal) => ...` shape, not `fetchRestaurants`'s
// `search =>` wrapper — unlike that screen, this list takes no `q` param
// (6.6a's own service note: "no `status` query param... this is
// specifically the admin's review to-do list", already hardcoded to
// pending-only server-side), so there's no per-render search term to close
// over.
function fetchLiveRequests({ page }, signal) {
  const params = new URLSearchParams({ page: String(page) });
  return api
    .get(`/admin/live-requests?${params.toString()}`, { signal })
    .then(({ live_requests, meta }) => ({ rows: live_requests, meta }));
}

// Identical to OwnerOrders.jsx's/OrderHistory.jsx's own `formatPrice` —
// `registration_payments.amount` (docs/DB_SCHEMA.md's 0.10 section) is the
// same kind of numeric-money column those screens already format, no new
// convention needed. Duplicated rather than imported, same "no shared
// currency-formatting util exists yet" precedent every other copy already
// sets.
function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Identical to AdminRestaurants.jsx's own `formatDate` — `live_requests
// .created_at` is a plain TIMESTAMP column (docs/DB_SCHEMA.md's 0.10
// section), formatted with nothing fancier than the browser's own
// `Intl.DateTimeFormat` default.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * AdminLiveRequests — Task 6.6d (data wiring) + 6.6e (row rendering), the
 * two frontend halves of Live-request review (see `docs/TASKS.md`'s note
 * on the original single 6.6d's split).
 *
 * **No `SearchBar`/debounced search** — unlike `AdminRestaurants.jsx`
 * (6.4b), which this screen otherwise mirrors: 6.6a's endpoint has no `q`
 * param at all, so `usePaginatedQuery`'s `deps` array stays `[]`, same as
 * `OwnerOrders.jsx`'s own no-filter list.
 *
 * **Every row is `status = 'pending'`** — 6.6a's own hardcoded queue
 * filter — so, unlike `AdminRestaurants.jsx`'s `describeLiveState`/
 * `StatusBadge` spread across five possible states, no status badge is
 * shown here at all: it would say the same word ("Pending") on every row.
 *
 * **Each row** shows exactly what a reviewer needs to triage the queue —
 * `restaurant_name`, the registration fee `amount` (`formatPrice`), and
 * `created_at` (`formatDate`, the request's submission date) — not the
 * `payment_screenshot_url` itself, which belongs on the detail/review
 * screen (6.6f) where it's actually viewable full-size via `ImageViewer`.
 *
 * **Rows tap through to `/admin/live-requests/:id`** (Task 6.6f, on top
 * of 6.6c's new `GET /api/admin/live-requests/:id`) — same "row becomes a
 * `role=\"button\"` div with an `onClick`/`onKeyDown` pair, not a nested
 * `<a>`" shape `AdminRestaurants.jsx`'s own row-to-`/admin/restaurants/:id`
 * wiring (Task 6.5b) already established. This doc comment previously
 * flagged tap-through as explicitly out of scope, a later task's job —
 * that later task is this one.
 *
 * **No route/nav link wired in App.jsx/RoleShell** — Task 6.2's fixed
 * four-item admin sidebar (`docs/NATRA_MASTER_PROMPT.md`'s own "Admin"
 * nav list) has no "Live Requests" entry, so this screen is reachable at
 * `/admin/live-requests` directly but not yet linked from anywhere in the
 * UI; wiring a real entry point (most likely from `AdminDashboard.jsx`'s
 * pending-count widget) is left for whichever later task takes it on.
 */
export default function AdminLiveRequests() {
  const navigate = useNavigate();
  const { items, meta, loading, error, setPage, refetch } = usePaginatedQuery(
    fetchLiveRequests,
    []
  );

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Live Requests</h1>

        {error ? (
          <EmptyState
            title="Couldn't load live requests"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : (
          <ListWithPagination
            items={items}
            isLoading={loading}
            loadingLabel="Loading live requests…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Live requests"
            getItemKey={(request) => request.id}
            emptyState={
              <EmptyState
                title="No live requests"
                description="Requests will show up here once owners submit their registration fee."
              />
            }
            renderItem={(request) => (
              <div
                className={styles.row}
                onClick={() => navigate(`/admin/live-requests/${request.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/admin/live-requests/${request.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.rowHeader}>
                  <span className={styles.name}>{request.restaurant_name}</span>
                  <span className={styles.amount}>{formatPrice(request.amount)}</span>
                </div>
                <div className={styles.rowMeta}>
                  <span>Submitted {formatDate(request.created_at)}</span>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </RoleShell>
  );
}

