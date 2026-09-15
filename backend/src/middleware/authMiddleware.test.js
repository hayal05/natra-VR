// authMiddleware.test.js — Tasks 1.14a + 1.14b + 1.14c + 1.14e
//
// Covers extractBearerToken (1.14a), verifyToken (1.14b), and the
// assembled authMiddleware (1.14c) end-to-end. `../config/db` is
// swapped for the hand-rolled in-memory fake
// (../utils/testUtils/fakeDb.js) via jest.mock, same approach
// crudFactory.test.js (1.3) uses, so the authMiddleware describe block
// below can create/delete real `users` rows through the real `users`
// model (1.12) with no live Oracle connection or network.
//
// The `extractBearerToken`/`verifyToken` describe blocks test those two
// helpers directly against every malformed-input shape each is
// responsible for; the `authMiddleware` describe block below then
// re-checks the same shapes one level up, through the assembled
// middleware, to confirm each one actually reaches next(err) as a 401
// — not just that the helper functions throw in isolation. Per
// docs/TASKS.md 1.14e: valid token attaches req.user; missing header,
// non-Bearer header, malformed token, invalid signature, expired token,
// and deleted-user token all reject with 401.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const jwt = require('jsonwebtoken');

const { extractBearerToken, verifyToken, authMiddleware } = require('./authMiddleware');
const users = require('../models/users');
const fakeDb = require('../config/db'); // the mocked module — same instance, plus __reset

const TEST_SECRET = 'test-jwt-secret-do-not-use-in-prod';

function reqWithAuthHeader(value) {
  // Only the one header this function reads matters; everything else on
  // a real Express req is irrelevant to extractBearerToken.
  return { headers: value === undefined ? {} : { authorization: value } };
}

describe('extractBearerToken', () => {
  test('returns the token from a well-formed Bearer header', () => {
    expect(extractBearerToken(reqWithAuthHeader('Bearer abc.def.ghi'))).toBe('abc.def.ghi');
  });

  test('trims incidental whitespace around the token', () => {
    expect(extractBearerToken(reqWithAuthHeader('Bearer   abc.def.ghi  '))).toBe('abc.def.ghi');
  });

  test('rejects a missing Authorization header entirely', () => {
    expect(() => extractBearerToken(reqWithAuthHeader(undefined))).toThrow(/authentication required/i);
  });

  test('rejects a request object with no headers at all', () => {
    expect(() => extractBearerToken({})).toThrow(/authentication required/i);
  });

  test('rejects an empty-string header', () => {
    expect(() => extractBearerToken(reqWithAuthHeader(''))).toThrow(/authentication required/i);
  });

  test('rejects a non-Bearer scheme (e.g. Basic auth)', () => {
    expect(() => extractBearerToken(reqWithAuthHeader('Basic dXNlcjpwYXNz'))).toThrow(
      /authentication required/i
    );
  });

  test('rejects a lowercase "bearer" scheme (case-sensitive per RFC 6750)', () => {
    expect(() => extractBearerToken(reqWithAuthHeader('bearer abc.def.ghi'))).toThrow(
      /authentication required/i
    );
  });

  test('rejects "Bearer" with no token after it', () => {
    expect(() => extractBearerToken(reqWithAuthHeader('Bearer'))).toThrow(/authentication required/i);
  });

  test('rejects "Bearer " with only whitespace after it', () => {
    expect(() => extractBearerToken(reqWithAuthHeader('Bearer    '))).toThrow(/authentication required/i);
  });

  test('rejects an array header value (sent multiple times) rather than picking one', () => {
    expect(() => extractBearerToken(reqWithAuthHeader(['Bearer abc', 'Bearer def']))).toThrow(
      /authentication required/i
    );
  });

  test('thrown error is a 401 ApiError', () => {
    try {
      extractBearerToken(reqWithAuthHeader(undefined));
      throw new Error('expected extractBearerToken to throw');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.publicMessage).toMatch(/authentication required/i);
    }
  });
});

describe('verifyToken', () => {
  const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    // Restore, don't just delete — a later suite in the same Jest worker
    // (e.g. authController.test.js) may rely on JWT_SECRET being set.
    if (ORIGINAL_JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
    }
  });

  test('returns the decoded payload for a validly signed token', () => {
    const token = jwt.sign({ sub: 42, role: 'owner' }, TEST_SECRET, { expiresIn: '1h' });

    const decoded = verifyToken(token);

    expect(decoded.sub).toBe(42);
    expect(decoded.role).toBe('owner');
  });

  test('rejects a token signed with a different secret', () => {
    const token = jwt.sign({ sub: 1, role: 'admin' }, 'a-completely-different-secret');

    expect(() => verifyToken(token)).toThrow(/invalid or expired token/i);
  });

  test('rejects an expired token', () => {
    const token = jwt.sign({ sub: 1, role: 'owner' }, TEST_SECRET, { expiresIn: -10 });

    expect(() => verifyToken(token)).toThrow(/invalid or expired token/i);
  });

  test('rejects a structurally malformed token string', () => {
    expect(() => verifyToken('not.a.real.jwt')).toThrow(/invalid or expired token/i);
  });

  test('rejects an empty string', () => {
    expect(() => verifyToken('')).toThrow(/invalid or expired token/i);
  });

  test('thrown verification error is a 401 ApiError', () => {
    try {
      verifyToken('garbage-token');
      throw new Error('expected verifyToken to throw');
    } catch (err) {
      expect(err.status).toBe(401);
      expect(err.publicMessage).toMatch(/invalid or expired token/i);
    }
  });

  test('throws a plain (non-ApiError) Error when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ sub: 1, role: 'owner' }, TEST_SECRET);

    try {
      verifyToken(token);
      throw new Error('expected verifyToken to throw');
    } catch (err) {
      expect(err.message).toMatch(/JWT_SECRET is not configured/);
      // Deliberately NOT an ApiError/401 — a missing secret is a server
      // misconfiguration, not a bad client token (see authMiddleware.js's
      // verifyToken header comment).
      expect(err.status).toBeUndefined();
    }
  });
});

describe('authMiddleware', () => {
  const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    fakeDb.__reset();
  });

  afterEach(() => {
    if (ORIGINAL_JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
    }
  });

  async function createTestUser(overrides = {}) {
    return users.create({
      role: 'owner',
      full_name: 'Test Owner',
      email: 'owner@example.test',
      phone: '+251911000000',
      password_hash: 'irrelevant-for-this-test',
      ...overrides,
    });
  }

  function buildReq(token) {
    return { headers: token === undefined ? {} : { authorization: `Bearer ${token}` } };
  }

  test('attaches req.user (public shape) and calls next() with no error for a valid token', async () => {
    const user = await createTestUser();
    const token = jwt.sign({ sub: user.id, role: user.role }, TEST_SECRET);
    const req = buildReq(token);
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // called with no arguments = success, Express convention
    expect(req.user).toMatchObject({ id: user.id, role: 'owner', email: 'owner@example.test' });
    expect(req.user.password_hash).toBeUndefined();
  });

  test('routes a missing Authorization header to next(err) as a 401, never throwing synchronously', async () => {
    const req = buildReq(undefined);
    const next = jest.fn();

    await expect(authMiddleware(req, {}, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(req.user).toBeUndefined();
  });

  test('routes a non-Bearer scheme header to next(err) as a 401', async () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.publicMessage).toMatch(/authentication required/i);
    expect(req.user).toBeUndefined();
  });

  test('routes a structurally malformed token to next(err) as a 401', async () => {
    const req = buildReq('not.a.real.jwt');
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.publicMessage).toMatch(/invalid or expired token/i);
    expect(req.user).toBeUndefined();
  });

  test('routes a token signed with the wrong secret to next(err) as a 401', async () => {
    const user = await createTestUser();
    const token = jwt.sign({ sub: user.id, role: user.role }, 'a-completely-different-secret');
    const req = buildReq(token);
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(req.user).toBeUndefined();
  });

  test('routes an expired token to next(err) as a 401', async () => {
    const user = await createTestUser();
    const token = jwt.sign({ sub: user.id, role: user.role }, TEST_SECRET, { expiresIn: -10 });
    const req = buildReq(token);
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.publicMessage).toMatch(/invalid or expired token/i);
    expect(req.user).toBeUndefined();
  });

  test('routes a token naming a since-deleted user to next(err) as a 401', async () => {
    const user = await createTestUser();
    const token = jwt.sign({ sub: user.id, role: user.role }, TEST_SECRET);
    await users.remove(user.id);
    const req = buildReq(token);
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.status).toBe(401);
    expect(err.publicMessage).toMatch(/invalid or expired token/i);
  });

  test('does not attach restaurant_id (a users row has no such column — see 1.14c gap)', async () => {
    const user = await createTestUser();
    const token = jwt.sign({ sub: user.id, role: user.role }, TEST_SECRET);
    const req = buildReq(token);
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(req.user.restaurant_id).toBeUndefined();
  });
});
