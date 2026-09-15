const express = require('express');

const { withConnection } = require('../config/db');
const { putObject, getObject } = require('../config/objectStorage');

const router = express.Router();

// How long a single dependency check gets before we call it failed rather
// than hang the request indefinitely (e.g. a stalled TCP connection to a
// downed DB/bucket). Overridable via env for slower networks; 5s default
// is generous for a `SELECT ... FROM DUAL` / small object PUT+GET.
const HEALTH_CHECK_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_TIMEOUT_MS) || 5000;

// Fixed object name, overwritten on every check — deliberately NOT
// timestamped, so a health check being hit frequently (uptime monitors,
// load-balancer probes) doesn't leave a growing trail of objects in the
// bucket the way Task 0.12's test script's timestamped names would.
const STORAGE_HEALTH_OBJECT = '_healthcheck/live.txt';

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} check timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function checkDatabase() {
  const start = Date.now();
  try {
    await withTimeout(
      withConnection((connection) => connection.execute(`SELECT 1 FROM DUAL`)),
      HEALTH_CHECK_TIMEOUT_MS,
      'database'
    );
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'error', latencyMs: Date.now() - start, error: err.message };
  }
}

async function checkStorage() {
  const start = Date.now();
  try {
    const payload = Buffer.from(`NATRA health check — ${new Date().toISOString()}`, 'utf8');
    await withTimeout(
      putObject(STORAGE_HEALTH_OBJECT, payload, 'text/plain').then(() =>
        getObject(STORAGE_HEALTH_OBJECT)
      ),
      HEALTH_CHECK_TIMEOUT_MS,
      'storage'
    );
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return { status: 'error', latencyMs: Date.now() - start, error: err.message };
  }
}

// Full dependency check: runs DB and Object Storage checks in parallel
// (independent failures shouldn't wait on each other), returns 200 only
// if both are healthy, 503 otherwise — so a load balancer / uptime
// monitor (Task 9.10) can act on it directly instead of parsing the body.
router.get('/', async (req, res) => {
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  const allOk = database.status === 'ok' && storage.status === 'ok';

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'error',
    service: 'natra-backend',
    time: new Date().toISOString(),
    checks: { database, storage },
  });
});

module.exports = router;
