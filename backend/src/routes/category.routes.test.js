// category.routes.test.js — Task 1.16a
//
// Same approach as food.routes.test.js (1.15f): real Express app +
// supertest against the real routes/controller, fakeDb double for
// `../config/db`. Categories has no companion-row transaction to test
// separately (unlike foods/food_visibility, 1.15c) and only one real
// field (name), so this suite is shorter than 1.15f's, but still covers
// the full authMiddleware -> attachOwnerRestaurant -> ownershipMiddleware
// -> controller chain, cross-owner isolation, the requireRestaurantScope
// guard on the two collection routes (same gap 1.15f found for foods —
// baked into categoryController.js from the start this time), and the
// category-delete-with-foods-attached 409 (categoryController.js's own
// FK-safety check, since fk_foods_category_id has no ON DELETE clause).

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
const foodsCrud = require('../models/foods');

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

describe('POST /api/categories', () => {
  test('creates a category scoped to the caller\'s own restaurant', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/categories').set(authHeader(token)).send({ name: 'Drinks' });

    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Drinks', restaurant_id: restaurantId });
  });

  test('rejects a caller-supplied restaurant_id with 400 (.strict())', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/categories')
      .set(authHeader(token))
      .send({ name: 'Drinks', restaurant_id: restaurantId + 999 });

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('categories')).toHaveLength(0);
  });

  test('rejects an empty name with 400', async () => {
    const { token } = await createOwnerWithRestaurant();
    const res = await request(app).post('/api/categories').set(authHeader(token)).send({ name: '   ' });
    expect(res.status).toBe(400);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Drinks' });
    expect(res.status).toBe(401);
  });

  test('rejects an admin with 403 (requireRestaurantScope guard, same fix as 1.15f)', async () => {
    const token = await createAdmin();
    const res = await request(app).post('/api/categories').set(authHeader(token)).send({ name: 'Drinks' });
    expect(res.status).toBe(403);
    expect(fakeDb.__getRows('categories')).toHaveLength(0);
  });
});

describe('GET /api/categories', () => {
  test('lists only the caller\'s own categories', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await request(app).post('/api/categories').set(authHeader(ownerA.token)).send({ name: 'Mains' });
    await request(app).post('/api/categories').set(authHeader(ownerB.token)).send({ name: 'Sides' });

    const res = await request(app).get('/api/categories').set(authHeader(ownerA.token));

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].name).toBe('Mains');
  });

  test('rejects an admin with 403', async () => {
    const token = await createAdmin();
    const res = await request(app).get('/api/categories').set(authHeader(token));
    expect(res.status).toBe(403);
  });
});

describe('GET/PATCH/DELETE /api/categories/:id — ownership', () => {
  async function createCategory(token, name = 'Mains') {
    const res = await request(app).post('/api/categories').set(authHeader(token)).send({ name });
    return res.body.category;
  }

  test('owner can fetch/update/delete their own category', async () => {
    const { token } = await createOwnerWithRestaurant();
    const category = await createCategory(token);

    const getRes = await request(app).get(`/api/categories/${category.id}`).set(authHeader(token));
    expect(getRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/categories/${category.id}`)
      .set(authHeader(token))
      .send({ name: 'Renamed' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.category.name).toBe('Renamed');

    const delRes = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(token));
    expect(delRes.status).toBe(204);
    expect(fakeDb.__getRows('categories')).toHaveLength(0);
  });

  test('a different owner gets 404, not the row (cross-owner isolation)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const category = await createCategory(ownerA.token);

    const getRes = await request(app).get(`/api/categories/${category.id}`).set(authHeader(ownerB.token));
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/categories/${category.id}`)
      .set(authHeader(ownerB.token))
      .send({ name: 'Hijacked' });
    expect(patchRes.status).toBe(404);
    expect(fakeDb.__getRows('categories')[0].name).toBe('Mains');

    const delRes = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(ownerB.token));
    expect(delRes.status).toBe(404);
    expect(fakeDb.__getRows('categories')).toHaveLength(1);
  });

  test('deleting a category still assigned to a food is rejected with 409, not left to a DB error', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const category = await createCategory(token);
    await foodsCrud.create({ restaurant_id: restaurantId, category_id: category.id, name: 'Burger', price: 9.99 });

    const res = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(token));

    expect(res.status).toBe(409);
    expect(fakeDb.__getRows('categories')).toHaveLength(1);
  });
});
