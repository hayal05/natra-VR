// crudFactory unit tests — Task 1.3
//
// Runs against dummy tables that don't exist in the real NATRA schema
// ("widgets", "gadgets") — the point is exercising crudFactory's own
// logic, not any particular production table. The DB itself is a
// hand-rolled in-memory fake (see ./testUtils/fakeDb.js) swapped in for
// `../config/db` via jest.mock, so these tests run with no live Oracle
// connection and no network. `__reset()` clears it between tests so each
// test starts from an empty set of tables.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('./testUtils/fakeDb');
  return createFakeDb();
});

const crudFactory = require('./crudFactory');
const fakeDb = require('../config/db'); // the mocked module — same instance, plus __reset/__getRows

beforeEach(() => {
  fakeDb.__reset();
});

describe('crudFactory: config validation', () => {
  test('throws when table name is not a safe identifier', () => {
    expect(() => crudFactory({ table: 'widgets; DROP TABLE users;--', columns: ['name'] }))
      .toThrow(/invalid table name/);
  });

  test('throws when columns is missing or empty', () => {
    expect(() => crudFactory({ table: 'widgets' })).toThrow(/non-empty array/);
    expect(() => crudFactory({ table: 'widgets', columns: [] })).toThrow(/non-empty array/);
  });

  test('throws when columns includes the primary key', () => {
    expect(() => crudFactory({ table: 'widgets', columns: ['id', 'name'] }))
      .toThrow(/must not include the primary key/);
  });

  test('throws when a column name is not a safe identifier', () => {
    expect(() => crudFactory({ table: 'widgets', columns: ['name; --'] }))
      .toThrow(/invalid column/);
  });

  test('throws when ownerColumn is not also in columns', () => {
    expect(() => crudFactory({ table: 'widgets', columns: ['name'], ownerColumn: 'owner_id' }))
      .toThrow(/must also be listed in "columns"/);
  });

  test('accepts a minimal valid config', () => {
    expect(() => crudFactory({ table: 'widgets', columns: ['name'] })).not.toThrow();
  });
});

describe('crudFactory: core CRUD (Task 1.1) — dummy "widgets" table', () => {
  const widgets = crudFactory({ table: 'widgets', columns: ['name', 'color', 'price'] });

  test('create() inserts a row and returns it with generated id + created_at', async () => {
    const widget = await widgets.create({ name: 'Sprocket', color: 'red', price: 10 });
    expect(widget.id).toBe(1);
    expect(widget.name).toBe('Sprocket');
    expect(widget.color).toBe('red');
    expect(widget.created_at).toBeTruthy();
  });

  test('create() silently drops fields not on the columns allow-list (mass-assignment protection)', async () => {
    const widget = await widgets.create({ name: 'Cog', id: 999, role: 'admin' });
    expect(widget.id).not.toBe(999);
    expect(widget.role).toBeUndefined();
  });

  test('create() throws a 400 ApiError when there is nothing valid to insert', async () => {
    await expect(widgets.create({ id: 5, role: 'admin' })).rejects.toMatchObject({ status: 400 });
  });

  test('create() auto-increments ids across calls', async () => {
    const a = await widgets.create({ name: 'A' });
    const b = await widgets.create({ name: 'B' });
    expect(b.id).toBe(a.id + 1);
  });

  test('findById() returns the matching row', async () => {
    const created = await widgets.create({ name: 'Widget X' });
    const found = await widgets.findById(created.id);
    expect(found).toMatchObject({ id: created.id, name: 'Widget X' });
  });

  test('findById() returns null, not throw, for a missing id', async () => {
    await expect(widgets.findById(999999)).resolves.toBeNull();
  });

  test('findAll() with no filters returns every row', async () => {
    await widgets.create({ name: 'A' });
    await widgets.create({ name: 'B' });
    await widgets.create({ name: 'C' });
    const all = await widgets.findAll();
    expect(all).toHaveLength(3);
  });

  test('findAll() filters by an allow-listed column', async () => {
    await widgets.create({ name: 'Red One', color: 'red' });
    await widgets.create({ name: 'Blue One', color: 'blue' });
    await widgets.create({ name: 'Red Two', color: 'red' });
    const reds = await widgets.findAll({ color: 'red' });
    expect(reds).toHaveLength(2);
    expect(reds.every((w) => w.color === 'red')).toBe(true);
  });

  test('findAll() rejects filtering by a non-allow-listed column', async () => {
    await expect(widgets.findAll({ nonexistent_col: 1 })).rejects.toMatchObject({ status: 400 });
  });

  test('findAll() supports orderBy/orderDir/limit/offset', async () => {
    await widgets.create({ name: 'Cheap', price: 5 });
    await widgets.create({ name: 'Mid', price: 15 });
    await widgets.create({ name: 'Pricey', price: 25 });
    const top2 = await widgets.findAll({}, { orderBy: 'price', orderDir: 'DESC', limit: 2 });
    expect(top2.map((w) => w.name)).toEqual(['Pricey', 'Mid']);
  });

  test('findAll() rejects ordering by a non-allow-listed column', async () => {
    await expect(widgets.findAll({}, { orderBy: 'nonexistent_col' })).rejects.toMatchObject({ status: 400 });
  });

  test('update() updates allow-listed fields and returns the updated row', async () => {
    const created = await widgets.create({ name: 'Old Name', price: 10 });
    const updated = await widgets.update(created.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.price).toBe(10); // untouched field preserved
    expect(updated.updated_at).toBeTruthy();
  });

  test('update() drops non-allow-listed fields', async () => {
    const created = await widgets.create({ name: 'X' });
    const updated = await widgets.update(created.id, { name: 'Y', role: 'admin' });
    expect(updated.role).toBeUndefined();
  });

  test('update() returns null, not throw, for a missing id', async () => {
    await expect(widgets.update(999999, { name: 'Nope' })).resolves.toBeNull();
  });

  test('update() throws a 400 ApiError when there is nothing valid to set', async () => {
    const created = await widgets.create({ name: 'X' });
    await expect(widgets.update(created.id, { role: 'admin' })).rejects.toMatchObject({ status: 400 });
  });

  test('remove() deletes a row and returns true', async () => {
    const created = await widgets.create({ name: 'Gone Soon' });
    await expect(widgets.remove(created.id)).resolves.toBe(true);
    await expect(widgets.findById(created.id)).resolves.toBeNull();
  });

  test('remove() is idempotent: returns false for an already-deleted or unknown id', async () => {
    const created = await widgets.create({ name: 'X' });
    await widgets.remove(created.id);
    await expect(widgets.remove(created.id)).resolves.toBe(false);
    await expect(widgets.remove(999999)).resolves.toBe(false);
  });

  test('getOrThrow() returns the row when it exists', async () => {
    const created = await widgets.create({ name: 'X' });
    await expect(widgets.getOrThrow(created.id)).resolves.toMatchObject({ id: created.id });
  });

  test('getOrThrow() throws a 404 ApiError when the row does not exist', async () => {
    await expect(widgets.getOrThrow(999999)).rejects.toMatchObject({ status: 404 });
  });

  test('count() with no filters returns the total row count', async () => {
    await widgets.create({ name: 'A' });
    await widgets.create({ name: 'B' });
    await expect(widgets.count()).resolves.toBe(2);
  });

  test('count() applies the same equality filters findAll() does', async () => {
    await widgets.create({ name: 'Red One', color: 'red' });
    await widgets.create({ name: 'Blue One', color: 'blue' });
    await widgets.create({ name: 'Red Two', color: 'red' });
    await expect(widgets.count({ color: 'red' })).resolves.toBe(2);
  });

  test('count() rejects filtering by a non-allow-listed column, same as findAll()', async () => {
    await expect(widgets.count({ nonexistent_col: 1 })).rejects.toMatchObject({ status: 400 });
  });

  test('count() is unaffected by findAll()\'s limit/offset (counts the whole filtered set)', async () => {
    await widgets.create({ name: 'A' });
    await widgets.create({ name: 'B' });
    await widgets.create({ name: 'C' });
    const page = await widgets.findAll({}, { limit: 1 });
    expect(page).toHaveLength(1);
    await expect(widgets.count()).resolves.toBe(3);
  });

  test('two independently configured tables do not cross-talk', async () => {
    const gizmos = crudFactory({ table: 'gizmos', columns: ['label'] });
    await widgets.create({ name: 'A Widget' });
    await gizmos.create({ label: 'A Gizmo' });
    await expect(widgets.findAll()).resolves.toHaveLength(1);
    await expect(gizmos.findAll()).resolves.toHaveLength(1);
  });
});

describe('crudFactory: ownership scoping (Task 1.2) — dummy "gadgets" table', () => {
  const gadgets = crudFactory({
    table: 'gadgets',
    columns: ['owner_id', 'label', 'price'],
    ownerColumn: 'owner_id',
  });

  test('a factory without ownerColumn exposes no *ForOwner methods', () => {
    const plain = crudFactory({ table: 'widgets', columns: ['name'] });
    expect(plain.findAllForOwner).toBeUndefined();
    expect(plain.findByIdForOwner).toBeUndefined();
    expect(plain.updateForOwner).toBeUndefined();
    expect(plain.removeForOwner).toBeUndefined();
    expect(plain.getOrThrowForOwner).toBeUndefined();
    expect(plain.countForOwner).toBeUndefined();
    expect(plain.ownerColumn).toBeUndefined();
    // count() itself (Task 1.9) is base functionality, unlike the
    // *ForOwner methods — every factory gets it, owner-scoped or not.
    expect(plain.count).toBeInstanceOf(Function);
  });

  test('an owner-scoped factory exposes its ownerColumn as metadata', () => {
    expect(gadgets.ownerColumn).toBe('owner_id');
  });

  test('findAllForOwner() scopes results to the given owner', async () => {
    await gadgets.create({ owner_id: 1, label: 'Owner 1 Gadget A' });
    await gadgets.create({ owner_id: 1, label: 'Owner 1 Gadget B' });
    await gadgets.create({ owner_id: 2, label: 'Owner 2 Gadget' });
    const owner1Gadgets = await gadgets.findAllForOwner(1);
    expect(owner1Gadgets).toHaveLength(2);
    expect(owner1Gadgets.every((g) => g.owner_id === 1)).toBe(true);
  });

  test('findAllForOwner() overrides a conflicting caller-supplied owner_id filter', async () => {
    await gadgets.create({ owner_id: 1, label: 'A' });
    await gadgets.create({ owner_id: 1, label: 'B' });
    await gadgets.create({ owner_id: 2, label: 'C' });
    const result = await gadgets.findAllForOwner(1, { owner_id: 2 });
    expect(result).toHaveLength(2);
  });

  test('findByIdForOwner() returns the row when it belongs to the given owner', async () => {
    const created = await gadgets.create({ owner_id: 1, label: 'Mine' });
    const found = await gadgets.findByIdForOwner(created.id, 1);
    expect(found).toMatchObject({ id: created.id, label: 'Mine' });
  });

  test('findByIdForOwner() returns null for a different owner\'s row (not the row, not a throw)', async () => {
    const created = await gadgets.create({ owner_id: 2, label: 'Not Yours' });
    await expect(gadgets.findByIdForOwner(created.id, 1)).resolves.toBeNull();
  });

  test('findByIdForOwner() returns null for a nonexistent id, same as a wrong-owner row', async () => {
    await expect(gadgets.findByIdForOwner(999999, 1)).resolves.toBeNull();
  });

  test('updateForOwner() updates a row the caller owns', async () => {
    const created = await gadgets.create({ owner_id: 1, label: 'Mine', price: 10 });
    const updated = await gadgets.updateForOwner(created.id, 1, { price: 20 });
    expect(updated.price).toBe(20);
  });

  test('updateForOwner() cannot modify a different owner\'s row', async () => {
    const created = await gadgets.create({ owner_id: 2, label: 'Not Yours', price: 10 });
    const result = await gadgets.updateForOwner(created.id, 1, { price: 999 });
    expect(result).toBeNull();
    const stillOriginal = await gadgets.findById(created.id);
    expect(stillOriginal.price).toBe(10); // actually unchanged, not just a null return
  });

  test('updateForOwner() rejects an attempt to change ownerColumn itself', async () => {
    const created = await gadgets.create({ owner_id: 1, label: 'Mine' });
    await expect(gadgets.updateForOwner(created.id, 1, { owner_id: 2 }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('removeForOwner() deletes a row the caller owns', async () => {
    const created = await gadgets.create({ owner_id: 1, label: 'Mine' });
    await expect(gadgets.removeForOwner(created.id, 1)).resolves.toBe(true);
    await expect(gadgets.findById(created.id)).resolves.toBeNull();
  });

  test('countForOwner() scopes the count to the given owner', async () => {
    await gadgets.create({ owner_id: 1, label: 'Owner 1 Gadget A' });
    await gadgets.create({ owner_id: 1, label: 'Owner 1 Gadget B' });
    await gadgets.create({ owner_id: 2, label: 'Owner 2 Gadget' });
    await expect(gadgets.countForOwner(1)).resolves.toBe(2);
  });

  test('countForOwner() overrides a conflicting caller-supplied owner_id filter', async () => {
    await gadgets.create({ owner_id: 1, label: 'A' });
    await gadgets.create({ owner_id: 2, label: 'B' });
    await expect(gadgets.countForOwner(1, { owner_id: 2 })).resolves.toBe(1);
  });

  test('removeForOwner() cannot delete a different owner\'s row', async () => {
    const created = await gadgets.create({ owner_id: 2, label: 'Not Yours' });
    const result = await gadgets.removeForOwner(created.id, 1);
    expect(result).toBe(false);
    await expect(gadgets.findById(created.id)).resolves.not.toBeNull(); // still there
  });

  test('getOrThrowForOwner() returns the row when owned', async () => {
    const created = await gadgets.create({ owner_id: 1, label: 'Mine' });
    await expect(gadgets.getOrThrowForOwner(created.id, 1)).resolves.toMatchObject({ id: created.id });
  });

  test('getOrThrowForOwner() throws 404 for a different owner\'s row, same as missing', async () => {
    const created = await gadgets.create({ owner_id: 2, label: 'Not Yours' });
    await expect(gadgets.getOrThrowForOwner(created.id, 1)).rejects.toMatchObject({ status: 404 });
    await expect(gadgets.getOrThrowForOwner(999999, 1)).rejects.toMatchObject({ status: 404 });
  });

  test('unscoped methods remain available on an owner-scoped factory (e.g. for admin use)', async () => {
    const created = await gadgets.create({ owner_id: 2, label: 'Cross-owner via admin path' });
    await expect(gadgets.findById(created.id)).resolves.toMatchObject({ id: created.id });
  });
});

describe('crudFactory: create()/findById() with an external connection (Task 1.15c)', () => {
  const widgets = crudFactory({ table: 'widgets', columns: ['name', 'color', 'price'] });
  const gizmos = crudFactory({ table: 'gizmos', columns: ['name'] });

  test('create() with { connection } does not commit — a second table\'s failed insert can still be rolled back by the caller', async () => {
    await expect(
      fakeDb.withTransaction(async (connection) => {
        await widgets.create({ name: 'Orphan-shaped' }, { connection });
        throw new Error('pretend the second table\'s insert failed');
      })
    ).rejects.toThrow('pretend the second table\'s insert failed');

    // The widgets row from the aborted transaction must not have survived.
    expect(fakeDb.__getRows('widgets')).toHaveLength(0);
  });

  test('create() with { connection } persists both rows once the caller commits', async () => {
    const result = await fakeDb.withTransaction(async (connection) => {
      const widget = await widgets.create({ name: 'Paired' }, { connection });
      await gizmos.create({ name: `for-${widget.id}` }, { connection });
      await connection.commit();
      return widget;
    });

    expect(result.name).toBe('Paired');
    expect(fakeDb.__getRows('widgets')).toHaveLength(1);
    expect(fakeDb.__getRows('gizmos')).toHaveLength(1);
  });

  test('create() with { connection } returns the row with DB-generated fields populated (re-selected on the same connection)', async () => {
    const widget = await fakeDb.withTransaction(async (connection) => {
      const w = await widgets.create({ name: 'Same-session re-select' }, { connection });
      await connection.commit();
      return w;
    });

    expect(widget.id).toBeDefined();
    expect(widget.created_at).toBeDefined();
  });

  test('create() without { connection } still behaves exactly as before (default pool path)', async () => {
    const widget = await widgets.create({ name: 'Plain create, unaffected' });
    expect(widget.id).toBeDefined();
    expect(fakeDb.__getRows('widgets')).toHaveLength(1);
  });
});
