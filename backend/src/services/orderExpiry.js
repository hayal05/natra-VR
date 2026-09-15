// orderExpiry — Task 7.3d
//
// Query logic only: find every `New` order that has sat past the
// admin-configured order-timeout window (`admin_settings.order_timeout_mode`/
// `order_timeout_custom_minutes`, Task 6.13a). Deliberately does NOT
// transition anything — that's Task 7.3e's job (`updateOrderStatus(order,
// 'Expired')`, Task 7.3b's `New -> Expired` transition), and it's
// deliberately NOT wired into 7.3c's scheduler yet either — that's also
// 7.3e's job, once there's an actual expiry action for the scheduler to
// call on a timer. Same "query vs write vs trigger" split
// `popularityAggregation.js` (7.1a/7.1b/7.1c) already established for a
// different cron-adjacent feature.
//
// **Reads `admin_settings` via the existing model, not a new one**:
// `models/adminSettings.js` (Task 4.3) already exposes every column on
// this singleton row, including the three this task actually needs
// (`order_timeout_mode`, `order_timeout_custom_minutes`) — no reason for
// a second read path onto the same table. Same fixed `id = 1` row
// `adminSettingsController.js`'s own `SETTINGS_ROW_ID` already reads,
// re-declared here rather than imported from that controller (a service
// importing a controller constant would be backwards — controllers sit on
// top of services in this codebase, not the other way around).
//
// **`order_timeout_mode = 'off'` short-circuits before any orders query
// runs** — per this task's own line in docs/TASKS.md ("skipping entirely
// when order_timeout_mode = 'off'"). Same reasoning
// `popularityAggregation.js`'s `recomputePopularityStats` already applies
// for "nothing to do" (skips its own transaction entirely when there's
// nothing to write) — a disabled feature shouldn't cost a query per
// scheduler tick.
//
// **A `'custom'` mode with no usable `order_timeout_custom_minutes`
// is treated the same as `'off'`, not as "expire everything immediately"**:
// 6.13a's own `PATCH /api/admin/settings` validation requires a positive
// integer `order_timeout_custom_minutes` whenever a request sets
// `order_timeout_mode` to `'custom'`, but `admin_settings` itself has no
// DB-level CHECK constraint tying the two columns together (migration
// 0010) — so a row that somehow ended up `custom` with a null/zero/absent
// `order_timeout_custom_minutes` (a bad manual `UPDATE`, a future bug
// upstream of this file) is a genuinely ambiguous configuration, not "0
// minutes". Silently expiring every open `New` order project-wide because
// of a malformed settings row is a far worse failure mode than skipping
// this pass and leaving it flagged; this file chooses the latter.
//
// **Column-casing note, same systemic gap `popularFoods.js`/
// `liveCategories.js`/`popularityAggregation.js` already flag**:
// unquoted lowercase identifiers are assumed to come back as lowercase
// object keys under `oracledb.outFormat = OUT_FORMAT_OBJECT`
// (config/db.js) — never yet exercised against real Oracle in this
// sandbox.

const { withConnection } = require('../config/db');
const adminSettingsCrud = require('../models/adminSettings');
const orders = require('../models/orders');
const updateOrderStatus = require('./updateOrderStatus');

// Real DB: enforced by `ck_admin_settings_id` (migration 0010) — same
// singleton row `adminSettingsController.js`'s own `SETTINGS_ROW_ID`
// reads.
const SETTINGS_ROW_ID = 1;

const NEW_STATUS = 'New';

// Fixed windows per `docs/DB_SCHEMA.md`'s `order_timeout_mode` CHECK
// constraint (`'off'`/`'15m'`/`'30m'`/`'1h'`/`'custom'`) — `'off'` and
// `'custom'` are handled separately below, not listed here.
const TIMEOUT_MINUTES_BY_MODE = {
  '15m': 15,
  '30m': 30,
  '1h': 60,
};

/**
 * Resolve the current admin-configured order-timeout window, in whole
 * minutes, from an already-fetched `admin_settings` row.
 *
 * @param {{order_timeout_mode: string, order_timeout_custom_minutes: (number|null)}} settings
 * @returns {number|null} `null` means "timeout disabled or unresolvable" —
 *   see this file's own header comment for the two cases that produce it
 *   (`'off'`, and a malformed `'custom'` row).
 */
function resolveTimeoutMinutes(settings) {
  const mode = settings.order_timeout_mode;

  if (mode === 'off') return null;

  if (mode === 'custom') {
    const custom = settings.order_timeout_custom_minutes;
    return Number.isInteger(custom) && custom > 0 ? custom : null;
  }

  return TIMEOUT_MINUTES_BY_MODE[mode] ?? null;
}

/**
 * Find every `New` order whose `created_at` is older than the current
 * admin-configured timeout window.
 *
 * @returns {Promise<Array<{id: number, order_code: string, restaurant_id: number, created_at: Date}>>}
 *   Empty (with no orders query run at all) when: there's no
 *   `admin_settings` row yet (same defensive `notFound`-adjacent case
 *   `adminSettingsController.js` already guards, real deployments always
 *   have this row per migration 0010's own seed insert); the mode is
 *   `'off'`; or a `'custom'` mode has no usable minutes value. Otherwise
 *   every `New` order created before `now - timeoutMinutes`, oldest first
 *   — so 7.3e's future loop processes the most-overdue orders first.
 */
async function findExpiredOrderCandidates() {
  const settings = await adminSettingsCrud.findById(SETTINGS_ROW_ID);
  if (!settings) return [];

  const timeoutMinutes = resolveTimeoutMinutes(settings);
  if (timeoutMinutes === null) return [];

  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT id, order_code, restaurant_id, created_at
         FROM orders
        WHERE status = :newStatus
          AND created_at < :cutoff
        ORDER BY created_at ASC`,
      { newStatus: NEW_STATUS, cutoff }
    );

    return result.rows;
  });
}

/**
 * Transition one already-fetched `orders` row to `'Expired'` — Task 7.3e's
 * own action, thin on top of `updateOrderStatus`/7.3b's `New -> Expired`
 * transition (the same `statusTransition` instance `orderController.js`'s
 * owner-facing Accept/Reject/Complete calls, just the one target an owner
 * has no route to reach directly — see `updateOrderStatus.js`'s own header
 * comment). Kept as its own tiny function, not inlined into
 * `runOrderExpiryPass` below, purely so a caller/test can expire a single
 * known row without going through `findExpiredOrderCandidates`'s query
 * first — the same "query vs write" split this file already draws between
 * itself and `updateOrderStatus`.
 *
 * @param {{id: number, status: string}} order - a full row (must carry
 *   `status`, the field `statusTransition` actually checks) — a
 *   `findExpiredOrderCandidates` candidate is NOT enough on its own, since
 *   that query's own SELECT list deliberately omits `status` (every
 *   candidate is `New` *at query time*, but `runOrderExpiryPass` below
 *   re-fetches before calling this, specifically because that can have
 *   changed by the time this actually runs).
 * @returns {Promise<Object>} the updated order row.
 */
async function expireOrder(order) {
  return updateOrderStatus(order, 'Expired');
}

/**
 * The actual scheduled action: find every candidate via
 * `findExpiredOrderCandidates`, then expire each one — this is what
 * `services/orderExpiryJob.js` registers on 7.3c's scheduler singleton.
 *
 * **Re-fetches each candidate before expiring it, rather than trusting
 * the candidate row as-is**: `findExpiredOrderCandidates`'s own SELECT
 * deliberately doesn't include `status` (every row it returns was `New`
 * *at query time*, by construction of its own WHERE clause) — but an
 * owner can Accept/Reject a pending order at any moment, including in the
 * gap between that query running and this loop reaching a given
 * candidate. Re-fetching the full row via `orders.findById` immediately
 * before transitioning it closes that gap: a candidate that's no longer
 * `New` by the time this actually gets to it is skipped, not force-
 * expired out from under whatever the owner just did to it.
 *
 * **One order's failure doesn't stop the rest**: each candidate is
 * wrapped in its own try/catch — a single bad row (a re-fetch that
 * throws, or a `statusTransition` 409 from the race just described)
 * is logged and counted, not left to abort the whole pass and leave
 * every other overdue order sitting un-expired until the next tick.
 * This mirrors `utils/scheduler.js`'s own per-*job* error containment,
 * just applied one level down, per *order*, inside this one job's own
 * handler — the scheduler's guard can't see inside a single tick to
 * isolate failures at that finer grain.
 *
 * @returns {Promise<{candidateCount: number, expiredCount: number, skippedCount: number, failedCount: number}>}
 *   `skippedCount` covers both a candidate that's no longer `New` by
 *   re-fetch time (the race above) and one that's vanished entirely
 *   (`findById` returning `null` — orders are never actually deleted
 *   anywhere in this codebase, so this shouldn't happen in practice, but
 *   isn't assumed impossible). `failedCount` covers a genuine error
 *   (a re-fetch or transition call throwing for a reason other than the
 *   expected 409 race — a DB hiccup, say).
 */
async function runOrderExpiryPass() {
  const candidates = await findExpiredOrderCandidates();

  const result = {
    candidateCount: candidates.length,
    expiredCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  for (const candidate of candidates) {
    let order;
    try {
      order = await orders.findById(candidate.id);
    } catch (err) {
      result.failedCount += 1;
      // eslint-disable-next-line no-console
      console.error(
        `[orderExpiry] failed to re-fetch order ${candidate.id} (${candidate.order_code}) before expiring it:`,
        err
      );
      continue;
    }

    if (!order || order.status !== NEW_STATUS) {
      // Either genuinely gone (unexpected — orders are never deleted —
      // but not assumed impossible), or an owner already
      // Accepted/Rejected it since 7.3d's query ran. Either way, this
      // pass has nothing left to do to it.
      result.skippedCount += 1;
      continue;
    }

    try {
      await expireOrder(order);
      result.expiredCount += 1;
    } catch (err) {
      result.failedCount += 1;
      // eslint-disable-next-line no-console
      console.error(`[orderExpiry] failed to expire order ${order.id} (${order.order_code}):`, err);
    }
  }

  return result;
}

module.exports = {
  findExpiredOrderCandidates,
  resolveTimeoutMinutes,
  TIMEOUT_MINUTES_BY_MODE,
  expireOrder,
  runOrderExpiryPass,
};
