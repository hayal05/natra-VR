import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '../../components/EmptyState';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import { useDebouncedValue, usePaginatedQuery } from '../../hooks';
import { api } from '../../api/client';
import styles from './AdminRestaurants.module.css';

// Mirrors `restaurantController.js`'s own `isLive` exactly (`live_status
// === 'approved' && is_suspended === 0`, docs/DB_SCHEMA.md's "'Live' is
// derived, not a raw flag" note) — duplicated on the frontend rather
// than imported, same cross-package-boundary precedent every other
// backend-owned shape/rule copied into this codebase already sets
// (`AdminDashboard.jsx`'s own `TOTAL_ITEMS`/`ACTIVITY_STATUS_TONE`
// comments name this explicitly).
//
// Unlike the dashboard's activity feed (which only ever shows
// `live_requests.status`, itself only ever pending/approved/rejected),
// this admin list needs to represent all five states a restaurant row
// can actually be in — `not_requested`/`pending`/`rejected` (raw
// `live_status`), suspended (independent of `live_status`, checked
// first since an admin who suspended an approved restaurant needs that
// to visibly override "Live"), and `approved`-and-not-suspended, shown
// as "Live" rather than "Approved" so this list uses the same word the
// dashboard's own totals row and `docs/NATRA_MASTER_PROMPT.md` do for
// the same derived concept, not the raw column value.
function describeLiveState(restaurant) {
  if (Number(restaurant.is_suspended) === 1) {
    return { label: 'Suspended', tone: 'error' };
  }
  switch (restaurant.live_status) {
    case 'approved':
      return { label: 'Live', tone: 'success' };
    case 'pending':
      return { label: 'Pending review', tone: 'neutral' };
    case 'rejected':
      return { label: 'Rejected', tone: 'error' };
    default:
      return { label: 'Not requested', tone: 'neutral' };
  }
}

// Identical to OwnerOrders.jsx's/OrderHistory.jsx's own `formatDate` —
// `restaurants.created_at` is a plain TIMESTAMP column
// (docs/DB_SCHEMA.md's 0.6 section), formatted with nothing fancier
// than the browser's own `Intl.DateTimeFormat` default. Duplicated
// rather than imported, same "no shared date util exists yet"
// precedent every other copy of this function in this codebase already
// sets.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// `GET /api/admin/restaurants` (Task 6.4a) returns `{ restaurants, meta }`
// — reshaped to the `{ rows, meta }` shape `usePaginatedQuery` (Task 3.1)
// expects, same "controller renames `rows` to its own resource key,
// screen renames it back" reshaping `OwnerOrders.jsx`'s own `fetchOrders`
// already does for `orderController.js`'s `{ orders, meta }`.
//
// Returns a function (not the plain `({ page }, signal) => ...` shape
// `OwnerOrders.jsx` uses directly) because — unlike that screen — the
// query here also depends on `search`, which changes independently of
// `page`. Same "fetchX(searchTerm) returning a queryFn" wrapper shape
// `OrderHistory.jsx`'s own `fetchHistory(phone)` already establishes,
// just keyed by a debounced free-text search instead of a
// submitted-on-blur phone number.
function fetchRestaurants(search) {
  return ({ page }, signal) => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('q', search);
    return api
      .get(`/admin/restaurants?${params.toString()}`, { signal })
      .then(({ restaurants, meta }) => ({ rows: restaurants, meta }));
  };
}

/**
 * AdminRestaurants — Task 6.2's placeholder, filled in by Task 6.4b on
 * top of 6.4a's new `GET /api/admin/restaurants`. First half of
 * `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant management" list ("View
 * restaurants") — everything else on that list (view details, review
 * Live requests, approve/reject, suspend/reactivate) is Tasks 6.5-6.8,
 * per `AdminRestaurants.jsx`'s own former placeholder comment.
 *
 * **`usePaginatedQuery` + a debounced `SearchBar`**, not
 * `OwnerOrders.jsx`'s plain undebounced shape — that screen has no
 * search input at all, so its `deps` array is always `[]`; this one
 * needs `useDebouncedValue` (Task 3.6) the same way `Home.jsx`'s own
 * search bar does, both so a fast typist doesn't fire one request per
 * keystroke and so `usePaginatedQuery`'s own "deps change -> reset to
 * page 1" behavior fires once per pause-in-typing, not once per
 * character.
 *
 * **No `noRestaurantYet` 403 branching** — same reasoning
 * `AdminDashboard.jsx`'s own doc comment already gives for its one
 * data source: this is a platform-wide, `requireAdmin`-gated read with
 * no per-caller restaurant to be missing, unlike every owner-scoped
 * screen's `attachOwnerRestaurant` 403 case.
 *
 * **All restaurants, not just Live ones** — `docs/TASKS.md`'s own 6.4a
 * wording ("platform-wide, all restaurants regardless of Live status")
 * is why every row shows `describeLiveState`'s full not_requested/
 * pending/rejected/Live/Suspended spread rather than the customer-
 * facing list's Live-only filter (`restaurantController.js`'s
 * `LIVE_FILTER`) — an admin reviewing the platform needs to see
 * exactly the restaurants that filter would hide.
 *
 * **Rows tap through to `/admin/restaurants/:id`** (Task 6.5b, on top
 * of 6.5a's new `GET /api/admin/restaurants/:id`) — same "row becomes a
 * `role=\"button\"` div with an `onClick`/`onKeyDown` pair, not a nested
 * `<a>`, since the row already isn't a real link (no href users could
 * open in a new tab against)" shape `OwnerOrders.jsx`'s own row-to-
 * `/owner/orders/:id` wiring (Task 5.13) already established. This
 * doc comment previously flagged tap-through as explicitly out of
 * scope, a later task's job — that later task is this one.
 *
 * **Each row** shows exactly what `GET /api/admin/restaurants` returns
 * per restaurant — `name`, the derived live/suspended state (via
 * `StatusBadge`), the independent Open/Closed operational toggle
 * (`StatusBadge`'s own shared `open`/`closed` tones, Task 2.4 —
 * `is_open` is unrelated to Live per `docs/DB_SCHEMA.md`'s own note,
 * so both badges render side by side rather than one overriding the
 * other), and `created_at`. No `description`/`logo_url`/`phone` —
 * those matter once there's a detail view (6.5) to show them on, not a
 * scannable list row.
 */
export default function AdminRestaurants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { items, meta, loading, error, setPage, refetch } = usePaginatedQuery(
    fetchRestaurants(debouncedSearch),
    [debouncedSearch]
  );

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Restaurants</h1>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search restaurants by name..."
          ariaLabel="Search restaurants"
          className={styles.searchBar}
        />

        {error ? (
          <EmptyState
            title="Couldn't load restaurants"
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
            loadingLabel="Loading restaurants…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Restaurants"
            getItemKey={(restaurant) => restaurant.id}
            emptyState={
              <EmptyState
                title={debouncedSearch ? 'No matching restaurants' : 'No restaurants yet'}
                description={
                  debouncedSearch
                    ? `No restaurant names match "${debouncedSearch}".`
                    : 'Restaurants will show up here once owners register.'
                }
              />
            }
            renderItem={(restaurant) => {
              const liveState = describeLiveState(restaurant);
              return (
                <div
                  className={styles.row}
                  onClick={() => navigate(`/admin/restaurants/${restaurant.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/admin/restaurants/${restaurant.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.rowHeader}>
                    <span className={styles.name}>{restaurant.name}</span>
                    <div className={styles.badges}>
                      <StatusBadge label={liveState.label} tone={liveState.tone} />
                      <StatusBadge status={restaurant.is_open ? 'open' : 'closed'} />
                    </div>
                  </div>
                  <div className={styles.rowMeta}>
                    <span>Registered {formatDate(restaurant.created_at)}</span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </RoleShell>
  );
}
