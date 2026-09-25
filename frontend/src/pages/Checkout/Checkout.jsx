import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import { BackArrowIcon, CameraIcon, CardIcon, CartIcon, NoteIcon, PersonIcon, PhoneIcon, PinIcon } from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import ImageUploadField from '../../components/ImageUploadField';
import Modal from '../../components/Modal';
import QuantityStepper from '../../components/QuantityStepper';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useMutation, useOrderCart } from '../../hooks';
import styles from './Checkout.module.css';

// Task 11.3 — field length caps, carried over verbatim from
// `CustomerInfo.jsx`'s own constants (Task 3.12), which mirror
// `docs/DB_SCHEMA.md`'s `orders` table exactly (`customer_name
// VARCHAR2(120)`, `customer_location_text VARCHAR2(255)`, `customer_note
// VARCHAR2(500)`). `customer_phone VARCHAR2(30)` still has no
// client-side length cap, same reasoning as before (see `validateCustomerInfo`
// below).
const NAME_MAX_LENGTH = 120;
const LOCATION_MAX_LENGTH = 255;
const NOTE_MAX_LENGTH = 500;

// Task 11.3f — same three required-field checks `CustomerInfo.jsx`'s own
// `validate` (Task 3.12) used, carried over unchanged: only presence is
// enforced, no format checks. `docs/DB_SCHEMA.md` calls
// `customer_location_text` "free text" (no GPS anywhere in this project),
// and Ethiopian phone numbers are commonly typed in enough different
// shapes (with/without country code, spaces, dashes — the same variety
// Task 1.10's backend `normalizePhone` already tolerates) that rejecting
// a real number here for not matching an invented pattern would be a
// worse failure mode than accepting a typo an owner can call to confirm.
function validateCustomerInfo(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter your name.';
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  if (!values.locationText.trim()) errors.locationText = 'Enter your delivery location.';
  return errors;
}

// Identical to Home.jsx's/RestaurantProfile.jsx's/FoodDetails.jsx's own
// `formatPrice` — same "250 ETB" / "199.50 ETB" convention, not imported
// for the same "cheaper to duplicate one small helper than build a
// shared-constants module" reason those files already give.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Same inline-SVG placeholder as FoodDetails.jsx's own FALLBACK_IMAGE
// (Task 3.9) -- a food's image_url is nullable until a photo is
// uploaded. Not imported, same "cheaper to duplicate one small inline
// SVG constant" call FoodDetails.jsx itself already made over
// Home.jsx's/RestaurantProfile.jsx's own copies.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

/**
 * Checkout — Task 11.0a, the first task of Phase 11 ("Merge the customer
 * checkout flow into one page"). Replaces `OrderBuilder.jsx` at the
 * existing `/order/builder` route as the start of folding the five
 * Phase-3 customer screens (`OrderBuilder`, `CustomerInfo`,
 * `PaymentMethod`, `PaymentScreenshot`, `OrderConfirmation`) into one
 * scrolling page. See `docs/TASKS.md`'s Phase 11 breakdown for the
 * task-by-task plan this shell will be filled in by: 11.1 header, 11.2
 * order items (carrying over `OrderBuilder.jsx`'s real cart-rendering
 * logic, removed from here for now), 11.3 customer details (from
 * `CustomerInfo.jsx`), 11.4 payment method (from `PaymentMethod.jsx`),
 * 11.5 payment screenshot (from `PaymentScreenshot.jsx`), 11.6 place-order
 * action and 11.7 success modal (both from `OrderConfirmation.jsx`).
 *
 * This task's own scope (per 11.0a's own line in `docs/TASKS.md`) is
 * "empty shell only, no sections moved in yet" — so this file
 * deliberately renders nothing but the `RoleShell` frame and an empty
 * content div; every real field/section named above is a later task's
 * job, not this one's.
 *
 * `OrderBuilder.jsx`/`OrderBuilder.module.css` are removed by this task
 * rather than kept alongside this new file — this is the "new
 * `Checkout.jsx` replacing it" option `11.0a`'s own `docs/TASKS.md` line
 * names (the other being "a renamed `OrderBuilder.jsx`"), chosen because
 * Phase 11's own 11.8c deletion list only names `CustomerInfo`/
 * `PaymentMethod`/`PaymentScreenshot`/`OrderConfirmation`, not
 * `OrderBuilder` — this replacement is how `OrderBuilder.jsx` actually
 * goes away, rather than 11.8c needing to delete it a second time. Its
 * real cart-rendering markup isn't lost: it carries into 11.2's own task,
 * not into this shell. Comment-only mentions of `OrderBuilder.jsx` in
 * other files (e.g. shared-`formatPrice` cross-references) are left as
 * historical notes, same convention `App.jsx`'s own removed-`Placeholder`
 * comment already uses — not this narrowly-scoped task's job to chase
 * down.
 *
 * Task 11.1a adds the header's gradient bar shell — same full-bleed
 * `--gradient-header` band `Home.jsx`'s own customer header uses (not
 * `DashboardHeader`'s rounded, margined owner/admin treatment: this is a
 * customer screen, and `docs/reference_ui/phase11_checkout_reference.jpg`
 * shows the same hard-edge, edge-to-edge band Home's reference does), no
 * content inside it yet — 11.1b-d add the back control, title, and
 * cart-summary pill.
 *
 * Task 11.1b adds the back control — a plain icon button (not a `Link`,
 * matching `Modal`'s own close-button precedent for an icon-only
 * control) routing to `/` (Home) via `useNavigate`, using the new
 * `BackArrowIcon` (11.0c-i). Always goes to `/` rather than
 * `navigate(-1)` — this screen is reached from `FoodDetails`' Buy Now
 * hand-off (router `state`, Task 3.9) as well as directly by URL, and
 * the reference image's back arrow reads as "leave checkout", not
 * "undo my last navigation step", the same distinction `RoleShell`'s
 * own nav links make (fixed destinations, not history-relative).
 *
 * Task 11.1c adds the "Checkout" title text, same `.heading` recipe
 * every other screen's own page `<h1>` uses (font-family/size-heading/
 * weight-bold, e.g. `AdminOrders.module.css`'s `.heading`) with
 * `--color-text-on-primary` swapped in for the gradient background
 * instead of `--color-text-primary`. Introduces `.headerInner`
 * (640px-capped, matching `.page` below so the header's content aligns
 * with the page column under it — the reference image's back
 * arrow/title/pill all start flush with the card content beneath them)
 * and `.headerLeft` (groups the back button + title so 11.1d's
 * cart-summary pill can sit opposite them via `.headerInner`'s own
 * `space-between`, once that task adds it).
 *
 * Task 11.1d adds the cart-summary pill — an outlined, non-interactive
 * badge (the reference shows no chevron/tap affordance on it, unlike
 * 11.4's payment-method row, so this doesn't open anything) reading
 * "N items • total ETB". This is the first task in this phase that
 * actually needs `useOrderCart()`, so it's called here, once, at the
 * top of this component — per 11.0b's own verification note, every
 * later section (11.2-11.6) reads `cart` and its setters back out as
 * props from this one call rather than calling the hook again itself.
 *
 * The pill's item count is a direct read of `cart.items.length` (11.1d-
 * iii's own wording), but its total needs each cart line's real price,
 * and `useOrderCart` deliberately only ever stores `{ foodId, quantity
 * }` (see that hook's own doc comment) — a food's price is fetched, not
 * cached client-side, the same "server is the source of truth for
 * price" rule `submitOrder.js`'s own Task 3.15b header comment states
 * for the actual order-submission endpoint. So this task fetches each
 * cart line's food via the same public `GET /api/foods/detail/:id`
 * `FoodDetails.jsx` (3.9) already uses — one `useApiQuery` call
 * (`fetchCartFoods` below) resolving a `Promise.all` over the cart's own
 * food ids, keyed on those ids so it only re-fires when the cart's line
 * items actually change, not on every unrelated render. `foodIdsKey`
 * (a joined string of ids) is what `useApiQuery`'s own `deps` array
 * compares, not the `foodIds` array itself — a fresh array every render
 * would otherwise fail Object.is on every single render and refetch
 * needlessly (`useOrderCart` returns a new `cart.items` array reference
 * each read of storage).
 *
 * This fetch — and the `subtotal` derived from it below — is exactly
 * what 11.2 ("Your order" section) will also need to render each line's
 * own name/price/description, not a piece of logic invented only for
 * the header pill. Rather than have 11.2 duplicate it, this same
 * `cartFoods`/`subtotal` pair is already positioned at this component's
 * top level, ready to be passed down once 11.2 builds the section that
 * reads it — flagged here so that task doesn't refetch what this one
 * already fetches.
 *
 * The pill itself only renders when `cart.items.length > 0` — 11.1e's
 * own job is verifying there's no "0 items" pill shown for a genuinely
 * empty cart, and this is that check built in from the start rather
 * than left for 11.1e to discover as a bug.
 *
 * Task 11.2 ("Your order" section) folds in `OrderBuilder.jsx`'s real
 * cart-rendering content. Two pieces of that former screen's logic are
 * restored here rather than only in the later, narrower sub-tasks
 * `docs/TASKS.md` lists:
 *
 * 1. **The Buy Now hand-off itself.** `App.jsx`'s own route comment for
 *    `/order/builder` (Task 11.0a) says plainly that "the incoming
 *    foodId/restaurantId/quantity router `state`... real logic is
 *    carried over from the former OrderBuilder.jsx into Task 11.2's own
 *    job" — so this task adds the one-time, mount-only effect that reads
 *    `location.state` (set by `FoodDetails.jsx`'s `handleBuyNow`, Task
 *    3.9) and calls `addItem`. An empty `[]` deps array is deliberate:
 *    this is "just arrived from Buy Now," not something that should
 *    re-fire on a later re-render (e.g. a quantity-stepper click) just
 *    because `location.state` is still sitting there. Visiting
 *    `/order/builder` directly (no `location.state`) or coming back to
 *    an in-progress order (e.g. from "Add another item", 11.2e) is a
 *    no-op here — the existing cart already reflects what should be
 *    shown, same as `OrderBuilder.jsx` never re-added anything on a
 *    plain revisit either.
 *
 * 2. **`setItemQuantity`/`removeItem`**, the two other `useOrderCart`
 *    mutators this section's own quantity stepper (11.2b-v) and Remove
 *    control (11.2b-vi) need — added to the single `useOrderCart()` call
 *    11.1d already made, per that task's own "every later section reads
 *    `cart` and its setters back out as props from this one call"
 *    reasoning, rather than calling the hook a second time here.
 *
 * The section itself reuses 11.1d's own `cartFoods` fetch (`foodsById`,
 * factored out of that task's inline `subtotal` `useMemo` so this
 * section can look up each row's real name/description/price/image from
 * the same response, not a second fetch) — exactly what that task's own
 * doc comment already flagged as positioned for this reuse.
 *
 * **11.2c's own verify step**: `getPublicFoodById`
 * (`backend/src/services/popularFoods.js`) does select a real
 * `description` column onto the food it returns (same query
 * `FoodDetails.jsx`, Task 3.9, already reads `food.description` from) —
 * so the reference image's one-line description under each item's name
 * is real data, not invented, and is rendered here.
 *
 * **11.2d's own scope**: no delivery-fee row — the project owner's
 * decision recorded at the top of Phase 11 in `docs/TASKS.md` drops it
 * entirely, so the summary block below is Subtotal + Total only, both
 * derived from the same `subtotal` this component already computes for
 * 11.1d's pill (no second/duplicate total calculation).
 *
 * **11.2e's "Add another item"**: navigates to
 * `/restaurant/${cart.restaurantId}` with `state: { addingToOrder: true
 * }` — the exact same destination/state shape `RestaurantProfile.jsx`'s
 * own doc comment already documents as coming from "Order Builder's own
 * 'Add another item' button," just now fired from this merged page
 * instead. No new handler was invented; this is that same one, carried
 * over.
 *
 * An empty-cart `EmptyState` is also added here (not itself a lettered
 * 11.2 sub-task, but necessary now that this section actually renders
 * something) — reached by visiting `/order/builder` directly with no
 * `location.state` and no existing cart. This is also what finally lets
 * 11.1e's own long-deferred verification be checked for real: with a
 * genuinely empty cart, this branch renders instead of any item rows,
 * and 11.1d's pill (guarded on `itemCount > 0`) still shows nothing next
 * to it, so there is no "0 items" pill sitting above an empty-state
 * message.
 *
 * Task 11.3 ("Your details" section) folds in `CustomerInfo.jsx`'s own
 * four real fields (name/phone/delivery location/note) and their
 * existing required-field validation (`validateCustomerInfo`, above —
 * the exact same three checks `CustomerInfo.jsx`'s own `validate`, Task
 * 3.12, used) into this page, shown in-section rather than gating a
 * whole separate screen. `touched`/blur behavior is unchanged: a
 * required-field error only appears after that field's own blur, or
 * after a submit attempt — which is 11.6's job (the combined "Place
 * order" gate), not this task's, so nothing here marks every field
 * touched yet.
 *
 * Local `useState` (`customerInfoValues`/`customerInfoTouched`), seeded
 * from `cart.customerInfo` if the customer already filled this in during
 * an earlier visit — the same "form owns its own draft" pattern
 * `CustomerInfo.jsx` used, just not committed to the cart on its own
 * anymore (there's no more per-section "Continue" step to commit on: the
 * whole merged page now shares one final commit point, Task 11.6's
 * "Place order" action, which will read these values back out directly
 * rather than through `cart.customerInfo`). Kept as this component's own
 * state rather than pulled into `useOrderCart` itself, matching how
 * 11.1d's own `cart`/`addItem`/etc. destructure already separates "cart
 * data that needs to survive a round trip to a restaurant's menu and
 * back" (Task 11.2e's own "Add another item") from "in-progress form
 * state," which `customerInfo` itself never was even before this merge —
 * `setCustomerInfo` (Task 3.12) was always a whole-object commit-on-submit
 * call, not a live sync.
 *
 * Rendered only when the cart has items (`itemCount > 0`), same as the
 * order-items list above it — there's nothing to take delivery details
 * for against an empty order, and showing this section's own form next
 * to 11.2's empty-cart message would be confusing rather than helpful.
 *
 * Each field's `icon` prop (Task 11.3b-e) is `FormField`'s own new,
 * purely-additive prop (see that component's own doc comment) — the
 * small glyph the reference shows directly left of each field's label
 * text, not a new layout FormField didn't already support.
 *
 * Task 11.4 ("Payment method" section) folds in `PaymentMethod.jsx`'s
 * (Task 3.13) real data — the restaurant's own active payment methods,
 * fetched via the same public `GET /api/restaurants/:id/payment-methods`
 * that screen already used — but changes the *interaction* shape per the
 * project owner's decision recorded at the top of Phase 11 in
 * `docs/TASKS.md`: rather than a full-page list the customer taps once
 * to both select and navigate away from, this is a summary row (the
 * previously-selected method, or the restaurant's first active method if
 * none is selected yet — 11.4b-i) that opens the shared `Modal`
 * component (Task 2.15) on tap, with the full method list inside it;
 * picking one there both selects it and closes the modal, leaving the
 * customer on this same scrolling page.
 *
 * `paymentMethods`/`paymentMethodsLoading`/`paymentMethodsError`/
 * `refetchPaymentMethods` (below) is one `useApiQuery` call, fetched once
 * at this component's top level — not inside the modal — so 11.4c's own
 * "reusing `PaymentMethod.jsx`'s existing list logic wholesale, no new
 * fetch/loading/error handling written" instruction means exactly that:
 * the modal's body renders these same states, it doesn't run its own
 * fetch. This also lets the *closed* summary row show real selected-method
 * data immediately (no popping the modal open just to trigger a fetch).
 * `cart.restaurantId` is only ever non-null once the cart has items,
 * matching this whole section's own `itemCount > 0` guard, but the
 * fetcher itself still degrades safely (empty array) if it's ever called
 * without one, same defensive shape `fetchCartFoods` above already uses
 * for an empty `foodIds`.
 *
 * `selectedPaymentMethod` (11.4b-i) is a `useMemo` over
 * `paymentMethods`/`cart.paymentMethodId`: an explicit `find` by id when
 * one's been picked, falling back to `paymentMethods[0]` (the first
 * *active* method — this endpoint already filters to `is_active`, same
 * as `PaymentMethod.jsx` itself relied on) when nothing's been picked
 * yet. `null` while `paymentMethods` hasn't loaded, or if the restaurant
 * genuinely has zero active methods configured — both real, distinct
 * states the summary row's own render branches on, not guessed at with a
 * fake placeholder method.
 *
 * 11.4d's own verify note — `cart.paymentMethodId` resetting to `null` on
 * a different-restaurant cart swap (`useOrderCart`'s own `addItem`,
 * carried over unchanged from Task 3.11) — degrades correctly here for
 * the same reason it did in the old `PaymentMethod.jsx`: `null` simply
 * falls through to the same `paymentMethods[0]` fallback `handleSelect`
 * elsewhere in this file already relies on, not a separate code path
 * that needed re-deriving.
 *
 * No radio-dot or payment-type icon is rendered inside the summary row
 * or the modal's own method list, despite the reference image showing
 * both — neither is among `11.0c`'s 8 built icons (back-arrow, cart,
 * person, phone, pin, note, card, camera), and this follows the same
 * "stay text-only, no code change" precedent Task 10.5c already
 * established for a reference glyph with no real counterpart in this
 * codebase, rather than inventing a 9th/10th icon beyond what the
 * project owner actually asked for at the top of this phase. Selection
 * inside the modal is still visible without them: a new
 * `.modalMethodCardSelected` class (this file's own, not an import of
 * `PaymentMethod.module.css` — that file is one of Phase 11's own
 * eventual deletions, Task 11.8c, so nothing new here should come to
 * depend on it) reapplies the same border/background highlight
 * `.methodCardSelected` (Task 3.13) originally established, ported
 * rather than shared.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cart,
    addItem,
    setItemQuantity,
    removeItem,
    setPaymentMethod,
    setPaymentScreenshotUrl,
    clearCart,
  } = useOrderCart();

  // Task 11.10e — a `useRef` guard so this hand-off is idempotent per
  // real mount, not reliant on `React.StrictMode`'s dev-only behavior
  // staying the way it is. Root cause (`docs/PROJECT_STATUS.md`'s 11.10
  // entry): `main.jsx` wraps the app in `<React.StrictMode>`, which
  // double-invokes a mount effect with no cleanup — as this one has none
  // — in development; `addItem` adds onto an existing line's quantity
  // rather than replacing it (see that hook's own doc comment), so a
  // second same-mount invocation used to silently double the quantity
  // on every Buy Now arrival in dev. Production builds don't double-
  // invoke (React's own documented StrictMode behavior), so real
  // customers were never affected — this closes the gap without relying
  // on that staying true. A ref, not a second `location.state` check:
  // `location.state` itself doesn't change between the two StrictMode
  // invocations (it's the same mount), so it can't tell them apart on
  // its own the way a fresh ref, allocated once for this component
  // instance and persisting across both invocations, can.
  const buyNowHandledRef = useRef(false);

  // Task 11.2's own Buy Now hand-off restoration — see this file's own
  // doc comment above for the full reasoning on why this is here rather
  // than an earlier task, and why the deps array is intentionally empty.
  useEffect(() => {
    if (buyNowHandledRef.current) return;
    buyNowHandledRef.current = true;
    const incoming = location.state;
    if (incoming && incoming.foodId != null && incoming.restaurantId != null) {
      const incomingQuantity = incoming.quantity || 1;
      console.trace('[NATRA TRACE] Checkout addItem called', {
        foodId: incoming.foodId,
        restaurantId: incoming.restaurantId,
        quantity: incomingQuantity,
        locationState: incoming,
      });
      addItem(incoming.restaurantId, incoming.foodId, incomingQuantity);
      navigate('/order/builder', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const foodIds = useMemo(() => cart.items.map((item) => item.foodId), [cart.items]);
  const foodIdsKey = foodIds.join(',');

  const fetchCartFoods = useCallback(
    (signal) =>
      foodIds.length === 0
        ? Promise.resolve({ foodIdsKey, foods: [] })
        : Promise.all(
            foodIds.map((foodId) =>
              api
                .get(`/foods/detail/${foodId}`, { signal, auth: false })
                .then((data) => data.food)
                // Task 11.10b — prerequisite fix found while building this
                // task: `getPublicFoodById` 404s identically for a
                // nonexistent id, a hidden food, and a food on a
                // non-Live restaurant (backend/src/services/popularFoods.js's
                // own doc comment), and this per-line `api.get` used to let
                // that 404 propagate straight up through `Promise.all`,
                // failing the *entire* batch the instant any one cart line
                // went stale — not a graceful per-item miss the way
                // `foodsById.get(item.foodId)` returning `undefined` further
                // down this file always assumed. A 404 here now resolves to
                // `null` (matching `getPublicFoodById`'s own "not found"
                // shape) instead of rejecting, so the other, still-valid
                // lines in the same cart keep loading normally; any other
                // status (network failure, a real 500) still rejects and
                // surfaces via the existing `cartFoodsError` state below —
                // only "this specific food is gone" is treated as
                // expected, not "the fetch itself failed".
                .catch((err) => {
                  if (err instanceof ApiError && err.status === 404) return null;
                  throw err;
                })
            )
          ).then((foods) => ({ foodIdsKey, foods })),
    // foodIds itself is intentionally left out — foodIdsKey (below) is
    // the real dependency, same "join to a stable primitive" reasoning
    // this file's own header comment gives for why useApiQuery is keyed
    // on the string, not the array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foodIdsKey]
  );
  const {
    data: cartFoodsResult,
    loading: cartFoodsLoading,
    error: cartFoodsError,
    refetch: refetchCartFoods,
  } = useApiQuery(fetchCartFoods, [foodIdsKey]);

  // Factored out of 11.1d's own inline `subtotal` `useMemo` so Task
  // 11.2's item rows below can look up each line's real food (name/
  // description/price/image) from the same response, rather than 11.2
  // re-deriving its own copy of this map. `.filter(Boolean)` — Task
  // 11.10b — drops the `null` entries `fetchCartFoods` above now
  // produces for a food that 404'd, so this map only ever holds real,
  // currently-resolvable foods; a cart line whose food isn't in here is
  // exactly the "ghost item" case 11.10's whole fix plan is about.
  //
  // IMPORTANT: the result carries the foodIdsKey it was fetched for.
  // This prevents a stale empty result from the previous cart state from
  // being interpreted as "all current foods are missing" during the
  // render/effect gap before useApiQuery flips loading back to true.
  const cartFoods =
    cartFoodsResult?.foodIdsKey === foodIdsKey
      ? cartFoodsResult.foods
      : null;

  const foodsById = useMemo(() => {
    if (cartFoodsLoading || cartFoods === null) return null;
    return new Map(cartFoods.filter(Boolean).map((food) => [food.id, food]));
  }, [cartFoods, cartFoodsLoading]);

  // Task 11.10b — a small last-known-name cache, keyed by food id,
  // updated every time `foodsById` resolves with a real food. Lets the
  // "removed from your order" notice below name the food when it can
  // (a food that was visible earlier in this same visit and went
  // hidden/deleted between then and a later refetch — e.g. a manual
  // Retry press) and fall back to a generic phrase only when it
  // genuinely never had a name to show — the `getPublicFoodById` 404
  // this project's own endpoint returns for a hidden/deleted food never
  // includes one, so there is no server response to read a name from in
  // the common "gone from the very first fetch" case.
  const foodNameCacheRef = useRef(new Map());
  useEffect(() => {
    if (!foodsById) return;
    for (const food of foodsById.values()) {
      foodNameCacheRef.current.set(food.id, food.name);
    }
  }, [foodsById]);

  // Task 11.10a — a cart line whose food was hidden/deleted after being
  // added (see `docs/PROJECT_STATUS.md`'s 11.10 entry for the full
  // trace) never resolves in `foodsById`. Filtered here once so
  // subtotal/the header pill, the `/orders` payload (`placeOrder`
  // below), and `canPlaceOrder` all agree on the same resolved set —
  // none of the three should ever see a `food_id` `foodsById` doesn't
  // have. `null` (not `[]`) while `foodsById` itself hasn't loaded yet,
  // so the existing "still loading" `null` checks downstream keep
  // working unchanged. This only filters what those three read — it
  // doesn't touch `cart.items` itself or show the customer anything;
  // the actual per-item notice + `removeItem` call is 11.10b's job, and
  // 11.10c's is recomputing these totals' own loading-vs-partial
  // semantics now that a miss can no longer happen post-filter.
  const resolvedCartItems = useMemo(() => {
    if (!foodsById) return null;
    return cart.items.filter((item) => foodsById.has(item.foodId));
  }, [foodsById, cart.items]);

  // `null` (not `0`) while `cartFoods`/`resolvedCartItems` hasn't loaded
  // yet — so the pill's own render can tell "still loading" apart from
  // "a real 0 ETB total" and simply omit the "• total" half rather than
  // show a wrong number, same "don't guess" reasoning `submitOrder.js`
  // already applies server-side to price. No per-item `null`-abort
  // needed anymore (that was the old, pre-11.10a shape): every line in
  // `resolvedCartItems` is guaranteed to resolve in `foodsById` by
  // construction above.
  const subtotal = useMemo(() => {
    if (!resolvedCartItems) return null;
    let total = 0;
    for (const item of resolvedCartItems) {
      const food = foodsById.get(item.foodId);
      total += Number(food.price) * item.quantity;
    }
    return total;
  }, [resolvedCartItems, foodsById]);

  const itemCount = cart.items.length;
  // Task 11.10a — the header pill's own count, filtered the same way
  // `subtotal` above is, so a ghost item is never counted alongside a
  // real "• total". Left as its own constant rather than reassigning
  // `itemCount`: every other `itemCount > 0` guard on this page is
  // about whether the cart has *anything* in it (render the section at
  // all), not about the resolved count, and 11.10a's own scope is only
  // the three spots named in its `docs/TASKS.md` line — this is the
  // "header pill" one of the three. `null` (not `0`) mirrors
  // `resolvedCartItems`'s own loading state so the pill's render can
  // still tell "loading" apart from "resolved to zero".
  const resolvedItemCount = resolvedCartItems ? resolvedCartItems.length : null;
  const formattedSubtotal = subtotal === null ? null : formatPrice(subtotal);

  // Task 11.10b — the visible, dismissible per-item notice, plus the
  // actual `removeItem` call the old code never made (see this file's
  // own 11.10a comment above, and `docs/PROJECT_STATUS.md`'s 11.10
  // entry for the full root-cause trace). Runs whenever `foodsById`
  // settles: any `cart.items` line that doesn't resolve there gets one
  // notice appended (named from `foodNameCacheRef` above if this food
  // was seen earlier in this same visit, else the generic fallback) and
  // is dropped from the cart via the existing `removeItem` — the same
  // setter 11.2's own per-item "Remove" button already calls, so this
  // is a real removal, not just a display-layer filter the way 11.10a's
  // `resolvedCartItems` is. Removing it also updates `cart.items`, which
  // re-runs this effect, but the now-gone item no longer fails the
  // `foodsById.has` check the second time — self-terminating, not a
  // loop. Intentionally does NOT depend on `removeItem` itself (a fresh
  // function reference every render from `useOrderCart`'s own non-
  // `useCallback` setters would otherwise refire this on every render);
  // `foodsById`/`cart.items` are the two real triggers.
  const [removedItemNotices, setRemovedItemNotices] = useState([]);

  useEffect(() => {
    if (!foodsById) return;
    const ghostItems = cart.items.filter((item) => !foodsById.has(item.foodId));
    if (ghostItems.length === 0) return;
    for (const item of ghostItems) {
      const knownName = foodNameCacheRef.current.get(item.foodId);
      setRemovedItemNotices((prev) => [
        ...prev,
        {
          id: `${item.foodId}-${Date.now()}`,
          message: `${knownName || 'A food'} is no longer available — removed from your order.`,
        },
      ]);
      removeItem(item.foodId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodsById, cart.items]);

  const dismissRemovedItemNotice = (noticeId) => {
    setRemovedItemNotices((prev) => prev.filter((notice) => notice.id !== noticeId));
  };

  const goAddAnotherItem = () => {
    navigate(`/restaurant/${cart.restaurantId}`, { state: { addingToOrder: true } });
  };

  // Task 11.3 — "Your details" section's own draft state. See this
  // file's own doc comment above for why this stays local rather than
  // committing to the cart per-field the way `CustomerInfo.jsx` used to
  // commit on its own separate "Continue" submit.
  const [customerInfoValues, setCustomerInfoValues] = useState(() => ({
    name: cart.customerInfo?.name ?? '',
    phone: cart.customerInfo?.phone ?? '',
    locationText: cart.customerInfo?.locationText ?? '',
    note: cart.customerInfo?.note ?? '',
  }));
  const [customerInfoTouched, setCustomerInfoTouched] = useState({});
  const customerInfoErrors = validateCustomerInfo(customerInfoValues);

  const handleCustomerInfoChange = (field) => (event) => {
    setCustomerInfoValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCustomerInfoBlur = (field) => () => {
    setCustomerInfoTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Task 11.4 — "Payment method" section. One `useApiQuery` call at this
  // component's top level (not inside the modal — see this file's own
  // doc comment above for why), reusing the exact endpoint
  // `PaymentMethod.jsx` (Task 3.13) already used.
  const fetchPaymentMethods = useCallback(
    (signal) =>
      cart.restaurantId == null
        ? Promise.resolve([])
        : api
            .get(`/restaurants/${cart.restaurantId}/payment-methods`, { signal, auth: false })
            .then((data) => data.payment_methods),
    [cart.restaurantId]
  );
  const {
    data: paymentMethods,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods,
  } = useApiQuery(fetchPaymentMethods, [cart.restaurantId]);

  // 11.4b-i's own fallback logic: the previously-selected method if one
  // exists, else the restaurant's first fetched active method — `null`
  // while still loading, or for a restaurant with zero active methods,
  // so the summary row's render can tell those two real states apart
  // rather than guessing at a method to show.
  const selectedPaymentMethod = useMemo(() => {
    if (!paymentMethods || paymentMethods.length === 0) return null;
    if (cart.paymentMethodId != null) {
      const match = paymentMethods.find((method) => method.id === cart.paymentMethodId);
      if (match) return match;
    }
    return paymentMethods[0];
  }, [paymentMethods, cart.paymentMethodId]);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleSelectPaymentMethod = (paymentMethodId) => {
    setPaymentMethod(paymentMethodId);
    setIsPaymentModalOpen(false);
  };

  // Task 11.5c-i — "Upload payment screenshot" section's own draft
  // state, mirroring the old `PaymentScreenshot.jsx`'s
  // `pendingFile`/`fieldError` (Task 3.14) one-for-one, just renamed to
  // this file's own `pendingScreenshotFile`/`screenshotFieldError` to
  // stay unambiguous next to 11.3's own `customerInfo*` state above.
  // Added to this same top-level `useState` cluster rather than a
  // second call site, same "one hook call per concern, read back out
  // where needed" shape 11.1d's own `useOrderCart()` call already set
  // for this file. No upload fires from here — `pendingScreenshotFile`
  // just sits in local state until 11.6b's "Place order" press reads it
  // back out and calls `POST /uploads/payment-screenshot`, the same
  // "hold the File, upload on submit" split the old screen's own
  // `handleContinue` used.
  const [pendingScreenshotFile, setPendingScreenshotFile] = useState(null);
  const [screenshotFieldError, setScreenshotFieldError] = useState(null);

  const handleScreenshotChange = (file) => {
    setScreenshotFieldError(null);
    setPendingScreenshotFile(file);
  };

  const handleScreenshotError = (message) => {
    setScreenshotFieldError(message);
  };

  // Task 11.6a — combined enablement gate. Same three checks the old,
  // separate screens each made on their own "Continue" button
  // (`validateCustomerInfo`'s three required fields, Task 3.12;
  // `selectedPaymentMethod` being non-null, Task 3.13;
  // `pendingFile`/`cart.paymentScreenshotUrl`, Task 3.14's own
  // `hasSomethingToContinueWith`), now evaluated together against this
  // one merged page's single button instead of gating three separate
  // screens' own separate "Continue" presses. `itemCount > 0` is
  // implied by the other three in practice (every field/section above
  // is itself hidden without it) but included explicitly so this gate
  // reads correctly even if called before any of them have rendered.
  const hasValidCustomerInfo = Object.keys(customerInfoErrors).length === 0;
  const hasPaymentMethod = Boolean(selectedPaymentMethod);
  const hasScreenshot = Boolean(pendingScreenshotFile) || Boolean(cart.paymentScreenshotUrl);
  // Task 11.10a — gated on `resolvedCartItems` (ghost items excluded),
  // not the raw `itemCount`, so a cart that's non-empty only because it
  // holds a hidden/deleted food can't still enable "Place order": that
  // used to sail through this gate (none of the old three checks
  // touched `foodsById` at all) and only get caught server-side. `?? 0`
  // — not `resolvedCartItems?.length > 0` — so this reads `false` (not
  // `undefined`) while `resolvedCartItems` is still `null`/loading,
  // matching every other boolean this gate ANDs together.
  const canPlaceOrder =
    (resolvedCartItems?.length ?? 0) > 0 && hasValidCustomerInfo && hasPaymentMethod && hasScreenshot;

  // Task 11.6b — the combined submit action: upload the pending
  // screenshot (if a new one was picked this visit) via the existing
  // `POST /uploads/payment-screenshot`, then call the existing
  // `POST /orders` with the exact payload shape `OrderConfirmation.jsx`
  // (Task 3.15/3.16) already built — no payload change, just the two
  // calls now made back-to-back from one button press instead of two
  // separate screens' own separate actions.
  //
  // If `pendingScreenshotFile` is unset (the customer already has a
  // `cart.paymentScreenshotUrl` from an earlier visit and didn't pick a
  // new one — 11.5c-iii's own "still shows selected" case), the upload
  // step is skipped entirely and that existing URL is reused as-is,
  // same "no redundant re-upload" behavior the old `PaymentScreenshot.jsx`'s
  // own `handleContinue` already had for this case.
  //
  // A freshly-uploaded URL is committed to the cart via
  // `setPaymentScreenshotUrl` (Task 3.14's own hook setter) *before* the
  // `POST /orders` call, not only after the whole thing succeeds — so
  // if the order submission itself then fails (a validation error, a
  // dropped connection), a retry press doesn't re-upload and duplicate
  // the same image in Object Storage; it just reuses the URL already
  // committed and goes straight to retrying `POST /orders`. This is a
  // real, if small, behavior improvement over the old two-screen flow
  // (which had no way to fail *between* those two steps at all, since
  // they were two separate button presses on two separate screens), not
  // a change to either endpoint's own contract.
  //
  // `selectedPaymentMethod.id` (11.4b-i's own fallback-resolved value)
  // is sent rather than the raw `cart.paymentMethodId`, which is still
  // `null` whenever the customer never explicitly opened the payment
  // method modal and is instead relying on that fallback — the summary
  // row already shows `selectedPaymentMethod` as the effective choice,
  // so the submitted order has to agree with what's on screen.
  //
  // Success/failure UI (a success modal, `clearCart()`, "Track
  // order"/"Back to home") is deliberately NOT built here — per
  // `docs/TASKS.md`'s own 11.7b line, wiring the modal open state to a
  // successful `mutate()` result (this task's own `placeOrderMutation`
  // below) and firing `clearCart()` are both 11.7's job, not 11.6's;
  // this task's own scope stops at the mutation existing and being
  // callable with a real loading/error state, per 11.6c/11.6d below.
  const placeOrder = useCallback(async () => {
    let screenshotUrl = cart.paymentScreenshotUrl;
    if (pendingScreenshotFile) {
      const formData = new FormData();
      formData.append('image', pendingScreenshotFile);
      const { url } = await api.post('/uploads/payment-screenshot', formData, { auth: false });
      screenshotUrl = url;
      setPaymentScreenshotUrl(url);
    }

    const payload = {
      customer_name: customerInfoValues.name,
      customer_phone: customerInfoValues.phone,
      customer_location_text: customerInfoValues.locationText,
      customer_note: customerInfoValues.note || null,
      payment_method_id: selectedPaymentMethod?.id,
      payment_screenshot_url: screenshotUrl,
      // Task 11.10a — `resolvedCartItems` (ghost items excluded), not
      // raw `cart.items`. `canPlaceOrder` above already guarantees this
      // is a non-empty array by the time this can fire (the button is
      // disabled otherwise), but `?? []` keeps this defensive rather
      // than crashing if it's ever called before that gate applies.
      items: (resolvedCartItems ?? []).map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    };
    const { order } = await api.post('/orders', payload, { auth: false });
    return order;
  }, [
    cart.paymentScreenshotUrl,
    resolvedCartItems,
    pendingScreenshotFile,
    setPaymentScreenshotUrl,
    customerInfoValues,
    selectedPaymentMethod,
  ]);

  const {
    mutate: placeOrderMutate,
    data: placedOrder,
    error: placeOrderError,
    loading: isPlacingOrder,
    reset: resetPlaceOrder,
  } = useMutation(placeOrder);

  // Task 11.6d — same combined action re-fires on retry (this is the
  // one and only place `placeOrderMutate` is ever called from, so a
  // second press after a failure runs the exact same logic above rather
  // than a separate retry path) — no new error copy invented, `error`
  // is surfaced via `placeOrderError.message` directly, same as the old
  // `OrderConfirmation.jsx`'s own `error.message || 'Something went
  // wrong. Please try again.'` fallback.
  //
  // Task 11.7b — on a successful `mutate()`, `clearCart()` fires
  // immediately, same as `OrderConfirmation.jsx`'s own mount effect
  // already did (see that file's own doc comment: "there's nothing left
  // to protect against a different-restaurant swap or a stale
  // screenshot once the real order row exists in the DB"). The success
  // modal itself needs no separate `isOpen` state of its own — it's
  // simply `Boolean(placedOrder)` (this same hook's own `data`), so a
  // fresh `mutate()` call (which resets `data` back to `null` first, per
  // `useMutation`'s own implementation) naturally closes out whatever a
  // previous successful placement left open before a new attempt
  // begins. `clearCart()` running before the modal's own content renders
  // is fine: the modal reads `placedOrder`, never `cart`, so an emptied
  // cart underneath it doesn't affect what the modal shows.
  const handlePlaceOrder = () => {
    placeOrderMutate()
      .then(() => clearCart())
      .catch(() => {
        // Surfaced via `placeOrderError` state below; nothing further to
        // do here — same "swallow at the call site, read reactively"
        // shape the old `OrderConfirmation.jsx`'s own mount effect used.
      });
  };

  // Task 11.7 — dismissing the success modal any other way than "Track
  // order"/"Back to home" (the backdrop, Escape, `Modal`'s own close
  // button) is handled by this one `handleCloseSuccessModal`, passed
  // straight through as `Modal`'s `onClose`. Per the project owner's
  // own decision recorded at the top of Phase 11 in `docs/TASKS.md`
  // ("dismissing the modal any other way just leaves the customer on a
  // checkout page whose cart `clearCart()` has already emptied, which
  // is fine since there's nothing left to resume"), this doesn't
  // navigate anywhere — it calls `resetPlaceOrder()` (`useMutation`'s
  // own `reset`), which clears `placedOrder` back to `null` and closes
  // the modal, leaving the customer looking at this same page's own
  // already-built empty-cart `EmptyState` (Task 11.2) underneath, since
  // `cart.items` is already empty by this point.
  const handleCloseSuccessModal = () => {
    resetPlaceOrder();
  };

  return (
    <RoleShell role="customer">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate('/')}
              aria-label="Back to home"
            >
              <BackArrowIcon className={styles.backIcon} />
            </button>
            <h1 className={styles.title}>Checkout</h1>
          </div>

          {itemCount > 0 && (
            <div className={styles.cartPill}>
              <CartIcon className={styles.cartPillIcon} />
              <span className={styles.cartPillText}>
                {/* Task 11.10a — resolved count/total (ghost items
                    excluded), falling back to the raw `itemCount` only
                    while `resolvedCartItems` hasn't loaded yet, so the
                    pill doesn't flash "0 items" before the fetch
                    resolves. */}
                {resolvedItemCount ?? itemCount} {(resolvedItemCount ?? itemCount) === 1 ? 'item' : 'items'}
                {formattedSubtotal !== null ? ` • ${formattedSubtotal}` : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.page}>
        <section className={styles.orderSection}>
          <h2 className={styles.sectionHeading}>Your order</h2>

          {/* Task 11.10b — rendered independent of the loading/error/
              empty/list branches just below: a removal can happen (and
              still be worth explaining) whichever of those states the
              rest of this section is currently in, and `removedItemNotices`
              is its own local state, not derived from any of them. */}
          {removedItemNotices.length > 0 && (
            <div className={styles.removedItemNotices}>
              {removedItemNotices.map((notice) => (
                <div key={notice.id} className={styles.removedItemNotice} role="status">
                  <span className={styles.removedItemNoticeText}>{notice.message}</span>
                  <button
                    type="button"
                    className={styles.removedItemNoticeDismiss}
                    onClick={() => dismissRemovedItemNotice(notice.id)}
                    aria-label="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {itemCount === 0 ? (
            <EmptyState
              title="Your order is empty"
              description="Add a food from a restaurant to start an order."
              action={
                <Link to="/" className={styles.emptyStateLink}>
                  Browse restaurants
                </Link>
              }
            />
          ) : cartFoodsError ? (
            <div className={styles.orderStatusRow}>
              <span className={styles.orderStatusText}>Couldn't load your order.</span>
              <button
                type="button"
                className={styles.retryButtonInline}
                onClick={refetchCartFoods}
              >
                Retry
              </button>
            </div>
          ) : cartFoodsLoading || !foodsById ? (
            <p className={styles.orderStatusText}>Loading your order…</p>
          ) : (
            <>
              <div className={styles.itemList}>
                {cart.items.map((item) => {
                  const food = foodsById.get(item.foodId);
                  // By this branch cartFoods has already loaded (the
                  // loading/error states above handle that), so a
                  // missing food here means it was removed/hidden since
                  // being added to the cart — skip the row rather than
                  // render a broken one. Task 11.9c.
                  if (!food) return null;
                  const linePrice = formatPrice(food.price);
                  return (
                    <div key={item.foodId} className={styles.itemRow}>
                      <img
                        src={food.image_url || FALLBACK_IMAGE}
                        alt=""
                        className={styles.itemImage}
                      />
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{food.name}</p>
                        {food.description && (
                          <p className={styles.itemDescription}>{food.description}</p>
                        )}
                        {linePrice !== null && (
                          <p className={styles.itemPrice}>{linePrice}</p>
                        )}
                      </div>
                      <div className={styles.itemControls}>
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(next) => setItemQuantity(item.foodId, next)}
                          ariaLabel={`Quantity for ${food.name}`}
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
                  );
                })}
              </div>

              <div className={styles.summaryBlock}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formattedSubtotal ?? '—'}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>{formattedSubtotal ?? '—'}</span>
                </div>
              </div>

              <button type="button" className={styles.addItemButton} onClick={goAddAnotherItem}>
                <span className={styles.addItemPlus} aria-hidden="true">
                  +
                </span>
                Add another item
              </button>
            </>
          )}
        </section>

        {itemCount > 0 && (
          <section className={styles.detailsSection}>
            <h2 className={styles.sectionHeading}>
              <PersonIcon className={styles.sectionHeadingIcon} aria-hidden="true" />
              Your details
            </h2>

            <div className={styles.detailsForm}>
              <FormField
                icon={<PersonIcon />}
                label="Name"
                required
                value={customerInfoValues.name}
                onChange={handleCustomerInfoChange('name')}
                onBlur={handleCustomerInfoBlur('name')}
                maxLength={NAME_MAX_LENGTH}
                placeholder="Your full name"
                error={customerInfoTouched.name ? customerInfoErrors.name : undefined}
              />

              <FormField
                icon={<PhoneIcon />}
                label="Phone"
                type="tel"
                required
                value={customerInfoValues.phone}
                onChange={handleCustomerInfoChange('phone')}
                onBlur={handleCustomerInfoBlur('phone')}
                placeholder="09XXXXXXXX"
                error={customerInfoTouched.phone ? customerInfoErrors.phone : undefined}
              />

              <FormField
                as="textarea"
                icon={<PinIcon />}
                label="Delivery location"
                required
                value={customerInfoValues.locationText}
                onChange={handleCustomerInfoChange('locationText')}
                onBlur={handleCustomerInfoBlur('locationText')}
                maxLength={LOCATION_MAX_LENGTH}
                placeholder="Neighborhood, landmark, house/building details…"
                error={customerInfoTouched.locationText ? customerInfoErrors.locationText : undefined}
              />

              <FormField
                as="textarea"
                icon={<NoteIcon />}
                label="Note"
                value={customerInfoValues.note}
                onChange={handleCustomerInfoChange('note')}
                onBlur={handleCustomerInfoBlur('note')}
                maxLength={NOTE_MAX_LENGTH}
                placeholder="Anything the restaurant should know (optional)"
                helperText="Optional — allergies, gate code, delivery timing, etc."
              />
            </div>
          </section>
        )}

        {itemCount > 0 && (
          <section className={styles.paymentSection}>
            <h2 className={styles.sectionHeading}>
              <CardIcon className={styles.sectionHeadingIcon} aria-hidden="true" />
              Payment method
            </h2>

            {paymentMethodsError ? (
              <div className={styles.paymentStatusRow}>
                <span className={styles.paymentStatusText}>Couldn't load payment methods.</span>
                <button
                  type="button"
                  className={styles.retryButtonInline}
                  onClick={refetchPaymentMethods}
                >
                  Retry
                </button>
              </div>
            ) : paymentMethodsLoading || !paymentMethods ? (
              <p className={styles.paymentStatusText}>Loading payment methods…</p>
            ) : paymentMethods.length === 0 ? (
              <p className={styles.paymentStatusText}>
                This restaurant hasn't set up a way to pay yet. Please try again later.
              </p>
            ) : (
              <button
                type="button"
                className={styles.paymentSummaryRow}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                {/* Task 11.9f finding #3 — project owner decision: add
                    back the reference's selected-radio dot, but not its
                    leading payment-type icon (no CardIcon reuse here —
                    that glyph already appears twice elsewhere on this
                    page, per this file's own doc comment above). Purely
                    decorative (`aria-hidden`): there is only ever one
                    selected method shown in this closed summary row, so
                    the dot communicates "this one's selected," same
                    meaning a11y already gets from the row's own text
                    content — nothing is lost by hiding it from
                    assistive tech. */}
                <span className={styles.paymentSummaryDot} aria-hidden="true" />
                <div className={styles.paymentSummaryInfo}>
                  <span className={styles.paymentSummaryName}>
                    {selectedPaymentMethod.method_name}
                  </span>
                  <span className={styles.paymentSummaryMeta}>
                    {selectedPaymentMethod.account_number}
                  </span>
                  <span className={styles.paymentSummaryMeta}>
                    {selectedPaymentMethod.account_name}
                  </span>
                </div>
                <span className={styles.paymentSummaryChevron} aria-hidden="true">
                  &rsaquo;
                </span>
              </button>
            )}

            <Modal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              title="Payment method"
              size="sm"
            >
              <ul className={styles.modalMethodList}>
                {(paymentMethods ?? []).map((method) => {
                  const isSelected = selectedPaymentMethod?.id === method.id;
                  return (
                    <li key={method.id}>
                      <button
                        type="button"
                        className={
                          isSelected
                            ? `${styles.modalMethodCard} ${styles.modalMethodCardSelected}`
                            : styles.modalMethodCard
                        }
                        onClick={() => handleSelectPaymentMethod(method.id)}
                        aria-pressed={isSelected}
                      >
                        <span className={styles.modalMethodName}>{method.method_name}</span>
                        <span className={styles.modalMethodDetail}>{method.account_number}</span>
                        <span className={styles.modalMethodDetail}>{method.account_name}</span>
                        {method.instructions && (
                          <span className={styles.modalMethodInstructions}>
                            {method.instructions}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Modal>
          </section>
        )}

        {/* Task 11.5c-ii — "Upload payment screenshot" section, folding
            in the old `PaymentScreenshot.jsx` (Task 3.14). Same
            `itemCount > 0` guard every other section on this page
            already uses — there's nothing to attach a screenshot to
            against an empty order, same reasoning `.detailsSection`/
            `.paymentSection` above already give. Rendered as its own
            section (own `.sectionHeading`, same `CameraIcon` the old
            screen never had — this page's icon set, 11.0c, now gives it
            one) per this task's own explicit `docs/TASKS.md` wording,
            even though `docs/reference_ui/phase11_checkout_reference.jpg`
            draws this row immediately under the payment-method card with
            no visible heading of its own between them — real-render
            visual spacing/hierarchy against that reference is 11.9's
            job, not this task's; this task's own scope is wiring the
            row itself, not eyeballing the exact gap above it. */}
        {itemCount > 0 && (
          <section className={styles.screenshotSection}>
            <h2 className={styles.sectionHeading}>
              <CameraIcon className={styles.sectionHeadingIcon} aria-hidden="true" />
              Upload payment screenshot
            </h2>

            {/* Task 11.5c-iii — `value` sourced from
                `cart.paymentScreenshotUrl`, so a screenshot uploaded on
                an earlier visit (or already-`sessionStorage`-backed
                cart from before a refresh) still shows selected —
                `compact`'s own 11.5b thumbnail-swap branch renders it
                exactly like a freshly-picked local file, no separate
                code path. Task 11.5c-iv — `onChange`/`onError` wired to
                this task's own new local state (11.5c-i above); no
                upload call fired here, same as that state's own doc
                comment already says. `required` mirrors the old
                screen's own `ImageUploadField` call — 11.6a's combined
                gate is what actually enforces it now (see that
                constant's own comment further up this file), this prop
                alone doesn't block anything by itself. Task
                11.5d's own `maxDimension={2400}`/`quality={0.95}`
                override carries over unchanged from the old screen's
                call site — see that task's own line in `docs/TASKS.md`;
                same reasoning as the old screen's own doc comment on
                these two props: a legible-text payment screenshot needs
                closer-to-lossless client-side recompression than the
                photographic-image default (1600px/quality 0.8) this
                component ships with everywhere else. */}
            <ImageUploadField
              compact
              icon={<CameraIcon />}
              chooseLabel="Upload payment screenshot"
              changeLabel="Change screenshot"
              helperText="Take a screenshot or choose from gallery"
              required
              value={cart.paymentScreenshotUrl}
              onChange={handleScreenshotChange}
              onError={handleScreenshotError}
              error={screenshotFieldError}
              maxDimension={2400}
              quality={0.95}
            />
          </section>
        )}

        {/* Task 11.6a/c/d — the combined "Place order" action. Same
            `itemCount > 0` guard every other section on this page
            already uses. `canPlaceOrder` (this task's own gate, defined
            with the rest of 11.6's logic further up this file) disables
            the button until all three prerequisite sections validate,
            same three checks the old separate screens each made on
            their own "Continue" press. Task 11.6c's single loading
            label ("Placing your order…") replaces what used to be two
            separate labels across two separate screens
            ("Uploading…"/"Placing your order…", `PaymentScreenshot.jsx`'s
            own and `OrderConfirmation.jsx`'s own respectively) — from
            this button's own perspective there's now only one combined
            action in flight, so there's only one label for it,
            regardless of whether it's currently mid-upload or
            mid-submit underneath. Task 11.6d's error message reuses
            `placeOrderError.message` with the exact same fallback
            string `OrderConfirmation.jsx`'s own error branch used — no
            new error copy invented — and the button itself is what
            retries: a second press re-runs `handlePlaceOrder`
            unconditionally, there's no separate "Try again" control the
            way the old, now-replaced full-page error state had one,
            since this page was never navigated away from a form to
            begin with. */}
        {itemCount > 0 && (
          <section className={styles.placeOrderSection}>
            {placeOrderError && (
              <p className={styles.placeOrderError} role="alert">
                {placeOrderError.message || 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="button"
              className={styles.placeOrderButton}
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder || isPlacingOrder}
            >
              <CardIcon className={styles.placeOrderIcon} aria-hidden="true" />
              {isPlacingOrder
                ? 'Placing your order…'
                : `Place order${formattedSubtotal !== null ? ` • ${formattedSubtotal}` : ''}`}
            </button>
          </section>
        )}
      </div>

      {/* Task 11.7 — the success state, per the project owner's own
          "centered overlay popup" decision recorded at the top of Phase
          11 in `docs/TASKS.md`: on a successful submit, the existing
          `Modal` component (Task 2.15, already used by 11.4c's payment-
          method picker on this same page) opens centered over the
          still-visible checkout page, rather than replacing the page in
          place or navigating to a separate route. `isOpen={Boolean(placedOrder)}`
          — see `handlePlaceOrder`'s own doc comment above for why this
          needs no separate open/close state of its own. No `title` is
          passed (unlike the payment-method modal): the reference's
          success card has its own centered checkmark/heading, not a
          left-aligned modal title bar, so `title` is left unset and
          `ariaLabel="Order placed"` names the dialog for assistive tech
          instead. */}
      <Modal
        isOpen={Boolean(placedOrder)}
        onClose={handleCloseSuccessModal}
        ariaLabel="Order placed"
        size="sm"
      >
        {placedOrder && (
          <div className={styles.successModalContent}>
            <p className={styles.successIcon} aria-hidden="true">
              ✓
            </p>
            <h2 className={styles.successHeading}>Order placed!</h2>
            <p className={styles.successInstructions}>
              Your order has been sent to the restaurant. Keep your Order ID handy to track it.
            </p>

            <div className={styles.successOrderCode}>{placedOrder.order_code}</div>

            {/* Task 11.7c — same two destinations `OrderConfirmation.jsx`
                already navigated to (`/track`, `/`) — no new destinations
                invented. Both buttons close the modal via
                `handleCloseSuccessModal` before navigating: the
                navigation itself unmounts this whole page either way,
                but calling it explicitly keeps `placedOrder` from
                lingering in this component's own `useMutation` state
                should the router ever keep this component alive across
                that navigation (e.g. a future shared-layout route). */}
            <button
              type="button"
              className={styles.successPrimaryButton}
              onClick={() => {
                handleCloseSuccessModal();
                navigate('/track');
              }}
            >
              Track order
            </button>
            <button
              type="button"
              className={styles.successSecondaryButton}
              onClick={() => {
                handleCloseSuccessModal();
                navigate('/');
              }}
            >
              Back to home
            </button>
          </div>
        )}
      </Modal>
    </RoleShell>
  );
}
