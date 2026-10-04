// categoryController — global platform categories.
//
// Categories are shared across the platform.
// Read access is available to authenticated users.
// Create/update/delete authorization is enforced by the admin routes.

const { z } = require('zod');

const categoriesCrud = require('../models/categories');
const foodsCrud = require('../models/foods');
const { paginate } = require('../utils/paginate');
const { badRequest, conflict } = require('../utils/errors');

// docs/DB_SCHEMA.md: categories.name is VARCHAR2(80).
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

async function list(req, res, next) {
  try {
    const { rows, meta } = await paginate(
      categoriesCrud,
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
    const data = parseOrThrow(createCategorySchema, req.body);
    const category = await categoriesCrud.create(data);

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = parseOrThrow(updateCategorySchema, req.body);
    const updated = await categoriesCrud.update(req.resource.id, data);

    res.status(200).json({ category: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const foodsInCategory = await foodsCrud.count({
      category_id: req.resource.id,
    });

    if (foodsInCategory > 0) {
      throw conflict(
        'Cannot delete a category that still has foods assigned to it'
      );
    }

    await categoriesCrud.remove(req.resource.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  createCategorySchema,
  updateCategorySchema,
};
