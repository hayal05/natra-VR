// search.test.js — Task 3.6
//
// Same "mock ../config/db directly, not fakeDb" approach
// `liveCategories.test.js` (3.4) and `popularFoods.test.js`-equivalent
// verification (3.5) already established — `fakeDb` can't parse a JOIN.
// Unlike those two, this service issues *two* queries in parallel
// (`Promise.all`), so `mockConnection.execute` needs a call-order-aware
// implementation rather than one blanket `mockResolvedValue`.

jest.mock('../config/db', () => ({
  withConnection: jest.fn((work) => work(mockConnection)),
}));

const { withConnection } = require('../config/db');
const { searchFoodsAndRestaurants, escapeLikePattern } = require('./search');

let mockConnection;

function queueResults(foodsRows, restaurantsRows) {
  // The service always issues the foods query first, restaurants second
  // (Promise.all preserves call order even though both run concurrently)
  // — asserted explicitly below rather than just assumed here.
  mockConnection.execute
    .mockResolvedValueOnce({ rows: foodsRows })
    .mockResolvedValueOnce({ rows: restaurantsRows });
}

beforeEach(() => {
  mockConnection = { execute: jest.fn() };
  withConnection.mockClear();
  withConnection.mockImplementation((work) => work(mockConnection));
});

describe('escapeLikePattern', () => {
  test('escapes backslash, percent, and underscore, in that order', () => {
    expect(escapeLikePattern('50% off_combo')).toBe('50\\% off\\_combo');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  test('leaves ordinary text untouched', () => {
    expect(escapeLikePattern('Burger')).toBe('Burger');
  });
});

describe('searchFoodsAndRestaurants', () => {
  test('returns both foods and restaurants from the two queries', async () => {
    queueResults(
      [{ id: 1, name: 'Cheese Burger', restaurant_name: 'Bole Grill' }],
      [{ id: 2, name: 'Burger House' }]
    );

    const result = await searchFoodsAndRestaurants({ q: 'burger' });

    expect(result.foods).toEqual([{ id: 1, name: 'Cheese Burger', restaurant_name: 'Bole Grill' }]);
    expect(result.restaurants).toEqual([{ id: 2, name: 'Burger House' }]);
  });

  test('trims the query and wraps it in wildcards for both queries', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: '  burger  ' });

    const [, foodsBinds] = mockConnection.execute.mock.calls[0];
    const [, restaurantsBinds] = mockConnection.execute.mock.calls[1];
    expect(foodsBinds.pattern).toBe('%burger%');
    expect(restaurantsBinds.pattern).toBe('%burger%');
  });

  test('escapes literal % and _ in the search text before wrapping in wildcards', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: '50% off_combo' });

    const [, foodsBinds] = mockConnection.execute.mock.calls[0];
    expect(foodsBinds.pattern).toBe('%50\\% off\\_combo%');
  });

  test('filters foods to Live restaurants, visible only, via the shared Live definition', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: 'burger' });

    const [foodsSql, foodsBinds] = mockConnection.execute.mock.calls[0];
    const normalized = foodsSql.replace(/\s+/g, ' ').trim();
    expect(foodsBinds).toEqual(
      expect.objectContaining({ liveStatus: 'approved', isSuspended: 0, isHidden: 0 })
    );
    expect(normalized).toMatch(/JOIN restaurants r ON r\.id = f\.restaurant_id/i);
    expect(normalized).toMatch(/JOIN food_visibility fv ON fv\.food_id = f\.id/i);
    expect(normalized).toMatch(/fv\.is_hidden = :isHidden/i);
    expect(normalized).toMatch(/UPPER\(f\.name\) LIKE UPPER\(:pattern\) ESCAPE '\\'/i);
  });

  test('filters restaurants to the same Live definition', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: 'burger' });

    const [restaurantsSql, restaurantsBinds] = mockConnection.execute.mock.calls[1];
    const normalized = restaurantsSql.replace(/\s+/g, ' ').trim();
    expect(restaurantsBinds).toEqual(
      expect.objectContaining({ liveStatus: 'approved', isSuspended: 0 })
    );
    expect(normalized).toMatch(/UPPER\(r\.name\) LIKE UPPER\(:pattern\) ESCAPE '\\'/i);
  });

  test('defaults the result limit to 10 and caps a caller-supplied limit at 20', async () => {
    queueResults([], []);
    await searchFoodsAndRestaurants({ q: 'burger' });
    expect(mockConnection.execute.mock.calls[0][1].resultLimit).toBe(10);

    mockConnection.execute.mockReset();
    queueResults([], []);
    await searchFoodsAndRestaurants({ q: 'burger', limit: 999 });
    expect(mockConnection.execute.mock.calls[0][1].resultLimit).toBe(20);
  });

  test('falls back to the default limit on a non-numeric limit rather than throwing', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: 'burger', limit: 'not-a-number' });

    expect(mockConnection.execute.mock.calls[0][1].resultLimit).toBe(10);
  });

  test('borrows a single connection via withConnection for both queries', async () => {
    queueResults([], []);

    await searchFoodsAndRestaurants({ q: 'burger' });

    expect(withConnection).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);
  });

  test('propagates a query failure rather than swallowing it', async () => {
    mockConnection.execute.mockRejectedValue(new Error('ORA-00000: simulated failure'));

    await expect(searchFoodsAndRestaurants({ q: 'burger' })).rejects.toThrow('simulated failure');
  });
});
