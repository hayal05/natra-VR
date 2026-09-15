// paymentMethodController — Task 1.16c
//
// Route handlers for /api/payment-methods. Same base shape as
// `categoryController.js`/`serviceAreaController.js` (1.16a/b), but with
// a real design decision this table needed that the previous two
// didn't:
//
// **No `remove`/DELETE route.** `docs/DB_SCHEMA.md` already flags why a
// hard delete is the wrong default tool here: "inactive methods hidden
// from checkout without deleting history". Concretely, this session's
// user asked whether to keep DELETE alongside an is_active toggle or
// drop it, and didn't answer before asking to continue — so this is a
// stated assumption, not a silent judgment call: `migrations/
// 0009_payment_methods_service_areas_opening_hours.up.sql` adds
// `fk_orders_payment_method_id` (orders.payment_method_id ->
// payment_methods.id) with no `ON DELETE` clause, and orders are never
// hard-deleted (docs/DB_SCHEMA.md's own note on `orders`) — so a real
// `DELETE` on a payment method that's ever been used on any order, past
// or present, would fail as a bare DB constraint error, the exact kind
// of surprise 1.15e/1.16a's validation/FK checks exist to avoid. Rather
// than add an orders-aware existence check here (orders has no model in
// this codebase yet — that's a later Phase 1/2 task, out of scope for
// 1.16), the simpler and more correct fix is to just not expose delete
// at all: `is_active` (now updatable via the same PATCH as every other
// field, not a separate toggle endpoint) is the one supported way to
// retire a payment method. If a genuine mistaken-entry hard-delete case
// turns out to be needed later, it belongs on its own route with its
// own orders-aware guard, not folded into this one by default.
//
// `is_active` is exposed at the API boundary as a boolean (`true`/
// `false`), converted to the DB's `NUMBER(1)` 0/1 here — there's no
// established convention either way yet in this codebase (the only
// other 0/1 column, `food_visibility.is_hidden`, isn't reachable through
// any route yet — that's deferred to Task 5.9), so boolean was chosen as
// the more natural shape for a JSON API rather than exposing the raw
// storage representation.

const { z } = require('zod');

const paymentMethodsCrud = require('../models/paymentMethods');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, ApiError } = require('../utils/errors');

// docs/DB_SCHEMA.md: method_name VARCHAR2(60), account_number
// VARCHAR2(60), account_name VARCHAR2(120), instructions VARCHAR2(500).
const METHOD_NAME_MAX_LENGTH = 60;
const ACCOUNT_NUMBER_MAX_LENGTH = 60;
const ACCOUNT_NAME_MAX_LENGTH = 120;
const INSTRUCTIONS_MAX_LENGTH = 500;

const methodNameSchema = z.string().trim().min(1, 'method_name is required').max(METHOD_NAME_MAX_LENGTH);
const accountNumberSchema = z.string().trim().min(1, 'account_number is required').max(ACCOUNT_NUMBER_MAX_LENGTH);
const accountNameSchema = z.string().trim().min(1, 'account_name is required').max(ACCOUNT_NAME_MAX_LENGTH);
const instructionsSchema = z
  .string()
  .trim()
  .max(INSTRUCTIONS_MAX_LENGTH, `instructions must be at most ${INSTRUCTIONS_MAX_LENGTH} characters`)
  .nullable();

// z shim/zod both lack a native boolean type wired up in this file's own
// minimal usage elsewhere in the codebase (foodController.js/
// categoryController.js never needed one) — kept as a small manual
// refine rather than reaching for `z.boolean()` so the conversion to
// 0/1 happens in one obvious place.
const isActiveSchema = z
  .number()
  .refine((v) => v === 0 || v === 1, { message: 'is_active must be a boolean' })
  .optional();

function toIsActiveNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw badRequest('is_active must be a boolean');
  }
  return value ? 1 : 0;
}

const createPaymentMethodSchema = z
  .object({
    method_name: methodNameSchema,
    account_number: accountNumberSchema,
    account_name: accountNameSchema,
    instructions: instructionsSchema.optional(),
  })
  .strict();

const updatePaymentMethodSchema = z
  .object({
    method_name: methodNameSchema.optional(),
    account_number: accountNumberSchema.optional(),
    account_name: accountNameSchema.optional(),
    instructions: instructionsSchema.optional(),
    is_active: isActiveSchema,
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

function requireRestaurantScope(req) {
  if (req.user.restaurant_id === undefined || req.user.restaurant_id === null) {
    throw new ApiError(403, 'Forbidden');
  }
}

async function list(req, res, next) {
  try {
    requireRestaurantScope(req);
    const { rows, meta } = await paginateForOwner(
      paymentMethodsCrud,
      req.user.restaurant_id,
      {},
      req.query,
      { orderBy: 'method_name', orderDir: 'ASC' }
    );
    res.status(200).json({ payment_methods: rows, meta });
  } catch (err) {
    next(err);
  }
}

function getOne(req, res) {
  res.status(200).json({ payment_method: req.resource });
}

async function create(req, res, next) {
  try {
    requireRestaurantScope(req);
    const data = parseOrThrow(createPaymentMethodSchema, req.body);
    const paymentMethod = await paymentMethodsCrud.create({ ...data, restaurant_id: req.user.restaurant_id });
    res.status(201).json({ payment_method: paymentMethod });
  } catch (err) {
    next(err);
  }
}

// is_active is converted from the API's boolean to the DB's 0/1 before
// updatePaymentMethodSchema runs, not after: toIsActiveNumber throws its
// own 400 immediately for a non-boolean is_active (e.g. the string
// "true"), same status/shape as any other field's rejection, rather
// than letting a bad value silently reach crudFactory's update as
// something that isn't really 0 or 1.
async function update(req, res, next) {
  try {
    const is_active = toIsActiveNumber(req.body.is_active);
    const data = parseOrThrow(updatePaymentMethodSchema, { ...req.body, is_active });
    if (data.is_active === undefined) delete data.is_active;
    const updated = await paymentMethodsCrud.updateForOwner(req.resource.id, req.user.restaurant_id, data);
    res.status(200).json({ payment_method: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
};
