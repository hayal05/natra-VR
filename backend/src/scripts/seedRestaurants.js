// Standalone dev script for Task 0.13 — seeds fake restaurants (each with
// its own owner user) and uploads placeholder logo/cover images to Object
// Storage, so later screens (customer home, owner dashboard, admin lists)
// have something real to render against before Phase 1's crudFactory/auth
// exist.
//
// Extended in Task 0.14 to add, per restaurant: categories, foods (each
// with a food_visibility row, matching the service-layer convention noted
// in migration 0007), one payment method, and a couple of sample orders
// with order_items. The payment method isn't explicitly named in Task
// 0.14's title, but orders.payment_method_id is a required FK (see
// docs/DB_SCHEMA.md / migration 0009) — a sample order can't exist without
// one, so seeding it here is a necessary prerequisite, not scope creep.
//
// Usage: npm run seed:restaurants          (skips if seed data exists)
//        npm run seed:restaurants -- --force  (deletes existing seed data first)
require('dotenv').config();

const bcrypt = require('bcrypt');
const sharp = require('sharp');
const oracledb = require('oracledb');

const { withConnection, closePool } = require('../config/db');
const { putObject, getObjectUrl } = require('../config/objectStorage');

// Dev-only fake login for every seeded owner — Phase 1 (auth) doesn't exist
// yet, so this password isn't usable anywhere until then, but the hash is
// stored now so seeded owners work once login lands.
const SEED_PASSWORD = 'NatraSeed123!';
const SALT_ROUNDS = 10;
// All seeded users share this email domain so alreadySeeded()/--force can
// find and clean up exactly the rows this script created, without touching
// any real data that might exist alongside it.
const SEED_EMAIL_DOMAIN = '@example.test';

const LOGO_SIZE = 400; // square, px
const COVER_SIZE = { width: 1200, height: 480 };
const FOOD_IMAGE_SIZE = { width: 600, height: 400 };
const SCREENSHOT_SIZE = { width: 500, height: 900 }; // portrait, like a phone payment-app screenshot

// 4 fake home-kitchen/restaurant profiles around Addis Ababa. Each gets a
// distinct accent color so its placeholder logo/cover is visually
// distinguishable from the others in seeded screens (no real photography
// yet — that's a later, real-content task, not this one). Task 0.14 adds
// `menu` (categories + foods), `paymentMethod`, and `orders` to each.
const RESTAURANTS = [
  {
    slug: 'abeba-kitchen',
    ownerName: 'Abebech Tesfaye',
    ownerEmail: `abebech.tesfaye${SEED_EMAIL_DOMAIN}`,
    ownerPhone: '+251911000001',
    name: "Abeba's Kitchen",
    description:
      'Home-style Ethiopian classics — doro wat, kitfo, and injera made fresh every morning.',
    phone: '+251911000011',
    locationText: 'Bole, behind Edna Mall, Addis Ababa',
    accentColor: { r: 176, g: 58, b: 46 }, // deep red
    menu: {
      categories: ['Main Dishes', 'Sides', 'Drinks'],
      foods: [
        { name: 'Doro Wat', category: 'Main Dishes', price: 320, description: 'Spiced chicken stew with berbere, served with a boiled egg.' },
        { name: 'Kitfo', category: 'Main Dishes', price: 380, description: 'Minced beef seasoned with mitmita and niter kibbeh, served leb leb.' },
        { name: 'Shiro', category: 'Main Dishes', price: 210, description: 'Spiced chickpea stew, fasting-friendly.' },
        { name: 'Injera Combo', category: 'Sides', price: 90, description: 'Extra injera with a side of gomen and tomato salad.' },
        { name: 'Tibs', category: 'Main Dishes', price: 340, description: 'Sautéed beef with onion, pepper, and rosemary.' },
        { name: 'Avocado Juice', category: 'Drinks', price: 110, description: 'Fresh-pressed avocado juice, no added sugar.' },
      ],
    },
    paymentMethod: { methodName: 'Telebirr', accountNumber: '0911000011', accountName: 'Abebech Tesfaye' },
    orders: [
      {
        customerName: 'Yonas Bekele',
        customerPhone: '+251922000101',
        locationText: 'Bole, near Edna Mall, Addis Ababa',
        note: 'Extra spicy please',
        items: [{ food: 'Doro Wat', qty: 1 }, { food: 'Injera Combo', qty: 2 }],
        status: 'Completed',
      },
      {
        customerName: 'Sara Mulugeta',
        customerPhone: '+251922000102',
        locationText: 'CMC, Addis Ababa',
        note: null,
        items: [{ food: 'Kitfo', qty: 1 }, { food: 'Avocado Juice', qty: 1 }],
        status: 'New',
      },
    ],
  },
  {
    slug: 'green-leaf-vegan',
    ownerName: 'Selamawit Girma',
    ownerEmail: `selamawit.girma${SEED_EMAIL_DOMAIN}`,
    ownerPhone: '+251911000002',
    name: 'Green Leaf Vegan',
    description: 'Fasting-friendly vegan plates, fresh juices, and salads for the health-conscious.',
    phone: '+251911000012',
    locationText: 'Kazanchis, near UNECA, Addis Ababa',
    accentColor: { r: 46, g: 125, b: 50 }, // green
    menu: {
      categories: ['Vegan Mains', 'Salads', 'Juices'],
      foods: [
        { name: 'Vegan Buddha Bowl', category: 'Vegan Mains', price: 260, description: 'Quinoa, roasted vegetables, chickpeas, tahini dressing.' },
        { name: 'Shiro Fasting Combo', category: 'Vegan Mains', price: 220, description: 'Shiro, gomen, and misir wat with injera.' },
        { name: 'Lentil Salad', category: 'Salads', price: 180, description: 'Green lentils, tomato, onion, lemon dressing.' },
        { name: 'Beet Juice', category: 'Juices', price: 100, description: 'Fresh-pressed beet and carrot juice.' },
        { name: 'Avocado Smoothie', category: 'Juices', price: 120, description: 'Avocado, banana, and a touch of honey.' },
      ],
    },
    paymentMethod: { methodName: 'CBE Birr', accountNumber: '1000234567890', accountName: 'Selamawit Girma' },
    orders: [
      {
        customerName: 'Betelhem Assefa',
        customerPhone: '+251922000103',
        locationText: 'Kazanchis, Addis Ababa',
        note: 'No onions',
        items: [{ food: 'Vegan Buddha Bowl', qty: 2 }],
        status: 'Accepted',
      },
      {
        customerName: 'Kaleb Fikru',
        customerPhone: '+251922000104',
        locationText: 'Piassa, Addis Ababa',
        note: null,
        items: [{ food: 'Lentil Salad', qty: 1 }, { food: 'Beet Juice', qty: 2 }],
        status: 'Rejected',
      },
    ],
  },
  {
    slug: 'sunrise-bakery-cafe',
    ownerName: 'Dawit Alemu',
    ownerEmail: `dawit.alemu${SEED_EMAIL_DOMAIN}`,
    ownerPhone: '+251911000003',
    name: 'Sunrise Bakery & Café',
    description: 'Fresh bread, pastries, macchiato, and light breakfast plates.',
    phone: '+251911000013',
    locationText: 'CMC, near the Total gas station, Addis Ababa',
    accentColor: { r: 230, g: 145, b: 26 }, // amber
    menu: {
      categories: ['Pastries', 'Breakfast', 'Coffee'],
      foods: [
        { name: 'Butter Croissant', category: 'Pastries', price: 90, description: 'Flaky, baked fresh every morning.' },
        { name: 'Cheese Sambusa', category: 'Pastries', price: 60, description: 'Crispy pastry filled with spiced cheese.' },
        { name: 'Breakfast Plate', category: 'Breakfast', price: 190, description: 'Eggs, bread, avocado, and a side of fruit.' },
        { name: 'Cinnamon Roll', category: 'Pastries', price: 100, description: 'Soft roll with cinnamon-sugar swirl and glaze.' },
        { name: 'Macchiato', category: 'Coffee', price: 55, description: 'Espresso with a dash of steamed milk.' },
      ],
    },
    paymentMethod: { methodName: 'Telebirr', accountNumber: '0911000013', accountName: 'Dawit Alemu' },
    orders: [
      {
        customerName: 'Hana Girma',
        customerPhone: '+251922000105',
        locationText: 'CMC, Addis Ababa',
        note: null,
        items: [{ food: 'Breakfast Plate', qty: 1 }, { food: 'Macchiato', qty: 1 }],
        status: 'Completed',
      },
      {
        customerName: 'Nathnael Tesfaye',
        customerPhone: '+251922000106',
        locationText: 'Summit, Addis Ababa',
        note: 'Two extra napkins',
        items: [{ food: 'Cinnamon Roll', qty: 3 }],
        status: 'New',
      },
    ],
  },
  {
    slug: 'bahir-fish-house',
    ownerName: 'Meron Hailu',
    ownerEmail: `meron.hailu${SEED_EMAIL_DOMAIN}`,
    ownerPhone: '+251911000004',
    name: 'Bahir Fish House',
    description: 'Lake-fresh fish dishes and asa gulash, prepared Addis-style.',
    phone: '+251911000014',
    locationText: 'Sarbet, near Bulgaria Mazoria, Addis Ababa',
    accentColor: { r: 21, g: 101, b: 192 }, // blue
    menu: {
      categories: ['Fish Mains', 'Sides', 'Drinks'],
      foods: [
        { name: 'Asa Gulash', category: 'Fish Mains', price: 350, description: 'Fish stewed in a spiced tomato sauce, served with rice.' },
        { name: 'Grilled Fish', category: 'Fish Mains', price: 390, description: 'Whole grilled tilapia with lemon and spice rub.' },
        { name: 'Fish Tibs', category: 'Fish Mains', price: 360, description: 'Pan-fried fish chunks with onion and pepper.' },
        { name: 'Rice Side', category: 'Sides', price: 80, description: 'Steamed rice with a light spice butter.' },
        { name: 'Soft Drink', category: 'Drinks', price: 45, description: 'Assorted sodas, chilled.' },
      ],
    },
    paymentMethod: { methodName: 'CBE Birr', accountNumber: '1000345678901', accountName: 'Meron Hailu' },
    orders: [
      {
        customerName: 'Ruth Tadesse',
        customerPhone: '+251922000107',
        locationText: 'Sarbet, Addis Ababa',
        note: null,
        items: [{ food: 'Grilled Fish', qty: 1 }, { food: 'Rice Side', qty: 1 }, { food: 'Soft Drink', qty: 2 }],
        status: 'Accepted',
      },
      {
        customerName: 'Elias Worku',
        customerPhone: '+251922000108',
        locationText: 'Mexico, Addis Ababa',
        note: 'Call before arriving',
        items: [{ food: 'Asa Gulash', qty: 1 }],
        status: 'New',
      },
    ],
  },
];

async function makePlaceholderImage(width, height, { r, g, b }) {
  return sharp({
    create: { width, height, channels: 3, background: { r, g, b } },
  })
    .png()
    .toBuffer();
}

async function uploadPlaceholderImages(restaurant) {
  const logoBuffer = await makePlaceholderImage(LOGO_SIZE, LOGO_SIZE, restaurant.accentColor);
  const coverBuffer = await makePlaceholderImage(
    COVER_SIZE.width,
    COVER_SIZE.height,
    restaurant.accentColor
  );

  // Same slash-prefix convention Task 0.12's own test script used
  // (`_healthcheck/...`) for folder-like grouping in the bucket.
  const logoObjectName = `seed/restaurants/${restaurant.slug}/logo.png`;
  const coverObjectName = `seed/restaurants/${restaurant.slug}/cover.png`;

  await putObject(logoObjectName, logoBuffer, 'image/png');
  await putObject(coverObjectName, coverBuffer, 'image/png');

  return {
    logoUrl: getObjectUrl(logoObjectName),
    coverUrl: getObjectUrl(coverObjectName),
  };
}

async function insertOwner(connection, restaurant) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

  const result = await connection.execute(
    `INSERT INTO users (role, full_name, email, phone, password_hash)
     VALUES ('owner', :fullName, :email, :phone, :passwordHash)
     RETURNING id INTO :id`,
    {
      fullName: restaurant.ownerName,
      email: restaurant.ownerEmail,
      phone: restaurant.ownerPhone,
      passwordHash,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );

  return result.outBinds.id[0];
}

async function uploadFoodImage(restaurant, food) {
  const slug = food.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const buffer = await makePlaceholderImage(
    FOOD_IMAGE_SIZE.width,
    FOOD_IMAGE_SIZE.height,
    restaurant.accentColor
  );
  const objectName = `seed/restaurants/${restaurant.slug}/foods/${slug}.png`;
  await putObject(objectName, buffer, 'image/png');
  return getObjectUrl(objectName);
}

async function uploadPaymentScreenshot(restaurant, orderIndex) {
  // Neutral grey placeholder — a payment screenshot has no natural relation
  // to the restaurant's accent color, unlike logos/covers/food photos.
  const buffer = await makePlaceholderImage(SCREENSHOT_SIZE.width, SCREENSHOT_SIZE.height, {
    r: 200,
    g: 200,
    b: 200,
  });
  const objectName = `seed/restaurants/${restaurant.slug}/orders/${orderIndex}-screenshot.png`;
  await putObject(objectName, buffer, 'image/png');
  return getObjectUrl(objectName);
}

async function insertRestaurant(connection, restaurant, ownerId, { logoUrl, coverUrl }) {
  const result = await connection.execute(
    `INSERT INTO restaurants
       (owner_id, name, description, logo_url, cover_url, phone, location_text,
        live_status, is_suspended, is_open)
     VALUES
       (:ownerId, :name, :description, :logoUrl, :coverUrl, :phone, :locationText,
        'approved', 0, 1)
     RETURNING id INTO :id`,
    {
      ownerId,
      name: restaurant.name,
      description: restaurant.description,
      logoUrl,
      coverUrl,
      phone: restaurant.phone,
      locationText: restaurant.locationText,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );

  return result.outBinds.id[0];
}

async function insertCategory(connection, restaurantId, name) {
  const result = await connection.execute(
    `INSERT INTO categories (restaurant_id, name) VALUES (:restaurantId, :name)
     RETURNING id INTO :id`,
    {
      restaurantId,
      name,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
  return result.outBinds.id[0];
}

async function insertFood(connection, restaurantId, categoryId, food, imageUrl) {
  const result = await connection.execute(
    `INSERT INTO foods (restaurant_id, category_id, name, description, price, image_url)
     VALUES (:restaurantId, :categoryId, :name, :description, :price, :imageUrl)
     RETURNING id INTO :id`,
    {
      restaurantId,
      categoryId,
      name: food.name,
      description: food.description,
      price: food.price,
      imageUrl,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
  return result.outBinds.id[0];
}

// Mirrors the service-layer convention noted in migration 0007: every food
// gets a default (is_hidden = 0) food_visibility row created alongside it.
async function insertFoodVisibility(connection, foodId) {
  await connection.execute(
    `INSERT INTO food_visibility (food_id, is_hidden) VALUES (:foodId, 0)`,
    { foodId }
  );
}

async function insertPaymentMethod(connection, restaurantId, paymentMethod) {
  const result = await connection.execute(
    `INSERT INTO payment_methods (restaurant_id, method_name, account_number, account_name, instructions)
     VALUES (:restaurantId, :methodName, :accountNumber, :accountName, :instructions)
     RETURNING id INTO :id`,
    {
      restaurantId,
      methodName: paymentMethod.methodName,
      accountNumber: paymentMethod.accountNumber,
      accountName: paymentMethod.accountName,
      instructions: 'Send the exact total and upload your payment screenshot.',
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
  return result.outBinds.id[0];
}

// e.g. "NTR-48213" — matches the format in docs/DB_SCHEMA.md. Seed data
// only ever creates a handful of orders per run, so a random 5-digit
// suffix is collision-safe enough without a real sequence/service layer.
function generateOrderCode() {
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `NTR-${suffix}`;
}

async function insertOrder(connection, restaurant, restaurantId, paymentMethodId, screenshotUrl, order, items) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal; // no fees/tax modeled yet, per docs/DB_SCHEMA.md
  const isTerminal = order.status !== 'New';

  const result = await connection.execute(
    `INSERT INTO orders
       (order_code, restaurant_id, customer_name, customer_phone, customer_location_text,
        customer_note, payment_method_id, payment_screenshot_url, subtotal, total, status,
        status_updated_at)
     VALUES
       (:orderCode, :restaurantId, :customerName, :customerPhone, :locationText,
        :note, :paymentMethodId, :screenshotUrl, :subtotal, :total, :status,
        CASE WHEN :isTerminal = 1 THEN SYSTIMESTAMP ELSE NULL END)
     RETURNING id INTO :id`,
    {
      orderCode: generateOrderCode(),
      restaurantId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      locationText: order.locationText,
      note: order.note,
      paymentMethodId,
      screenshotUrl,
      subtotal,
      total,
      status: order.status,
      isTerminal: isTerminal ? 1 : 0,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    }
  );
  return result.outBinds.id[0];
}

async function insertOrderItems(connection, orderId, items) {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO order_items (order_id, food_id, food_name_snapshot, unit_price_snapshot, quantity, line_total)
       VALUES (:orderId, :foodId, :foodNameSnapshot, :unitPriceSnapshot, :quantity, :lineTotal)`,
      {
        orderId,
        foodId: item.foodId,
        foodNameSnapshot: item.name,
        unitPriceSnapshot: item.price,
        quantity: item.qty,
        lineTotal: item.lineTotal,
      }
    );
  }
}

// Categories + foods (+ food_visibility) for one restaurant. Returns a
// name -> { id, price } map so seedOrders() can resolve order line items
// without re-querying.
async function seedMenu(connection, restaurant, restaurantId) {
  const categoryIds = {};
  for (const categoryName of restaurant.menu.categories) {
    categoryIds[categoryName] = await insertCategory(connection, restaurantId, categoryName);
  }

  const foodsByName = {};
  for (const food of restaurant.menu.foods) {
    const imageUrl = await uploadFoodImage(restaurant, food);
    const foodId = await insertFood(connection, restaurantId, categoryIds[food.category], food, imageUrl);
    await insertFoodVisibility(connection, foodId);
    foodsByName[food.name] = { id: foodId, price: food.price };
  }

  return foodsByName;
}

async function seedOrders(connection, restaurant, restaurantId, paymentMethodId, foodsByName) {
  let orderIndex = 0;
  for (const order of restaurant.orders) {
    orderIndex += 1;
    const items = order.items.map((line) => {
      const food = foodsByName[line.food];
      return {
        foodId: food.id,
        name: line.food,
        price: food.price,
        qty: line.qty,
        lineTotal: food.price * line.qty,
      };
    });

    const screenshotUrl = await uploadPaymentScreenshot(restaurant, orderIndex);
    const orderId = await insertOrder(
      connection,
      restaurant,
      restaurantId,
      paymentMethodId,
      screenshotUrl,
      order,
      items
    );
    await insertOrderItems(connection, orderId, items);
  }
}

async function alreadySeeded(connection) {
  const result = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM users WHERE email LIKE '%' || :domain`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  return result.rows[0].CNT > 0;
}

// Deletes in FK-safe order: order_items -> orders -> payment_methods,
// food_visibility -> foods -> categories, then restaurants -> users.
async function deleteExistingSeedData(connection) {
  const restaurantSubquery = `
    SELECT r.id FROM restaurants r
    JOIN users u ON u.id = r.owner_id
    WHERE u.email LIKE '%' || :domain`;

  await connection.execute(
    `DELETE FROM order_items WHERE order_id IN (
       SELECT id FROM orders WHERE restaurant_id IN (${restaurantSubquery})
     )`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM orders WHERE restaurant_id IN (${restaurantSubquery})`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM payment_methods WHERE restaurant_id IN (${restaurantSubquery})`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM food_visibility WHERE food_id IN (
       SELECT id FROM foods WHERE restaurant_id IN (${restaurantSubquery})
     )`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM foods WHERE restaurant_id IN (${restaurantSubquery})`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM categories WHERE restaurant_id IN (${restaurantSubquery})`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(
    `DELETE FROM restaurants WHERE owner_id IN (
       SELECT id FROM users WHERE email LIKE '%' || :domain
     )`,
    { domain: SEED_EMAIL_DOMAIN }
  );
  await connection.execute(`DELETE FROM users WHERE email LIKE '%' || :domain`, {
    domain: SEED_EMAIL_DOMAIN,
  });
  await connection.commit();
}

async function main() {
  const force = process.argv.includes('--force');

  await withConnection(async (connection) => {
    if (await alreadySeeded(connection)) {
      if (!force) {
        console.log(
          'Seed data already present (users with an "%s" email found). ' +
            'Skipping — rerun with --force to delete and reseed.',
          SEED_EMAIL_DOMAIN
        );
        return;
      }
      console.log('Deleting existing seed data (--force)...');
      await deleteExistingSeedData(connection);
    }

    for (const restaurant of RESTAURANTS) {
      console.log(`Seeding ${restaurant.name}...`);

      const images = await uploadPlaceholderImages(restaurant);
      const ownerId = await insertOwner(connection, restaurant);
      const restaurantId = await insertRestaurant(connection, restaurant, ownerId, images);
      console.log(`  owner id: ${ownerId}, restaurant id: ${restaurantId}`);

      const foodsByName = await seedMenu(connection, restaurant, restaurantId);
      console.log(
        `  menu: ${restaurant.menu.categories.length} categories, ${restaurant.menu.foods.length} foods`
      );

      const paymentMethodId = await insertPaymentMethod(connection, restaurantId, restaurant.paymentMethod);
      console.log(`  payment method id: ${paymentMethodId} (${restaurant.paymentMethod.methodName})`);

      await seedOrders(connection, restaurant, restaurantId, paymentMethodId, foodsByName);
      console.log(`  orders: ${restaurant.orders.length} sample orders created`);
    }

    await connection.commit();
    const totalFoods = RESTAURANTS.reduce((sum, r) => sum + r.menu.foods.length, 0);
    const totalOrders = RESTAURANTS.reduce((sum, r) => sum + r.orders.length, 0);
    console.log(
      `NATRA seed: SUCCESS (${RESTAURANTS.length} restaurants, ${totalFoods} foods, ${totalOrders} orders created)`
    );
    console.log(`  Fake owner login password (all seeded owners): ${SEED_PASSWORD}`);
  });
}

main()
  .catch((err) => {
    console.error('NATRA seed: FAILED');
    console.error(`  ${err.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
