import { useCallback, useEffect, useRef } from 'react';

import { api } from '../api/client';
import { getNotificationPermission } from '../utils/browserNotifications';
import { addToOwnerOrderBadge } from './useOwnerOrderBadge';

// useOwnerNewOrderAlerts — Task 7.5c
//
// The real (table-backed) replacement for Task 5.20a's
// `useNewOrderDetection`: that hook polled `GET /api/orders` from
// `OwnerDashboard` only, inferring "a new order arrived" client-side by
// comparing the newest order id against what it saw last poll —
// exactly the `docs/PROJECT_STATUS.md`/`docs/TASKS.md` Phase-7 note's
// "OwnerDashboard-local polling ... not table-backed" gap. Task 7.5a
// gave this a real server-side event (a `notifications` row, type
// `new_order`, written the instant `services/submitOrder.js` commits an
// order) and 7.5b gave it a real endpoint to read that event from
// (`GET /api/notifications`); this hook is what actually polls that
// endpoint and fires the three owner-facing effects Task 5.20b/5.20c/
// 5.21 already built (browser `Notification`, a synthesized beep, and
// the persistent nav badge) off of it.
//
// **Lives in `RoleShell`, not `OwnerDashboard`** — per `docs/TASKS.md`'s
// own 7.5c line ("so it works app-wide (RoleShell-level) rather than
// only while Dashboard is mounted"), closing the exact gap
// `useNewOrderDetection`'s own header comment flagged as "explicitly
// Phase 7's job, not this one's". `RoleShell` re-renders on every
// owner-screen navigation (each owner page wraps itself in
// `<RoleShell role="owner">` individually, per that component's own
// header comment — there's no single persistent layout instance across
// routes in this app), so this hook's own poll/seed cycle restarts on
// every navigation the same way `useNewOrderDetection`'s did on every
// remount — an accepted, unchanged trade-off, not a regression this
// task introduces.
//
// **Reads `notification.message` directly, no second `GET
// /api/orders/:id` fetch**: `notifyOwnerOfNewOrder` (Task 7.5a,
// `services/submitOrder.js`) already builds the exact
// "New order <code> from <location> — N items — <total> ETB" string
// `docs/NATRA_MASTER_PROMPT.md`'s own example names, so there's no
// per-order detail fetch left for this hook to make the way
// `useNewOrderDetection` needed one (that hook's own `GET
// /api/orders/:id` call existed purely to get the item count/location/
// total a plain order-list row doesn't carry — the notification row
// already carries all of that, pre-formatted, as its one `message`
// field).
//
// **No `GET /api/orders`-style "no restaurant yet" 403 gate needed**:
// unlike `/api/orders`/`/orders/counts`, `GET /api/notifications` is
// scoped by `recipient_id` (a plain `users.id`, `notificationController.js`'s
// own Task 7.5b header comment), not by `restaurant_id` — so a
// brand-new owner with no `restaurants` row yet (the standing Task 4.6
// gap) never 403s here. `enabled` is still exposed as a param (passed
// `role === 'owner'` at this hook's one call site, `RoleShell.jsx`) so a
// customer/admin `RoleShell` never issues this request at all — not to
// dodge a 403 that wouldn't happen anyway, but because a non-owner has
// no reason to poll an owner-only notification stream.
const DEFAULT_POLL_INTERVAL_MS = 20000;

// `notifications.type` value Task 7.5a's own `submitOrder.js` writes —
// duplicated here rather than imported (no shared-code mechanism across
// the frontend/backend package boundary in this project, same
// "duplicated rather than imported" call every other frontend copy of a
// backend-owned vocabulary already makes, e.g. `ORDER_STATUS_LABELS` in
// `OwnerDashboard.jsx`).
const NEW_ORDER_NOTIFICATION_TYPE = 'new_order';

const NOTIFICATION_AUTO_CLOSE_MS = 6000;

// `GET /api/notifications` (Task 7.5b), newest-first by `id` — this
// hook only ever reads page 1, same "page-1 headroom is plenty for one
// poll interval's worth of new rows" reasoning `useNewOrderDetection`'s
// own header comment already gave for `/api/orders`.
function fetchLatestNotifications(signal) {
  return api.get('/notifications?page=1', { signal }).then(({ notifications }) => notifications);
}

// Task 5.20b's own message template, now sourced straight from the
// notification row's own `message` (see this file's header comment)
// instead of being rebuilt from a separately-fetched order/items pair.
function showOrderNotification(notification) {
  if (getNotificationPermission() !== 'granted') return;
  const note = new Notification(notification.message);
  setTimeout(() => note.close(), NOTIFICATION_AUTO_CLOSE_MS);
}

// Task 5.20c's synthesized Web Audio beep — same implementation
// `OwnerDashboard.jsx` originally carried, moved here unchanged (still a
// single shared, lazily-created `AudioContext` reused across calls, same
// autoplay-policy handling) now that this hook is the one place a "new
// order" batch is actually detected.
function getAudioContextClass() {
  return typeof window === 'undefined'
    ? undefined
    : window.AudioContext || window.webkitAudioContext;
}

let sharedAudioContext = null;

function getSharedAudioContext() {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

const NEW_ORDER_SOUND_FREQUENCY_HZ = 880; // A5 — audible without being jarring
const NEW_ORDER_SOUND_DURATION_S = 0.3;
const NEW_ORDER_SOUND_GAIN = 0.15;

function playNewOrderSound() {
  const context = getSharedAudioContext();
  if (!context) return;

  const emitTone = () => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = NEW_ORDER_SOUND_FREQUENCY_HZ;
    gainNode.gain.value = NEW_ORDER_SOUND_GAIN;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + NEW_ORDER_SOUND_DURATION_S);
  };

  if (context.state === 'suspended') {
    context.resume().then(emitTone).catch(() => {});
  } else {
    emitTone();
  }
}

/**
 * useOwnerNewOrderAlerts — Task 7.5c. Polls `GET /api/notifications`
 * while `enabled`, and for each newly-seen `new_order` row fires a
 * browser `Notification` (5.20b), a short beep (5.20c), and adds to the
 * persistent nav badge (5.21) — the same three owner-facing effects
 * `OwnerDashboard.jsx`'s own `handleNewOrders` used to fire off of
 * `useNewOrderDetection`, now sourced from the real table-backed event
 * instead. Call once, unconditionally (hooks can't be conditional), from
 * `RoleShell` — see this file's header comment for why there and not
 * `OwnerDashboard`.
 *
 * Detection uses the same "compare newest id against a `lastSeenId` ref,
 * seed without reporting on the first poll" shape `useNewOrderDetection`
 * already established, applied to notification ids instead of order
 * ids. A notification row of any *other* type (none exist yet, but
 * `notifications.type` isn't a closed enum at the DB level — migration
 * 0010) is still tracked for `lastSeenId` purposes so it can never be
 * re-seen as "new" once the poll advances past it, but is filtered out
 * before the three effects above fire — this hook only ever alerts on
 * `new_order`.
 *
 * @param {object} options
 * @param {boolean} options.enabled - Pass `role === 'owner'` at the one
 *   call site; see header comment for why no restaurant-scope gate is
 *   needed here the way `useNewOrderDetection` needed one.
 * @param {number} [options.intervalMs]
 */
export function useOwnerNewOrderAlerts({ enabled, intervalMs = DEFAULT_POLL_INTERVAL_MS }) {
  const lastSeenIdRef = useRef(null);
  const seededRef = useRef(false);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const poll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const latest = await fetchLatestNotifications(controller.signal);
      if (!mountedRef.current) return;

      if (!seededRef.current) {
        lastSeenIdRef.current = latest[0]?.id ?? 0;
        seededRef.current = true;
        return;
      }

      const newRows = latest
        .filter((notification) => notification.id > lastSeenIdRef.current)
        .sort((a, b) => a.id - b.id);

      if (newRows.length === 0) return;

      lastSeenIdRef.current = newRows[newRows.length - 1].id;

      const newOrderRows = newRows.filter(
        (notification) => notification.type === NEW_ORDER_NOTIFICATION_TYPE
      );
      if (newOrderRows.length === 0) return;

      newOrderRows.forEach((notification) => showOrderNotification(notification));
      // Once per detection batch, not once per notification inside the
      // forEach above — same "several new orders within one poll
      // interval should still announce with one beep" reasoning
      // `OwnerDashboard.jsx`'s original 5.20c wiring already documented.
      playNewOrderSound();
      addToOwnerOrderBadge(newOrderRows.length);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // Silently retry on the next tick — same posture
      // `useNewOrderDetection` already took for its own poll failures;
      // nothing renders an error for this background alert loop.
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      seededRef.current = false;
      lastSeenIdRef.current = null;
      return undefined;
    }

    poll();
    const timer = setInterval(poll, intervalMs);
    return () => {
      clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [enabled, intervalMs, poll]);
}
