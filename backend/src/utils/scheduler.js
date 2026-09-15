// scheduler — Task 7.3c
//
// The recurring-job infra Task 7.3's own line in docs/TASKS.md calls
// for: "a lightweight recurring job (`setInterval`-based service — no
// cron library exists in this codebase yet) started on backend
// startup." A generic factory, same shape/spirit as `statusTransition.js`
// (Task 1.7) or `crudFactory.js` (Task 1.1) — not tied to orders, even
// though the order-expiry job (Tasks 7.3d/7.3e) is the reason it exists
// right now. `docs/TASKS.md`'s 7.4c line ("Wire into 7.3c's scheduler
// loop alongside the expiry pass") already anticipates a second job
// (notify-before-expiry) sharing this same infra later, which is exactly
// why this isn't hard-coded to "the one order-expiry interval".
//
// **Deliberately NOT this module's job** (same separation of concerns
// `statusTransition.js`'s own header comment draws for itself):
//   - deciding *what* counts as an expired order, or *how* to expire one
//     — that's 7.3d's query and 7.3e's `updateOrderStatus` call
//   - reading `admin_settings.order_timeout_mode`/deciding the interval
//     for any specific job — that's the job's own handler's job, this
//     module only runs whatever handler it's given, on whatever interval
//     it's given
//   - actually registering the order-expiry job into an instance of this
//     scheduler and starting the app-wide singleton — that's server.js's
//     startup wiring (this task) plus 7.3e's own registration, not
//     something this factory does for its caller automatically
//
// **No `start()`/`stop()` pair, deliberately** — an earlier draft of
// this module had one (register jobs, then a separate `start()` call
// actually begins ticking them), but that creates an ordering
// requirement its only real caller (`server.js`) can't cleanly satisfy:
// 7.3c's own job (order expiry) doesn't exist as a requirable module
// yet, so server.js can't "register everything, then start" today — a
// future task's job file will `require()` the running singleton and
// register itself independently, at whatever point its own module loads.
// So instead, `registerJob()` begins ticking that specific job
// immediately (see `runImmediately` below) — each job's lifecycle is
// entirely self-contained from the moment it's registered, with no
// global "have all jobs been registered yet" state for a late-loading
// job file to worry about missing.
//
// **Overlap guard, per job**: if a job's own handler is still running
// (an unresolved Promise) when its next interval fires, that tick is
// skipped rather than starting a second concurrent run — 7.3e's future
// expiry pass will be doing real DB writes (transitioning orders), and
// two overlapping runs racing each other against the same rows is a
// bug this infra can rule out structurally rather than leaving every
// future job's handler to guard against it itself.
//
// **Error containment, per tick**: a handler that throws or rejects is
// caught and logged (`console.error`, same plain logging this codebase
// already uses elsewhere — e.g. `app.js`'s own error handler, `server.js`
// itself), never left to crash the process or stop that job's future
// ticks. A recurring job that silently stops running because one bad
// tick threw is a worse failure mode than one skipped/errored tick being
// logged and the schedule continuing.

const DEFAULT_RUN_IMMEDIATELY = true;

/**
 * @typedef {Object} RegisteredJob
 * @property {NodeJS.Timeout} intervalId
 * @property {number} intervalMs
 * @property {Function} handler
 * @property {boolean} isRunning - overlap guard; true while a tick's
 *   handler invocation is still in flight
 */

function createScheduler() {
  /** @type {Map<string, RegisteredJob>} */
  const jobs = new Map();

  /**
   * Wraps `handler` with the overlap guard + error containment described
   * above. Not exported — only ever called by `registerJob` itself,
   * both for the optional immediate first run and for every subsequent
   * `setInterval` tick.
   */
  function runTick(name, job) {
    if (job.isRunning) {
      // eslint-disable-next-line no-console
      console.error(
        `[scheduler] job "${name}" is still running from a previous tick — skipping this tick rather than overlapping`
      );
      return;
    }

    job.isRunning = true;
    Promise.resolve()
      .then(() => job.handler())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`[scheduler] job "${name}" threw:`, err);
      })
      .finally(() => {
        job.isRunning = false;
      });
  }

  /**
   * Registers a new recurring job and begins ticking it immediately —
   * there is no separate `start()` to call afterward (see this file's
   * own header comment for why). Registering a `name` that's already
   * registered throws rather than silently replacing it (same
   * "fail loud on a config mistake" philosophy `statusTransition.js`
   * already uses for its own construction-time validation) — a caller
   * meaning to change an existing job's interval/handler should
   * `unregisterJob` first, explicitly.
   *
   * @param {string} name - unique job name, used only for logging/lookup
   *   (`unregisterJob`, `getRegisteredJobNames`) — never touches the DB
   *   or anything job-specific itself.
   * @param {number} intervalMs - positive integer milliseconds between
   *   ticks.
   * @param {Function} handler - `() => any`, may be sync or return a
   *   Promise; either way its resolution/rejection is what the overlap
   *   guard and error containment above key off of. Receives no
   *   arguments — a job that needs configuration should close over it
   *   at registration time, not have this module thread anything through.
   * @param {Object} [options]
   * @param {boolean} [options.runImmediately=true] - if true (the
   *   default), the handler is also invoked once immediately at
   *   registration time, before the first full `intervalMs` elapses.
   *   Default `true` rather than `false` because a job like the future
   *   order-expiry pass (7.3e) should catch up on anything that went
   *   overdue while the backend process wasn't running, not wait a full
   *   interval after every restart before its first real check.
   */
  function registerJob(name, intervalMs, handler, options = {}) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('scheduler: "name" must be a non-empty string');
    }
    if (jobs.has(name)) {
      throw new Error(`scheduler: a job named "${name}" is already registered`);
    }
    if (!Number.isInteger(intervalMs) || intervalMs <= 0) {
      throw new Error('scheduler: "intervalMs" must be a positive integer');
    }
    if (typeof handler !== 'function') {
      throw new Error('scheduler: "handler" must be a function');
    }

    const runImmediately = options.runImmediately ?? DEFAULT_RUN_IMMEDIATELY;

    const job = { handler, intervalMs, isRunning: false, intervalId: null };
    job.intervalId = setInterval(() => runTick(name, job), intervalMs);
    jobs.set(name, job);

    if (runImmediately) {
      runTick(name, job);
    }

    return { name, intervalMs };
  }

  /**
   * Stops and forgets `name`. Returns `false` (not a throw) if no job by
   * that name is registered — same "an unrecognized name is a
   * reasonable, non-exceptional question" reasoning
   * `statusTransition.js`'s own `getAllowedTransitions` uses for an
   * unrecognized status. A job whose handler is mid-flight when this is
   * called finishes that invocation on its own (its Promise isn't
   * cancelled) but simply never ticks again afterward.
   */
  function unregisterJob(name) {
    const job = jobs.get(name);
    if (!job) return false;
    clearInterval(job.intervalId);
    jobs.delete(name);
    return true;
  }

  /**
   * Stops and forgets every registered job — mainly for tests (a clean
   * slate between specs, same reasoning `fakeDb.__reset()` serves
   * elsewhere in this codebase) and for a future graceful-shutdown path,
   * not currently called anywhere in `server.js` itself, since the
   * process is meant to keep every job running for its entire lifetime.
   */
  function stopAll() {
    for (const name of [...jobs.keys()]) {
      unregisterJob(name);
    }
  }

  function getRegisteredJobNames() {
    return [...jobs.keys()];
  }

  function isRegistered(name) {
    return jobs.has(name);
  }

  return {
    registerJob,
    unregisterJob,
    stopAll,
    getRegisteredJobNames,
    isRegistered,
  };
}

module.exports = createScheduler;
