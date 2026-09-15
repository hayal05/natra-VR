const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Hand-rolled OCI REST client — no `oci-sdk` dependency, matching the
// project's dependency policy elsewhere (see docs/PROJECT_STATUS.md):
// this integration only ever needs 3 endpoints (PUT/GET/DELETE object), so
// pulling in the full SDK isn't worth it. Implements OCI's "Signing Version
// 1" request signing directly: https://docs.oracle.com/iaas/Content/API/Concepts/signingrequests.htm

let cachedPrivateKey;

function loadPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;
  const keyPath = requireEnv('OCI_PRIVATE_KEY_PATH');
  cachedPrivateKey = fs.readFileSync(keyPath, 'utf8');
  return cachedPrivateKey;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name} (see backend/.env.example)`);
  }
  return value;
}

function host() {
  return `objectstorage.${requireEnv('OCI_REGION')}.oraclecloud.com`;
}

function objectPath(objectName) {
  const namespace = requireEnv('OCI_NAMESPACE');
  const bucket = requireEnv('OCI_BUCKET_NAME');
  return `/n/${namespace}/b/${bucket}/o/${encodeURIComponent(objectName)}`;
}

/**
 * Build the `Authorization` header value per OCI Signing Version 1.
 * `method` is upper-case (GET/PUT/DELETE); `bodyBuffer` is only used (and
 * only required) for requests that send a body, i.e. PUT.
 */
function buildAuthHeader({ method, path, headers }) {
  const tenancy = requireEnv('OCI_TENANCY');
  const user = requireEnv('OCI_USER');
  const fingerprint = requireEnv('OCI_FINGERPRINT');
  const keyId = `${tenancy}/${user}/${fingerprint}`;

  const headerNames =
    method === 'PUT'
      ? ['(request-target)', 'host', 'date', 'content-length', 'content-type', 'x-content-sha256']
      : ['(request-target)', 'host', 'date'];

  const signingString = headerNames
    .map((name) =>
      name === '(request-target)'
        ? `(request-target): ${method.toLowerCase()} ${path}`
        : `${name}: ${headers[name]}`
    )
    .join('\n');

  const signature = crypto
    .sign('RSA-SHA256', Buffer.from(signingString, 'utf8'), loadPrivateKey())
    .toString('base64');

  return (
    `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",` +
    `headers="${headerNames.join(' ')}",signature="${signature}"`
  );
}

function request({ method, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname: host(),
        path,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const responseBody = Buffer.concat(chunks);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: responseBody, headers: res.headers });
          } else {
            reject(
              new Error(
                `OCI Object Storage ${method} ${path} failed: ${res.statusCode} ${responseBody.toString(
                  'utf8'
                )}`
              )
            );
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Upload a buffer to Object Storage under `objectName`.
 */
async function putObject(objectName, buffer, contentType = 'application/octet-stream') {
  const path = objectPath(objectName);
  const dateHeader = new Date().toUTCString();
  const contentSha256 = crypto.createHash('sha256').update(buffer).digest('base64');

  const headers = {
    host: host(),
    date: dateHeader,
    'content-length': String(buffer.length),
    'content-type': contentType,
    'x-content-sha256': contentSha256,
  };
  headers.authorization = buildAuthHeader({ method: 'PUT', path, headers });

  return request({ method: 'PUT', path, headers, body: buffer });
}

/**
 * Download an object as a Buffer.
 */
async function getObject(objectName) {
  const path = objectPath(objectName);
  const headers = {
    host: host(),
    date: new Date().toUTCString(),
  };
  headers.authorization = buildAuthHeader({ method: 'GET', path, headers });

  const { body } = await request({ method: 'GET', path, headers });
  return body;
}

/**
 * Delete an object (used by the test script to clean up after itself).
 */
async function deleteObject(objectName) {
  const path = objectPath(objectName);
  const headers = {
    host: host(),
    date: new Date().toUTCString(),
  };
  headers.authorization = buildAuthHeader({ method: 'DELETE', path, headers });

  return request({ method: 'DELETE', path, headers });
}

/**
 * Build the URL for `objectName` for storage in a DB "_url" column — pure
 * string construction, no request made. Resolving in a browser requires the
 * bucket (or this specific object) to have public/pre-authenticated read
 * access; configuring that access is outside this client's scope (see
 * docs/PROJECT_STATUS.md Task 0.12).
 */
function getObjectUrl(objectName) {
  return `https://${host()}${objectPath(objectName)}`;
}

module.exports = { putObject, getObject, deleteObject, getObjectUrl };
