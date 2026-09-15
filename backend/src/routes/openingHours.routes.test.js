// openingHours.routes.test.js — Task 1.16d
//
// Same approach as category.routes.test.js/serviceArea.routes.test.js/
// paymentMethod.routes.test.js (1.16a/b/c), plus coverage specific to
// this table's own decisions: no POST/DELETE routes exist at all, rows
// are seeded directly through the model (bypassing HTTP entirely, since
// there's no create route — see models/openingHours.js's header on the
// seeding gap), and is_closed/open_time/close_time consistency is
// checked against the merged row, not just the PATCH body.

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
const openingHoursCrud = require('../models/openingHours');

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

// No POST route exists to seed through — seed the model directly, same
// as a future seeding task would on restaurant creation.
async function seedWeek(restaurantId) {
  const rows = [];
  for (let day = 0; day < 7; day += 1) {
    // eslint-disable-next-line no-await-in-loop
    const row = await openingHoursCrud.create({
      restaurant_id: restaurantId,
      day_of_week: day,
      is_closed: 0,
      open_time: '09:00',
      close_time: '17:00',
    });
    rows.push(row);
  }
  return rows;
}

describe('GET /api/opening-hours', () => {
  test('lists only the caller\'s own rows, ordered by day_of_week', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await seedWeek(ownerA.restaurantId);
    await seedWeek(ownerB.restaurantId);

    const res = await request(app).get('/api/opening-hours').set(authHeader(ownerA.token));

    expect(res.status).toBe(200);
    expect(res.body.opening_hours).toHaveLength(7);
    expect(res.body.opening_hours.map((r) => r.day_of_week)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(res.body.opening_hours.every((r) => r.restaurant_id === ownerA.restaurantId)).toBe(true);
  });

  test('returns an empty list for a restaurant with no seeded rows yet (the flagged seeding gap)', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).get('/api/opening-hours').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.opening_hours).toEqual([]);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/opening-hours');
    expect(res.status).toBe(401);
  });

  test('rejects an admin with 403 (requireRestaurantScope guard)', async () => {
    const token = await createAdmin();
    const res = await request(app).get('/api/opening-hours').set(authHeader(token));
    expect(res.status).toBe(403);
  });
});

describe('there is no POST/DELETE route for opening hours', () => {
  test('POST / is not routed (404 from the app\'s own 404 handler)', async () => {
    const { token } = await createOwnerWithRestaurant();
    const res = await request(app)
      .post('/api/opening-hours')
      .set(authHeader(token))
      .send({ day_of_week: 0, is_closed: 0, open_time: '09:00', close_time: '17:00' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  test('DELETE /:id is not routed (404 from the app\'s own 404 handler)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .delete(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
    expect(fakeDb.__getRows('opening_hours')).toHaveLength(7);
  });
});

describe('PATCH /api/opening-hours/:id', () => {
  test('owner can toggle is_closed to true without providing times', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ is_closed: true });

    expect(res.status).toBe(200);
    expect(res.body.opening_hours.is_closed).toBe(1);
    // open_time/close_time untouched by this PATCH — merge logic doesn't
    // require them to be cleared, only that they aren't missing while
    // is_closed is (effectively) false.
    expect(res.body.opening_hours.open_time).toBe('09:00');
  });

  test('owner can update open_time/close_time together', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ open_time: '08:30', close_time: '20:00' });

    expect(res.status).toBe(200);
    expect(res.body.opening_hours.open_time).toBe('08:30');
    expect(res.body.opening_hours.close_time).toBe('20:00');
  });

  test('rejects setting is_closed=false while leaving close_time null (merged-state check)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);
    await openingHoursCrud.updateForOwner(monday.id, restaurantId, {
      is_closed: 1,
      open_time: null,
      close_time: null,
    });

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ is_closed: false, open_time: '09:00' });

    expect(res.status).toBe(400);
  });

  test('rejects a non-boolean is_closed with 400', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ is_closed: 'true' });

    expect(res.status).toBe(400);
  });

  test('rejects a malformed time string with 400', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ open_time: '9am' });

    expect(res.status).toBe(400);
  });

  test('rejects attempts to change day_of_week (.strict() — not in the update schema)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(token))
      .send({ day_of_week: 2 });

    expect(res.status).toBe(400);
  });

  test('a different owner gets 404, not the row (cross-owner isolation)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const [monday] = await seedWeek(ownerA.restaurantId);

    const res = await request(app)
      .patch(`/api/opening-hours/${monday.id}`)
      .set(authHeader(ownerB.token))
      .send({ is_closed: true });

    expect(res.status).toBe(404);
    expect(fakeDb.__getRows('opening_hours').find((r) => r.id === monday.id).is_closed).toBe(0);
  });
});
