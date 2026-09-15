// restaurantMenu.test.js — Task 3.8
//
// Same reasoning as `popularFoods.test.js` (Task 3.5): `fakeDb.js`
// only understands the single-table SQL shapes `crudFactory.js`
// generates, not this file's hand-written JOIN — so `../config/db` is
// mocked directly with a minimal `withConnection`-only double that
// records the exact SQL/binds it's called with and returns canned
// rows, same as every other raw-SQL service test in this codebase
// (`liveCategories.test.js`, `popularFoods.test.js`, `search.test.js`).

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listRestaurantMenu } = require('./restaurantMenu');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  // mockClear (not just reassigning mockConnection) — same fix
  // liveCategories.test.js/popularFoods.test.js already needed for the
  // real cross-test call-count-accumulation bug a live `npm test` run
  // caught earlier in this project.
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

function queueRowsThenCount(rows, total) {
  mockConnection.execute
    .mockResolvedValueOnce({ rows })
    .mockResolvedValueOnce({ rows: [{ total }] });
}

describe('listRestaurantMenu', () => {
  test('returns the mapped rows and pagination meta from the query results', async () => {
    const rows = [
      { id: 1, name: 'Doro Wat', price: 250, restaurant_id: 10 },
      { id: 2, name: 'Tibs', price: 300, restaurant_id: 10 },
    ];
    queueRowsThenCount(rows, 2);

    const { rows: result, meta } = await listRestaurantMenu(10, {});

    expect(result).toEqual(rows);
    expect(meta).toMatchObject({ total: 2, limit: 20, offset: 0, page: 1, totalPages: 1 });
  });

  test('returns an empty array when the restaurant has no visible foods', async () => {
    queueRowsThenCount([], 0);

    const { rows, meta } = await listRestaurantMenu(10, {});

    expect(rows).toEqual([]);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });

  test('scopes both queries to the given restaurant_id and excludes hidden foods, sharing identical binds', async () => {
    queueRowsThenCount([], 0);

    await listRestaurantMenu(42, { limit: 5, page: 2 });

    expect(mockConnection.execute).toHaveBeenCalledTimes(2);

    const [rowsSql, rowsBinds] = mockConnection.execute.mock.calls[0];
    const [countSql, countBinds] = mockConnection.execute.mock.calls[1];
    const normalizedRowsSql = rowsSql.replace(/\s+/g, ' ').trim();
    const normalizedCountSql = countSql.replace(/\s+/g, ' ').trim();

    // No `restaurants` join here, unlike `popularFoods.js` — the Live
    // check for this restaurant already happened one layer up, in
    // restaurantController.js's `getMenu` (see this file's own header
    // comment for why re-deriving it here would just duplicate that
    // rule in two places).
    expect(rowsBinds).toEqual({
      restaurantId: 42,
      isHidden: 0,
      pagingOffset: 5,
      pagingLimit: 5,
    });
    expect(countBinds).toEqual({ restaurantId: 42, isHidden: 0 });

    for (const sql of [normalizedRowsSql, normalizedCountSql]) {
      expect(sql).not.toMatch(/JOIN restaurants/i);
      expect(sql).toMatch(/JOIN food_visibility fv ON fv\.food_id = f\.id/i);
      expect(sql).toMatch(/f\.restaurant_id = :restaurantId/i);
      expect(sql).toMatch(/fv\.is_hidden = :isHidden/i);
    }

    expect(normalizedRowsSql).toMatch(/ORDER BY f\.name ASC/i);
    expect(normalizedRowsSql).toMatch(
      /OFFSET :pagingOffset ROWS FETCH NEXT :pagingLimit ROWS ONLY/i
    );
    expect(normalizedCountSql).toMatch(/SELECT COUNT\(\*\) AS total/i);
  });

  test('rejects a malformed limit before ever calling the database', async () => {
    await expect(listRestaurantMenu(10, { limit: 'abc' })).rejects.toThrow(/positive integer/);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('borrows a connection via withConnection rather than managing one itself', async () => {
    queueRowsThenCount([], 0);

    await listRestaurantMenu(10, {});

    expect(withConnection).toHaveBeenCalledTimes(1);
  });
});
