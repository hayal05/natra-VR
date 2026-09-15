import { useEffect, useState } from 'react';

// useOwnerOrderBadge — Task 5.21 ("dashboard badge/count persists after
// browser notification disappears").
//
// Task 5.20b's native browser `Notification` auto-closes itself after a
// few seconds (`NOTIFICATION_AUTO_CLOSE_MS`, `OwnerDashboard.jsx`) — by
// design, per `docs/NATRA_MASTER_PROMPT.md`'s own "disappears after a
// few seconds" line. That's fine for an owner who's actively looking at
// the screen when it fires, but leaves nothing behind for one who
// wasn't. This module is the thing that *does* stick around: a small
// unseen-new-order counter, persisted (not just held in one screen's
// component state) and readable from anywhere in the app, so
// `RoleShell`'s owner nav (Task 2.18) can show a badge on the "Orders"
// tab that stays lit until the owner actually goes and looks — not for
// a fixed few seconds like the notification/sound (Tasks 5.20b/5.20c)
// it complements.
//
// **localStorage, not sessionStorage** — same reasoning
// `src/api/tokenStorage.js` (Task 3.1) already gives for the owner's own
// auth token: nothing here is tied to one order-in-progress the way
// `useOrderCart`'s cart is (that one's the sessionStorage case), and an
// owner closing/reopening the tab shouldn't lose track of orders that
// arrived while it was closed. Key prefixed `natra.`, matching
// `tokenStorage.js`'s own convention (`natra.authToken`) rather than
// `useOrderCart.js`'s unprefixed `natra_order_cart` — this module is
// written after that naming was already inconsistent between the two
// existing storage modules, and prefixed is the one of the two that
// actually reads as a namespace.
//
// **Detection moved to `RoleShell`-level as of Task 7.5c** — originally
// (Task 5.20a/5.21) this lived in `OwnerDashboard` only, via
// `useNewOrderDetection`'s polling of `GET /api/orders`; that hook has
// since been replaced by `useOwnerNewOrderAlerts.js`, which polls the
// real `GET /api/notifications` event (Task 7.5a/7.5b) from `RoleShell`
// itself, so an owner accrues a badge count from *any* owner screen, not
// just while the Dashboard happens to be mounted — closing the exact gap
// this comment used to flag as accepted. `addToOwnerOrderBadge` is
// called from that hook now, not from `OwnerDashboard.jsx`'s own
// `handleNewOrders` (5.20a's version of that function no longer exists).
//
// **Cleared, not decremented, on a real look**: `OwnerOrders.jsx`
// (Task 5.12b) calls `clearOwnerOrderBadge()` on mount — landing on the
// actual orders list is what "the owner has seen these" means here,
// same all-or-nothing semantics a phone's own per-app unread badge
// uses (opening the app clears it, rather than the OS trying to track
// which specific items were "read"). Simpler, and correct for this
// app's own single flat order list with no per-row read/unread concept
// anywhere else in the schema.
const STORAGE_KEY = 'natra.ownerOrderBadgeCount';

// Same-tab subscribers (RoleShell) need to hear about a change the
// instant OwnerDashboard's own `handleNewOrders` makes it — the
// browser's native `storage` event exists for exactly this purpose but
// deliberately only ever fires in *other* tabs/windows than the one
// that made the write, never the one that did, so it can't be the only
// mechanism here. A plain custom `window` event closes that gap for
// same-tab listeners; the `storage` event (handled separately below) is
// still listened for too, so a badge shown in one tab still updates if
// a second tab (a second `OwnerDashboard` open at once) is the one that
// actually detects the new order.
const CHANGE_EVENT = 'natra:owner-order-badge-change';

function readBadgeCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? 0 : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  } catch {
    // Storage disabled/unavailable (private browsing, etc.) — same
    // "worst case is just treated as zero" fallback tokenStorage.js
    // already uses for a missing/unreadable token.
    return 0;
  }
}

function writeBadgeCount(count) {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  try {
    localStorage.setItem(STORAGE_KEY, String(safeCount));
  } catch {
    // Same as above — a failed write just means the badge won't persist
    // this update, not a crash.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { count: safeCount } }));
  }
  return safeCount;
}

/** Adds `n` (default 1) newly-detected orders to the persisted badge count. */
export function addToOwnerOrderBadge(n = 1) {
  if (!Number.isFinite(n) || n <= 0) return;
  writeBadgeCount(readBadgeCount() + n);
}

/** Resets the badge to zero — call this where "the owner looked" happens. */
export function clearOwnerOrderBadge() {
  writeBadgeCount(0);
}

/**
 * useOwnerOrderBadgeCount — read-only hook for display (`RoleShell`'s
 * owner nav). Seeds from the persisted value on mount, then stays live
 * via both the same-tab custom event and the cross-tab `storage` event,
 * so every mounted `RoleShell` reflects the same count regardless of
 * which tab/screen actually detected or cleared it.
 */
export function useOwnerOrderBadgeCount() {
  const [count, setCount] = useState(readBadgeCount);

  useEffect(() => {
    // Re-sync on mount too, not just via the events below — a badge
    // cleared while this particular RoleShell instance wasn't mounted
    // at all (e.g. a fresh page load straight into /owner/orders) would
    // otherwise show a stale value from this hook's own initial
    // `useState` call until the next change event happens to fire.
    setCount(readBadgeCount());

    const onChange = (event) => {
      setCount(event.detail?.count ?? readBadgeCount());
    };
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setCount(readBadgeCount());
      }
    };

    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return count;
}
