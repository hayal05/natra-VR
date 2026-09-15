// paymentMethod.routes.test.js — Task 1.16c
//
// Same approach as category.routes.test.js/serviceArea.routes.test.js
// (1.16a/b), plus coverage specific to this table's own decisions: no
// DELETE route exists at all, is_active toggles via PATCH as a boolean,
// and a non-boolean is_active is rejected.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const restaurants = require('../models/restaurants');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

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

const validMethod = {
  method_name: 'Telebirr',
  account_number: '0911223344',
  account_name: 'Test Restaurant',
};

describe('POST /api/payment-methods', () => {
  test('creates a payment method without setting is_active (left to the DB default)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/payment-methods').set(authHeader(token)).send(validMethod);

    expect(res.status).toBe(201);
    expect(res.body.payment_method).toMatchObject({ ...validMethod, restaurant_id: restaurantId });
    // is_active is never part of the INSERT on create (see
    // paymentMethodController.js's header comment) — real Oracle applies
    // its column DEFAULT (1) here, but fakeDb (utils/testUtils/fakeDb.js)
    // deliberately doesn't simulate DEFAULT clauses (it reads an unset
    // column back as null, not whatever the real schema's default is —
    // see its own header comment on why it's a narrow double, not a SQL
    // engine), so the checked-in-test-accurate assertion is null, not 1.
    // Caught by this session's own hand-verification pass expecting 1
    // and failing against fakeDb.
    expect(res.body.payment_method.is_active).toBeNull();
  });

  test('rejects a caller-supplied restaurant_id with 400 (.strict())', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/payment-methods')
      .set(authHeader(token))
      .send({ ...validMethod, restaurant_id: restaurantId + 999 });

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('payment_methods')).toHaveLength(0);
  });

  test('rejects a caller-supplied is_active on create too (.strict() — not in createPaymentMethodSchema)', async () => {
    const { token } = await createOwnerWithRestaurant();
    const res = await request(app)
      .post('/api/payment-methods')
      .set(authHeader(token))
      .send({ ...validMethod, is_active: false });
    expect(res.status).toBe(400);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/payment-methods').send(validMethod);
    expect(res.status).toBe(401);
  });

  test('rejects an admin with 403 (requireRestaurantScope guard)', async () => {
    const token = await createAdmin();
    const res = await request(app).post('/api/payment-methods').set(authHeader(token)).send(validMethod);
    expect(res.status).toBe(403);
    expect(fakeDb.__getRows('payment_methods')).toHaveLength(0);
  });
});

describe('GET /api/payment-methods', () => {
  test('lists only the caller\'s own payment methods', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await request(app).post('/api/payment-methods').set(authHeader(ownerA.token)).send(validMethod);
    await request(app)
      .post('/api/payment-methods')
      .set(authHeader(ownerB.token))
      .send({ ...validMethod, method_name: 'CBE Birr' });

    const res = await request(app).get('/api/payment-methods').set(authHeader(ownerA.token));

    expect(res.status).toBe(200);
    expect(res.body.payment_methods).toHaveLength(1);
    expect(res.body.payment_methods[0].method_name).toBe('Telebirr');
  });
});

describe('there is no DELETE route for payment methods', () => {
  test('DELETE /:id is not routed (404 from the app\'s own 404 handler, not a controller)', async () => {
    const { token } = await createOwnerWithRestaurant();
    const createRes = await request(app).post('/api/payment-methods').set(authHeader(token)).send(validMethod);

    const res = await request(app)
      .delete(`/api/payment-methods/${createRes.body.payment_method.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' }); // app.js's generic 404 handler, not ownershipMiddleware's 404
    expect(fakeDb.__getRows('payment_methods')).toHaveLength(1);
  });
});

describe('PATCH /api/payment-methods/:id', () => {
  async function createMethod(token) {
    const res = await request(app).post('/api/payment-methods').set(authHeader(token)).send(validMethod);
    return res.body.payment_method;
  }

  test('owner can update fields and toggle is_active (boolean in, 0/1 stored)', async () => {
    const { token } = await createOwnerWithRestaurant();
    const method = await createMethod(token);

    const res = await request(app)
      .patch(`/api/payment-methods/${method.id}`)
      .set(authHeader(token))
      .send({ is_active: false, instructions: 'Send to this number and upload the screenshot' });

    expect(res.status).toBe(200);
    expect(res.body.payment_method.is_active).toBe(0);
    expect(res.body.payment_method.instructions).toBe('Send to this number and upload the screenshot');
  });

  test('rejects a non-boolean is_active with 400', async () => {
    const { token } = await createOwnerWithRestaurant();
    const method = await createMethod(token);

    const res = await request(app)
      .patch(`/api/payment-methods/${method.id}`)
      .set(authHeader(token))
      .send({ is_active: 'true' });

    expect(res.status).toBe(400);
  });

  test('a different owner gets 404, not the row (cross-owner isolation)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const method = await createMethod(ownerA.token);

    const res = await request(app)
      .patch(`/api/payment-methods/${method.id}`)
      .set(authHeader(ownerB.token))
      .send({ is_active: false });

    expect(res.status).toBe(404);
    expect(fakeDb.__getRows('payment_methods')[0].is_active).toBe(1);
  });
});
