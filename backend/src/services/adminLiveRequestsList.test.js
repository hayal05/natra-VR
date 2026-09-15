// adminLiveRequestsList.test.js — Task 6.6a, extended by 6.6c
//
// Same "mock ../config/db directly, not fakeDb" approach
// `adminRestaurantsList.test.js` (6.4a) already established — `fakeDb`
// only understands the single-table SQL shapes `crudFactory.js`
// generates, not a hand-written three-table-join query. `withConnection`
// issues the row-fetch and count queries via `Promise.all`, so responses
// are queued by a distinctive SQL substring (same helper) rather than by
// call order. `getLiveRequestForAdmin`'s own tests below (6.6c) use a
// plain single `mockResolvedValue` instead — that function issues just
// one query, no `Promise.all` pair to distinguish by substring.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { listLiveRequestsForAdmin, getLiveRequestForAdmin } = require('./adminLiveRequestsList');

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

describe('listLiveRequestsForAdmin', () => {
  test('fetches pending live requests joined with restaurant name + payment screenshot', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': {
        rows: [
          {
            id: 1,
            restaurant_id: 5,
            restaurant_name: 'Habesha Kitchen',
            status: 'pending',
            created_at: '2026-09-01T10:00:00.000Z',
            amount: 500,
            payment_screenshot_url: 'https://example.com/screenshot.jpg',
            submitted_at: '2026-09-01T10:01:00.000Z',
          },
        ],
      },
      'SELECT COUNT(*)': { rows: [{ total: 1 }] },
    });

    const { rows, meta } = await listLiveRequestsForAdmin({});

    expect(rows).toEqual([
      expect.objectContaining({
        id: 1,
        restaurant_name: 'Habesha Kitchen',
        payment_screenshot_url: 'https://example.com/screenshot.jpg',
      }),
    ]);
    expect(meta).toEqual({
      total: 1,
      limit: 20,
      offset: 0,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });

  test('both queries filter to status = pending only, no other WHERE conditions', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listLiveRequestsForAdmin({});

    const [rowsSql, rowsBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('FETCH NEXT')
    );
    expect(rowsSql).toMatch(/WHERE lr\.status = :status/);
    expect(rowsBinds).toEqual({ status: 'pending', pagingOffset: 0, pagingLimit: 20 });

    const [countSql, countBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('SELECT COUNT(*)')
    );
    expect(countSql).toMatch(/WHERE status = :status/);
    expect(countBinds).toEqual({ status: 'pending' });
  });

  test('joins restaurants and registration_payments (not a bare live_requests read)', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listLiveRequestsForAdmin({});

    const [rowsSql] = mockConnection.execute.mock.calls.find(([sql]) => sql.includes('FETCH NEXT'));
    expect(rowsSql).toMatch(/JOIN restaurants r ON r\.id = lr\.restaurant_id/);
    expect(rowsSql).toMatch(/JOIN registration_payments rp ON rp\.live_request_id = lr\.id/);
  });

  test('ordered oldest-first (ASC), unlike the dashboard activity feed\'s newest-first', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 0 }] },
    });

    await listLiveRequestsForAdmin({});

    const [rowsSql] = mockConnection.execute.mock.calls.find(([sql]) => sql.includes('FETCH NEXT'));
    expect(rowsSql).toMatch(/ORDER BY lr\.created_at ASC/);
  });

  test('page/limit are forwarded to OFFSET/FETCH via parsePaginationParams', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: 45 }] },
    });

    const { meta } = await listLiveRequestsForAdmin({ page: 3, limit: 10 });

    const [, rowsBinds] = mockConnection.execute.mock.calls.find(([sql]) =>
      sql.includes('FETCH NEXT')
    );
    expect(rowsBinds).toEqual({ status: 'pending', pagingOffset: 20, pagingLimit: 10 });
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
    await expect(listLiveRequestsForAdmin({ page: 'abc' })).rejects.toMatchObject({ status: 400 });
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('string-typed COUNT(*) value from the driver still coerces to a number', async () => {
    mockExecuteByQuery({
      'FETCH NEXT': { rows: [] },
      'SELECT COUNT(*)': { rows: [{ total: '3' }] },
    });

    const { meta } = await listLiveRequestsForAdmin({});

    expect(meta.total).toBe(3);
  });
});

describe('getLiveRequestForAdmin', () => {
  test('returns the joined row for a matching id', async () => {
    mockConnection.execute.mockResolvedValue({
      rows: [
        {
          id: 7,
          restaurant_id: 5,
          restaurant_name: 'Habesha Kitchen',
          status: 'pending',
          created_at: '2026-09-01T10:00:00.000Z',
          amount: 500,
          payment_screenshot_url: 'https://example.com/screenshot.jpg',
          submitted_at: '2026-09-01T10:01:00.000Z',
        },
      ],
    });

    const row = await getLiveRequestForAdmin(7);

    expect(row).toEqual(
      expect.objectContaining({
        id: 7,
        restaurant_name: 'Habesha Kitchen',
        payment_screenshot_url: 'https://example.com/screenshot.jpg',
      })
    );
    const [sql, binds] = mockConnection.execute.mock.calls[0];
    expect(sql).toMatch(/WHERE lr\.id = :id/);
    expect(sql).toMatch(/JOIN restaurants r ON r\.id = lr\.restaurant_id/);
    expect(sql).toMatch(/JOIN registration_payments rp ON rp\.live_request_id = lr\.id/);
    expect(binds).toEqual({ id: 7 });
  });

  test('no status filter — a non-pending (e.g. already-approved) request is still returned', async () => {
    mockConnection.execute.mockResolvedValue({
      rows: [{ id: 7, status: 'approved' }],
    });

    const row = await getLiveRequestForAdmin(7);

    expect(row.status).toBe('approved');
    const [sql] = mockConnection.execute.mock.calls[0];
    expect(sql).not.toMatch(/status = :status/);
  });

  test('a non-existent id throws a 404 ApiError with the same message crudFactory\'s getOrThrow would use', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    await expect(getLiveRequestForAdmin(999999)).rejects.toMatchObject({
      status: 404,
      publicMessage: 'live_requests not found',
    });
  });
});
