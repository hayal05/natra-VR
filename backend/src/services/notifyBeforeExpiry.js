// notifyBeforeExpiry — Task 7.4a, plus 7.4b's write step
//
// 7.4a (`findOrdersApproachingExpiry`, below): query logic only — find
// every `New` order that is approaching — but has NOT yet passed — the
// admin-configured order-timeout window
// (`admin_settings.order_timeout_mode`/`order_timeout_custom_minutes`,
// same columns Task 7.3d's `orderExpiry.js` already reads), and only when
// `admin_settings.notify_before_expiry = 1`. Same "query vs write vs
// trigger" split `popularityAggregation.js` (7.1a/7.1b/7.1c) and
// `orderExpiry.js` (7.3d/7.3e) already established for a cron-adjacent
// feature.
//
// 7.4b (`notifyOrderApproachingExpiry`/`runNotifyBeforeExpiryPass`,
// further down this file): the write step — insert one `notifications`
// row per not-yet-notified candidate, same "the write step lives in the
// same file as its query, one file per cron-adjacent feature" shape
// `orderExpiry.js` already uses for 7.3d+7.3e together. Still NOT wired
// into 7.3c's scheduler yet — that's 7.4c's job, once there's a second
// action (alongside `orderExpiry.js`'s own `runOrderExpiryPass`) for a
// timer to call. See `notifyOrderApproachingExpiry`'s own doc comment for
// the dedup guard ("same order isn't notified twice", 7.4b's own line in
// docs/TASKS.md) and how `recipient_id` gets resolved.
//
// **Reuses `orderExpiry.js`'s `resolveTimeoutMinutes`, not a second copy
// of it**: "approaching the timeout window" is only meaningful relative
// to the exact same window 7.3d/7.3e already compute from the same three
// `admin_settings` columns (`order_timeout_mode`/
// `order_timeout_custom_minutes`, resolved to `null`/off, a fixed
// 15/30/60, or a validated custom value) — duplicating that resolution
// here would risk the two features drifting to disagree about what "the
// timeout" even is. `orderExpiry.js` already exports it for exactly this
// kind of reuse.
//
// **`notify_before_expiry = 0` (or the row missing entirely) short-
// circuits before any orders query runs**, same "a disabled feature
// shouldn't cost a query per scheduler tick" reasoning
// `findExpiredOrderCandidates` (7.3d) already applies for `order_timeout_mode
// = 'off'`. Checked *before* `resolveTimeoutMinutes` even runs — there's
// no point resolving a window this task isn't going to use.
//
// **A `'custom'` mode with no usable minutes, or `order_timeout_mode =
// 'off'` itself, is treated the same as `notify_before_expiry = 0`**: if
// `resolveTimeoutMinutes` can't say what "the timeout" is, there's no
// window to be "approaching" either — same malformed-config posture
// `orderExpiry.js`'s own header comment already documents for its own
// query, not re-litigated differently here.
//
// **"Approaching" is a measured fraction of the window, not a fixed
// number of minutes — a genuine design decision, not given anywhere in
// docs/NATRA_MASTER_PROMPT.md/DB_SCHEMA.md beyond the bare boolean
// toggle**: a fixed lead time (e.g. "5 minutes before expiry") breaks
// down at the edges of what `order_timeout_mode`/`order_timeout_custom_minutes`
// actually allow — a 15-minute fixed window is a full third of a `15m`
// mode's own timeout, but could be *longer than the entire window* for a
// short `custom` value (e.g. `custom: 3`), which would mean every order
// is "approaching" expiry from the moment it's created, not a real
// early-warning signal at all. `NOTIFY_LEAD_FRACTION` below instead
// measures the *last 20% of whatever the current window is* — an order
// is "approaching" once it's been `New` for at least
// `timeoutMinutes * (1 - NOTIFY_LEAD_FRACTION)` minutes, and stops
// counting once it actually passes `timeoutMinutes` (7.3d/7.3e's own job
// from that point on). This scales correctly across every mode
// (`15m`'s own last 3 minutes, `1h`'s own last 12, any `custom` value's
// own last fifth) with one constant, rather than a per-mode lookup table
// the way `TIMEOUT_MINUTES_BY_MODE` itself is. Flagged here as an
// inferred value, same as every other "spec doesn't say a number, pick a
// reasonable one" call this codebase has made (e.g. `formatPrice`/the
// bell-icon decision in `Home.jsx`, Task 3.2) — worth revisiting if a
// real admin ever asks for a configurable lead time, which would be a
// schema change (a new `admin_settings` column), not something this
// query can invent on its own.
//
// **Does NOT dedupe against orders already notified once** — the
// "guarded so the same order isn't notified twice" requirement named in
// docs/TASKS.md is explicitly 7.4b's own line item (the *write* step),
// not this query's. This function only answers "which New orders are
// currently inside the approaching window"; a candidate this call
// returns may already have a `notifications` row from a previous tick
// for the exact same order, and 7.4b is where that gets checked before
// inserting a second one — not duplicated here ahead of time.
//
// **Column-casing note, same systemic gap `popularFoods.js`/
// `liveCategories.js`/`popularityAggregation.js`/`orderExpiry.js` already
// flag**: unquoted lowercase identifiers are assumed to come back as
// lowercase object keys under `oracledb.outFormat = OUT_FORMAT_OBJECT`
// (config/db.js) — never yet exercised against real Oracle in this
// sandbox.

const { withConnection } = require('../config/db');
const adminSettingsCrud = require('../models/adminSettings');
const notificationsCrud = require('../models/notifications');
const restaurantsCrud = require('../models/restaurants');
const { resolveTimeoutMinutes } = require('./orderExpiry');

// Real DB: enforced by `ck_admin_settings_id` (migration 0010) — same
// singleton row `orderExpiry.js`'s own `SETTINGS_ROW_ID` reads.
const SETTINGS_ROW_ID = 1;

const NEW_STATUS = 'New';

// See this file's own header comment above for why this is a fraction of
// the resolved window rather than a fixed number of minutes.
const NOTIFY_LEAD_FRACTION = 0.2;

/**
 * Find every `New` order currently inside the "approaching expiry"
 * window — i.e. it has been `New` for at least
 * `timeoutMinutes * (1 - NOTIFY_LEAD_FRACTION)` minutes but has not yet
 * reached the full `timeoutMinutes` window `orderExpiry.js`'s own
 * `findExpiredOrderCandidates` would expire it at.
 *
 * @returns {Promise<Array<{id: number, order_code: string, restaurant_id: number, created_at: Date}>>}
 *   Empty (with no orders query run at all) when: there's no
 *   `admin_settings` row yet; `notify_before_expiry` is falsy/0; or
 *   `resolveTimeoutMinutes` can't resolve a real window (`'off'`, or a
 *   malformed `'custom'` row) — see this file's header comment for why
 *   each of those short-circuits before any orders query runs. Otherwise
 *   every currently-approaching `New` order, oldest-first (same ordering
 *   `findExpiredOrderCandidates` uses, for the same "most urgent first"
 *   reason, so a future 7.4b write loop notifies the closest-to-expiring
 *   orders first if it ever needs to process a large batch).
 */
async function findOrdersApproachingExpiry() {
  const settings = await adminSettingsCrud.findById(SETTINGS_ROW_ID);
  if (!settings) return [];

  if (!settings.notify_before_expiry) return [];

  const timeoutMinutes = resolveTimeoutMinutes(settings);
  if (timeoutMinutes === null) return [];

  const now = Date.now();
  const elapsedThresholdMinutes = timeoutMinutes * (1 - NOTIFY_LEAD_FRACTION);
  // An order becomes "approaching" once it's older than this cutoff —
  // i.e. `created_at` further in the past than `leadCutoff`.
  const leadCutoff = new Date(now - elapsedThresholdMinutes * 60 * 1000);
  // ...and stops being "approaching" (7.3d/7.3e's own job from here) once
  // it's older than the full window — same `fullCutoff` value
  // `findExpiredOrderCandidates` computes for its own `created_at <
  // cutoff` expiry check, re-derived here rather than imported since it's
  // a one-line `Date` computation, not shared logic worth a second export.
  const fullCutoff = new Date(now - timeoutMinutes * 60 * 1000);

  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT id, order_code, restaurant_id, created_at
         FROM orders
        WHERE status = :newStatus
          AND created_at < :leadCutoff
          AND created_at >= :fullCutoff
        ORDER BY created_at ASC`,
      { newStatus: NEW_STATUS, leadCutoff, fullCutoff }
    );

    return result.rows;
  });
}

// `notifications.type` — Task 7.4b's own line in docs/TASKS.md names this
// exact string as its example (`e.g. type order_expiring_soon`).
const NOTIFICATION_TYPE = 'order_expiring_soon';

/**
 * Task 7.4b's own write step: notify the owning user of one already-found
 * `findOrdersApproachingExpiry` candidate — but only if it hasn't already
 * been notified. "Guarded so the same order isn't notified twice"
 * (docs/TASKS.md's own 7.4b line) is enforced here, not in 7.4a's query,
 * for the same reason `orderExpiry.js`'s own header comment gives for its
 * "query vs write" split: 7.4a's job is only ever "which orders are
 * currently approaching", a question with the same answer regardless of
 * whether a notification for one of them already exists. Whether *this
 * particular tick* should act on a given candidate — including "already
 * notified, so no-op" — is what makes this the write step, not the query
 * one.
 *
 * **Dedup is a real row check, not a guess from the candidate's shape**:
 * `notifications` has no `UNIQUE(order_id, type)` constraint (migration
 * 0010 — nothing named this requirement at the schema level), so this
 * calls `notificationsCrud.count({ order_id, type })` immediately before
 * inserting and skips if it's already `> 0`, rather than relying on a DB
 * constraint to reject a duplicate insert (there isn't one to catch it).
 * This is a check-then-insert, not a single atomic statement — see this
 * function's own "not race-proof" note below for what that does and
 * doesn't cover.
 *
 * **Looks up the restaurant to resolve `recipient_id`**: a
 * `findOrdersApproachingExpiry` candidate only carries `restaurant_id`,
 * but `notifications.recipient_id` is a `users.id` (the *owner*, per
 * migration 0010's own `fk_notifications_recipient_id -> users`) — so
 * this fetches the restaurant via `restaurantsCrud.findById` to read its
 * `owner_id`, the exact same column `restaurants.js`'s own header comment
 * already flags as "a `users.id`, unlike every *other* owner-scoped
 * table". A restaurant that's vanished (unexpected — restaurants are
 * never deleted anywhere in this codebase, same as orders) is treated as
 * "nothing to notify", not an error worth aborting the whole pass over.
 *
 * @param {{id: number, order_code: string, restaurant_id: number}} candidate
 *   - one row as returned by `findOrdersApproachingExpiry` (7.4a);
 *   `created_at` is accepted but unused here.
 * @returns {Promise<Object|null>} the newly-created `notifications` row,
 *   or `null` if nothing was written (already notified, or the
 *   restaurant/owner couldn't be resolved).
 */
async function notifyOrderApproachingExpiry(candidate) {
  const existing = await notificationsCrud.count({
    order_id: candidate.id,
    type: NOTIFICATION_TYPE,
  });
  if (existing > 0) return null;

  const restaurant = await restaurantsCrud.findById(candidate.restaurant_id);
  if (!restaurant) return null;

  return notificationsCrud.create({
    recipient_id: restaurant.owner_id,
    type: NOTIFICATION_TYPE,
    restaurant_id: candidate.restaurant_id,
    order_id: candidate.id,
    message: `Order ${candidate.order_code} is approaching its timeout — respond soon to avoid it expiring.`,
  });
}

/**
 * The actual scheduled action (Task 7.4c wires this into 7.3c's
 * scheduler, alongside `orderExpiry.js`'s own `runOrderExpiryPass`, not
 * this task's job): find every candidate via
 * `findOrdersApproachingExpiry`, then notify each one that hasn't already
 * been notified — mirrors `runOrderExpiryPass`'s own per-candidate
 * try/catch shape ("one order's failure doesn't stop the rest") so a
 * single bad row (a restaurant lookup or insert that throws) is logged
 * and counted, not left to abort the whole pass.
 *
 * **Not race-proof against two overlapping ticks** — same standing gap
 * `runOrderExpiryPass`'s own re-fetch-before-transition doesn't fully
 * close either (its guard is against an *owner's* concurrent action, not
 * a second scheduler tick running this exact function concurrently).
 * `utils/scheduler.js`'s own single-timer-per-job design (Task 7.3c)
 * means this shouldn't happen in practice; a genuine duplicate under a
 * true race is a harmless second notification, not a correctness bug in
 * the underlying order/expiry state this task doesn't touch at all.
 *
 * @returns {Promise<{candidateCount: number, notifiedCount: number, skippedCount: number, failedCount: number}>}
 *   `skippedCount` covers both "already notified" and "restaurant/owner
 *   couldn't be resolved" (`notifyOrderApproachingExpiry` returning
 *   `null` for either reason — not distinguished further here, same
 *   granularity `runOrderExpiryPass`'s own `skippedCount` uses for its
 *   two skip reasons). `failedCount` covers a genuine error.
 */
async function runNotifyBeforeExpiryPass() {
  const candidates = await findOrdersApproachingExpiry();

  const result = {
    candidateCount: candidates.length,
    notifiedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  for (const candidate of candidates) {
    try {
      const notification = await notifyOrderApproachingExpiry(candidate);
      if (notification) {
        result.notifiedCount += 1;
      } else {
        result.skippedCount += 1;
      }
    } catch (err) {
      result.failedCount += 1;
      // eslint-disable-next-line no-console
      console.error(
        `[notifyBeforeExpiry] failed to notify for order ${candidate.id} (${candidate.order_code}):`,
        err
      );
    }
  }

  return result;
}

module.exports = {
  findOrdersApproachingExpiry,
  notifyOrderApproachingExpiry,
  runNotifyBeforeExpiryPass,
  NOTIFY_LEAD_FRACTION,
  NOTIFICATION_TYPE,
};
