// upload.routes.test.js — Task 3.14
//
// Real Express app + real `supertest`, same split as
// `customerSearch.routes.test.js` (3.6): this is the "does the route/
// multer/controller wiring actually work" layer. `../config/objectStorage`
// is mocked (not `../config/db` — this route never touches the DB at
// all) with a recording double, same spirit as `fakeDb` elsewhere:
// real enough to assert against, with no real OCI network call.
//
// `compress: false` in `uploadController.js`'s call means
// `uploadToObjectStorage`'s `sharp` path is never taken for this route
// — deliberately not mocking `sharp` itself here, since exercising that
// codepath isn't this route's job (it's `uploadToObjectStorage`'s own,
// covered wherever that service gets its own dedicated test).

// Task 5.10 fix — same pre-existing gap `restaurant.routes.test.js`'s own
// header comment documents fixing for itself (Task 5.8): this file's
// restaurant-logo/restaurant-cover/food-photo tests all call
// `createOwnerWithRestaurant`, which logs in for a real JWT, but nothing
// here ever set `JWT_SECRET` — it only worked when another file's
// module-load-time assignment happened to already be sitting in the same
// worker process ahead of this file. Running this file on its own threw
// `secretOrPrivateKey must have a value` on login and `JWT_SECRET is not
// configured` on every authenticated request after, which is exactly the
// "7 more across paymentMethod.routes.test.js/upload.routes.test.js"
// failures `backend/README.md`'s Task 5.8 entry flagged without fixing.
// Same fix, same convention every sibling routes-test file already uses.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-prod';

jest.mock('../config/objectStorage', () => ({
  putObject: jest.fn().mockResolvedValue(undefined),
  getObject: jest.fn(),
  deleteObject: jest.fn(),
  getObjectUrl: jest.fn((objectName) => `https://fake-bucket.example.test/${objectName}`),
}));

// Task 5.3's new restaurant-logo/cover routes go through
// `uploadToObjectStorage`'s default `compress: true, generateThumbnail:
// true` path (unlike payment-screenshot above), which really invokes
// `sharp` on the uploaded bytes. Mocked here for the same reason this
// file's own header comment already gives for not exercising sharp's
// real behavior in a *route* test: that's `uploadToObjectStorage`'s own
// codepath to cover, not this route's — this file tests route/multer/
// controller wiring and folder naming, not image processing.
jest.mock('sharp', () => {
  const chain = {
    rotate: () => chain,
    resize: () => chain,
    jpeg: () => chain,
    webp: () => chain,
    png: () => chain,
    toBuffer: () => Promise.resolve(Buffer.from('fake-compressed-bytes')),
  };
  return jest.fn(() => chain);
});

// Only restaurant-logo/restaurant-cover (Task 5.3) are owner-
// authenticated and need a DB at all — payment-screenshot above never
// touches it. Same `fakeDb` double every other routes suite uses.
jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const request = require('supertest');

const { putObject, getObjectUrl } = require('../config/objectStorage');
const fakeDb = require('../config/db');
const restaurants = require('../models/restaurants');
const createApp = require('../app');

const app = createApp();

beforeEach(() => {
  putObject.mockClear();
  getObjectUrl.mockClear();
  fakeDb.__reset();
});

// Same shape as restaurant.routes.test.js's own `createOwnerWithRestaurant`
// — real signup + login, since `authMiddleware`/`attachOwnerRestaurant`
// need a real token/`req.user` to resolve, not just a restaurant row
// sitting in the table.
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

  return { token: loginRes.body.token, restaurantId: restaurant.id };
}

describe('POST /api/uploads/payment-screenshot', () => {
  test('requires no Authorization header at all', async () => {
    const res = await request(app)
      .post('/api/uploads/payment-screenshot')
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'screenshot.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
  });

  test('uploads the file as-is (no compression/thumbnail) and returns its URL', async () => {
    const res = await request(app)
      .post('/api/uploads/payment-screenshot')
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'screenshot.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      url: expect.stringContaining('payment-screenshots/'),
    });
    // Exactly one object written — no second (thumbnail) call, matching
    // `generateThumbnail: false` in uploadController.js.
    expect(putObject).toHaveBeenCalledTimes(1);
    expect(putObject.mock.calls[0][0]).toMatch(/^payment-screenshots\/.+\.jpg$/);
    expect(putObject.mock.calls[0][2]).toBe('image/jpeg');
    expect(getObjectUrl).toHaveBeenCalledTimes(1);
  });

  test('accepts png/webp/gif, matching the frontend ImageUploadField allow-list', async () => {
    const res = await request(app)
      .post('/api/uploads/payment-screenshot')
      .attach('image', Buffer.from('fake-png-bytes'), {
        filename: 'screenshot.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    expect(putObject.mock.calls[0][0]).toMatch(/\.png$/);
  });

  test('rejects an unsupported file type with 400, no object written', async () => {
    const res = await request(app)
      .post('/api/uploads/payment-screenshot')
      .attach('image', Buffer.from('%PDF-1.4 fake pdf bytes'), {
        filename: 'not-a-screenshot.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported file type/i);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('rejects a request with no file at all with 400', async () => {
    const res = await request(app).post('/api/uploads/payment-screenshot');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image file provided/i);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('rejects a file over multer\'s 15MB ceiling with 400, not a bare 500', async () => {
    const oversized = Buffer.alloc(16 * 1024 * 1024, 1);

    const res = await request(app)
      .post('/api/uploads/payment-screenshot')
      .attach('image', oversized, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(putObject).not.toHaveBeenCalled();
  });
});

// restaurant-logo / restaurant-cover — Task 5.3. Unlike
// payment-screenshot above, these ARE owner-authenticated, and go
// through `uploadToObjectStorage`'s default compress+thumbnail path
// (mocked `sharp`, see this file's header comment) rather than
// `compress: false`.
describe('POST /api/uploads/restaurant-logo', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/restaurant-logo')
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'logo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(401);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('403s for an authenticated owner with no restaurant yet (attachOwnerRestaurant, standing gap)', async () => {
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
      .post('/api/uploads/restaurant-logo')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'logo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(403);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('uploads to the restaurants/logos folder and returns url + thumbnailUrl', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/restaurant-logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'logo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/fake-bucket\.example\.test\/restaurants\/logos\/.+\.jpg$/);
    expect(res.body.thumbnailUrl).toMatch(
      /^https:\/\/fake-bucket\.example\.test\/restaurants\/logos\/.+-thumb\.jpg$/
    );
    // Main object + thumbnail — unlike payment-screenshot's single call,
    // since this route leaves `generateThumbnail` at its default `true`.
    expect(putObject).toHaveBeenCalledTimes(2);
  });

  test('rejects an unsupported file type with 400, no object written', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/restaurant-logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('%PDF-1.4 fake pdf bytes'), {
        filename: 'not-a-logo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('rejects a request with no file at all with 400', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/restaurant-logo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image file provided/i);
    expect(putObject).not.toHaveBeenCalled();
  });
});

describe('POST /api/uploads/restaurant-cover', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/restaurant-cover')
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(401);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('uploads to the restaurants/covers folder (distinct from logos)', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/restaurant-cover')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/fake-bucket\.example\.test\/restaurants\/covers\/.+\.jpg$/);
    expect(putObject).toHaveBeenCalledTimes(2);
  });

  test('two different owners uploading logos never collide (each gets its own random object name)', async () => {
    const ownerA = await createOwnerWithRestaurant();
    const ownerB = await createOwnerWithRestaurant();

    const resA = await request(app)
      .post('/api/uploads/restaurant-cover')
      .set('Authorization', `Bearer ${ownerA.token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), { filename: 'cover.jpg', contentType: 'image/jpeg' });
    const resB = await request(app)
      .post('/api/uploads/restaurant-cover')
      .set('Authorization', `Bearer ${ownerB.token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), { filename: 'cover.jpg', contentType: 'image/jpeg' });

    expect(resA.body.url).not.toBe(resB.body.url);
  });
});

// food-photo — Task 5.10. Same owner-authenticated, compress+thumbnail
// shape as restaurant-logo/cover above, just a different folder — see
// this file's header comment for why `sharp`/`objectStorage` stay
// mocked here rather than exercising real image processing.
describe('POST /api/uploads/food-photo', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/uploads/food-photo')
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(401);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('403s for an authenticated owner with no restaurant yet (attachOwnerRestaurant, standing gap)', async () => {
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
      .post('/api/uploads/food-photo')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(403);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('uploads to the foods/photos folder and returns url + thumbnailUrl', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/food-photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('fake-jpeg-bytes'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/fake-bucket\.example\.test\/foods\/photos\/.+\.jpg$/);
    expect(res.body.thumbnailUrl).toMatch(
      /^https:\/\/fake-bucket\.example\.test\/foods\/photos\/.+-thumb\.jpg$/
    );
    expect(putObject).toHaveBeenCalledTimes(2);
  });

  test('rejects an unsupported file type with 400, no object written', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/food-photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('%PDF-1.4 fake pdf bytes'), {
        filename: 'not-a-photo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(putObject).not.toHaveBeenCalled();
  });

  test('rejects a request with no file at all with 400', async () => {
    const { token } = await createOwnerWithRestaurant();

    const res = await request(app)
      .post('/api/uploads/food-photo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no image file provided/i);
    expect(putObject).not.toHaveBeenCalled();
  });
});
