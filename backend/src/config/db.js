const oracledb = require('oracledb');

// Return objects as plain JS objects ({ col: value }) instead of arrays,
// everywhere in the app, not just in ad-hoc queries.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Autonomous DB always talks TLS via the wallet, and the driver's default
// "thin" mode (no Oracle Client install needed) supports that directly as
// long as ORACLE_WALLET_LOCATION points at the unzipped wallet folder and
// TNS_ADMIN is set to the same path (set below, not left to the caller).
if (process.env.ORACLE_WALLET_LOCATION) {
  process.env.TNS_ADMIN = process.env.ORACLE_WALLET_LOCATION;
}

let pool;

/**
 * Create (once) and return the shared connection pool. Safe to call many
 * times — later calls just return the already-created pool.
 */
async function initPool() {
  if (pool) return pool;

  const { ORACLE_DB_USER, ORACLE_DB_PASSWORD, ORACLE_DB_CONNECT_STRING } = process.env;

  if (!ORACLE_DB_USER || !ORACLE_DB_PASSWORD || !ORACLE_DB_CONNECT_STRING) {
    throw new Error(
      'Missing Oracle DB env vars: ORACLE_DB_USER, ORACLE_DB_PASSWORD, ' +
        'ORACLE_DB_CONNECT_STRING must all be set (see backend/.env.example).'
    );
  }

  pool = await oracledb.createPool({
    user: ORACLE_DB_USER,
    password: ORACLE_DB_PASSWORD,
    connectString: ORACLE_DB_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    // Autonomous DB drops idle connections server-side; ping before handing
    // a pooled connection back out so callers don't get a dead one.
    poolPingInterval: 60,
  });

  return pool;
}

/**
 * Borrow a connection from the pool, run `work(connection)`, and always
 * release the connection back to the pool afterwards — even on error.
 */
async function withConnection(work) {
  const activePool = await initPool();
  const connection = await activePool.getConnection();
  try {
    return await work(connection);
  } finally {
    await connection.close();
  }
}

/**
 * Borrow a connection from the pool and run `work(connection)` as a single
 * Oracle session, with no auto-commit in between — unlike `withConnection`,
 * which is meant for one-statement callers that commit themselves, this is
 * for a caller that needs several statements (e.g. two crudFactory
 * `create()` calls, passed this same `connection` via their `options`) to
 * either all land or none do. `work` is responsible for calling
 * `connection.commit()` itself once every statement has succeeded; if
 * `work` throws (including a failed commit), the transaction is rolled
 * back before the connection is released, so no partial write survives an
 * error. Introduced for Task 1.15c's food + food_visibility companion-row
 * insert; see `services/createFoodWithVisibility.js`.
 */
async function withTransaction(work) {
  const activePool = await initPool();
  const connection = await activePool.getConnection();
  try {
    return await work(connection);
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      // Rollback itself failed (e.g. the connection already dropped) —
      // surface the original error, not this secondary one. A connection
      // that can't roll back is also one poolPingInterval will weed out
      // before it's handed to another caller.
    }
    throw err;
  } finally {
    await connection.close();
  }
}

async function closePool() {
  if (!pool) return;
  await pool.close(10); // wait up to 10s for in-flight queries to finish
  pool = undefined;
}

module.exports = { initPool, withConnection, withTransaction, closePool };
