import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import QuantityStepper from '../../components/QuantityStepper';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useOrderCart } from '../../hooks';
import styles from './OrderBuilder.module.css';

// Same inline-SVG placeholder as Home.jsx/RestaurantProfile.jsx/
// FoodDetails.jsx's own FALLBACK_IMAGE constants (Task 3.3/3.7/3.9) —
// not shared via import for the same "cheaper to duplicate one small
// constant than build a shared-constants module for it" call those files
// already made among themselves.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

// Identical to Home.jsx's/RestaurantProfile.jsx's/FoodDetails.jsx's own
// `formatPrice` — same "250 ETB" / "199.50 ETB" convention.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

/**
 * OrderBuilder — the Order Builder screen, Task 3.10.
 * docs/NATRA_MASTER_PROMPT.md's "Order builder" section: "After Buy Now:
 * Selected food(s), Quantity, Prices, Subtotal/total, Add another item."
 * This task's own scope (per docs/TASKS.md) is everything except "Add
 * another item" itself — that's Task 3.11 ("same-restaurant constraint
 * enforced"), which needs its own real design work (how picking a food
 * from the restaurant's menu, Task 3.8, gets back to *this* screen
 * instead of navigating to Food Details as it does today). This screen
 * still renders an "Add another item" button, since it's part of this
 * screen's own layout per the master prompt — it navigates to the
 * current restaurant's profile (Task 3.7, a real, already-built
 * destination), but tapping a food there still goes to Food Details
 * (Task 3.9) rather than back into this cart; that return trip is
 * exactly what 3.11 needs to build, flagged here rather than guessed at.
 *
 * **Cart state**: `useOrderCart` (new, this task) backs the cart with
 * sessionStorage rather than plain component state — seemingly
 * unnecessary for this task alone (nothing yet navigates away from this
 * screen and back), but Task 3.11 will need exactly that (menu → back to
 * builder), so the storage-backed shape is designed now rather than
 * having 3.11 redesign this screen's own state to add it later. See that
 * hook's own header comment for the full reasoning.
 *
 * **Arriving here**: Food Details' (3.9) Buy Now navigates here with
 * `{ foodId, restaurantId, quantity }` in router `state` — merged into
 * the persisted cart exactly once per arrival (a ref keyed on that
 * triple, not just "on mount", since `location.state` is a new object
 * identity on every render but represents one single "just arrived"
 * event) and then cleared from history via a `replace` navigation, so a
 * page refresh or browser back/forward doesn't silently re-add the same
 * item a second time.
 *
 * **A directly-visited `/order/builder` with an empty cart** (no router
 * `state`, nothing left in sessionStorage — e.g. a fresh tab, or the
 * cart was already cleared) renders an empty-cart message pointing back
 * at Home rather than a blank or broken screen — flagged as a real case
 * to handle, not an edge case to ignore, since nothing populates this
 * screen's state automatically the way every other Phase 3 screen so far
 * has had a route param to fetch from.
 */
export default function OrderBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, addItem, setItemQuantity, removeItem } = useOrderCart();

  const incoming = location.state;
  const mergedIncomingKeyRef = useRef(null);
  useEffect(() => {
    if (!incoming) return;
    const key = `${incoming.restaurantId}:${incoming.foodId}:${incoming.quantity}`;
    if (mergedIncomingKeyRef.current === key) return;
    mergedIncomingKeyRef.current = key;
    addItem(incoming.restaurantId, incoming.foodId, incoming.quantity);
    navigate('.', { replace: true, state: null });
  }, [incoming, addItem, navigate]);

  // Only the set of food ids drives re-fetching food details (name,
  // image, price never change just because a quantity did) — a plain
  // quantity edit shouldn't re-fetch every line's food data over again.
  const itemsKey = useMemo(() => cart.items.map((item) => item.foodId).join(','), [cart.items]);

  const fetchFoods = useCallback(
    (signal) =>
      Promise.all(
        cart.items.map((item) =>
          api
            .get(`/foods/detail/${item.foodId}`, { signal, auth: false })
            .then((data) => [item.foodId, data.food])
        )
      ).then((pairs) => new Map(pairs)),
    // itemsKey (not cart.items directly) is the real dependency here —
    // see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey]
  );
  const { data: foodsById, loading, error, refetch } = useApiQuery(fetchFoods, [itemsKey]);

  const lineItems = cart.items.map((item) => ({
    ...item,
    food: foodsById?.get(item.foodId) ?? null,
  }));

  const subtotal = lineItems.reduce((sum, item) => {
    const price = Number(item.food?.price);
    return Number.isFinite(price) ? sum + price * item.quantity : sum;
  }, 0);
  // No delivery fee/tax anywhere in docs/DB_SCHEMA.md or the master
  // prompt (NATRA has no platform-managed delivery at all) — total is
  // just the subtotal, kept as its own line/variable rather than
  // reusing `subtotal` directly so a future fee (if one's ever added)
  // has a single place to plug into instead of every render site having
  // to know to add it.
  const total = subtotal;

  // Task 3.11: this is the actual same-restaurant-constraint enforcement
  // point. Navigating with `restaurantId` in the URL already means the
  // menu that loads next can only ever be *this* restaurant's — there's
  // no route that lets "Add another item" open a different restaurant's
  // menu. `state.addingToOrder` is carried along purely so
  // RestaurantProfile/FoodDetails can show "you're adding to your
  // current order" framing and skip the different-restaurant confirm
  // check they'd otherwise run (see FoodDetails.jsx's own comment) —
  // it's not itself what enforces the constraint, the URL is.
  const handleAddAnotherItem = () => {
    if (!cart.restaurantId) return;
    navigate(`/restaurant/${cart.restaurantId}`, {
      state: { addingToOrder: true },
    });
  };

  // Task 3.12: Customer Info reads the cart directly via useOrderCart,
  // so there's nothing left to hand off through router `state` here —
  // unlike Food Details' Buy Now, which hands off to a screen that has
  // no other way to know what was selected.
  const handleContinue = () => {
    navigate('/order/customer-info');
  };

  const isEmpty = cart.items.length === 0;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Your order</h1>

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
            title="Couldn't load your order"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : loading ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <>
            <ul className={styles.itemList}>
              {lineItems.map((item) => (
                <li key={item.foodId} className={styles.item}>
                  <img
                    className={styles.itemImage}
                    src={item.food?.image_url || FALLBACK_IMAGE}
                    alt={item.food?.name || ''}
                  />

                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.food?.name}</p>
                    <p className={styles.itemUnitPrice}>{formatPrice(item.food?.price)} each</p>

                    <div className={styles.itemControls}>
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(quantity) => setItemQuantity(item.foodId, quantity)}
                      />
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.foodId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className={styles.itemLineTotal}>
                    {item.food ? formatPrice(Number(item.food.price) * item.quantity) : null}
                  </p>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.addAnotherButton}
              onClick={handleAddAnotherItem}
            >
              + Add another item
            </button>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={[styles.summaryRow, styles.summaryTotalRow].join(' ')}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button type="button" className={styles.primaryButton} onClick={handleContinue}>
              Continue
            </button>
          </>
        )}
      </div>
    </RoleShell>
  );
}
