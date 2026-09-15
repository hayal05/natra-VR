// liveRequest.routes.test.js — Task 4.5d
//
// Route-level/integration tests for `POST /api/live-requests` — the full
// `app.js` stack (real Express + `supertest`, `fakeDb` double for
// `../config/db`, same approach every other routes suite in this repo
// uses). This suite's job is the seam `liveRequestController.js`'s own
// header comment (4.5c) names as not yet covered: that `authMiddleware`
// (1.14) -> `attachOwnerRestaurant` (1.15a) -> `createLiveRequestSchema`
// -> `submitLiveRequest` (4.5b) is really wired together on this real
// route, that an owner with no restaurant yet really 403s here the same
// way it does on `food.routes.js`'s collection routes, and that a valid
// request really flows all the way through to a `201` with both created
// rows. It deliberately does NOT re-litigate every business rule
// `submitLiveRequest.test.js` (4.5b) already covers in isolation (the fee
// being sourced from `admin_settings`, the already-pending rejection,
// transaction rollback) — one representative case of the already-pending
// rejection is included below just to confirm the controller surfaces it
// as the same clean 400 every other validation failure gets, not to
// re-verify the rule itself.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const adminSettings = require('../models/adminSettings');
const restaurants = require('../models/restaurants');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

// Same helper shape `food.routes.test.js` (1.15f) already established:
// sign up an owner, give them a restaurant, log in, hand back a token.
async function createOwnerWithRestaurant(overrides = {}) {
  const email = overrides.email || `owner-${Math.random().toString(36).slice(2)}@example.test`;
  const password = 'correct horse battery staple';

  const signupRes = await request(app).post('/api/auth/signup').send({
    role: 'owner',
    full_name: 'Test Owner',
    email,
    phone: '0911000000',
    password,
    ...overrides,
  });
  const userId = signupRes.body.user.id;

  const restaurant = await restaurants.create({
    owner_id: userId,
    name: 'Test Restaurant',
    phone: '0911000000',
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });

  return { token: loginRes.body.token, userId, restaurantId: restaurant.id };
}

async function createOwnerWithoutRestaurant() {
  const email = `owner-${Math.random().toString(36).slice(2)}@example.test`;
  const password = 'correct horse battery staple';
  await request(app).post('/api/auth/signup').send({
    role: 'owner',
    full_name: 'Restaurant-less Owner',
    email,
    phone: '0911000002',
    password,
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.token;
}

async function createAdmin() {
  const email = `admin-${Math.random().toString(36).slice(2)}@example.test`;
  const password = 'correct horse battery staple';
  await request(app).post('/api/auth/signup').send({
    role: 'admin',
    full_name: 'Test Admin',
    email,
    phone: '0911000001',
    password,
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.token;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function seedAdminSettings(overrides = {}) {
  return adminSettings.create({
    registration_fee_amount: 500,
    registration_method_name: 'Telebirr',
    registration_account_number: '0911223344',
    registration_account_name: 'NATRA',
    registration_instructions: null,
    ...overrides,
  });
}

const validBody = {
  payment_screenshot_url: 'https://example.com/registration-screenshot.png',
};

describe('POST /api/live-requests', () => {
  test('requires authentication — 401 with no Authorization header', async () => {
    await seedAdminSettings();
    const res = await request(app).post('/api/live-requests').send(validBody);
    expect(res.status).toBe(401);
  });

  test('requires authentication — 401 with a malformed token', async () => {
    await seedAdminSettings();
    const res = await request(app)
      .post('/api/live-requests')
      .set('Authorization', 'Bearer not-a-real-token')
      .send(validBody);
    expect(res.status).toBe(401);
  });

  test('403s an owner with no restaurant yet (attachOwnerRestaurant, 1.15a)', async () => {
    await seedAdminSettings();
    const token = await createOwnerWithoutRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);

    expect(res.status).toBe(403);
    // No live_requests row should have been created for a rejected request.
    expect(fakeDb.__getRows('live_requests')).toHaveLength(0);
  });

  // Unlike food.routes.js's collection routes (1.15f), this route has no
  // separate `requireRestaurantScope`-style 403 guard of its own — an
  // admin token has no `req.user.restaurant_id` for
  // `attachOwnerRestaurant` to resolve (it no-ops for a non-owner role,
  // same as it does for foods), so `restaurant_id` reaches
  // `submitLiveRequest` (4.5b) as `undefined`, which that function's own
  // `Number.isInteger` guard already rejects with a 400
  // ("restaurant_id is required") before any DB write happens. The end
  // result is the same fail-safe outcome as foods' 403 — an admin token
  // can never create a live_requests row for no restaurant — just
  // surfaced as a 400 (bad input) rather than a 403 (forbidden action),
  // since nothing in this route's own chain independently checks the
  // caller's role. Asserting the real 400 here rather than forcing a
  // 403 that would require adding a guard this task doesn't need.
  test('rejects an admin token with 400 (no restaurant to scope by) rather than creating anything', async () => {
    await seedAdminSettings();
    const token = await createAdmin();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('live_requests')).toHaveLength(0);
  });

  test('happy path: 201 with the created live_request and registration_payment, scoped to the caller\'s own restaurant', async () => {
    await seedAdminSettings({ registration_fee_amount: 750 });
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.live_request).toMatchObject({ restaurant_id: restaurantId });
    expect(typeof res.body.live_request.id).toBe('number');
    expect(res.body.registration_payment).toMatchObject({
      live_request_id: res.body.live_request.id,
      payment_screenshot_url: validBody.payment_screenshot_url,
    });
    // The fee is read server-side from admin_settings, never trusted
    // from the request body (4.5b) — confirmed end-to-end here too.
    expect(Number(res.body.registration_payment.amount)).toBe(750);
  });

  test('ignores/rejects a caller-supplied restaurant_id — .strict() rejects it with 400', async () => {
    await seedAdminSettings();
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send({ ...validBody, restaurant_id: restaurantId + 999 });

    expect(res.status).toBe(400);
  });

  test('.strict() rejects a caller-supplied amount', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send({ ...validBody, amount: 1 });

    expect(res.status).toBe(400);
  });

  test('.strict() rejects a caller-supplied status', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send({ ...validBody, status: 'approved' });

    expect(res.status).toBe(400);
  });

  test('400 on a missing payment_screenshot_url', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/live-requests').set(authHeader(token)).send({});

    expect(res.status).toBe(400);
  });

  test('400 on a non-URL payment_screenshot_url', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send({ payment_screenshot_url: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  test('400 on a payment_screenshot_url over the DB column\'s 500-character limit', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const overLong = `https://example.com/${'a'.repeat(500)}.png`;
    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send({ payment_screenshot_url: overLong });

    expect(res.status).toBe(400);
  });

  test('a restaurant already scoped to a pending request is rejected with a clean 400', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const first = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);
    expect(first.status).toBe(201);

    // fakeDb doesn't simulate `status`'s DB DEFAULT ('pending') the way
    // real Oracle does (same standing limitation submitLiveRequest.test.js,
    // 4.5b, already documents) — set it directly so this route-level test
    // can actually exercise the already-pending rejection.
    fakeDb
      .__getRows('live_requests')
      .find((r) => r.id === first.body.live_request.id).status = 'pending';

    const second = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);

    expect(second.status).toBe(400);
    expect(fakeDb.__getRows('live_requests')).toHaveLength(1);
  });
});

// Task 4.6 — GET /api/live-requests/latest, the read the pending-state
// screen drives itself off of.
describe('GET /api/live-requests/latest', () => {
  test('requires authentication — 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/live-requests/latest');
    expect(res.status).toBe(401);
  });

  test('403s an owner with no restaurant yet (attachOwnerRestaurant, 1.15a)', async () => {
    const token = await createOwnerWithoutRestaurant();
    const res = await request(app).get('/api/live-requests/latest').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  // Same reasoning the POST / suite's own comment gives for its
  // admin-token case: attachOwnerRestaurant no-ops for a non-owner role,
  // leaving req.user.restaurant_id unset — this handler's own
  // requireRestaurantScope is what turns that into a 403 here (rather
  // than a 400, since there's no request body/schema for a missing
  // field to fail on the way POST / has).
  test('403s an admin token (no restaurant to scope by)', async () => {
    const token = await createAdmin();
    const res = await request(app).get('/api/live-requests/latest').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  test('returns { live_request: null } for an owner who has not submitted one yet', async () => {
    const { token } = await createOwnerWithRestaurant();
    const res = await request(app).get('/api/live-requests/latest').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ live_request: null });
  });

  test('returns the single most recent request, not an older one', async () => {
    await seedAdminSettings();
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const first = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);
    expect(first.status).toBe(201);
    // A second request can only be submitted once the first is no
    // longer pending (submitLiveRequest.js's own already-pending rule)
    // — reject it directly, same fakeDb-default workaround the suite
    // above already uses, so a real second POST is possible.
    fakeDb
      .__getRows('live_requests')
      .find((r) => r.id === first.body.live_request.id).status = 'rejected';

    const second = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);
    expect(second.status).toBe(201);
    fakeDb
      .__getRows('live_requests')
      .find((r) => r.id === second.body.live_request.id).status = 'pending';

    const res = await request(app).get('/api/live-requests/latest').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.live_request).toMatchObject({
      id: second.body.live_request.id,
      restaurant_id: restaurantId,
      status: 'pending',
    });
  });

  test('never returns another restaurant\'s request', async () => {
    await seedAdminSettings();
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/live-requests')
      .set(authHeader(ownerA.token))
      .send(validBody);
    expect(res.status).toBe(201);

    const latestForB = await request(app)
      .get('/api/live-requests/latest')
      .set(authHeader(ownerB.token));
    expect(latestForB.status).toBe(200);
    expect(latestForB.body).toEqual({ live_request: null });
  });

  test('reflects an approved status once one is set (manual DB flip, Task 4.7\'s own scenario)', async () => {
    await seedAdminSettings();
    const { token } = await createOwnerWithRestaurant();

    const created = await request(app)
      .post('/api/live-requests')
      .set(authHeader(token))
      .send(validBody);
    expect(created.status).toBe(201);
    fakeDb
      .__getRows('live_requests')
      .find((r) => r.id === created.body.live_request.id).status = 'approved';

    const res = await request(app).get('/api/live-requests/latest').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.live_request.status).toBe('approved');
  });
});
