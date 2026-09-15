// notifyBeforeExpiry.integration.test.js — Task 7.4d
//
// Same shape/reasoning as `orderExpiry.integration.test.js` (7.3f):
// 7.4a/7.4b's own unit tests each mock at least one seam
// (`../config/db` directly for 7.4a, `models/notifications`/
// `models/restaurants` for 7.4b) to isolate what they're testing —
// correct, but nothing in this codebase has yet exercised the real,
// unmodified chain all the way through: `admin_settings` read ->
// candidate query -> dedup count -> restaurant lookup -> real
// `notifications` insert -> re-select, for a real order, under a real
// `notify_before_expiry` toggle. That's this task's own line in
// `docs/TASKS.md` verbatim ("confirm one notification per order as it
// nears expiry, and none when notify_before_expiry = 0") — "confirm"
// here means the same "a shipped, automated test against the real
// module graph" bar 7.3f/7.1d/7.2b/7.2c already set for themselves, not
// a one-off manual run.
//
// **Only `../config/db` is mocked** — not `models/adminSettings`, not
// `models/notifications`, not `models/restaurants`, not `orderExpiry.js`
// (whose real `resolveTimeoutMinutes` this file's own
// `findOrdersApproachingExpiry` calls into). Everything above that one
// seam is the real, unmodified module graph `notifyBeforeExpiryJob.js`
// itself calls in production. The mock connection below is a small
// hand-rolled double (same philosophy `orderExpiry.integration.test.js`'s
// own connection mock already uses) backed by in-memory `orders`/
// `restaurants`/`notifications` tables plus a single `admin_settings`
// row, supporting exactly the five statement shapes this real chain
// issues:
//   1. `SELECT ... FROM admin_settings WHERE id = :id`         (adminSettings.findById)
//   2. `SELECT ... FROM orders WHERE status = :newStatus AND
//       created_at < :leadCutoff AND created_at >= :fullCutoff ...` (7.4a's candidate query)
//   3. `SELECT COUNT(*) AS total FROM notifications WHERE
//       order_id = :f0 AND type = :f1`                          (7.4b's dedup count)
//   4. `SELECT ... FROM restaurants WHERE id = :id`             (restaurants.findById — resolving recipient_id)
//   5. `INSERT INTO notifications (...) ... RETURNING id INTO :newId`,
//      followed by `SELECT ... FROM notifications WHERE id = :id`
//                                                                (notifications.create + its own re-select)

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { runNotifyBeforeExpiryPass, NOTIFICATION_TYPE } = require('./notifyBeforeExpiry');

let store;
let mockConnection;
let nextOrderId;
let nextRestaurantId;
let nextNotificationId;

beforeEach(() => {
  nextOrderId = 1;
  nextRestaurantId = 1;
  nextNotificationId = 1;
  store = { adminSettings: null, orders: new Map(), restaurants: new Map(), notifications: new Map() };

  mockConnection = {
    execute: jest.fn((sql, binds = {}) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM admin_settings')) {
        return Promise.resolve({ rows: store.adminSettings ? [store.adminSettings] : [] });
      }

      if (normalized.includes('FROM orders') && normalized.includes('created_at < :leadCutoff')) {
        const rows = [...store.orders.values()]
          .filter(
            (o) =>
              o.status === binds.newStatus &&
              o.created_at.getTime() < binds.leadCutoff.getTime() &&
              o.created_at.getTime() >= binds.fullCutoff.getTime()
          )
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
          .map((o) => ({ id: o.id, order_code: o.order_code, restaurant_id: o.restaurant_id, created_at: o.created_at }));
        return Promise.resolve({ rows });
      }

      if (normalized.startsWith('SELECT COUNT(*) AS total FROM notifications')) {
        const count = [...store.notifications.values()].filter(
          (n) => n.order_id === binds.f0 && n.type === binds.f1
        ).length;
        return Promise.resolve({ rows: [{ total: count }] });
      }

      if (normalized.startsWith('INSERT INTO notifications')) {
        const id = nextNotificationId++;
        store.notifications.set(id, {
          id,
          recipient_id: binds.b0,
          type: binds.b1,
          restaurant_id: binds.b2,
          order_id: binds.b3,
          message: binds.b4,
          is_read: 0,
          created_at: new Date(),
        });
        return Promise.resolve({ outBinds: { newId: [id] } });
      }

      if (normalized.includes('FROM notifications WHERE id = :id')) {
        const row = store.notifications.get(binds.id);
        return Promise.resolve({ rows: row ? [{ ...row }] : [] });
      }

      if (normalized.includes('FROM restaurants WHERE id = :id')) {
        const row = store.restaurants.get(binds.id);
        return Promise.resolve({ rows: row ? [{ ...row }] : [] });
      }

      throw new Error(`notifyBeforeExpiry.integration.test.js: unexpected SQL:\n${sql}`);
    }),
    commit: jest.fn().mockResolvedValue(undefined),
  };

  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

function seedAdminSettings(overrides = {}) {
  store.adminSettings = {
    id: 1,
    order_timeout_mode: 'off',
    order_timeout_custom_minutes: null,
    notify_before_expiry: 0,
    ...overrides,
  };
}

function seedRestaurant({ ownerId }) {
  const id = nextRestaurantId++;
  store.restaurants.set(id, {
    id,
    owner_id: ownerId,
    name: `Restaurant ${id}`,
    description: null,
    logo_url: null,
    cover_url: null,
    phone: '0911000000',
    location_text: 'Bole',
    live_status: 'approved',
    is_suspended: 0,
    is_open: 1,
    created_at: new Date(),
    updated_at: null,
  });
  return id;
}

/** A real-shaped `orders` row — every column `orders.findById`'s own selectColumns lists. */
function seedOrder({ status = 'New', ageMinutes = 0, restaurantId = 1 } = {}) {
  const id = nextOrderId++;
  const createdAt = new Date(Date.now() - ageMinutes * 60 * 1000);
  store.orders.set(id, {
    id,
    order_code: `NTR-${String(id).padStart(5, '0')}`,
    restaurant_id: restaurantId,
    customer_name: 'Abebe Kebede',
    customer_phone: '0912345678',
    customer_location_text: 'Bole, behind Edna Mall',
    customer_note: null,
    payment_method_id: 1,
    payment_screenshot_url: 'https://example.com/screenshot.png',
    subtotal: 250,
    total: 250,
    status,
    status_updated_at: null,
    expires_at: null,
    created_at: createdAt,
    updated_at: createdAt,
  });
  return id;
}

function notificationsForOrder(orderId) {
  return [...store.notifications.values()].filter((n) => n.order_id === orderId);
}

describe('notify-before-expiry — real end-to-end pass (Task 7.4d)', () => {
  test('notify_before_expiry = 0 — no notifications, even for an order deep in the approaching window', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 0 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    seedOrder({ status: 'New', ageMinutes: 27, restaurantId }); // well inside a 30m window's last-20%

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 0, notifiedCount: 0, skippedCount: 0, failedCount: 0 });
    expect(store.notifications.size).toBe(0);
    // Only the admin_settings read happened — the toggle short-circuits
    // before any orders query runs, same as 7.4a's own unit coverage.
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('notify_before_expiry = 1 — exactly one notification for an order inside the approaching window, none for a fresh one', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    const approachingId = seedOrder({ status: 'New', ageMinutes: 27, restaurantId }); // last 20% of 30m = last 6m
    const freshId = seedOrder({ status: 'New', ageMinutes: 5, restaurantId });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 1, notifiedCount: 1, skippedCount: 0, failedCount: 0 });
    expect(notificationsForOrder(approachingId)).toHaveLength(1);
    expect(notificationsForOrder(freshId)).toHaveLength(0);

    const [notification] = notificationsForOrder(approachingId);
    expect(notification.recipient_id).toBe(7);
    expect(notification.type).toBe(NOTIFICATION_TYPE);
    expect(notification.restaurant_id).toBe(restaurantId);
    expect(notification.message).toContain('NTR-00001');
  });

  test('an order already past the full timeout window is not notified (that is orderExpiry.js/7.3e\'s job, not this one\'s)', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    const pastFullWindowId = seedOrder({ status: 'New', ageMinutes: 45, restaurantId });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 0, notifiedCount: 0, skippedCount: 0, failedCount: 0 });
    expect(notificationsForOrder(pastFullWindowId)).toHaveLength(0);
  });

  test('re-running the pass is idempotent: an already-notified order is not notified a second time', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    const orderId = seedOrder({ status: 'New', ageMinutes: 27, restaurantId });

    const firstPass = await runNotifyBeforeExpiryPass();
    expect(firstPass).toEqual({ candidateCount: 1, notifiedCount: 1, skippedCount: 0, failedCount: 0 });
    expect(notificationsForOrder(orderId)).toHaveLength(1);

    const secondPass = await runNotifyBeforeExpiryPass();

    expect(secondPass).toEqual({ candidateCount: 1, notifiedCount: 0, skippedCount: 1, failedCount: 0 });
    // Still exactly one notification for this order — the dedup count
    // (statement shape 3 above) is what caught the second tick, not the
    // candidate query re-excluding it (the order is still New, still
    // inside the approaching window, so 7.4a's own query returns it as
    // a candidate on both passes — same "query finds it every time,
    // write is what's guarded" split 7.4a/7.4b's own header comments
    // describe).
    expect(notificationsForOrder(orderId)).toHaveLength(1);
  });

  test('two orders from two different restaurants each notify their own owner', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const restaurantAId = seedRestaurant({ ownerId: 11 });
    const restaurantBId = seedRestaurant({ ownerId: 22 });
    const orderAId = seedOrder({ status: 'New', ageMinutes: 27, restaurantId: restaurantAId });
    const orderBId = seedOrder({ status: 'New', ageMinutes: 28, restaurantId: restaurantBId });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 2, notifiedCount: 2, skippedCount: 0, failedCount: 0 });
    expect(notificationsForOrder(orderAId)[0].recipient_id).toBe(11);
    expect(notificationsForOrder(orderBId)[0].recipient_id).toBe(22);
  });

  test("mode 'off' — nothing is notified regardless of notify_before_expiry, no orders query even runs", async () => {
    seedAdminSettings({ order_timeout_mode: 'off', notify_before_expiry: 1 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    seedOrder({ status: 'New', ageMinutes: 24 * 60, restaurantId }); // a full day old

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 0, notifiedCount: 0, skippedCount: 0, failedCount: 0 });
    expect(store.notifications.size).toBe(0);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('non-New orders are never notified, regardless of age', async () => {
    seedAdminSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const restaurantId = seedRestaurant({ ownerId: 7 });
    seedOrder({ status: 'Accepted', ageMinutes: 27, restaurantId });
    seedOrder({ status: 'Completed', ageMinutes: 27, restaurantId });
    seedOrder({ status: 'Rejected', ageMinutes: 27, restaurantId });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({ candidateCount: 0, notifiedCount: 0, skippedCount: 0, failedCount: 0 });
    expect(store.notifications.size).toBe(0);
  });
});
