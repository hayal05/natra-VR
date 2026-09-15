// customerCategory.routes.test.js — Task 3.4
//
// Real Express app + real `supertest`, same as `restaurant.routes.test.js`
// (Task 3.3) — but `../config/db` is mocked with the minimal
// `withConnection`-only double from `services/liveCategories.test.js`
// rather than `fakeDb` (Task 1.3's double can't parse a JOIN — see that
// file's own header comment for the full reasoning). This suite is the
// "does the route/controller/app wiring actually work" layer;
// `liveCategories.test.js` is the "is the query itself correct" layer —
// same split `authController.test.js` vs. `authMiddleware.test.js`
// already established for auth (Task 1.14).

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

const app = createApp();

describe('GET /api/categories/live', () => {
  test('requires no Authorization header at all', async () => {
    mockConnection.execute.mockResolvedValue({
      rows: [{ name: 'Breakfast' }, { name: 'Drinks' }],
    });

    const res = await request(app).get('/api/categories/live');

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([{ name: 'Breakfast' }, { name: 'Drinks' }]);
  });

  test('an Authorization header sent anyway is simply ignored', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [{ name: 'Lunch' }] });

    const res = await request(app)
      .get('/api/categories/live')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([{ name: 'Lunch' }]);
  });

  test('returns a clean empty array, not an error, when nothing matches', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/categories/live');

    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([]);
  });

  test('a query failure surfaces as a 500 via the central error handler, not a hang/crash', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    const res = await request(app).get('/api/categories/live');

    expect(res.status).toBe(500);
  });

  test('404s on POST — this router only ever exposes GET /', async () => {
    const res = await request(app).post('/api/categories/live').send({ name: 'New' });

    expect(res.status).toBe(404);
  });

  // The actual regression this task's mount-order comment (app.js,
  // customerCategory.routes.js) exists to prevent: this literal path must
  // never fall through to the owner-scoped '/api/categories' router's own
  // 'GET /:id' route (which would 401 via authMiddleware instead of
  // reaching this public handler at all).
  test('is not shadowed by the owner-scoped /api/categories router\'s GET /:id', async () => {
    mockConnection.execute.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/categories/live');

    // A 401 here would mean the request got routed into
    // category.routes.js's authMiddleware chain instead of this public one.
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(200);
  });
});
