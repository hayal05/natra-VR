// customerSearch.routes.test.js — Task 3.6
//
// Real Express app + real `supertest`, same split as
// `customerCategory.routes.test.js` (3.4): this suite is the "does the
// route/controller/app wiring actually work" layer; `search.test.js` is
// the "is the query itself correct" layer. `../config/db` is mocked with
// the same minimal `withConnection`-only double (`fakeDb` can't parse a
// JOIN).

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

describe('GET /api/search', () => {
  test('requires no Authorization header at all', async () => {
    mockConnection.execute
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Cheese Burger' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, name: 'Burger House' }] });

    const res = await request(app).get('/api/search').query({ q: 'burger' });

    expect(res.status).toBe(200);
    expect(res.body.foods).toEqual([{ id: 1, name: 'Cheese Burger' }]);
    expect(res.body.restaurants).toEqual([{ id: 2, name: 'Burger House' }]);
  });

  test('400s when "q" is missing', async () => {
    const res = await request(app).get('/api/search');

    expect(res.status).toBe(400);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('400s when "q" is blank after trimming', async () => {
    const res = await request(app).get('/api/search').query({ q: '   ' });

    expect(res.status).toBe(400);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('returns clean empty arrays, not an error, when nothing matches', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/search').query({ q: 'nonexistent' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ query: 'nonexistent', foods: [], restaurants: [] });
  });

  test('a query failure surfaces as a 500 via the central error handler, not a hang/crash', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    const res = await request(app).get('/api/search').query({ q: 'burger' });

    expect(res.status).toBe(500);
  });

  test('404s on POST — this router only ever exposes GET /', async () => {
    const res = await request(app).post('/api/search').send({ q: 'burger' });

    expect(res.status).toBe(404);
  });
});
