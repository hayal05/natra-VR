// submitOrder unit tests — Task 3.15b
//
// Same fake-DB double as createFoodWithVisibility.test.js (1.15c) — see
// utils/testUtils/fakeDb.js's header. fakeDb does not enforce
// `uq_orders_order_code` (it's not a general SQL engine), which is
// exactly why the order-code retry loop is exercised below by mocking
// `models/orders.js`'s `create` to throw a simulated `errorNum: 1` error
// rather than by a real collision — same standing caveat
// authController.test.js already documents for its own unique-constraint
// fallback.

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const fakeDb = require('../config/db');
const submitOrder = require('./submitOrder');
const foods = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');
const paymentMethods = require('../models/paymentMethods');
const orders = require('../models/orders');
const orderItems = require('../models/orderItems');
const restaurants = require('../models/restaurants');
const notifications = require('../models/notifications');

beforeEach(() => {
  fakeDb.__reset();
});

// --- Fixture helpers ------------------------------------------------

const RESTAURANT_A = 1;
const RESTAURANT_B = 2;

async function seedFood({ restaurant_id = RESTAURANT_A, name = 'Doro Wat', price = 250, hidden = false } = {}) {
  const food = await foods.create({ restaurant_id, name, price, description: null, image_url: null });
  await foodVisibility.create({ food_id: food.id, is_hidden: hidden ? 1 : 0 });
  return food;
}

// Task 7.5a — `notifyOwnerOfNewOrder` needs a real `restaurants` row
// (specifically its `owner_id`) to resolve `notifications.recipient_id`.
// None of the pre-7.5a tests above seed one (they only ever needed a
// `restaurant_id` to attach foods/payment methods to, not a real row),
// which is itself confirmed as a real, harmless case below — see "no
// notification (and no error) when the restaurant row doesn't exist".
// `id` isn't controllable via `restaurants.create` (crudFactory's own
// `create` doesn't accept a caller-supplied primary key), so this helper
// only works cleanly for `RESTAURANT_A` unless `fakeDb`'s own
// auto-increment happens to line up — the notify-specific describe block
// below sticks to a freshly seeded restaurant/food pair rather than
// reusing the fixed `RESTAURANT_A`/`RESTAURANT_B` constants, to avoid
// that coupling.
async function seedRestaurantWithFood({ ownerId = 42, price = 250 } = {}) {
  const restaurant = await restaurants.create({
    owner_id: ownerId,
    name: 'Test Restaurant',
    location_text: 'Bole',
    live_status: 'approved',
    is_suspended: 0,
    is_open: 1,
  });
  const food = await seedFood({ restaurant_id: restaurant.id, price });
  const paymentMethod = await seedPaymentMethod({ restaurant_id: restaurant.id });
  return { restaurant, food, paymentMethod };
}

async function seedPaymentMethod({ restaurant_id = RESTAURANT_A, is_active = 1 } = {}) {
  return paymentMethods.create({
    restaurant_id,
    method_name: 'Telebirr',
    account_number: '0912345678',
    account_name: 'Test Restaurant',
    instructions: 'Send and upload a screenshot',
    is_active,
  });
}

function validPayload(overrides = {}) {
  return {
    customer_name: 'Abebe Kebede',
    customer_phone: '0912 345 678',
    customer_location_text: 'Bole, behind Edna Mall',
    customer_note: null,
    payment_screenshot_url: 'https://example.com/screenshot.png',
    ...overrides,
  };
}

// --- Happy path -------------------------------------------------------

describe('submitOrder — happy path', () => {
  test('creates an order + order_items, computing subtotal/total from the foods table', async () => {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();

    const { order, items } = await submitOrder(
      validPayload({
        payment_method_id: paymentMethod.id,
        items: [{ food_id: food.id, quantity: 2 }],
      })
    );

    expect(order.restaurant_id).toBe(RESTAURANT_A);
    expect(order.subtotal).toBe(500);
    expect(order.total).toBe(500);
    expect(order.order_code).toMatch(/^NTR-\d{5}$/);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      order_id: order.id,
      food_id: food.id,
      food_name_snapshot: 'Doro Wat',
      unit_price_snapshot: 250,
      quantity: 2,
      line_total: 500,
    });
  });

  test('sums multiple items from the same restaurant correctly', async () => {
    const foodA = await seedFood({ name: 'Doro Wat', price: 250 });
    const foodB = await seedFood({ name: 'Kitfo', price: 180 });
    const paymentMethod = await seedPaymentMethod();

    const { order, items } = await submitOrder(
      validPayload({
        payment_method_id: paymentMethod.id,
        items: [
          { food_id: foodA.id, quantity: 1 },
          { food_id: foodB.id, quantity: 3 },
        ],
      })
    );

    expect(order.subtotal).toBe(250 + 180 * 3);
    expect(items).toHaveLength(2);
  });

  test('normalizes customer_phone before storing it', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const { order } = await submitOrder(
      validPayload({
        customer_phone: '+251 91-234-5678',
        payment_method_id: paymentMethod.id,
        items: [{ food_id: food.id, quantity: 1 }],
      })
    );

    expect(order.customer_phone).toBe('+251912345678');
  });

  test('ignores any client-supplied price/total-ish fields on an item — always re-reads from foods', async () => {
    const food = await seedFood({ price: 250 });
    const paymentMethod = await seedPaymentMethod();

    const { items } = await submitOrder(
      validPayload({
        payment_method_id: paymentMethod.id,
        items: [{ food_id: food.id, quantity: 1, unit_price_snapshot: 1, price: 1, line_total: 1 }],
      })
    );

    expect(items[0].unit_price_snapshot).toBe(250);
    expect(items[0].line_total).toBe(250);
  });
});

// --- Validation failures ----------------------------------------------

describe('submitOrder — validation', () => {
  test('rejects an empty items array', async () => {
    await expect(submitOrder(validPayload({ payment_method_id: 1, items: [] })))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rejects a missing items array', async () => {
    await expect(submitOrder(validPayload({ payment_method_id: 1 })))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rejects a non-positive or non-integer quantity', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 0 }] })
      )
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1.5 }] })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects an unknown food_id', async () => {
    const paymentMethod = await seedPaymentMethod();
    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: 999, quantity: 1 }] })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects a hidden food', async () => {
    const food = await seedFood({ hidden: true });
    const paymentMethod = await seedPaymentMethod();
    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects items spanning more than one restaurant', async () => {
    const foodA = await seedFood({ restaurant_id: RESTAURANT_A });
    const foodB = await seedFood({ restaurant_id: RESTAURANT_B });
    const paymentMethod = await seedPaymentMethod({ restaurant_id: RESTAURANT_A });

    await expect(
      submitOrder(
        validPayload({
          payment_method_id: paymentMethod.id,
          items: [
            { food_id: foodA.id, quantity: 1 },
            { food_id: foodB.id, quantity: 1 },
          ],
        })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects a payment_method_id belonging to a different restaurant', async () => {
    const food = await seedFood({ restaurant_id: RESTAURANT_A });
    const otherRestaurantsMethod = await seedPaymentMethod({ restaurant_id: RESTAURANT_B });

    await expect(
      submitOrder(
        validPayload({
          payment_method_id: otherRestaurantsMethod.id,
          items: [{ food_id: food.id, quantity: 1 }],
        })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects an inactive payment_method_id', async () => {
    const food = await seedFood();
    const inactiveMethod = await seedPaymentMethod({ is_active: 0 });

    await expect(
      submitOrder(
        validPayload({ payment_method_id: inactiveMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  test('rejects a nonexistent payment_method_id', async () => {
    const food = await seedFood();
    await expect(
      submitOrder(
        validPayload({ payment_method_id: 999, items: [{ food_id: food.id, quantity: 1 }] })
      )
    ).rejects.toMatchObject({ status: 400 });
  });
});

// --- Atomicity + order-code retry --------------------------------------

describe('submitOrder — transaction atomicity and order_code retry', () => {
  test('rolls back the whole order if a later order_items insert fails', async () => {
    const foodA = await seedFood({ name: 'Doro Wat' });
    const foodB = await seedFood({ name: 'Kitfo' });
    const paymentMethod = await seedPaymentMethod();

    const originalCreate = orderItems.create.bind(orderItems);
    let callCount = 0;
    jest.spyOn(orderItems, 'create').mockImplementation(async (...args) => {
      callCount += 1;
      // let the first item's insert through untouched, fail on the second
      if (callCount === 2) throw new Error('simulated order_items insert failure');
      return originalCreate(...args);
    });

    await expect(
      submitOrder(
        validPayload({
          payment_method_id: paymentMethod.id,
          items: [
            { food_id: foodA.id, quantity: 1 },
            { food_id: foodB.id, quantity: 1 },
          ],
        })
      )
    ).rejects.toThrow('simulated order_items insert failure');

    // Neither the order row nor the first (successfully inserted) item
    // survives — the whole transaction rolled back, same "no partial
    // write" guarantee createFoodWithVisibility.test.js (1.15c) already
    // verifies for its own food + food_visibility pair.
    expect(fakeDb.__getRows('orders')).toHaveLength(0);
    expect(fakeDb.__getRows('order_items')).toHaveLength(0);

    orderItems.create.mockRestore();
  });

  test('retries with a fresh order_code on a simulated unique-constraint collision', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const uniqueViolation = Object.assign(
      new Error('ORA-00001: unique constraint (NATRA.UQ_ORDERS_ORDER_CODE) violated'),
      { errorNum: 1 }
    );

    jest.spyOn(orders, 'create').mockImplementationOnce(() => {
      throw uniqueViolation;
    });

    const { order } = await submitOrder(
      validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
    );

    expect(order.order_code).toMatch(/^NTR-\d{5}$/);
    expect(fakeDb.__getRows('orders')).toHaveLength(1);
    orders.create.mockRestore();
  });

  test('gives up and throws after exhausting order_code retry attempts', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const uniqueViolation = Object.assign(
      new Error('ORA-00001: unique constraint (NATRA.UQ_ORDERS_ORDER_CODE) violated'),
      { errorNum: 1 }
    );

    jest.spyOn(orders, 'create').mockImplementation(() => {
      throw uniqueViolation;
    });

    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
      )
    ).rejects.toBe(uniqueViolation);

    expect(orders.create).toHaveBeenCalledTimes(5);
    expect(fakeDb.__getRows('orders')).toHaveLength(0);

    orders.create.mockRestore();
  });

  test('a non-unique-constraint error from the order insert is not retried', async () => {
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    jest.spyOn(orders, 'create').mockImplementation(() => {
      throw new Error('some unrelated DB failure');
    });

    await expect(
      submitOrder(
        validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
      )
    ).rejects.toThrow('some unrelated DB failure');

    expect(orders.create).toHaveBeenCalledTimes(1);
    orders.create.mockRestore();
  });
});

// --- Task 7.5a — owner notification on new order -----------------------

describe('submitOrder — notifies the owner of the new order (Task 7.5a)', () => {
  test('writes a new_order notification for the restaurant owner after the order commits', async () => {
    const { food, paymentMethod } = await seedRestaurantWithFood({ ownerId: 77 });

    const { order } = await submitOrder(
      validPayload({
        payment_method_id: paymentMethod.id,
        items: [{ food_id: food.id, quantity: 2 }],
      })
    );

    const rows = await notifications.findAll({ order_id: order.id });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      recipient_id: 77,
      type: 'new_order',
      restaurant_id: order.restaurant_id,
      order_id: order.id,
    });
    expect(rows[0].message).toContain(order.order_code);
    expect(rows[0].message).toContain('Bole, behind Edna Mall');
  });

  test('does not write a notification twice for two different orders', async () => {
    const { food, paymentMethod } = await seedRestaurantWithFood();

    const first = await submitOrder(
      validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
    );
    const second = await submitOrder(
      validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
    );

    const rows = await notifications.findAll({});
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.order_id).sort()).toEqual(
      [first.order.id, second.order.id].sort()
    );
  });

  test('order creation still succeeds when the restaurant row cannot be resolved', async () => {
    // None of this file's other tests (above this describe block) seed a
    // real `restaurants` row — only a bare `restaurant_id` on foods/
    // payment methods. Confirms `notifyOwnerOfNewOrder`'s own "restaurant
    // vanished -> nothing to notify, not an error" fallback doesn't
    // regress order creation itself.
    const food = await seedFood();
    const paymentMethod = await seedPaymentMethod();

    const { order } = await submitOrder(
      validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
    );

    expect(order.id).toBeDefined();
    expect(await notifications.findAll({ order_id: order.id })).toHaveLength(0);
  });

  test('order creation still succeeds when the notification write itself throws', async () => {
    const { food, paymentMethod } = await seedRestaurantWithFood();

    jest.spyOn(notifications, 'create').mockImplementation(() => {
      throw new Error('simulated notification write failure');
    });

    const { order } = await submitOrder(
      validPayload({ payment_method_id: paymentMethod.id, items: [{ food_id: food.id, quantity: 1 }] })
    );

    expect(order.id).toBeDefined();
    notifications.create.mockRestore();
  });
});
