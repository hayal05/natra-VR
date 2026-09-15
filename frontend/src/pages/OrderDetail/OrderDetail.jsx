import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageViewer from '../../components/ImageViewer';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './OrderDetail.module.css';

// Identical to OwnerOrders.jsx's/OrderHistory.jsx's/TrackOrder.jsx's own
// `ORDER_STATUS_TONE` — New/Accepted/Completed/Rejected aren't in
// `StatusBadge`'s shared `STATUS_TONE` (Task 2.4) because neither
// reference image shows them (see that component's own doc comment).
// Duplicated rather than imported for the same reason none of those
// three screens import it from one another — no shared
// order-status-tone module exists yet in this codebase.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
};

// Identical to OwnerOrders.jsx's/TrackOrder.jsx's/OrderHistory.jsx's/
// OrderBuilder.jsx's/FoodDetails.jsx's own `formatPrice` — same
// "250 ETB" / "199.50 ETB" convention, duplicated rather than imported
// for the same reason none of those screens import it from one another.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return '';
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Identical to OwnerOrders.jsx's/OrderHistory.jsx's own `formatDate` —
// `orders.created_at` is a plain TIMESTAMP column (docs/DB_SCHEMA.md's
// 0.8 section), formatted with nothing fancier than the browser's own
// `Intl.DateTimeFormat` default. This screen additionally shows the time
// (docs/NATRA_MASTER_PROMPT.md's "Order details" list asks for
// "Date/time", not just a date) — `OwnerOrders.jsx`'s own row-summary
// `formatDate` deliberately doesn't, since a list row has less room and
// a date alone is enough to tell orders apart there.
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

// `GET /api/orders/:id` (Task 5.13a) / `GET /api/admin/orders/:id`
// (Task 6.11a) both return `{ order, items, payment_method }` directly —
// no reshaping needed the way `OwnerOrders.jsx`'s own `fetchOrders`
// renames `orders/meta` for `usePaginatedQuery`; this is a
// single-resource fetch via `useApiQuery` (same shape `FoodDetails.jsx`'s
// own `fetchFood` uses), so the response is just handed straight
// through either way — 6.11a's own backend comment is explicit that its
// response shape matches 5.13a's exactly for precisely this reason, so
// this single fetch helper can serve both roles by only swapping which
// path it hits.
function fetchOrderDetail(id, role, signal) {
  const basePath = role === 'admin' ? '/admin/orders' : '/orders';
  return api.get(`${basePath}/${id}`, { signal });
}

// `PATCH /api/orders/:id/status` (Task 5.14a) — no `signal` param, same
// reasoning `useMutation`'s own doc comment gives for every other
// mutation in this codebase (`updateMyRestaurant` in OwnerRestaurant.jsx,
// etc): a button press isn't something that races a superseded request
// the way a `useApiQuery`/`usePaginatedQuery` fetch does.
function patchOrderStatus(id, status) {
  return api.patch(`/orders/${id}/status`, { status });
}

/**
 * OrderDetail — Task 5.13. The owner-facing single-order screen
 * `docs/NATRA_MASTER_PROMPT.md`'s "Order details" section lists field by
 * field: Order ID, customer name, phone, food items and quantities,
 * total, selected payment method, payment screenshot, specific customer
 * location, date/time, status. Every one of those is rendered below,
 * from the one new endpoint this task's backend half
 * (`GET /api/orders/:id`, 5.13a in `orderController.js`) added
 * specifically to gather them in one response.
 *
 * Reached by tapping a row on `OwnerOrders.jsx` (5.12b) — that screen's
 * own doc comment had explicitly flagged "no tap-through to a detail
 * view (that's Task 5.13's job)" until now; this task also turns those
 * rows into real links to `/owner/orders/:id` (see that file's own
 * diff). Wrapped in `RoleShell role="owner"`, same as every other owner
 * screen.
 *
 * **Ownership/not-found are indistinguishable**, same "can't tell
 * not-found from not-yours apart" rule `FoodDetails.jsx` (3.9) and
 * `OwnerRestaurant.jsx`'s own category/service-area/payment-method
 * fetches already follow — `ownershipMiddleware` (1.4, wired on this
 * route in `order.routes.js`) 404s identically for a nonexistent order
 * id and for another owner's real one, so a single "Order not found"
 * `EmptyState` covers both without this screen trying to guess which.
 *
 * **Accept/Reject (Task 5.14b), Complete (Task 5.15), and Call Customer
 * (Task 5.16) added on top of 5.13's display-only screen** — this doc
 * comment previously flagged all four actions as later tasks' job; all
 * four now live here. Accept/Reject/Complete are wired to
 * `PATCH /api/orders/:id/status` (5.14a, widened by 5.15) via the same
 * `useMutation` call/`handleStatusChange` helper — same "fire on click,
 * `refetch()` on success, leave the error in a banner on failure" shape
 * `OwnerRestaurant.jsx`'s own `handleOpenToggle` (5.8) already
 * established, not an optimistic status flip: a rejected/failed PATCH
 * leaves `StatusBadge` showing the real last-known status rather than
 * one that never actually saved. Call Customer is not a mutation at
 * all — a plain `<a href="tel:...">`, per `docs/NATRA_MASTER_PROMPT.md`'s
 * own line ("Call Customer opens the phone dialer using the registered
 * phone number") — there's no backend endpoint to call and nothing here
 * to fetch/refetch.
 *
 * **Which buttons render is a plain function of `status`, per
 * `docs/NATRA_MASTER_PROMPT.md`'s own "Restaurant order actions" list**
 * — `updateOrderStatus`'s transitions map (5.14a/5.15) would 409 an
 * out-of-turn Accept/Reject/Complete attempt anyway, but there's no
 * reason to show a button whose only possible outcome is that error:
 * `New` shows Accept/Reject/Call Customer (that master-prompt list's own
 * grouping — Call Customer is a `New`-order action, not an always-
 * available one, so it's *not* shown alongside Complete on an `Accepted`
 * order), `Accepted` shows Complete, and `Completed`/`Rejected` (both
 * terminal) show no action row at all — this screen's four actions are
 * now all built.
 *
 * **Payment screenshot** uses `ImageViewer` (Task 2.6) exactly as its
 * own doc comment anticipates ("Payment screenshot is a small thumbnail
 * and opens full-screen when tapped" — quoting the same master-prompt
 * line this screen's own header comment above also quotes) — the first
 * real (non-sandbox) screen to actually use it, since neither Payment
 * Screenshot (3.14, the upload step) nor Order Confirmation (3.16) ever
 * needed to redisplay it back.
 *
 * **`payment_method`** comes back as `null` only in the defensive,
 * should-never-happen case `orderController.js`'s own `getOne` comment
 * documents (a payment method row that's gone missing despite never
 * being hard-deletable) — rendered as a plain "Payment method
 * unavailable" fallback rather than a crash, not a real state normal
 * order flow can reach.
 *
 * **Task 6.11b: `role="admin"` — the read-only admin mode.** Rather than
 * building a second, near-identical `AdminOrderDetail.jsx` screen (the
 * shape `AdminRestaurantDetail.jsx`, 6.5b, chose for its own resource —
 * a genuinely different one there, since Suspend/Reactivate has no
 * owner-side equivalent for that screen to accidentally leak into), this
 * task reuses this component directly, per `docs/TASKS.md`'s own wording
 * for 6.11b ("make `OrderDetail.jsx` reusable in a read-only admin
 * mode"). A single `role` prop (`"owner"` default, or `"admin"`) drives
 * every difference:
 *   - **Which endpoint** — `fetchOrderDetail`'s own `role` param picks
 *     `GET /api/admin/orders/:id` (6.11a, no ownership check) instead of
 *     the owner-scoped `GET /api/orders/:id` (5.13a). 6.11a's own
 *     backend comment is explicit its response shape matches 5.13a's
 *     exactly for this reason — no reshaping needed here either way.
 *   - **`RoleShell role`** — `"admin"` renders the admin sidebar nav
 *     instead of the owner's 4-tab bottom nav, same as every other admin
 *     screen.
 *   - **Back button destination** — `/admin/orders` instead of
 *     `/owner/orders`, matching whichever list screen this instance was
 *     actually reached from (`AdminOrders.jsx`, 6.9/6.10b, this task's
 *     own new tap-through, vs. `OwnerOrders.jsx`, 5.12b).
 *   - **Not-found copy** — an admin's `GET /api/admin/orders/:id` 404 is
 *     a real "doesn't exist," not an ownership ambiguity the way the
 *     owner-scoped route's is (same distinction
 *     `AdminRestaurantDetail.jsx`'s own doc comment already draws for
 *     its own admin-only read), so the admin copy drops the "or isn't
 *     yours to view" half.
 *   - **The entire action row (Accept/Reject/Complete/Call Customer) is
 *     hidden** — per 6.11b's own wording. An admin reviewing an order
 *     platform-wide has no reason to act on a single owner's behalf here
 *     (there's no backend support for it either — 6.11a's own route is a
 *     bare `GET`, no matching admin-scoped `PATCH`), so `role ===
 *     'admin'` skips the whole `New`/`Accepted` action-row branching
 *     below rather than rendering buttons a click would just 403/404
 *     against.
 */
export default function OrderDetail({ role = 'owner' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const fetchDetail = useCallback((signal) => fetchOrderDetail(id, role, signal), [id, role]);
  const { data, loading, error, refetch } = useApiQuery(fetchDetail, [id, role]);

  const { mutate: mutateStatus, error: statusError, loading: statusUpdating } = useMutation(patchOrderStatus);

  const notFound = error instanceof ApiError && error.status === 404;
  const ordersListPath = isAdmin ? '/admin/orders' : '/owner/orders';

  function handleStatusChange(status) {
    mutateStatus(id, status)
      .then(() => refetch())
      .catch(() => {
        // Surfaced via `statusError` below.
      });
  }

  return (
    <RoleShell role={role}>
      <div className={styles.page}>
        <button type="button" className={styles.backButton} onClick={() => navigate(ordersListPath)}>
          ← Orders
        </button>

        {error ? (
          <EmptyState
            title={notFound ? 'Order not found' : "Couldn't load this order"}
            description={
              notFound
                ? isAdmin
                  ? "This order doesn't exist."
                  : "This order doesn't exist or isn't yours to view."
                : 'Check your connection and try again.'
            }
            action={
              notFound ? undefined : (
                <button type="button" className={styles.retryButton} onClick={refetch}>
                  Retry
                </button>
              )
            }
          />
        ) : loading || !data ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <div className={styles.card}>
            <div className={styles.header}>
              <span className={styles.orderCode}>{data.order.order_code}</span>
              <StatusBadge
                status={data.order.status}
                tone={ORDER_STATUS_TONE[String(data.order.status).toLowerCase()]}
              />
            </div>

            <p className={styles.dateTime}>{formatDateTime(data.order.created_at)}</p>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Customer</h2>
              <dl className={styles.detailList}>
                <dt>Name</dt>
                <dd>{data.order.customer_name}</dd>
                <dt>Phone</dt>
                <dd>{data.order.customer_phone}</dd>
                <dt>Location</dt>
                <dd>{data.order.customer_location_text}</dd>
                {data.order.customer_note && (
                  <>
                    <dt>Note</dt>
                    <dd>{data.order.customer_note}</dd>
                  </>
                )}
              </dl>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Items</h2>
              <ul className={styles.itemList}>
                {data.items.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <span>
                      {item.quantity} × {item.food_name_snapshot}
                    </span>
                    <span>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span>{formatPrice(data.order.total)}</span>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Payment</h2>
              {data.payment_method ? (
                <dl className={styles.detailList}>
                  <dt>Method</dt>
                  <dd>{data.payment_method.method_name}</dd>
                  <dt>Account</dt>
                  <dd>
                    {data.payment_method.account_name} — {data.payment_method.account_number}
                  </dd>
                </dl>
              ) : (
                <p className={styles.mutedText}>Payment method unavailable.</p>
              )}

              <ImageViewer
                src={data.order.payment_screenshot_url}
                alt={`Payment screenshot for order ${data.order.order_code}`}
                thumbnailClassName={styles.screenshotThumbnail}
                className={styles.screenshotThumbnail}
              />
            </section>

            {/* Task 6.11b: the whole action row — Accept/Reject/Call
                Customer for a `New` order, Complete for an `Accepted`
                one — is owner-only. An admin viewing this screen via
                `role="admin"` (6.11a's read-only endpoint has no
                matching admin-scoped `PATCH`) never sees any of it,
                regardless of `status`. See this component's own doc
                comment for the full reasoning. */}
            {!isAdmin && data.order.status === 'New' && (
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.acceptButton}
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange('Accepted')}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange('Rejected')}
                >
                  Reject
                </button>
                <a href={`tel:${data.order.customer_phone}`} className={styles.callButton}>
                  Call Customer
                </a>
              </div>
            )}
            {!isAdmin && data.order.status === 'Accepted' && (
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.completeButton}
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange('Completed')}
                >
                  Mark as Completed
                </button>
              </div>
            )}
            {!isAdmin && statusError && (
              <p className={styles.actionError}>
                {statusError.message || 'Could not update this order. Please try again.'}
              </p>
            )}
          </div>
        )}
      </div>
    </RoleShell>
  );
}
