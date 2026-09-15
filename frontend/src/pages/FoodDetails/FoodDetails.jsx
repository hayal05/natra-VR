import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import QuantityStepper from '../../components/QuantityStepper';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useOrderCart } from '../../hooks';
import styles from './FoodDetails.module.css';

// Same inline-SVG placeholder as Home.jsx/RestaurantProfile.jsx's own
// FALLBACK_IMAGE constants (Task 3.3/3.7) — a food's `image_url`
// (docs/DB_SCHEMA.md) is nullable until a photo is uploaded. Not shared
// via import: neither of those two files exports it either, same "cheaper
// to duplicate one small inline SVG constant than build a shared-
// constants module for a string used in three places" call RestaurantProfile
// already made when it didn't import Home.jsx's copy.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

// Identical to Home.jsx's/RestaurantProfile.jsx's own `formatPrice` —
// same "250 ETB" / "199.50 ETB" convention, not imported for the same
// reason as FALLBACK_IMAGE above.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

/**
 * FoodDetails — the Food Details screen, Task 3.9.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Food details" section: "When Buy Now
 * is selected, show: Large food image, Food name, Short description,
 * Price, Quantity selector (- / number / +), Buy Now." Reached by
 * tapping a food anywhere one is shown (Home's Popular Foods grid and
 * search results, Task 3.5/3.6; a restaurant's own menu, Task 3.8) — all
 * three of those places had a reserved-but-unwired `cta` slot flagged
 * "Food Details doesn't exist yet" until this task; see this file's own
 * changes to Home.jsx/RestaurantProfile.jsx for the other half of that
 * wiring.
 *
 * Wrapped in `RoleShell role="customer"` (Task 2.17), same as every
 * other customer screen. Fetched via the new public
 * `GET /api/foods/detail/:id` (see
 * `backend/src/routes/customerFoodDetail.routes.js`'s header comment for
 * why this needed its own route rather than reusing `/api/foods/:id`
 * (owner-scoped, Task 1.15d) or `/api/foods/popular/:id` (Task 3.5) — via
 * `useApiQuery` (Task 3.1), which this hook's own doc comment already
 * names Food Details as an intended caller of. A food that doesn't exist,
 * belongs to a non-Live restaurant, or has been hidden 404s — identically
 * to a genuinely nonexistent id, same "can't tell not-found from
 * not-visible-right-now apart" rule `RestaurantProfile` (3.7) already
 * established for a restaurant — and renders one "Food not found"
 * message either way.
 *
 * `quantity` is real local `useState` (default 1, matching
 * `order_items.quantity`'s `>= 1` constraint), driving a real
 * `QuantityStepper` (Task 2.9) — this task's own job is exactly this
 * control, unlike every other screen so far that's only ever shown a
 * food as a passive card.
 *
 * **Buy Now, and why it navigates instead of doing nothing**: unlike the
 * "Order Now"/"Buy Now" `cta`s on `EntityCard` elsewhere (Home.jsx,
 * RestaurantProfile.jsx), which are deliberately inert placeholder
 * `<span>`s reserving a slot for a destination that didn't exist yet,
 * this button *is* that destination's entry point — leaving it inert
 * here would mean the one task whose entire job is "add a working Buy
 * Now" still not having one. Order Builder (Task 3.10, "selected
 * items, quantities, subtotal/total") doesn't exist yet, and nothing in
 * this codebase has a cart/selection state mechanism for it to read from
 * (that's 3.10's own job to design, not something to guess at here) — so
 * rather than either leaving the button inert or inventing 3.10's state
 * management early, Buy Now navigates to a new `/order/builder`
 * placeholder route (added to `App.jsx` alongside this task, the same
 * `Placeholder` pattern already used for `/order/confirm`/`/track`/every
 * owner and admin screen), passing the real selection
 * (`foodId`/`restaurantId`/`quantity`) via router `state` rather than
 * dropping it — so Task 3.10, when it exists, has real data to read
 * `useLocation().state` for instead of also having to guess where a
 * quantity/food selection would come from.
 *
 * **Same-restaurant constraint (Task 3.11)**: `useOrderCart`'s own
 * `addItem` already has a safety net that *replaces* the whole cart
 * outright if this food belongs to a different restaurant than
 * whatever's already in it (see that hook's own doc comment) — correct
 * as a last resort, but silently discarding an in-progress order with
 * no warning isn't "enforcing" the one-restaurant-per-order rule, it's
 * just quietly following it. Buy Now here checks for that same mismatch
 * *before* navigating and asks for confirmation first, so a customer who
 * strays onto a different restaurant's food mid-order (via Search, Home,
 * or browser back/forward — not via "Add another item" itself, which can
 * only ever reach this restaurant's own foods, see RestaurantProfile.jsx's
 * own Task 3.11 comment) finds out what's about to happen instead of
 * just losing their order silently. `addingToOrder` (forwarded from
 * RestaurantProfile when this trip started from "Add another item")
 * skips the check entirely — that trip is already guaranteed to be the
 * same restaurant by the URL it came from, so there's nothing to confirm.
 */
export default function FoodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const { cart } = useOrderCart();

  const fetchFood = useCallback(
    (signal) => api.get(`/foods/detail/${id}`, { signal, auth: false }).then((data) => data.food),
    [id]
  );
  const { data: food, loading, error, refetch } = useApiQuery(fetchFood, [id]);

  const notFound = error instanceof ApiError && error.status === 404;

  const handleBuyNow = () => {
    const addingToOrder = Boolean(location.state?.addingToOrder);
    const cartHasOtherRestaurant =
      cart.items.length > 0 && cart.restaurantId !== food.restaurant_id;

    if (!addingToOrder && cartHasOtherRestaurant) {
      const confirmed = window.confirm(
        'You already have items in your order from a different restaurant. Starting this order will clear it. Continue?'
      );
      if (!confirmed) return;
    }

    navigate('/order/builder', {
      state: { foodId: food.id, restaurantId: food.restaurant_id, quantity },
    });
  };

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        {error ? (
          <EmptyState
            title={notFound ? 'Food not found' : "Couldn't load this food"}
            description={
              notFound
                ? "This food isn't available right now."
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
        ) : loading || !food ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <>
            <img
              className={styles.image}
              src={food.image_url || FALLBACK_IMAGE}
              alt={food.name}
            />

            <div className={styles.info}>
              <h1 className={styles.name}>{food.name}</h1>

              {food.restaurant_name && (
                <p className={styles.restaurantName}>{food.restaurant_name}</p>
              )}

              {food.description && <p className={styles.description}>{food.description}</p>}

              <p className={styles.price}>{formatPrice(food.price)}</p>

              <QuantityStepper
                className={styles.quantityStepper}
                value={quantity}
                onChange={setQuantity}
              />

              <button type="button" className={styles.buyNowButton} onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </>
        )}
      </div>
    </RoleShell>
  );
}
