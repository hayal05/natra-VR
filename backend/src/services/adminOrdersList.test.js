// adminOrdersList.test.js — Task 6.9, extended by 6.10a
//
// Same "mock ../config/db directly, not fakeDb" approach
// `adminRestaurantsList.test.js` (6.4a) already established — `fakeDb`
// only understands the single-table SQL shapes `crudFactory.js`
// generates, not a hand-written LIKE/OFFSET/FETCH/JOIN query.
// `withConnection` issues the row-fetch and count queries via
// `Promise.all`, so responses are queued by a distinctive SQL substring
// rather than by call order.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listOrdersForAdmin } = require('./adminOrdersList');

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

function rowsCall() {
  return mockConnection.execute.mock.calls.find(([sql]) => sql.includes('FETCH NEXT'));
}

function countCall() {
  return mockConnection.execute.mock.calls.find(([sql]) => sql.includes('SELECT COUNT(*)'));
}

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

describe('listOrdersForAdmin', () => {
  test('no filters at all: no WHERE clause, binds only paging', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [{ id: 1, order_code: 'ORD-1' }] },
      'SELECT COUNT(*)': { rows: [{ total: 1 }] },
    });

    const { rows, meta } = await listOrdersForAdmin({});

    expect(rows).toEqual([{ id: 1, order_code: 'ORD-1' }]);
    expect(meta.total).toBe(1);

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).not.toMatch(/WHERE/);
    expect(rowsBinds).toEqual({ pagingOffset: 0, pagingLimit: 20 });

    const [countSql, countBinds] = countCall();
    expect(countSql).not.toMatch(/WHERE/);
    expect(countBinds).toEqual({});
  });

  // 6.9's own existing search behavior — re-asserted here so 6.10a's
  // additions can't silently change it.
  test('with "q" only: a parenthesized, case-insensitive, escaped OR across the three columns', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({ q: '50% off' });

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).toMatch(
      /WHERE \(UPPER\(o\.order_code\) LIKE UPPER\(:pattern\) ESCAPE '\\\\'/
    );
    expect(rowsSql).toMatch(/OR UPPER\(o\.customer_name\)/);
    expect(rowsSql).toMatch(/OR UPPER\(o\.customer_phone\)/);
    expect(rowsBinds.pattern).toBe('%50\\% off%');

    const [countSql] = countCall();
    expect(countSql).toMatch(/WHERE \(UPPER\(o\.order_code\)/);
  });

  test('with "restaurant_id" only: exact-match bind, no LIKE', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({ restaurant_id: '7' });

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).toMatch(/WHERE o\.restaurant_id = :restaurantId/);
    expect(rowsBinds.restaurantId).toBe(7);
  });

  test('a non-integer "restaurant_id" rejects with 400 before any query runs', async () => {
    await expect(listOrdersForAdmin({ restaurant_id: 'abc' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listOrdersForAdmin({ restaurant_id: '0' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listOrdersForAdmin({ restaurant_id: '1.5' })).rejects.toMatchObject({
      status: 400,
    });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('with "status" only: exact-match bind against one of the known statuses', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({ status: 'Accepted' });

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).toMatch(/WHERE o\.status = :status/);
    expect(rowsBinds.status).toBe('Accepted');
  });

  test('an unknown or wrong-case "status" rejects with 400 before any query runs', async () => {
    await expect(listOrdersForAdmin({ status: 'accepted' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listOrdersForAdmin({ status: 'Cancelled' })).rejects.toMatchObject({
      status: 400,
    });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('with "date" only: a [dateStart, dateEnd) range spanning that local calendar day', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({ date: '2026-03-14' });

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).toMatch(/WHERE o\.created_at >= :dateStart AND o\.created_at < :dateEnd/);
    expect(rowsBinds.dateStart).toEqual(new Date(2026, 2, 14));
    expect(rowsBinds.dateEnd).toEqual(new Date(2026, 2, 15));
  });

  test('a malformed "date" rejects with 400 before any query runs', async () => {
    await expect(listOrdersForAdmin({ date: '03/14/2026' })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listOrdersForAdmin({ date: '2026-3-14' })).rejects.toMatchObject({
      status: 400,
    });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('an impossible calendar "date" (e.g. Feb 30) rejects with 400 rather than rolling over', async () => {
    await expect(listOrdersForAdmin({ date: '2026-02-30' })).rejects.toMatchObject({
      status: 400,
    });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('"q", "restaurant_id", "status", and "date" together: one AND chain, search parenthesized', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({
      q: 'jane',
      restaurant_id: '3',
      status: 'New',
      date: '2026-03-14',
    });

    const [rowsSql, rowsBinds] = rowsCall();
    expect(rowsSql).toMatch(
      /WHERE \(UPPER\(o\.order_code\).*\) AND o\.restaurant_id = :restaurantId AND o\.status = :status AND o\.created_at >= :dateStart AND o\.created_at < :dateEnd/s
    );
    expect(rowsBinds).toMatchObject({
      pattern: '%jane%',
      restaurantId: 3,
      status: 'New',
      dateStart: new Date(2026, 2, 14),
      dateEnd: new Date(2026, 2, 15),
    });
  });

  test('a blank "status"/"date" is treated the same as omitted', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listOrdersForAdmin({ status: '', date: '' });

    const [rowsSql] = rowsCall();
    expect(rowsSql).not.toMatch(/WHERE/);
  });
});
