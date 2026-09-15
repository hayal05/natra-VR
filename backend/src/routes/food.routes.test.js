// food.routes.test.js — Task 1.15f
//
// Exercises `/api/foods` end-to-end through the real Express app +
// `supertest` (same approach `authController.test.js`, 1.12/1.13/1.14d,
// already uses for `/api/auth`) rather than calling `foodController.js`'s
// handlers directly — a route's whole job is wiring together
// `authMiddleware` (1.14) -> `attachOwnerRestaurant` (1.15a) ->
// `ownershipMiddleware` (1.4) -> the controller, and that chain is what's
// actually under test here, not any one middleware's internal logic in
// isolation (`authMiddleware.test.js`, `attachOwnerRestaurant.test.js`,
// and `createFoodWithVisibility.test.js` already cover those pieces on
// their own).
//
// `../config/db` is mocked with the same `fakeDb` double
// `crudFactory.test.js` (1.3) and every other DB-touching suite in this
// repo already uses, reset between tests. `JWT_SECRET` is set explicitly,
// same reasoning `authController.test.js` gives: these tests shouldn't
// depend on a real `.env`, and `jwt.sign` throws immediately without it.
//
// Deliberately NOT re-tested here (already covered elsewhere, see file
// headers above):
//   - authMiddleware's own 401 cases (missing/malformed header, bad
//     signature, expired, deleted-user token)     -> authMiddleware.test.js
//   - attachOwnerRestaurant's own 403/no-op cases  -> attachOwnerRestaurant.test.js
//   - the food+food_visibility transaction itself, including its
//     rollback-on-failure behavior                -> createFoodWithVisibility.test.js
// This file's job is the layer above all three: that the chain is wired
// in the right order on the right routes, that ownership actually gets
// enforced end-to-end (not just that the underlying middleware/crud
// functions work when called directly), and that 1.15e's validation
// schemas are actually reached from a real request.

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

// Signs an owner up, gives them a restaurant (attachOwnerRestaurant,
// 1.15a, correctly 403s an owner with none yet — that's real,
// intentional behavior exercised in its own describe block below, not
// something every other test here should also have to work around), logs
// in, and returns { token, userId, restaurantId } for a test to build on.
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

const validFood = {
  name: 'Doro Wat',
  description: 'Spicy chicken stew',
  price: 250.5,
  image_url: 'https://example.test/foods/doro-wat.jpg',
};

describe('POST /api/foods', () => {
  test('creates a food scoped to the caller\'s own restaurant', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    expect(res.status).toBe(201);
    expect(res.body.food).toMatchObject({
      name: 'Doro Wat',
      description: 'Spicy chicken stew',
      price: 250.5,
      restaurant_id: restaurantId,
    });
    expect(typeof res.body.food.id).toBe('number');
  });

  test('also creates the default (visible) food_visibility row (1.15c, exercised through the route)', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const visibilityRows = fakeDb.__getRows('food_visibility');
    expect(visibilityRows).toHaveLength(1);
    expect(visibilityRows[0]).toMatchObject({ food_id: res.body.food.id, is_hidden: 0 });
  });

  test('ignores/rejects a caller-supplied restaurant_id — always uses the authenticated owner\'s own (1.15e)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/foods')
      .set(authHeader(token))
      .send({ ...validFood, restaurant_id: restaurantId + 999 });

    // 1.15e's createFoodSchema is .strict(): a body-supplied restaurant_id
    // is rejected outright with a 400, not silently overridden.
    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('foods')).toHaveLength(0);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/foods').send(validFood);
    expect(res.status).toBe(401);
  });

  test('rejects an owner with no restaurant yet with 403 (attachOwnerRestaurant, 1.15a)', async () => {
    const email = 'no-restaurant-owner@example.test';
    const password = 'correct horse battery staple';
    await request(app).post('/api/auth/signup').send({
      role: 'owner',
      full_name: 'No Restaurant Yet',
      email,
      phone: '0911000002',
      password,
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });

    const res = await request(app)
      .post('/api/foods')
      .set(authHeader(loginRes.body.token))
      .send(validFood);

    expect(res.status).toBe(403);
  });

  test('rejects an admin with 403 (foods is owner-only; no restaurant to attach)', async () => {
    // Regression check: attachOwnerRestaurant (1.15a) deliberately no-ops
    // for a non-owner role rather than erroring, trusting a chained
    // ownershipMiddleware to 403 on the missing restaurant_id — but this
    // collection route has no :id for ownershipMiddleware to run against
    // at all. foodController.js's requireRestaurantScope guard (added
    // while writing this test suite, after finding this route would
    // otherwise insert a food with restaurant_id: undefined) is what
    // actually produces this 403.
    const token = await createAdmin();

    const res = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    expect(res.status).toBe(403);
  });

  test.each([
    ['missing name', { ...validFood, name: undefined }],
    ['empty name', { ...validFood, name: '   ' }],
    ['name too long', { ...validFood, name: 'x'.repeat(121) }],
    ['missing price', { ...validFood, price: undefined }],
    ['price as a string', { ...validFood, price: '250.50' }],
    ['zero price', { ...validFood, price: 0 }],
    ['negative price', { ...validFood, price: -5 }],
    ['price with 3 decimal places', { ...validFood, price: 12.345 }],
    ['price over the NUMBER(10,2) cap', { ...validFood, price: 100000000 }],
    ['non-integer category_id', { ...validFood, category_id: 1.5 }],
    ['negative category_id', { ...validFood, category_id: -1 }],
    ['malformed image_url', { ...validFood, image_url: 'not-a-url' }],
    ['description over 500 chars', { ...validFood, description: 'x'.repeat(501) }],
    ['an unrecognized field', { ...validFood, is_hidden: 1 }],
  ])('rejects %s with 400 and creates nothing', async (label, payload) => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).post('/api/foods').set(authHeader(token)).send(payload);

    expect(res.status).toBe(400);
    expect(fakeDb.__getRows('foods')).toHaveLength(0);
    expect(fakeDb.__getRows('food_visibility')).toHaveLength(0);
  });

  test('accepts explicit null for the nullable fields', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/foods')
      .set(authHeader(token))
      .send({ name: 'Shiro', price: 50, category_id: null, description: null, image_url: null });

    expect(res.status).toBe(201);
    expect(res.body.food.category_id).toBeNull();
  });
});

describe('GET /api/foods', () => {
  test('lists only the caller\'s own restaurant\'s foods, paginated', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();

    await request(app).post('/api/foods').set(authHeader(ownerA.token)).send(validFood);
    await request(app)
      .post('/api/foods')
      .set(authHeader(ownerA.token))
      .send({ ...validFood, name: 'Kitfo' });
    await request(app)
      .post('/api/foods')
      .set(authHeader(ownerB.token))
      .send({ ...validFood, name: 'Not Owner A\'s Food' });

    const res = await request(app).get('/api/foods').set(authHeader(ownerA.token));

    expect(res.status).toBe(200);
    expect(res.body.foods).toHaveLength(2);
    expect(res.body.foods.map((f) => f.name).sort()).toEqual(['Doro Wat', 'Kitfo']);
    expect(res.body.meta).toMatchObject({ total: 2 });
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/foods');
    expect(res.status).toBe(401);
  });

  test('rejects an admin with 403 rather than listing with an undefined scope', async () => {
    // Regression check for a real bug this test file caught while being
    // written: GET / and POST / are the two routes with no `:id`, so
    // they never chain `ownershipMiddleware` (Task 1.4) — the thing that
    // would otherwise 403 on a missing `req.user.restaurant_id`.
    // `foodController.js`'s `requireRestaurantScope` guard (added
    // alongside this test) is what makes this 403 instead of silently
    // querying `paginateForOwner` with an undefined owner id.
    const token = await createAdmin();

    const res = await request(app).get('/api/foods').set(authHeader(token));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/foods/:id', () => {
  test('returns a food the caller owns', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .get(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.food).toMatchObject({ id: created.body.food.id, name: 'Doro Wat' });
  });

  test('404s on another owner\'s food (ownershipMiddleware, 1.4, exercised through the route)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const created = await request(app)
      .post('/api/foods')
      .set(authHeader(ownerA.token))
      .send(validFood);

    const res = await request(app)
      .get(`/api/foods/${created.body.food.id}`)
      .set(authHeader(ownerB.token));

    expect(res.status).toBe(404);
  });

  test('404s on a nonexistent id, indistinguishably from another owner\'s food', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).get('/api/foods/999999').set(authHeader(token));

    expect(res.status).toBe(404);
  });

  test('400s on a non-numeric id', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app).get('/api/foods/not-a-number').set(authHeader(token));

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/foods/:id', () => {
  test('updates a food the caller owns', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token))
      .send({ price: 275.25 });

    expect(res.status).toBe(200);
    expect(res.body.food.price).toBe(275.25);
    expect(res.body.food.name).toBe('Doro Wat'); // untouched fields survive a partial update
  });

  test('clears category_id back to null via an explicit null', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app)
      .post('/api/foods')
      .set(authHeader(token))
      .send({ ...validFood, category_id: null });

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token))
      .send({ category_id: null });

    expect(res.status).toBe(200);
    expect(res.body.food.category_id).toBeNull();
  });

  test('404s on another owner\'s food rather than updating it', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const created = await request(app)
      .post('/api/foods')
      .set(authHeader(ownerA.token))
      .send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(ownerB.token))
      .send({ price: 1 });

    expect(res.status).toBe(404);
    const [row] = fakeDb.__getRows('foods');
    expect(row.price).toBe(250.5); // ownerB's attempt never touched it
  });

  test('rejects an empty update with 400 (1.15e)', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(400);
  });

  test('rejects an attempt to change restaurant_id via the body with 400 (1.15e)', async () => {
    const { token, restaurantId } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token))
      .send({ restaurant_id: restaurantId + 999 });

    expect(res.status).toBe(400);
  });

  test('rejects an invalid field value with 400 and leaves the row unchanged', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token))
      .send({ price: -10 });

    expect(res.status).toBe(400);
    const [row] = fakeDb.__getRows('foods');
    expect(row.price).toBe(250.5);
  });
});

describe('DELETE /api/foods/:id', () => {
  test('deletes a food the caller owns', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .delete(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(204);
    expect(fakeDb.__getRows('foods')).toHaveLength(0);
  });

  test('404s on another owner\'s food rather than deleting it', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const created = await request(app)
      .post('/api/foods')
      .set(authHeader(ownerA.token))
      .send(validFood);

    const res = await request(app)
      .delete(`/api/foods/${created.body.food.id}`)
      .set(authHeader(ownerB.token));

    expect(res.status).toBe(404);
    expect(fakeDb.__getRows('foods')).toHaveLength(1); // ownerA's food survives
  });
});

// Task 5.9a
describe('PATCH /api/foods/:id/visibility', () => {
  test('hides a food the caller owns, writing to its food_visibility row (not foods)', async () => {
    const { token, userId } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send({ is_hidden: true });

    expect(res.status).toBe(200);
    expect(res.body.food).toMatchObject({ id: created.body.food.id, is_hidden: 1 });

    const [visRow] = fakeDb.__getRows('food_visibility');
    expect(visRow).toMatchObject({
      food_id: created.body.food.id,
      is_hidden: 1,
      updated_by: userId,
    });
    // The underlying foods row itself is untouched by a visibility toggle.
    const [foodRow] = fakeDb.__getRows('foods');
    expect(foodRow.name).toBe('Doro Wat');
  });

  test('un-hides a previously hidden food', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);
    await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send({ is_hidden: true });

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send({ is_hidden: false });

    expect(res.status).toBe(200);
    expect(res.body.food.is_hidden).toBe(0);
  });

  test('404s on another owner\'s food rather than toggling it', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    const created = await request(app)
      .post('/api/foods')
      .set(authHeader(ownerA.token))
      .send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(ownerB.token))
      .send({ is_hidden: true });

    expect(res.status).toBe(404);
    const [visRow] = fakeDb.__getRows('food_visibility');
    expect(visRow.is_hidden).toBe(0); // ownerB's attempt never touched it
  });

  test.each([
    ['missing is_hidden', {}],
    ['is_hidden as a string', { is_hidden: 'true' }],
    ['is_hidden as a number', { is_hidden: 1 }],
  ])('rejects %s with 400 and leaves visibility unchanged', async (label, payload) => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send(payload);

    expect(res.status).toBe(400);
    const [visRow] = fakeDb.__getRows('food_visibility');
    expect(visRow.is_hidden).toBe(0);
  });

  test('rejects an unauthenticated request with 401', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .send({ is_hidden: true });

    expect(res.status).toBe(401);
  });
});

// Task 5.9a — GET responses (list + single) merge in food_visibility's
// is_hidden alongside the plain foods columns.
describe('GET /api/foods includes is_hidden (5.9a)', () => {
  test('list defaults every newly created food to is_hidden: 0', async () => {
    const { token } = await createOwnerWithRestaurant();
    await request(app).post('/api/foods').set(authHeader(token)).send(validFood);

    const res = await request(app).get('/api/foods').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.foods).toHaveLength(1);
    expect(res.body.foods[0].is_hidden).toBe(0);
  });

  test('list reflects a food hidden via the visibility route', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);
    await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send({ is_hidden: true });

    const res = await request(app).get('/api/foods').set(authHeader(token));

    expect(res.body.foods[0]).toMatchObject({ id: created.body.food.id, is_hidden: 1 });
  });

  test('single-food GET reflects the same is_hidden state', async () => {
    const { token } = await createOwnerWithRestaurant();
    const created = await request(app).post('/api/foods').set(authHeader(token)).send(validFood);
    await request(app)
      .patch(`/api/foods/${created.body.food.id}/visibility`)
      .set(authHeader(token))
      .send({ is_hidden: true });

    const res = await request(app)
      .get(`/api/foods/${created.body.food.id}`)
      .set(authHeader(token));

    expect(res.body.food).toMatchObject({ id: created.body.food.id, is_hidden: 1 });
  });
});
