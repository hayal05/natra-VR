// admin.routes.test.js — Task 6.3a, extended by 6.4a, extended by 6.5a,
// extended by 6.6b, extended by 6.6c, extended by 6.11a, extended by
// 6.12a
//
// Route-level/integration tests for `GET /api/admin/dashboard-summary`
// (6.3a), `GET /api/admin/restaurants` (6.4a),
// `GET /api/admin/restaurants/:id` (6.5a),
// `GET /api/admin/live-requests` (6.6b),
// `GET /api/admin/live-requests/:id` (6.6c),
// `GET /api/admin/orders/:id` (6.11a), and
// `GET|PATCH /api/admin/settings` (6.12a) — real Express app +
// `supertest`, `fakeDb` double for `../config/db` (same approach every
// other routes suite in this repo uses) to exercise the real
// `authMiddleware` -> `requireAdmin` -> controller chain and a real
// signup/login flow for both roles.
//
// `services/adminDashboardSummary.js`, `services/adminRestaurantsList.js`,
// and `services/adminLiveRequestsList.js` are each separately mocked
// here — same split `order.routes.test.js`'s own "GET /api/orders/counts"
// section documents between itself and `orderCounts.test.js` (5.17): this
// suite is the routing/auth-wiring layer only, not the query-correctness
// layer (that's `adminDashboardSummary.test.js`/
// `adminRestaurantsList.test.js`/`adminLiveRequestsList.test.js`'s job —
// all three mock `../config/db` directly for exactly the reasons those
// files' own header comments give: hand-written joins/aggregates, a
// hand-written LIKE/OFFSET/FETCH query, and a hand-written three-table
// join respectively, none of which `fakeDb` can express). Mocking each
// service itself here, rather than trying to seed rows `fakeDb` could
// actually answer any of those queries against, is the only way to test
// these routes without duplicating any of those files' job.
// `adminLiveRequestsList.js` exports both a list and a detail read
// (6.6a/6.6c) — both are mocked here, same reasoning applied to each.
//
// `GET /restaurants/:id` (6.5a) is different: its controller has no
// service to mock at all — it calls `models/restaurants.js`'s
// crudFactory instance directly (`getOrThrow`), same as
// `restaurantController.js`'s own `getProfile`. So its own describe
// block below follows `restaurant.routes.test.js`'s precedent instead:
// real rows seeded straight through the (unmocked) `restaurants` model
// against `fakeDb`, not a jest.mock'd service.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const FAKE_SUMMARY = {
  totals: { restaurants: 5, live: 3, pending: 1, orders: 42 },
  recentActivity: [
    {
      type: 'order',
      id: 42,
      orderCode: 'NTR-00042',
      restaurantName: 'Habesha Kitchen',
      status: 'New',
      createdAt: '2026-09-12T09:00:00.000Z',
    },
  ],
};

const mockGetDashboardSummary = jest.fn();
jest.mock('../services/adminDashboardSummary', () => ({
  getDashboardSummary: (...args) => mockGetDashboardSummary(...args),
}));

const mockRecomputePopularityStats = jest.fn();
jest.mock('../services/popularityAggregation', () => ({
  recomputePopularityStats: (...args) => mockRecomputePopularityStats(...args),
}));

const FAKE_RESTAURANTS_PAGE = {
  rows: [{ id: 1, name: 'Habesha Kitchen', live_status: 'approved', is_suspended: 0 }],
  meta: {
    total: 1,
    limit: 20,
    offset: 0,
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const mockListRestaurantsForAdmin = jest.fn();
jest.mock('../services/adminRestaurantsList', () => ({
  listRestaurantsForAdmin: (...args) => mockListRestaurantsForAdmin(...args),
}));

const FAKE_LIVE_REQUESTS_PAGE = {
  rows: [
    {
      id: 1,
      restaurant_id: 5,
      restaurant_name: 'Habesha Kitchen',
      status: 'pending',
      created_at: '2026-09-01T10:00:00.000Z',
      amount: 500,
      payment_screenshot_url: 'https://example.com/screenshot.jpg',
      submitted_at: '2026-09-01T10:01:00.000Z',
    },
  ],
  meta: {
    total: 1,
    limit: 20,
    offset: 0,
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const mockListLiveRequestsForAdmin = jest.fn();
const mockGetLiveRequestForAdmin = jest.fn();
jest.mock('../services/adminLiveRequestsList', () => ({
  listLiveRequestsForAdmin: (...args) => mockListLiveRequestsForAdmin(...args),
  getLiveRequestForAdmin: (...args) => mockGetLiveRequestForAdmin(...args),
}));

const FAKE_LIVE_REQUEST_DETAIL = {
  id: 1,
  restaurant_id: 5,
  restaurant_name: 'Habesha Kitchen',
  status: 'pending',
  created_at: '2026-09-01T10:00:00.000Z',
  amount: 500,
  payment_screenshot_url: 'https://example.com/screenshot.jpg',
  submitted_at: '2026-09-01T10:01:00.000Z',
};

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const restaurants = require('../models/restaurants');
const foods = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');
const paymentMethods = require('../models/paymentMethods');
const adminSettings = require('../models/adminSettings');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
  mockGetDashboardSummary.mockReset();
  mockGetDashboardSummary.mockResolvedValue(FAKE_SUMMARY);
  mockListRestaurantsForAdmin.mockReset();
  mockListRestaurantsForAdmin.mockResolvedValue(FAKE_RESTAURANTS_PAGE);
  mockListLiveRequestsForAdmin.mockReset();
  mockListLiveRequestsForAdmin.mockResolvedValue(FAKE_LIVE_REQUESTS_PAGE);
  mockGetLiveRequestForAdmin.mockReset();
  mockGetLiveRequestForAdmin.mockResolvedValue(FAKE_LIVE_REQUEST_DETAIL);
  mockRecomputePopularityStats.mockReset();
  mockRecomputePopularityStats.mockResolvedValue(undefined);
});

// Same helper shape `liveRequest.routes.test.js` (4.5d) already
// established: sign up, log in, hand back a token.
async function createOwner() {
  const email = `owner-${Math.random().toString(36).slice(2)}@example.test`;
  const password = 'correct horse battery staple';
  await request(app).post('/api/auth/signup').send({
    role: 'owner',
    full_name: 'Test Owner',
    email,
    phone: '0911000000',
    password,
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return loginRes.body.token;
}

// Same "create straight through the model, not a real onboarding flow"
// shape `restaurant.routes.test.js`'s own `makeRestaurant` uses — this
// suite needs full control over `live_status`/`is_suspended` too (an
// admin viewing a pending/rejected/suspended restaurant is exactly
// 6.5a's own "not just Live ones" point), and no real signup-to-Live
// flow exists in this codebase to seed one through anyway.
function makeRestaurant(overrides = {}) {
  return restaurants.create({
    owner_id: 1,
    name: 'Test Restaurant',
    phone: '0911000000',
    live_status: 'approved',
    is_suspended: 0,
    is_open: 1,
    ...overrides,
  });
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

// --- Fixture helpers for `GET /api/admin/orders/:id` (Task 6.11a) -----
//
// Same "place a real order through the real, public `POST /api/orders`"
// approach `order.routes.test.js`'s own `GET /api/orders/:id` block
// (5.13d) already uses, rather than seeding an `orders` row directly —
// that route is what actually computes `total`/`order_code`/the
// `order_items` snapshot fields this describe block's own assertions
// check, so this exercises the real shape 6.11a's response is meant to
// match, not a hand-built fixture that could quietly drift from it.
async function seedFood({ restaurant_id, name = 'Doro Wat', price = 250 } = {}) {
  const food = await foods.create({ restaurant_id, name, price, description: null, image_url: null });
  await foodVisibility.create({ food_id: food.id, is_hidden: 0 });
  return food;
}

async function seedPaymentMethod({ restaurant_id } = {}) {
  return paymentMethods.create({
    restaurant_id,
    method_name: 'Telebirr',
    account_number: '0912345678',
    account_name: 'Test Restaurant',
    instructions: 'Send and upload a screenshot',
    is_active: 1,
  });
}

async function placeOrderFor(restaurantId, overrides = {}) {
  const food = await seedFood({ restaurant_id: restaurantId });
  const paymentMethod = await seedPaymentMethod({ restaurant_id: restaurantId });
  const res = await request(app)
    .post('/api/orders')
    .send({
      customer_name: 'Abebe Kebede',
      customer_phone: '0912345678',
      customer_location_text: 'Bole, behind Edna Mall',
      payment_screenshot_url: 'https://example.com/screenshot.png',
      payment_method_id: paymentMethod.id,
      items: [{ food_id: food.id, quantity: 3 }],
      ...overrides,
    });
  return { order: res.body.order, food, paymentMethod };
}

describe('GET /api/admin/dashboard-summary', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/admin/dashboard-summary');

    expect(res.status).toBe(401);
    expect(mockGetDashboardSummary).not.toHaveBeenCalled();
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const token = await createOwner();

    const res = await request(app)
      .get('/api/admin/dashboard-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(mockGetDashboardSummary).not.toHaveBeenCalled();
  });

  test('an admin gets 200 with the service\'s summary shape, unmodified', async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/dashboard-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(FAKE_SUMMARY);
    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(1);
  });

  test('a service-layer failure surfaces as a 500 via the central error handler, not an unhandled rejection', async () => {
    mockGetDashboardSummary.mockRejectedValue(new Error('DB unavailable'));
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/dashboard-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/admin/restaurants', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/admin/restaurants');

    expect(res.status).toBe(401);
    expect(mockListRestaurantsForAdmin).not.toHaveBeenCalled();
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const token = await createOwner();

    const res = await request(app)
      .get('/api/admin/restaurants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(mockListRestaurantsForAdmin).not.toHaveBeenCalled();
  });

  test("an admin gets 200 with the service's { rows, meta } reshaped into { restaurants, meta }", async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/restaurants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      restaurants: FAKE_RESTAURANTS_PAGE.rows,
      meta: FAKE_RESTAURANTS_PAGE.meta,
    });
    expect(mockListRestaurantsForAdmin).toHaveBeenCalledTimes(1);
  });

  test('query params (page/limit/q) are forwarded to the service untouched', async () => {
    const token = await createAdmin();

    await request(app)
      .get('/api/admin/restaurants')
      .query({ page: '2', limit: '5', q: 'grill' })
      .set('Authorization', `Bearer ${token}`);

    expect(mockListRestaurantsForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2', limit: '5', q: 'grill' })
    );
  });

  test('a service-layer failure (e.g. a bad "page" the service rejects) surfaces via the central error handler', async () => {
    const { ApiError } = require('../utils/errors');
    mockListRestaurantsForAdmin.mockRejectedValue(new ApiError(400, '"page" must be a positive integer'));
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/restaurants')
      .query({ page: 'abc' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/restaurants/:id', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const restaurant = await makeRestaurant();

    const res = await request(app).get(`/api/admin/restaurants/${restaurant.id}`);

    expect(res.status).toBe(401);
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const restaurant = await makeRestaurant();
    const token = await createOwner();

    const res = await request(app)
      .get(`/api/admin/restaurants/${restaurant.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('an admin gets 200 with the full restaurant row for an approved, non-suspended restaurant', async () => {
    const restaurant = await makeRestaurant({ name: 'Habesha Kitchen' });
    const token = await createAdmin();

    const res = await request(app)
      .get(`/api/admin/restaurants/${restaurant.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ restaurant });
  });

  // Unlike the public, customer-facing `GET /api/restaurants/:id`
  // (`getProfile`, Task 3.7), a pending/rejected/suspended restaurant is
  // NOT hidden from an admin — same "platform-wide, all restaurants
  // regardless of Live status" scope 6.4a's own list endpoint already
  // established, applied here to the single-restaurant read too.
  test.each(['pending', 'rejected', 'not_requested'])(
    'an admin gets 200 for a restaurant with live_status "%s" (not hidden the way the public endpoint hides it)',
    async (live_status) => {
      const restaurant = await makeRestaurant({ live_status });
      const token = await createAdmin();

      const res = await request(app)
        .get(`/api/admin/restaurants/${restaurant.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ restaurant });
    }
  );

  test('an admin gets 200 for a suspended restaurant', async () => {
    const restaurant = await makeRestaurant({ is_suspended: 1 });
    const token = await createAdmin();

    const res = await request(app)
      .get(`/api/admin/restaurants/${restaurant.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ restaurant });
  });

  test('a non-existent id 404s', async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/restaurants/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// GET /api/admin/live-requests (6.6b) — same "mock the service, this
// suite is routing/auth-wiring only" split as the `/restaurants` block
// above, since `services/adminLiveRequestsList.js` (6.6a) is a
// hand-written joined query `fakeDb` can't express, same reasoning
// `adminRestaurantsList.js`'s own suite already documents.
describe('GET /api/admin/live-requests', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/admin/live-requests');

    expect(res.status).toBe(401);
    expect(mockListLiveRequestsForAdmin).not.toHaveBeenCalled();
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const token = await createOwner();

    const res = await request(app)
      .get('/api/admin/live-requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(mockListLiveRequestsForAdmin).not.toHaveBeenCalled();
  });

  test("an admin gets 200 with the service's { rows, meta } reshaped into { live_requests, meta }", async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/live-requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      live_requests: FAKE_LIVE_REQUESTS_PAGE.rows,
      meta: FAKE_LIVE_REQUESTS_PAGE.meta,
    });
    expect(mockListLiveRequestsForAdmin).toHaveBeenCalledTimes(1);
  });

  test('query params (page/limit) are forwarded to the service untouched', async () => {
    const token = await createAdmin();

    await request(app)
      .get('/api/admin/live-requests')
      .query({ page: '2', limit: '5' })
      .set('Authorization', `Bearer ${token}`);

    expect(mockListLiveRequestsForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ page: '2', limit: '5' })
    );
  });

  test('a service-layer failure (e.g. a bad "page" the service rejects) surfaces via the central error handler', async () => {
    const { ApiError } = require('../utils/errors');
    mockListLiveRequestsForAdmin.mockRejectedValue(
      new ApiError(400, '"page" must be a positive integer')
    );
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/live-requests')
      .query({ page: 'abc' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// GET /api/admin/live-requests/:id (6.6c) — same mocked-service approach
// as the list block above, and for the same reason: `getLiveRequestForAdmin`
// (6.6a/6.6c's own service file) is a hand-written joined query, not a
// crudFactory instance `fakeDb` could answer the way the `/restaurants/:id`
// (6.5a) suite's real, unmocked `restaurants` model can.
describe('GET /api/admin/live-requests/:id', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/admin/live-requests/1');

    expect(res.status).toBe(401);
    expect(mockGetLiveRequestForAdmin).not.toHaveBeenCalled();
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const token = await createOwner();

    const res = await request(app)
      .get('/api/admin/live-requests/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(mockGetLiveRequestForAdmin).not.toHaveBeenCalled();
  });

  test("an admin gets 200 with the service's row wrapped in { live_request }", async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/live-requests/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ live_request: FAKE_LIVE_REQUEST_DETAIL });
    expect(mockGetLiveRequestForAdmin).toHaveBeenCalledWith('1');
  });

  test('a service-layer 404 (unknown id) surfaces via the central error handler', async () => {
    const { ApiError } = require('../utils/errors');
    mockGetLiveRequestForAdmin.mockRejectedValue(new ApiError(404, 'live_requests not found'));
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/live-requests/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('a non-pending (e.g. already-approved) request is still returned, not hidden', async () => {
    mockGetLiveRequestForAdmin.mockResolvedValue({
      ...FAKE_LIVE_REQUEST_DETAIL,
      status: 'approved',
    });
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/live-requests/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.live_request.status).toBe('approved');
  });
});

// GET /api/admin/orders/:id (Task 6.11a) — unlike every other `:id`
// detail route in this suite, this one has no service to mock: its
// controller (`getOrderDetailHandler`) calls `models/orders.js`'s
// crudFactory instance directly (`getOrThrow`), same as
// `getRestaurantDetailHandler` (6.5a) — so this block follows that one's
// own precedent instead: real rows seeded through the (unmocked)
// `orders`/`order_items`/`payment_methods` models (via the real, public
// `POST /api/orders`, see `placeOrderFor` above) against `fakeDb`, not a
// jest.mock'd service.
describe('GET /api/admin/orders/:id', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const restaurant = await makeRestaurant();
    const { order } = await placeOrderFor(restaurant.id);

    const res = await request(app).get(`/api/admin/orders/${order.id}`);

    expect(res.status).toBe(401);
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const restaurant = await makeRestaurant();
    const { order } = await placeOrderFor(restaurant.id);
    const token = await createOwner();

    const res = await request(app)
      .get(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('an admin gets 200 with { order, items, payment_method } for any restaurant\'s order', async () => {
    const restaurant = await makeRestaurant({ name: 'Habesha Kitchen' });
    const { order, paymentMethod } = await placeOrderFor(restaurant.id);
    const token = await createAdmin();

    const res = await request(app)
      .get(`/api/admin/orders/${order.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.order).toMatchObject({
      id: order.id,
      restaurant_id: restaurant.id,
      customer_name: 'Abebe Kebede',
      customer_location_text: 'Bole, behind Edna Mall',
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

  // The genuinely new behavior this task adds over 5.13's owner-scoped
  // `GET /api/orders/:id`: no `ownershipMiddleware` in the chain, so an
  // admin can read *any* restaurant's order, not just one restaurant_id
  // scoped to their own token.
  test('an admin can read an order belonging to a restaurant they do not own', async () => {
    const restaurantA = await makeRestaurant({ owner_id: 1 });
    const restaurantB = await makeRestaurant({ owner_id: 2 });
    const { order: orderA } = await placeOrderFor(restaurantA.id, { customer_name: 'Belongs to A' });
    const { order: orderB } = await placeOrderFor(restaurantB.id, { customer_name: 'Belongs to B' });
    const token = await createAdmin();

    const resA = await request(app)
      .get(`/api/admin/orders/${orderA.id}`)
      .set('Authorization', `Bearer ${token}`);
    const resB = await request(app)
      .get(`/api/admin/orders/${orderB.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resA.status).toBe(200);
    expect(resA.body.order.customer_name).toBe('Belongs to A');
    expect(resB.status).toBe(200);
    expect(resB.body.order.customer_name).toBe('Belongs to B');
  });

  test('a non-existent id 404s', async () => {
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/orders/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// --- Fixture helper for `GET|PATCH /api/admin/settings` (Task 6.12a) --
//
// Same "seed straight through the real, unmocked model" approach
// `makeRestaurant`/`seedFood`/`seedPaymentMethod` above already use —
// `adminSettings.js` has no service layer to mock, same as
// `getRestaurantDetailHandler`'s (6.5a) own precedent.
function seedSettings(overrides = {}) {
  return adminSettings.create({
    registration_fee_amount: 500,
    registration_method_name: 'Telebirr',
    registration_account_number: '0911223344',
    registration_account_name: 'NATRA Platform',
    registration_instructions: 'Include your full name as the payment reference.',
    ...overrides,
  });
}

describe('GET /api/admin/settings', () => {
  test('requires an Authorization header (401 with none)', async () => {
    await seedSettings();

    const res = await request(app).get('/api/admin/settings');

    expect(res.status).toBe(401);
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    await seedSettings();
    const token = await createOwner();

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('an admin gets 200 with the full settings row, not just the five registration_* fields', async () => {
    await seedSettings({
      order_timeout_mode: '30m',
      order_timeout_custom_minutes: null,
      notify_before_expiry: 1,
    });
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.settings).toMatchObject({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
      registration_instructions: 'Include your full name as the payment reference.',
      // Unlike `GET /api/admin-settings/registration` (4.3), this
      // admin-only read does NOT hide the order-timeout/notify columns
      // — see getSettingsHandler's own comment in adminController.js.
      order_timeout_mode: '30m',
      notify_before_expiry: 1,
    });
  });

  test('404s if the settings row genuinely does not exist', async () => {
    // No seedSettings() call — fakeDb's admin_settings table starts
    // empty, unlike a real DB where migration 0010 always seeds it.
    const token = await createAdmin();

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/settings', () => {
  test('requires an Authorization header (401 with none)', async () => {
    await seedSettings();

    const res = await request(app)
      .patch('/api/admin/settings')
      .send({ registration_fee_amount: 750 });

    expect(res.status).toBe(401);
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    await seedSettings();
    const token = await createOwner();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_fee_amount: 750 });

    expect(res.status).toBe(403);
  });

  test('an admin can update a single field, leaving the rest untouched', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_fee_amount: 750 });

    expect(res.status).toBe(200);
    expect(res.body.settings).toMatchObject({
      registration_fee_amount: 750,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
    });
  });

  test('an admin can update all five registration_* fields at once', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registration_fee_amount: 1000,
        registration_method_name: 'CBE Birr',
        registration_account_number: '1000123456789',
        registration_account_name: 'NATRA Platform Ltd',
        registration_instructions: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.settings).toMatchObject({
      registration_fee_amount: 1000,
      registration_method_name: 'CBE Birr',
      registration_account_number: '1000123456789',
      registration_account_name: 'NATRA Platform Ltd',
      registration_instructions: null,
    });
  });

  test('a zero registration_fee_amount is accepted (a free-registration period is a real admin choice)', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_fee_amount: 0 });

    expect(res.status).toBe(200);
    expect(res.body.settings.registration_fee_amount).toBe(0);
  });

  test('a negative registration_fee_amount is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_fee_amount: -5 });

    expect(res.status).toBe(400);
  });

  test('an empty registration_method_name is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_method_name: '' });

    expect(res.status).toBe(400);
  });

  test('an empty body is rejected with 400 (no silent no-op update)', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  // 6.12a's own placeholder test here asserted `order_timeout_mode` was
  // rejected with 400 as out-of-scope; 6.13a is that promised extension,
  // so the tests below replace it — `order_timeout_mode` and its two
  // sibling fields are now real, validated fields on this same schema.

  test('an admin can set order_timeout_mode to a non-custom value with no custom_minutes needed', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: '30m' });

    expect(res.status).toBe(200);
    expect(res.body.settings.order_timeout_mode).toBe('30m');
  });

  test('an invalid order_timeout_mode is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'never' });

    expect(res.status).toBe(400);
  });

  test('order_timeout_mode set to custom together with order_timeout_custom_minutes is accepted', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 45 });

    expect(res.status).toBe(200);
    expect(res.body.settings).toMatchObject({
      order_timeout_mode: 'custom',
      order_timeout_custom_minutes: 45,
    });
  });

  test('order_timeout_mode set to custom without order_timeout_custom_minutes is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'custom' });

    expect(res.status).toBe(400);
  });

  test('order_timeout_mode set to custom with a null order_timeout_custom_minutes is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'custom', order_timeout_custom_minutes: null });

    expect(res.status).toBe(400);
  });

  test('order_timeout_custom_minutes alone (mode already custom from an earlier request) is accepted', async () => {
    await seedSettings({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 20 });
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_custom_minutes: 25 });

    expect(res.status).toBe(200);
    expect(res.body.settings.order_timeout_custom_minutes).toBe(25);
  });

  test('a non-positive order_timeout_custom_minutes is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 0 });

    expect(res.status).toBe(400);
  });

  test('an order_timeout_custom_minutes exceeding NUMBER(5) is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 100000 });

    expect(res.status).toBe(400);
  });

  test('notify_before_expiry accepts a boolean and stores it as 0/1', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ notify_before_expiry: true });

    expect(res.status).toBe(200);
    expect(res.body.settings.notify_before_expiry).toBe(1);
  });

  test('a non-boolean notify_before_expiry is rejected with 400', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ notify_before_expiry: 'yes' });

    expect(res.status).toBe(400);
  });

  test('a caller sending a genuinely unknown field is still rejected with 400 (.strict() still applies)', async () => {
    await seedSettings();
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ not_a_real_field: true });

    expect(res.status).toBe(400);
  });

  test('404s if the settings row genuinely does not exist', async () => {
    const token = await createAdmin();

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ registration_fee_amount: 750 });

    expect(res.status).toBe(404);
  });
});

// --- POST /api/admin/popularity/recompute (Task 7.1c) --------------------
//
// `services/popularityAggregation.js` is mocked here, same reasoning
// every other service-backed handler in this suite already uses
// (`adminDashboardSummary`, `adminRestaurantsList`,
// `adminLiveRequestsList`): this suite is the routing/auth-wiring
// layer, not the aggregation/upsert-correctness layer — that's
// `popularityAggregation.test.js`'s (7.1a/7.1b) job.
describe('POST /api/admin/popularity/recompute', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).post('/api/admin/popularity/recompute');

    expect(res.status).toBe(401);
    expect(mockRecomputePopularityStats).not.toHaveBeenCalled();
  });

  test('rejects an owner with 403 (admin-only route)', async () => {
    const token = await createOwner();

    const res = await request(app)
      .post('/api/admin/popularity/recompute')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(mockRecomputePopularityStats).not.toHaveBeenCalled();
  });

  test('an admin gets 204 with no body, and the recompute actually runs', async () => {
    const token = await createAdmin();

    const res = await request(app)
      .post('/api/admin/popularity/recompute')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(mockRecomputePopularityStats).toHaveBeenCalledTimes(1);
  });

  test('a failure inside the recompute is passed to the error handler, not swallowed', async () => {
    mockRecomputePopularityStats.mockRejectedValueOnce(new Error('simulated recompute failure'));
    const token = await createAdmin();

    const res = await request(app)
      .post('/api/admin/popularity/recompute')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});
