import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useOrderCart } from '../../hooks';
import styles from './PaymentMethod.module.css';

/**
 * PaymentMethod — Payment method selection screen, Task 3.13.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Payment" section: "Each restaurant
 * configures its own payment methods. Show all configured methods, such
 * as Telebirr, CBE Birr, Bank Transfer. Customer selects one and
 * uploads a payment screenshot." — this screen is exactly the "show all
 * configured methods, customer selects one" half; the upload half is
 * Task 3.14, not built here.
 *
 * Reached from Customer Info's (Task 3.12) "Continue" button, at
 * `/order/payment-method`. Same "read the cart directly, don't rely on
 * router `state`" pattern Customer Info itself established over Order
 * Builder's Buy-Now hand-off — this screen needs `cart.restaurantId` to
 * know which restaurant's methods to fetch, and that's already sitting
 * in the same sessionStorage-backed cart (Task 3.10) every other
 * checkout screen reads from.
 *
 * **An empty cart** (no items — this URL visited directly, or nothing
 * in progress) renders the same "browse restaurants" `EmptyState` every
 * other checkout screen uses for this exact case (Order Builder,
 * Customer Info), rather than fetching payment methods for a
 * restaurant id that doesn't even apply to a real order.
 *
 * **Data source**: the new public `GET /api/restaurants/:id/payment-methods`
 * (`backend/src/controllers/restaurantController.js`'s `getPaymentMethods`)
 * — see that function's own header comment for why this needed a new
 * endpoint rather than reusing the owner-scoped `GET /api/payment-methods`
 * (Task 1.16c, requires an owner's own auth token and doesn't filter
 * `is_active`) — filtered to only that restaurant's currently *active*
 * methods, exactly matching `docs/DB_SCHEMA.md`'s own note that
 * `is_active` exists so "inactive methods [are] hidden from checkout
 * without deleting history."
 *
 * **A restaurant with zero active payment methods configured** is a
 * real, reachable state (an owner hasn't set any up yet, or has
 * deactivated all of them) — rendered as its own `EmptyState`, distinct
 * from a loading/network-error state, since there's genuinely nothing
 * to select here rather than something that failed to load. Nothing in
 * this codebase yet lets a customer order from such a restaurant to
 * completion (Task 3.15's submit endpoint doesn't exist yet to decide
 * whether it should reject that case outright) — flagged here rather
 * than guessed at, since it isn't this task's call to make.
 *
 * **Selecting a method** is a single tap, not a form with its own
 * "Continue" button — `docs/NATRA_MASTER_PROMPT.md`'s own order-flow
 * diagram lists "Payment Method → Payment Screenshot" as two distinct
 * steps, and there's no other field on this screen a customer would
 * need to fill in before moving on, so tapping a method both selects it
 * (via `setPaymentMethod`, this task's addition to `useOrderCart`) and
 * immediately navigates to a new `/order/payment-screenshot` placeholder
 * route (added to `App.jsx` alongside this task) — Task 3.14 doesn't
 * exist yet to receive it for real, but the cart it'll need to read
 * from (including this task's own `paymentMethodId`) already is.
 * Navigating back to this screen after a selection re-highlights the
 * previously-picked method (`cart.paymentMethodId`), so re-opening it
 * doesn't look like nothing was chosen.
 */
export default function PaymentMethod() {
  const navigate = useNavigate();
  const { cart, setPaymentMethod } = useOrderCart();

  const fetchPaymentMethods = useCallback(
    (signal) =>
      api
        .get(`/restaurants/${cart.restaurantId}/payment-methods`, { signal, auth: false })
        .then((data) => data.payment_methods),
    [cart.restaurantId]
  );
  const {
    data: paymentMethods,
    loading,
    error,
    refetch,
  } = useApiQuery(fetchPaymentMethods, [cart.restaurantId]);

  const handleSelect = (paymentMethodId) => {
    setPaymentMethod(paymentMethodId);
    navigate('/order/payment-screenshot');
  };

  const isEmpty = cart.items.length === 0;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Payment method</h1>

        {isEmpty ? (
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
            title="Couldn't load payment methods"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : loading || !paymentMethods ? (
          <p className={styles.status}>Loading…</p>
        ) : paymentMethods.length === 0 ? (
          <EmptyState
            title="No payment methods available"
            description="This restaurant hasn't set up a way to pay yet. Please try again later."
          />
        ) : (
          <ul className={styles.methodList}>
            {paymentMethods.map((method) => {
              const isSelected = cart.paymentMethodId === method.id;
              return (
                <li key={method.id}>
                  <button
                    type="button"
                    className={
                      isSelected ? `${styles.methodCard} ${styles.methodCardSelected}` : styles.methodCard
                    }
                    onClick={() => handleSelect(method.id)}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.methodName}>{method.method_name}</span>
                    <span className={styles.methodDetail}>{method.account_number}</span>
                    <span className={styles.methodDetail}>{method.account_name}</span>
                    {method.instructions && (
                      <span className={styles.methodInstructions}>{method.instructions}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </RoleShell>
  );
}
