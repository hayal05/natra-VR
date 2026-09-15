// attachOwnerRestaurant.test.js — Task 1.15a
//
// Same fake-db approach as authMiddleware.test.js (1.14e) and
// crudFactory.test.js (1.3): `../config/db` is swapped for
// `../utils/testUtils/fakeDb.js` so these run against the real
// `restaurants` model (1.15a) with no live Oracle connection.
//
// Covers: an owner with a restaurant gets req.user.restaurant_id +
// req.restaurant attached; an owner with no restaurant yet gets 403;
// a non-owner (admin) is passed through untouched; an unauthenticated
// request (no req.user at all) gets 401.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const attachOwnerRestaurant = require('./attachOwnerRestaurant');
const restaurants = require('../models/restaurants');
const fakeDb = require('../config/db'); // the mocked module — same instance, plus __reset

function fakeRes() {
  return {};
}

beforeEach(() => {
  fakeDb.__reset();
});

describe('attachOwnerRestaurant', () => {
  test('attaches restaurant_id and req.restaurant for an owner with a restaurant', async () => {
    const restaurant = await restaurants.create({
      owner_id: 42,
      name: 'Test Diner',
      phone: '555-0100',
      live_status: 'approved',
      is_suspended: 0,
      is_open: 1,
    });

    const req = { user: { id: 42, role: 'owner' } };
    const next = jest.fn();

    await attachOwnerRestaurant(req, fakeRes(), next);

    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.user.restaurant_id).toBe(restaurant.id);
    expect(req.restaurant).toMatchObject({ id: restaurant.id, name: 'Test Diner' });
  });

  test('rejects with 403 when the owner has no restaurant yet', async () => {
    const req = { user: { id: 99, role: 'owner' } };
    const next = jest.fn();

    await attachOwnerRestaurant(req, fakeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.status).toBe(403);
    expect(req.user.restaurant_id).toBeUndefined();
  });

  test('passes a non-owner (admin) through untouched, no lookup attempted', async () => {
    const req = { user: { id: 7, role: 'admin' } };
    const next = jest.fn();

    await attachOwnerRestaurant(req, fakeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.restaurant_id).toBeUndefined();
    expect(req.restaurant).toBeUndefined();
  });

  test('rejects with 401 when there is no req.user at all', async () => {
    const req = {};
    const next = jest.fn();

    await attachOwnerRestaurant(req, fakeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeTruthy();
    expect(err.status).toBe(401);
  });

  test('picks the first restaurant when an owner somehow has more than one', async () => {
    const first = await restaurants.create({
      owner_id: 5,
      name: 'First Place',
      phone: '555-0101',
      live_status: 'approved',
      is_suspended: 0,
      is_open: 1,
    });
    await restaurants.create({
      owner_id: 5,
      name: 'Second Place',
      phone: '555-0102',
      live_status: 'approved',
      is_suspended: 0,
      is_open: 1,
    });

    const req = { user: { id: 5, role: 'owner' } };
    const next = jest.fn();

    await attachOwnerRestaurant(req, fakeRes(), next);

    expect(req.user.restaurant_id).toBe(first.id);
  });
});
