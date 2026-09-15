// authController unit tests — Tasks 1.12 (signup) + 1.13 (login/JWT) +
// 5.22 (PATCH /me, PATCH /me/password)
//
// Exercises `POST /api/auth/signup` and `POST /api/auth/login` end-to-end
// through Express (`supertest`, already a devDependency but unused until
// 1.12 — this is the first controller in the codebase) rather than
// calling the handlers directly, since a controller's whole job is
// req/res wiring on top of `models/users.js` (1.12) + `passwordHash`
// (1.11) + `jsonwebtoken` (1.13) — worth testing through the same layer a
// real request actually goes through.
//
// `../config/db` is mocked with the same fakeDb double crudFactory.test.js
// (1.3) uses, reset between tests. `passwordHash`/`jsonwebtoken` are NOT
// mocked — in an environment with bcrypt's native bindings actually
// installed this exercises the real hash/verify/sign round trip; see
// PROJECT_STATUS.md's 1.11/1.12/1.13 entries for this sandbox's standing
// caveat about that.
//
// fakeDb deliberately does not enforce `uq_users_email` the way the real
// migration (0006) does — it's not a general SQL engine (see its own file
// header). That's exactly why the pre-insert `findAll({ email })` check in
// authController.js exists and is what "rejects a duplicate email" below
// is actually testing; the `err.errorNum === 1` fallback for a real
// unique-constraint race is not exercisable against this fake.
//
// `JWT_SECRET` is set below rather than relying on `.env` — these tests
// shouldn't depend on a real `.env` file existing/being loaded, and
// `jwt.sign` throws immediately if the secret is undefined.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');
const jwt = require('jsonwebtoken');

const fakeDb = require('../config/db');
const createApp = require('../app');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

const validPayload = {
  role: 'owner',
  full_name: 'Abebe Bikila',
  email: 'abebe@example.com',
  phone: '0912345678',
  password: 'correct horse battery staple',
};

describe('POST /api/auth/signup', () => {
  test('creates a user and returns it without the password hash', async () => {
    const res = await request(app).post('/api/auth/signup').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      role: 'owner',
      full_name: 'Abebe Bikila',
      email: 'abebe@example.com',
      phone: '0912345678',
    });
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
    expect(typeof res.body.user.id).toBe('number');
  });

  test('stores a bcrypt hash, never the raw password', async () => {
    await request(app).post('/api/auth/signup').send(validPayload);

    const [row] = fakeDb.__getRows('users');
    expect(row.password_hash).toBeDefined();
    expect(row.password_hash).not.toBe(validPayload.password);
  });

  test('lowercases email before storing', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, email: 'Abebe@Example.com' });

    const [row] = fakeDb.__getRows('users');
    expect(row.email).toBe('abebe@example.com');
  });

  test('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send(validPayload);
    const res = await request(app).post('/api/auth/signup').send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
    expect(fakeDb.__getRows('users')).toHaveLength(1);
  });

  test('rejects a duplicate email regardless of casing', async () => {
    await request(app).post('/api/auth/signup').send(validPayload);
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, email: 'ABEBE@EXAMPLE.COM' });

    expect(res.status).toBe(409);
    expect(fakeDb.__getRows('users')).toHaveLength(1);
  });

  test.each([
    ['role', 'not-a-role'],
    ['email', 'not-an-email'],
    ['full_name', ''],
    ['phone', ''],
    ['password', 'short'],
    ['password', 'x'.repeat(73)],
  ])('rejects an invalid %s with 400', async (field, value) => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validPayload, [field]: value });

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('users')).toHaveLength(0);
  });

  test('rejects a missing required field with 400', async () => {
    const { password, ...incomplete } = validPayload;
    const res = await request(app).post('/api/auth/signup').send(incomplete);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(validPayload);
  });

  test('succeeds with correct credentials and returns a decodable token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: validPayload.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: validPayload.email, role: 'owner' });
    expect(res.body.user.password_hash).toBeUndefined();

    const decoded = jwt.decode(res.body.token);
    expect(decoded.role).toBe('owner');
    expect(typeof decoded.sub).toBe('number');
  });

  test('succeeds regardless of email casing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email.toUpperCase(), password: validPayload.password });

    expect(res.status).toBe(200);
  });

  test('rejects a wrong password with 401 and a generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: 'totally-wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  test('rejects an unknown email with the same 401 and message as a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: validPayload.password });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  test('rejects a missing password with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: validPayload.email });

    expect(res.status).toBe(400);
  });

  test('rejects an invalid email format with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: validPayload.password });

    expect(res.status).toBe(400);
  });
});

// Task 1.14d: GET /api/auth/me is the first route mounted behind
// authMiddleware (1.14a-c) — exercised here through the real Express app
// + supertest (the actual route wiring in auth.routes.js), which is a
// different layer than authMiddleware.test.js's direct function calls
// against authMiddleware/extractBearerToken/verifyToken. Both are worth
// having: that file proves the middleware's own logic in isolation, this
// one proves it's actually mounted and working through real HTTP + real
// Express routing/header parsing.
describe('GET /api/auth/me', () => {
  async function signupAndLogin() {
    await request(app).post('/api/auth/signup').send(validPayload);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: validPayload.password });
    return loginRes.body.token;
  }

  test('returns the logged-in user for a valid token', async () => {
    const token = await signupAndLogin();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: validPayload.email, role: 'owner' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('rejects a request with no Authorization header at all', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  test('rejects a request with a malformed Authorization header (no Bearer prefix)', async () => {
    const token = await signupAndLogin();

    const res = await request(app).get('/api/auth/me').set('Authorization', token);

    expect(res.status).toBe(401);
  });

  test('rejects a tampered/invalid token', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}not-actually-valid`);

    expect(res.status).toBe(401);
  });

  test('rejects a token for an account that no longer exists', async () => {
    const token = await signupAndLogin();
    const decoded = jwt.decode(token);
    fakeDb.__reset(); // simplest way to make decoded.sub no longer exist against this fake

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(decoded.sub).toEqual(expect.any(Number)); // sanity: token really did name a real id
  });
});

// Task 5.22: PATCH /api/auth/me — owner/admin editing their own
// full_name/email/phone. Same `signupAndLogin` helper shape the `GET
// /api/auth/me` block above already defines, duplicated locally rather
// than hoisted out — these `describe` blocks don't currently share any
// setup beyond `validPayload`/`app`/`fakeDb`, and hoisting one small
// helper for two call sites isn't worth losing each block's
// self-containedness.
describe('PATCH /api/auth/me', () => {
  async function signupAndLogin(payload = validPayload) {
    await request(app).post('/api/auth/signup').send(payload);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    return loginRes.body.token;
  }

  test('updates full_name/email/phone and returns the updated user without the hash', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Abebe B.', email: 'new-email@example.com', phone: '0911111111' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      full_name: 'Abebe B.',
      email: 'new-email@example.com',
      phone: '0911111111',
    });
    expect(res.body.user.password_hash).toBeUndefined();

    // Confirms the write actually persisted, not just echoed back.
    const meRes = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.body.user.email).toBe('new-email@example.com');
  });

  test('allows updating a single field without the others', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '0922222222' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ full_name: validPayload.full_name, phone: '0922222222' });
  });

  test('lowercases email before saving, same as signup', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'MixedCase@Example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('mixedcase@example.com');
  });

  test('re-submitting the same email the caller already has is not a conflict', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Still Abebe', email: validPayload.email });

    expect(res.status).toBe(200);
  });

  test('rejects an email already used by a different account', async () => {
    await signupAndLogin({ ...validPayload, email: 'taken@example.com' });
    const otherToken = await signupAndLogin({
      ...validPayload,
      email: 'someone-else@example.com',
    });

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ email: 'taken@example.com' });

    expect(res.status).toBe(409);
  });

  test('rejects an empty body', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('rejects an invalid email shape', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  test('rejects a request with no Authorization header, same as GET /me', async () => {
    const res = await request(app).patch('/api/auth/me').send({ full_name: 'Nope' });

    expect(res.status).toBe(401);
  });
});

// Task 5.22: PATCH /api/auth/me/password
describe('PATCH /api/auth/me/password', () => {
  async function signupAndLogin(payload = validPayload) {
    await request(app).post('/api/auth/signup').send(payload);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    return loginRes.body.token;
  }

  test('changes the password and the new one works on a subsequent login', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: validPayload.password, new_password: 'a whole new passphrase' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: 'a whole new passphrase' });
    expect(loginRes.status).toBe(200);

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: validPayload.password });
    expect(oldLoginRes.status).toBe(401);
  });

  test('rejects a wrong current password without changing anything', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: 'totally wrong', new_password: 'a whole new passphrase' });

    expect(res.status).toBe(401);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validPayload.email, password: validPayload.password });
    expect(loginRes.status).toBe(200);
  });

  test('rejects a new password shorter than the minimum', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ current_password: validPayload.password, new_password: 'short' });

    expect(res.status).toBe(400);
  });

  test('rejects a missing current_password', async () => {
    const token = await signupAndLogin();

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ new_password: 'a whole new passphrase' });

    expect(res.status).toBe(400);
  });

  test('rejects a request with no Authorization header', async () => {
    const res = await request(app)
      .patch('/api/auth/me/password')
      .send({ current_password: 'x', new_password: 'a whole new passphrase' });

    expect(res.status).toBe(401);
  });
});
