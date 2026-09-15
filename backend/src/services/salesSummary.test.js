// salesSummary.test.js — Task 5.18a
//
// Same reasoning as `orderCounts.test.js` (5.17): `fakeDb.js` only
// understands the specific single-table SQL shapes `crudFactory.js`
// generates plus the couple of hand-written shapes `orderCounts.js`
// (GROUP BY) already added it — a plain per-row `SELECT ... WHERE ...
// ORDER BY id ASC` like this file's own query already fits fakeDb's
// existing "SELECT ... ORDER BY" shape unmodified, but this suite mocks
// `../config/db` directly anyway, same as `orderCounts.test.js`, so the
// query-correctness assertions below (rounding, today-bucketing, bind
// scoping) aren't entangled with fakeDb's own row-storage/date-handling
// behavior. Route-level/integration coverage against the real fakeDb
// double lives in `order.routes.test.js`'s own
// `describe('GET /api/orders/sales-summary', ...)` block instead.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { getSalesSummary, COMPLETED_STATUS } = require('./salesSummary');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  // Same mockClear()-not-just-replacement fix orderCounts.test.js/
  // popularFoods.test.js/liveCategories.test.js all needed.
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isoToday() {
  return new Date().toISOString();
}

describe('getSalesSummary', () => {
  test('returns an all-zero summary for a restaurant with no completed orders', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const summary = await getSalesSummary(1);

    expect(summary).toEqual({ todayTotal: 0, allTimeTotal: 0, completedOrderCount: 0 });
  });

  test('sums every completed order into allTimeTotal and counts them', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 250, created_at: isoDaysAgo(5) },
        { total: 100.5, created_at: isoDaysAgo(2) },
        { total: 75.25, created_at: isoToday() },
      ],
    });

    const summary = await getSalesSummary(1);

    expect(summary.allTimeTotal).toBe(425.75);
    expect(summary.completedOrderCount).toBe(3);
  });

  test('buckets only orders created today into todayTotal, leaving older ones out', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 300, created_at: isoDaysAgo(1) },
        { total: 50, created_at: isoToday() },
        { total: 25, created_at: isoToday() },
      ],
    });

    const summary = await getSalesSummary(1);

    expect(summary.todayTotal).toBe(75);
    expect(summary.allTimeTotal).toBe(375);
  });

  test('coerces a string-typed total (driver numeric-binding ambiguity) to a real number', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [{ total: '199.99', created_at: isoToday() }],
    });

    const summary = await getSalesSummary(1);

    expect(summary.todayTotal).toBe(199.99);
    expect(summary.allTimeTotal).toBe(199.99);
  });

  test('rounds accumulated totals to the nearest cent, avoiding float drift', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 0.1, created_at: isoToday() },
        { total: 0.2, created_at: isoToday() },
      ],
    });

    const summary = await getSalesSummary(1);

    expect(summary.todayTotal).toBe(0.3);
    expect(summary.allTimeTotal).toBe(0.3);
  });

  test('scopes the query to the given restaurantId and Completed status via binds, not string interpolation', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getSalesSummary(42);

    const [sql, binds] = mockConnection.execute.mock.calls[0];
    expect(sql).toMatch(/WHERE restaurant_id = :restaurantId AND status = :status/);
    expect(sql).toMatch(/ORDER BY id ASC/);
    expect(binds).toEqual({ restaurantId: 42, status: 'Completed' });
  });

  test('exports the fixed Completed-status constant the query filters by', () => {
    expect(COMPLETED_STATUS).toBe('Completed');
  });
});
