// notification.routes.test.js — Task 7.5b
//
// Route-level tests for `GET /api/notifications` and
// `PATCH /api/notifications/:id/read` — the full `app.js` stack (real
// Express + real `supertest`, `fakeDb` double for `../config/db`), same
// approach `order.routes.test.js`'s own `GET /api/orders`/`PATCH
// /api/orders/:id/status` blocks (5.12a/5.14a) already use. Confirms the
// wiring these two routes actually need: `authMiddleware` alone (no
// `attachOwnerRestaurant`) gates both, `ownershipMiddleware`'s
// `{ ownerIdField: 'id' }` override (matching `recipient_id` against
// `req.user.id`, not `req.user.restaurant_id`) really is what's guarding
// the mark-read route, and a caller only ever sees/marks their own rows.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const notifications = require('../models/notifications');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

async function createOwner(overrides = {}) {
  const email =
    overrides.email || `notif-owner-${Math.random().toString(36).slice(2)}@example.test`;
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
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return { token: loginRes.body.token, userId };
}

async function seedNotification(recipientId, overrides = {}) {
  return notifications.create({
    recipient_id: recipientId,
    type: 'new_order',
    restaurant_id: overrides.restaurant_id ?? 1,
    order_id: overrides.order_id ?? 1,
    message: overrides.message ?? 'New order NTR-00001 — 2 items — 500 ETB',
  });
}

describe('GET /api/notifications', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  test('returns only the caller\'s own notifications, newest-first', async () => {
    const ownerA = await createOwner();
    const ownerB = await createOwner();

    await seedNotification(ownerA.userId, { message: 'A1' });
    await seedNotification(ownerB.userId, { message: 'B1' });
    await seedNotification(ownerA.userId, { message: 'A2' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.notifications.map((n) => n.message)).toEqual(['A2', 'A1']);
    expect(res.body.meta.total).toBe(2);
  });

  test('returns an empty array (not an error) for a caller with no notifications', async () => {
    const owner = await createOwner();

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
  });

  // Task 10.3a-ii — the `is_read` filter added for the owner-dashboard
  // notification-count indicator (`DashboardHeader`, frontend
  // `fetchUnreadNotificationCount`).
  test('"is_read=0" scopes both the rows and meta.total to unread notifications only', async () => {
    const owner = await createOwner();

    const unread1 = await seedNotification(owner.userId, { message: 'Unread 1' });
    await seedNotification(owner.userId, { message: 'Unread 2' });
    const readOne = await seedNotification(owner.userId, { message: 'Read 1' });

    await request(app)
      .patch(`/api/notifications/${readOne.id}/read`)
      .set('Authorization', `Bearer ${owner.token}`);

    const res = await request(app)
      .get('/api/notifications?is_read=0&limit=1')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    // meta.total reflects the full unread count regardless of the
    // page-limiting `limit=1` above — see utils/paginate.js's own doc
    // comment on why `meta.total` comes from a separate `count()` run
    // against the same filters, not `rows.length`.
    expect(res.body.meta.total).toBe(2);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].id).toBeGreaterThanOrEqual(unread1.id);
  });

  test('an "is_read" value other than 0/1 is a 400, not a silently-empty result', async () => {
    const owner = await createOwner();
    await seedNotification(owner.userId);

    const res = await request(app)
      .get('/api/notifications?is_read=yes')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  test('requires an Authorization header (401 with none)', async () => {
    const owner = await createOwner();
    const notification = await seedNotification(owner.userId);

    const res = await request(app).patch(`/api/notifications/${notification.id}/read`);
    expect(res.status).toBe(401);
  });

  test('marks the caller\'s own notification as read', async () => {
    const owner = await createOwner();
    const notification = await seedNotification(owner.userId);

    const res = await request(app)
      .patch(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.is_read).toBe(1);

    const stored = await notifications.findById(notification.id);
    expect(stored.is_read).toBe(1);
  });

  test('404s on another user\'s notification, and leaves it unchanged', async () => {
    const ownerA = await createOwner();
    const ownerB = await createOwner();
    const notification = await seedNotification(ownerB.userId);

    const res = await request(app)
      .patch(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${ownerA.token}`);

    expect(res.status).toBe(404);

    const stored = await notifications.findById(notification.id);
    expect(stored.is_read).not.toBe(1);
  });

  test('404s on a nonexistent id', async () => {
    const owner = await createOwner();

    const res = await request(app)
      .patch('/api/notifications/999999/read')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(404);
  });

  test('400s on a non-numeric id', async () => {
    const owner = await createOwner();

    const res = await request(app)
      .patch('/api/notifications/abc/read')
      .set('Authorization', `Bearer ${owner.token}`);

    expect(res.status).toBe(400);
  });
});
