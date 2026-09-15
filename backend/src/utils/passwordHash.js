// passwordHash — Task 1.11
//
// Thin wrapper around `bcrypt` (already in package.json) for hashing and
// verifying owner/admin passwords before they hit `users.password_hash`
// (see docs/DB_SCHEMA.md — "bcrypt/argon2 hash, never plaintext").
// bcrypt was picked over argon2 here since it's the dependency the repo
// already ships with (no new package needed) and is more than adequate
// for this project's threat model; nothing about this module's shape is
// bcrypt-specific, so swapping to argon2 later would only touch this file.
//
// Deliberately NOT this module's job:
//   - deciding *when* to hash (signup, Task 1.12) or compare (login,
//     Task 1.13) — this only exposes the two primitives those endpoints
//     call
//   - session/token issuance after a successful verify — that's auth
//     middleware / login endpoint's job (Tasks 1.13/1.14)
//
// Uses bcrypt's async API (hash/compare), not the *Sync variants — this
// runs inside Express request handlers, and the sync calls would block
// the event loop for every signup/login under load. Callers (1.12/1.13)
// should `await` these rather than reaching for `hashSync`/`compareSync`.

const bcrypt = require('bcrypt');
const { badRequest, ApiError } = require('./errors');

const SALT_ROUNDS = 12;

function assertPlainPassword(plain) {
  if (typeof plain !== 'string' || plain.trim().length === 0) {
    throw badRequest('Password is required');
  }
}

// hashPassword(plain) -> Promise<string>
// Salts + hashes a plaintext password. Each call produces a different
// hash for the same input (bcrypt generates a fresh salt per call), so
// hashes are never compared with `===` — always go through
// verifyPassword/bcrypt.compare.
async function hashPassword(plain) {
  assertPlainPassword(plain);
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// verifyPassword(plain, hash) -> Promise<boolean>
// Compares a plaintext candidate against a stored bcrypt hash. Throws
// (rather than just returning false) if `hash` isn't a bcrypt hash at
// all — that's a caller bug (e.g. a row whose password was never hashed,
// or the wrong column passed in), not a wrong-password case, and should
// fail loudly instead of silently rejecting every login attempt for that
// row.
async function verifyPassword(plain, hash) {
  assertPlainPassword(plain);

  if (typeof hash !== 'string' || hash.trim().length === 0) {
    throw new ApiError(500, 'Stored password hash is missing or invalid', {
      cause: new Error('verifyPassword called with a non-hash value'),
    });
  }

  // bcrypt hashes always start with one of these version prefixes.
  // Anything else means the value in the DB isn't a bcrypt hash at all
  // (e.g. accidentally stored a plaintext password, or an argon2 hash
  // from a future migration) — surfacing that as a 500 here is much
  // easier to debug than a login that just always fails.
  if (!/^\$2[aby]?\$/.test(hash)) {
    throw new ApiError(500, 'Stored password hash is malformed', {
      cause: new Error(`Unrecognized hash format: ${hash.slice(0, 4)}...`),
    });
  }

  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword, SALT_ROUNDS };
