// liveCategories.test.js — Task 3.4
//
// `fakeDb.js` (Task 1.3's double for `../config/db`) deliberately only
// understands the specific INSERT/SELECT/COUNT/UPDATE/DELETE shapes
// `crudFactory.js` generates (its own header comment says as much) — it
// is not a general SQL engine, and a `JOIN` is outside what it was ever
// meant to parse. So unlike every other `*.test.js` in this codebase
// (which `jest.mock('../config/db', () => createFakeDb())`), this suite
// mocks `../config/db` directly with a minimal hand-rolled connection
// double that records the exact SQL/binds it was called with and returns
// canned rows — the same "mock the low-level dependency, not a general
// engine" approach `uploadToObjectStorage.test.js`-equivalent
// verification (Task 1.5/1.6, never shipped as a real Jest file since
// this project had no registry access that session either) used for a
// dependency with no reusable fake already on hand.
//
// **Real bug found and fixed while running this suite for the first time
// under a real `npm test` (Task 3.5's session, which had registry
// access)**: `withConnection` itself is the one `jest.mock(...)`-created
// function shared by every test in this file — only `mockConnection`
// (and its own `execute` jest.fn()) was being replaced fresh in
// `beforeEach`, so `withConnection`'s own call count kept accumulating
// across every test that ran before it in the same file. The "borrows a
// connection via withConnection rather than managing one itself" test
// below had never actually run under real Jest before this session (this
// file's own original verification, back when Task 3.4 landed, was
// hand-verified with no registry access) — it always failed once real
// Jest executed it, since a prior test's call(s) were still baked into
// the shared mock's history. Fixed with `withConnection.mockClear()` in
// `beforeEach`, alongside the existing `mockConnection`/
// `mockImplementation` reset.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listLiveCategoryNames } = require('./liveCategories');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

describe('listLiveCategoryNames', () => {
  test('returns the mapped name list from the query result', async () => {
    mockConnection.execute.mockResolvedValue({
      rows: [{ name: 'Breakfast' }, { name: 'Drinks' }, { name: 'Lunch' }],
    });

    const names = await listLiveCategoryNames();

    expect(names).toEqual(['Breakfast', 'Drinks', 'Lunch']);
  });

  test('returns an empty array when no Live restaurant has any categories', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    const names = await listLiveCategoryNames();

    expect(names).toEqual([]);
  });

  test('runs a single query, joined on restaurant_id, filtered to the Live definition', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    await listLiveCategoryNames();

    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    const [sql, binds] = mockConnection.execute.mock.calls[0];
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // Exact same two-condition "Live" definition as restaurantController.js's
    // own LIVE_FILTER (Task 3.3) — asserted via the actual bind values
    // rather than re-deriving them from the SQL text, so this test breaks
    // if the *values* ever drift, not just the SQL's formatting.
    expect(binds).toEqual({ liveStatus: 'approved', isSuspended: 0 });
    expect(normalizedSql).toMatch(/DISTINCT c\.name/i);
    expect(normalizedSql).toMatch(/JOIN restaurants r ON r\.id = c\.restaurant_id/i);
    expect(normalizedSql).toMatch(/r\.live_status = :liveStatus/i);
    expect(normalizedSql).toMatch(/r\.is_suspended = :isSuspended/i);
    expect(normalizedSql).toMatch(/ORDER BY c\.name ASC/i);
  });

  test('borrows a connection via withConnection rather than managing one itself', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    await listLiveCategoryNames();

    expect(withConnection).toHaveBeenCalledTimes(1);
  });

  test('propagates a query failure rather than swallowing it', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    await expect(listLiveCategoryNames()).rejects.toThrow('simulated failure');
  });
});
