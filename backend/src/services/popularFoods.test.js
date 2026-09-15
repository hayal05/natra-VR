// popularFoods.test.js — Task 3.5
//
// Same reasoning as `liveCategories.test.js` (Task 3.4): `fakeDb.js`
// (Task 1.3's double) only understands the specific single-table SQL
// shapes `crudFactory.js` generates, not a hand-written multi-table
// JOIN — so `../config/db` is mocked directly here with a minimal
// `withConnection`-only double that records the exact SQL/binds it's
// called with and returns canned rows, rather than `jest.mock('../config/db',
// () => createFakeDb())` the way every crudFactory-backed suite does.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listPopularFoods, getPublicFoodById } = require('./popularFoods');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  // withConnection itself is the one shared jest.fn() across every test
  // in this file — mockClear() here (not just replacing mockConnection)
  // avoids the real, cross-test call-count-accumulation bug this same
  // pattern had in `liveCategories.test.js` (Task 3.4) until this
  // session's real `npm test` run actually caught it; see that file's
  // own header comment for the full writeup.
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

function queueRowsThenCount(rows, total) {
  mockConnection.execute
    .mockResolvedValueOnce({ rows })
    .mockResolvedValueOnce({ rows: [{ total }] });
}

describe('listPopularFoods', () => {
  test('returns the mapped rows and pagination meta from the query results', async () => {
    const rows = [
      { id: 1, name: 'Doro Wat', restaurant_id: 10, restaurant_name: 'Abeba Kitchen' },
      { id: 2, name: 'Tibs', restaurant_id: 11, restaurant_name: 'Merkato Grill' },
    ];
    queueRowsThenCount(rows, 2);

    const { rows: result, meta } = await listPopularFoods({});

    expect(result).toEqual(rows);
    expect(meta).toMatchObject({ total: 2, limit: 20, offset: 0, page: 1, totalPages: 1 });
  });

  test('returns an empty array when no Live restaurant has any visible foods', async () => {
    queueRowsThenCount([], 0);

    const { rows, meta } = await listPopularFoods({});

    expect(rows).toEqual([]);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
  });

  test('runs two queries, both joined and filtered to Live + visible, sharing identical binds', async () => {
    queueRowsThenCount([], 0);

    await listPopularFoods({ limit: 5, page: 2 });

    expect(mockConnection.execute).toHaveBeenCalledTimes(2);

    const [rowsSql, rowsBinds] = mockConnection.execute.mock.calls[0];
    const [countSql, countBinds] = mockConnection.execute.mock.calls[1];
    const normalizedRowsSql = rowsSql.replace(/\s+/g, ' ').trim();
    const normalizedCountSql = countSql.replace(/\s+/g, ' ').trim();

    // Same "Live" definition as restaurantController.js's own LIVE_FILTER
    // (Task 3.3), reused identically by liveCategories.js (Task 3.4) and
    // here — plus the new food_visibility filter this task adds.
    expect(rowsBinds).toEqual({
      liveStatus: 'approved',
      isSuspended: 0,
      isHidden: 0,
      pagingOffset: 5,
      pagingLimit: 5,
    });
    expect(countBinds).toEqual({ liveStatus: 'approved', isSuspended: 0, isHidden: 0 });

    for (const sql of [normalizedRowsSql, normalizedCountSql]) {
      expect(sql).toMatch(/JOIN restaurants r ON r\.id = f\.restaurant_id/i);
      expect(sql).toMatch(/JOIN food_visibility fv ON fv\.food_id = f\.id/i);
      // Task 7.2: LEFT JOIN, not INNER — a food with zero completed
      // orders (no popularity_stats row at all) must still appear in
      // the grid, just ranked last. See popularFoods.js's own header
      // comment for why this can't fan out either query's row count
      // (popularity_stats.food_id is UNIQUE).
      expect(sql).toMatch(/LEFT JOIN popularity_stats ps ON ps\.food_id = f\.id/i);
      expect(sql).toMatch(/r\.live_status = :liveStatus/i);
      expect(sql).toMatch(/r\.is_suspended = :isSuspended/i);
      expect(sql).toMatch(/fv\.is_hidden = :isHidden/i);
    }

    // Task 7.2: real popularity ranking, descending, with a stable
    // name-ascending tiebreak — replaces the old `ORDER BY f.name ASC`
    // placeholder.
    expect(normalizedRowsSql).toMatch(
      /ORDER BY COALESCE\(ps\.completed_quantity, 0\) DESC, f\.name ASC/i
    );
    expect(normalizedRowsSql).toMatch(
      /OFFSET :pagingOffset ROWS FETCH NEXT :pagingLimit ROWS ONLY/i
    );
    expect(normalizedCountSql).toMatch(/SELECT COUNT\(\*\) AS total/i);
  });

  test('rejects a malformed limit before ever calling the database', async () => {
    await expect(listPopularFoods({ limit: 'abc' })).rejects.toThrow(/positive integer/);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('borrows a connection via withConnection rather than managing one itself', async () => {
    queueRowsThenCount([], 0);

    await listPopularFoods({});

    expect(withConnection).toHaveBeenCalledTimes(1);
  });

  test('propagates a query failure rather than swallowing it', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    await expect(listPopularFoods({})).rejects.toThrow('simulated failure');
  });
});

// getPublicFoodById — Task 3.9. Reuses BASE_FROM/LIVE_FOOD_BINDS with
// listPopularFoods above (see that module's own header comment), so the
// query-shape assertions here focus on what's different about a single-row
// lookup — one query, not two, filtered additionally by f.id — rather than
// re-asserting every join/filter clause already pinned above.
describe('getPublicFoodById', () => {
  test('returns the single mapped row when the food is Live and visible', async () => {
    const row = {
      id: 7,
      name: 'Doro Wat',
      description: 'Spicy chicken stew',
      price: 250,
      image_url: null,
      restaurant_id: 10,
      restaurant_name: 'Abeba Kitchen',
    };
    mockConnection.execute.mockResolvedValueOnce({ rows: [row] });

    const food = await getPublicFoodById(7);

    expect(food).toEqual(row);
  });

  test('returns null when no row matches (nonexistent id, non-Live restaurant, or hidden food)', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const food = await getPublicFoodById(999);

    expect(food).toBeNull();
  });

  test('runs exactly one query, joined/filtered to Live + visible, plus the id', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getPublicFoodById(42);

    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

    const [sql, binds] = mockConnection.execute.mock.calls[0];
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    expect(binds).toEqual({
      liveStatus: 'approved',
      isSuspended: 0,
      isHidden: 0,
      foodId: 42,
    });
    expect(normalizedSql).toMatch(/JOIN restaurants r ON r\.id = f\.restaurant_id/i);
    expect(normalizedSql).toMatch(/JOIN food_visibility fv ON fv\.food_id = f\.id/i);
    // Task 7.2 added this LEFT JOIN to shared BASE_FROM — inert here
    // since this query neither selects nor orders by ps.* (see
    // popularFoods.js's own header comment on why the UNIQUE constraint
    // on popularity_stats.food_id makes that safe for a single-row
    // lookup too).
    expect(normalizedSql).toMatch(/LEFT JOIN popularity_stats ps ON ps\.food_id = f\.id/i);
    expect(normalizedSql).toMatch(/r\.live_status = :liveStatus/i);
    expect(normalizedSql).toMatch(/r\.is_suspended = :isSuspended/i);
    expect(normalizedSql).toMatch(/fv\.is_hidden = :isHidden/i);
    expect(normalizedSql).toMatch(/f\.id = :foodId/i);
    // No pagination concept for a single-resource lookup, unlike listPopularFoods.
    expect(normalizedSql).not.toMatch(/OFFSET/i);
    expect(normalizedSql).not.toMatch(/ORDER BY/i);
  });

  test('borrows a connection via withConnection rather than managing one itself', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getPublicFoodById(1);

    expect(withConnection).toHaveBeenCalledTimes(1);
  });

  test('propagates a query failure rather than swallowing it', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    await expect(getPublicFoodById(1)).rejects.toThrow('simulated failure');
  });
});

// Task 7.2b — verify buildPaginationMeta/total count still behave
// correctly with the new LEFT JOIN popularity_stats.
//
// Every other test in this file mocks `connection.execute` with a
// *canned* response (queueRowsThenCount) — it pins the SQL shape 7.2a
// changed, but can't by itself catch a real fan-out/count bug, since it
// never actually joins anything. This block instead stubs `execute`
// with a tiny in-memory relational engine that really performs the
// join/filter/order/count against realistic data (multiple
// restaurants, foods with and without a `popularity_stats` row, a
// hidden food, a food on a non-Live restaurant), so `total`/`meta` are
// computed by the real `listPopularFoods` + real `buildPaginationMeta`
// against genuinely joined rows, not a hand-picked number.
describe('listPopularFoods — Task 7.2b: count/meta correctness against a real join', () => {
  const restaurants = [
    { id: 10, live_status: 'approved', is_suspended: 0 },
    { id: 11, live_status: 'approved', is_suspended: 0 },
    { id: 12, live_status: 'pending', is_suspended: 0 }, // not Live
  ];
  const foods = [
    { id: 1, name: 'Doro Wat', restaurant_id: 10 },
    { id: 2, name: 'Tibs', restaurant_id: 10 },
    { id: 3, name: 'Kitfo', restaurant_id: 11 }, // hidden
    { id: 4, name: 'Shiro', restaurant_id: 11 }, // no popularity row
    { id: 5, name: 'Injera Combo', restaurant_id: 11 }, // no popularity row
    { id: 6, name: 'Secret Menu', restaurant_id: 12 }, // non-Live restaurant
  ];
  const foodVisibility = [
    { food_id: 1, is_hidden: 0 },
    { food_id: 2, is_hidden: 0 },
    { food_id: 3, is_hidden: 1 },
    { food_id: 4, is_hidden: 0 },
    { food_id: 5, is_hidden: 0 },
    { food_id: 6, is_hidden: 0 },
  ];
  // Deliberately sparse — `popularity_stats.food_id` is UNIQUE (migration
  // 0010), and 7.1b's upsert only ever visits foods with at least one
  // completed sale, so foods 4/5 having no row here is the normal case,
  // not a gap to fake around.
  const popularityStats = [
    { food_id: 1, completed_quantity: 5 },
    { food_id: 2, completed_quantity: 12 },
  ];

  function evalJoinedRows(binds) {
    const rMap = new Map(restaurants.map((r) => [r.id, r]));
    const fvMap = new Map(foodVisibility.map((fv) => [fv.food_id, fv]));
    const psMap = new Map(popularityStats.map((ps) => [ps.food_id, ps]));

    return foods
      .map((f) => ({ f, r: rMap.get(f.restaurant_id), fv: fvMap.get(f.id), ps: psMap.get(f.id) }))
      .filter(
        ({ r, fv }) =>
          r &&
          r.live_status === binds.liveStatus &&
          r.is_suspended === binds.isSuspended &&
          fv &&
          fv.is_hidden === binds.isHidden
      );
  }

  beforeEach(() => {
    withConnection.mockClear();
    withConnection.mockImplementation((work) =>
      work({
        execute: async (sql, binds) => {
          const normalized = sql.replace(/\s+/g, ' ').trim();
          const joined = evalJoinedRows(binds);

          if (/^SELECT COUNT\(\*\) AS total/i.test(normalized)) {
            // The real assertion this task exists for: COUNT(*) must
            // equal the number of matching *foods*, not inflated by the
            // LEFT JOIN to popularity_stats (which can add at most one
            // match per food, per that column's UNIQUE constraint).
            return { rows: [{ total: joined.length }] };
          }

          const ordered = [...joined].sort((a, b) => {
            const qa = a.ps ? a.ps.completed_quantity : 0;
            const qb = b.ps ? b.ps.completed_quantity : 0;
            if (qb !== qa) return qb - qa;
            return a.f.name.localeCompare(b.f.name);
          });
          const page = ordered
            .slice(binds.pagingOffset, binds.pagingOffset + binds.pagingLimit)
            .map(({ f }) => ({ id: f.id, name: f.name, restaurant_id: f.restaurant_id }));
          return { rows: page };
        },
      })
    );
  });

  test('total reflects only Live + visible foods, not inflated by the LEFT JOIN', async () => {
    const { rows, meta } = await listPopularFoods({ limit: 20, page: 1 });

    // Expected: foods 1,2 (restaurant 10) + 4,5 (restaurant 11) = 4.
    // Food 3 is hidden, food 6's restaurant isn't Live.
    expect(meta.total).toBe(4);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
    expect(rows).toHaveLength(4);
  });

  test('ranks by completed_quantity DESC, treating a missing popularity_stats row as 0', async () => {
    const { rows } = await listPopularFoods({ limit: 20, page: 1 });

    expect(rows.map((r) => r.name)).toEqual(['Tibs', 'Doro Wat', 'Injera Combo', 'Shiro']);
  });

  test('excludes a hidden food and a food on a non-Live restaurant regardless of the join', async () => {
    const { rows } = await listPopularFoods({ limit: 20, page: 1 });

    expect(rows.some((r) => r.name === 'Kitfo')).toBe(false);
    expect(rows.some((r) => r.name === 'Secret Menu')).toBe(false);
  });

  test('total/meta stay correct across pages (count query is independent of paging)', async () => {
    const page1 = await listPopularFoods({ limit: 2, page: 1 });
    expect(page1.meta).toMatchObject({ total: 4, totalPages: 2, hasNextPage: true, hasPrevPage: false });
    expect(page1.rows.map((r) => r.name)).toEqual(['Tibs', 'Doro Wat']);

    const page2 = await listPopularFoods({ limit: 2, page: 2 });
    expect(page2.meta).toMatchObject({ total: 4, totalPages: 2, hasNextPage: false, hasPrevPage: true });
    expect(page2.rows.map((r) => r.name)).toEqual(['Injera Combo', 'Shiro']);
  });

  test('an empty joined result set still yields totalPages 0, not 1', async () => {
    const savedRestaurants = restaurants.splice(0, restaurants.length);
    try {
      const { rows, meta } = await listPopularFoods({});
      expect(rows).toEqual([]);
      expect(meta.total).toBe(0);
      expect(meta.totalPages).toBe(0);
    } finally {
      restaurants.push(...savedRestaurants);
    }
  });
});
