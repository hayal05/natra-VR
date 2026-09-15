// customerFoodDetail.routes.test.js — Task 3.9
//
// Real Express app + real `supertest`, same split as
// `customerFood.routes.test.js` (Task 3.5): `popularFoods.test.js`'s
// `getPublicFoodById` describe block is the "is the query itself
// correct" layer; this file is the "does the route/controller/app
// wiring actually work" layer, including the mount-order regression
// `customerFoodDetail.routes.js`'s own header comment calls out (this
// path is a prefix match for the owner-scoped `/api/foods` router, so it
// must be mounted first — see `app.js`).
//
// `../config/db` is mocked with the same minimal `withConnection`-only
// double `popularFoods.test.js`/`customerFood.routes.test.js` use, not
// `fakeDb` (which can't parse the JOIN `getPublicFoodById` runs).

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const request = require('supertest');

const { withConnection } = require('../config/db');
const createApp = require('../app');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  // Same withConnection.mockClear() fix `liveCategories.test.js`/
  // `popularFoods.test.js` needed once real Jest actually ran them —
  // applied here from the start rather than found as a bug later.
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

const app = createApp();

const SAMPLE_FOOD_ROW = {
  id: 7,
  name: 'Doro Wat',
  description: 'Spicy chicken stew',
  price: 250,
  image_url: null,
  restaurant_id: 10,
  restaurant_name: 'Abeba Kitchen',
};

describe('GET /api/foods/detail/:id', () => {
  test('requires no Authorization header at all', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [SAMPLE_FOOD_ROW] });

    const res = await request(app).get('/api/foods/detail/7');

    expect(res.status).toBe(200);
    expect(res.body.food).toEqual(SAMPLE_FOOD_ROW);
  });

  test('an Authorization header sent anyway is simply ignored', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [SAMPLE_FOOD_ROW] });

    const res = await request(app)
      .get('/api/foods/detail/7')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(200);
    expect(res.body.food).toEqual(SAMPLE_FOOD_ROW);
  });

  test('404s on a nonexistent food id', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/foods/detail/999');

    expect(res.status).toBe(404);
  });

  // getPublicFoodById returns null identically for a nonexistent id, a
  // food belonging to a non-Live restaurant, and a hidden food — the
  // controller can't and shouldn't try to tell these apart at the HTTP
  // layer either (see popularFoods.js's own doc comment). This request
  // is indistinguishable from the "nonexistent id" case above by
  // construction, since the mock returns the same empty result either
  // way; the point of this test is documenting that indistinguishability
  // as intentional, not exercising different mock data.
  test('404s identically for a food that exists but is not currently visible', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/foods/detail/7');

    expect(res.status).toBe(404);
  });

  test('a non-numeric id still reaches the query layer as-is (no ownershipMiddleware here to reject it)', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/foods/detail/not-a-number');

    // No numeric-id guard exists on this public route (unlike the
    // owner-scoped ownershipMiddleware-backed routes) — it's just another
    // bind value that won't match any real id, so this resolves as a
    // plain 404, not a 400.
    expect(res.status).toBe(404);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    const [, binds] = mockConnection.execute.mock.calls[0];
    expect(binds.foodId).toBe('not-a-number');
  });

  test('a query failure surfaces as a 500 via the central error handler, not a hang/crash', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    const res = await request(app).get('/api/foods/detail/7');

    expect(res.status).toBe(500);
  });

  test('404s on POST — this router only ever exposes GET /:id', async () => {
    const res = await request(app).post('/api/foods/detail/7').send({ name: 'New' });

    expect(res.status).toBe(404);
  });

  // The actual regression app.js's mount-order comment exists to
  // prevent: this literal path must never fall through to the
  // owner-scoped '/api/foods' router's own 'GET /:id' route (which would
  // 401 via authMiddleware instead of reaching this public handler).
  test("is not shadowed by the owner-scoped /api/foods router's GET /:id", async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [SAMPLE_FOOD_ROW] });

    const res = await request(app).get('/api/foods/detail/7');

    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });

  // The mirror-image shadowing check: /api/foods/popular (Task 3.5) must
  // still resolve to its own router, not this one — both are siblings
  // mounted before /api/foods, and a literal-segment collision between
  // "detail" and "popular" isn't possible, but a route-order mistake
  // (e.g. this router accidentally mounted at /api/foods instead of
  // /api/foods/detail) would make this fail.
  test('does not swallow the sibling /api/foods/popular route', async () => {
    mockConnection.execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const res = await request(app).get('/api/foods/popular');

    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([]);
  });
});
