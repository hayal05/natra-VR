// restaurant.routes.test.js — Task 3.3
//
// Unlike every prior routes.test.js in this codebase (food/category/
// serviceArea/paymentMethod/openingHours, all 1.15/1.16), this one hits a
// genuinely public route: no `Authorization` header is ever sent here, on
// purpose — that's the point being tested. Real Express app + real
// `supertest`, `fakeDb` double for `../config/db`, same as every other
// routes suite.
//
// Restaurants are created directly via the `restaurants` model (not
// through a signup+create-restaurant flow like `serviceArea.routes.test.js`'s
// `createOwnerWithRestaurant` helper) since this suite needs full control
// over `live_status`/`is_suspended`/`is_open` combinations that don't
// correspond to any real onboarding flow yet (owner registration/Live
// request submission is Phase 4, admin approval is Phase 6 — neither
// exists in this codebase yet). `fakeDb` doesn't enforce the
// `restaurants.owner_id` FK (see its own header comment: it tests
// crudFactory's/controllers' own logic, not Oracle's constraint
// enforcement), so a plain placeholder `owner_id` is fine here.
//
// This file's own header above is stale on one point, noticed while
// adding Task 5.8's tests: `GET`/`PATCH /me` (Task 5.2) DOES send an
// `Authorization` header, via `createOwnerWithRestaurant`'s real
// signup+login — the "no Authorization header is ever sent" line only
// ever described this file's original Task 3.3 public-route tests. Left
// as-is rather than rewritten, since untangling exactly which of this
// file's now-many describe blocks the header comment is still accurate
// for isn't this task's job. What IS this task's fix: `JWT_SECRET` was
// never set here the way every other routes.test.js
// (category/serviceArea/paymentMethod/openingHours/food/
// adminSettings/liveRequest) sets it — harmless when this file runs
// inside the full `npx jest` suite (another file's module-load-time
// `process.env.JWT_SECRET = ...` happens to already be set in the same
// worker process by the time this file's authenticated tests run), but
// running `npx jest restaurant.routes` on its own throws `secretOrPrivateKey
// must have a value` on login and `JWT_SECRET is not configured` on
// every authenticated request after — a real test-isolation bug, not a
// flake, now fixed the same way every sibling file already has it.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const fakeDb = require('../config/db');
const createApp = require('../app');
const restaurants = require('../models/restaurants');
const serviceAreas = require('../models/serviceAreas');
const paymentMethods = require('../models/paymentMethods');

const app = createApp();

beforeEach(() => {
  fakeDb.__reset();
});

function makeRestaurant(overrides = {}) {
  return restaurants.create({
    owner_id: 1,
    name: 'Test Restaurant',
    phone: '0911000000',
    live_status: 'approved',
    is_suspended: 0,
    is_open: 1,
    ...overrides,
  });
}

// Same helper shape as category.routes.test.js's own
// `createOwnerWithRestaurant` — real signup + login (not
// `restaurants.create` directly, unlike `makeRestaurant` above) because
// `GET/PATCH /me` (Task 5.2) actually needs a real `req.user`/token for
// `authMiddleware`/`attachOwnerRestaurant` to resolve, not just a
// restaurant row sitting in the table.
async function createOwnerWithRestaurant(overrides = {}) {
  const email = overrides.email || `owner-${Math.random().toString(36).slice(2)}@example.test`;
  const password = 'correct horse battery staple';

  const signupRes = await request(app).post('/api/auth/signup').send({
    role: 'owner',
    full_name: 'Test Owner',
    email,
    phone: '0911000000',
    password,
  });
  const userId = signupRes.body.user.id;

  const restaurant = await restaurants.create({
    owner_id: userId,
    name: 'Test Restaurant',
    phone: '0911000000',
    ...overrides,
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });

  return { token: loginRes.body.token, userId, restaurantId: restaurant.id };
}

describe('GET /api/restaurants', () => {
  test('requires no Authorization header at all', async () => {
    await makeRestaurant({ name: 'Abeba Kitchen' });

    const res = await request(app).get('/api/restaurants');

    expect(res.status).toBe(200);
    expect(res.body.restaurants).toHaveLength(1);
    expect(res.body.restaurants[0].name).toBe('Abeba Kitchen');
  });

  test('an Authorization header, if sent anyway, is simply ignored', async () => {
    await makeRestaurant({ name: 'Abeba Kitchen' });

    const res = await request(app)
      .get('/api/restaurants')
      .set('Authorization', 'Bearer not-a-real-token-at-all');

    expect(res.status).toBe(200);
    expect(res.body.restaurants).toHaveLength(1);
  });

  test('returns a Live (approved + not suspended) restaurant', async () => {
    await makeRestaurant({ name: 'Live One', live_status: 'approved', is_suspended: 0 });

    const res = await request(app).get('/api/restaurants');

    expect(res.status).toBe(200);
    expect(res.body.restaurants.map((r) => r.name)).toEqual(['Live One']);
  });

  test.each([
    ['pending', 0],
    ['rejected', 0],
    ['not_requested', 0],
    ['approved', 1],
  ])('excludes live_status=%s / is_suspended=%i', async (live_status, is_suspended) => {
    await makeRestaurant({ name: 'Hidden', live_status, is_suspended });
    await makeRestaurant({ name: 'Visible', live_status: 'approved', is_suspended: 0 });

    const res = await request(app).get('/api/restaurants');

    expect(res.body.restaurants.map((r) => r.name)).toEqual(['Visible']);
  });

  test('a Live restaurant that is Closed (is_open = 0) is still returned', async () => {
    await makeRestaurant({ name: 'Closed But Live', is_open: 0 });

    const res = await request(app).get('/api/restaurants');

    expect(res.body.restaurants.map((r) => r.name)).toEqual(['Closed But Live']);
    expect(res.body.restaurants[0].is_open).toBe(0);
  });

  test('never leaks a non-Live restaurant even alongside Live ones', async () => {
    await makeRestaurant({ name: 'Live A' });
    await makeRestaurant({ name: 'Pending B', live_status: 'pending', is_suspended: 0 });
    await makeRestaurant({ name: 'Suspended C', live_status: 'approved', is_suspended: 1 });
    await makeRestaurant({ name: 'Live D' });

    const res = await request(app).get('/api/restaurants');

    expect(res.body.restaurants.map((r) => r.name).sort()).toEqual(['Live A', 'Live D']);
  });

  test('orders results by name ascending', async () => {
    await makeRestaurant({ name: 'Zeleman' });
    await makeRestaurant({ name: 'Abeba Kitchen' });
    await makeRestaurant({ name: 'Merkato Grill' });

    const res = await request(app).get('/api/restaurants');

    expect(res.body.restaurants.map((r) => r.name)).toEqual([
      'Abeba Kitchen',
      'Merkato Grill',
      'Zeleman',
    ]);
  });

  test('returns real pagination meta (paginate(), Task 1.9), scoped to the Live filter', async () => {
    await makeRestaurant({ name: 'Live A' });
    await makeRestaurant({ name: 'Live B' });
    await makeRestaurant({ name: 'Pending C', live_status: 'pending', is_suspended: 0 });

    const res = await request(app).get('/api/restaurants').query({ limit: 1, page: 1 });

    expect(res.status).toBe(200);
    expect(res.body.restaurants).toHaveLength(1);
    // total reflects the Live-filtered set (2), not the whole table (3).
    expect(res.body.meta).toMatchObject({
      total: 2,
      limit: 1,
      page: 1,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  test('a malformed pagination param 400s, same as every other paginate()-backed route', async () => {
    const res = await request(app).get('/api/restaurants').query({ limit: 'abc' });

    expect(res.status).toBe(400);
  });

  test('an empty result set (no Live restaurants at all) is a clean empty array, not an error', async () => {
    await makeRestaurant({ name: 'Pending', live_status: 'pending', is_suspended: 0 });

    const res = await request(app).get('/api/restaurants');

    expect(res.status).toBe(200);
    expect(res.body.restaurants).toEqual([]);
    expect(res.body.meta.total).toBe(0);
    expect(res.body.meta.totalPages).toBe(0);
  });

  test('POST is not a route on this router (no create endpoint yet)', async () => {
    const res = await request(app).post('/api/restaurants').send({ name: 'Nope' });
    expect(res.status).toBe(404);
  });

});

describe('GET /api/restaurants/:id', () => {
  test('requires no Authorization header at all', async () => {
    const restaurant = await makeRestaurant({ name: 'Solo' });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);

    expect(res.status).toBe(200);
    expect(res.body.restaurant.name).toBe('Solo');
  });

  test('returns the restaurant plus its service_areas, ordered by area_name', async () => {
    const restaurant = await makeRestaurant({
      name: 'Abeba Kitchen',
      phone: '0911223344',
      location_text: 'Bole, Addis Ababa',
      description: 'Home-style Ethiopian food.',
    });
    await serviceAreas.create({ restaurant_id: restaurant.id, area_name: 'Kazanchis' });
    await serviceAreas.create({ restaurant_id: restaurant.id, area_name: 'Bole' });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({
      id: restaurant.id,
      name: 'Abeba Kitchen',
      phone: '0911223344',
      location_text: 'Bole, Addis Ababa',
      description: 'Home-style Ethiopian food.',
    });
    expect(res.body.service_areas.map((a) => a.area_name)).toEqual(['Bole', 'Kazanchis']);
  });

  test('a restaurant with no service areas yet returns an empty array, not an error', async () => {
    const restaurant = await makeRestaurant({ name: 'No Areas Yet' });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);

    expect(res.status).toBe(200);
    expect(res.body.service_areas).toEqual([]);
  });

  test.each([
    ['pending', 0],
    ['rejected', 0],
    ['not_requested', 0],
    ['approved', 1],
  ])('404s for a non-Live restaurant (live_status=%s / is_suspended=%i)', async (live_status, is_suspended) => {
    const restaurant = await makeRestaurant({ name: 'Hidden', live_status, is_suspended });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);

    expect(res.status).toBe(404);
  });

  test('404s for an id that does not exist at all, same as a non-Live one', async () => {
    const res = await request(app).get('/api/restaurants/999999');
    expect(res.status).toBe(404);
  });

  test('a Live-but-Closed restaurant is still returned (status is the frontend\'s job)', async () => {
    const restaurant = await makeRestaurant({ name: 'Closed But Live', is_open: 0 });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}`);

    expect(res.status).toBe(200);
    expect(res.body.restaurant.is_open).toBe(0);
  });
});

// GET /api/restaurants/:id/payment-methods — Task 3.13. Unlike
// `GET /:id/foods` (Task 3.8, tested separately in
// restaurantMenu.routes.test.js because that endpoint's raw-SQL join
// needs a different mock than fakeDb can parse), this one is a plain
// single-table `findAllForOwner` read (`paymentMethodsCrud`, Task
// 1.16c) — fakeDb handles it the same way it already handles
// `serviceAreasCrud.findAllForOwner` in the `GET /:id` tests above, so
// it belongs in this file rather than its own.
describe('GET /api/restaurants/:id/payment-methods', () => {
  test('requires no Authorization header at all', async () => {
    const restaurant = await makeRestaurant({ name: 'Solo' });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'Telebirr',
      account_number: '0911223344',
      account_name: 'Solo Kitchen',
      is_active: 1,
    });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.status).toBe(200);
    expect(res.body.payment_methods).toHaveLength(1);
    expect(res.body.payment_methods[0].method_name).toBe('Telebirr');
  });

  test('excludes an inactive (is_active = 0) payment method', async () => {
    const restaurant = await makeRestaurant({ name: 'Abeba Kitchen' });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'CBE Birr',
      account_number: '1000123456789',
      account_name: 'Abeba Kitchen',
      is_active: 0,
    });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'Telebirr',
      account_number: '0911223344',
      account_name: 'Abeba Kitchen',
      is_active: 1,
    });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.body.payment_methods.map((m) => m.method_name)).toEqual(['Telebirr']);
  });

  test('orders results by method_name ascending, same as the owner-facing list', async () => {
    const restaurant = await makeRestaurant({ name: 'Abeba Kitchen' });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'Telebirr',
      account_number: '0911223344',
      account_name: 'Abeba Kitchen',
      is_active: 1,
    });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'Bank Transfer',
      account_number: '1000987654321',
      account_name: 'Abeba Kitchen',
      is_active: 1,
    });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'CBE Birr',
      account_number: '1000123456789',
      account_name: 'Abeba Kitchen',
      is_active: 1,
    });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.body.payment_methods.map((m) => m.method_name)).toEqual([
      'Bank Transfer',
      'CBE Birr',
      'Telebirr',
    ]);
  });

  test('cannot be widened to another restaurant\'s payment methods', async () => {
    const restaurantA = await makeRestaurant({ name: 'Restaurant A' });
    const restaurantB = await makeRestaurant({ name: 'Restaurant B', owner_id: 2 });
    await paymentMethods.create({
      restaurant_id: restaurantA.id,
      method_name: 'Telebirr (A)',
      account_number: '0911000001',
      account_name: 'Restaurant A',
      is_active: 1,
    });
    await paymentMethods.create({
      restaurant_id: restaurantB.id,
      method_name: 'Telebirr (B)',
      account_number: '0911000002',
      account_name: 'Restaurant B',
      is_active: 1,
    });

    const res = await request(app).get(`/api/restaurants/${restaurantA.id}/payment-methods`);

    expect(res.body.payment_methods.map((m) => m.method_name)).toEqual(['Telebirr (A)']);
  });

  test('a restaurant with no payment methods yet returns an empty array, not an error', async () => {
    const restaurant = await makeRestaurant({ name: 'No Methods Yet' });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.status).toBe(200);
    expect(res.body.payment_methods).toEqual([]);
  });

  test.each([
    ['pending', 0],
    ['rejected', 0],
    ['not_requested', 0],
    ['approved', 1],
  ])('404s for a non-Live restaurant (live_status=%s / is_suspended=%i)', async (live_status, is_suspended) => {
    const restaurant = await makeRestaurant({ name: 'Hidden', live_status, is_suspended });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.status).toBe(404);
  });

  test('404s for an id that does not exist at all, same as a non-Live one', async () => {
    const res = await request(app).get('/api/restaurants/999999/payment-methods');
    expect(res.status).toBe(404);
  });

  test('a Live-but-Closed restaurant\'s payment methods are still returned', async () => {
    const restaurant = await makeRestaurant({ name: 'Closed But Live', is_open: 0 });
    await paymentMethods.create({
      restaurant_id: restaurant.id,
      method_name: 'Telebirr',
      account_number: '0911223344',
      account_name: 'Closed But Live',
      is_active: 1,
    });

    const res = await request(app).get(`/api/restaurants/${restaurant.id}/payment-methods`);

    expect(res.status).toBe(200);
    expect(res.body.payment_methods).toHaveLength(1);
  });
});

// GET/PATCH /api/restaurants/me — Task 5.2. Unlike every other describe
// block in this file, these routes ARE authenticated (see
// restaurant.routes.js's own header comment on why they're the one
// exception on this router) — `createOwnerWithRestaurant` above, not
// `makeRestaurant`, drives every test here.
describe('GET /api/restaurants/me', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/restaurants/me');
    expect(res.status).toBe(401);
  });

  test('returns the caller\'s own restaurant', async () => {
    const { token } = await createOwnerWithRestaurant({ name: 'Abeba Kitchen' });

    const res = await request(app).get('/api/restaurants/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.restaurant.name).toBe('Abeba Kitchen');
  });

  test('403s for an authenticated owner with no restaurant yet (attachOwnerRestaurant, 1.15a)', async () => {
    const email = `owner-${Math.random().toString(36).slice(2)}@example.test`;
    const password = 'correct horse battery staple';
    await request(app).post('/api/auth/signup').send({
      role: 'owner',
      full_name: 'No Restaurant Owner',
      email,
      phone: '0911000000',
      password,
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });

    const res = await request(app)
      .get('/api/restaurants/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(403);
  });

  test('is not reachable by an admin (no restaurant to attach, same 403 as above)', async () => {
    const email = `admin-${Math.random().toString(36).slice(2)}@example.test`;
    const password = 'correct horse battery staple';
    await request(app).post('/api/auth/signup').send({
      role: 'admin',
      full_name: 'Test Admin',
      email,
      phone: '0911000000',
      password,
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });

    const res = await request(app)
      .get('/api/restaurants/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(403);
  });

  // The exact case restaurant.routes.js's own header comment on mount
  // order exists to prevent: a regression here would mean `/me` fell
  // through to `GET /:id` instead, which 404s on a non-numeric id rather
  // than ever reaching `getMe`.
  test('is not swallowed by GET /:id', async () => {
    const { token } = await createOwnerWithRestaurant({ name: 'Abeba Kitchen' });

    const res = await request(app).get('/api/restaurants/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).not.toBe(404);
    expect(res.body.restaurant).toBeDefined();
  });
});

describe('PATCH /api/restaurants/me', () => {
  test('requires authentication', async () => {
    const res = await request(app).patch('/api/restaurants/me').send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });

  test('updates name and description', async () => {
    const { token } = await createOwnerWithRestaurant({ name: 'Old Name' });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Abeba Kitchen', description: 'Home-style Ethiopian food.' });

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({
      name: 'Abeba Kitchen',
      description: 'Home-style Ethiopian food.',
    });
  });

  test('allows a partial update (description only)', async () => {
    const { token } = await createOwnerWithRestaurant({ name: 'Abeba Kitchen' });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Now with a description.' });

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({
      name: 'Abeba Kitchen',
      description: 'Now with a description.',
    });
  });

  test('allows clearing description back to null', async () => {
    const { token } = await createOwnerWithRestaurant({
      name: 'Abeba Kitchen',
      description: 'Will be cleared.',
    });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: null });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.description).toBeNull();
  });

  test('rejects an empty name', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });

    expect(res.status).toBe(400);
  });

  test('rejects a name over 120 characters', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'a'.repeat(121) });

    expect(res.status).toBe(400);
  });

  test('rejects an empty body (nothing to update)', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('rejects an unknown field', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '0922000000' });

    expect(res.status).toBe(400);
  });

  test('cannot update another owner\'s restaurant', async () => {
    const ownerA = await createOwnerWithRestaurant({ name: 'Restaurant A' });
    await createOwnerWithRestaurant({ name: 'Restaurant B' });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .send({ name: 'Still Restaurant A' });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.id).toBe(ownerA.restaurantId);
    expect(res.body.restaurant.name).toBe('Still Restaurant A');
  });

  // logo_url / cover_url — Task 5.3, extending 5.2's schema. Populated
  // in practice from `POST /api/uploads/restaurant-logo`/`restaurant-cover`
  // (see `upload.routes.test.js`'s own 5.3 suite), but this endpoint
  // takes each as a plain string field and never touches `req.file`.
  test('updates logo_url and cover_url', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logo_url: 'https://fake-bucket.example.test/restaurants/logos/abc.jpg',
        cover_url: 'https://fake-bucket.example.test/restaurants/covers/xyz.jpg',
      });

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({
      logo_url: 'https://fake-bucket.example.test/restaurants/logos/abc.jpg',
      cover_url: 'https://fake-bucket.example.test/restaurants/covers/xyz.jpg',
    });
  });

  test('allows clearing logo_url back to null', async () => {
    const { token } = await createOwnerWithRestaurant({
      logo_url: 'https://fake-bucket.example.test/restaurants/logos/old.jpg',
    });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ logo_url: null });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.logo_url).toBeNull();
  });

  test('rejects a logo_url that is not a valid URL', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ logo_url: 'not-a-url' });

    expect(res.status).toBe(400);
  });

  // is_open — Task 5.8 (Open/Closed toggle), extending 5.2's schema
  // the same way logo_url/cover_url (5.3) did. Same "boolean in, 0/1
  // stored" convention as payment_methods.is_active
  // (paymentMethod.routes.test.js, Task 1.16c) — mirrored tests here.
  test('toggles is_open (boolean in, 0/1 stored)', async () => {
    const { token } = await createOwnerWithRestaurant({ is_open: 1 });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_open: false });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.is_open).toBe(0);
  });

  test('toggles is_open back on', async () => {
    const { token } = await createOwnerWithRestaurant({ is_open: 0 });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_open: true });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.is_open).toBe(1);
  });

  test('rejects a non-boolean is_open with 400', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_open: 'true' });

    expect(res.status).toBe(400);
  });

  test('is_open can be sent alongside other fields in the same request', async () => {
    const { token } = await createOwnerWithRestaurant({ is_open: 1, name: 'Old Name' });

    const res = await request(app)
      .patch('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ is_open: false, name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.restaurant).toMatchObject({ is_open: 0, name: 'New Name' });
  });
});
