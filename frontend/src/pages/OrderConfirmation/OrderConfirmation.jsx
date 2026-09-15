import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import RoleShell from '../../components/RoleShell';
import { useMutation, useOrderCart } from '../../hooks';
import styles from './OrderConfirmation.module.css';

/**
 * OrderConfirmation — Order confirmation screen, Task 3.16.
 * `docs/NATRA_MASTER_PROMPT.md`'s order-flow diagram ends "Payment
 * Screenshot → Order Confirmation (success message, Order ID, Track
 * Order button)" — this is that last step.
 *
 * Reached from Payment Screenshot's (Task 3.14) "Continue" button, at
 * `/order/confirm`, once `cart.paymentScreenshotUrl` is set. Every
 * earlier checkout screen (3.10-3.14) only *built up* `useOrderCart`'s
 * state — nothing has actually called `POST /api/orders` (Task 3.15)
 * yet, so **this screen is also where the order is actually submitted**,
 * not just where its result is displayed. That's a real difference from
 * every prior checkout screen (which each read the cart, let the
 * customer act, and moved on) — flagged here rather than left implicit,
 * since a screen whose whole job elsewhere in this codebase is "show a
 * one-time submit result" (e.g. a future payment-received notice) would
 * normally expect its data already fetched, not fire the mutating call
 * itself.
 *
 * **Submits exactly once per real visit**, guarded by `submittedRef`
 * rather than `useMutation`'s own `loading`/`data` state: React 18
 * `StrictMode` (`main.jsx`) double-invokes an effect's setup once in
 * development, and relying on `status === 'idle'` to decide whether to
 * fire would still race that double-invoke (both calls would read
 * `idle` before either's `setState` from `mutate` lands). A ref set
 * synchronously inside the effect, before the async `mutate` call even
 * starts, closes that gap the way state alone can't.
 *
 * **`hadItemsOnMountRef`** captures whether the cart had items *at the
 * moment this screen first rendered*, before any submit attempt can
 * clear it. This screen reads `cart.items.length === 0` for the exact
 * same "browse restaurants" `EmptyState` every other checkout screen
 * uses for a genuinely-empty cart (direct visit, refresh with nothing
 * in progress) — but on a *successful* submission this screen's own
 * effect calls `clearCart()`, which would otherwise make a
 * freshly-placed order look identical to that empty-cart case on the
 * very next render. Branching on the captured mount-time value instead
 * of the live `cart.items.length` keeps those two states distinct.
 *
 * **The request payload** is built from exactly the fields the last
 * four screens committed to the cart — `customerInfo`
 * (`name`/`phone`/`locationText`/`note`, Task 3.12),
 * `paymentMethodId` (Task 3.13), `paymentScreenshotUrl` (Task 3.14),
 * and `items` (`foodId`/`quantity` pairs, Task 3.10) reshaped to the
 * `food_id`/`quantity` keys `createOrderSchema` (3.15c) expects — no
 * price of any kind is sent, matching that schema's own `.strict()`
 * rejection of a client-supplied `subtotal`/`total`. This screen does
 * **not** separately guard against `customerInfo`/`paymentMethodId`/
 * `paymentScreenshotUrl` still being `null` (e.g. this URL reached
 * directly, skipping earlier steps) — same standing precedent
 * `PaymentScreenshot.jsx`'s own doc comment already gives for not
 * re-checking a predecessor step's completion; a request missing one of
 * those simply gets the backend's own clear validation message back,
 * surfaced through the same error state a real network/business-rule
 * failure would use.
 *
 * **On success**: `clearCart()` runs immediately (Task 3.10's
 * `useOrderCart` exposes it for exactly this "the in-progress order is
 * over" case) — there's nothing left to protect against a
 * different-restaurant swap or a stale screenshot once the real order
 * row exists in the DB. The created `order` (from the `201` response;
 * `order_code`/`status`, per `models/orders.js`'s `selectColumns`) is
 * kept in `useMutation`'s own `data`, not re-read from the
 * (now-cleared) cart, so the confirmation stays visible after that
 * clear.
 *
 * **On failure**: no cart mutation happens at all — the in-progress
 * order is untouched, so "Try again" (this screen's own retry, not a
 * full back-navigation) can simply call `mutate()` again directly to
 * re-run the same submit, rather than sending the customer back through
 * 3.12-3.14 to rebuild state that never left the cart in the first
 * place. It bypasses `submittedRef` entirely (that ref only guards the
 * mount effect against `StrictMode`'s double-invoke, not manual
 * retries) since a deliberate button press is never the double-invoke
 * this screen needs to protect against.
 *
 * **Track Order** navigates to `/track` — still `App.jsx`'s own
 * `Placeholder` today; Task 3.17's job to build for real, not this
 * task's.
 */
export default function OrderConfirmation() {
  const navigate = useNavigate();
  const { cart, clearCart } = useOrderCart();

  const hadItemsOnMountRef = useRef(cart.items.length > 0);
  const submittedRef = useRef(false);

  const submitOrder = useCallback(() => {
    const payload = {
      customer_name: cart.customerInfo?.name,
      customer_phone: cart.customerInfo?.phone,
      customer_location_text: cart.customerInfo?.locationText,
      customer_note: cart.customerInfo?.note || null,
      payment_method_id: cart.paymentMethodId,
      payment_screenshot_url: cart.paymentScreenshotUrl,
      items: cart.items.map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    };
    return api.post('/orders', payload, { auth: false }).then((data) => data.order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate, data: order, error, loading } = useMutation(submitOrder);

  useEffect(() => {
    if (!hadItemsOnMountRef.current || submittedRef.current) return;
    submittedRef.current = true;
    mutate()
      .then(() => clearCart())
      .catch(() => {
        // Surfaced via `error` state below; nothing further to do here
        // (the cart is deliberately left untouched — see doc comment).
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    mutate()
      .then(() => clearCart())
      .catch(() => {});
  };

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        {!hadItemsOnMountRef.current ? (
          <EmptyState
            title="Your order is empty"
            description="Add a food from any restaurant to start an order."
            action={
              <button type="button" className={styles.primaryButton} onClick={() => navigate('/')}>
                Browse restaurants
              </button>
            }
          />
        ) : error ? (
          <EmptyState
            title="Couldn't place your order"
            description={error.message || 'Something went wrong. Please try again.'}
            action={
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleRetry}
                disabled={loading}
              >
                {loading ? 'Trying again…' : 'Try again'}
              </button>
            }
          />
        ) : loading || !order ? (
          <p className={styles.status}>Placing your order…</p>
        ) : (
          <div className={styles.success}>
            <p className={styles.successIcon} aria-hidden="true">
              ✓
            </p>
            <h1 className={styles.heading}>Order placed!</h1>
            <p className={styles.instructions}>
              Your order has been sent to the restaurant. Keep your Order ID handy to track it.
            </p>

            <div className={styles.orderCode}>{order.order_code}</div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate('/track')}
            >
              Track order
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/')}>
              Back to home
            </button>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
