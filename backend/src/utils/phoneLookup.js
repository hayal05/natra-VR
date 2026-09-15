// phoneLookup — Task 1.10
//
// A generic, deliberately-**no-auth** "find records by phone number"
// utility. The customer-facing side of NATRA never has an account
// ("Customer identity is not a FK — customers have no account row
// anywhere", docs/DB_SCHEMA.md's `orders` table), so every
// customer-initiated lookup has to work off a phone number the customer
// types in, not a `req.user` an auth middleware attached:
//   - Track Order (Task 3.17): customer supplies an order code + phone
//   - Order history (Task 3.18): customer supplies just a phone number
//
// This is intentionally NOT built on `ownershipMiddleware`'s
// "req.user owns this" model (Task 1.4) — a phone number isn't an owner
// id, there's no session to read it from, and there is deliberately no
// authentication step at all: whoever knows a phone number (and, for a
// single-order lookup, its order code) can look it up. That's a product
// decision already made by the "phone-based tracking, no customer
// accounts" design (docs/NATRA_MASTER_PROMPT.md), not something this
// module second-guesses.
//
// Built as a factory bound to one crudFactory (Task 1.1) instance + column
// names, same shape as `ownershipMiddleware` — not as loose functions like
// `paginate.js` (Task 1.9) — because, unlike pagination (which is the same
// shape everywhere: limit/offset/filters), a phone lookup is tied to one
// specific pair of columns on one specific table for the lifetime of a
// route, and re-passing those column names on every call the way
// `paginate`'s `crud`-per-call style does would just be repetition.
//
// Deliberately NOT this module's job:
//   - deciding *which* columns are searchable, or validating them against
//     an allow-list — that's still crudFactory's job; `findAll` (1.1)
//     already rejects an unknown column, so this module doesn't duplicate
//     that check, it just calls through
//   - pagination metadata for "all orders for this phone" — `paginate.js`
//     (1.9) already solves that; `findAllByPhone` below is a thin wrapper
//     that adds the phone filter and forwards everything else to it
//   - normalizing (or validating the shape of) a phone number *before it's
//     stored* — order submission (Task 3.15) is what writes
//     `orders.customer_phone` in the first place, and it needs to run
//     phone numbers through the same `normalizePhone` this module uses for
//     matching, or a customer typing their number slightly differently at
//     Track Order time than they did at checkout won't find their order.
//     That's a dependency on 3.15 to get right, not something this module
//     can enforce from the read side.

const { paginate } = require('./paginate');
const { badRequest, notFound } = require('./errors');

/**
 * Normalize a phone number for comparison: strips everything but digits,
 * keeping a single leading `+` if one was present, so "0912 345 678",
 * "0912-345-678", and "+251 912 345 678" are treated as candidates for the
 * same lookup even though a customer is unlikely to type a number
 * identically every time. Does NOT attempt real phone-number parsing —
 * country-code inference, length/format validation — since
 * NATRA_MASTER_PROMPT.md hasn't specified one, and guessing a rule here
 * would risk silently normalizing two genuinely different numbers into the
 * same value (worse than under-normalizing, which just fails a lookup
 * that a customer can retry by typing more carefully).
 *
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  if (typeof phone !== 'string' || phone.trim() === '') {
    throw badRequest('A phone number is required');
  }
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits === '') {
    throw badRequest('A phone number is required');
  }
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/**
 * @param {Object} config
 * @param {Object} config.crud - a crudFactory(...) instance (Task 1.1) —
 *   must expose `findAll` (every crudFactory instance does)
 * @param {string} config.phoneColumn - the phone column to match against,
 *   e.g. "customer_phone" (must be one of `crud`'s allow-listed columns —
 *   `findAll` already enforces that; this module doesn't re-check it)
 * @param {string} [config.codeColumn] - a unique per-row code column, e.g.
 *   "order_code". Only required to use `findOneByCode`/`getOrThrowByCode`
 *   below — `findAllByPhone` alone doesn't need one.
 * @param {string} [config.entityName="record"] - used only in
 *   `getOrThrowByCode`'s 404 message, e.g. "Order" -> "Order not found".
 */
function phoneLookup(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('phoneLookup: a config object is required');
  }

  const { crud, phoneColumn, codeColumn, entityName = 'record' } = config;

  if (!crud || typeof crud.findAll !== 'function') {
    throw new Error('phoneLookup: "crud" must be a crudFactory(...) instance');
  }
  if (typeof phoneColumn !== 'string' || phoneColumn === '') {
    throw new Error('phoneLookup: "phoneColumn" is required');
  }

  /**
   * Fetch every row belonging to a given phone number, e.g. a customer's
   * order history (Task 3.18) — no code needed, no auth. Paginated via
   * `paginate.js` (Task 1.9) rather than a plain `findAll`, since an
   * unbounded "every order this phone has ever placed" list is exactly
   * what `ListWithPagination` (Task 2.16) exists for.
   *
   * `filters` merges in *after* the phone match, same
   * "caller can't override/widen the scoping value" contract
   * `findAllForOwner` (Task 1.2) uses for ownerId — a caller passing
   * `{ [phoneColumn]: someOtherNumber }` here can't use it to search a
   * different phone than the one actually supplied.
   *
   * @param {string} phone - raw, as typed by the customer
   * @param {Object} [filters] - additional equality filters, e.g.
   *   `{ status: 'Completed' }` to filter order history by status
   * @param {Object} [rawParams] - forwarded to `paginate()` — page/limit/offset
   * @param {Object} [options] - forwarded to `paginate()` — orderBy/orderDir/etc.
   */
  async function findAllByPhone(phone, filters = {}, rawParams = {}, options = {}) {
    const normalized = normalizePhone(phone);
    return paginate(crud, { ...filters, [phoneColumn]: normalized }, rawParams, options);
  }

  /**
   * Fetch exactly one row matching both a unique code (e.g. `order_code`)
   * and a phone number — Track Order (Task 3.17) needs both, not phone
   * alone. Phone numbers are not secrets: anyone who knows (or guesses) a
   * customer's phone number should not be able to browse every order that
   * phone has ever placed through this lookup — that's what
   * `findAllByPhone`/Order History (3.18) is for, and it's a deliberately
   * separate, less-restrictive call a route has to opt into on purpose.
   * Requiring the code too means a caller needs both pieces of
   * information, not just one.
   *
   * Returns `null` both when no row has that code at all, and when a row
   * has that code but a *different* phone — the same
   * "wrong credential is indistinguishable from nonexistent" shape
   * crudFactory's `*ForOwner` methods use (Task 1.2), here so a Track
   * Order endpoint doesn't leak whether a given order code exists to
   * someone who doesn't also know the phone on it.
   *
   * @param {string} code - as typed/entered by the customer
   * @param {string} phone - as typed by the customer
   */
  async function findOneByCode(code, phone) {
    if (!codeColumn) {
      throw new Error('phoneLookup: "codeColumn" must be configured to use findOneByCode');
    }
    if (typeof code !== 'string' || code.trim() === '') {
      throw badRequest('An order code is required');
    }
    const normalized = normalizePhone(phone);

    const rows = await crud.findAll(
      { [codeColumn]: code.trim(), [phoneColumn]: normalized },
      { limit: 1 }
    );
    return rows[0] || null;
  }

  /**
   * Like `findOneByCode`, but throws a 404 `ApiError` instead of returning
   * `null` — useful in controllers that want to 404 immediately rather
   * than null-check, same convenience `getOrThrow`/`getOrThrowForOwner`
   * (Task 1.1/1.2) provide on the write side of crudFactory.
   */
  async function getOrThrowByCode(code, phone) {
    const row = await findOneByCode(code, phone);
    if (!row) throw notFound(`${entityName} not found`);
    return row;
  }

  return { findAllByPhone, findOneByCode, getOrThrowByCode };
}

module.exports = { phoneLookup, normalizePhone };
