import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { clearOwnerOrderBadge, usePaginatedQuery } from '../../hooks';
import styles from './OwnerOrders.module.css';

// Same tone map `OrderHistory.jsx`'s (3.18c) own doc comment already
// explains and `TrackOrder.jsx` (3.17) originated: New/Accepted/
// Completed/Rejected aren't in `StatusBadge`'s shared `STATUS_TONE`
// (Task 2.4) because neither reference image shows them. Duplicated
// here rather than imported from either of those screens — same "not
// worth a cross-screen dependency for one small object" reasoning
// OrderHistory.jsx's own comment already gives.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
};

// Identical to OrderHistory.jsx's/TrackOrder.jsx's/OrderBuilder.jsx's/
// FoodDetails.jsx's own `formatPrice` — same "250 ETB" / "199.50 ETB"
// convention, duplicated rather than imported for the same reason none
// of those screens import it from one another (no shared
// currency-formatting util exists yet in this codebase).
function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Identical to OrderHistory.jsx's own `formatDate` — `orders.created_at`
// is a plain TIMESTAMP column (docs/DB_SCHEMA.md's 0.8 section),
// formatted with nothing fancier than the browser's own
// `Intl.DateTimeFormat` default.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// `GET /api/orders` (Task 5.12a) returns `{ orders, meta }` — reshaped to
// the `{ rows, meta }` shape `usePaginatedQuery` (Task 3.1) expects,
// same "controller renames `rows` to its own resource key, screen renames
// it back" reshaping `OwnerRestaurant.jsx`'s own `fetchPaymentMethods`
// already does for `paymentMethodController.js`'s `{ payment_methods,
// meta }`. No `{ auth: false }` needed — this is the first owner-
// authenticated fetch on this screen, and `auth: true` is `api.get`'s
// own default (attaches the stored bearer token via `tokenStorage`,
// Task 3.1).
function fetchOrders({ page }, signal) {
  return api.get(`/orders?page=${page}`, { signal }).then(({ orders, meta }) => ({ rows: orders, meta }));
}

/**
 * OwnerOrders — Task 5.12b. Replaces the placeholder Task 5.1 left at
 * `RoleShell`'s (2.18) "Orders" tab with a real, paginated list of the
 * caller's own restaurant's orders, wired to Task 5.12a's new
 * `GET /api/orders`.
 *
 * **`usePaginatedQuery`, not `useApiQuery`** — same reasoning
 * `OwnerRestaurant.jsx`'s categories/service-areas/payment-methods
 * sections and `OrderHistory.jsx` already established: this is a real
 * paginated list (`ListWithPagination`, Task 2.16) from the moment the
 * screen mounts, with no search/filter step gating the first fetch the
 * way `OrderHistory.jsx`'s phone field does — so there's no
 * `fetchOrders(...)`-returning-a-function wrapper here, just the plain
 * `({ page }, signal) => ...` shape directly.
 *
 * **`noRestaurantYet` (403) handling** mirrors `OwnerRestaurant.jsx`'s
 * own `error instanceof ApiError && error.status === 403` check for the
 * exact same underlying cause: an owner who somehow reached this screen
 * before `attachOwnerRestaurant` (1.15a) has a restaurant row to resolve.
 * Reachable in practice only via a direct URL visit, since every real
 * navigation path to `/owner/orders` goes through `RoleShell`'s owner
 * nav, which assumes a restaurant already exists (`OwnerRestaurant.jsx`'s
 * own screen makes the identical assumption).
 *
 * **Each row** shows exactly what `GET /api/orders` returns per order —
 * `order_code`, `customer_name`, `status` (via `StatusBadge`),
 * `created_at`, `total` — no per-item breakdown (that needs `order_items`,
 * which this endpoint deliberately doesn't join; see `orderController.js`'s
 * own `list` comment on why). **Tapping a row now navigates to
 * `/owner/orders/:id`** (Task 5.13's `OrderDetail.jsx`, which fetches the
 * full breakdown itself via the new `GET /api/orders/:id`) — this screen's
 * own doc comment previously flagged that as explicitly out of scope
 * ("no tap-through to a detail view (that's Task 5.13's job)"); this is
 * that task's own wiring for it, same interactive-`<article>`
 * keyboard/`role="button"` shape `EntityCard` (2.3) already establishes
 * for a clickable card, applied here to the plain row `<div>` rather than
 * pulling in `EntityCard` itself (a row here has no image/logo/badge
 * slots to fill — reusing the whole component for just its click
 * affordance would be more indirection than the row actually needs).
 *
 * **No status filter/tabs (e.g. "New only")** — same "out of scope for
 * this task" call `orderController.js`'s own `list` comment already
 * makes: that's arguably Task 5.14's (Accept/Reject) concern once an
 * owner has a real reason to want just the actionable ones in view, not
 * this screen's to invent ahead of it.
 */
export default function OwnerOrders() {
  const navigate = useNavigate();
  const { items, meta, loading, error, setPage, refetch } = usePaginatedQuery(fetchOrders, []);

  const noRestaurantYet = error instanceof ApiError && error.status === 403;

  // Task 5.21 — landing on the real orders list is what "the owner has
  // seen the new ones" means for `RoleShell`'s persistent nav badge
  // (`useOwnerOrderBadge.js`); cleared unconditionally on mount, not
  // gated on `noRestaurantYet`/`error` above — a badge can only exist at
  // all once `OwnerDashboard.jsx` has successfully detected an order,
  // which itself requires a restaurant to exist, so there's no case
  // where this fires with nothing to clear.
  useEffect(() => {
    clearOwnerOrderBadge();
  }, []);

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        <h1 className={styles.heading}>Orders</h1>

        {noRestaurantYet ? (
          <EmptyState
            title="No restaurant set up yet"
            description="Your account isn't linked to a restaurant yet, so there's nothing here to show."
          />
        ) : error ? (
          <EmptyState
            title="Couldn't load your orders"
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
            loadingLabel="Loading your orders…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Incoming orders"
            getItemKey={(order) => order.id}
            emptyState={
              <EmptyState
                title="No orders yet"
                description="New orders placed with your restaurant will show up here."
              />
            }
            renderItem={(order) => (
              <div
                className={styles.row}
                onClick={() => navigate(`/owner/orders/${order.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/owner/orders/${order.id}`);
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
