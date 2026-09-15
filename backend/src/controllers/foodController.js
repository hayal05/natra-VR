// foodController — Tasks 1.15d + 1.15e
//
// Route handlers for /api/foods. Deliberately thin: all the real work —
// ownership scoping, the food+food_visibility transaction, pagination —
// already lives in middleware/services built by earlier sub-tasks:
//   - attachOwnerRestaurant (1.15a) puts `req.user.restaurant_id` /
//     `req.restaurant` on the request for an owner
//   - ownershipMiddleware(foodsCrud) (1.4, wired in food.routes.js) has
//     already fetched+confirmed the `:id` row and attached it as
//     `req.resource` by the time a single-resource handler below runs —
//     that's why get/update/remove don't call `foodsCrud` themselves
//   - createFoodWithVisibility (1.15c) is the only path allowed to
//     insert a `foods` row, so it's used here instead of `foodsCrud.create`
//   - paginateForOwner (1.9) does the list endpoint's paging + total count
//
// Task 1.15e closes the gap this file's header used to flag: request-body
// shape validation for create/update, via zod — same split
// `authController.js` (1.12/1.13) already established: crudFactory's job
// is "safe SQL for an allow-listed column set" (it silently drops
// anything not on that list — see crudFactory.js's pickAllowed), not "is
// `price` actually a number" or "is `name` present at all". Before this,
// a missing/wrong-typed required field only failed as far downstream as
// a DB constraint (a generic 500 via app.js's central error handler);
// these schemas turn that into a clean 400 with a specific message,
// before any SQL runs.
//
// Both schemas are `.strict()` — an unrecognized key (most importantly
// `restaurant_id` or `id`) is rejected outright with a 400 rather than
// silently dropped, unlike crudFactory's own allow-list behavior. That's
// a deliberate change from pre-1.15e: `create()` below used to spread
// `req.body` and then overwrite a caller-supplied `restaurant_id` with
// `req.user.restaurant_id` (silently discarding whatever the caller
// sent); now a caller who includes `restaurant_id` in the payload at all
// gets told why, instead of having it quietly ignored — the "always the
// authenticated owner's own restaurant, never the body's" rule from
// before still holds, it's just enforced with a clear rejection instead
// of a silent override.
//
// Deliberately NOT this task's job (see docs/TASKS.md):
//   - tests (1.15f), README/status updates (1.15g)

const { z } = require('zod');

const foodsCrud = require('../models/foods');
const foodVisibility = require('../models/foodVisibility');
const createFoodWithVisibility = require('../services/createFoodWithVisibility');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, notFound, ApiError } = require('../utils/errors');

// Column-length/precision limits come straight from docs/DB_SCHEMA.md's
// `foods` table (0.7 section) — not arbitrary, so a payload that would
// have failed at the DB layer (VARCHAR2(120) too long, NUMBER(10,2)
// overflow) fails at this layer instead, with a message that actually
// names the limit.
const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;
const IMAGE_URL_MAX_LENGTH = 500;
// NUMBER(10,2): up to 8 digits before the decimal point, exactly 2 after.
const MAX_PRICE = 99999999.99;

const nameSchema = z.string().trim().min(1, 'name is required').max(NAME_MAX_LENGTH);

const descriptionSchema = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
  .nullable();

const priceSchema = z
  .number({ invalid_type_error: 'price must be a number' })
  .positive('price must be greater than 0')
  .max(MAX_PRICE, `price cannot exceed ${MAX_PRICE}`)
  // NUMBER(10,2) has exactly 2 decimal places — checked via toFixed
  // rather than a naive `value * 100 % 1 === 0`, which floating-point
  // representation error (e.g. 19.99 * 100 === 1998.9999999999998 in
  // JS) makes unreliable for exactly the boundary values a real menu
  // price is likely to use.
  .refine((value) => Number(value.toFixed(2)) === value, {
    message: 'price can have at most 2 decimal places',
  });

// `category_id` is nullable (docs/DB_SCHEMA.md: "uncategorized allowed")
// — explicitly allowing `null` (not just omission) lets an update clear
// a food back to uncategorized, not only ever set it to some category.
const categoryIdSchema = z
  .number({ invalid_type_error: 'category_id must be a number' })
  .int('category_id must be an integer')
  .positive('category_id must be a positive integer')
  .nullable();

// `image_url` is populated from `uploadToObjectStorage`'s (1.5/1.6)
// return value in practice, but this endpoint takes it as a plain string
// field, not a file upload — wiring an actual multipart upload route is
// still open (flagged as not this task's job; see the module header).
// Validated as a real URL, same as any other `*_url` value this backend
// stores, so a caller can't slip in something that isn't a URL at all.
const imageUrlSchema = z
  .string()
  .trim()
  .max(IMAGE_URL_MAX_LENGTH, `image_url must be at most ${IMAGE_URL_MAX_LENGTH} characters`)
  .url('image_url must be a valid URL')
  .nullable();

// `image_thumbnail_url` (Task 8.4c-ii prerequisite, migration 0012) — the
// `uploadToObjectStorage` (Task 1.6) thumbnail returned alongside
// `image_url` on upload, previously discarded rather than saved (see
// migration 0012's own header comment). Same shape as `image_url`, just a
// different max-length message so a validation error names the right
// field.
const imageThumbnailUrlSchema = z
  .string()
  .trim()
  .max(
    IMAGE_URL_MAX_LENGTH,
    `image_thumbnail_url must be at most ${IMAGE_URL_MAX_LENGTH} characters`
  )
  .url('image_thumbnail_url must be a valid URL')
  .nullable();

// POST /api/foods — every field required except the two nullable ones
// above. `.strict()` rejects `restaurant_id`/`id`/any other unknown key
// (see module header) rather than silently dropping it.
const createFoodSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    price: priceSchema,
    category_id: categoryIdSchema.optional(),
    image_url: imageUrlSchema.optional(),
    image_thumbnail_url: imageThumbnailUrlSchema.optional(),
  })
  .strict();

// PATCH /api/foods/:id — same field rules as create, but every field is
// optional (a partial update) — except that an *empty* update (no
// recognized fields at all) is still rejected below, same
// "no-op update almost always means a caller bug" reasoning
// crudFactory.js's own `update` already applies at the SQL layer; this
// just catches it a layer earlier, before ownershipMiddleware's fetch
// even runs, with a clearer message.
const updateFoodSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    category_id: categoryIdSchema.optional(),
    image_url: imageUrlSchema.optional(),
    image_thumbnail_url: imageThumbnailUrlSchema.optional(),
  })
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

// Bug found and fixed while writing 1.15f's tests: `list` and `create`
// are the two routes with no `:id` (see food.routes.js's own header
// comment for why they can't chain `ownershipMiddleware`, Task 1.4), so
// they were the only two routes relying on `req.user.restaurant_id`
// with nothing actually checking it was ever set. `attachOwnerRestaurant`
// (1.15a) deliberately no-ops for a non-owner role rather than erroring,
// on the assumption that a chained `ownershipMiddleware` would catch a
// missing `restaurant_id` afterward — true for `getOne`/`update`/`remove`
// (all `:id` routes, all chain it), but never true for these two. Without
// this guard, an admin token could `POST /api/foods` and have it insert
// a food with `restaurant_id: undefined` (silently coerced to `NULL`
// against `fakeDb`; would be a bind of `undefined` against real Oracle,
// not a clean rejection either way), or `GET /api/foods` and query with
// the same undefined scope. This mirrors `ownershipMiddleware`'s own
// "authenticated, but nothing to scope by" 403 (Task 1.4) — same status,
// same message — for the two routes that middleware itself can't reach.
function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

// Query params list() accepts as exact-match filters, forwarded to
// paginateForOwner untouched (which forwards them to
// findAllForOwner/countForOwner — see crudFactory.js's findAll doc for
// the allow-listed-columns rule this inherits). Deliberately a fixed,
// short allow-list here too — `req.query` also carries pagination/order
// params (`page`, `limit`, `offset`, `orderBy`, `orderDir`) that are NOT
// filters and must not be passed through as if they were columns to
// match against.
const LIST_FILTER_PARAMS = ['category_id'];

function pickListFilters(query = {}) {
  const filters = {};
  for (const param of LIST_FILTER_PARAMS) {
    if (query[param] !== undefined) {
      filters[param] = query[param];
    }
  }
  return filters;
}

// --- Task 5.9a: hide/show ---
//
// `food_visibility` is its own table (Task 1.15c) with no `restaurant_id`
// of its own to scope by — see that model's own header comment — so it's
// never read through `foodsCrud`/`paginateForOwner`. Every `foods` row
// still gets exactly one `food_visibility` row by construction (also
// 1.15c), so the owner-facing food list/detail responses below merge that
// row's `is_hidden` in alongside the plain `foods` columns rather than
// exposing two separate resources for what the frontend treats as one
// "food" object (docs/TASKS.md's 5.9: "food list screen with Edit/Delete/
// Hide actions").
//
// Deliberately a per-food lookup (`findAll({ food_id })`, not a hand-
// written JOIN like `restaurantMenu.js`/`popularFoods.js` use) even for
// the list endpoint: those two exist because a customer-facing menu
// query needs `is_hidden = 0` as a filter condition baked into the SQL
// itself (exclude hidden foods entirely). Here it's the opposite — the
// owner's own list must show hidden foods too, so they can un-hide them
// — `is_hidden` is just an extra field on each row, not something being
// filtered on, so there's no join-query the fakeDb test double would
// need new support for either.
async function attachIsHidden(foods) {
  const rows = await Promise.all(
    foods.map((food) => foodVisibility.findAll({ food_id: food.id }))
  );
  return foods.map((food, i) => ({
    ...food,
    is_hidden: rows[i][0] ? Number(rows[i][0].is_hidden) : 0,
  }));
}

async function attachIsHiddenOne(food) {
  const [merged] = await attachIsHidden([food]);
  return merged;
}

// Same manual-refine-over-z.boolean() convention paymentMethodController.js
// (1.16c) already established for `is_active` — see that file's header
// comment for why: converting the API's boolean to the DB's NUMBER(1) 0/1
// happens in one obvious place, not spread across a zod transform and a
// second manual check.
function toIsHiddenNumber(value) {
  if (typeof value !== 'boolean') {
    throw badRequest('is_hidden must be a boolean');
  }
  return value ? 1 : 0;
}

// GET /api/foods — list the caller's own restaurant's foods, paginated.
// Mounted behind authMiddleware + attachOwnerRestaurant only (no
// ownershipMiddleware — there's no single `:id` here to check, the whole
// point is "every food belonging to req.user.restaurant_id").
async function list(req, res, next) {
  try {
    requireRestaurantScope(req);
    const filters = pickListFilters(req.query);
    const { rows, meta } = await paginateForOwner(
      foodsCrud,
      req.user.restaurant_id,
      filters,
      req.query,
      { orderBy: 'name', orderDir: 'ASC' }
    );
    const foods = await attachIsHidden(rows);
    res.status(200).json({ foods, meta });
  } catch (err) {
    next(err);
  }
}

// GET /api/foods/:id — ownershipMiddleware has already fetched the row
// (confirmed to belong to req.user.restaurant_id) and attached it as
// req.resource; the only thing left is merging in its food_visibility
// row's is_hidden (5.9a — see that section's header comment above).
async function getOne(req, res, next) {
  try {
    const food = await attachIsHiddenOne(req.resource);
    res.status(200).json({ food });
  } catch (err) {
    next(err);
  }
}

// POST /api/foods — creates the food + its default (visible)
// food_visibility row together, via createFoodWithVisibility (1.15c).
// `restaurant_id` always comes from req.user.restaurant_id (set by
// attachOwnerRestaurant, 1.15a), never from the request body —
// createFoodSchema's `.strict()` (1.15e) already rejects a body-supplied
// `restaurant_id` outright before this line runs, so the explicit
// `restaurant_id` field below is guaranteed to be the only one that ever
// reaches `createFoodWithVisibility`, not a fallback overriding a
// body-supplied value.
async function create(req, res, next) {
  try {
    requireRestaurantScope(req);
    const data = parseOrThrow(createFoodSchema, req.body);
    const food = await createFoodWithVisibility({
      ...data,
      restaurant_id: req.user.restaurant_id,
    });
    res.status(201).json({ food });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/foods/:id — ownershipMiddleware has already confirmed
// ownership (req.resource); the actual write still goes through
// updateForOwner rather than a bare update, so this stays correct even
// if this handler is ever reached some other way. updateFoodSchema
// (1.15e) validates + strips the payload down to recognized food fields
// first (still `.strict()` — a body-supplied `restaurant_id` is rejected
// with a 400 here too, not silently dropped by updateForOwner's own
// "cannot change ownerColumn via update" guard, which exists as a
// second, independent layer of the same protection, not the only one).
async function update(req, res, next) {
  try {
    const data = parseOrThrow(updateFoodSchema, req.body);
    const updated = await foodsCrud.updateForOwner(req.resource.id, req.user.restaurant_id, data);
    res.status(200).json({ food: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/foods/:id — same ownershipMiddleware guarantee as update.
// removeForOwner's idempotent-boolean result isn't checked here (unlike
// a bare removeForOwner caller with no prior existence check): if
// ownershipMiddleware already 404'd on a missing/not-owned row, this
// call is guaranteed to find and delete exactly that row.
async function remove(req, res, next) {
  try {
    await foodsCrud.removeForOwner(req.resource.id, req.user.restaurant_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// PATCH /api/foods/:id/visibility — Task 5.9a. Same ownershipMiddleware
// guarantee as update/remove (chained in food.routes.js): req.resource is
// already this owner's food by the time this handler runs. A dedicated
// route rather than folding `is_hidden` into the general PATCH /:id
// (update, 1.15e) because it isn't a `foods` column at all — it lives on
// the separate `food_visibility` row (see this file's Task 5.9a header
// comment above and models/foodVisibility.js) and needs its own
// `updated_by` write, which a `foods` update has no field for.
//
// `is_hidden` is required, not optional — unlike updateFoodSchema/
// updatePaymentMethodSchema's partial-update shape, this route's entire
// job is "set the visibility", so an empty/missing body is a caller bug
// worth a clear 400 rather than a silent no-op.
async function setVisibility(req, res, next) {
  try {
    const is_hidden = toIsHiddenNumber(req.body.is_hidden);

    // Every food gets exactly one food_visibility row by construction
    // (createFoodWithVisibility, 1.15c) — a missing row here means that
    // invariant was violated somewhere upstream, not a normal 404 a
    // caller could hit by passing a bad id (ownershipMiddleware already
    // ruled that out via req.resource).
    const [visRow] = await foodVisibility.findAll({ food_id: req.resource.id });
    if (!visRow) {
      throw notFound(`food_visibility row missing for food ${req.resource.id}`);
    }

    const updated = await foodVisibility.update(visRow.id, {
      is_hidden,
      updated_by: req.user.id,
    });

    res.status(200).json({ food: { ...req.resource, is_hidden: Number(updated.is_hidden) } });
  } catch (err) {
    next(err);
  }
}

// Schemas exported alongside the handlers so 1.15f's tests (and any
// future caller, e.g. a shared frontend validation layer) can exercise
// them directly without going through a full HTTP round trip for every
// edge case.
module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  setVisibility,
  createFoodSchema,
  updateFoodSchema,
};
