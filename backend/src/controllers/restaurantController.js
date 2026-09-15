// restaurantController — Task 3.3
//
// Public (no auth) GET /api/restaurants — the customer-facing restaurant
// list the Home screen's Restaurants row (Task 3.3, frontend:
// `frontend/src/pages/Home/Home.jsx`) fetches. Every `/api/*` route built
// so far (1.15/1.16) sits behind `authMiddleware` for an owner or admin;
// this is the first genuinely public endpoint in the codebase, since
// customers have no account/login at all (docs/DB_SCHEMA.md's own note on
// the `orders` table, repeated throughout Phase 1's log entries).
//
// Only "Live" restaurants are ever returned: `live_status = 'approved' AND
// is_suspended = 0`, exactly `docs/DB_SCHEMA.md`'s own definition of
// "Live" under the `restaurants` table section ("Live is derived, not a
// raw flag"). A restaurant that's `pending`/`rejected`/`not_requested`, or
// one an admin has suspended, must never be visible to a customer,
// regardless of its `is_open` value.
//
// `is_open` is deliberately NOT filtered on: a Live-but-Closed restaurant
// still appears in the row, with the Open/Closed `StatusBadge` (Task 2.4)
// telling the customer it isn't currently taking orders — this matches
// the reference UI, which shows a "Closed" card inline
// (`docs/reference_ui/560d4168-0f66-443a-9fbc-c9625f83d15e.png`'s own
// "Merkato Grill"-style card) rather than hiding closed restaurants from
// the row entirely.
//
// Ordered by `name` ASC for a stable, predictable order — nothing in
// `docs/NATRA_MASTER_PROMPT.md` or either reference image specifies a
// ranking (that's Task 7.2's popularity-based ranking, which doesn't
// exist yet), so alphabetical is the least-surprising default rather than
// insertion order (which `ORDER BY` with no clause wouldn't even
// guarantee against a real Oracle DB).
//
// `getProfile` (Task 3.7) adds the public `GET /:id` this file's own
// header used to flag as not-yet-built — the Restaurant Profile screen's
// header section (frontend: `frontend/src/pages/RestaurantProfile`)
// needs a single restaurant plus its `service_areas` (opening_hours is
// NOT part of this — `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant
// profile" header list is cover/logo/name/status/phone/location/
// description/service areas only; opening hours aren't shown anywhere
// in that section or the reference images, so they're left out here
// rather than fetched and unused).
//
// Same "never leak a non-Live restaurant" rule as `list`: a restaurant
// that exists but isn't Live (pending/rejected/not_requested, or
// suspended) 404s exactly like one that doesn't exist at all — a
// customer probing ids can't tell "not found" from "not yours to see"
// any more than `crudFactory`'s own `findByIdForOwner` lets a non-owner
// tell those apart (see that function's doc comment for the same
// reasoning applied to owner-scoping instead of Live-scoping).
//
// `service_areas` is fetched via `serviceAreasCrud.findAllForOwner` —
// `service_areas`' `ownerColumn` is `restaurant_id` (see
// `models/serviceAreas.js`), so "for owner" here really means "for this
// restaurant", the exact same call shape an owner-facing screen would
// use, just without an authenticated `req.user` driving the id.

const { z } = require('zod');

const restaurantsCrud = require('../models/restaurants');
const serviceAreasCrud = require('../models/serviceAreas');
const paymentMethodsCrud = require('../models/paymentMethods');
const { paginate } = require('../utils/paginate');
const { badRequest, notFound } = require('../utils/errors');
const { listRestaurantMenu } = require('../services/restaurantMenu');

const LIVE_FILTER = { live_status: 'approved', is_suspended: 0 };

// docs/DB_SCHEMA.md: restaurants.name is VARCHAR2(120).
const NAME_MAX_LENGTH = 120;

const nameSchema = z.string().trim().min(1, 'name is required').max(NAME_MAX_LENGTH);
// restaurants.description is a CLOB (docs/DB_SCHEMA.md), unlike
// categories.name's VARCHAR2(80) — no length ceiling to enforce here,
// same reasoning categoryController.js's own nameSchema comment gives
// for the columns it DOES cap. Nullable — an owner can clear it back out.
const descriptionSchema = z.string().trim().nullable();

// docs/DB_SCHEMA.md: logo_url/cover_url are both VARCHAR2(500).
const IMAGE_URL_MAX_LENGTH = 500;

// `logo_url`/`cover_url` (Task 5.3) are populated in practice from
// `uploadToObjectStorage`'s return value via the new owner-authenticated
// `POST /api/uploads/restaurant-logo`/`restaurant-cover` routes
// (`uploadController.js`), but — same "upload returns a URL, a separate
// update call persists it" split `uploadController.js`'s own header
// comment establishes for payment-screenshot/orders, and the exact
// pattern `foodController.js`'s own `imageUrlSchema` already follows for
// `image_url` — this endpoint takes each as a plain string field, never
// touching `req.file` itself. Nullable, same as `foodController.js`'s
// version: an owner can remove a logo/cover, not just replace it.
const imageUrlSchema = z
  .string()
  .trim()
  .max(IMAGE_URL_MAX_LENGTH, `must be at most ${IMAGE_URL_MAX_LENGTH} characters`)
  .url('must be a valid URL')
  .nullable();

// `logo_thumbnail_url`/`cover_thumbnail_url` (Task 8.4c-ii prerequisite,
// migration 0012) — same shape/validation as `logo_url`/`cover_url`
// above, just for the `uploadToObjectStorage` (Task 1.6) thumbnail that
// was previously returned by the upload routes and discarded rather than
// saved (see migration 0012's own header comment for the full trace).
// Reuses `imageUrlSchema` rather than a separate schema — there's nothing
// about a thumbnail URL's shape that differs from its main-image
// counterpart, only which column it's saved to.

// `is_open` (Task 5.8) — the owner-facing Open/Closed toggle.
// docs/DB_SCHEMA.md: `is_open NUMBER(1), default 0 — "accepting orders"
// toggle, independent of Live`. Exposed at the API boundary as a
// boolean and converted to the DB's 0/1 in `toIsOpenNumber` below,
// same "boolean in, 0/1 stored" convention `paymentMethodController.js`'s
// `is_active` (Task 1.16c) already established for this codebase's only
// other 0/1 owner-toggleable column — no reason for a second convention
// here.
const isOpenSchema = z
  .number()
  .refine((v) => v === 0 || v === 1, { message: 'is_open must be a boolean' })
  .optional();

function toIsOpenNumber(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw badRequest('is_open must be a boolean');
  }
  return value ? 1 : 0;
}

const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    logo_url: imageUrlSchema.optional(),
    logo_thumbnail_url: imageUrlSchema.optional(),
    cover_url: imageUrlSchema.optional(),
    cover_thumbnail_url: imageUrlSchema.optional(),
    is_open: isOpenSchema,
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

function isLive(restaurant) {
  return (
    !!restaurant &&
    restaurant.live_status === 'approved' &&
    Number(restaurant.is_suspended) === 0
  );
}

async function list(req, res, next) {
  try {
    const { rows, meta } = await paginate(restaurantsCrud, LIVE_FILTER, req.query, {
      orderBy: 'name',
      orderDir: 'ASC',
    });
    res.status(200).json({ restaurants: rows, meta });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const restaurant = await restaurantsCrud.findById(req.params.id);
    if (!isLive(restaurant)) {
      throw notFound('Restaurant not found');
    }

    const serviceAreas = await serviceAreasCrud.findAllForOwner(
      restaurant.id,
      {},
      { orderBy: 'area_name' }
    );

    res.status(200).json({ restaurant, service_areas: serviceAreas });
  } catch (err) {
    next(err);
  }
}

// `getMenu` (Task 3.8) — the Restaurant Profile screen's menu list,
// below the header `getProfile` already serves. Same "never leak a
// non-Live restaurant" 404 as `getProfile`, via the exact same `isLive`
// helper (not re-derived) — see `services/restaurantMenu.js`'s own
// header comment for why the join itself doesn't repeat this check.
async function getMenu(req, res, next) {
  try {
    const restaurant = await restaurantsCrud.findById(req.params.id);
    if (!isLive(restaurant)) {
      throw notFound('Restaurant not found');
    }

    const { rows, meta } = await listRestaurantMenu(restaurant.id, req.query);
    res.status(200).json({ foods: rows, meta });
  } catch (err) {
    next(err);
  }
}

// `getPaymentMethods` (Task 3.13) — the Payment Method selection
// screen's data source. Same "never leak a non-Live restaurant" 404 as
// `getProfile`/`getMenu`, via the same `isLive` helper.
//
// Unlike `getMenu` (Task 3.8), this doesn't need a hand-written raw-SQL
// join: `payment_methods` has its own `restaurant_id` column directly
// (docs/DB_SCHEMA.md's 0.9 section), so `paymentMethodsCrud`'s existing
// `findAllForOwner` (Task 1.16c) already does exactly the single-table,
// equality-filtered read this needs — "for owner" here means "for this
// restaurant", same repurposing `getProfile` already does for
// `serviceAreasCrud.findAllForOwner`.
//
// `is_active: 1` is passed as an extra filter alongside the owner id —
// `findAllForOwner` merges the ownerId in on top of (never replacing)
// whatever filters the caller supplies, so this can't be widened to see
// an inactive method. Filtering it out here matters for the exact
// reason docs/DB_SCHEMA.md's own `payment_methods` column note gives:
// "inactive methods hidden from checkout without deleting history" — a
// customer choosing how to pay is exactly "checkout", and
// `paymentMethodController.js`'s owner-facing routes (1.16c) never
// filter on `is_active` at all (an owner needs to see and reactivate a
// disabled method, not just active ones), so that filtering has to
// happen here, not be inherited from the model.
//
// No pagination, same reasoning as `getProfile`'s `service_areas` call:
// a restaurant's payment method list is small and owner-authored by
// hand, not something that grows large enough to need paging through.
// Ordered by `method_name` ASC, matching `paymentMethodController.js`'s
// own owner-facing `list`'s ordering, so a method doesn't appear to
// re-shuffle between an owner's dashboard and a customer's checkout
// screen for the same restaurant.
async function getPaymentMethods(req, res, next) {
  try {
    const restaurant = await restaurantsCrud.findById(req.params.id);
    if (!isLive(restaurant)) {
      throw notFound('Restaurant not found');
    }

    const paymentMethods = await paymentMethodsCrud.findAllForOwner(
      restaurant.id,
      { is_active: 1 },
      { orderBy: 'method_name' }
    );

    res.status(200).json({ payment_methods: paymentMethods });
  } catch (err) {
    next(err);
  }
}

// getMe (Task 5.2) — GET /api/restaurants/me: the owner-facing
// counterpart to the public `getProfile` above. Returns the caller's own
// restaurant straight from `req.restaurant`, which `attachOwnerRestaurant`
// (1.15a) already fetched for the middleware chain — no second query
// needed, same "reuse what a chained middleware already looked up"
// reasoning `getOne`-style handlers elsewhere in this codebase rely on
// `req.resource` for. This is the Restaurant tab's profile form (Task
// 5.2) reading its current values; logo/cover/categories/hours/service
// areas/payment methods/menu (Tasks 5.3-5.11) all live on this same
// restaurant row or its related tables, not this endpoint.
function getMe(req, res) {
  res.status(200).json({ restaurant: req.restaurant });
}

// updateMe (Task 5.2, extended by Task 5.3, extended by Task 8.4c-ii's
// prerequisite migration 0012) — PATCH /api/restaurants/me: name/
// description (5.2) plus logo_url/cover_url and their *_thumbnail_url
// counterparts (5.3/8.4c-ii). Everything past these six fields — categories, opening hours, service areas, payment
// methods, menu (5.4-5.11) — is its own CRUD screen on a different
// table, so `.strict()` still rejects them here rather than accepting-
// but-ignoring, same reasoning 5.2's own version of this comment gave.
//
// Scoped via `updateForOwner(id, ownerId, data)` rather than the plain
// `update` — same defense-in-depth reasoning `categoryController.update`
// gives for re-checking ownership at the query layer instead of trusting
// `attachOwnerRestaurant`'s lookup alone. Note the owner id passed here
// is `req.user.id` (a `users.id`), not `req.user.restaurant_id` —
// `restaurants`' `ownerColumn` is `owner_id` pointing at `users`, the one
// table scoped by user id instead of restaurant id (see
// `models/restaurants.js`'s own header comment on this asymmetry).
// `is_open` is converted from the API's boolean to the DB's 0/1 before
// `updateProfileSchema` runs, not after — same ordering
// `paymentMethodController.update` uses for `is_active`, so a bad value
// (e.g. the string "true") throws its own 400 immediately rather than
// reaching `updateForOwner` as something that isn't really 0 or 1. Only
// touched when the caller actually sent `is_open`: `toIsOpenNumber`
// resolves to `undefined` for every other request (name/description/
// logo/cover edits, 5.2/5.3), and the `delete data.is_open` below drops
// that `undefined` back out before hitting `crudFactory`'s update —
// same "don't let an explicit `undefined` key reach the query builder"
// reasoning `paymentMethodController.update` already applies to its own
// `is_active`.
async function updateMe(req, res, next) {
  try {
    const is_open = toIsOpenNumber(req.body.is_open);
    const data = parseOrThrow(updateProfileSchema, { ...req.body, is_open });
    if (data.is_open === undefined) delete data.is_open;
    const updated = await restaurantsCrud.updateForOwner(req.restaurant.id, req.user.id, data);
    res.status(200).json({ restaurant: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getProfile,
  getMenu,
  getPaymentMethods,
  getMe,
  updateMe,
  LIVE_FILTER,
  isLive,
};
