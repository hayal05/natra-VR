// authMiddleware — Task 1.14
//
// Verifies a JWT from the Authorization header and attaches the
// authenticated user as req.user. Built in sub-steps (see docs/TASKS.md,
// 1.14a-f) so each lands as its own reviewable/testable piece:
//   1.14a (done) — extract + validate the Authorization header shape
//   1.14b (done) — jwt.verify the extracted token against JWT_SECRET
//   1.14c (done) — look up the decoded `sub` via users.findById,
//                  attach the public user row as req.user
//   1.14d (done) — mounted on the first protected route,
//                  GET /api/auth/me (backend/src/routes/auth.routes.js).
//                  See that file's header comment for the still-open
//                  req.user.restaurant_id gap ownershipMiddleware
//                  (Task 1.4) needs for owner-scoped tables — not solved
//                  by this task, flagged as a dependency for 1.15/1.16
//   1.14e (next) — unit tests for the full middleware
//   1.14f (next) — manual/integration verification + status update
//
// The assembled `authMiddleware` function (below) is mounted at
// GET /api/auth/me — see backend/src/routes/auth.routes.js.

const jwt = require('jsonwebtoken');

const { unauthorized } = require('../utils/errors');
const users = require('../models/users');
const { toPublicUser } = require('../controllers/authController');

const AUTH_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';

// One message for every way the header can be wrong (missing entirely,
// wrong auth scheme, or a Bearer prefix with nothing/whitespace after
// it) — same "don't let the error text tell a caller which part was
// wrong" instinct authController's login (1.13) already applies to bad
// credentials; there's no legitimate need for a caller to distinguish
// "you sent no header" from "you sent the wrong kind of header" here.
const MISSING_OR_MALFORMED_HEADER_MESSAGE = 'Authentication required';

/**
 * extractBearerToken(req) -> string
 *
 * Reads and validates the Authorization header, returning the raw token
 * string with the "Bearer " prefix stripped and surrounding whitespace
 * trimmed. Throws a 401 ApiError (via errors.js's `unauthorized`) for:
 *   - no Authorization header at all
 *   - a header that isn't a string (Node can hand back an array for a
 *     header sent multiple times; treated as malformed rather than
 *     picking one arbitrarily)
 *   - a header that doesn't use the "Bearer " scheme
 *   - a "Bearer " header with an empty/whitespace-only token
 *
 * Deliberately case-sensitive on the "Bearer " scheme name (per RFC
 * 6750), but NOT on the header *name* — Express/Node already normalize
 * incoming header names to lowercase (`req.headers` keys are always
 * lowercase), so reading `req.headers.authorization` handles
 * `Authorization`/`AUTHORIZATION`/etc for free. Header *values* are never
 * touched by Node, so "bearer xyz" (lowercase scheme) is correctly
 * rejected here rather than silently accepted.
 */
function extractBearerToken(req) {
  const header = req && req.headers && req.headers[AUTH_HEADER];

  if (!header || typeof header !== 'string') {
    throw unauthorized(MISSING_OR_MALFORMED_HEADER_MESSAGE);
  }

  if (!header.startsWith(BEARER_PREFIX)) {
    throw unauthorized(MISSING_OR_MALFORMED_HEADER_MESSAGE);
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw unauthorized(MISSING_OR_MALFORMED_HEADER_MESSAGE);
  }

  return token;
}

// One message for every way a token can fail verification (bad
// signature, malformed structure, expired, not-yet-valid) — same
// don't-leak-which-part-was-wrong reasoning as
// MISSING_OR_MALFORMED_HEADER_MESSAGE above and login's (1.13) generic
// credential error. Distinguishing "expired" from "tampered" in the
// response would hand an attacker probing with a forged/stale token a
// signal about how close their forgery got, for no legitimate benefit to
// a real caller (an expired token and a forged one both mean the same
// thing to a client: log in again).
const INVALID_TOKEN_MESSAGE = 'Invalid or expired token';

/**
 * verifyToken(token) -> decoded payload ({ sub, role, iat, exp })
 *
 * Verifies `token` (as returned by extractBearerToken above) against
 * `JWT_SECRET`, throwing a 401 ApiError for any verification failure —
 * bad signature, structurally malformed token, expired (`exp` in the
 * past), or not-yet-valid (`nbf` in the future, unused by this project's
 * own `signToken` in authController.js, but `jwt.verify` checks it
 * regardless if present).
 *
 * A missing `JWT_SECRET` is deliberately NOT folded into that same 401:
 * it means the server itself is misconfigured, not that the caller sent
 * a bad token, so it's left to throw a plain Error (surfacing as the
 * central error handler's generic 500) — same "a config/data bug should
 * surface loudly, not get disguised as a normal 4xx" reasoning
 * `verifyPassword` (1.11) applies to a missing/malformed stored password
 * hash.
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('authMiddleware: JWT_SECRET is not configured');
  }

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    // jwt.verify throws distinct classes for this (TokenExpiredError,
    // JsonWebTokenError for a bad signature/malformed structure,
    // NotBeforeError) — all collapsed to the same generic 401 here, per
    // INVALID_TOKEN_MESSAGE's reasoning above.
    throw unauthorized(INVALID_TOKEN_MESSAGE);
  }
}

/**
 * authMiddleware(req, res, next)
 *
 * The assembled Express middleware Task 1.14 exists to build: extracts +
 * validates the Authorization header (1.14a), verifies the token (1.14b),
 * then looks up the account it names and attaches it as `req.user`
 * (this step, 1.14c) before calling `next()`.
 *
 * Looks the user up by `decoded.sub` via `users.findById` (1.12's
 * crudFactory instance) rather than trusting the JWT's claims alone —
 * `findById` returns `null` for a missing row instead of throwing (see
 * crudFactory.js, 1.1), so a validly-signed token for a since-deleted
 * account is treated the same as any other invalid token (401), not as
 * a server error. This also means a token stays "live" against the DB
 * rather than being purely self-contained — a deliberate trade (one
 * extra query per authenticated request) in exchange for a deleted
 * account's outstanding tokens actually stopping working, not just
 * expiring on their own schedule.
 *
 * `req.user` is set to the same `toPublicUser` shape signup/login (1.12/
 * 1.13) already return to a client — never `password_hash` — reusing
 * that helper rather than re-implementing the same strip here.
 *
 * Does NOT attach `restaurant_id` — an owner's `users` row has no such
 * column (`restaurants.owner_id` points at `users.id`, not the other way
 * around; see docs/DB_SCHEMA.md). `ownershipMiddleware` (Task 1.4)
 * expects `req.user.restaurant_id` for owner-scoped tables like
 * foods/categories, so that gap is real and is called out again where
 * this middleware gets mounted (1.14d) as a dependency for whichever of
 * Task 1.15/1.16 first wires an owner-scoped route.
 */
async function authMiddleware(req, res, next) {
  try {
    const token = extractBearerToken(req);
    const decoded = verifyToken(token);

    const user = await users.findById(decoded.sub);
    if (!user) {
      // Same generic message as a bad/expired token (INVALID_TOKEN_MESSAGE)
      // — a token naming a deleted account shouldn't read differently to
      // the caller than an outright invalid one; both just mean "log in
      // again."
      throw unauthorized(INVALID_TOKEN_MESSAGE);
    }

    req.user = toPublicUser(user);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { extractBearerToken, verifyToken, authMiddleware };
