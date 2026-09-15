// paginate unit tests — Task 1.9
//
// Same fake-DB approach as crudFactory.test.js (see that file's header and
// ./testUtils/fakeDb.js): no live Oracle connection, no network. Split into
// two describe blocks — pure parsing/math (`parsePaginationParams`,
// `buildPaginationMeta`) needs no DB at all, while `paginate`/
// `paginateForOwner` are exercised against real crudFactory instances
// backed by the fake DB, the same way crudFactory itself is tested.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('./testUtils/fakeDb');
  return createFakeDb();
});

const crudFactory = require('./crudFactory');
const fakeDb = require('../config/db');
const {
  DEFAULT_LIMIT,
  parsePaginationParams,
  buildPaginationMeta,
  paginate,
  paginateForOwner,
} = require('./paginate');

beforeEach(() => {
  fakeDb.__reset();
});

describe('parsePaginationParams', () => {
  test('defaults to limit=DEFAULT_LIMIT, offset=0, page=1 with no input', () => {
    expect(parsePaginationParams()).toEqual({ limit: DEFAULT_LIMIT, offset: 0, page: 1 });
  });

  test('converts a 1-based page into the right offset', () => {
    expect(parsePaginationParams({ page: 3, limit: 10 })).toEqual({
      limit: 10,
      offset: 20,
      page: 3,
    });
  });

  test('accepts an explicit offset when page is not given', () => {
    expect(parsePaginationParams({ offset: 15, limit: 10 })).toEqual({
      limit: 10,
      offset: 15,
      page: 2, // floor(15/10) + 1
    });
  });

  test('page wins over offset when both are given', () => {
    expect(parsePaginationParams({ page: 2, offset: 999, limit: 10 })).toEqual({
      limit: 10,
      offset: 10,
      page: 2,
    });
  });

  test('accepts string query-param values (as req.query would provide)', () => {
    expect(parsePaginationParams({ page: '2', limit: '5' })).toEqual({
      limit: 5,
      offset: 5,
      page: 2,
    });
  });

  test('rejects a non-integer limit', () => {
    expect(() => parsePaginationParams({ limit: 'abc' })).toThrow(/"limit" must be a positive integer/);
  });

  test('rejects a zero or negative limit', () => {
    expect(() => parsePaginationParams({ limit: 0 })).toThrow(/positive integer/);
    expect(() => parsePaginationParams({ limit: -5 })).toThrow(/positive integer/);
  });

  test('rejects a limit above the max (default cap)', () => {
    expect(() => parsePaginationParams({ limit: 500 })).toThrow(/cannot exceed/);
  });

  test('respects a custom maxLimit option', () => {
    expect(() => parsePaginationParams({ limit: 30 }, { maxLimit: 25 })).toThrow(/cannot exceed 25/);
    expect(parsePaginationParams({ limit: 25 }, { maxLimit: 25 }).limit).toBe(25);
  });

  test('respects a custom defaultLimit option', () => {
    expect(parsePaginationParams({}, { defaultLimit: 5 }).limit).toBe(5);
  });

  test('rejects a zero or negative page', () => {
    expect(() => parsePaginationParams({ page: 0 })).toThrow(/positive integer/);
    expect(() => parsePaginationParams({ page: -1 })).toThrow(/positive integer/);
  });

  test('rejects a negative offset', () => {
    expect(() => parsePaginationParams({ offset: -1 })).toThrow(/non-negative integer/);
  });

  test('rejects a non-integer offset', () => {
    expect(() => parsePaginationParams({ offset: 'abc' })).toThrow(/non-negative integer/);
  });
});

describe('buildPaginationMeta', () => {
  test('computes totalPages, hasNextPage, hasPrevPage for a middle page', () => {
    const meta = buildPaginationMeta({ total: 45, limit: 10, offset: 10 });
    expect(meta).toEqual({
      total: 45,
      limit: 10,
      offset: 10,
      page: 2,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  test('first page has hasPrevPage=false', () => {
    const meta = buildPaginationMeta({ total: 45, limit: 10, offset: 0 });
    expect(meta.page).toBe(1);
    expect(meta.hasPrevPage).toBe(false);
    expect(meta.hasNextPage).toBe(true);
  });

  test('last page has hasNextPage=false, even when it is a partial page', () => {
    const meta = buildPaginationMeta({ total: 45, limit: 10, offset: 40 });
    expect(meta.page).toBe(5);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(false);
  });

  test('an empty result set reports totalPages=0, not 1', () => {
    const meta = buildPaginationMeta({ total: 0, limit: 10, offset: 0 });
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});

describe('paginate() — dummy "widgets" table', () => {
  const widgets = crudFactory({ table: 'widgets', columns: ['name', 'color'] });

  beforeEach(async () => {
    for (let i = 1; i <= 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await widgets.create({ name: `Widget ${i}`, color: i % 2 === 0 ? 'blue' : 'red' });
    }
  });

  test('returns the first page and correct total/meta by default', async () => {
    const { rows, meta } = await paginate(widgets, {}, {});
    expect(rows).toHaveLength(DEFAULT_LIMIT);
    expect(meta).toMatchObject({ total: 25, limit: DEFAULT_LIMIT, offset: 0, page: 1 });
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(false);
  });

  test('pages through the full set with no gaps or overlaps', async () => {
    const page1 = await paginate(widgets, {}, { page: 1, limit: 10 }, { orderBy: 'name' });
    const page2 = await paginate(widgets, {}, { page: 2, limit: 10 }, { orderBy: 'name' });
    const page3 = await paginate(widgets, {}, { page: 3, limit: 10 }, { orderBy: 'name' });

    expect(page1.rows).toHaveLength(10);
    expect(page2.rows).toHaveLength(10);
    expect(page3.rows).toHaveLength(5);
    expect(page3.meta.hasNextPage).toBe(false);

    const allIds = [...page1.rows, ...page2.rows, ...page3.rows].map((w) => w.id);
    expect(new Set(allIds).size).toBe(25); // no duplicate rows across pages
  });

  test('total reflects the filtered set, not the whole table', async () => {
    const { rows, meta } = await paginate(widgets, { color: 'blue' }, { limit: 5 });
    expect(rows.every((w) => w.color === 'blue')).toBe(true);
    expect(meta.total).toBe(12); // widgets 2,4,...,24
    expect(meta.totalPages).toBe(3);
  });

  test('rejects filtering by a non-allow-listed column (delegates to findAll/count)', async () => {
    await expect(paginate(widgets, { nope: 1 }, {})).rejects.toMatchObject({ status: 400 });
  });

  test('rejects invalid raw pagination params before touching the DB', async () => {
    await expect(paginate(widgets, {}, { limit: -1 })).rejects.toMatchObject({ status: 400 });
  });
});

describe('paginateForOwner() — dummy "gadgets" table', () => {
  const gadgets = crudFactory({
    table: 'gadgets',
    columns: ['owner_id', 'label'],
    ownerColumn: 'owner_id',
  });

  beforeEach(async () => {
    for (let i = 1; i <= 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await gadgets.create({ owner_id: 1, label: `Owner 1 Gadget ${i}` });
    }
    await gadgets.create({ owner_id: 2, label: 'Owner 2 Gadget' });
  });

  test('scopes both the page and the total to the given owner', async () => {
    const { rows, meta } = await paginateForOwner(gadgets, 1, {}, { limit: 5 });
    expect(rows.every((g) => g.owner_id === 1)).toBe(true);
    expect(meta.total).toBe(8);
    expect(meta.totalPages).toBe(2);
  });

  test('cannot be widened by a caller-supplied owner_id filter', async () => {
    const { meta } = await paginateForOwner(gadgets, 1, { owner_id: 2 }, {});
    expect(meta.total).toBe(8); // still owner 1's count, not owner 2's or the combined total
  });
});
