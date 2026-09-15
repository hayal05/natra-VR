// openingHoursController — Task 1.16d
//
// Route handlers for /api/opening-hours. Narrower surface than
// categoryController/serviceAreaController/paymentMethodController
// (1.16a/b/c): `list` + `update` only — no `create`, no `remove`, no
// `getOne` either. See `routes/openingHours.routes.js`'s header for why
// a single-day GET wasn't added: nothing in the planned frontend
// (docs/TASKS.md's Phase 3 onward) fetches one day in isolation, and the
// full list is already just 7 rows.
//
// The seeding gap: docs/DB_SCHEMA.md says opening_hours rows are
// "seeded on restaurant creation" (7 per restaurant, one per
// day_of_week, `UNIQUE (restaurant_id, day_of_week)`), but no task
// before this one in docs/TASKS.md actually implements that seeding —
// `services/createFoodWithVisibility.js` (1.15c) is the closest
// precedent for a "creating one row triggers a related insert" pattern,
// but restaurant creation itself (the later registration tasks) hasn't
// been built yet either. Flagged here the same way 1.14d flagged 1.15's
// `req.user.restaurant_id` gap: `list` below will correctly return an
// empty array for any restaurant that exists before that seeding task
// is built — expected, not a bug in this task.
//
// Update-time business rule this table's schema implies that the
// previous three tables didn't need: open_time/close_time are "nullable
// when is_closed=1" (docs/DB_SCHEMA.md), read here as "required when
// is_closed=0". Checked against the *merged* result of the existing row
// (`req.resource`, already fetched by `ownershipMiddleware`) and this
// request's partial update — not just whatever fields this one PATCH
// body happens to include — so a caller sending only
// `{ open_time: "09:00" }` on a currently-closed day can't leave
// close_time null just because this particular request didn't mention
// it. Deliberately NOT enforced: close_time being later than open_time
// — nothing in docs/DB_SCHEMA.md or docs/TASKS.md asks for that, and
// adding it here would be an unstated judgment call rather than
// something this task was given.

const { z } = require('zod');

const openingHoursCrud = require('../models/openingHours');
const { paginateForOwner } = require('../utils/paginate');
const { badRequest, ApiError } = require('../utils/errors');

// docs/DB_SCHEMA.md: open_time/close_time VARCHAR2(5), "HH:MM" 24-hour.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSchema = z.string().regex(TIME_PATTERN, 'must be in "HH:MM" 24-hour format').nullable();

// Same shim-boolean-to-0/1 approach as paymentMethodController.js's
// isActiveSchema/toIsActiveNumber (1.16c) — z.boolean() still isn't used
// anywhere in this codebase; kept consistent rather than introducing it
// here for one field.
function toIsClosedNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw badRequest('is_closed must be a boolean');
  }
  return value ? 1 : 0;
}

const updateOpeningHoursSchema = z
  .object({
    is_closed: z
      .number()
      .refine((v) => v === 0 || v === 1, { message: 'is_closed must be a boolean' })
      .optional(),
    open_time: timeSchema.optional(),
    close_time: timeSchema.optional(),
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
      openingHoursCrud,
      req.user.restaurant_id,
      {},
      req.query,
      { orderBy: 'day_of_week', orderDir: 'ASC' }
    );
    res.status(200).json({ opening_hours: rows, meta });
  } catch (err) {
    next(err);
  }
}

function assertConsistentHours(merged) {
  if (merged.is_closed === 0 && (!merged.open_time || !merged.close_time)) {
    throw badRequest('open_time and close_time are required when is_closed is false');
  }
}

// is_closed is converted from the API's boolean to the DB's 0/1 before
// updateOpeningHoursSchema runs, not after — same reasoning as
// paymentMethodController.js's update: a non-boolean is_closed (e.g. the
// string "true") gets its own 400 immediately, same status/shape as any
// other field's rejection.
async function update(req, res, next) {
  try {
    const is_closed = toIsClosedNumber(req.body.is_closed);
    const data = parseOrThrow(updateOpeningHoursSchema, { ...req.body, is_closed });
    if (data.is_closed === undefined) delete data.is_closed;

    const merged = {
      is_closed: data.is_closed !== undefined ? data.is_closed : req.resource.is_closed,
      open_time: data.open_time !== undefined ? data.open_time : req.resource.open_time,
      close_time: data.close_time !== undefined ? data.close_time : req.resource.close_time,
    };
    assertConsistentHours(merged);

    const updated = await openingHoursCrud.updateForOwner(req.resource.id, req.user.restaurant_id, data);
    res.status(200).json({ opening_hours: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  update,
  updateOpeningHoursSchema,
};
