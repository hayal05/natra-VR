// orderCode unit tests — Task 3.15a
//
// No fake DB needed here (unlike crudFactory.test.js/phoneLookup.test.js)
// — this module never touches the database, see orderCode.js's header.

const { generateOrderCode } = require('./orderCode');

describe('generateOrderCode', () => {
  test('matches the NTR-##### format from docs/DB_SCHEMA.md (e.g. "NTR-48291")', () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^NTR-\d{5}$/);
  });

  test('the numeric part stays within the documented 5-digit range across many calls', () => {
    for (let i = 0; i < 500; i += 1) {
      const code = generateOrderCode();
      const digits = Number(code.slice('NTR-'.length));
      expect(digits).toBeGreaterThanOrEqual(10000);
      expect(digits).toBeLessThanOrEqual(99999);
      expect(code).toHaveLength(9); // "NTR-" + exactly 5 digits, no more/fewer
    }
  });

  test('is not hardcoded to a single value (produces more than one distinct code across many calls)', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i += 1) {
      codes.add(generateOrderCode());
    }
    // Not asserting global uniqueness (that's a DB-constraint concern per
    // orderCode.js's header, exercised by submitOrder.test.js in 3.15b) —
    // just that this isn't silently returning the same code every time.
    expect(codes.size).toBeGreaterThan(1);
  });
});
