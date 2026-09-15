// orderExpiry.integration.test.js — Task 7.3f
//
// 7.3d/7.3e's own unit tests each mock at least one of
// `findExpiredOrderCandidates`/`orders`/`updateOrderStatus` to isolate
// what they're testing — correct, but it means nothing in this codebase
// has yet exercised the real, unmodified chain all the way through:
// `admin_settings` read -> candidate query -> re-fetch -> real
// `statusTransition` write -> re-select, for a real order, under every
// admin-configurable timeout mode. That's this task's own line in
// `docs/TASKS.md` verbatim ("manually create an old New order, run the
// job, confirm correct behavior across each timeout mode
// (off/15m/30m/1h/custom)") — "manually" here means "against a real
// order and a real settings row", not "by hand outside of Jest"; a
// shipped, automated test gives stronger, repeatable evidence than a
// one-off manual run would and is the same bar every other Phase 7
// verification task (7.1d, 7.2b/c) already set for itself.
//
// **Only `../config/db` is mocked** — not `models/orders`, not
// `services/updateOrderStatus`, not `models/adminSettings`. Everything
// above that one seam is the real, unmodified module graph
// `orderExpiryJob.js` itself calls in production. The mock connection
// below is a small hand-rolled double (same "understand the exact SQL
// shapes actually generated, don't build a general SQL engine"
// philosophy `fakeDb.js`/`orderExpiry.test.js`'s own connection mock
// already use) backed by one in-memory `orders` table plus a single
// `admin_settings` row, supporting exactly the four statement shapes
// this real chain issues:
//   1. `SELECT ... FROM admin_settings WHERE id = :id`      (adminSettings.findById)
//   2. `SELECT ... FROM orders WHERE status = :newStatus AND created_at < :cutoff ...` (7.3d's candidate query)
//   3. `SELECT ... FROM orders WHERE id = :id`               (orders.findById — both the
//      re-fetch-before-expiring call and updateOrderStatus's own re-select after the UPDATE)
//   4. `UPDATE orders SET status = :status, status_updated_at = :statusUpdatedAt WHERE id = :id`
//      (updateOrderStatus's own write)

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { runOrderExpiryPass } = require('./orderExpiry');

let store;
let mockConnection;
let nextOrderId;

beforeEach(() => {
  nextOrderId = 1;
  store = { adminSettings: null, orders: new Map() };

  mockConnection = {
    execute: jest.fn((sql, binds = {}) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (normalized.includes('FROM admin_settings')) {
        return Promise.resolve({ rows: store.adminSettings ? [store.adminSettings] : [] });
      }

      if (normalized.includes('FROM orders') && normalized.includes('AND created_at < :cutoff')) {
        const rows = [...store.orders.values()]
          .filter((o) => o.status === binds.newStatus && o.created_at.getTime() < binds.cutoff.getTime())
          .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
          .map((o) => ({ id: o.id, order_code: o.order_code, restaurant_id: o.restaurant_id, created_at: o.created_at }));
        return Promise.resolve({ rows });
      }

      if (normalized.includes('FROM orders WHERE id = :id')) {
        const row = store.orders.get(binds.id);
        return Promise.resolve({ rows: row ? [{ ...row }] : [] });
      }

      if (normalized.startsWith('UPDATE orders SET status')) {
        const row = store.orders.get(binds.id);
        if (row) {
          row.status = binds.status;
          row.status_updated_at = binds.statusUpdatedAt;
        }
        return Promise.resolve({ rowsAffected: row ? 1 : 0 });
      }

      throw new Error(`orderExpiry.integration.test.js: unexpected SQL:\n${sql}`);
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

function statusOf(id) {
  return store.orders.get(id).status;
}

describe('order expiry — real end-to-end pass, per timeout mode (Task 7.3f)', () => {
  test("mode 'off' — an old New order is left untouched, no orders query even runs", async () => {
    seedAdminSettings({ order_timeout_mode: 'off' });
    const oldOrderId = seedOrder({ status: 'New', ageMinutes: 24 * 60 }); // a full day old

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 0, expiredCount: 0, skippedCount: 0, failedCount: 0 });
    expect(statusOf(oldOrderId)).toBe('New');
    // Only the admin_settings read happened — no candidates query, no
    // re-fetch, no update.
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['15m', 15],
    ['30m', 30],
    ['1h', 60],
  ])("mode '%s' — expires an order older than %d minutes, leaves a fresh one alone", async (mode, minutes) => {
    seedAdminSettings({ order_timeout_mode: mode });
    const overdueId = seedOrder({ status: 'New', ageMinutes: minutes + 5 });
    const freshId = seedOrder({ status: 'New', ageMinutes: Math.max(minutes - 5, 0) });
    const otherRestaurantOverdueId = seedOrder({ status: 'New', ageMinutes: minutes + 30, restaurantId: 2 });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 2, expiredCount: 2, skippedCount: 0, failedCount: 0 });
    expect(statusOf(overdueId)).toBe('Expired');
    expect(statusOf(otherRestaurantOverdueId)).toBe('Expired');
    expect(statusOf(freshId)).toBe('New');
    expect(store.orders.get(overdueId).status_updated_at).toBeInstanceOf(Date);
  });

  test("mode 'custom' with a valid window — uses the configured minutes, not any fixed mode", async () => {
    seedAdminSettings({ order_timeout_mode: 'custom', order_timeout_custom_minutes: 5 });
    const overdueId = seedOrder({ status: 'New', ageMinutes: 10 });
    const freshId = seedOrder({ status: 'New', ageMinutes: 2 });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 1, expiredCount: 1, skippedCount: 0, failedCount: 0 });
    expect(statusOf(overdueId)).toBe('Expired');
    expect(statusOf(freshId)).toBe('New');
  });

  test("mode 'custom' with no usable minutes — treated the same as 'off', nothing expires", async () => {
    seedAdminSettings({ order_timeout_mode: 'custom', order_timeout_custom_minutes: null });
    const oldOrderId = seedOrder({ status: 'New', ageMinutes: 24 * 60 });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 0, expiredCount: 0, skippedCount: 0, failedCount: 0 });
    expect(statusOf(oldOrderId)).toBe('New');
  });

  test('non-New orders are never touched, regardless of age or mode', async () => {
    seedAdminSettings({ order_timeout_mode: '15m' });
    const acceptedId = seedOrder({ status: 'Accepted', ageMinutes: 60 });
    const completedId = seedOrder({ status: 'Completed', ageMinutes: 60 });
    const rejectedId = seedOrder({ status: 'Rejected', ageMinutes: 60 });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 0, expiredCount: 0, skippedCount: 0, failedCount: 0 });
    expect(statusOf(acceptedId)).toBe('Accepted');
    expect(statusOf(completedId)).toBe('Completed');
    expect(statusOf(rejectedId)).toBe('Rejected');
  });

  test('a real 409 race is skipped, not force-expired: an owner Accepts the order between the candidate query and the expiry write', async () => {
    seedAdminSettings({ order_timeout_mode: '15m' });
    const orderId = seedOrder({ status: 'New', ageMinutes: 30 });

    // Simulate the owner acting on the order in the gap between 7.3d's
    // candidate query and runOrderExpiryPass's own per-candidate
    // re-fetch, by flipping the underlying store's status directly —
    // rather than through a second call to runOrderExpiryPass, so this
    // exercises the actual re-fetch-then-transition race, not just two
    // independent passes.
    const originalExecute = mockConnection.execute.getMockImplementation();
    let candidatesQueried = false;
    mockConnection.execute.mockImplementation((sql, binds) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.includes('AND created_at < :cutoff') && !candidatesQueried) {
        candidatesQueried = true;
        // Race happens right after the candidate query returns this
        // order as a New candidate.
        const result = originalExecute(sql, binds);
        store.orders.get(orderId).status = 'Accepted';
        return result;
      }
      return originalExecute(sql, binds);
    });

    const result = await runOrderExpiryPass();

    expect(result).toEqual({ candidateCount: 1, expiredCount: 0, skippedCount: 1, failedCount: 0 });
    expect(statusOf(orderId)).toBe('Accepted');
  });

  test('re-running a completed pass is idempotent: an already-Expired order is never queried again', async () => {
    seedAdminSettings({ order_timeout_mode: '15m' });
    const orderId = seedOrder({ status: 'New', ageMinutes: 30 });

    const firstPass = await runOrderExpiryPass();
    expect(firstPass).toEqual({ candidateCount: 1, expiredCount: 1, skippedCount: 0, failedCount: 0 });
    expect(statusOf(orderId)).toBe('Expired');

    mockConnection.execute.mockClear();
    const secondPass = await runOrderExpiryPass();

    expect(secondPass).toEqual({ candidateCount: 0, expiredCount: 0, skippedCount: 0, failedCount: 0 });
    expect(statusOf(orderId)).toBe('Expired');
    // Only the admin_settings + candidates query ran — no re-fetch, no
    // update, since the candidates query itself excludes non-New rows.
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);
  });
});
