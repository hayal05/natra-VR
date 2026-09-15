// categoryController — Task 1.16a
//
// Route handlers for /api/categories. Mirrors `foodController.js`'s
// (1.15d/e) shape deliberately — same middleware chain, same
// `requireRestaurantScope` guard on the two collection routes (the exact
// gap 1.15f found for `foods`: `attachOwnerRestaurant`, 1.15a, no-ops
// for a non-owner role trusting a chained `ownershipMiddleware` to catch
// a missing `req.user.restaurant_id` afterward, which is never true for
// `list`/`create` since neither has a `:id` for that middleware to run
// against) — but simpler, since `categories` has:
//   - no companion-row transaction (unlike `foods` + `food_visibility`,
//     1.15c) — `create` calls `categoriesCrud.create` directly
//   - one real field (`name`) instead of five

const { z } = require('zod');

const categoriesCrud = require('../models/categories');
const foodsCrud = require('../models/foods');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, conflict, ApiError } = require('../utils/errors');

// docs/DB_SCHEMA.md: `categories.name` is VARCHAR2(80).
const NAME_MAX_LENGTH = 80;

const nameSchema = z.string().trim().min(1, 'name is required').max(NAME_MAX_LENGTH);

const createCategorySchema = z.object({ name: nameSchema }).strict();

const updateCategorySchema = z
  .object({ name: nameSchema.optional() })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

function parseOrThrow(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw badRequest(firstIssue ? firstIssue.message : 'Invalid request payload');
  }
  return parsed.data;
}

// Same reasoning + same fix as foodController.js's requireRestaurantScope
// (found while writing 1.15f's tests) — see that file's header comment
// for the full writeup of why `list`/`create` need this and `getOne`/
// `update`/`remove` don't.
function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

async function list(req, res, next) {
  try {
    requireRestaurantScope(req);
    const { rows, meta } = await paginateForOwner(
      categoriesCrud,
      req.user.restaurant_id,
      {},
      req.query,
      { orderBy: 'name', orderDir: 'ASC' }
    );
    res.status(200).json({ categories: rows, meta });
  } catch (err) {
    next(err);
  }
}

function getOne(req, res) {
  res.status(200).json({ category: req.resource });
}

async function create(req, res, next) {
  try {
    requireRestaurantScope(req);
    const data = parseOrThrow(createCategorySchema, req.body);
    const category = await categoriesCrud.create({ ...data, restaurant_id: req.user.restaurant_id });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = parseOrThrow(updateCategorySchema, req.body);
    const updated = await categoriesCrud.updateForOwner(req.resource.id, req.user.restaurant_id, data);
    res.status(200).json({ category: updated });
  } catch (err) {
    next(err);
  }
}

// migrations/0007_foods_categories_food_visibility.up.sql's
// fk_foods_category_id has no ON DELETE clause, so Oracle defaults to
// RESTRICT: deleting a category that still has foods pointing at it
// would fail at the DB layer with an FK-violation error, which
// app.js's central error handler would otherwise surface as a bare 500
// — the same "only fails as far downstream as a DB constraint" gap
// 1.15e's validation schemas exist to close for payload shape, just at
// delete time instead of create/update time. Checked explicitly here
// instead, for a clean 409 naming the actual reason, and so a caller
// knows to reassign/clear those foods' category_id first (nullable —
// "uncategorized allowed", docs/DB_SCHEMA.md) rather than getting an
// opaque failure.
async function remove(req, res, next) {
  try {
    const foodsInCategory = await foodsCrud.count({ category_id: req.resource.id });
    if (foodsInCategory > 0) {
      throw conflict('Cannot delete a category that still has foods assigned to it');
    }
    await categoriesCrud.removeForOwner(req.resource.id, req.user.restaurant_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, createCategorySchema, updateCategorySchema };
