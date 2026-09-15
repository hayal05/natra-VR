// order.routes.test.js — Task 3.15d
//
// Route-level/integration tests for `POST /api/orders` — the full
// `app.js` stack (real Express app + real `supertest`, `fakeDb` double
// for `../config/db`, same as every other routes suite, e.g.
// `restaurant.routes.test.js`, 3.3). Deliberately public: no
// `Authorization` header is ever sent, same point
// `restaurant.routes.test.js` already makes for its own routes.
//
// This suite's job is the seam `orderController.js`'s own unit-level
// verification (3.15c's own log entry) couldn't cover without a real
// `zod` install: that `createOrderSchema` really is wired into the real
// route, that a validation failure really does come back as an HTTP 400
// with the app's central error handler's `{ error }` shape (not just a
// `next(err)` call observed against a mock `res`), and that a valid
// request really does flow all the way through to `submitOrder` (3.15b)
// and back out as a 201. It deliberately does NOT re-verify every
// business rule `submitOrder.test.js` (3.15b) already covers in
// isolation (payment-method ownership/active checks, the order-code
// retry loop, transaction rollback, etc.) — one representative case of
// each (hidden food, cross-restaurant items) is included below just to
// confirm the controller actually surfaces `submitOrder`'s rejection as
// the same clean 400 the schema-validation failures get, not to
// re-litigate the business logic itself.

// JWT_SECRET is needed starting with the `GET /api/orders` (Task 5.12a)
// describe block below, which signs owners/admins up and logs them in —
// same reasoning `food.routes.test.js` (1.15f) already gives: these
// tests shouldn't depend on a real `.env`, and `jwt.sign` throws
// immediately without one. Set unconditionally here (harmless for the
// public-route suites above, which never touch auth) rather than only
// inside the new describe block, so it's set before `app.js`'s require
// graph (and anything it pulls in) ever runs.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const foods = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');
const paymentMethods = require('../models/paymentMethods');
const restaurants = require('../models/restaurants');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

// --- Fixture helpers (same shape as submitOrder.test.js, 3.15b) -------

const RESTAURANT_A = 1;
const RESTAURANT_B = 2;

async function seedFood({ restaurant_id = RESTAURANT_A, name = 'Doro Wat', price = 250, hidden = false } = {}) {
  const food = await foods.create({ restaurant_id, name, price, description: null, image_url: null });
  await foodVisibility.create({ food_id: food.id, is_hidden: hidden ? 1 : 0 });
  return food;
}

async function seedPaymentMethod({ restaurant_id = RESTAURANT_A, is_active = 1 } = {}) {
  return paymentMethods.create({
    restaurant_id,
    method_name: 'Telebirr',
    account_number: '0912345678',
    account_name: 'Test Restaurant',
    instructions: 'Send and upload a screenshot',
    is_active,
  });
}

function validBody(overrides = {}) {
  return {
    customer_name: 'Abebe Kebede',
    customer_phone: '0912 345 678',
    customer_location_text: 'Bole, behind Edna Mall',
    payment_screenshot_url: 'https://example.com/screenshot.png',
    ...overrides,
  };
}

describe('POST /api/orders', () => {
  test('requires no Authorization header at all', async () => {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 2 }] }));

    expect(res.status).toBe(201);
  });

  test('an Authorization header, if sent anyway, is simply ignored', async () => {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer not-a-real-token-at-all')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 2 }] }));

    expect(res.status).toBe(201);
  });

  test('happy path: 201 with the created order (including order_code) and items', async () => {
    const foodA = await seedFood({ name: 'Doro Wat', price: 250 });
    const foodB = await seedFood({ name: 'Kitfo', price: 180 });
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          customer_note: 'Ring the bell twice',
          payment_method_id: paymentMethod.id,
          items: [
            { food_id: foodA.id, quantity: 1 },
            { food_id: foodB.id, quantity: 3 },
          ],
        })
      );

    expect(res.status).toBe(201);
    // `status` isn't asserted here on purpose — `orders.status` is a DB
    // DEFAULT ('New', migration 0008), never in `orders.js`'s settable
    // `columns` (see that model's own header comment), and `fakeDb`
    // (this suite's double for `../config/db`) doesn't simulate column
    // DEFAULTs — same reason `submitOrder.test.js` (3.15b) never asserts
    // on it either. A real DB round trip is what actually confirms
    // `status` comes back as `'New'`.
    expect(res.body.order).toMatchObject({
      restaurant_id: RESTAURANT_A,
      customer_name: 'Abebe Kebede',
      customer_note: 'Ring the bell twice',
      subtotal: 250 + 180 * 3,
      total: 250 + 180 * 3,
    });
    expect(res.body.order.order_code).toMatch(/^NTR-\d{5}$/);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({ food_id: foodA.id, quantity: 1, line_total: 250 });
    expect(res.body.items[1]).toMatchObject({ food_id: foodB.id, quantity: 3, line_total: 540 });
  });

  test('customer_note is optional — a request without it still succeeds', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();
    const body = validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] });

    const res = await request(app).post('/api/orders').send(body);

    expect(res.status).toBe(201);
    expect(res.body.order.customer_note).toBeNull();
  });

  test.each([
    ['customer_name'],
    ['customer_phone'],
    ['customer_location_text'],
    ['payment_method_id'],
    ['payment_screenshot_url'],
    ['items'],
  ])('400s when %s is missing', async (field) => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();
    const body = validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] });
    delete body[field];

    const res = await request(app).post('/api/orders').send(body);

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  test('400s on an empty items array', async () => {
    const paymentMethod = await seedPaymentMethod();
    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [] }));

    expect(res.status).toBe(400);
  });

  test.each([
    ['subtotal', 999],
    ['total', 999],
    ['order_code', 'NTR-99999'],
    ['restaurant_id', RESTAURANT_A],
    ['status', 'Accepted'],
  ])('.strict() rejects a client-supplied %s', async (field, value) => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();
    const body = validBody({
      payment_method_id: paymentMethod.id,
      items: [{ food_id: food.id, quantity: 1 }],
      [field]: value,
    });

    const res = await request(app).post('/api/orders').send(body);

    expect(res.status).toBe(400);
  });

  test('.strict() rejects a client-supplied price on an item', async () => {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1, price: 0.01 }],
        })
      );

    expect(res.status).toBe(400);
  });

  test('400s on a non-integer quantity', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1.5 }] }));

    expect(res.status).toBe(400);
  });

  test('400s on a zero/negative quantity', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 0 }] }));

    expect(res.status).toBe(400);
  });

  test('400s on a non-integer payment_method_id', async () => {
    const food = await seedFood();

    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: 1.5, items: [{ food_id: food.id, quantity: 1 }] }));

    expect(res.status).toBe(400);
  });

  test('400s on a payment_screenshot_url that is not a valid URL', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
          payment_screenshot_url: 'not-a-url',
        })
      );

    expect(res.status).toBe(400);
  });

  test.each([
    ['customer_name', 'x'.repeat(121)],
    ['customer_phone', '1'.repeat(31)],
    ['customer_location_text', 'x'.repeat(256)],
    ['customer_note', 'x'.repeat(501)],
  ])('400s when %s exceeds its DB column length', async (field, value) => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();
    const body = validBody({
      payment_method_id: paymentMethod.id,
      items: [{ food_id: food.id, quantity: 1 }],
      [field]: value,
    });

    const res = await request(app).post('/api/orders').send(body);

    expect(res.status).toBe(400);
  });

  test('surfaces submitOrder\'s rejection of a hidden food as a clean 400', async () => {
    const food = await seedFood({ hidden: true });
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(validBody({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] }));

    expect(res.status).toBe(400);
  });

  test('surfaces submitOrder\'s rejection of cross-restaurant items as a clean 400', async () => {
    const foodA = await seedFood({ restaurant_id: RESTAURANT_A });
    const foodB = await seedFood({ restaurant_id: RESTAURANT_B });
    const paymentMethod = await seedPaymentMethod({ restaurant_id: RESTAURANT_A });

    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [
            { food_id: foodA.id, quantity: 1 },
            { food_id: foodB.id, quantity: 1 },
          ],
        })
      );

    expect(res.status).toBe(400);
  });

  test('normalizes customer_phone before storing it, same as submitOrder itself', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          customer_phone: '+251 91-234-5678',
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
        })
      );

    expect(res.status).toBe(201);
    expect(res.body.order.customer_phone).toBe('+251912345678');
  });

  test('GET is not a route on this router (no list endpoint yet)', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(404);
  });
});

// --- GET /api/orders/track — Task 3.17 -----------------------------------
//
// Reuses the same `POST /api/orders` flow above (via `placeOrder` below)
// to get a real order_code/customer_phone pair to track, rather than
// inserting directly via the `orders` model — that keeps these tests
// exercising the same "as a customer actually experiences it" path
// `restaurant.routes.test.js`'s own suites favor, and avoids this file
// needing to know `orders.create`'s column list separately from what
// `submitOrder.js` already writes.
describe('GET /api/orders/track', () => {
  async function placeOrder(overrides = {}) {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();
    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
          ...overrides,
        })
      );
    return res.body.order;
  }

  test('requires no Authorization header at all', async () => {
    const order = await placeOrder();

    const res = await request(app)
      .get('/api/orders/track')
      .query({ order_code: order.order_code, customer_phone: order.customer_phone });

    expect(res.status).toBe(200);
  });

  test('happy path: 200 with the order and its items', async () => {
    const order = await placeOrder({ customer_note: 'Leave at the gate' });

    const res = await request(app)
      .get('/api/orders/track')
      .query({ order_code: order.order_code, customer_phone: order.customer_phone });

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({
      id: order.id,
      order_code: order.order_code,
      customer_note: 'Leave at the gate',
    });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ order_id: order.id, quantity: 1 });
  });

  test('matches customer_phone loosely, same normalization submitOrder itself uses', async () => {
    // Stored via placeOrder()'s default '0912 345 678' (validBody), which
    // submitOrder (3.15b) normalizes to '0912345678' before writing —
    // typing it with different punctuation here should still match.
    const order = await placeOrder();

    const res = await request(app)
      .get('/api/orders/track')
      .query({ order_code: order.order_code, customer_phone: '0912-345-678' });

    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(order.id);
  });

  test('404s when the phone does not match the order_code, without revealing the code exists', async () => {
    const order = await placeOrder();

    const res = await request(app)
      .get('/api/orders/track')
      .query({ order_code: order.order_code, customer_phone: '0900000000' });

    expect(res.status).toBe(404);
  });

  test('404s for a nonexistent order_code', async () => {
    const res = await request(app)
      .get('/api/orders/track')
      .query({ order_code: 'NTR-00000', customer_phone: '0912345678' });

    expect(res.status).toBe(404);
  });

  test('400s when order_code is missing', async () => {
    const res = await request(app).get('/api/orders/track').query({ customer_phone: '0912345678' });
    expect(res.status).toBe(400);
  });

  test('400s when customer_phone is missing', async () => {
    const res = await request(app).get('/api/orders/track').query({ order_code: 'NTR-12345' });
    expect(res.status).toBe(400);
  });

  test('rejects an unknown query param the same way createOrderSchema rejects unknown body fields', async () => {
    const order = await placeOrder();

    const res = await request(app).get('/api/orders/track').query({
      order_code: order.order_code,
      customer_phone: order.customer_phone,
      status: 'Completed',
    });

    expect(res.status).toBe(400);
  });
});

// --- GET /api/orders/history — Task 3.18a --------------------------------
//
// Same `placeOrder` helper as the `/track` suite above, reused rather than
// duplicated — this suite's own job is the seam specific to `history`:
// that it returns *every* order for a phone (not just one), that it never
// 404s on a phone with zero orders (a list endpoint, not a single-record
// lookup like `/track`), and that pagination/validation are wired the same
// way every other paginated endpoint in this codebase already is.
describe('GET /api/orders/history', () => {
  async function placeOrder(overrides = {}) {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();
    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
          ...overrides,
        })
      );
    return res.body.order;
  }

  test('requires no Authorization header at all', async () => {
    const order = await placeOrder();

    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: order.customer_phone });

    expect(res.status).toBe(200);
  });

  test('happy path: 200 with every order for that phone, most recent first', async () => {
    const first = await placeOrder({ customer_phone: '0911111111' });
    const second = await placeOrder({ customer_phone: '0911111111' });
    // A different phone's order must not leak into the first phone's history.
    await placeOrder({ customer_phone: '0922222222' });

    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0911111111' });

    expect(res.status).toBe(200);
    expect(res.body.rows).toHaveLength(2);
    expect(res.body.rows.map((row) => row.id)).toEqual([second.id, first.id]);
    expect(res.body.meta).toMatchObject({ total: 2, page: 1 });
  });

  test('matches customer_phone loosely, same normalization submitOrder itself uses', async () => {
    const order = await placeOrder({ customer_phone: '0912 345 678' });

    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0912-345-678' });

    expect(res.status).toBe(200);
    expect(res.body.rows.map((row) => row.id)).toContain(order.id);
  });

  test('a phone with no orders gets a 200 with an empty list, never a 404', async () => {
    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0900000000' });

    expect(res.status).toBe(200);
    expect(res.body.rows).toEqual([]);
    expect(res.body.meta).toMatchObject({ total: 0, totalPages: 0 });
  });

  test('400s when customer_phone is missing', async () => {
    const res = await request(app).get('/api/orders/history').query({});
    expect(res.status).toBe(400);
  });

  test('paginates: limit=1 returns one row per page with correct meta', async () => {
    const first = await placeOrder({ customer_phone: '0933333333' });
    const second = await placeOrder({ customer_phone: '0933333333' });

    const page1 = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0933333333', limit: 1, page: 1 });
    expect(page1.status).toBe(200);
    expect(page1.body.rows).toHaveLength(1);
    expect(page1.body.rows[0].id).toBe(second.id);
    expect(page1.body.meta).toMatchObject({ total: 2, totalPages: 2, hasNextPage: true, hasPrevPage: false });

    const page2 = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0933333333', limit: 1, page: 2 });
    expect(page2.status).toBe(200);
    expect(page2.body.rows).toHaveLength(1);
    expect(page2.body.rows[0].id).toBe(first.id);
    expect(page2.body.meta).toMatchObject({ hasNextPage: false, hasPrevPage: true });
  });

  test('400s on a non-integer page', async () => {
    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: '0912345678', page: 'abc' });

    expect(res.status).toBe(400);
  });

  test('rejects an unknown query param the same way createOrderSchema rejects unknown body fields', async () => {
    const order = await placeOrder();

    const res = await request(app)
      .get('/api/orders/history')
      .query({ customer_phone: order.customer_phone, status: 'Completed' });

    expect(res.status).toBe(400);
  });
});

// --- GET /api/orders — Task 5.12a -----------------------------------------
//
// The first describe block in this file needing a real owner/admin
// auth lifecycle, same `createOwnerWithRestaurant`/`createAdmin` shape
// `food.routes.test.js` (1.15f) already established for exactly this —
// signs up + logs in a real owner (via the real `/api/auth` routes, not
// a hand-built token), gives them a real `restaurants` row so
// `attachOwnerRestaurant` (1.15a) resolves `restaurant_id` instead of
// 403ing on "no restaurant yet".
//
// Deliberately NOT re-tested here (already covered elsewhere):
//   - authMiddleware's own 401 cases (missing/malformed header, bad
//     signature, expired, deleted-user token)     -> authMiddleware.test.js
//   - attachOwnerRestaurant's own 403/no-op cases  -> attachOwnerRestaurant.test.js
//   - paginate()'s own edge cases (offset vs page, defaultLimit, etc.)
//                                                   -> paginate.test.js
// This suite's job is the seam those don't cover: that `GET /` is
// actually wired behind `authMiddleware` -> `attachOwnerRestaurant` on
// THIS router, that it's scoped to the caller's own restaurant end to
// end through a real HTTP request, and that the `requireRestaurantScope`
// 403 (orderController.js's own comment on why `list`/`create` need it)
// is reachable the same way it already is for `foods`/`categories`.
describe('GET /api/orders', () => {
  async function createOwnerWithRestaurant(overrides = {}) {
    const email = overrides.email || `orders-owner-${Math.random().toString(36).slice(2)}@example.test`;
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
    const email = `orders-admin-${Math.random().toString(36).slice(2)}@example.test`;
    const password = 'correct horse battery staple';
    await request(app).post('/api/auth/signup').send({
      role: 'admin',
      full_name: 'Test Admin',
      email,
      phone: '0911000001',
      password,
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    return { token: loginRes.body.token };
  }

  async function placeOrderFor(restaurantId, overrides = {}) {
    const food = await seedFood({ restaurant_id: restaurantId, price: 250 });
    const paymentMethod = await seedPaymentMethod({ restaurant_id: restaurantId });
    const res = await request(app)
      .post('/api/orders')
      .send(
        validBody({
          payment_method_id: paymentMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
          ...overrides,
        })
      );
    return res.body.order;
  }

  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  test('lists only the caller\'s own restaurant\'s orders, newest-first', async () => {
    const owner = await createOwnerWithRestaurant();
    const first = await placeOrderFor(owner.restaurantId, { customer_name: 'First' });
    const second = await placeOrderFor(owner.restaurantId, { customer_name: 'Second' });

    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    // id DESC — newest first (see orderController.list's own comment on
    // why `id`, not `created_at`, is the ordering column here).
    expect(res.body.orders[0].id).toBe(second.id);
    expect(res.body.orders[1].id).toBe(first.id);
    expect(res.body.meta).toMatchObject({ total: 2 });
  });

  test('cross-owner isolation: an owner never sees another restaurant\'s orders', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await placeOrderFor(ownerA.restaurantId, { customer_name: 'Belongs to A' });
    await placeOrderFor(ownerB.restaurantId, { customer_name: 'Belongs to B' });

    const resA = await request(app).get('/api/orders').set('Authorization', `Bearer ${ownerA.token}`);
    const resB = await request(app).get('/api/orders').set('Authorization', `Bearer ${ownerB.token}`);

    expect(resA.body.orders).toHaveLength(1);
    expect(resA.body.orders[0].customer_name).toBe('Belongs to A');
    expect(resB.body.orders).toHaveLength(1);
    expect(resB.body.orders[0].customer_name).toBe('Belongs to B');
  });

  test('a restaurant with no orders yet gets a clean empty array, not an error', async () => {
    const owner = await createOwnerWithRestaurant();

    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('paginates: limit=1 returns one row per page with correct meta', async () => {
    const owner = await createOwnerWithRestaurant();
    const first = await placeOrderFor(owner.restaurantId);
    const second = await placeOrderFor(owner.restaurantId);

    const page1 = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ limit: 1, page: 1 });
    expect(page1.body.orders).toHaveLength(1);
    expect(page1.body.orders[0].id).toBe(second.id);
    expect(page1.body.meta).toMatchObject({ total: 2, totalPages: 2, hasNextPage: true, hasPrevPage: false });

    const page2 = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ limit: 1, page: 2 });
    expect(page2.body.orders).toHaveLength(1);
    expect(page2.body.orders[0].id).toBe(first.id);
    expect(page2.body.meta).toMatchObject({ hasNextPage: false, hasPrevPage: true });
  });

  test('400s on a malformed limit', async () => {
    const owner = await createOwnerWithRestaurant();

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ limit: 'abc' });

    expect(res.status).toBe(400);
  });

  // requireRestaurantScope (orderController.js) — the same gap 1.15f
  // found for `foods`: `attachOwnerRestaurant` no-ops for a non-owner
  // role, and there's no `:id` on this collection route for
  // `ownershipMiddleware` to catch the resulting undefined scope, so
  // `list` has to guard against it itself.
  test('rejects an admin with 403 (no restaurant scope to list against)', async () => {
    const admin = await createAdmin();

    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(403);
  });

  // Same "authenticated, but no restaurant row yet" 403 attachOwnerRestaurant
  // (1.15a) already gives `foods`/`categories` for a brand-new owner who
  // hasn't completed Phase 4's registration/Live-request flow.
  test('rejects an owner with no restaurant row yet with 403', async () => {
    const email = `orders-owner-norest-${Math.random().toString(36).slice(2)}@example.test`;
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
      .get('/api/orders')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(403);
  });

  // --- GET /api/orders/:id — Task 5.13 -------------------------------
  //
  // Reuses this describe block's own `createOwnerWithRestaurant`/
  // `placeOrderFor` helpers (declared above) rather than duplicating
  // them — same "one auth-lifecycle-needing describe block per file"
  // shape `food.routes.test.js` (1.15f) already settled on for its own
  // `GET /:id`/`PATCH /:id` blocks sharing one outer `createOwnerWithRestaurant`.
  //
  // Deliberately NOT re-tested here (already covered elsewhere):
  //   - ownershipMiddleware's own 404/400 shape (missing/malformed id,
  //     another owner's resource, nonexistent id)  -> already exercised
  //     end-to-end for `foods` in food.routes.test.js's own `GET /:id`
  //     block; this suite's job is only confirming the exact same
  //     middleware, wired to `orders` instead, behaves identically
  //     through *this* route, not re-deriving ownershipMiddleware's own
  //     unit-level guarantees a second time.
  describe('GET /api/orders/:id', () => {
    test('returns the order, its items, and its payment method for the owning restaurant', async () => {
      const owner = await createOwnerWithRestaurant();
      const food = await seedFood({ restaurant_id: owner.restaurantId, name: 'Doro Wat', price: 250 });
      const paymentMethod = await seedPaymentMethod({ restaurant_id: owner.restaurantId });
      const createRes = await request(app)
        .post('/api/orders')
        .send(
          validBody({
            payment_method_id: paymentMethod.id,
            items: [{ food_id: food.id, quantity: 3 }],
          })
        );
      const orderId = createRes.body.order.id;

      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      // `status` isn't asserted here on purpose — same gap `POST /api/orders`'s
      // own tests above already flag (see that describe block's comment
      // above line ~132): `fakeDb` doesn't apply the DB-level `status`
      // DEFAULT 'New' the way real Oracle does, so it comes back `null`
      // here rather than `'New'`. Not this task's gap to fix.
      expect(res.status).toBe(200);
      expect(res.body.order).toMatchObject({
        id: orderId,
        customer_name: 'Abebe Kebede',
        customer_phone: expect.any(String),
        customer_location_text: 'Bole, behind Edna Mall',
        payment_screenshot_url: 'https://example.com/screenshot.png',
      });
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        food_name_snapshot: 'Doro Wat',
        quantity: 3,
        line_total: 750,
      });
      expect(res.body.payment_method).toMatchObject({
        id: paymentMethod.id,
        method_name: 'Telebirr',
      });
    });

    test('404s on another owner\'s order (ownershipMiddleware, 1.4, exercised through this route)', async () => {
      const ownerA = await createOwnerWithRestaurant();
      const ownerB = await createOwnerWithRestaurant();
      const order = await placeOrderFor(ownerA.restaurantId);

      const res = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${ownerB.token}`);

      expect(res.status).toBe(404);
    });

    test('404s on a nonexistent id, indistinguishably from another owner\'s order', async () => {
      const owner = await createOwnerWithRestaurant();

      const res = await request(app).get('/api/orders/999999').set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(404);
    });

    test('400s on a non-numeric id', async () => {
      const owner = await createOwnerWithRestaurant();

      const res = await request(app)
        .get('/api/orders/not-a-number')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(400);
    });

    test('requires an Authorization header (401 with none)', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);

      const res = await request(app).get(`/api/orders/${order.id}`);

      expect(res.status).toBe(401);
    });
  });

  // --- PATCH /api/orders/:id/status — Task 5.14a ----------------------
  //
  // Reuses this describe block's own `createOwnerWithRestaurant`/
  // `placeOrderFor` helpers, same as the `GET /api/orders/:id` block
  // above. `placeOrderFor` (via the real `POST /api/orders`) leaves a
  // fake row with `status: null`, not `'New'` — the same fakeDb-doesn't-
  // apply-the-DB-default gap that block's own first test already flags
  // — so every test below forces a real starting status through
  // `setOrderStatus` first, same "seed a known status explicitly" call
  // `services/updateOrderStatus.test.js` (5.14a) already makes for the
  // exact same reason.
  //
  // Deliberately NOT re-tested here (already covered elsewhere):
  //   - ownershipMiddleware's own 400/404 shape for a malformed/nonexistent/
  //     another-owner's id -> one representative 404 case below confirms
  //     this route is wired through the same `requireOwnedOrder` chain
  //     `GET /api/orders/:id` already exercises exhaustively; not
  //     re-deriving every one of those cases a second time here.
  describe('PATCH /api/orders/:id/status', () => {
    async function setOrderStatus(orderId, status) {
      await fakeDb.withConnection(async (connection) => {
        await connection.execute('UPDATE orders SET status = :status WHERE id = :id', {
          status,
          id: orderId,
        });
        await connection.commit();
      });
    }

    test('requires an Authorization header (401 with none)', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);

      const res = await request(app).patch(`/api/orders/${order.id}/status`).send({ status: 'Accepted' });

      expect(res.status).toBe(401);
    });

    test('accepts a New order', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Accepted' });

      expect(res.status).toBe(200);
      expect(res.body.order).toMatchObject({ id: order.id, status: 'Accepted' });
      expect(res.body.order.status_updated_at).toBeTruthy();
    });

    test('rejects a New order', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Rejected' });

      expect(res.status).toBe(200);
      expect(res.body.order).toMatchObject({ id: order.id, status: 'Rejected' });
    });

    test('409s re-accepting an already-Accepted order', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'Accepted');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Accepted' });

      expect(res.status).toBe(409);
    });

    // Task 5.15 — `updateStatusSchema` (orderController.js) widened to
    // allow `Completed`; `updateOrderStatus`'s own transitions map
    // already supported/tested `Accepted -> Completed` since 5.14a, so
    // this pins the schema-level gap that used to 400 it before it ever
    // reached that service.
    test('completes an Accepted order', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'Accepted');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Completed' });

      expect(res.status).toBe(200);
      expect(res.body.order).toMatchObject({ id: order.id, status: 'Completed' });
      expect(res.body.order.status_updated_at).toBeTruthy();
    });

    test('409s completing a New order directly (must be Accepted first)', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Completed' });

      expect(res.status).toBe(409);
    });

    test('409s re-completing an already-Completed order', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'Completed');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Completed' });

      expect(res.status).toBe(409);
    });

    test('400s on an unrecognized status value', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Bogus' });

      expect(res.status).toBe(400);
    });

    test('400s on an extra, unrecognized field (.strict())', async () => {
      const owner = await createOwnerWithRestaurant();
      const order = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'Accepted', note: 'not allowed' });

      expect(res.status).toBe(400);
    });

    test('404s on another owner\'s order', async () => {
      const ownerA = await createOwnerWithRestaurant();
      const ownerB = await createOwnerWithRestaurant();
      const order = await placeOrderFor(ownerA.restaurantId);
      await setOrderStatus(order.id, 'New');

      const res = await request(app)
        .patch(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${ownerB.token}`)
        .send({ status: 'Accepted' });

      expect(res.status).toBe(404);
    });
  });

  // --- GET /api/orders/counts — Task 5.17 -----------------------------
  //
  // Reuses this describe block's own `createOwnerWithRestaurant`/
  // `createAdmin`/`placeOrderFor` helpers, same as `GET /api/orders/:id`
  // and `PATCH /api/orders/:id/status` above. This is the routing/wiring
  // layer only (auth chain, response shape, cross-owner scoping) —
  // `orderCounts.test.js` (5.17) is the query-correctness layer, same
  // split `popularFoods.js`/`popularFoods.test.js` already established
  // between `customerFood.routes.test.js` and that file.
  //
  // Same `setOrderStatus` raw-UPDATE helper `PATCH /api/orders/:id/status`
  // above already needed and explains: `placeOrderFor` (via the real
  // `POST /api/orders`) leaves a fake row with `status: null`, not
  // `'New'` — `fakeDb` doesn't apply the DB-level `status` DEFAULT the
  // way real Oracle does — so every test that cares about a specific
  // status bucket forces it explicitly rather than trusting the insert.
  // Duplicated here rather than hoisted out of `describe('PATCH
  // /api/orders/:id/status')`, same "not worth a cross-describe-block
  // dependency for one small helper" reasoning this file's own
  // `formatPrice`/`formatDate`-style duplication already uses elsewhere
  // in this codebase's frontend screens.
  describe('GET /api/orders/counts', () => {
    async function setOrderStatus(orderId, status) {
      await fakeDb.withConnection(async (connection) => {
        await connection.execute('UPDATE orders SET status = :status WHERE id = :id', {
          status,
          id: orderId,
        });
        await connection.commit();
      });
    }

    test('requires an Authorization header (401 with none)', async () => {
      const res = await request(app).get('/api/orders/counts');

      expect(res.status).toBe(401);
    });

    // Same requireRestaurantScope gap `list`'s own test above pins —
    // there's no `:id` here for `ownershipMiddleware` to catch an
    // admin's undefined restaurant scope, so the controller guards it
    // itself. Also confirms the route registration order fix in
    // `order.routes.js`'s own comment: "counts" isn't swallowed as a
    // `:id` by `GET /:id` below it (which would 400 on a non-numeric id
    // instead of ever reaching this 403).
    test('rejects an admin with 403 (no restaurant scope)', async () => {
      const admin = await createAdmin();

      const res = await request(app).get('/api/orders/counts').set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(403);
    });

    test('a restaurant with no orders yet gets all-zero counts, not an error', async () => {
      const owner = await createOwnerWithRestaurant();

      const res = await request(app).get('/api/orders/counts').set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.counts).toEqual({ New: 0, Accepted: 0, Completed: 0, Rejected: 0, total: 0 });
    });

    test('summarizes counts per status plus a total, for the caller\'s own restaurant only', async () => {
      const owner = await createOwnerWithRestaurant();

      const newOrder1 = await placeOrderFor(owner.restaurantId);
      const newOrder2 = await placeOrderFor(owner.restaurantId);
      const acceptedOrder = await placeOrderFor(owner.restaurantId);
      const completedOrder = await placeOrderFor(owner.restaurantId);
      await setOrderStatus(newOrder1.id, 'New');
      await setOrderStatus(newOrder2.id, 'New');
      await setOrderStatus(acceptedOrder.id, 'Accepted');
      await setOrderStatus(completedOrder.id, 'Completed');

      const res = await request(app).get('/api/orders/counts').set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.counts).toEqual({ New: 2, Accepted: 1, Completed: 1, Rejected: 0, total: 4 });
    });

    test('cross-owner isolation: never counts another restaurant\'s orders', async () => {
      const ownerA = await createOwnerWithRestaurant();
      const ownerB = await createOwnerWithRestaurant();
      const orderA = await placeOrderFor(ownerA.restaurantId);
      const orderB1 = await placeOrderFor(ownerB.restaurantId);
      const orderB2 = await placeOrderFor(ownerB.restaurantId);
      await setOrderStatus(orderA.id, 'New');
      await setOrderStatus(orderB1.id, 'New');
      await setOrderStatus(orderB2.id, 'New');

      const resA = await request(app).get('/api/orders/counts').set('Authorization', `Bearer ${ownerA.token}`);
      const resB = await request(app).get('/api/orders/counts').set('Authorization', `Bearer ${ownerB.token}`);

      expect(resA.body.counts).toMatchObject({ New: 1, total: 1 });
      expect(resB.body.counts).toMatchObject({ New: 2, total: 2 });
    });
  });

  // --- GET /api/orders/sales-summary — Task 5.18a -----------------------
  //
  // Same split as `GET /api/orders/counts` above: this is the routing/
  // auth/cross-owner-scoping layer only, not query correctness (rounding,
  // today-bucketing) — that's `salesSummary.test.js`'s job. Reuses this
  // describe block's own `createOwnerWithRestaurant`/`createAdmin`/
  // `placeOrderFor` helpers.
  describe('GET /api/orders/sales-summary', () => {
    async function setOrder(orderId, { status, daysAgo } = {}) {
      await fakeDb.withConnection(async (connection) => {
        if (status !== undefined) {
          await connection.execute('UPDATE orders SET status = :status WHERE id = :id', {
            status,
            id: orderId,
          });
        }
        if (daysAgo !== undefined) {
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - daysAgo);
          await connection.execute('UPDATE orders SET created_at = :created_at WHERE id = :id', {
            created_at: createdAt.toISOString(),
            id: orderId,
          });
        }
        await connection.commit();
      });
    }

    test('requires an Authorization header (401 with none)', async () => {
      const res = await request(app).get('/api/orders/sales-summary');

      expect(res.status).toBe(401);
    });

    // Same requireRestaurantScope gap `counts`'s own test above pins, and
    // the same route-registration-order confirmation: "sales-summary"
    // isn't swallowed as a numeric `:id` by `GET /:id` below it.
    test('rejects an admin with 403 (no restaurant scope)', async () => {
      const admin = await createAdmin();

      const res = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(403);
    });

    test('a restaurant with no completed orders yet gets an all-zero summary, not an error', async () => {
      const owner = await createOwnerWithRestaurant();

      const res = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toEqual({ todayTotal: 0, allTimeTotal: 0, completedOrderCount: 0 });
    });

    // Non-Completed orders (New/Accepted/Rejected) never count as sales,
    // regardless of how old or recent they are.
    test('only counts Completed orders towards the summary', async () => {
      const owner = await createOwnerWithRestaurant();
      const newOrder = await placeOrderFor(owner.restaurantId);
      const acceptedOrder = await placeOrderFor(owner.restaurantId);
      const rejectedOrder = await placeOrderFor(owner.restaurantId);
      const completedOrder = await placeOrderFor(owner.restaurantId);
      await setOrder(newOrder.id, { status: 'New' });
      await setOrder(acceptedOrder.id, { status: 'Accepted' });
      await setOrder(rejectedOrder.id, { status: 'Rejected' });
      await setOrder(completedOrder.id, { status: 'Completed' });

      const res = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toEqual({
        todayTotal: completedOrder.total,
        allTimeTotal: completedOrder.total,
        completedOrderCount: 1,
      });
    });

    test('buckets today\'s and older completed orders correctly into todayTotal vs allTimeTotal', async () => {
      const owner = await createOwnerWithRestaurant();
      const oldOrder = await placeOrderFor(owner.restaurantId);
      const todayOrder1 = await placeOrderFor(owner.restaurantId);
      const todayOrder2 = await placeOrderFor(owner.restaurantId);
      await setOrder(oldOrder.id, { status: 'Completed', daysAgo: 3 });
      await setOrder(todayOrder1.id, { status: 'Completed' });
      await setOrder(todayOrder2.id, { status: 'Completed' });

      const res = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.todayTotal).toBe(todayOrder1.total + todayOrder2.total);
      expect(res.body.summary.allTimeTotal).toBe(
        oldOrder.total + todayOrder1.total + todayOrder2.total
      );
      expect(res.body.summary.completedOrderCount).toBe(3);
    });

    test('cross-owner isolation: never sums another restaurant\'s completed orders', async () => {
      const ownerA = await createOwnerWithRestaurant();
      const ownerB = await createOwnerWithRestaurant();
      const orderA = await placeOrderFor(ownerA.restaurantId);
      const orderB = await placeOrderFor(ownerB.restaurantId);
      await setOrder(orderA.id, { status: 'Completed' });
      await setOrder(orderB.id, { status: 'Completed' });

      const resA = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${ownerA.token}`);
      const resB = await request(app)
        .get('/api/orders/sales-summary')
        .set('Authorization', `Bearer ${ownerB.token}`);

      expect(resA.body.summary).toMatchObject({ completedOrderCount: 1, allTimeTotal: orderA.total });
      expect(resB.body.summary).toMatchObject({ completedOrderCount: 1, allTimeTotal: orderB.total });
    });
  });
});
