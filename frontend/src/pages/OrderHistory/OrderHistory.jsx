import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import ListWithPagination from '../../components/ListWithPagination';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { usePaginatedQuery } from '../../hooks';
import styles from './OrderHistory.module.css';

// Identical to TrackOrder.jsx's/OrderBuilder.jsx's/FoodDetails.jsx's own
// `formatPrice` — same "250 ETB" / "199.50 ETB" convention, not imported
// for the same reason none of those three import it from one another (no
// shared currency-formatting util exists yet in this codebase).
function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// `orders.created_at` comes back as an ISO timestamp string (a plain
// TIMESTAMP column, docs/DB_SCHEMA.md's 0.8 section) — formatted here with
// nothing fancier than the browser's own `Intl.DateTimeFormat` default
// (via `toLocaleDateString`), same "don't add a date library for one
// field" reasoning this codebase hasn't needed anywhere else yet.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Same tone map TrackOrder.jsx (3.17) already keeps local to itself
// rather than widening StatusBadge's own shared `STATUS_TONE` — see that
// component's doc comment for why New/Accepted/Completed/Rejected aren't
// in the shared map (no reference image shows them). Duplicated here
// rather than imported from TrackOrder.jsx: these two screens don't
// otherwise share code, and a one-line object isn't worth introducing a
// cross-screen dependency for.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
};

function fetchHistory(phone) {
  return ({ page }, signal) => {
    // No phone submitted yet — resolve to an empty page without ever
    // calling the API. `usePaginatedQuery` still fires this on mount (and
    // on every `phone` change) since it can't conditionally skip its own
    // effect, so this is the seam that turns "no search run yet" into a
    // real no-op rather than a wasted network request.
    if (!phone) {
      return Promise.resolve({ rows: [], meta: null });
    }
    const query = `customer_phone=${encodeURIComponent(phone)}&page=${page}`;
    return api.get(`/orders/history?${query}`, { auth: false, signal });
  };
}

function validate(values) {
  const errors = {};
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  return errors;
}

/**
 * OrderHistory — Order History screen, Task 3.18c.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Tracking and order history" section:
 * "Customers can view previous orders using phone number only. The
 * detailed previous-order layout remains flexible." — a single phone
 * field (no order code, unlike Track Order/3.17) drives the new
 * `GET /api/orders/history` endpoint (Task 3.18a), built on
 * `phoneLookup.findAllByPhone` (Task 1.10).
 *
 * **Deliberately built on `usePaginatedQuery` (Task 3.1), not
 * `useMutation`** — unlike Track Order's single-record lookup (a "fires
 * once per explicit action" shape), this is a genuine paginated list:
 * once a phone has been submitted, paging through it (`ListWithPagination`,
 * Task 2.16) is itself a sequence of automatic re-fetches keyed by `page`,
 * exactly the shape `usePaginatedQuery` exists for. `fetchHistory(phone)`
 * above is what makes that fit despite the search only having a "submit"
 * step and no phone-per-keystroke debounce (unlike Home's search bar,
 * Task 3.6): `phone` is only updated on submit, not on every keystroke, so
 * `usePaginatedQuery`'s "deps change -> reset to page 1 and refetch"
 * behavior fires exactly once per submitted search, not on every input
 * event.
 *
 * **No client-side format validation on the phone field beyond
 * non-empty** — same reasoning `TrackOrder.jsx`'s own doc comment already
 * gives for its own phone field: `normalizePhone` (used by
 * `findAllByPhone` on the read side, and by `submitOrder.js` on the write
 * side) already tolerates a wide range of formats, so this screen doesn't
 * guess a stricter rule than the backend enforces.
 *
 * **A phone with no orders** renders `ListWithPagination`'s own
 * `emptyState` slot (an `EmptyState` instance) rather than an error — the
 * backend's own `history` handler (3.18a) deliberately returns `200` with
 * an empty list for this case, not a `404`, and this screen honors that
 * same "no match isn't a failure" distinction.
 *
 * **Each row** shows exactly the columns `orders.history` actually
 * returns per order (order_code, status, placed-on date, total) — no
 * per-item breakdown the way Track Order's single-order result panel
 * shows, since `GET /api/orders/history` doesn't join `order_items` (a
 * customer wanting that detail already has Track Order for one specific
 * order). Per the master prompt's own "remains flexible" note, this is a
 * starting layout, not a fixed one.
 *
 * **"Track it here" link (Task 3.18d)** navigates to `/track` (Task
 * 3.17) — the reciprocal of that screen's own "View order history"
 * link, so a customer who lands on whichever of the two screens doesn't
 * match what they actually need (one specific order vs. everything)
 * isn't stuck; see `TrackOrder.jsx`'s own doc comment and `App.jsx`'s
 * `/history` route comment for why this is a plain in-page link rather
 * than a `RoleShell` nav entry.
 */
export default function OrderHistory() {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [touched, setTouched] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState(null);

  const errors = validate({ phone: phoneInput });

  const { items, meta, loading, error, setPage } = usePaginatedQuery(
    fetchHistory(submittedPhone),
    [submittedPhone]
  );

  const handleChange = (event) => {
    setPhoneInput(event.target.value);
  };

  const handleBlur = () => setTouched(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setSubmittedPhone(phoneInput.trim());
  };

  const hasSearched = submittedPhone !== null;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Your order history</h1>
        <p className={styles.instructions}>
          Enter the phone number you ordered with to see every order placed with it.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            label="Phone"
            type="tel"
            required
            value={phoneInput}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="09XXXXXXXX"
            error={touched ? errors.phone : undefined}
          />

          <button type="submit" className={styles.primaryButton} disabled={loading && hasSearched}>
            {loading && hasSearched ? 'Searching…' : 'View history'}
          </button>
        </form>

        <button type="button" className={styles.linkButton} onClick={() => navigate('/track')}>
          Looking for one specific order? Track it here
        </button>

        {error && (
          <p className={styles.resultError} role="alert">
            {error.message || 'Something went wrong. Please try again.'}
          </p>
        )}

        {hasSearched && !error && (
          <ListWithPagination
            items={items}
            isLoading={loading}
            loadingLabel="Loading your orders…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Your previous orders"
            getItemKey={(order) => order.id}
            emptyState={
              <EmptyState
                title="No orders found"
                description="We couldn't find any orders placed with that phone number."
              />
            }
            renderItem={(order) => (
              <div className={styles.row}>
                <div className={styles.rowHeader}>
                  <span className={styles.orderCode}>{order.order_code}</span>
                  <StatusBadge
                    status={order.status}
                    tone={ORDER_STATUS_TONE[String(order.status).toLowerCase()]}
                  />
                </div>
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
