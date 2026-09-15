// adminRestaurantsList.test.js — Task 6.4a
//
// Same "mock ../config/db directly, not fakeDb" approach
// `search.test.js` (3.6) / `adminDashboardSummary.test.js` (6.3a) already
// established — `fakeDb` only understands the single-table SQL shapes
// `crudFactory.js` generates, not a hand-written LIKE/OFFSET/FETCH query.
// `withConnection` issues the row-fetch and count queries via
// `Promise.all`, so responses are queued by a distinctive SQL substring
// (same helper shape `adminDashboardSummary.test.js` uses) rather than by
// call order.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listRestaurantsForAdmin } = require('./adminRestaurantsList');

let mockConnection;

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

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

describe('listRestaurantsForAdmin', () => {
  test('no "q": fetches all restaurants, no WHERE clause, binds only paging', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [{ id: 1, name: 'Habesha Kitchen' }] },
      'SELECT COUNT(*)': { rows: [{ total: 1 }] },
    });

    const { rows, meta } = await listRestaurantsForAdmin({});

    expect(rows).toEqual([{ id: 1, name: 'Habesha Kitchen' }]);
    expect(meta).toEqual({
      total: 1,
      limit: 20,
      offset: 0,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });

    const [rowsSql, rowsBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('FETCH NEXT')
    );
    expect(rowsSql).not.toMatch(/WHERE/);
    expect(rowsBinds).toEqual({ pagingOffset: 0, pagingLimit: 20 });

    const [countSql, countBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('SELECT COUNT(*)')
    );
    expect(countSql).not.toMatch(/WHERE/);
    expect(countBinds).toEqual({});
  });

  test('with "q": both queries get a case-insensitive, escaped LIKE pattern', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [{ id: 2, name: '50% Off Grill' }] },
      'SELECT COUNT(*)': { rows: [{ total: 1 }] },
    });

    await listRestaurantsForAdmin({ q: '50% off' });

    const [rowsSql, rowsBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('FETCH NEXT')
    );
    expect(rowsSql).toMatch(/WHERE UPPER\(name\) LIKE UPPER\(:pattern\) ESCAPE '\\\\'/);
    expect(rowsBinds.pattern).toBe('%50\\% off%');

    const [countSql, countBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('SELECT COUNT(*)')
    );
    expect(countSql).toMatch(/WHERE UPPER\(name\) LIKE UPPER\(:pattern\) ESCAPE '\\\\'/);
    expect(countBinds.pattern).toBe('%50\\% off%');
  });

  test('a blank/whitespace-only "q" is treated the same as no search at all', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listRestaurantsForAdmin({ q: '   ' });

    const [rowsSql] = mockConnection.execute.mock.calls.find(([sql]) => sql.includes('FETCH NEXT'));
    expect(rowsSql).not.toMatch(/WHERE/);
  });

  test('page/limit are forwarded to OFFSET/FETCH via parsePaginationParams', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 45 }] },
    });

    const { meta } = await listRestaurantsForAdmin({ page: 3, limit: 10 });

    const [, rowsBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('FETCH NEXT')
    );
    expect(rowsBinds).toEqual({ pagingOffset: 20, pagingLimit: 10 });
    expect(meta).toEqual({
      total: 45,
      limit: 10,
      offset: 20,
      page: 3,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  test('an invalid pagination param rejects before any query runs (400 via parsePaginationParams)', async () => {
    await expect(listRestaurantsForAdmin({ page: 'abc' })).rejects.toMatchObject({ status: 400 });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('string-typed COUNT(*) value from the driver still coerces to a number', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: '7' }] },
    });

    const { meta } = await listRestaurantsForAdmin({});

    expect(meta.total).toBe(7);
  });
});
