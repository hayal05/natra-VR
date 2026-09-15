// notifyBeforeExpiry.test.js — Task 7.4a
//
// Same mocking approach as `orderExpiry.test.js` (7.3d) — `../config/db`
// is mocked directly (not `fakeDb`, which doesn't understand a
// `created_at < :cutoff AND created_at >= :cutoff` range query), with
// `mockConnection.execute` branching on which SQL it's handed so a test
// can seed only the settings row it cares about. `resolveTimeoutMinutes`
// itself is NOT mocked — it's `orderExpiry.js`'s real, unmodified export,
// exercised here the same way `findOrdersApproachingExpiry` calls it in
// production, so a bug in either the resolution logic or how this file
// uses it would show up here, not just in `orderExpiry.test.js`'s own
// direct coverage of that function.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

// Task 7.4b's own additions (`notifyOrderApproachingExpiry`/
// `runNotifyBeforeExpiryPass`) go through `models/notifications.js`
// (dedup count + insert) and `models/restaurants.js` (resolving
// `recipient_id` from a candidate's `restaurant_id`) — both mocked
// directly here, same reasoning `orderExpiry.test.js` gives for mocking
// `models/orders`/`services/updateOrderStatus` around its own
// `runOrderExpiryPass`: these tests need to control exactly what "already
// notified" and "restaurant lookup" return, without teaching
// `../config/db`'s mock above a third SQL shape on top of the two
// (`admin_settings`, `orders`) it already branches on for 7.4a.
jest.mock('../models/notifications');
jest.mock('../models/restaurants');

const { withConnection } = require('../config/db');
const notificationsCrud = require('../models/notifications');
const restaurantsCrud = require('../models/restaurants');
const {
  findOrdersApproachingExpiry,
  notifyOrderApproachingExpiry,
  runNotifyBeforeExpiryPass,
  NOTIFY_LEAD_FRACTION,
  NOTIFICATION_TYPE,
} = require('./notifyBeforeExpiry');

let mockConnection;
let settingsRow;
let ordersRows;

beforeEach(() => {
  settingsRow = null;
  ordersRows = [];

  mockConnection = {
    execute: jest.fn((sql) => {
      if (sql.includes('FROM admin_settings')) {
        return Promise.resolve({ rows: settingsRow ? [settingsRow] : [] });
      }
      if (sql.includes('FROM orders')) {
        return Promise.resolve({ rows: ordersRows });
      }
      throw new Error(`notifyBeforeExpiry.test.js: unexpected SQL:\n${sql}`);
    }),
  };

  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));

  notificationsCrud.count.mockReset();
  notificationsCrud.create.mockReset();
  restaurantsCrud.findById.mockReset();
});

function seedSettings(overrides = {}) {
  settingsRow = {
    id: 1,
    order_timeout_mode: 'off',
    order_timeout_custom_minutes: null,
    notify_before_expiry: 0,
    ...overrides,
  };
}

describe('findOrdersApproachingExpiry — short-circuit cases', () => {
  test('returns [] and never queries orders when there is no admin_settings row yet', async () => {
    settingsRow = null;

    const result = await findOrdersApproachingExpiry();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute.mock.calls[0][0]).toContain('FROM admin_settings');
  });

  test('returns [] and never queries orders when notify_before_expiry is 0', async () => {
    seedSettings({ order_timeout_mode: '30m', notify_before_expiry: 0 });

    const result = await findOrdersApproachingExpiry();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('returns [] and never queries orders when notify_before_expiry is set but order_timeout_mode is off', async () => {
    seedSettings({ order_timeout_mode: 'off', notify_before_expiry: 1 });

    const result = await findOrdersApproachingExpiry();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test("returns [] and never queries orders for notify_before_expiry=1 with a malformed 'custom' row", async () => {
    seedSettings({
      order_timeout_mode: 'custom',
      order_timeout_custom_minutes: null,
      notify_before_expiry: 1,
    });

    const result = await findOrdersApproachingExpiry();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('checks notify_before_expiry before resolving the timeout window at all (order of checks)', async () => {
    // A settings row that's simultaneously "off" (no window to resolve)
    // AND notify_before_expiry: 0 — if this ever queried the orders
    // table, or even called resolveTimeoutMinutes in a way that mattered,
    // something would be wrong. This just pins the short-circuit is the
    // very first thing that runs.
    seedSettings({ order_timeout_mode: 'off', notify_before_expiry: 0 });

    await findOrdersApproachingExpiry();

    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute.mock.calls[0][0]).toContain('FROM admin_settings');
  });
});

describe('findOrdersApproachingExpiry — query shape and cutoff correctness', () => {
  test('issues the expected SQL shape with both cutoffs bound', async () => {
    seedSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    ordersRows = [];

    await findOrdersApproachingExpiry();

    expect(mockConnection.execute).toHaveBeenCalledTimes(2);
    const [sql, binds] = mockConnection.execute.mock.calls[1];
    expect(sql).toContain('FROM orders');
    expect(sql).toContain("status = :newStatus");
    expect(sql).toContain('created_at < :leadCutoff');
    expect(sql).toContain('created_at >= :fullCutoff');
    expect(sql).toContain('ORDER BY created_at ASC');
    expect(binds.newStatus).toBe('New');
    expect(binds.leadCutoff).toBeInstanceOf(Date);
    expect(binds.fullCutoff).toBeInstanceOf(Date);
    // leadCutoff is always the more recent (larger) timestamp — it marks
    // the *start* of the approaching window, which is closer to "now"
    // than fullCutoff (the full timeout boundary).
    expect(binds.leadCutoff.getTime()).toBeGreaterThan(binds.fullCutoff.getTime());
  });

  test.each([
    ['15m', 15],
    ['30m', 30],
    ['1h', 60],
  ])('for fixed mode %s, cutoffs bound the correct last-%s-fraction window', async (mode, minutes) => {
    seedSettings({ order_timeout_mode: mode, notify_before_expiry: 1 });

    const before = Date.now();
    await findOrdersApproachingExpiry();
    const after = Date.now();

    const [, binds] = mockConnection.execute.mock.calls[1];
    const expectedElapsedThresholdMs = minutes * (1 - NOTIFY_LEAD_FRACTION) * 60 * 1000;
    const expectedFullMs = minutes * 60 * 1000;

    // leadCutoff should be `now - elapsedThreshold`, bounded between the
    // before/after Date.now() reads taken around the call (same
    // technique orderExpiry.test.js's own cutoff-correctness checks use,
    // rather than asserting an exact millisecond).
    expect(binds.leadCutoff.getTime()).toBeGreaterThanOrEqual(before - expectedElapsedThresholdMs);
    expect(binds.leadCutoff.getTime()).toBeLessThanOrEqual(after - expectedElapsedThresholdMs);

    expect(binds.fullCutoff.getTime()).toBeGreaterThanOrEqual(before - expectedFullMs);
    expect(binds.fullCutoff.getTime()).toBeLessThanOrEqual(after - expectedFullMs);
  });

  test("for mode 'custom', cutoffs use the configured custom_minutes value", async () => {
    seedSettings({
      order_timeout_mode: 'custom',
      order_timeout_custom_minutes: 50,
      notify_before_expiry: 1,
    });

    const before = Date.now();
    await findOrdersApproachingExpiry();
    const after = Date.now();

    const [, binds] = mockConnection.execute.mock.calls[1];
    const expectedElapsedThresholdMs = 50 * (1 - NOTIFY_LEAD_FRACTION) * 60 * 1000;
    const expectedFullMs = 50 * 60 * 1000;

    expect(binds.leadCutoff.getTime()).toBeGreaterThanOrEqual(before - expectedElapsedThresholdMs);
    expect(binds.leadCutoff.getTime()).toBeLessThanOrEqual(after - expectedElapsedThresholdMs);
    expect(binds.fullCutoff.getTime()).toBeGreaterThanOrEqual(before - expectedFullMs);
    expect(binds.fullCutoff.getTime()).toBeLessThanOrEqual(after - expectedFullMs);
  });

  test('returns the candidate rows unchanged', async () => {
    seedSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const rows = [
      { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() },
      { id: 6, order_code: 'NTR-00006', restaurant_id: 2, created_at: new Date() },
    ];
    ordersRows = rows;

    const result = await findOrdersApproachingExpiry();

    expect(result).toBe(rows);
  });

  test('returns [] when nothing is currently in the approaching window', async () => {
    seedSettings({ order_timeout_mode: '15m', notify_before_expiry: 1 });
    ordersRows = [];

    const result = await findOrdersApproachingExpiry();

    expect(result).toEqual([]);
  });
});

// Task 7.4b — the write step.
const CANDIDATE = { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() };
const RESTAURANT = { id: 1, owner_id: 42, name: 'Test Kitchen' };

describe('notifyOrderApproachingExpiry', () => {
  test('checks for an existing notification before doing anything else', async () => {
    notificationsCrud.count.mockResolvedValue(0);
    restaurantsCrud.findById.mockResolvedValue(RESTAURANT);
    notificationsCrud.create.mockResolvedValue({ id: 99 });

    await notifyOrderApproachingExpiry(CANDIDATE);

    expect(notificationsCrud.count).toHaveBeenCalledWith({
      order_id: CANDIDATE.id,
      type: NOTIFICATION_TYPE,
    });
  });

  test('is a no-op (and never looks up the restaurant) when already notified', async () => {
    notificationsCrud.count.mockResolvedValue(1);

    const result = await notifyOrderApproachingExpiry(CANDIDATE);

    expect(result).toBeNull();
    expect(restaurantsCrud.findById).not.toHaveBeenCalled();
    expect(notificationsCrud.create).not.toHaveBeenCalled();
  });

  test('is a no-op when the restaurant cannot be resolved', async () => {
    notificationsCrud.count.mockResolvedValue(0);
    restaurantsCrud.findById.mockResolvedValue(null);

    const result = await notifyOrderApproachingExpiry(CANDIDATE);

    expect(result).toBeNull();
    expect(notificationsCrud.create).not.toHaveBeenCalled();
  });

  test('creates a notification addressed to the restaurant owner, referencing the order', async () => {
    notificationsCrud.count.mockResolvedValue(0);
    restaurantsCrud.findById.mockResolvedValue(RESTAURANT);
    const created = { id: 99 };
    notificationsCrud.create.mockResolvedValue(created);

    const result = await notifyOrderApproachingExpiry(CANDIDATE);

    expect(restaurantsCrud.findById).toHaveBeenCalledWith(CANDIDATE.restaurant_id);
    expect(notificationsCrud.create).toHaveBeenCalledWith({
      recipient_id: RESTAURANT.owner_id,
      type: NOTIFICATION_TYPE,
      restaurant_id: CANDIDATE.restaurant_id,
      order_id: CANDIDATE.id,
      message: expect.stringContaining(CANDIDATE.order_code),
    });
    expect(result).toBe(created);
  });
});

describe('runNotifyBeforeExpiryPass', () => {
  test('reports an empty summary and writes nothing when there are no candidates', async () => {
    seedSettings({ order_timeout_mode: 'off', notify_before_expiry: 0 });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({
      candidateCount: 0,
      notifiedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    });
    expect(notificationsCrud.create).not.toHaveBeenCalled();
  });

  test('notifies every fresh candidate and skips one already notified', async () => {
    seedSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const freshCandidate = { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() };
    const alreadyNotified = { id: 6, order_code: 'NTR-00006', restaurant_id: 2, created_at: new Date() };
    ordersRows = [freshCandidate, alreadyNotified];

    notificationsCrud.count.mockImplementation(({ order_id: orderId }) =>
      Promise.resolve(orderId === alreadyNotified.id ? 1 : 0)
    );
    restaurantsCrud.findById.mockResolvedValue(RESTAURANT);
    notificationsCrud.create.mockResolvedValue({ id: 100 });

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({
      candidateCount: 2,
      notifiedCount: 1,
      skippedCount: 1,
      failedCount: 0,
    });
    expect(notificationsCrud.create).toHaveBeenCalledTimes(1);
    expect(notificationsCrud.create).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: freshCandidate.id })
    );
  });

  test('counts a failure without stopping the rest of the pass', async () => {
    seedSettings({ order_timeout_mode: '30m', notify_before_expiry: 1 });
    const okCandidate = { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() };
    const failingCandidate = { id: 6, order_code: 'NTR-00006', restaurant_id: 2, created_at: new Date() };
    ordersRows = [failingCandidate, okCandidate];

    notificationsCrud.count.mockImplementation(({ order_id: orderId }) => {
      if (orderId === failingCandidate.id) {
        return Promise.reject(new Error('db hiccup'));
      }
      return Promise.resolve(0);
    });
    restaurantsCrud.findById.mockResolvedValue(RESTAURANT);
    notificationsCrud.create.mockResolvedValue({ id: 101 });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await runNotifyBeforeExpiryPass();

    expect(result).toEqual({
      candidateCount: 2,
      notifiedCount: 1,
      skippedCount: 0,
      failedCount: 1,
    });
    expect(notificationsCrud.create).toHaveBeenCalledTimes(1);
    expect(notificationsCrud.create).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: okCandidate.id })
    );

    consoleErrorSpy.mockRestore();
  });
});
