// customerFood.routes.test.js — Task 3.5
//
// Real Express app + real `supertest`, same as `customerCategory.routes.test.js`
// (Task 3.4) — `../config/db` is mocked with the minimal `withConnection`
// -only double `popularFoods.test.js` also uses, not `fakeDb` (which
// can't parse a JOIN). This suite is the "does the route/controller/app
// wiring actually work" layer; `popularFoods.test.js` is the "is the
// query itself correct" layer.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const request = require('supertest');

const { withConnection } = require('../config/db');
const createApp = require('../app');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockImplementation((work) => work(mockConnection));
});

function queueRowsThenCount(rows, total) {
  mockConnection.execute
    .mockResolvedValueOnce({ rows })
    .mockResolvedValueOnce({ rows: [{ total }] });
}

const app = createApp();

describe('GET /api/foods/popular', () => {
  test('requires no Authorization header at all', async () => {
    queueRowsThenCount(
      [{ id: 1, name: 'Doro Wat', restaurant_id: 10, restaurant_name: 'Abeba Kitchen' }],
      1
    );

    const res = await request(app).get('/api/foods/popular');

    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([
      {
        id: 1,
        name: 'Doro Wat',
        description: undefined,
        price: undefined,
        image_url: undefined,
        restaurant_id: 10,
        restaurant_name: 'Abeba Kitchen',
      },
    ]);
    expect(res.body.meta).toMatchObject({ total: 1 });
  });

  test('an Authorization header sent anyway is simply ignored', async () => {
    queueRowsThenCount([], 0);

    const res = await request(app)
      .get('/api/foods/popular')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([]);
  });

  test('forwards limit/page query params into the pagination meta', async () => {
    queueRowsThenCount([], 12);

    const res = await request(app).get('/api/foods/popular?limit=4&page=2');

    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ limit: 4, page: 2, total: 12, totalPages: 3 });
  });

  test('a malformed limit is rejected with 400 before any query runs', async () => {
    const res = await request(app).get('/api/foods/popular?limit=abc');

    expect(res.status).toBe(400);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('returns a clean empty array, not an error, when nothing matches', async () => {
    queueRowsThenCount([], 0);

    const res = await request(app).get('/api/foods/popular');

    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('a query failure surfaces as a 500 via the central error handler, not a hang/crash', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    const res = await request(app).get('/api/foods/popular');

    expect(res.status).toBe(500);
  });

  test('404s on POST — this router only ever exposes GET /', async () => {
    const res = await request(app).post('/api/foods/popular').send({ name: 'New' });

    expect(res.status).toBe(404);
  });

  // The actual regression app.js's mount-order comment exists to
  // prevent: this literal path must never fall through to the
  // owner-scoped '/api/foods' router's own 'GET /:id' route (which would
  // 401 via authMiddleware instead of reaching this public handler).
  test("is not shadowed by the owner-scoped /api/foods router's GET /:id", async () => {
    queueRowsThenCount([], 0);

    const res = await request(app).get('/api/foods/popular');

    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });
});
