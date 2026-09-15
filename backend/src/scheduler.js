// scheduler singleton — Task 7.3c
//
// The one app-wide instance of `utils/scheduler.js`'s `createScheduler()`
// factory. `server.js` requires this (this task) purely to confirm the
// infra is wired at startup — no jobs are registered against it yet,
// since the order-expiry job's handler doesn't exist until Task 7.3d
// (the query) / 7.3e (the expiry action). A future job module (e.g.
// `services/orderExpiryJob.js`) will `require('./scheduler')` (from
// wherever it lives) and call `.registerJob(...)` itself at that
// module's own load time — which is exactly why `utils/scheduler.js`'s
// own header comment explains `registerJob()` begins ticking
// immediately rather than needing a separate `start()` called after
// every job is registered: this singleton has no fixed "all jobs are
// in, now go" moment for `server.js` to own: a late-`require()`d job
// file is enough on its own, whenever Task 7.3e adds one.
//
// A plain module-level singleton (same shape `config/db.js`'s own
// shared connection pool already uses), not another
// `crudFactory`/`statusTransition`-style per-call factory — there is
// exactly one running scheduler per backend process, unlike those two,
// where every caller reasonably wants its own independently configured
// instance.

const createScheduler = require('./utils/scheduler');

module.exports = createScheduler();
