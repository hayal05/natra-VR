// Standalone dev script for Task 0.12 — confirms the Oracle Object Storage
// bucket + credentials are wired up correctly: uploads a small test object,
// downloads it back, verifies the bytes round-trip, then deletes it.
// Usage: npm run storage:test  (from backend/)
require('dotenv').config();

const { putObject, getObject, deleteObject } = require('../config/objectStorage');

async function main() {
  const objectName = `_healthcheck/connection-test-${Date.now()}.txt`;
  const payload = Buffer.from(`NATRA object storage test — ${new Date().toISOString()}`, 'utf8');

  console.log(`Uploading test object: ${objectName}`);
  await putObject(objectName, payload, 'text/plain');

  console.log('Downloading it back...');
  const downloaded = await getObject(objectName);

  if (!downloaded.equals(payload)) {
    throw new Error('Downloaded bytes did not match uploaded bytes.');
  }

  console.log('Deleting test object...');
  await deleteObject(objectName);

  console.log('NATRA Object Storage test: SUCCESS (upload, download, and byte match all passed)');
}

main().catch((err) => {
  console.error('NATRA Object Storage test: FAILED');
  console.error(`  ${err.message}`);
  process.exitCode = 1;
});
