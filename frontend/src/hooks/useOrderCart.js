import { useCallback, useState } from 'react';

// sessionStorage, not localStorage: an order-in-progress isn't something
// this app has any reason to survive past the tab closing — customers
// have no accounts (docs/DB_SCHEMA.md), and once an order is actually
// submitted (Task 3.15) there's nothing left to persist anyway. This is
// also why it's sessionStorage rather than plain in-memory React state
// held one level up in App.jsx: Task 3.11's "Add another item" needs to
// navigate away to a restaurant's menu (Task 3.8) and back, and a plain
// unmount/remount of <OrderBuilder> would otherwise lose the cart
// entirely on that round trip.
const STORAGE_KEY = 'natra_order_cart';

const EMPTY_CART = {
  restaurantId: null,
  items: [],
  customerInfo: null,
  paymentMethodId: null,
  paymentScreenshotUrl: null,
};

function readCart() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return EMPTY_CART;
    // Older sessions (before Task 3.12) never wrote `customerInfo` at all,
    // sessions before Task 3.13 never wrote `paymentMethodId`, and
    // sessions before Task 3.14 never wrote `paymentScreenshotUrl` either
    // — default all three to `null` rather than leaving them `undefined`,
    // so every consumer of `cart.customerInfo`/`cart.paymentMethodId`/
    // `cart.paymentScreenshotUrl` can rely on exactly two shapes (`null`
    // or the real value) instead of also having to check for `undefined`.
    return { customerInfo: null, paymentMethodId: null, paymentScreenshotUrl: null, ...parsed };
  } catch {
    // Malformed JSON (a stale/corrupted value from an earlier app
    // version) or sessionStorage itself unavailable (private browsing) —
    // either way, starting from an empty cart is safer than throwing out
    // of a render.
    return EMPTY_CART;
  }
}

function writeCart(cart) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage disabled or quota exceeded — the cart just won't survive a
    // reload/navigation in that case rather than crashing the order flow.
  }
}

/**
 * useOrderCart — the cart data model behind the Order Builder screen
 * (Task 3.10), "Add another item" (Task 3.11), the Customer Info form
 * (Task 3.12), Payment Method selection (Task 3.13), and, as of this
 * update, Payment Screenshot upload (Task 3.14).
 * docs/NATRA_MASTER_PROMPT.md's Order Builder section: "Multiple
 * different foods and quantities are allowed. One order can NEVER
 * contain foods from different restaurants" — so the shape here is
 * `{ restaurantId, items: [{ foodId, quantity }], customerInfo,
 * paymentMethodId, paymentScreenshotUrl }`, not just a bare items
 * array, so that single-restaurant rule has somewhere to actually live
 * rather than being re-derived from the items each time. `customerInfo`
 * (Task 3.12) is `null` until the Customer Info form is submitted, then
 * `{ name, phone, locationText, note }`. `paymentMethodId` (Task 3.13)
 * is likewise `null` until a method is picked, then the plain numeric
 * `payment_methods.id` of one of *this restaurant's own* active
 * methods. `paymentScreenshotUrl` (Task 3.14) is `null` until the
 * screenshot has actually been uploaded to Object Storage, then the
 * plain URL string `POST /api/uploads/payment-screenshot` returns — the
 * `File` itself is never stored here (see `setPaymentScreenshotUrl`'s
 * own comment for why). All three are kept on this same
 * sessionStorage-backed object rather than a second storage key, since
 * it's the same one order-in-progress and Task 3.15's submit endpoint
 * still needs to read all of them back after this screen's own
 * navigation, the same "needs to survive a round trip" reasoning
 * Task 3.10 already gave for the cart itself being storage-backed
 * rather than plain component state.
 *
 * Deliberately NOT a React Context: nothing needs to read/update the
 * cart from two different places at the same instant (Food Details,
 * Task 3.9, only ever navigates to Order Builder and hands off its
 * selection via router `state`, it doesn't need live cart state itself)
 * — a plain hook reading/writing sessionStorage on each call is enough,
 * and avoids introducing a provider this app doesn't otherwise need.
 * Each hook instance keeps its own React state synced from storage on
 * its own mount; it does not react to *other* components' writes to the
 * same key without a remount, which is fine here since each checkout
 * screen (Order Builder, Customer Info, and onward) reads it back out
 * fresh on its own mount rather than two of them being visible at once.
 */
export function useOrderCart() {
  const [cart, setCart] = useState(readCart);

  // Adds (or merges into an existing line for) one food. If the cart
  // already belongs to a *different* restaurant, it's replaced outright
  // rather than merged — Task 3.11's own job is stopping that situation
  // from being reachable in the first place (only offering "Add another
  // item" against the same restaurant's menu); this is just a safety net
  // so a stale cart left over from an abandoned order never ends up
  // holding two restaurants' foods at once. `customerInfo` is preserved
  // across a restaurant swap — it's the customer's own contact/location
  // details, not tied to which restaurant they're ordering from, so
  // there's no reason re-picking a food should make them re-type it.
  // `paymentMethodId` (Task 3.13) is the opposite: it names one specific
  // *other* restaurant's own configured method, so it's reset to `null`
  // on a swap rather than carried over — a stale id from a different
  // restaurant would either point at nothing (a plain 404 on submit) or,
  // worse, coincidentally resolve to a real but wrong method there.
  const addItem = useCallback((restaurantId, foodId, quantity) => {
    setCart((prev) => {
      const sameRestaurant = prev.restaurantId === restaurantId;
      const baseItems = sameRestaurant ? prev.items : [];
      const existingIndex = baseItems.findIndex((item) => item.foodId === foodId);
      const items =
        existingIndex === -1
          ? [...baseItems, { foodId, quantity }]
          : baseItems.map((item, index) =>
              index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
            );
      const next = {
        restaurantId,
        items,
        customerInfo: prev.customerInfo,
        paymentMethodId: sameRestaurant ? prev.paymentMethodId : null,
        // Same reasoning as `paymentMethodId` just above (Task 3.13):
        // a screenshot proves payment against one specific restaurant's
        // one specific method, so it can't carry over to a different
        // restaurant's order any more than that method id could.
        paymentScreenshotUrl: sameRestaurant ? prev.paymentScreenshotUrl : null,
      };
      writeCart(next);
      return next;
    });
  }, []);

  const setItemQuantity = useCallback((foodId, quantity) => {
    setCart((prev) => {
      const next = {
        ...prev,
        items: prev.items.map((item) => (item.foodId === foodId ? { ...item, quantity } : item)),
      };
      writeCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((foodId) => {
    setCart((prev) => {
      const items = prev.items.filter((item) => item.foodId !== foodId);
      // Emptying the cart also clears its restaurantId — otherwise a
      // customer who removes their one item and then picks a food from a
      // *different* restaurant would immediately hit the "different
      // restaurant" merge-replacement path above for no visible reason.
      // `customerInfo`/`paymentMethodId` are deliberately dropped too in
      // that case (not just `restaurantId`/`items`) — an emptied cart is
      // a fresh order in every sense once it's rebuilt, not a
      // continuation of the old one.
      const next = items.length === 0 ? EMPTY_CART : { ...prev, items };
      writeCart(next);
      return next;
    });
  }, []);

  // setCustomerInfo (Task 3.12) — the Customer Info form's own save
  // point. Takes the whole `{ name, phone, locationText, note }` object
  // rather than per-field setters: the form itself owns its own
  // in-progress `useState` while typing (same as every other form-shaped
  // screen in this codebase, e.g. FoodDetails' `quantity`) and only
  // commits to the cart on submit, so there's no need for this hook to
  // expose more granular field-level updates nothing calls.
  const setCustomerInfo = useCallback((customerInfo) => {
    setCart((prev) => {
      const next = { ...prev, customerInfo };
      writeCart(next);
      return next;
    });
  }, []);

  // setPaymentMethod (Task 3.13) — the Payment Method selection screen's
  // own save point, same "commit on selection" shape as `setCustomerInfo`
  // just above. Takes the plain numeric `payment_methods.id` rather than
  // the whole method object — this hook has no reason to cache a
  // restaurant-owned record it doesn't itself fetch; the Payment
  // Screenshot screen (Task 3.14) and the submit endpoint (Task 3.15)
  // can each re-fetch/re-validate it against the current restaurant by
  // id, the same way `customerInfo` is read back as plain form data
  // rather than anything server-fetched.
  const setPaymentMethod = useCallback((paymentMethodId) => {
    setCart((prev) => {
      // Changing which method is selected also clears any already-
      // uploaded screenshot (Task 3.14): a screenshot is proof of
      // payment to one specific method's account details, so a
      // screenshot uploaded against the *previous* selection can't
      // silently carry over to a newly-picked one — same "stale
      // pointer to the wrong thing" reasoning `addItem`'s restaurant
      // swap already applies to this same field. Re-selecting the
      // *same* method id (e.g. tapping it again) also clears it here,
      // which is harmless: PaymentMethod.jsx only calls this on an
      // actual tap, and re-uploading a screenshot after one extra tap
      // is a trivial cost next to the alternative of missing a genuine
      // method change because the id happened to be identical.
      const next = { ...prev, paymentMethodId, paymentScreenshotUrl: null };
      writeCart(next);
      return next;
    });
  }, []);

  // setPaymentScreenshotUrl (Task 3.14) — the Payment Screenshot
  // screen's own save point, same "commit on success" shape as
  // `setCustomerInfo`/`setPaymentMethod` above. Takes the plain URL
  // string `uploadController.js`'s `/api/uploads/payment-screenshot`
  // returns, not the `File` itself — a `File` object can't round-trip
  // through `JSON.stringify` (sessionStorage only stores strings), and
  // there's no reason to keep the local file around once it's been
  // uploaded and turned into a durable URL the submit endpoint
  // (Task 3.15) can read back out, the same "cache the server-issued
  // reference, not the client-side input" shape `paymentMethodId`
  // already uses for the method id instead of the whole method object.
  const setPaymentScreenshotUrl = useCallback((paymentScreenshotUrl) => {
    setCart((prev) => {
      const next = { ...prev, paymentScreenshotUrl };
      writeCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    writeCart(EMPTY_CART);
    setCart(EMPTY_CART);
  }, []);

  return {
    cart,
    addItem,
    setItemQuantity,
    removeItem,
    setCustomerInfo,
    setPaymentMethod,
    setPaymentScreenshotUrl,
    clearCart,
  };
}
