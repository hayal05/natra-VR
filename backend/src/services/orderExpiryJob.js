// orderExpiryJob — Task 7.3e
//
// The "future job module" `scheduler.js`'s own Task 7.3c header comment
// already named by example (`services/orderExpiryJob.js`): requiring
// this module is what actually starts the order-expiry pass ticking —
// it calls `scheduler.registerJob(...)` once, at load time, against the
// one app-wide scheduler singleton (`../scheduler`), same pattern that
// header comment describes ("a late-require()d job file is enough on
// its own").
//
// Deliberately a separate file from `orderExpiry.js` itself, not a
// `registerJob` call added to the bottom of that module: `orderExpiry.js`
// is query/action logic only (7.3d's `findExpiredOrderCandidates`, this
// task's own `expireOrder`/`runOrderExpiryPass`) and is required directly
// by its own test file with no scheduler side effect — requiring it
// should never, by itself, start a recurring timer. This file is the one
// and only place that side effect lives, so requiring `orderExpiry.js`
// anywhere else (a future admin manual-trigger endpoint, tests, etc.)
// stays side-effect-free, the same way `services/popularityAggregation.js`
// (7.1a/b) has no scheduler wiring of its own either — 7.1c's manual
// trigger endpoint calls it directly, no job file needed there since
// nothing schedules popularity recomputation automatically yet.
//
// **Check interval, not the timeout window itself**: `CHECK_INTERVAL_MS`
// is how often this job *looks* for overdue orders, completely separate
// from `admin_settings.order_timeout_mode`'s own window (how long an
// order gets to sit as `New` before it's considered overdue at all,
// resolved fresh on every tick by `findExpiredOrderCandidates` itself).
// Defaults to one minute — frequent enough that an order expires close
// to its actual deadline (the shortest configurable window is 15
// minutes, so a 1-minute poll is never more than ~7% late on average)
// without polling `admin_settings`/`orders` on every scheduler tick the
// way a sub-second interval would. Overridable via
// `ORDER_EXPIRY_CHECK_INTERVAL_MS` for a deployment that wants tighter
// or looser polling without a code change — same "env var escape hatch"
// convention `HEALTH_CHECK_TIMEOUT_MS` (Task 0.15) already established.

const scheduler = require('../scheduler');
const { runOrderExpiryPass } = require('./orderExpiry');

const JOB_NAME = 'order-expiry';
const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

const parsedIntervalMs = Number(process.env.ORDER_EXPIRY_CHECK_INTERVAL_MS);
const CHECK_INTERVAL_MS =
  Number.isInteger(parsedIntervalMs) && parsedIntervalMs > 0 ? parsedIntervalMs : DEFAULT_CHECK_INTERVAL_MS;

async function handleTick() {
  const result = await runOrderExpiryPass();

  // Quiet on an empty/uneventful tick (the overwhelmingly common case,
  // once every minute, forever) — only worth a log line when there was
  // actually something to report, same "don't spam a log nobody will
  // read" restraint `scheduler.js`'s own tick wrapper applies by only
  // logging on skip/error, not on every ordinary successful tick.
  if (result.expiredCount > 0 || result.failedCount > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[orderExpiry] pass complete — ${result.expiredCount} expired, ${result.skippedCount} skipped, ` +
        `${result.failedCount} failed (of ${result.candidateCount} candidate(s))`
    );
  }

  return result;
}

scheduler.registerJob(JOB_NAME, CHECK_INTERVAL_MS, handleTick);

module.exports = { JOB_NAME, CHECK_INTERVAL_MS, handleTick };
