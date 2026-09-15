import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FilterBar from '../../components/FilterBar';
import FormField from '../../components/FormField';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useDebouncedValue, usePaginatedQuery } from '../../hooks';
import styles from './AdminOrders.module.css';

// Identical to OwnerOrders.jsx's/OrderHistory.jsx's/TrackOrder.jsx's own
// `ORDER_STATUS_TONE` — New/Accepted/Completed/Rejected aren't in
// `StatusBadge`'s shared `STATUS_TONE` (Task 2.4) because neither
// reference image shows them (see those files' own doc comments).
// Duplicated here rather than imported, same "not worth a cross-screen
// dependency for one small object" precedent every copy of it in this
// codebase already sets.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
};

// Task 6.10a's own `adminOrdersList.js` validates `status` against the
// exact, case-sensitive `orders.status` CHECK values — same list,
// duplicated here rather than fetched (there's no endpoint that returns
// it, and it's four fixed strings straight out of the migration, same
// "not worth a network round-trip for a static enum" reasoning
// `ORDER_STATUS_TONE` above already sets for this file). `ALL_VALUE` is
// a real, always-present first option (not `FilterBar`'s own
// placeholder mechanic, which renders as a disabled/unselectable
// option) — same "All" pattern `Home.jsx`'s own `ALL_CATEGORIES_VALUE`
// already established for its Categories chip row, just as a dropdown
// option instead of a chip.
const ALL_VALUE = '';
const STATUS_OPTIONS = [
  { value: ALL_VALUE, label: 'All statuses' },
  { value: 'New', label: 'New' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Rejected', label: 'Rejected' },
];

// Upper bound on how many restaurants the filter dropdown's own options
// fetch below asks for — `utils/paginate.js`'s own `MAX_LIMIT` (Task
// 1.9), the highest `limit` `GET /api/admin/restaurants` accepts in one
// page. There's no dedicated "every restaurant, unpaged" endpoint (Task
// 6.4a's own list is deliberately paginated, same as every other admin
// list) — this reuses that endpoint at its own largest single page
// rather than building a second one for this one dropdown, same
// "reuse the list endpoint's own bounded page" shape `Home.jsx`'s
// Restaurants row already uses for a different, unpaged-feeling section.
// A platform with more than 100 restaurants would need this dropdown
// to grow a search box of its own — not a real concern yet at this
// project's current scale (`docs/PROJECT_STATUS.md`'s seed data is a
// handful of restaurants), flagged here rather than silently capped.
const RESTAURANT_OPTIONS_LIMIT = 100;

// Identical to OwnerOrders.jsx's own `formatPrice` — same "250 ETB" /
// "199.50 ETB" convention, duplicated rather than imported for the same
// "no shared currency-formatting util exists yet" reason every other
// copy of this function in this codebase already gives.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return '';
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Identical to OwnerOrders.jsx's/AdminRestaurants.jsx's own `formatDate`
// — `orders.created_at` is a plain TIMESTAMP column (docs/DB_SCHEMA.md's
// 0.8 section), formatted with nothing fancier than the browser's own
// `Intl.DateTimeFormat` default.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// `GET /api/admin/orders` (Task 6.9, extended by 6.10a) returns
// `{ orders, meta }` — reshaped to the `{ rows, meta }` shape
// `usePaginatedQuery` (Task 3.1) expects, same "controller renames
// `rows` to its own resource key, screen renames it back" reshaping
// `AdminRestaurants.jsx`'s own `fetchRestaurants` already does for
// `{ restaurants, meta }`.
//
// Returns a function (not the plain `({ page }, signal) => ...` shape
// `OwnerOrders.jsx` uses directly) for the same reason
// `AdminRestaurants.jsx`'s own `fetchRestaurants` does — the query here
// also depends on `filters`, which changes independently of `page`.
//
// `filters.restaurantId`/`.status`/`.date` map straight onto 6.10a's
// own `restaurant_id`/`status`/`date` query params — each only added to
// the request when non-blank (an unset `FilterBar` dropdown/date field
// is `ALL_VALUE`/`''`, "no filter", not a literal empty-string filter
// value to forward and have 6.10a's own validation reject).
function fetchOrders(filters) {
  return ({ page }, signal) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.search) params.set('q', filters.search);
    if (filters.restaurantId) params.set('restaurant_id', filters.restaurantId);
    if (filters.status) params.set('status', filters.status);
    if (filters.date) params.set('date', filters.date);
    return api
      .get(`/admin/orders?${params.toString()}`, { signal })
      .then(({ orders, meta }) => ({ rows: orders, meta }));
  };
}

/**
 * AdminOrders — Task 6.2's placeholder, filled in by Task 6.9 (view-all
 * list with search) and this task (6.10b: restaurant/status/date
 * filters, on top of 6.10a's own backend query-param support). First
 * two-thirds of `docs/NATRA_MASTER_PROMPT.md`'s "Order management" list
 * ("View all orders", "Search", "Filter") — the order detail tap-through
 * is Task 6.11's job, per this file's own former placeholder comment.
 *
 * **`usePaginatedQuery` + a debounced `SearchBar`**, same shape
 * `AdminRestaurants.jsx` (6.4b) already established for its own
 * platform-wide, search-filterable admin list — `useDebouncedValue`
 * (Task 3.6) so a fast typist doesn't fire one request per keystroke,
 * and so `usePaginatedQuery`'s own "deps change -> reset to page 1"
 * behavior fires once per pause-in-typing. Unchanged from 6.9.
 *
 * **Platform-wide, every restaurant's orders together** — unlike
 * `OwnerOrders.jsx`'s own `GET /api/orders` (owner-scoped via
 * `attachOwnerRestaurant`), this reads `adminOrdersList.js`'s
 * admin-only, cross-restaurant query — no `noRestaurantYet` 403
 * branching here, same reasoning `AdminRestaurants.jsx`'s/
 * `AdminDashboard.jsx`'s own doc comments already give for every
 * `requireAdmin`-gated read.
 *
 * **6.10b: restaurant/status/date filters, this task's own update** —
 * three new pieces of `useState`, each starting at `ALL_VALUE`/`''`
 * ("no filter"), added to `usePaginatedQuery`'s own `deps` array
 * alongside `debouncedSearch` so changing any one of them resets back
 * to page 1 the same way a new search term already did. All four are
 * combined server-side with `AND` (6.10a's own doc comment) — this
 * screen doesn't re-decide that combination logic, just supplies the
 * values.
 *   - **Restaurant** — a `FilterBar` dropdown group, options fetched
 *     from `GET /api/admin/restaurants` (Task 6.4a) via `useApiQuery`
 *     at `RESTAURANT_OPTIONS_LIMIT` (see that constant's own comment).
 *     While that fetch is loading, the dropdown group is simply left
 *     out of `FilterBar`'s `groups` array for this render — an admin
 *     can still filter by status/date in the meantime, and the group
 *     appears the moment the options land, same as it always has.
 *     **On a real failure (`restaurantsOptionsError`), Task 8.7b added a
 *     visible inline "Couldn't load restaurants." + Retry line above
 *     `FilterBar`** — same `Home.jsx` Categories-row shape
 *     (`categoriesError` + `refetchCategories`) this doc comment used to
 *     claim this already matched but actually didn't (8.7a's own audit
 *     caught the gap: this filter used to just vanish with nothing
 *     telling the admin it was ever supposed to be there). Status/date
 *     filtering, and the rest of the page, stay fully usable while this
 *     one dropdown is unavailable — only the restaurant filter itself is
 *     affected, same "degrade a secondary section without blocking the
 *     page" precedent as before, just with a real visible retry now
 *     instead of silent omission.
 *   - **Status** — a second `FilterBar` dropdown group, `STATUS_OPTIONS`
 *     (this file's own hard-coded four-status list, see that constant's
 *     comment for why it's not fetched).
 *   - **Date** — a single-day filter via `FormField`
 *     (`as="input" type="date"`, Task 2.10), not `FilterBar` — `FilterBar`
 *     only renders chip/dropdown groups (its own doc comment is explicit
 *     neither reference image shows a date-picker equivalent for it to
 *     be styled against), so a calendar-day filter reuses the existing
 *     native-date-input primitive instead of stretching `FilterBar` to
 *     cover a shape it was never built for. Renders a real native date
 *     picker with its own built-in "clear" affordance, so no separate
 *     reset control is needed for it (or for either `FilterBar`
 *     dropdown — each already has its own selectable "All ..." option,
 *     same reasoning `ALL_VALUE`'s own comment gives).
 *
 * **Search matches order code, customer name, or phone** — the fields
 * `adminOrdersList.js`'s own header comment documents as the ones an
 * admin (or a customer relaying an order code over the phone) would
 * actually have on hand, not a restaurant-name search (that's
 * `AdminRestaurants.jsx`'s own `q` param, and this task's own
 * restaurant *filter* above, not this box) — unchanged from 6.9.
 *
 * **Each row** shows what `GET /api/admin/orders` returns per order —
 * `order_code`, the joined `restaurant_name` (the one field a platform-
 * wide list needs that `OwnerOrders.jsx`'s own single-restaurant rows
 * never did), `customer_name`, `status` (via `StatusBadge`),
 * `created_at`, `total` — same shape `OwnerOrders.jsx`'s own row
 * already uses, plus the restaurant name.
 *
 * **Tap-through to order detail (Task 6.11b)** — each row now navigates
 * to `/admin/orders/:id`, same clickable-row shape (`onClick`/
 * `onKeyDown`/`role="button"`/`tabIndex`) `AdminRestaurants.jsx` (6.5b)
 * already established for its own rows. That route reuses
 * `OrderDetail.jsx` (5.13) directly, in its new read-only `role="admin"`
 * mode, rather than a second near-identical detail screen — see that
 * component's own doc comment for the full reasoning, and 6.11a's own
 * backend comment for the `GET /api/admin/orders/:id` endpoint it reads.
 */
export default function AdminOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [restaurantId, setRestaurantId] = useState(ALL_VALUE);
  const [status, setStatus] = useState(ALL_VALUE);
  const [date, setDate] = useState('');

  const fetchRestaurantOptions = useCallback(
    (signal) =>
      api
        .get(`/admin/restaurants?limit=${RESTAURANT_OPTIONS_LIMIT}`, { signal })
        .then((data) => data.restaurants),
    []
  );
  const {
    data: restaurants,
    error: restaurantsOptionsError,
    refetch: refetchRestaurantOptions,
  } = useApiQuery(fetchRestaurantOptions, []);

  const { items, meta, loading, error, setPage, refetch } = usePaginatedQuery(
    fetchOrders({ search: debouncedSearch, restaurantId, status, date }),
    [debouncedSearch, restaurantId, status, date]
  );

  const hasActiveFilter = Boolean(debouncedSearch || restaurantId || status || date);

  const filterGroups = [
    {
      id: 'status',
      type: 'dropdown',
      label: 'Status',
      value: status,
      onChange: setStatus,
      options: STATUS_OPTIONS,
    },
  ];
  if (restaurants && !restaurantsOptionsError) {
    filterGroups.unshift({
      id: 'restaurant',
      type: 'dropdown',
      label: 'Restaurant',
      value: restaurantId,
      onChange: setRestaurantId,
      options: [
        { value: ALL_VALUE, label: 'All restaurants' },
        ...restaurants.map((restaurant) => ({
          value: String(restaurant.id),
          label: restaurant.name,
        })),
      ],
    });
  }

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Orders</h1>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by order code, name, or phone..."
          ariaLabel="Search orders"
          className={styles.searchBar}
        />

        {restaurantsOptionsError && (
          <div className={styles.restaurantFilterError}>
            <span className={styles.sectionStatus}>Couldn't load restaurants.</span>
            <button
              type="button"
              className={styles.retryButtonInline}
              onClick={refetchRestaurantOptions}
            >
              Retry
            </button>
          </div>
        )}

        <div className={styles.filters}>
          <FilterBar groups={filterGroups} />
          <FormField
            as="input"
            type="date"
            label="Date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={styles.dateField}
          />
        </div>

        {error ? (
          <EmptyState
            title="Couldn't load orders"
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
            loadingLabel="Loading orders…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Orders"
            getItemKey={(order) => order.id}
            emptyState={
              <EmptyState
                title={hasActiveFilter ? 'No matching orders' : 'No orders yet'}
                description={
                  hasActiveFilter
                    ? 'No orders match the current search/filters.'
                    : 'Orders placed across the platform will show up here.'
                }
              />
            }
            renderItem={(order) => (
              <div
                className={styles.row}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/admin/orders/${order.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.rowHeader}>
                  <span className={styles.orderCode}>{order.order_code}</span>
                  <StatusBadge
                    status={order.status}
                    tone={ORDER_STATUS_TONE[String(order.status).toLowerCase()]}
                  />
                </div>
                <div className={styles.restaurantName}>{order.restaurant_name}</div>
                <div className={styles.customerName}>{order.customer_name}</div>
                <div className={styles.rowMeta}>
                  <span>{formatDate(order.created_at)}</span>
                  <span className={styles.rowTotal}>{formatPrice(order.total)}</span>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </RoleShell>
  );
}
