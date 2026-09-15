// adminDashboardSummary.test.js — Task 6.3
//
// Same approach `orderCounts.test.js` (5.17) / `salesSummary.test.js`
// (5.18a) already use: `fakeDb.js` only understands the single-table SQL
// shapes `crudFactory.js` generates, not hand-written joins/aggregates —
// so `../config/db` is mocked directly with a minimal
// `withConnection`-only double that records exactly what it's called
// with and returns canned rows per call, in call order.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { getDashboardSummary, ACTIVITY_LIMIT } = require('./adminDashboardSummary');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

// `getDashboardSummary` fires 5 `execute` calls total (3 for totals, 2
// for recent activity) via nested `Promise.all`s, so call *order* across
// the two groups isn't guaranteed — only that each individual query's
// own SQL text is recognizable. Queue responses keyed by a distinctive
// substring of the query instead of by call index.
function mockExecuteByQuery(responsesBySubstring) {
  mockConnection.execute.mockImplementation((sql) => {
    const match = Object.entries(responsesBySubstring).find(([substring]) =>
      sql.includes(substring)
    );
    if (!match) {
      throw new Error(`Unexpected query in test: ${sql}`);
    }
    return Promise.resolve(match[1]);
  });
}

describe('getDashboardSummary', () => {
  test('totals: coerces counts/sum to numbers, live defaults to 0 when SUM is null', async () => {
    mockExecuteByQuery({
      'SUM(CASE': { rows: [{ total: 5, live: null }] },
      'FROM live_requests WHERE': { rows: [{ pending: 2 }] },
      'SELECT COUNT(*) AS total FROM orders': { rows: [{ total: 12 }] },
      // Recent-activity's own two queries also fire on every call to
      // getDashboardSummary (totals + activity are fetched together) —
      // not under test in this case, so just empty rows rather than
      // leaving them unmatched (which the helper treats as a test bug).
      'FROM live_requests lr': { rows: [] },
      'FROM orders o': { rows: [] },
    });

    const { totals } = await getDashboardSummary();

    expect(totals).toEqual({ restaurants: 5, live: 0, pending: 2, orders: 12 });
  });

  test('totals: a real live count and string-typed driver values both coerce correctly', async () => {
    mockExecuteByQuery({
      'SUM(CASE': { rows: [{ total: '9', live: '4' }] },
      'FROM live_requests WHERE': { rows: [{ pending: '1' }] },
      'SELECT COUNT(*) AS total FROM orders': { rows: [{ total: '30' }] },
      'FROM live_requests lr': { rows: [] },
      'FROM orders o': { rows: [] },
    });

    const { totals } = await getDashboardSummary();

    expect(totals).toEqual({ restaurants: 9, live: 4, pending: 1, orders: 30 });
  });

  test('recent activity: merges live_requests and orders, sorted newest-first', async () => {
    mockConnection.execute.mockImplementation((sql) => {
      if (sql.includes('FROM restaurants')) {
        return Promise.resolve({ rows: [{ total: 1, live: 1 }] });
      }
      if (sql.includes('FROM live_requests lr')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              status: 'pending',
              created_at: '2026-09-10T09:00:00.000Z',
              restaurant_name: 'Bole Cafe',
            },
          ],
        });
      }
      if (sql.includes('WHERE status')) {
        return Promise.resolve({ rows: [{ pending: 1 }] });
      }
      if (sql.includes('FROM orders o')) {
        return Promise.resolve({
          rows: [
            {
              id: 42,
              order_code: 'NTR-00042',
              status: 'New',
              created_at: '2026-09-12T09:00:00.000Z',
              restaurant_name: 'Habesha Kitchen',
            },
            {
              id: 41,
              order_code: 'NTR-00041',
              status: 'Completed',
              created_at: '2026-09-08T09:00:00.000Z',
              restaurant_name: 'Habesha Kitchen',
            },
          ],
        });
      }
      if (sql === 'SELECT COUNT(*) AS total FROM orders') {
        return Promise.resolve({ rows: [{ total: 2 }] });
      }
      throw new Error(`Unexpected query in test: ${sql}`);
    });

    const { recentActivity } = await getDashboardSummary();

    expect(recentActivity).toEqual([
      {
        type: 'order',
        id: 42,
        orderCode: 'NTR-00042',
        restaurantName: 'Habesha Kitchen',
        status: 'New',
        createdAt: '2026-09-12T09:00:00.000Z',
      },
      {
        type: 'live_request',
        id: 1,
        restaurantName: 'Bole Cafe',
        status: 'pending',
        createdAt: '2026-09-10T09:00:00.000Z',
      },
      {
        type: 'order',
        id: 41,
        orderCode: 'NTR-00041',
        restaurantName: 'Habesha Kitchen',
        status: 'Completed',
        createdAt: '2026-09-08T09:00:00.000Z',
      },
    ]);
  });

  test('recent activity: caps the merged feed at ACTIVITY_LIMIT items', async () => {
    const manyOrders = Array.from({ length: ACTIVITY_LIMIT + 5 }, (_, i) => ({
      id: i,
      order_code: `NTR-${i}`,
      status: 'New',
      created_at: new Date(2026, 0, i + 1).toISOString(),
      restaurant_name: 'Test Spot',
    }));

    mockConnection.execute.mockImplementation((sql) => {
      if (sql.includes('FROM restaurants')) return Promise.resolve({ rows: [{ total: 1, live: 1 }] });
      if (sql.includes('FROM live_requests lr')) return Promise.resolve({ rows: [] });
      if (sql.includes('WHERE status')) return Promise.resolve({ rows: [{ pending: 0 }] });
      if (sql.includes('FROM orders o')) return Promise.resolve({ rows: manyOrders });
      if (sql === 'SELECT COUNT(*) AS total FROM orders') {
        return Promise.resolve({ rows: [{ total: manyOrders.length }] });
      }
      throw new Error(`Unexpected query in test: ${sql}`);
    });

    const { recentActivity } = await getDashboardSummary();

    expect(recentActivity).toHaveLength(ACTIVITY_LIMIT);
  });

  test('recent activity: empty when neither source has any rows', async () => {
    mockExecuteByQuery({
      'FROM restaurants': { rows: [{ total: 0, live: null }] },
      'FROM live_requests lr': { rows: [] },
      'WHERE status': { rows: [{ pending: 0 }] },
      'FROM orders o': { rows: [] },
      'SELECT COUNT(*) AS total FROM orders': { rows: [{ total: 0 }] },
    });

    const { recentActivity, totals } = await getDashboardSummary();

    expect(recentActivity).toEqual([]);
    expect(totals).toEqual({ restaurants: 0, live: 0, pending: 0, orders: 0 });
  });
});
