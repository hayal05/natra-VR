// crudFactory — Tasks 1.1 + 1.2
//
// Generic create/read/update/delete given a schema. "Schema" here means a
// table/column definition (which table, which columns are settable), not a
// zod validation schema — request-shape validation stays a controller-layer
// concern; this module's job is turning a plain data object into safe SQL
// against the table it's configured for.
//
// Task 1.2 adds an optional `ownerColumn` (e.g. `restaurant_id`): when set,
// crudFactory also returns `*ForOwner` variants of the single-row operations
// that scope to a given owner id in the same SQL statement, not as a
// separate fetch-then-check step (see each function's own comment for why).
// `findAll`/`findAllForOwner` didn't need new machinery for this — filtering
// by any allow-listed column, `restaurant_id` included, already worked from
// Task 1.1; `findAllForOwner` is a thin, harder-to-misuse convenience over
// that, not new filtering logic.
//
// Task 1.9 adds `count`/`countForOwner` — same equality-filter rule as
// `findAll`/`findAllForOwner`, minus the SELECT/ORDER BY/paging, so
// `utils/paginate.js` can run a row fetch and a total-count query side by
// side and report "page X of Y" rather than just the current page's rows.
//
// Task 1.15c adds an optional `{ connection }` on `create`/`findById`:
// when passed, that call runs on the given (already-open) connection
// instead of borrowing one from the pool, and doesn't commit — for a
// service-layer caller writing to two tables in one transaction (see
// `config/db.js`'s `withTransaction` and
// `services/createFoodWithVisibility.js`). Every other method is
// unaffected and still manages its own pool connection exactly as before.
//
// Still deliberately NOT included yet (later Phase 1 tasks build these on
// top of, not inside, crudFactory — see docs/ROADMAP.md):
//   - unit tests                                                -> Task 1.3
//   - the Express middleware that reads req.user and calls the
//     *ForOwner methods below with the right ownerId                -> Task 1.4
//   - phone-based lookup without auth                             -> Task 1.10
// findAll's optional `limit`/`offset`/`orderBy` below exist so `paginate`
// (Task 1.9, see utils/paginate.js) has something to build on.
//
// created_at / updated_at are DB-managed (DEFAULT SYSTIMESTAMP + the
// `trg_<table>_updated_at` BEFORE UPDATE triggers already in the Phase 0
// migrations — see backend/migrations/0006.. onward), so crudFactory never
// touches those columns itself; callers never pass them in `data`.

const oracledb = require('oracledb');

const { withConnection } = require('../config/db');
const { badRequest, notFound } = require('./errors');

// Table/column names below come from developer-authored config (the object
// passed to crudFactory(...) at startup), never directly from a request —
// but they still get interpolated into SQL as plain identifiers (Oracle has
// no bind-parameter syntax for identifiers), so this guards against a typo
// or a future caller accidentally wiring in a user-controlled string.
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertSafeIdentifier(name, label) {
  if (typeof name !== 'string' || !SAFE_IDENTIFIER.test(name)) {
    throw new Error(`crudFactory: invalid ${label} "${name}" — must be a plain SQL identifier`);
  }
}

/**
 * @param {Object} config
 * @param {string} config.table - table name, e.g. "foods"
 * @param {string} [config.primaryKey="id"] - PK column name
 * @param {string[]} config.columns - columns a caller may set via create/update.
 *   Deliberately a fixed allow-list (not "everything in the incoming data
 *   object") so a caller passing extra/unexpected keys — e.g. a stray
 *   `is_hidden` on a foods payload, or eventually a malicious
 *   `role: 'admin'` on a users-shaped payload once auth exists — silently
 *   has those keys dropped instead of written to columns nothing intended
 *   to expose.
 * @param {string[]} [config.selectColumns] - columns returned by
 *   findById/findAll/create/update. Defaults to primaryKey + columns +
 *   created_at/updated_at (the two DB-managed columns every mutable table
 *   in docs/DB_SCHEMA.md has, per its own "Conventions" section).
 * @param {string} [config.ownerColumn] - column that scopes rows to an
 *   owner, e.g. "restaurant_id" on `foods`/`categories`/etc, or "owner_id"
 *   on `restaurants` itself. When set, crudFactory also returns
 *   findAllForOwner/findByIdForOwner/updateForOwner/removeForOwner/
 *   getOrThrowForOwner — see Task 1.2 notes above — plus the plain string
 *   `ownerColumn` itself as metadata on the returned object, so callers
 *   like `ownershipMiddleware` (Task 1.4) can default to matching it
 *   against a same-named field on `req.user` without being told twice.
 *   Must be one of `columns` (an owner-scoped table always has the owner
 *   id as a real, settable-at-create column — that's what makes it
 *   scopeable at all).
 */
function crudFactory(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('crudFactory: a config object is required');
  }

  const { table, primaryKey = 'id', columns, selectColumns, ownerColumn } = config;

  assertSafeIdentifier(table, 'table name');
  assertSafeIdentifier(primaryKey, 'primary key column');

  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error(`crudFactory("${table}"): "columns" must be a non-empty array`);
  }
  columns.forEach((col) => assertSafeIdentifier(col, `column ("${table}"."${col}")`));
  if (columns.includes(primaryKey)) {
    throw new Error(
      `crudFactory("${table}"): "columns" must not include the primary key ("${primaryKey}") — it's server-generated`
    );
  }

  if (ownerColumn !== undefined) {
    assertSafeIdentifier(ownerColumn, 'owner column');
    if (!columns.includes(ownerColumn)) {
      throw new Error(
        `crudFactory("${table}"): "ownerColumn" ("${ownerColumn}") must also be listed in "columns" — ` +
          'it has to be a real, settable-at-create column to be scopeable'
      );
    }
  }

  const selectCols = selectColumns
    ? [...selectColumns]
    : [primaryKey, ...columns, 'created_at', 'updated_at'];
  selectCols.forEach((col) => assertSafeIdentifier(col, `select column ("${table}"."${col}")`));
  // De-dupe in case a caller-supplied selectColumns repeats primaryKey/etc.
  // Oracle returns unquoted SELECT identifiers in uppercase. Quote each alias
  // explicitly so every CRUD result keeps the lowercase keys the application
  // contract expects (e.g. `password_hash`, not `PASSWORD_HASH`).
  const selectColList = [...new Set(selectCols)]
    .map((col) => `${col} AS "${col}"`)
    .join(', ');

  /**
   * Keep only the keys in `data` that are on this table's settable-column
   * allow-list. Returns an object, never the original reference.
   */
  function pickAllowed(data = {}) {
    const picked = {};
    for (const col of columns) {
      if (Object.prototype.hasOwnProperty.call(data, col)) {
        picked[col] = data[col];
      }
    }
    return picked;
  }

  /**
   * Insert one row. `data` may contain any subset of `columns`; anything
   * outside the allow-list is silently dropped (see `columns` doc above).
   * Returns the freshly inserted row (re-selected by id, so DB-computed
   * columns like created_at come back populated).
   *
   * @param {Object} [options]
   * @param {Object} [options.connection] - run the insert (and the
   *   re-select) on this already-open connection instead of borrowing one
   *   from the pool, and don't commit — the caller owns the transaction
   *   and is expected to call `connection.commit()` itself once every
   *   statement it needs has succeeded (see `config/db.js`'s
   *   `withTransaction`). For a caller writing to two tables that must
   *   both succeed or neither (Task 1.15c's food + food_visibility pair,
   *   `services/createFoodWithVisibility.js`), pass the same connection to
   *   both `create()` calls.
   */
  async function create(data, options = {}) {
    const picked = pickAllowed(data);
    const insertCols = Object.keys(picked);
    if (insertCols.length === 0) {
      throw badRequest(`No valid fields provided for ${table}`);
    }

    const bindNames = insertCols.map((col, i) => `b${i}`);
    const placeholders = bindNames.map((name) => `:${name}`).join(', ');
    const binds = {};
    insertCols.forEach((col, i) => {
      binds[bindNames[i]] = picked[col];
    });
    binds.newId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };

    const sql = `
      INSERT INTO ${table} (${insertCols.join(', ')})
      VALUES (${placeholders})
      RETURNING ${primaryKey} INTO :newId
    `;

    const { connection: externalConnection } = options;

    if (externalConnection) {
      const result = await externalConnection.execute(sql, binds);
      const insertedId = result.outBinds.newId[0];
      return _selectOneWhere(insertedId, {}, externalConnection);
    }

    const insertedId = await withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      await connection.commit();
      return result.outBinds.newId[0];
    });

    return findById(insertedId);
  }

  /**
   * Internal: SELECT one row matching `primaryKey = :id` plus any extra
   * exact-match conditions (e.g. `{ restaurant_id: 4 }` for an owner-scoped
   * lookup). Kept as one SQL statement rather than "fetch, then check the
   * owner column in JS" so a non-owner's request for someone else's row and
   * a request for a genuinely nonexistent row are indistinguishable (both
   * `null`) at the query level, not just by dropping the result afterward.
   */
  async function _selectOneWhere(id, extraMatch = {}, externalConnection) {
    const binds = { id };
    const extraClauses = Object.entries(extraMatch).map(([col, val], i) => {
      const bindName = `m${i}`;
      binds[bindName] = val;
      return `${col} = :${bindName}`;
    });
    const whereSql = [`${primaryKey} = :id`, ...extraClauses].join(' AND ');

    const sql = `SELECT ${selectColList} FROM ${table} WHERE ${whereSql}`;

    if (externalConnection) {
      // Caller owns an open transaction (see `create`'s `options.connection`
      // below, Task 1.15c) — re-select on that same connection/session,
      // not a fresh one from the pool. A different session wouldn't see
      // this row yet under Oracle's default READ COMMITTED isolation,
      // since the caller hasn't committed.
      const result = await externalConnection.execute(sql, binds);
      return result.rows[0] || null;
    }

    const row = await withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      return result.rows[0];
    });
    return row || null;
  }

  /**
   * Fetch one row by primary key, or `null` if it doesn't exist.
   *
   * @param {Object} [options]
   * @param {Object} [options.connection] - run on this connection instead
   *   of borrowing one from the pool — see `create`'s doc below.
   */
  async function findById(id, options = {}) {
    return _selectOneWhere(id, {}, options.connection);
  }

  /**
   * Internal: validate `filters` against the same "primaryKey + allow-listed
   * columns, equality only" rule `findAll` has always used, and turn it into
   * a `WHERE` clause + binds. Factored out (Task 1.9) so `count` applies the
   * exact same rule as `findAll` by construction rather than by two
   * hand-written copies staying in sync.
   */
  function _buildFilterWhere(filters) {
    const filterCols = Object.keys(filters);
    const allowedFilterCols = new Set([primaryKey, ...columns]);
    for (const col of filterCols) {
      if (!allowedFilterCols.has(col)) {
        throw badRequest(`Cannot filter ${table} by unknown column "${col}"`);
      }
    }

    const binds = {};
    const whereClauses = filterCols.map((col, i) => {
      const bindName = `f${i}`;
      binds[bindName] = filters[col];
      return `${col} = :${bindName}`;
    });
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return { whereSql, binds, allowedFilterCols };
  }

  /**
   * Count rows matching the same simple equality filters `findAll` accepts
   * (see its doc below for the allow-listed-columns rule), without fetching
   * any rows. Task 1.9's `paginate` runs this and `findAll` side by side —
   * same filters, same WHERE clause by construction — to get a total
   * alongside the current page.
   */
  async function count(filters = {}) {
    const { whereSql, binds } = _buildFilterWhere(filters);
    const sql = `SELECT COUNT(*) AS total FROM ${table} ${whereSql}`;
    return withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      return Number(result.rows[0].total);
    });
  }

  /**
   * Fetch rows matching simple equality filters, e.g.
   *   findAll({ restaurant_id: 4 })
   * Only equality on allow-listed columns (plus the primary key) is
   * supported here — richer filtering (LIKE, ranges, joins) belongs in a
   * hand-written query, not this generic helper.
   *
   * `options.orderBy` must name an allow-listed/primary-key column (never
   * built from raw user input) and defaults to the primary key so results
   * are stable/deterministic. `options.limit`/`options.offset` are plain
   * OFFSET/FETCH paging; `utils/paginate.js` (Task 1.9) is what pairs this
   * with `count()` above to get a total alongside the current page — this
   * function alone still only returns rows, no count.
   */
  async function findAll(filters = {}, options = {}) {
    const { whereSql, binds, allowedFilterCols } = _buildFilterWhere(filters);

    const orderBy = options.orderBy || primaryKey;
    assertSafeIdentifier(orderBy, 'orderBy column');
    if (!allowedFilterCols.has(orderBy)) {
      throw badRequest(`Cannot order ${table} by unknown column "${orderBy}"`);
    }
    const direction = options.orderDir && String(options.orderDir).toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';

    let pagingSql = '';
    if (Number.isInteger(options.offset)) {
      binds.pagingOffset = options.offset;
      pagingSql += ' OFFSET :pagingOffset ROWS';
    }
    if (Number.isInteger(options.limit)) {
      binds.pagingLimit = options.limit;
      pagingSql += `${pagingSql ? '' : ' OFFSET 0 ROWS'} FETCH NEXT :pagingLimit ROWS ONLY`;
    }

    const sql = `
      SELECT ${selectColList} FROM ${table}
      ${whereSql}
      ORDER BY ${orderBy} ${direction}
      ${pagingSql}
    `;

    return withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      return result.rows;
    });
  }

  /**
   * Internal: UPDATE one row matched by `primaryKey = :id` plus any extra
   * exact-match conditions, in one statement — same "don't fetch then
   * check" reasoning as `_selectOneWhere`. If `extraMatch` doesn't match
   * (wrong owner, or row doesn't exist), `rowsAffected` is 0 and the row is
   * simply never touched — a non-owner's update attempt costs nothing more
   * than a no-op UPDATE.
   */
  async function _updateWhere(id, data, extraMatch = {}) {
    const picked = pickAllowed(data);
    const updateCols = Object.keys(picked);
    if (updateCols.length === 0) {
      throw badRequest(`No valid fields provided to update ${table}`);
    }

    const binds = { id };
    const setSql = updateCols
      .map((col, i) => {
        const bindName = `u${i}`;
        binds[bindName] = picked[col];
        return `${col} = :${bindName}`;
      })
      .join(', ');

    const extraClauses = Object.entries(extraMatch).map(([col, val], i) => {
      const bindName = `w${i}`;
      binds[bindName] = val;
      return `${col} = :${bindName}`;
    });
    const whereSql = [`${primaryKey} = :id`, ...extraClauses].join(' AND ');

    const sql = `UPDATE ${table} SET ${setSql} WHERE ${whereSql}`;

    const rowsAffected = await withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      await connection.commit();
      return result.rowsAffected;
    });

    if (rowsAffected === 0) return null;
    return findById(id);
  }

  /**
   * Update one row by primary key. `data` may contain any subset of
   * `columns` (same allow-list/drop-unknown-keys behavior as `create`).
   * Returns the updated row, or `null` if no row with that id exists.
   * Throws on an empty update (nothing valid to set) rather than silently
   * no-op'ing, since that almost always means a caller bug upstream.
   */
  async function update(id, data) {
    return _updateWhere(id, data);
  }

  /**
   * Internal: DELETE one row matched by `primaryKey = :id` plus any extra
   * exact-match conditions. Same reasoning as `_selectOneWhere`/`_updateWhere`.
   */
  async function _removeWhere(id, extraMatch = {}) {
    const binds = { id };
    const extraClauses = Object.entries(extraMatch).map(([col, val], i) => {
      const bindName = `w${i}`;
      binds[bindName] = val;
      return `${col} = :${bindName}`;
    });
    const whereSql = [`${primaryKey} = :id`, ...extraClauses].join(' AND ');

    const sql = `DELETE FROM ${table} WHERE ${whereSql}`;
    const rowsAffected = await withConnection(async (connection) => {
      const result = await connection.execute(sql, binds);
      await connection.commit();
      return result.rowsAffected;
    });
    return rowsAffected > 0;
  }

  /**
   * Delete one row by primary key. Returns `true` if a row was deleted,
   * `false` if no row with that id existed (not an error — same
   * "idempotent delete" shape most REST DELETE endpoints want).
   */
  async function remove(id) {
    return _removeWhere(id);
  }

  /**
   * Convenience wrapper: like findById, but throws a 404 ApiError instead
   * of returning null. Useful in controllers that want to 404 immediately
   * rather than null-check.
   */
  async function getOrThrow(id) {
    const row = await findById(id);
    if (!row) throw notFound(`${table} not found`);
    return row;
  }

  const base = { create, findById, findAll, update, remove, getOrThrow, count };

  if (!ownerColumn) {
    return base;
  }

  // --- Task 1.2: ownership-scoped variants, only present when the config
  // actually names an ownerColumn. Paired with `ownershipMiddleware`
  // (Task 1.4), which is expected to read `req.user`'s restaurant id and
  // pass it as `ownerId` here — this module doesn't know about `req` at
  // all, it just accepts whatever id it's given and scopes to it.

  /**
   * Like findAll, but always scoped to one owner — merges/overrides any
   * caller-supplied filter on `ownerColumn` with `ownerId`, so a caller
   * can never accidentally (or deliberately) pass a different owner's id
   * as a plain filter and widen the query.
   */
  async function findAllForOwner(ownerId, filters = {}, options = {}) {
    return findAll({ ...filters, [ownerColumn]: ownerId }, options);
  }

  /**
   * Fetch one row by id, scoped to an owner. Returns `null` both when the
   * row doesn't exist at all *and* when it exists but belongs to a
   * different owner — deliberately the same result either way, so a
   * non-owner probing ids can't distinguish "not found" from "not yours".
   */
  async function findByIdForOwner(id, ownerId) {
    return _selectOneWhere(id, { [ownerColumn]: ownerId });
  }

  /**
   * Update one row by id, scoped to an owner. Rejects any attempt to
   * change `ownerColumn` itself via the update payload — an owner
   * reassigning one of their own rows to a different `restaurant_id`
   * would be a takeover/handoff, not an edit, and isn't something this
   * generic helper should allow silently.
   */
  async function updateForOwner(id, ownerId, data) {
    if (Object.prototype.hasOwnProperty.call(data, ownerColumn)) {
      throw badRequest(`Cannot change "${ownerColumn}" via update`);
    }
    return _updateWhere(id, data, { [ownerColumn]: ownerId });
  }

  /**
   * Delete one row by id, scoped to an owner. Same idempotent-`false`
   * shape as `remove` for "didn't exist or wasn't yours" — a non-owner's
   * delete attempt on someone else's row is indistinguishable from
   * deleting an id that was never there.
   */
  async function removeForOwner(id, ownerId) {
    return _removeWhere(id, { [ownerColumn]: ownerId });
  }

  /**
   * Like getOrThrow, but scoped to an owner via findByIdForOwner.
   */
  async function getOrThrowForOwner(id, ownerId) {
    const row = await findByIdForOwner(id, ownerId);
    if (!row) throw notFound(`${table} not found`);
    return row;
  }

  /**
   * Like count, but always scoped to one owner — same merge/override
   * behavior as findAllForOwner (a caller can't widen the count by passing
   * a different owner id as a plain filter).
   */
  async function countForOwner(ownerId, filters = {}) {
    return count({ ...filters, [ownerColumn]: ownerId });
  }

  return {
    ...base,
    ownerColumn,
    findAllForOwner,
    findByIdForOwner,
    updateForOwner,
    removeForOwner,
    getOrThrowForOwner,
    countForOwner,
  };
}

module.exports = crudFactory;
