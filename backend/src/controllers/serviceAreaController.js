// serviceAreaController — Task 1.16b
//
// Route handlers for /api/service-areas. Same shape as
// `categoryController.js` (1.16a): one real field (`area_name` here,
// `name` there), no companion-row transaction, `requireRestaurantScope`
// on the two collection routes for the same reason 1.15f found it was
// needed for `foods` (attachOwnerRestaurant, 1.15a, no-ops for a
// non-owner role trusting a chained ownershipMiddleware that never runs
// on a route with no :id). No FK-safety check on delete needed here —
// see models/serviceAreas.js's header comment.

const { z } = require('zod');

const serviceAreasCrud = require('../models/serviceAreas');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, ApiError } = require('../utils/errors');

// docs/DB_SCHEMA.md: `service_areas.area_name` is VARCHAR2(120).
const AREA_NAME_MAX_LENGTH = 120;

const areaNameSchema = z.string().trim().min(1, 'area_name is required').max(AREA_NAME_MAX_LENGTH);

const createServiceAreaSchema = z.object({ area_name: areaNameSchema }).strict();

const updateServiceAreaSchema = z
  .object({ area_name: areaNameSchema.optional() })
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

function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

async function list(req, res, next) {
  try {
    requireRestaurantScope(req);
    const { rows, meta } = await paginateForOwner(
      serviceAreasCrud,
      req.user.restaurant_id,
      {},
      req.query,
      { orderBy: 'area_name', orderDir: 'ASC' }
    );
    res.status(200).json({ service_areas: rows, meta });
  } catch (err) {
    next(err);
  }
}

function getOne(req, res) {
  res.status(200).json({ service_area: req.resource });
}

async function create(req, res, next) {
  try {
    requireRestaurantScope(req);
    const data = parseOrThrow(createServiceAreaSchema, req.body);
    const serviceArea = await serviceAreasCrud.create({ ...data, restaurant_id: req.user.restaurant_id });
    res.status(201).json({ service_area: serviceArea });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = parseOrThrow(updateServiceAreaSchema, req.body);
    const updated = await serviceAreasCrud.updateForOwner(req.resource.id, req.user.restaurant_id, data);
    res.status(200).json({ service_area: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await serviceAreasCrud.removeForOwner(req.resource.id, req.user.restaurant_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, createServiceAreaSchema, updateServiceAreaSchema };
