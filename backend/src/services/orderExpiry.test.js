// orderExpiry.test.js — Task 7.3d
//
// `orderExpiry.js` calls into two different SQL shapes on the same
// `withConnection`: `models/adminSettings.js`'s crudFactory `findById`
// (a `SELECT ... FROM admin_settings WHERE id = :id`) and this file's own
// hand-written `orders` query. `fakeDb.js` only understands equality
// WHERE clauses, not this file's `created_at < :cutoff`, so — same as
// `popularityAggregation.test.js`/`popularFoods.test.js` — `../config/db`
// is mocked directly rather than swapped for `fakeDb`. Unlike those
// files, `mockConnection.execute` here branches on which SQL it's
// handed (matched by a fixed substring each query is guaranteed to
// contain) rather than relying purely on call order, so a test can seed
// only the settings row it cares about without also having to predict
// exactly how many admin_settings reads happen before the orders query.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

// Task 7.3e's own additions (`expireOrder`/`runOrderExpiryPass`) go
// through `models/orders.js` (re-fetching a candidate before expiring
// it) and `services/updateOrderStatus.js` (the actual transition) —
// both mocked directly here rather than exercised for real, so these
// tests can control exactly what a "re-fetch" returns (including the
// race-condition case: a candidate that's no longer `New` by the time
// this pass gets to it) without needing `../config/db`'s mock above to
// also understand `updateOrderStatus.js`'s own raw UPDATE statement on
// top of the two SQL shapes it already branches on.
jest.mock('../models/orders');
jest.mock('./updateOrderStatus');

const { withConnection } = require('../config/db');
const orders = require('../models/orders');
const updateOrderStatus = require('./updateOrderStatus');
const {
  findExpiredOrderCandidates,
  resolveTimeoutMinutes,
  TIMEOUT_MINUTES_BY_MODE,
  expireOrder,
  runOrderExpiryPass,
} = require('./orderExpiry');

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
      throw new Error(`orderExpiry.test.js: unexpected SQL:\n${sql}`);
    }),
  };

  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));

  orders.findById.mockReset();
  updateOrderStatus.mockReset();
});

function seedSettings(overrides = {}) {
  settingsRow = {
    id: 1,
    order_timeout_mode: 'off',
    order_timeout_custom_minutes: null,
    ...overrides,
  };
}

describe('resolveTimeoutMinutes', () => {
  test("returns null for mode 'off'", () => {
    expect(resolveTimeoutMinutes({ order_timeout_mode: 'off', order_timeout_custom_minutes: null })).toBeNull();
  });

  test.each(Object.entries(TIMEOUT_MINUTES_BY_MODE))('returns %s minutes for the fixed mode %s', (mode, minutes) => {
    expect(
      resolveTimeoutMinutes({ order_timeout_mode: mode, order_timeout_custom_minutes: null })
    ).toBe(minutes);
  });

  test("returns the configured value for mode 'custom'", () => {
    expect(
      resolveTimeoutMinutes({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 45 })
    ).toBe(45);
  });

  test.each([null, undefined, 0, -5, 1.5, 'x'])(
    "treats a 'custom' mode with an unusable custom_minutes (%p) the same as 'off'",
    (custom) => {
      expect(
        resolveTimeoutMinutes({ order_timeout_mode: 'custom', order_timeout_custom_minutes: custom })
      ).toBeNull();
    }
  );

  test('an unrecognized mode resolves to null rather than throwing', () => {
    expect(
      resolveTimeoutMinutes({ order_timeout_mode: 'never', order_timeout_custom_minutes: null })
    ).toBeNull();
  });
});

describe('findExpiredOrderCandidates', () => {
  test('returns [] and never queries orders when there is no admin_settings row yet', async () => {
    settingsRow = null;

    const result = await findExpiredOrderCandidates();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute.mock.calls[0][0]).toContain('FROM admin_settings');
  });

  test("returns [] and never queries orders when order_timeout_mode is 'off'", async () => {
    seedSettings({ order_timeout_mode: 'off' });

    const result = await findExpiredOrderCandidates();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test("returns [] and never queries orders for a malformed 'custom' row (null minutes)", async () => {
    seedSettings({ order_timeout_mode: 'custom', order_timeout_custom_minutes: null });

    const result = await findExpiredOrderCandidates();

    expect(result).toEqual([]);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('queries orders with status = New and a cutoff derived from a fixed mode, returning the rows as-is', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    const candidateRows = [
      { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date('2026-01-01T00:00:00Z') },
      { id: 9, order_code: 'NTR-00009', restaurant_id: 2, created_at: new Date('2026-01-01T00:05:00Z') },
    ];
    ordersRows = candidateRows;

    const before = Date.now();
    const result = await findExpiredOrderCandidates();
    const after = Date.now();

    expect(result).toEqual(candidateRows);
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);

    const [ordersSql, ordersBinds] = mockConnection.execute.mock.calls[1];
    const normalizedSql = ordersSql.replace(/\s+/g, ' ').trim();

    expect(normalizedSql).toContain('FROM orders');
    expect(normalizedSql).toContain('WHERE status = :newStatus');
    expect(normalizedSql).toContain('AND created_at < :cutoff');
    expect(normalizedSql).toContain('ORDER BY created_at ASC');
    expect(ordersBinds.newStatus).toBe('New');

    // cutoff should be "now - 30 minutes", computed at call time — bound
    // loosely (within the before/after window this test itself ran in)
    // rather than asserting an exact millisecond value.
    const expectedEarliest = before - 30 * 60 * 1000;
    const expectedLatest = after - 30 * 60 * 1000;
    expect(ordersBinds.cutoff.getTime()).toBeGreaterThanOrEqual(expectedEarliest);
    expect(ordersBinds.cutoff.getTime()).toBeLessThanOrEqual(expectedLatest);
  });

  test("uses order_timeout_custom_minutes as the window when mode is 'custom'", async () => {
    seedSettings({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 5 });
    ordersRows = [];

    const before = Date.now();
    await findExpiredOrderCandidates();
    const after = Date.now();

    const [, ordersBinds] = mockConnection.execute.mock.calls[1];
    const expectedEarliest = before - 5 * 60 * 1000;
    const expectedLatest = after - 5 * 60 * 1000;
    expect(ordersBinds.cutoff.getTime()).toBeGreaterThanOrEqual(expectedEarliest);
    expect(ordersBinds.cutoff.getTime()).toBeLessThanOrEqual(expectedLatest);
  });

  test('returns an empty array (not an error) when no New order is old enough yet', async () => {
    seedSettings({ order_timeout_mode: '1h' });
    ordersRows = [];

    const result = await findExpiredOrderCandidates();

    expect(result).toEqual([]);
  });
});

describe('expireOrder — Task 7.3e', () => {
  test('delegates straight to updateOrderStatus(order, "Expired")', async () => {
    const order = { id: 7, status: 'New' };
    const updated = { ...order, status: 'Expired' };
    updateOrderStatus.mockResolvedValue(updated);

    const result = await expireOrder(order);

    expect(updateOrderStatus).toHaveBeenCalledTimes(1);
    expect(updateOrderStatus).toHaveBeenCalledWith(order, 'Expired');
    expect(result).toBe(updated);
  });

  test('propagates a rejection from updateOrderStatus (e.g. a 409 race) rather than swallowing it', async () => {
    const order = { id: 7, status: 'Accepted' };
    const conflict = Object.assign(new Error('nope'), { status: 409 });
    updateOrderStatus.mockRejectedValue(conflict);

    await expect(expireOrder(order)).rejects.toBe(conflict);
  });
});

describe('runOrderExpiryPass — Task 7.3e', () => {
  test('returns all-zero counts and never touches orders/updateOrderStatus when there are no candidates', async () => {
    seedSettings({ order_timeout_mode: 'off' });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 0, expiredCount: 0, skippedCount: 0, failedCount: 0 });
    expect(orders.findById).not.toHaveBeenCalled();
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  test('re-fetches and expires every still-New candidate', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    ordersRows = [
      { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() },
      { id: 9, order_code: 'NTR-00009', restaurant_id: 2, created_at: new Date() },
    ];

    orders.findById.mockImplementation((id) =>
      Promise.resolve({ id, status: 'New', order_code: id === 5 ? 'NTR-00005' : 'NTR-00009' })
    );
    updateOrderStatus.mockImplementation((order, to) => Promise.resolve({ ...order, status: to }));

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 2, expiredCount: 2, skippedCount: 0, failedCount: 0 });
    expect(orders.findById).toHaveBeenCalledTimes(2);
    expect(orders.findById).toHaveBeenCalledWith(5);
    expect(orders.findById).toHaveBeenCalledWith(9);
    expect(updateOrderStatus).toHaveBeenCalledTimes(2);
    expect(updateOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 5, status: 'New' }), 'Expired');
    expect(updateOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 9, status: 'New' }), 'Expired');
  });

  test('skips (does not expire) a candidate that raced to a different status since the query ran', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    ordersRows = [{ id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() }];

    // An owner Accepted it in the gap between 7.3d's query and this pass
    // re-fetching it.
    orders.findById.mockResolvedValue({ id: 5, status: 'Accepted' });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 1, expiredCount: 0, skippedCount: 1, failedCount: 0 });
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  test('skips a candidate that no longer exists on re-fetch (findById returns null)', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    ordersRows = [{ id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() }];
    orders.findById.mockResolvedValue(null);

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 1, expiredCount: 0, skippedCount: 1, failedCount: 0 });
    expect(updateOrderStatus).not.toHaveBeenCalled();
  });

  test('counts a failed re-fetch as failed and keeps processing the remaining candidates', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    ordersRows = [
      { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() },
      { id: 9, order_code: 'NTR-00009', restaurant_id: 2, created_at: new Date() },
    ];

    orders.findById.mockImplementation((id) => {
      if (id === 5) return Promise.reject(new Error('db hiccup'));
      return Promise.resolve({ id, status: 'New', order_code: 'NTR-00009' });
    });
    updateOrderStatus.mockImplementation((order, to) => Promise.resolve({ ...order, status: to }));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runOrderExpiryPass();
    consoleErrorSpy.mockRestore();

    expect(result).toEqual({ candidateCount: 2, expiredCount: 1, skippedCount: 0, failedCount: 1 });
    expect(updateOrderStatus).toHaveBeenCalledTimes(1);
    expect(updateOrderStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }), 'Expired');
  });

  test('counts a failed transition (e.g. a 409) as failed and keeps processing the remaining candidates', async () => {
    seedSettings({ order_timeout_mode: '30m' });
    ordersRows = [
      { id: 5, order_code: 'NTR-00005', restaurant_id: 1, created_at: new Date() },
      { id: 9, order_code: 'NTR-00009', restaurant_id: 2, created_at: new Date() },
    ];

    orders.findById.mockImplementation((id) =>
      Promise.resolve({ id, status: 'New', order_code: id === 5 ? 'NTR-00005' : 'NTR-00009' })
    );
    updateOrderStatus.mockImplementation((order) => {
      if (order.id === 5) return Promise.reject(Object.assign(new Error('conflict'), { status: 409 }));
      return Promise.resolve({ ...order, status: 'Expired' });
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runOrderExpiryPass();
    consoleErrorSpy.mockRestore();

    expect(result).toEqual({ candidateCount: 2, expiredCount: 1, skippedCount: 0, failedCount: 1 });
  });
});
