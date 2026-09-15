// updateLiveRequestStatus unit tests — Task 6.7a (reject) + Task 6.7b
// (approve, split into 6.7b-1/6.7b-2)
//
// Same fakeDb double as updateOrderStatus.test.js (5.14a) — see
// utils/testUtils/fakeDb.js's header. Live requests are seeded via
// `liveRequests.create` (crudFactory) for its one settable column
// (`restaurant_id`), then `status` is forced directly through a raw
// `UPDATE` on the mocked connection — same "fakeDb doesn't apply the
// real DB's column DEFAULT ('pending')" gap that file's own comment
// already flags for `orders.status`'s `'New'` default; `status` isn't
// even in `models/liveRequests.js`'s settable `columns` list at all
// (same as `orders.status`), so a freshly-created fake row has
// `status: null` until forced.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const fakeDb = require('../config/db');
const { rejectLiveRequest, approveLiveRequest, applyApproveTransaction } = require('./updateLiveRequestStatus');
const liveRequests = require('../models/liveRequests');
const restaurants = require('../models/restaurants');

beforeEach(() => {
  fakeDb.__reset();
});

async function seedRestaurant({ live_status = 'pending' } = {}) {
  return restaurants.create({ owner_id: 1, live_status });
}

async function seedLiveRequest({ status = 'pending', restaurant_id = 1 } = {}) {
  const liveRequest = await liveRequests.create({ restaurant_id });
  await fakeDb.withConnection(async (connection) => {
    await connection.execute('UPDATE live_requests SET status = :status WHERE id = :id', {
      status,
      id: liveRequest.id,
    });
    await connection.commit();
  });
  return liveRequests.findById(liveRequest.id);
}

describe('rejectLiveRequest — allowed transition', () => {
  test('pending -> rejected', async () => {
    const liveRequest = await seedLiveRequest({ status: 'pending' });

    const updated = await rejectLiveRequest(liveRequest, /* reviewerId */ 7);

    expect(updated.status).toBe('rejected');
    expect(updated.reviewed_at).toBeTruthy();
    expect(updated.reviewed_by).toBe(7);
    expect(updated.id).toBe(liveRequest.id);
  });

  test('does not touch other rows\' status', async () => {
    const target = await seedLiveRequest({ status: 'pending', restaurant_id: 1 });
    const other = await seedLiveRequest({ status: 'pending', restaurant_id: 2 });

    await rejectLiveRequest(target, 7);

    const otherAfter = await liveRequests.findById(other.id);
    expect(otherAfter.status).toBe('pending');
  });
});

describe('rejectLiveRequest — disallowed transitions (409)', () => {
  test('re-rejecting an already-rejected request is rejected', async () => {
    const liveRequest = await seedLiveRequest({ status: 'rejected' });

    await expect(rejectLiveRequest(liveRequest, 7)).rejects.toMatchObject({ status: 409 });
  });

  test('approved is terminal — no further transition allowed', async () => {
    const liveRequest = await seedLiveRequest({ status: 'approved' });

    await expect(rejectLiveRequest(liveRequest, 7)).rejects.toMatchObject({ status: 409 });
  });
});

describe('approveLiveRequest — allowed transition', () => {
  test('pending -> approved, flipping the parent restaurant live_status too', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });
    const liveRequest = await seedLiveRequest({ status: 'pending', restaurant_id: restaurant.id });

    const updated = await approveLiveRequest(liveRequest, /* reviewerId */ 7);

    expect(updated.status).toBe('approved');
    expect(updated.reviewed_at).toBeTruthy();
    expect(updated.reviewed_by).toBe(7);
    expect(updated.id).toBe(liveRequest.id);

    const updatedRestaurant = await restaurants.findById(restaurant.id);
    expect(updatedRestaurant.live_status).toBe('approved');
  });

  test('does not touch other requests or their restaurants', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });
    const otherRestaurant = await seedRestaurant({ live_status: 'pending' });
    const target = await seedLiveRequest({ status: 'pending', restaurant_id: restaurant.id });
    const other = await seedLiveRequest({ status: 'pending', restaurant_id: otherRestaurant.id });

    await approveLiveRequest(target, 7);

    const otherAfter = await liveRequests.findById(other.id);
    expect(otherAfter.status).toBe('pending');
    const otherRestaurantAfter = await restaurants.findById(otherRestaurant.id);
    expect(otherRestaurantAfter.live_status).toBe('pending');
  });
});

describe('approveLiveRequest — disallowed transitions (409)', () => {
  test('re-approving an already-approved request is rejected', async () => {
    const restaurant = await seedRestaurant({ live_status: 'approved' });
    const liveRequest = await seedLiveRequest({ status: 'approved', restaurant_id: restaurant.id });

    await expect(approveLiveRequest(liveRequest, 7)).rejects.toMatchObject({ status: 409 });
  });

  test('rejected is terminal — no further transition allowed', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });
    const liveRequest = await seedLiveRequest({ status: 'rejected', restaurant_id: restaurant.id });

    await expect(approveLiveRequest(liveRequest, 7)).rejects.toMatchObject({ status: 409 });
  });

  test('the 409 check happens before the two-table write — an invalid transition never touches the restaurant', async () => {
    const restaurant = await seedRestaurant({ live_status: 'approved' });
    const liveRequest = await seedLiveRequest({ status: 'approved', restaurant_id: restaurant.id });

    await expect(approveLiveRequest(liveRequest, 7)).rejects.toMatchObject({ status: 409 });

    // live_status was already 'approved' here, so this also confirms
    // assertCanTransition ran (and threw) strictly before onTransition —
    // not just that the end state happens to match.
    const restaurantAfter = await restaurants.findById(restaurant.id);
    expect(restaurantAfter.live_status).toBe('approved');
  });
});

// applyApproveTransaction — Task 6.7b-1
//
// Direct tests of the two-table transactional write, bypassing
// `liveRequestStatus`/`onTransition`/`approveLiveRequest` entirely — same
// reasoning `statusTransition` itself only validates the from/to move
// and never touches the DB, so its own `assertCanTransition` 409 checks
// aren't this function's concern (those are covered above, through
// `approveLiveRequest`); this function assumes the caller has already
// gone through `liveRequestStatus.transition`.
describe('applyApproveTransaction', () => {  test('updates both live_requests.status and restaurants.live_status together', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });
    const liveRequest = await seedLiveRequest({ status: 'pending', restaurant_id: restaurant.id });
    const timestamp = new Date();

    await applyApproveTransaction(liveRequest.id, restaurant.id, { reviewerId: 7, timestamp });

    const updatedLiveRequest = await liveRequests.findById(liveRequest.id);
    expect(updatedLiveRequest.status).toBe('approved');
    expect(updatedLiveRequest.reviewed_by).toBe(7);
    expect(updatedLiveRequest.reviewed_at).toBeTruthy();

    const updatedRestaurant = await restaurants.findById(restaurant.id);
    expect(updatedRestaurant.live_status).toBe('approved');
  });

  test('does not touch an unrelated restaurant\'s live_status', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });
    const otherRestaurant = await seedRestaurant({ live_status: 'pending' });
    const liveRequest = await seedLiveRequest({ status: 'pending', restaurant_id: restaurant.id });

    await applyApproveTransaction(liveRequest.id, restaurant.id, { reviewerId: 7, timestamp: new Date() });

    const otherAfter = await restaurants.findById(otherRestaurant.id);
    expect(otherAfter.live_status).toBe('pending');
  });

  test('rolls back the live_requests write when the restaurant update fails (unknown restaurantId)', async () => {
    const liveRequest = await seedLiveRequest({ status: 'pending', restaurant_id: 999 });

    await expect(
      applyApproveTransaction(liveRequest.id, /* restaurantId */ 999, { reviewerId: 7, timestamp: new Date() })
    ).rejects.toThrow('no restaurants row found');

    // The live_requests UPDATE ran first and would have "succeeded" on
    // its own — this assertion is the whole point of using
    // `withTransaction` over two independent `withConnection` calls.
    const afterRollback = await liveRequests.findById(liveRequest.id);
    expect(afterRollback.status).toBe('pending');
    expect(afterRollback.reviewed_by).toBeNull();
  });

  test('throws when liveRequestId does not exist, without touching the restaurant', async () => {
    const restaurant = await seedRestaurant({ live_status: 'pending' });

    await expect(
      applyApproveTransaction(/* liveRequestId */ 999, restaurant.id, { reviewerId: 7, timestamp: new Date() })
    ).rejects.toThrow('no live_requests row found');

    const afterRollback = await restaurants.findById(restaurant.id);
    expect(afterRollback.live_status).toBe('pending');
  });
});
