// hourlySales.test.js — Task 10.3e2-i
//
// Same approach as `salesSummary.test.js` (5.18a): mock `../config/db`
// directly so these assertions cover bucketing/rounding/scoping, not
// `fakeDb`'s own row handling.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { getHourlySales, HOURS_PER_DAY } = require('./hourlySales');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

// A local-time timestamp at `hour:minute` today / `daysAgo` days ago,
// returned as an ISO string (how fakeDb stores `created_at`).
function at(hour, minute = 0, daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

describe('getHourlySales', () => {
  test('returns 24 ascending zeroed buckets for a restaurant with no completed orders', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const { hours } = await getHourlySales(1);

    expect(hours).toHaveLength(HOURS_PER_DAY);
    expect(hours.map((h) => h.hour)).toEqual([...Array(24).keys()]);
    expect(hours.every((h) => h.total === 0 && h.orderCount === 0)).toBe(true);
  });

  test('buckets today\'s orders by local hour, summing totals and counting orders', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 100, created_at: at(9, 5) },
        { total: 50.5, created_at: at(9, 55) },
        { total: 200, created_at: at(14, 30) },
      ],
    });

    const { hours } = await getHourlySales(1);

    expect(hours[9]).toEqual({ hour: 9, total: 150.5, orderCount: 2 });
    expect(hours[14]).toEqual({ hour: 14, total: 200, orderCount: 1 });
    expect(hours[10]).toEqual({ hour: 10, total: 0, orderCount: 0 });
  });

  test('leaves orders from earlier days out of every bucket', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 300, created_at: at(9, 0, 1) },
        { total: 40, created_at: at(9, 0, 0) },
      ],
    });

    const { hours } = await getHourlySales(1);

    expect(hours[9]).toEqual({ hour: 9, total: 40, orderCount: 1 });
    expect(hours.reduce((sum, h) => sum + h.orderCount, 0)).toBe(1);
  });

  test('coerces string totals and reads UPPERCASE keys (real oracledb casing)', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [{ TOTAL: '199.99', CREATED_AT: new Date(at(11, 0)) }],
    });

    const { hours } = await getHourlySales(1);

    expect(hours[11]).toEqual({ hour: 11, total: 199.99, orderCount: 1 });
  });

  test('rounds each bucket to the nearest cent, avoiding float drift', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { total: 0.1, created_at: at(8, 1) },
        { total: 0.2, created_at: at(8, 2) },
      ],
    });

    const { hours } = await getHourlySales(1);

    expect(hours[8].total).toBe(0.3);
  });

  test('scopes the query to the restaurant and Completed status via binds', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getHourlySales(42);

    const [sql, binds] = mockConnection.execute.mock.calls[0];
    expect(sql).toMatch(/WHERE restaurant_id = :restaurantId AND status = :status/);
    expect(binds).toEqual({ restaurantId: 42, status: 'Completed' });
  });
});
