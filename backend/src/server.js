require('dotenv').config();
const createApp = require('./app');
// Task 7.3c — importing this starts nothing by itself; it's the job
// module required just below (Task 7.3e) that actually registers
// something onto it. Required here purely so backend startup logs
// confirm the infra is present and ready, the same "log it, don't just
// silently import it" visibility this file's own `app.listen` callback
// already gives the port/env.
const scheduler = require('./scheduler');
// Task 7.3e — requiring this is what registers the order-expiry job onto
// the scheduler singleton above (see orderExpiryJob.js's own header
// comment for why this side effect lives in its own module rather than
// in orderExpiry.js itself). Must be required after `./scheduler` so the
// singleton it registers against already exists; order matters here,
// unlike most requires in this file.
require('./services/orderExpiryJob');
// Task 7.4c — same reasoning/ordering requirement as the require just
// above, for the second job sharing the same scheduler singleton (see
// notifyBeforeExpiryJob.js's own header comment).
require('./services/notifyBeforeExpiryJob');

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`NATRA backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(
    `[scheduler] ready — ${scheduler.getRegisteredJobNames().length} job(s) registered at startup`
  );
});
