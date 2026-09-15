// popularityAggregation.test.js — Task 7.1a
//
// Same `../config/db` double as popularFoods.test.js/liveCategories.test.js
// (Tasks 3.4/3.5): this is a hand-written aggregation query, not a
// crudFactory instance, so `fakeDb.js` doesn't understand its SQL shape.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
  withTransaction: jest.fn((work) => work(mockConnection)),
}));

const { withConnection, withTransaction } = require('../config/db');
const { getCompletedQuantitiesByFood, recomputePopularityStats } = require('./popularityAggregation');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn(), commit: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
  withTransaction.mockClear();
  withTransaction.mockImplementation((work) => work(mockConnection));
});

describe('getCompletedQuantitiesByFood', () => {
  test('returns one row per food with its summed completed quantity', async () => {
    const rows = [
      { food_id: 1, completed_quantity: 12 },
      { food_id: 2, completed_quantity: 3 },
    ];
    mockConnection.execute.mockResolvedValueOnce({ rows });

    const result = await getCompletedQuantitiesByFood();

    expect(result).toEqual(rows);
  });

  test('returns an empty array when there are no Completed orders at all', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const result = await getCompletedQuantitiesByFood();

    expect(result).toEqual([]);
  });

  test('filters to status = Completed and groups by food_id, with no other filter', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await getCompletedQuantitiesByFood();

    expect(mockConnection.execute).toHaveBeenCalledTimes(1);

    const [sql, binds] = mockConnection.execute.mock.calls[0];
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    expect(binds).toEqual({ completedStatus: 'Completed' });
    expect(normalizedSql).toContain('WHERE o.status = :completedStatus');
    expect(normalizedSql).toContain('GROUP BY oi.food_id');
    expect(normalizedSql).toContain('JOIN orders o ON o.id = oi.order_id');
    // Deliberately no restaurant/live/visibility filters — see this
    // file's sibling popularityAggregation.js header for why 7.1a
    // aggregates across all completed sales, not just currently-Live
    // restaurants' foods.
    expect(normalizedSql).not.toMatch(/restaurants|live_status|food_visibility/i);
  });
});

describe('recomputePopularityStats', () => {
  test('does nothing (no transaction) when there are no completed quantities', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    await recomputePopularityStats();

    expect(withTransaction).not.toHaveBeenCalled();
  });

  test('runs one MERGE per food inside a single transaction, then commits once', async () => {
    mockConnection.execute
      .mockResolvedValueOnce({
        rows: [
          { food_id: 1, completed_quantity: 12 },
          { food_id: 2, completed_quantity: 3 },
        ],
      })
      // the two MERGE statements themselves
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await recomputePopularityStats();

    expect(withTransaction).toHaveBeenCalledTimes(1);
    // call 1 is 7.1a's aggregation query (via withConnection, same
    // mockConnection); calls 2-3 are the two MERGE statements.
    expect(mockConnection.execute).toHaveBeenCalledTimes(3);

    const [mergeSql1, binds1] = mockConnection.execute.mock.calls[1];
    const [mergeSql2, binds2] = mockConnection.execute.mock.calls[2];

    expect(mergeSql1).toContain('MERGE INTO popularity_stats');
    expect(binds1).toEqual({ foodId: 1, completedQuantity: 12 });
    expect(binds2).toEqual({ foodId: 2, completedQuantity: 3 });

    expect(mockConnection.commit).toHaveBeenCalledTimes(1);
  });

  test('each MERGE covers both the update-existing and insert-new cases', async () => {
    mockConnection.execute
      .mockResolvedValueOnce({ rows: [{ food_id: 5, completed_quantity: 7 }] })
      .mockResolvedValueOnce({});

    await recomputePopularityStats();

    const [mergeSql] = mockConnection.execute.mock.calls[1];
    const normalizedSql = mergeSql.replace(/\s+/g, ' ').trim();

    expect(normalizedSql).toMatch(/ON \(ps\.food_id = src\.food_id\)/);
    expect(normalizedSql).toMatch(/WHEN MATCHED THEN UPDATE SET/);
    expect(normalizedSql).toMatch(/WHEN NOT MATCHED THEN INSERT/);
  });
});

// --- Task 7.1d — correctness + idempotency verification ------------------
//
// Everything above mocks `../config/db` at the "what SQL string/binds did
// we send" level — it proves the code sends the right statement, but not
// that the statement, if actually run, would compute the right numbers.
// Real Oracle access still isn't available in this sandbox (same gap
// since Task 2.10), so this section takes the closest available
// substitute: a small hand-rolled interpreter that understands exactly
// these two SQL shapes (the aggregation SELECT and the MERGE) and
// actually executes their intent — join/filter/group/sum for the
// former, find-or-insert keyed on food_id for the latter — against
// fixture `orders`/`order_items`/`popularity_stats` data. This is
// still not a substitute for a real `npx jest` run against live Oracle
// (it can't catch an Oracle-specific syntax error, for instance), but it
// does verify the *logic* 7.1's own task description calls for: correct
// counts, `Completed`-only filtering, and idempotent re-runs.
//
// Overrides `withConnection`/`withTransaction`'s mock implementation
// just for this describe block (restored in `afterEach` to the
// `mockConnection`-based double every other block in this file uses),
// rather than a second `jest.mock('../config/db', ...)` call — Jest
// only honors the first `jest.mock` per module per file.
function createFixtureConnection({ orders, orderItems, popularityStats }) {
  const state = { popularityStats: popularityStats.map((row) => ({ ...row })) };

  return {
    state,
    execute: jest.fn(async (sql, binds) => {
      if (sql.includes('GROUP BY oi.food_id')) {
        const completedOrderIds = new Set(
          orders.filter((o) => o.status === binds.completedStatus).map((o) => o.id)
        );
        const sums = new Map();
        orderItems
          .filter((oi) => completedOrderIds.has(oi.order_id))
          .forEach((oi) => {
            sums.set(oi.food_id, (sums.get(oi.food_id) || 0) + oi.quantity);
          });
        const rows = [...sums.entries()]
          .map(([food_id, completed_quantity]) => ({ food_id, completed_quantity }))
          .sort((a, b) => a.food_id - b.food_id);
        return { rows };
      }

      if (sql.includes('MERGE INTO popularity_stats')) {
        const { foodId, completedQuantity } = binds;
        const existing = state.popularityStats.find((row) => row.food_id === foodId);
        if (existing) {
          existing.completed_quantity = completedQuantity;
          existing.last_computed_at = 'RECOMPUTED_AT';
        } else {
          state.popularityStats.push({
            food_id: foodId,
            completed_quantity: completedQuantity,
            last_computed_at: 'RECOMPUTED_AT',
          });
        }
        return {};
      }

      throw new Error(`Fixture connection doesn't understand this SQL: ${sql}`);
    }),
    commit: jest.fn(async () => {}),
  };
}

function sortedByFoodId(rows) {
  return [...rows].sort((a, b) => a.food_id - b.food_id);
}

describe('Task 7.1d — correctness + idempotency verification', () => {
  // Two Completed orders and three non-Completed ones (one of each other
  // status), spread across three foods, deliberately including a food
  // (10) that appears in both a Completed and a non-Completed order, so
  // "only Completed counts" and "sums across multiple Completed orders"
  // are both exercised at once — not just "excludes everything from a
  // single Rejected order" in isolation.
  const orders = [
    { id: 1, status: 'Completed' },
    { id: 2, status: 'New' },
    { id: 3, status: 'Accepted' },
    { id: 4, status: 'Rejected' },
    { id: 5, status: 'Completed' },
  ];
  const orderItems = [
    { order_id: 1, food_id: 10, quantity: 3 },
    { order_id: 1, food_id: 20, quantity: 2 },
    { order_id: 2, food_id: 10, quantity: 100 }, // New — must not count
    { order_id: 3, food_id: 20, quantity: 50 }, // Accepted — must not count
    { order_id: 4, food_id: 10, quantity: 99 }, // Rejected — must not count
    { order_id: 5, food_id: 10, quantity: 5 },
    { order_id: 5, food_id: 30, quantity: 1 },
  ];
  // Expected: food 10 = 3 (order 1) + 5 (order 5) = 8; food 20 = 2
  // (order 1 only — order 3's 50 is Accepted); food 30 = 1 (order 5).
  const EXPECTED_SUMS = [
    { food_id: 10, completed_quantity: 8 },
    { food_id: 20, completed_quantity: 2 },
    { food_id: 30, completed_quantity: 1 },
  ];

  let fixtureConnection;

  beforeEach(() => {
    fixtureConnection = createFixtureConnection({ orders, orderItems, popularityStats: [] });
    withConnection.mockImplementation((work) => work(fixtureConnection));
    withTransaction.mockImplementation((work) => work(fixtureConnection));
  });

  afterEach(() => {
    withConnection.mockImplementation((work) => work(mockConnection));
    withTransaction.mockImplementation((work) => work(mockConnection));
  });

  test('getCompletedQuantitiesByFood sums only Completed orders, correctly excluding New/Accepted/Rejected', async () => {
    const result = await getCompletedQuantitiesByFood();

    expect(sortedByFoodId(result)).toEqual(EXPECTED_SUMS);
  });

  test('recomputePopularityStats creates a row for every food with completed sales, with the right sums', async () => {
    await recomputePopularityStats();

    expect(sortedByFoodId(fixtureConnection.state.popularityStats)).toEqual(
      EXPECTED_SUMS.map((row) => ({ ...row, last_computed_at: 'RECOMPUTED_AT' }))
    );
  });

  test('updates an existing popularity_stats row in place rather than duplicating it', async () => {
    fixtureConnection = createFixtureConnection({
      orders,
      orderItems,
      popularityStats: [{ food_id: 10, completed_quantity: 1, last_computed_at: 'STALE' }],
    });
    withConnection.mockImplementation((work) => work(fixtureConnection));
    withTransaction.mockImplementation((work) => work(fixtureConnection));

    await recomputePopularityStats();

    const food10Rows = fixtureConnection.state.popularityStats.filter((row) => row.food_id === 10);
    expect(food10Rows).toHaveLength(1);
    expect(food10Rows[0]).toMatchObject({ completed_quantity: 8, last_computed_at: 'RECOMPUTED_AT' });
  });

  test('running the recompute twice in a row is idempotent: no duplicate rows, same final numbers', async () => {
    await recomputePopularityStats();
    await recomputePopularityStats();

    const foodIds = fixtureConnection.state.popularityStats.map((row) => row.food_id);
    // No food_id appears twice — exactly one row per food, same
    // guarantee popularity_stats's own UNIQUE(food_id) constraint
    // enforces for real against Oracle.
    expect(new Set(foodIds).size).toBe(foodIds.length);
    expect(sortedByFoodId(fixtureConnection.state.popularityStats)).toEqual(
      EXPECTED_SUMS.map((row) => ({ ...row, last_computed_at: 'RECOMPUTED_AT' }))
    );
  });

  test('leaves an existing row untouched for a food with zero completed orders', async () => {
    fixtureConnection = createFixtureConnection({
      orders,
      orderItems,
      popularityStats: [{ food_id: 99, completed_quantity: 5, last_computed_at: 'UNTOUCHED' }],
    });
    withConnection.mockImplementation((work) => work(fixtureConnection));
    withTransaction.mockImplementation((work) => work(fixtureConnection));

    await recomputePopularityStats();

    // Food 99 never appears in orderItems at all, so 7.1a's query never
    // returns it and 7.1b's loop never visits it — its stale row survives
    // exactly as-is, matching recomputePopularityStats's own documented
    // "don't prune" decision.
    const food99Row = fixtureConnection.state.popularityStats.find((row) => row.food_id === 99);
    expect(food99Row).toEqual({ food_id: 99, completed_quantity: 5, last_computed_at: 'UNTOUCHED' });
  });
});
