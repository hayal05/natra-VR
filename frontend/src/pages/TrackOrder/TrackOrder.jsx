import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import FormField from '../../components/FormField';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useMutation } from '../../hooks';
import styles from './TrackOrder.module.css';

// Task 7.6c — polling interval for the "is this order's status still
// current" refresh below. No admin-configurable setting for this one
// (unlike `order_timeout_mode`'s poll-adjacent scheduler, Task 7.3c) —
// there's no admin_settings column for it and none is asked for
// anywhere in `docs/TASKS.md`'s 7.6 breakdown, so a plain constant is
// the right call, same as `useOwnerNewOrderAlerts.js`'s own
// `DEFAULT_POLL_INTERVAL_MS` (Task 7.5c). Kept slightly shorter than
// that hook's 20s: a customer staring at this screen waiting for
// Accept/Reject is a much shorter, much more attention-focused wait
// than an owner's ambient background poll.
const STATUS_POLL_INTERVAL_MS = 8000;

// Task 7.6c — once an order reaches one of these, `orders.status` can
// never change again (`statusTransition.js`'s own terminal-state
// reasoning, migration 0011 for `Expired`'s addition) — polling past
// that point would just be wasted requests forever on a screen a
// customer may well leave open. Lowercased to match this screen's own
// `String(status).toLowerCase()` comparison convention (see
// `ORDER_STATUS_TONE`'s own lookup below).
const TERMINAL_STATUSES = ['completed', 'rejected', 'expired'];

// Identical to OrderBuilder.jsx's/FoodDetails.jsx's own `formatPrice` —
// same "250 ETB" / "199.50 ETB" convention, not imported for the same
// reason those two don't import it from each other (no shared
// currency-formatting util exists yet in this codebase).
function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Order Confirmation (Task 3.16) already assigned real tones to the two
// statuses reference-image colors exist for (`open`/`closed`, unrelated
// to orders). `orders.status`'s New/Accepted/Completed/Rejected are, per
// `StatusBadge.jsx`'s own doc comment, deliberately NOT in that shared
// map (no reference image shows them) — this screen is the actual
// customer-facing order-status UI the comment flags as the real decision
// point, so it makes that call here via `tone`, rather than leaving every
// status a uniform neutral grey a customer can't tell apart at a glance.
// Kept local to this screen (not added to `STATUS_TONE`) since it's still
// not backed by a reference image — a per-use `tone` override, same seam
// `StatusBadge` documents for exactly this situation, rather than
// widening the shared map on a guess.
const ORDER_STATUS_TONE = {
  new: 'neutral',
  accepted: 'neutral',
  completed: 'success',
  rejected: 'error',
  // Task 7.6c adds `expired` — migration 0011's status (Task 7.3b)
  // predates this screen's last touch (3.17) and was never added here,
  // so a customer whose order timed out saw `StatusBadge` fall back to
  // its own default neutral tone (`StatusBadge.jsx`'s documented
  // behavior for an unmapped status) rather than the same "something
  // went wrong with this order" red `rejected` already gets — the two
  // are equally "this order isn't happening" outcomes from a customer's
  // point of view, so they now share a tone.
  expired: 'error',
};

function validate(values) {
  const errors = {};
  if (!values.orderCode.trim()) errors.orderCode = 'Enter your Order ID.';
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  return errors;
}

function trackOrder({ orderCode, phone }) {
  const query = `order_code=${encodeURIComponent(orderCode)}&customer_phone=${encodeURIComponent(phone)}`;
  return api.get(`/orders/track?${query}`, { auth: false });
}

/**
 * TrackOrder — Track Order screen, Task 3.17.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Tracking and order history" section:
 * "Tracking requires: Order ID, Phone number" — exactly the two fields
 * this form collects, matching the new `GET /api/orders/track` endpoint
 * this task also added (`backend/src/controllers/orderController.js`'s
 * `track`, built on `utils/phoneLookup.js`'s `getOrThrowByCode`, Task
 * 1.10, which was written with this exact screen in mind).
 *
 * Reached from `RoleShell`'s own "Orders" bottom-nav tab (already wired
 * to `/track` since Task 2.17) or Order Confirmation's (Task 3.16) "Track
 * order" button — neither hands off anything via router `state`, so this
 * screen starts from a blank form every time rather than trying to
 * pre-fill from a cart that's typically already been cleared by the time
 * a customer gets here (Order Confirmation's own success path clears it
 * immediately on submit, per that screen's doc comment).
 *
 * **Deliberately NOT `useOrderCart`-backed**: unlike every checkout
 * screen (3.10-3.16), this one isn't part of the in-progress-order flow
 * at all — it's a standalone lookup a customer can run at any time, for
 * any past order, using nothing but the Order ID and phone they were
 * given at checkout. Plain local form state (`useState`) is enough, the
 * same shape Customer Info's (3.12) own form state uses before it commits
 * anything to the cart.
 *
 * **No client-side format validation on either field beyond
 * non-empty** — same "don't guess a stricter rule than the backend
 * enforces" reasoning Customer Info's own doc comment already gives for
 * `customer_phone`: `normalizePhone` (used on both the write side,
 * `submitOrder.js`, and the read side, `orderLookup` in
 * `orderController.js`) already tolerates a wide range of formats, and
 * `order_code` is just typed back exactly as shown on the confirmation
 * screen, no format assumption of this screen's own to get wrong.
 *
 * **Submission** goes through `useMutation` (same hook `PaymentMethod`'s
 * data-fetch, this screen's own submit, and every other write/read this
 * codebase wraps in it, uses) rather than a bare `api.get` + manual
 * loading/error state — this is a "fires once per explicit action"
 * shape, exactly what that hook exists for, not the "fires automatically
 * on mount/deps-change" shape `useApiQuery` is for.
 *
 * **A 404** (`getOrThrowByCode`'s own "wrong code, wrong phone, or a
 * genuine mismatch between the two" response — see that function's own
 * comment for why those three cases are deliberately indistinguishable)
 * surfaces here as one plain "we couldn't find that order" message, not
 * a field-level error on either input — this screen has no way to tell
 * *which* of the two was wrong, and guessing would contradict the
 * backend's own deliberate refusal to leak that distinction.
 *
 * **A successful result stays on this same screen** (not a separate
 * route) — re-running the search with different details doesn't need a
 * navigation, just calling `mutate` again, and the result panel below
 * the form simply replaces itself.
 *
 * **"View order history" link (Task 3.18d)** navigates to `/history`
 * (Task 3.18c) — a plain `navigate('/history')` call, not a nav-bar
 * entry: the reference UI's bottom bar has exactly four fixed slots with
 * no fifth for it (see `RoleShell.jsx`'s own comment on why its "Orders"
 * tab still points here, not there), so this in-page cross-link is how a
 * customer who only knows their phone number (no order code handy)
 * reaches the other lookup instead.
 *
 * **Status polling (Task 7.6c)** — the customer-facing counterpart to
 * 7.5's owner notifications. `docs/TASKS.md`'s own 7.6a line already
 * settled the approach: customers have no account row for a
 * `notifications` row to target (migration 0010's own note), so this is
 * plain polling of the same `GET /api/orders/track` lookup above (7.6b:
 * nothing new to build — the existing endpoint is already a cheap,
 * public, single-row-plus-items lookup, exactly what a poll needs),
 * not a new endpoint or a table-backed event the way 7.5 got. Once a
 * search succeeds, a `setInterval` re-runs that same lookup with the
 * same `order_code`/`customer_phone` the customer already typed and
 * silently swaps in the fresh `{ order, items }` — no full-page reload,
 * no visible "Searching…" flicker, and no fresh `useMutation` cycle,
 * which is why the poll writes into its own `liveResult` state below
 * rather than calling `mutate` again (`useMutation`'s own `mutate`
 * unconditionally clears `data`/flips `loading` on every call — exactly
 * the flicker a *background* refresh shouldn't cause, unlike the
 * explicit "Track order" button press it's designed for).
 *
 * Stops itself once the order reaches a terminal status
 * (`TERMINAL_STATUSES` above) — an Accept/Reject/Expire is the one
 * event this whole task exists to surface, and nothing past it can ever
 * change `orders.status` again. Also stops (via the effect's own
 * dependency on `data`) the instant the customer edits a field or runs
 * a new search, same moment `handleChange`'s existing `reset()` call
 * already clears the old result — a poll for a search that's no longer
 * on screen would just be silently overwriting state nothing renders.
 */
export default function TrackOrder() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ orderCode: '', phone: '' });
  const [touched, setTouched] = useState({});
  // Task 7.6c — the polling loop's own result, layered on top of
  // `useMutation`'s `data` (see this component's own header comment on
  // why the poll can't just call `mutate` again). `null` until the
  // first successful poll tick; `displayResult` below falls back to
  // `data` until then, so the very first render of a found order still
  // comes from the explicit search, not a poll that hasn't fired yet.
  const [liveResult, setLiveResult] = useState(null);
  const searchedValuesRef = useRef(null);

  const { mutate, data, error, loading, reset } = useMutation(trackOrder);

  const errors = validate(values);
  const displayResult = liveResult || data;

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    // A field edited after a completed search invalidates that search's
    // result/error — same "don't show a stale answer next to inputs that
    // no longer match it" reasoning a search box would use, not specific
    // to this screen.
    if (data || error) reset();
    if (liveResult) setLiveResult(null);
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ orderCode: true, phone: true });
    if (Object.keys(errors).length > 0) return;

    const searched = { orderCode: values.orderCode.trim(), phone: values.phone.trim() };
    setLiveResult(null);
    searchedValuesRef.current = searched;
    mutate(searched).catch(() => {
      // Surfaced via `error` state below; nothing further to do here.
    });
  };

  // Task 7.6c — the poll itself. Keyed on `data` (not `values`, which
  // changes on every keystroke): a new interval only starts once a
  // search actually succeeds, and the effect's own cleanup tears the
  // previous interval down whenever `data` changes again — including
  // the moment `handleChange` resets it back to `null`, so editing the
  // form always stops any poll left over from a prior search.
  //
  // A plain `setInterval` alone would keep firing forever once the
  // order the customer is watching reaches a terminal status, since
  // this effect's own dependency (`data`) never changes again after
  // that point — so `latestStatus` tracks the most recently *seen*
  // status (starting from `data`, updated after every successful poll)
  // and the loop clears its own interval the moment that status turns
  // terminal, rather than only checking once at effect-start.
  useEffect(() => {
    if (!data) return undefined;

    const searched = searchedValuesRef.current;
    let cancelled = false;
    let latestStatus = String(data.order.status).toLowerCase();
    let timer = null;

    const poll = () => {
      trackOrder(searched)
        .then((result) => {
          if (cancelled) return;
          setLiveResult(result);
          latestStatus = String(result.order.status).toLowerCase();
          if (TERMINAL_STATUSES.includes(latestStatus) && timer) {
            clearInterval(timer);
            timer = null;
          }
        })
        .catch(() => {
          // Silently retry on the next tick — same posture
          // `useOwnerNewOrderAlerts.js` (7.5c) already takes for its own
          // background poll failures; a transient network hiccup
          // shouldn't blank out a result the customer can already see.
        });
    };

    if (!TERMINAL_STATUSES.includes(latestStatus)) {
      timer = setInterval(poll, STATUS_POLL_INTERVAL_MS);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [data]);

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Track your order</h1>
        <p className={styles.instructions}>
          Enter the Order ID from your confirmation screen and the phone number you ordered with.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            label="Order ID"
            required
            value={values.orderCode}
            onChange={handleChange('orderCode')}
            onBlur={handleBlur('orderCode')}
            placeholder="NTR-48291"
            error={touched.orderCode ? errors.orderCode : undefined}
          />

          <FormField
            label="Phone"
            type="tel"
            required
            value={values.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            placeholder="09XXXXXXXX"
            error={touched.phone ? errors.phone : undefined}
          />

          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Searching…' : 'Track order'}
          </button>
        </form>

        <button type="button" className={styles.linkButton} onClick={() => navigate('/history')}>
          Looking for all your orders? View order history
        </button>

        {error && (
          <p className={styles.resultError} role="alert">
            {notFound
              ? "We couldn't find an order with that Order ID and phone number. Double-check both and try again."
              : error.message || 'Something went wrong. Please try again.'}
          </p>
        )}

        {displayResult && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <span className={styles.orderCode}>{displayResult.order.order_code}</span>
              <StatusBadge
                status={displayResult.order.status}
                tone={ORDER_STATUS_TONE[String(displayResult.order.status).toLowerCase()]}
              />
            </div>

            <ul className={styles.itemList}>
              {displayResult.items.map((item) => (
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
              <span>{formatPrice(displayResult.order.total)}</span>
            </div>

            <dl className={styles.detailList}>
              <dt>Delivery location</dt>
              <dd>{displayResult.order.customer_location_text}</dd>
              {displayResult.order.customer_note && (
                <>
                  <dt>Note</dt>
                  <dd>{displayResult.order.customer_note}</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
