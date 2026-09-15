// updateOrderStatus unit tests — Task 5.14a
//
// Same fakeDb double as submitOrder.test.js (3.15b) — see
// utils/testUtils/fakeDb.js's header. Orders are seeded via `orders.create`
// (crudFactory) for every settable column, then their `status` is forced
// directly through a raw `UPDATE` on the mocked connection — the same
// gap `order.routes.test.js`'s own `GET /api/orders/:id` block already
// flags: fakeDb doesn't apply the real DB's `status` column DEFAULT
// ('New'), so a freshly-created fake row has `status: null`, not
// `'New'`. This module's whole job is guarding a *known* status's
// transitions, so every test here needs a real starting status set
// explicitly rather than relying on fakeDb to fake the DB default too.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const fakeDb = require('../config/db');
const updateOrderStatus = require('./updateOrderStatus');
const orders = require('../models/orders');

beforeEach(() => {
  fakeDb.__reset();
});

async function seedOrder({ status = 'New', restaurant_id = 1 } = {}) {
  const order = await orders.create({
    order_code: 'NTR-00001',
    restaurant_id,
    customer_name: 'Abebe Kebede',
    customer_phone: '0912345678',
    customer_location_text: 'Bole, behind Edna Mall',
    payment_method_id: 1,
    payment_screenshot_url: 'https://example.com/screenshot.png',
    subtotal: 250,
    total: 250,
  });
  await fakeDb.withConnection(async (connection) => {
    await connection.execute('UPDATE orders SET status = :status WHERE id = :id', {
      status,
      id: order.id,
    });
    await connection.commit();
  });
  return orders.findById(order.id);
}

describe('updateOrderStatus — allowed transitions', () => {
  test('New -> Accepted', async () => {
    const order = await seedOrder({ status: 'New' });

    const updated = await updateOrderStatus(order, 'Accepted');

    expect(updated.status).toBe('Accepted');
    expect(updated.status_updated_at).toBeTruthy();
    expect(updated.id).toBe(order.id);
  });

  test('New -> Rejected', async () => {
    const order = await seedOrder({ status: 'New' });

    const updated = await updateOrderStatus(order, 'Rejected');

    expect(updated.status).toBe('Rejected');
  });

  test('Accepted -> Completed (5.15\'s own future transition, already valid on this instance)', async () => {
    const order = await seedOrder({ status: 'Accepted' });

    const updated = await updateOrderStatus(order, 'Completed');

    expect(updated.status).toBe('Completed');
  });

  test('does not touch other rows\' status', async () => {
    const target = await seedOrder({ status: 'New', restaurant_id: 1 });
    const other = await seedOrder({ status: 'New', restaurant_id: 2 });

    await updateOrderStatus(target, 'Accepted');

    const otherAfter = await orders.findById(other.id);
    expect(otherAfter.status).toBe('New');
  });

  // Task 7.3b — New -> Expired, implementing 7.3a's design decision.
  // This module doesn't gate *who* can call it with 'Expired' as the
  // target (that's orderController.js's z.enum, which deliberately
  // excludes it — see this file's own header comment) — this test just
  // confirms the transition itself is valid on this shared instance,
  // the same as 5.14/5.15's tests do for Accepted/Rejected/Completed.
  test('New -> Expired', async () => {
    const order = await seedOrder({ status: 'New' });

    const updated = await updateOrderStatus(order, 'Expired');

    expect(updated.status).toBe('Expired');
    expect(updated.status_updated_at).toBeTruthy();
  });
});

describe('updateOrderStatus — disallowed transitions (409)', () => {
  test('New -> Completed is not allowed directly', async () => {
    const order = await seedOrder({ status: 'New' });

    await expect(updateOrderStatus(order, 'Completed')).rejects.toMatchObject({ status: 409 });
  });

  test('re-accepting an already-Accepted order is rejected', async () => {
    const order = await seedOrder({ status: 'Accepted' });

    await expect(updateOrderStatus(order, 'Accepted')).rejects.toMatchObject({ status: 409 });
  });

  test('Rejected is terminal — no further transition allowed', async () => {
    const order = await seedOrder({ status: 'Rejected' });

    await expect(updateOrderStatus(order, 'Accepted')).rejects.toMatchObject({ status: 409 });
  });

  test('Completed is terminal — no further transition allowed', async () => {
    const order = await seedOrder({ status: 'Completed' });

    await expect(updateOrderStatus(order, 'Rejected')).rejects.toMatchObject({ status: 409 });
  });

  // Task 7.3b
  test('Accepted -> Expired is not allowed — only a pending (New) order can expire', async () => {
    const order = await seedOrder({ status: 'Accepted' });

    await expect(updateOrderStatus(order, 'Expired')).rejects.toMatchObject({ status: 409 });
  });

  test('Expired is terminal — no further transition allowed', async () => {
    const order = await seedOrder({ status: 'Expired' });

    await expect(updateOrderStatus(order, 'Accepted')).rejects.toMatchObject({ status: 409 });
  });
});
