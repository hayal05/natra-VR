// notifyBeforeExpiryJob — Task 7.4c
//
// The "notify-before-expiry" counterpart to `orderExpiryJob.js` (7.3e):
// requiring this module is what actually registers the notify-before-
// expiry pass onto the scheduler singleton (`../scheduler`) — same
// load-time-side-effect shape, same reason it's a separate file from
// `notifyBeforeExpiry.js` itself (that file's own query/write logic,
// 7.4a/7.4b, stays side-effect-free to require directly, e.g. from its
// own test file, exactly the same separation `orderExpiryJob.js`'s own
// header comment draws between itself and `orderExpiry.js`).
//
// **This is 7.4c's entire job**: `docs/TASKS.md`'s own line for this
// task is "Wire into 7.3c's scheduler loop alongside the expiry pass" —
// `scheduler.js`'s own header comment already anticipated exactly this
// (a second job "sharing this same infra later"), so there's no new
// scheduler capability to add here, only a second `registerJob` call
// using what 7.3c already built. Two independent jobs, two independent
// intervals, two independent overlap guards — `utils/scheduler.js`'s
// per-job `isRunning` flag means a slow notify-before-expiry tick can
// never block or skip an order-expiry tick (or vice versa); they don't
// interact at all beyond both existing on the same scheduler singleton.
//
// **Separate job name, separate env var, same default interval as
// `orderExpiryJob.js`**: `'notify-before-expiry'` (distinct from
// `'order-expiry'` — `scheduler.js`'s own `registerJob` throws on a
// duplicate name, so these could never collide even by accident) and
// `NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS` (distinct from
// `ORDER_EXPIRY_CHECK_INTERVAL_MS` — a deployment may reasonably want to
// poll for "approaching" orders on a different cadence than "already
// expired" ones). Defaults to the same one-minute
// `DEFAULT_CHECK_INTERVAL_MS` `orderExpiryJob.js` uses: `findOrdersApproachingExpiry`'s
// own approaching-window is itself a *fraction* of the timeout
// (`NOTIFY_LEAD_FRACTION = 0.2`, `notifyBeforeExpiry.js`'s own constant)
// rather than a fixed lead time, so there's no reason this job needs a
// tighter or looser poll than the expiry pass it runs alongside — the
// same one-minute cadence that keeps an expiry within ~7% of its actual
// deadline (per `orderExpiryJob.js`'s own reasoning) keeps a
// notification within the same margin of the start of its own
// approaching window.
//
// **Reuses `runNotifyBeforeExpiryPass`'s own result shape for logging,
// same "quiet on an uneventful tick" restraint `orderExpiryJob.js`
// applies** — only worth a log line when `notifiedCount`/`failedCount`
// is actually nonzero, not on every ordinary tick where nothing was
// approaching expiry.

const scheduler = require('../scheduler');
const { runNotifyBeforeExpiryPass } = require('./notifyBeforeExpiry');

const JOB_NAME = 'notify-before-expiry';
const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000;

const parsedIntervalMs = Number(process.env.NOTIFY_BEFORE_EXPIRY_CHECK_INTERVAL_MS);
const CHECK_INTERVAL_MS =
  Number.isInteger(parsedIntervalMs) && parsedIntervalMs > 0
    ? parsedIntervalMs
    : DEFAULT_CHECK_INTERVAL_MS;

async function handleTick() {
  const result = await runNotifyBeforeExpiryPass();

  if (result.notifiedCount > 0 || result.failedCount > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[notifyBeforeExpiry] pass complete — ${result.notifiedCount} notified, ` +
        `${result.skippedCount} skipped, ${result.failedCount} failed ` +
        `(of ${result.candidateCount} candidate(s))`
    );
  }

  return result;
}

scheduler.registerJob(JOB_NAME, CHECK_INTERVAL_MS, handleTick);

module.exports = { JOB_NAME, CHECK_INTERVAL_MS, handleTick };
