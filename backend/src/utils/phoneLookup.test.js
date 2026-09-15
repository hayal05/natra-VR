// phoneLookup unit tests — Task 1.10
//
// Same fake-DB approach as crudFactory.test.js/paginate.test.js (see
// crudFactory.test.js's header and ./testUtils/fakeDb.js): no live Oracle
// connection, no network.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('./testUtils/fakeDb');
  return createFakeDb();
});

const crudFactory = require('./crudFactory');
const fakeDb = require('../config/db');
const { phoneLookup, normalizePhone } = require('./phoneLookup');

beforeEach(() => {
  fakeDb.__reset();
});

describe('normalizePhone', () => {
  test('strips spaces and dashes', () => {
    expect(normalizePhone('0912 345 678')).toBe('0912345678');
    expect(normalizePhone('0912-345-678')).toBe('0912345678');
  });

  test('keeps a single leading "+"', () => {
    expect(normalizePhone('+251 912 345 678')).toBe('+251912345678');
  });

  test('two differently-formatted inputs normalize to the same value', () => {
    expect(normalizePhone('+251-91-234-5678')).toBe(normalizePhone('+251912345678'));
  });

  test('throws a 400 ApiError on an empty or whitespace-only phone', () => {
    expect(() => normalizePhone('')).toThrow(/phone number is required/);
    expect(() => normalizePhone('   ')).toThrow(/phone number is required/);
  });

  test('throws a 400 ApiError on a non-string phone', () => {
    expect(() => normalizePhone(undefined)).toThrow(/phone number is required/);
    expect(() => normalizePhone(12345)).toThrow(/phone number is required/);
  });

  test('throws when the input has no digits at all (e.g. just punctuation)', () => {
    expect(() => normalizePhone('----')).toThrow(/phone number is required/);
  });
});

describe('phoneLookup: config validation', () => {
  test('throws when config is missing', () => {
    expect(() => phoneLookup()).toThrow(/config object is required/);
  });

  test('throws when crud is missing or not crudFactory-shaped', () => {
    expect(() => phoneLookup({ phoneColumn: 'customer_phone' })).toThrow(/"crud" must be/);
    expect(() => phoneLookup({ crud: {}, phoneColumn: 'customer_phone' })).toThrow(/"crud" must be/);
  });

  test('throws when phoneColumn is missing', () => {
    const crud = crudFactory({ table: 'orders', columns: ['customer_phone', 'order_code'] });
    expect(() => phoneLookup({ crud })).toThrow(/"phoneColumn" is required/);
  });

  test('accepts a minimal valid config (codeColumn/entityName optional)', () => {
    const crud = crudFactory({ table: 'orders', columns: ['customer_phone', 'order_code'] });
    expect(() => phoneLookup({ crud, phoneColumn: 'customer_phone' })).not.toThrow();
  });
});

describe('phoneLookup — dummy "orders" table', () => {
  const orders = crudFactory({
    table: 'orders',
    columns: ['order_code', 'customer_phone', 'restaurant_id', 'status'],
  });
  const lookup = phoneLookup({
    crud: orders,
    phoneColumn: 'customer_phone',
    codeColumn: 'order_code',
    entityName: 'Order',
  });

  test('findAllByPhone() returns only rows matching the (normalized) phone', async () => {
    await orders.create({ order_code: 'NTR-1', customer_phone: '0912345678' });
    await orders.create({ order_code: 'NTR-2', customer_phone: '0912345678' });
    await orders.create({ order_code: 'NTR-3', customer_phone: '0999999999' });

    const { rows, meta } = await lookup.findAllByPhone('0912-345-678');
    expect(rows).toHaveLength(2);
    expect(rows.every((o) => o.customer_phone === '0912345678')).toBe(true);
    expect(meta.total).toBe(2);
  });

  test('findAllByPhone() matches differently-formatted input to the same stored number', async () => {
    await orders.create({ order_code: 'NTR-1', customer_phone: '+251912345678' });
    const { rows } = await lookup.findAllByPhone('+251 912 345 678');
    expect(rows).toHaveLength(1);
  });

  test('findAllByPhone() forwards pagination params through to paginate()', async () => {
    for (let i = 1; i <= 15; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await orders.create({ order_code: `NTR-${i}`, customer_phone: '0912345678' });
    }
    const page1 = await lookup.findAllByPhone('0912345678', {}, { page: 1, limit: 10 });
    expect(page1.rows).toHaveLength(10);
    expect(page1.meta.total).toBe(15);
    expect(page1.meta.hasNextPage).toBe(true);
  });

  test('findAllByPhone() cannot be widened by a caller-supplied filter on the phone column', async () => {
    await orders.create({ order_code: 'NTR-1', customer_phone: '0912345678' });
    await orders.create({ order_code: 'NTR-2', customer_phone: '0999999999' });
    const { meta } = await lookup.findAllByPhone('0912345678', { customer_phone: '0999999999' });
    expect(meta.total).toBe(1); // still scoped to the phone actually supplied
  });

  test('findAllByPhone() throws on a missing/empty phone before touching the DB', async () => {
    await expect(lookup.findAllByPhone('')).rejects.toMatchObject({ status: 400 });
  });

  test('findOneByCode() returns the row when both code and phone match', async () => {
    await orders.create({ order_code: 'NTR-42', customer_phone: '0912345678' });
    const found = await lookup.findOneByCode('NTR-42', '0912-345-678');
    expect(found).toMatchObject({ order_code: 'NTR-42', customer_phone: '0912345678' });
  });

  test('findOneByCode() returns null for a code that does not exist', async () => {
    await expect(lookup.findOneByCode('NTR-999', '0912345678')).resolves.toBeNull();
  });

  test('findOneByCode() returns null (not the row) when the code exists but the phone does not match', async () => {
    await orders.create({ order_code: 'NTR-42', customer_phone: '0912345678' });
    await expect(lookup.findOneByCode('NTR-42', '0999999999')).resolves.toBeNull();
  });

  test('findOneByCode() throws a 400 ApiError on a missing/empty code', async () => {
    await expect(lookup.findOneByCode('', '0912345678')).rejects.toMatchObject({ status: 400 });
  });

  test('findOneByCode() throws when codeColumn was never configured', async () => {
    const phoneOnlyLookup = phoneLookup({ crud: orders, phoneColumn: 'customer_phone' });
    await expect(phoneOnlyLookup.findOneByCode('NTR-1', '0912345678')).rejects.toThrow(/"codeColumn" must be configured/);
  });

  test('getOrThrowByCode() returns the row when it exists', async () => {
    await orders.create({ order_code: 'NTR-42', customer_phone: '0912345678' });
    const found = await lookup.getOrThrowByCode('NTR-42', '0912345678');
    expect(found.order_code).toBe('NTR-42');
  });

  test('getOrThrowByCode() throws a 404 ApiError (using entityName) when not found', async () => {
    await expect(lookup.getOrThrowByCode('NTR-999', '0912345678'))
      .rejects.toMatchObject({ status: 404, publicMessage: 'Order not found' });
  });

  test('getOrThrowByCode() throws the same 404 for a wrong phone as for a nonexistent code', async () => {
    await orders.create({ order_code: 'NTR-42', customer_phone: '0912345678' });
    await expect(lookup.getOrThrowByCode('NTR-42', '0999999999'))
      .rejects.toMatchObject({ status: 404 });
  });

  test('getOrThrowByCode() defaults entityName to "record" when not configured', async () => {
    const noNameLookup = phoneLookup({ crud: orders, phoneColumn: 'customer_phone', codeColumn: 'order_code' });
    await expect(noNameLookup.getOrThrowByCode('NTR-999', '0912345678'))
      .rejects.toMatchObject({ status: 404, publicMessage: 'record not found' });
  });
});
