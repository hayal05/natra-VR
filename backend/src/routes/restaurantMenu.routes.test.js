// restaurantMenu.routes.test.js — Task 3.8
//
// A separate file from `restaurant.routes.test.js`, even though both
// exercise the same `restaurant.routes.js` router — same reasoning
// `customerFood.routes.test.js` (Task 3.5) already gave for being
// separate from any owner-scoped foods route suite: `GET /:id/foods`
// (this file) is backed by `restaurantMenu.js`'s hand-written JOIN via
// `withConnection` directly, while `GET /` and `GET /:id` (that file)
// go through `crudFactory`/`fakeDb`. The two db-mocking strategies
// (`fakeDb` vs a minimal `withConnection`-recording double) can't be
// shared in one file, so this is the "does the route/controller/app
// wiring actually work" layer for the menu endpoint specifically;
// `restaurantMenu.test.js` is the "is the query itself correct" layer.
//
// Because this mock doesn't understand `crudFactory`'s SQL shapes
// either, `restaurantsCrud.findById` (which `getMenu` calls first, to
// run the same Live check `getProfile` uses) is driven through this
// same recording double by hand — see `queueRestaurantThenRowsThenCount`
// below — rather than via a real `restaurants.create()` the way
// `restaurant.routes.test.js` does with `fakeDb`.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const request = require('supertest');

const { withConnection } = require('../config/db');
const createApp = require('../app');

let mockConnection;

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

const app = createApp();

function makeRestaurantRow(overrides = {}) {
  return {
    id: 1,
    owner_id: 1,
    name: 'Abeba Kitchen',
    phone: '0911000000',
    live_status: 'approved',
    is_suspended: 0,
    is_open: 1,
    ...overrides,
  };
}

// `getMenu` runs three queries in sequence: (1) `restaurantsCrud.findById`
// (crudFactory's single-row SELECT), then, only if that restaurant is
// Live, (2) the menu rows SELECT and (3) the COUNT — both from
// `listRestaurantMenu`. Queuing all three up front keeps each test's
// "arrange" step to one call, matching the shape
// `customerFood.routes.test.js`'s own `queueRowsThenCount` already
// established for the two-query case.
function queueRestaurantThenRowsThenCount(restaurantRow, rows, total) {
  mockConnection.execute
    .mockResolvedValueOnce({ rows: restaurantRow ? [restaurantRow] : [] })
    .mockResolvedValueOnce({ rows })
    .mockResolvedValueOnce({ rows: [{ total }] });
}

describe('GET /api/restaurants/:id/foods', () => {
  test('requires no Authorization header at all', async () => {
    queueRestaurantThenRowsThenCount(
      makeRestaurantRow(),
      [{ id: 1, name: 'Doro Wat', price: 250, restaurant_id: 1 }],
      1
    );

    const res = await request(app).get('/api/restaurants/1/foods');

    expect(res.status).toBe(200);
    expect(res.body.foods).toHaveLength(1);
    expect(res.body.foods[0].name).toBe('Doro Wat');
  });

  test('returns real pagination meta alongside the foods', async () => {
    queueRestaurantThenRowsThenCount(makeRestaurantRow(), [], 0);

    const res = await request(app).get('/api/restaurants/1/foods');

    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 0, totalPages: 0 });
  });

  test.each([
    ['pending', 0],
    ['rejected', 0],
    ['not_requested', 0],
    ['approved', 1],
  ])(
    '404s without ever querying the menu, for a non-Live restaurant (live_status=%s / is_suspended=%i)',
    async (live_status, is_suspended) => {
      mockConnection.execute.mockResolvedValueOnce({
        rows: [makeRestaurantRow({ live_status, is_suspended })],
      });

      const res = await request(app).get('/api/restaurants/1/foods');

      expect(res.status).toBe(404);
      // Only the one `findById` SELECT ran — the menu's rows/count
      // queries never fired, same "404 before touching the menu at
      // all" behavior `restaurantController.js`'s `getMenu` is meant
      // to have.
      expect(mockConnection.execute).toHaveBeenCalledTimes(1);
    }
  );

  test('404s for an id that does not exist at all', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/restaurants/999999/foods');

    expect(res.status).toBe(404);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('a malformed pagination param 400s, same as every other paginate()-backed route', async () => {
    mockConnection.execute.mockResolvedValueOnce({ rows: [makeRestaurantRow()] });

    const res = await request(app).get('/api/restaurants/1/foods').query({ limit: 'abc' });

    expect(res.status).toBe(400);
  });
});
