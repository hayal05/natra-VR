// orderCounts.test.js — Task 5.17
//
// Same reasoning as `liveCategories.test.js` (3.4) / `popularFoods.test.js`
// (3.5): `fakeDb.js` (Task 1.3's double) only understands the specific
// single-table SQL shapes `crudFactory.js` generates, not a hand-written
// `GROUP BY` query — so `../config/db` is mocked directly here with a
// minimal `withConnection`-only double that records the exact SQL/binds
// it's called with and returns canned rows, rather than
// `jest.mock('../config/db', () => createFakeDb())` the way every
// crudFactory-backed suite does.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { getOrderCounts, ORDER_STATUSES } = require('./orderCounts');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  // Same `mockClear()`-not-just-`mockConnection`-replacement fix
  // `popularFoods.test.js`/`liveCategories.test.js` both needed after
  // their own real-`npm test` runs caught the cross-test call-count
  // accumulation bug — applied proactively here from the start.
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

describe('getOrderCounts', () => {
  test('maps grouped rows onto all 4 known statuses, defaulting missing ones to 0', async () => {
    mockConnection.execute.mockResolvedValueOnce({
      rows: [
        { status: 'New', count: 3 },
        { status: 'Completed', count: 5 },
      ],
    });

    const counts = await getOrderCounts(1);

    expect(counts).toEqual({ New: 3, Accepted: 0, Completed: 5, Rejected: 0, total: 8 });
  });

  test('returns all-zero counts for a restaurant with no orders at all', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const counts = await getOrderCounts(1);

    expect(counts).toEqual({ New: 0, Accepted: 0, Completed: 0, Rejected: 0, total: 0 });
  });

  test('coerces a string-typed count (driver numeric-binding ambiguity) to a real number', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [{ status: 'Accepted', count: '2' }] });

    const counts = await getOrderCounts(1);

    expect(counts.Accepted).toBe(2);
    expect(counts.total).toBe(2);
  });

  test('scopes the query to the given restaurantId via a bind, not string interpolation', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getOrderCounts(42);

    const [sql, binds] = mockConnection.execute.mock.calls[0];
    expect(sql).toMatch(/WHERE restaurant_id = :restaurantId/);
    expect(sql).toMatch(/GROUP BY status/);
    expect(binds).toEqual({ restaurantId: 42 });
  });

  test('exports the fixed 4-value status vocabulary every count object always includes', () => {
    expect(ORDER_STATUSES).toEqual(['New', 'Accepted', 'Completed', 'Rejected']);
  });
});
