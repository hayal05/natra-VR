// orderTracking.integration.test.js — Task 7.6d
//
// Task 7.6's own verification checkpoint, same "no production code
// changes, just proof the already-shipped pieces compose over one real
// request chain" shape 7.1d/7.2b/7.2c/7.3f/7.4d/7.5d already used —
// the customer-facing mirror of 7.5d's own order->notification suite.
//
// `order.routes.test.js`'s existing `PATCH /api/orders/:id/status`
// block already proves an owner can transition an order, and its own
// `GET /api/orders/track` block already proves a customer can look one
// up — but each seeds/reads in isolation (the status block writes
// straight into `fakeDb` via a raw `UPDATE`, not through a customer's
// own prior `POST /api/orders`; the track block never follows up with
// an owner transition at all). Nothing before this task has driven the
// *whole* Phase-7 exit-check chain end to end: a customer places an
// order, an owner accepts/rejects it, and that same customer's
// `GET /api/orders/track` lookup — the same public, unauthenticated
// endpoint `frontend/src/pages/TrackOrder/TrackOrder.jsx`'s new Task
// 7.6c polling loop calls on an interval — reflects it, with no
// hand-seeded row anywhere in the middle.
//
// Real Express app + real `supertest`, `fakeDb` double for
// `../config/db` — same approach every routes suite in this codebase
// uses. Reuses `order.routes.test.js`'s own `createOwnerWithRestaurant`/
// `seedFood`/`seedPaymentMethod` fixture shape (duplicated rather than
// imported, same "not worth a cross-file helper module" call that
// file's own header already makes for its `PATCH /api/orders/:id/status`
// block, and 7.5d's own integration suite already made for this exact
// same duplication).
//
// **What this deliberately does NOT re-cover** (already exercised
// elsewhere):
//   - every `PATCH /api/orders/:id/status` transition-legality edge case
//     (409 on an already-terminal order, cross-owner 404, invalid status
//     values, `statusTransition.js`'s own full transition table) ->
//     `order.routes.test.js`'s own describe block, `statusTransition.test.js`
//   - `GET /api/orders/track`'s own edge cases (phone-normalization
//     tolerance, the deliberately-indistinguishable-404 behavior,
//     malformed query params) -> `order.routes.test.js`'s own describe
//     block
//   - the frontend polling loop itself (`TrackOrder.jsx`'s `useEffect`,
//     its terminal-status stop condition, its `liveResult` layering over
//     `useMutation`'s `data`) — there is no frontend test runner
//     anywhere in this project (`frontend/package.json` has no
//     `vitest`/testing-library dependency, and no other `frontend/src`
//     file has a `.test.*` sibling), same standing gap 7.5d's own suite
//     already flagged for `useOwnerNewOrderAlerts.js`. Verified by code
//     review instead: that hook's own effect keys off exactly the
//     `{ order, items }` shape this suite's own assertions below confirm
//     `GET /api/orders/track` returns after a real transition, with no
//     extra fetch or transformation needed in between.

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

async function createOwnerWithRestaurant(overrides = {}) {
  const email = overrides.email || `tracking-owner-${Math.random().toString(36).slice(2)}@example.test`;
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

async function seedFood(restaurantId) {
  const food = await foods.create({
    restaurant_id: restaurantId,
    name: 'Doro Wat',
    price: 250,
    description: null,
    image_url: null,
  });
  await foodVisibility.create({ food_id: food.id, is_hidden: 0 });
  return food;
}

async function seedPaymentMethod(restaurantId) {
  return paymentMethods.create({
    restaurant_id: restaurantId,
    method_name: 'Telebirr',
    account_number: '0912345678',
    account_name: 'Test Restaurant',
    instructions: 'Send and upload a screenshot',
    is_active: 1,
  });
}

async function placeOrderFor(restaurantId, overrides = {}) {
  const food = await seedFood(restaurantId);
  const paymentMethod = await seedPaymentMethod(restaurantId);
  const res = await request(app)
    .post('/api/orders')
    .send({
      customer_name: 'Abebe Kebede',
      customer_phone: '0912 345 678',
      customer_location_text: 'Bole, behind Edna Mall',
      payment_screenshot_url: 'https://example.com/screenshot.png',
      payment_method_id: paymentMethod.id,
      items: [{ food_id: food.id, quantity: 1 }],
      ...overrides,
    });
  return res.body.order;
}

function trackOrder(order) {
  return request(app)
    .get('/api/orders/track')
    .query({ order_code: order.order_code, customer_phone: order.customer_phone });
}

describe('Owner accept/reject -> customer tracking end-to-end (Task 7.6d)', () => {
  test('a newly-placed order shows New to the customer before any owner action', async () => {
    const owner = await createOwnerWithRestaurant();
    const order = await placeOrderFor(owner.restaurantId);

    const res = await trackOrder(order);
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('New');
  });

  test('accepting the order as the owner is reflected the next time the customer tracks it', async () => {
    const owner = await createOwnerWithRestaurant();
    const order = await placeOrderFor(owner.restaurantId);

    const acceptRes = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'Accepted' });
    expect(acceptRes.status).toBe(200);

    // No re-seed, no direct model call — this is the exact same public
    // lookup TrackOrder.jsx's poll re-runs on an interval.
    const trackRes = await trackOrder(order);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.order).toMatchObject({ id: order.id, status: 'Accepted' });
    expect(trackRes.body.order.status_updated_at).toBeTruthy();
    // The items list — what a poll re-render actually redraws alongside
    // the badge — is untouched by the status change.
    expect(trackRes.body.items).toHaveLength(1);
  });

  test('rejecting the order as the owner is reflected the next time the customer tracks it', async () => {
    const owner = await createOwnerWithRestaurant();
    const order = await placeOrderFor(owner.restaurantId);

    const rejectRes = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'Rejected' });
    expect(rejectRes.status).toBe(200);

    const trackRes = await trackOrder(order);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.order).toMatchObject({ id: order.id, status: 'Rejected' });
  });

  test('completing an already-accepted order is reflected the next time the customer tracks it', async () => {
    const owner = await createOwnerWithRestaurant();
    const order = await placeOrderFor(owner.restaurantId);

    await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'Accepted' });
    const completeRes = await request(app)
      .patch(`/api/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'Completed' });
    expect(completeRes.status).toBe(200);

    const trackRes = await trackOrder(order);
    expect(trackRes.body.order.status).toBe('Completed');
  });

  test('a second, untouched order for the same restaurant keeps showing New — one customer\'s poll never leaks another\'s status change', async () => {
    const owner = await createOwnerWithRestaurant();
    const acceptedOrder = await placeOrderFor(owner.restaurantId, { customer_location_text: 'Accepted order location' });
    const untouchedOrder = await placeOrderFor(owner.restaurantId, { customer_location_text: 'Untouched order location' });

    await request(app)
      .patch(`/api/orders/${acceptedOrder.id}/status`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ status: 'Accepted' });

    const trackAccepted = await trackOrder(acceptedOrder);
    const trackUntouched = await trackOrder(untouchedOrder);

    expect(trackAccepted.body.order.status).toBe('Accepted');
    expect(trackUntouched.body.order.status).toBe('New');
  });
});
