// paginate — Task 1.9
//
// Wraps a crudFactory instance's `findAll`/`count` (Tasks 1.1/1.2/1.9 — see
// crudFactory.js) into something that returns one page of rows *and* the
// metadata a `ListWithPagination` frontend component (Task 2.16) needs to
// render "page X of Y" / "N results": total row count, current page,
// totalPages, hasNextPage/hasPrevPage. `findAll` alone only ever gives back
// the current page's rows with no idea how many more there are.
//
// Deliberately NOT this module's job:
//   - deciding *which* columns are filterable/orderable — that's still
//     crudFactory's `columns`/`primaryKey` allow-list, enforced identically
//     whether or not paginate is in the picture (paginate just forwards
//     `filters`/`orderBy`/`orderDir` through untouched)
//   - auth/ownership — `paginateForOwner` just forwards to
//     `findAllForOwner`/`countForOwner`, the same "merge ownerId into
//     filters, can't be widened" contract those already have (Task 1.2),
//     not a policy about who's allowed to call it (that's
//     `ownershipMiddleware`, Task 1.4)
//
// Query-param parsing accepts either `page` (1-based — what every planned
// list screen, 2.16/5.12/6.4/6.9, actually needs) or `offset` (0-based),
// plus `limit`. If both `page` and `offset` are given, `page` wins and
// `offset` is ignored — passing both is more likely a caller bug than an
// intentional override, so silently picking one and dropping the other
// only pretends to honor a request that doesn't have one clear meaning.

const { badRequest } = require('./errors');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value, label, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw badRequest(`"${label}" must be a positive integer`);
  }
  return n;
}

function parseNonNegativeInt(value, label, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw badRequest(`"${label}" must be a non-negative integer`);
  }
  return n;
}

/**
 * Parse raw pagination params (typically `req.query`, so everything
 * arrives as a string or is `undefined`) into a normalized, validated
 * `{ limit, offset, page }`. Throws a 400 `ApiError` on anything that
 * isn't a well-formed non-negative/positive integer where one is
 * required — e.g. `limit=-5` or `page=abc` — rather than silently
 * coercing bad input into something that looks like the request was
 * honored (`Number('abc')` is `NaN`, which would otherwise flow straight
 * into a SQL bind).
 *
 * @param {Object} [raw]
 * @param {string|number} [raw.page] - 1-based page number
 * @param {string|number} [raw.limit] - rows per page
 * @param {string|number} [raw.offset] - 0-based row offset; only used
 *   when `page` is not provided (see module header)
 * @param {Object} [options]
 * @param {number} [options.defaultLimit=DEFAULT_LIMIT] - used when `limit`
 *   is omitted
 * @param {number} [options.maxLimit=MAX_LIMIT] - hard cap on `limit`, so a
 *   caller can't request e.g. `limit=1000000` and force a full-table
 *   fetch through what's supposed to be a paged endpoint
 * @returns {{ limit: number, offset: number, page: number }}
 */
function parsePaginationParams(raw = {}, options = {}) {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;

  const limit = parsePositiveInt(raw.limit, 'limit', defaultLimit);
  if (limit > maxLimit) {
    throw badRequest(`"limit" cannot exceed ${maxLimit}`);
  }

  if (raw.page !== undefined) {
    const page = parsePositiveInt(raw.page, 'page', 1);
    return { limit, offset: (page - 1) * limit, page };
  }

  const offset = parseNonNegativeInt(raw.offset, 'offset', 0);
  return { limit, offset, page: Math.floor(offset / limit) + 1 };
}

/**
 * Build the metadata block that goes alongside a page of rows. `total`
 * must come from a `count()` run against the *same filters* as the page
 * fetch itself — deriving it any other way (e.g. from `rows.length`)
 * would be wrong on every page but the last, which is exactly the bug
 * this module exists to avoid (see crudFactory.js's `findAll` doc: it
 * has never had a total-count story of its own).
 *
 * @param {{ total: number, limit: number, offset: number }} args
 */
function buildPaginationMeta({ total, limit, offset }) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    total,
    limit,
    offset,
    page,
    totalPages,
    hasNextPage: offset + limit < total,
    hasPrevPage: offset > 0,
  };
}

/**
 * Fetch one page of rows from a crudFactory instance (or anything shaped
 * like one — a `findAll(filters, options)` + `count(filters)` pair) along
 * with its pagination metadata, in one call. Runs the row fetch and the
 * count query in parallel, since they're independent reads of the same
 * filtered set rather than one depending on the other.
 *
 * @param {{ findAll: Function, count: Function }} crud - a crudFactory(...)
 *   instance
 * @param {Object} [filters] - equality filters, forwarded as-is to both
 *   `findAll` and `count` — see crudFactory's `findAll` doc for the
 *   allow-listed-columns rule this inherits
 * @param {Object} [rawParams] - raw page/limit/offset, e.g. `req.query`
 * @param {Object} [options] - `{ orderBy, orderDir, defaultLimit, maxLimit }`
 *   — `orderBy`/`orderDir` are forwarded to `findAll` untouched, the other
 *   two to `parsePaginationParams`
 * @returns {Promise<{ rows: Array, meta: Object }>}
 */
async function paginate(crud, filters = {}, rawParams = {}, options = {}) {
  const { limit, offset } = parsePaginationParams(rawParams, options);
  const { orderBy, orderDir } = options;

  const [rows, total] = await Promise.all([
    crud.findAll(filters, { limit, offset, orderBy, orderDir }),
    crud.count(filters),
  ]);

  return { rows, meta: buildPaginationMeta({ total, limit, offset }) };
}

/**
 * Like `paginate`, but scoped to one owner via `findAllForOwner`/
 * `countForOwner` (Task 1.2/1.9) — same "merge ownerId into filters, can't
 * be widened by the caller" contract those already have. `crud` must have
 * been built with an `ownerColumn` (i.e. `crudFactory({ ..., ownerColumn })`).
 *
 * @param {{ findAllForOwner: Function, countForOwner: Function }} crud
 * @param {*} ownerId
 * @param {Object} [filters]
 * @param {Object} [rawParams]
 * @param {Object} [options]
 * @returns {Promise<{ rows: Array, meta: Object }>}
 */
async function paginateForOwner(crud, ownerId, filters = {}, rawParams = {}, options = {}) {
  const { limit, offset } = parsePaginationParams(rawParams, options);
  const { orderBy, orderDir } = options;

  const [rows, total] = await Promise.all([
    crud.findAllForOwner(ownerId, filters, { limit, offset, orderBy, orderDir }),
    crud.countForOwner(ownerId, filters),
  ]);

  return { rows, meta: buildPaginationMeta({ total, limit, offset }) };
}

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parsePaginationParams,
  buildPaginationMeta,
  paginate,
  paginateForOwner,
};
