// submitLiveRequest unit tests — Task 4.5b
//
// Same fake-DB double as submitOrder.test.js (3.15b) / crudFactory.test.js
// (1.3) — see utils/testUtils/fakeDb.js's header comment.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const fakeDb = require('../config/db');
const submitLiveRequest = require('./submitLiveRequest');
const registrationPayments = require('../models/registrationPayments');
const adminSettings = require('../models/adminSettings');

beforeEach(() => {
  fakeDb.__reset();
});

const RESTAURANT_A = 1;
const RESTAURANT_B = 2;

// `fakeDb` never runs migrations, so unlike a real DB (where migration
// 0010 seeds the `admin_settings` singleton row itself) each test that
// wants a row present has to create one first — a plain `create()` in a
// fresh, empty table lands on fakeDb's own auto-incrementing id=1, same
// convention `adminSettings.routes.test.js` (Task 4.3) already
// established for this exact table.
async function seedAdminSettings(overrides = {}) {
  return adminSettings.create({
    registration_fee_amount: 500,
    registration_method_name: 'Telebirr',
    registration_account_number: '0911223344',
    registration_account_name: 'NATRA',
    registration_instructions: null,
    ...overrides,
  });
}

function validPayload(overrides = {}) {
  return {
    restaurant_id: RESTAURANT_A,
    payment_screenshot_url: 'https://example.com/screenshot.png',
    ...overrides,
  };
}

describe('submitLiveRequest (Task 4.5b)', () => {
  test('creates a live_requests row and its registration_payments row together', async () => {
    await seedAdminSettings();

    const { liveRequest, payment } = await submitLiveRequest(validPayload());

    expect(liveRequest.id).toBeDefined();
    expect(liveRequest.restaurant_id).toBe(RESTAURANT_A);
    expect(payment.live_request_id).toBe(liveRequest.id);
    expect(payment.payment_screenshot_url).toBe('https://example.com/screenshot.png');
  });

  // `live_requests.status`'s DB `DEFAULT('pending')` is deliberately not
  // asserted anywhere in this suite — same reason `submitOrder.test.js`
  // (3.15b) never asserts on `orders.status` either: `fakeDb` doesn't
  // simulate column defaults (only columns a `create()` call explicitly
  // writes ever get set), so a freshly created row here comes back with
  // `status: null`, not `'pending'`. A real DB round trip is what
  // actually confirms that value, not this suite — see the
  // "already-pending" tests below, which simulate the real DEFAULT
  // directly in the fake store specifically because they need a
  // `'pending'` value to exercise that rule.

  test('amount is read from admin_settings, never from the request body', async () => {
    await seedAdminSettings({ registration_fee_amount: 750 });

    // A client-supplied `amount` in the payload is simply not read by
    // submitLiveRequest's destructuring at all — this test confirms the
    // real fee (750) wins regardless.
    const { payment } = await submitLiveRequest(validPayload({ amount: 1 }));
    expect(Number(payment.amount)).toBe(750);
  });

  test('rejects a missing restaurant_id', async () => {
    await seedAdminSettings();
    await expect(submitLiveRequest(validPayload({ restaurant_id: undefined }))).rejects.toThrow(
      /restaurant_id is required/
    );
  });

  test('rejects a non-integer restaurant_id', async () => {
    await seedAdminSettings();
    await expect(submitLiveRequest(validPayload({ restaurant_id: 'abc' }))).rejects.toThrow(
      /restaurant_id is required/
    );
  });

  test('rejects a missing payment_screenshot_url', async () => {
    await seedAdminSettings();
    await expect(
      submitLiveRequest(validPayload({ payment_screenshot_url: undefined }))
    ).rejects.toThrow(/payment_screenshot_url is required/);
  });

  test('rejects an empty/whitespace-only payment_screenshot_url', async () => {
    await seedAdminSettings();
    await expect(
      submitLiveRequest(validPayload({ payment_screenshot_url: '   ' }))
    ).rejects.toThrow(/payment_screenshot_url is required/);
  });

  test('rejects a second submission while one is already pending for the same restaurant', async () => {
    await seedAdminSettings();
    const first = await submitLiveRequest(validPayload());

    // fakeDb doesn't simulate `status`'s DB DEFAULT ('pending') the way
    // real Oracle does (same standing limitation `orders.status`
    // already has, per Task 3.15a's own log entry) — a freshly created
    // row here comes back with `status: null`, not `'pending'`.
    // Simulating the real DEFAULT directly in the fake store is what
    // actually lets this test exercise the "already pending" rule,
    // rather than accidentally passing because `null !== 'pending'`
    // never came close to matching in the first place.
    fakeDb.__getRows('live_requests').find((r) => r.id === first.liveRequest.id).status = 'pending';

    await expect(submitLiveRequest(validPayload())).rejects.toThrow(
      /already has a pending Live request/
    );

    // Confirmed by row count too, not just the error message: a second
    // request must never have been written.
    expect(fakeDb.__getRows('live_requests')).toHaveLength(1);
  });

  test('allows a new submission for a different restaurant while one restaurant has a pending request', async () => {
    await seedAdminSettings();
    const first = await submitLiveRequest(validPayload({ restaurant_id: RESTAURANT_A }));
    fakeDb.__getRows('live_requests').find((r) => r.id === first.liveRequest.id).status = 'pending';

    const { liveRequest } = await submitLiveRequest(validPayload({ restaurant_id: RESTAURANT_B }));
    expect(liveRequest.restaurant_id).toBe(RESTAURANT_B);
  });

  test('allows a new submission for the same restaurant once its prior request is no longer pending', async () => {
    await seedAdminSettings();
    const first = await submitLiveRequest(validPayload());

    // Simulate an admin having already reviewed the first request —
    // status is deliberately not settable via this model's `update`
    // (Task 4.5a), so this reaches into the fake store directly, the
    // same way `createFoodWithVisibility.test.js` reaches past its
    // models to assert on raw fakeDb rows.
    const rows = fakeDb.__getRows('live_requests');
    rows.find((r) => r.id === first.liveRequest.id).status = 'rejected';

    const second = await submitLiveRequest(validPayload());
    expect(second.liveRequest.id).not.toBe(first.liveRequest.id);
  });

  test('throws a plain (non-ApiError) Error when admin_settings is missing', async () => {
    // No seedAdminSettings() call — the singleton row doesn't exist in
    // this test's fake store.
    let caught;
    try {
      await submitLiveRequest(validPayload());
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught.status).toBeUndefined();
    expect(caught.message).toMatch(/admin_settings row \(id=1\) is missing/);
  });

  test('rolls back the live_requests insert if the registration_payments insert fails', async () => {
    await seedAdminSettings();

    const originalCreate = registrationPayments.create;
    jest.spyOn(registrationPayments, 'create').mockImplementationOnce(() => {
      throw new Error('simulated registration_payments insert failure');
    });

    await expect(submitLiveRequest(validPayload())).rejects.toThrow(
      'simulated registration_payments insert failure'
    );

    expect(fakeDb.__getRows('live_requests')).toHaveLength(0);
    expect(fakeDb.__getRows('registration_payments')).toHaveLength(0);

    registrationPayments.create = originalCreate;
  });
});
