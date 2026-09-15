// orderNotifications.integration.test.js — Task 7.5d
//
// Task 7.5's own verification checkpoint, same "no production code
// changes, just proof the already-shipped pieces compose" shape
// 7.1d/7.2b/7.2c/7.3f/7.4d already used. 7.5a
// (`services/submitOrder.js`'s `notifyOwnerOfNewOrder`) and 7.5b
// (`GET /api/notifications`/`PATCH /api/notifications/:id/read`) each
// already have their own isolated coverage —
// `submitOrder.test.js`'s "Task 7.5a" describe block proves the
// `notifications` row gets written, and `notification.routes.test.js`
// proves the two read/write endpoints work against a
// directly-`notifications.create`-seeded row — but nothing before this
// task has driven the two ends of that chain from a single real HTTP
// request the way production actually will: a customer's
// `POST /api/orders` writing the notification, and an owner's
// `GET /api/notifications` reading that *same* row back out, with no
// hand-seeding in between.
//
// Real Express app + real `supertest`, `fakeDb` double for `../config/db`
// — same approach `order.routes.test.js`/`notification.routes.test.js`
// already use. A fresh `fakeDb.__reset()` per test, same as both.
//
// **What this deliberately does NOT re-cover** (already exercised
// elsewhere, per each file's own "deliberately not this task's job"
// convention):
//   - `submitOrder.test.js`'s own business-rule coverage (hidden foods,
//     cross-restaurant items, payment-method ownership, the order-code
//     retry loop, the "notification write failure doesn't fail the
//     order" fallback) — Task 7.5a
//   - `notification.routes.test.js`'s own pagination/ordering/malformed-id
//     edge cases for the two notification routes themselves — Task 7.5b
//   - the three browser-side effects `useOwnerNewOrderAlerts.js` (Task
//     7.5c) fires off of a poll of this same endpoint (a desktop
//     `Notification`, a synthesized beep, the persistent nav badge) —
//     there is no frontend test runner anywhere in this project
//     (`frontend/package.json` has no `vitest`/testing-library
//     dependency, and no other `frontend/src` file has a `.test.*`
//     sibling), so that half of 7.5d's own `docs/TASKS.md` line is
//     verified by code review instead: `useOwnerNewOrderAlerts.js`
//     already documents reading `notification.message` directly off
//     `GET /api/notifications`'s response with no second per-order
//     fetch, and this suite's own "message content" assertions below
//     confirm that response shape is exactly what that hook expects.

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

// --- Fixture helpers (same shape order.routes.test.js's own
// `createOwnerWithRestaurant`/`seedFood`/`seedPaymentMethod`/`validBody`
// already use — duplicated here rather than imported, same "not worth a
// cross-file shared-test-helper module for four small functions"
// reasoning `order.routes.test.js`'s own header comment already gives
// for its `PATCH /api/orders/:id/status` block's duplication) ---------

async function createOwnerWithRestaurant(overrides = {}) {
  const email = overrides.email || `ordernotif-owner-${Math.random().toString(36).slice(2)}@example.test`;
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
      items: [{ food_id: food.id, quantity: 2 }],
      ...overrides,
    });
  return res;
}

describe('Order -> notification end-to-end wiring (Task 7.5d)', () => {
  test('placing a real order writes a real notifications row for the restaurant owner', async () => {
    const owner = await createOwnerWithRestaurant();

    const orderRes = await placeOrderFor(owner.restaurantId);
    expect(orderRes.status).toBe(201);
    const order = orderRes.body.order;

    // No hand-seeding — this reads straight off `fakeDb`'s own table,
    // proving `submitOrder.js`'s post-commit `notifyOwnerOfNewOrder`
    // call really ran off the real HTTP request above, not a mock.
    const rows = fakeDb.__getRows('notifications');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      recipient_id: owner.userId,
      type: 'new_order',
      restaurant_id: owner.restaurantId,
      order_id: order.id,
      is_read: 0,
    });
    // Message content matches `notifyOwnerOfNewOrder`'s own template
    // exactly — this is the string `useOwnerNewOrderAlerts.js` (7.5c)
    // hands straight to the browser `Notification` constructor with no
    // further formatting, so its exact shape matters here.
    expect(rows[0].message).toBe(
      `New order ${order.order_code} from Bole, behind Edna Mall — 2 items — ${order.total} ETB`
    );
  });

  test('the owner can read that same notification back via GET /api/notifications', async () => {
    const owner = await createOwnerWithRestaurant();
    const orderRes = await placeOrderFor(owner.restaurantId);
    const order = orderRes.body.order;

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.notifications).toHaveLength(1);
    expect(listRes.body.notifications[0]).toMatchObject({
      type: 'new_order',
      order_id: order.id,
      is_read: 0,
    });
    expect(listRes.body.meta).toMatchObject({ total: 1 });
  });

  test('two orders produce two notifications, newest-first, matching order.routes.test.js\'s own "no dedup" expectation (unlike 7.4b\'s expiry-warning dedup)', async () => {
    const owner = await createOwnerWithRestaurant();
    const first = await placeOrderFor(owner.restaurantId, { customer_location_text: 'First order location' });
    const second = await placeOrderFor(owner.restaurantId, { customer_location_text: 'Second order location' });

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(listRes.body.notifications).toHaveLength(2);
    expect(listRes.body.notifications[0].order_id).toBe(second.body.order.id);
    expect(listRes.body.notifications[1].order_id).toBe(first.body.order.id);
  });

  test('the owner can mark that notification read via PATCH /api/notifications/:id/read, and the change is durable', async () => {
    const owner = await createOwnerWithRestaurant();
    await placeOrderFor(owner.restaurantId);

    const listRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${owner.token}`);
    const notificationId = listRes.body.notifications[0].id;

    const patchRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.notification.is_read).toBe(1);

    const listAfter = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(listAfter.body.notifications[0].is_read).toBe(1);
  });

  test('cross-owner isolation: a different owner never sees or can mark-read another restaurant\'s new-order notification', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();
    await placeOrderFor(ownerA.restaurantId);

    const listB = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerB.token}`);
    expect(listB.body.notifications).toHaveLength(0);

    const listA = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerA.token}`);
    const notificationId = listA.body.notifications[0].id;

    const patchAsB = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${ownerB.token}`);
    expect(patchAsB.status).toBe(404);

    // A's own row is untouched by B's failed attempt.
    const listAAfter = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerA.token}`);
    expect(listAAfter.body.notifications[0].is_read).toBe(0);
  });
});
