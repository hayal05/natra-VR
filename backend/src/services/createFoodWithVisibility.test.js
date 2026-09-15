// createFoodWithVisibility unit tests — Task 1.15c
//
// Same fake-DB double as crudFactory.test.js (Task 1.3) — see
// utils/testUtils/fakeDb.js's header comment for why a hand-rolled
// in-memory fake instead of a real Oracle instance. This suite cares
// about one thing crudFactory's own tests don't cover: that a food and
// its food_visibility row are written as a single atomic pair, not that
// crudFactory's SQL-building is correct (that's crudFactory.test.js's
// job).

jest.mock('../config/db', () => {
  // eslint-disable-next-line global-require
  const { createFakeDb } = require('../utils/testUtils/fakeDb');
  return createFakeDb();
});

const fakeDb = require('../config/db');
const createFoodWithVisibility = require('./createFoodWithVisibility');
const foodVisibility = require('../models/foodVisibility');

beforeEach(() => {
  fakeDb.__reset();
});

const validFoodData = {
  restaurant_id: 1,
  category_id: null,
  name: 'Doro Wat',
  description: 'Spicy chicken stew',
  price: 250,
  image_url: null,
};

describe('createFoodWithVisibility (Task 1.15c)', () => {
  test('creates a foods row and a matching food_visibility row', async () => {
    const food = await createFoodWithVisibility(validFoodData);

    expect(food.id).toBeDefined();
    expect(food.name).toBe('Doro Wat');

    const visibilityRows = fakeDb.__getRows('food_visibility');
    expect(visibilityRows).toHaveLength(1);
    expect(visibilityRows[0].food_id).toBe(food.id);
  });

  test('the food_visibility row defaults to visible (is_hidden: 0)', async () => {
    const food = await createFoodWithVisibility(validFoodData);
    const visibility = await foodVisibility.findById(
      fakeDb.__getRows('food_visibility').find((r) => r.food_id === food.id).id
    );
    expect(visibility.is_hidden).toBe(0);
  });

  test('returns the food row, not the food_visibility row', async () => {
    const food = await createFoodWithVisibility(validFoodData);
    expect(food).toHaveProperty('restaurant_id', 1);
    expect(food).not.toHaveProperty('is_hidden');
  });

  test('two foods created back-to-back each get their own visibility row', async () => {
    const first = await createFoodWithVisibility(validFoodData);
    const second = await createFoodWithVisibility({ ...validFoodData, name: 'Kitfo' });

    expect(first.id).not.toBe(second.id);
    const visibilityFoodIds = fakeDb.__getRows('food_visibility').map((r) => r.food_id);
    expect(visibilityFoodIds).toEqual(expect.arrayContaining([first.id, second.id]));
  });

  test('rolls back the food insert if the food_visibility insert fails', async () => {
    // `foods` requires `restaurant_id` to be a real column value, but
    // nothing stops a caller-side bug from passing food_visibility a bad
    // shape — here we simulate that by making food_visibility.create
    // throw, and confirm the earlier foods.create in the same transaction
    // doesn't survive.
    const originalCreate = foodVisibility.create;
    jest.spyOn(foodVisibility, 'create').mockImplementationOnce(() => {
      throw new Error('simulated food_visibility insert failure');
    });

    await expect(createFoodWithVisibility(validFoodData)).rejects.toThrow(
      'simulated food_visibility insert failure'
    );

    expect(fakeDb.__getRows('foods')).toHaveLength(0);
    expect(fakeDb.__getRows('food_visibility')).toHaveLength(0);

    foodVisibility.create = originalCreate;
  });
});
