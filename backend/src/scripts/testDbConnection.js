// Standalone dev script for Task 0.11 — confirms the Oracle Autonomous DB
// env vars and wallet are wired up correctly, outside of the Express app.
// Usage: npm run db:test  (from backend/)
require('dotenv').config();

const { withConnection, closePool } = require('../config/db');

async function main() {
  const start = Date.now();

  const row = await withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT 'ok' AS status, SYSTIMESTAMP AS db_time FROM DUAL`
    );
    return result.rows[0];
  });

  const ms = Date.now() - start;
  console.log('NATRA DB connection test: SUCCESS');
  console.log(`  status:   ${row.STATUS}`);
  console.log(`  db_time:  ${row.DB_TIME}`);
  console.log(`  round-trip: ${ms}ms`);
}

main()
  .catch((err) => {
    console.error('NATRA DB connection test: FAILED');
    console.error(`  ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
