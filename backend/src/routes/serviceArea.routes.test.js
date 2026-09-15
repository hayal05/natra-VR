// serviceArea.routes.test.js — Task 1.16b
//
// Same approach as category.routes.test.js (1.16a): real Express app +
// supertest, fakeDb double. No FK-conflict case here (unlike
// categories) — nothing references service_areas.id (see
// models/serviceAreas.js's header comment).

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

describe('POST /api/service-areas', () => {
  test('creates a service area scoped to the caller\'s own restaurant', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/service-areas')
      .set(authHeader(token))
      .send({ area_name: 'Bole' });

    expect(res.status).toBe(201);
    expect(res.body.service_area).toMatchObject({ area_name: 'Bole', restaurant_id: restaurantId });
  });

  test('rejects a caller-supplied restaurant_id with 400 (.strict())', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/service-areas')
      .set(authHeader(token))
      .send({ area_name: 'Bole', restaurant_id: restaurantId + 999 });

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('service_areas')).toHaveLength(0);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/service-areas').send({ area_name: 'Bole' });
    expect(res.status).toBe(401);
  });

  test('rejects an admin with 403 (requireRestaurantScope guard)', async () => {
    const token = await createAdmin();
    const res = await request(app).post('/api/service-areas').set(authHeader(token)).send({ area_name: 'Bole' });
    expect(res.status).toBe(403);
    expect(fakeDb.__getRows('service_areas')).toHaveLength(0);
  });
});

describe('GET /api/service-areas', () => {
  test('lists only the caller\'s own service areas', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await request(app).post('/api/service-areas').set(authHeader(ownerA.token)).send({ area_name: 'Bole' });
    await request(app).post('/api/service-areas').set(authHeader(ownerB.token)).send({ area_name: 'Piassa' });

    const res = await request(app).get('/api/service-areas').set(authHeader(ownerA.token));

    expect(res.status).toBe(200);
    expect(res.body.service_areas).toHaveLength(1);
    expect(res.body.service_areas[0].area_name).toBe('Bole');
  });

  test('rejects an admin with 403', async () => {
    const token = await createAdmin();
    const res = await request(app).get('/api/service-areas').set(authHeader(token));
    expect(res.status).toBe(403);
  });
});

describe('GET/PATCH/DELETE /api/service-areas/:id — ownership', () => {
  async function createServiceArea(token, area_name = 'Bole') {
    const res = await request(app).post('/api/service-areas').set(authHeader(token)).send({ area_name });
    return res.body.service_area;
  }

  test('owner can fetch/update/delete their own service area', async () => {
    const { token } = await createOwnerWithRestaurant();
    const area = await createServiceArea(token);

    const getRes = await request(app).get(`/api/service-areas/${area.id}`).set(authHeader(token));
    expect(getRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/service-areas/${area.id}`)
      .set(authHeader(token))
      .send({ area_name: 'Bole Renamed' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.service_area.area_name).toBe('Bole Renamed');

    const delRes = await request(app).delete(`/api/service-areas/${area.id}`).set(authHeader(token));
    expect(delRes.status).toBe(204);
    expect(fakeDb.__getRows('service_areas')).toHaveLength(0);
  });

  test('a different owner gets 404, not the row (cross-owner isolation)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const area = await createServiceArea(ownerA.token);

    const getRes = await request(app).get(`/api/service-areas/${area.id}`).set(authHeader(ownerB.token));
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/service-areas/${area.id}`)
      .set(authHeader(ownerB.token))
      .send({ area_name: 'Hijacked' });
    expect(patchRes.status).toBe(404);
    expect(fakeDb.__getRows('service_areas')[0].area_name).toBe('Bole');

    const delRes = await request(app).delete(`/api/service-areas/${area.id}`).set(authHeader(ownerB.token));
    expect(delRes.status).toBe(404);
    expect(fakeDb.__getRows('service_areas')).toHaveLength(1);
  });
});
