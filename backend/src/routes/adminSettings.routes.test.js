// adminSettings.routes.test.js — Task 4.3
//
// Same approach as restaurant.routes.test.js (3.3) and its public-route
// siblings: real Express app + supertest, fakeDb double. Unlike every
// owner-scoped suite (serviceArea.routes.test.js, etc.), no
// createOwnerWithRestaurant()/auth header is needed here — this route
// has no `authMiddleware` at all.
//
// `fakeDb` never runs migrations, so unlike a real DB (where migration
// 0010 seeds the `admin_settings` singleton row as part of the migration
// itself), each test that wants a row present has to create one first —
// `adminSettings.create(...)` in a fresh, empty `admin_settings` table
// gets fakeDb's own auto-incrementing `nextId` starting at 1, landing
// exactly on the `id = 1` the controller's `SETTINGS_ROW_ID` looks up, no
// different from any other crudFactory table's first-ever row.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const adminSettings = require('../models/adminSettings');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

describe('GET /api/admin-settings/registration', () => {
  test('no Authorization header required — this route is public', async () => {
    await adminSettings.create({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
      registration_instructions: 'Include your full name as the payment reference.',
    });

    const res = await request(app).get('/api/admin-settings/registration');
    expect(res.status).toBe(200);
  });

  test('returns exactly the five registration_* fields, nothing else', async () => {
    await adminSettings.create({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
      registration_instructions: 'Include your full name as the payment reference.',
      order_timeout_mode: '30m',
      order_timeout_custom_minutes: null,
      notify_before_expiry: 1,
    });

    const res = await request(app).get('/api/admin-settings/registration');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
      registration_instructions: 'Include your full name as the payment reference.',
    });
    // The order-timeout/notify columns are real columns on the same row
    // (confirmed set above) but must never leak through this endpoint —
    // see adminSettingsController.js's own header comment for why.
    expect(res.body.order_timeout_mode).toBeUndefined();
    expect(res.body.order_timeout_custom_minutes).toBeUndefined();
    expect(res.body.notify_before_expiry).toBeUndefined();
  });

  test('a null registration_instructions (optional field) comes through as null, not dropped', async () => {
    await adminSettings.create({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
      registration_instructions: null,
    });

    const res = await request(app).get('/api/admin-settings/registration');
    expect(res.status).toBe(200);
    expect(res.body.registration_instructions).toBeNull();
  });

  test('an unknown query param is simply ignored (this route takes none)', async () => {
    await adminSettings.create({
      registration_fee_amount: 500,
      registration_method_name: 'Telebirr',
      registration_account_number: '0911223344',
      registration_account_name: 'NATRA Platform',
    });

    const res = await request(app).get('/api/admin-settings/registration?foo=bar');
    expect(res.status).toBe(200);
  });

  test('404s if the settings row genuinely does not exist', async () => {
    // No adminSettings.create(...) call — fakeDb's admin_settings table
    // starts empty, unlike a real DB where migration 0010 always seeds
    // it. This exercises the safety-net branch adminSettingsController.js's
    // own header comment describes as "not an expected path" against a
    // real deployment.
    const res = await request(app).get('/api/admin-settings/registration');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Registration settings have not been configured yet');
  });
});
