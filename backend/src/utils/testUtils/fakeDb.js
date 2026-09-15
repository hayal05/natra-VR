// Test-only double for `../config/db`'s `withConnection`, used by
// `crudFactory.test.js` (Task 1.3). NOT a test file itself — nothing here
// runs under `jest`'s test runner directly, it's `require()`d by a
// `jest.mock('../config/db', ...)` factory.
//
// Why a hand-rolled in-memory fake instead of e.g. an Oracle test
// container: crudFactory's whole job is "turn a data object into SQL
// against a configured table" — the thing worth unit-testing is that
// logic (which columns get written, mass-assignment gets dropped, owner
// scoping is enforced, null/error shapes are right), not Oracle itself.
// A real DB brings setup/teardown cost and CI dependencies for coverage
// this fake gives for free. It intentionally understands only the SQL
// shapes crudFactory.js actually emits (see crudFactory.js's INSERT/
// SELECT/COUNT/UPDATE/DELETE templates) — it is not a general SQL engine, and
// isn't meant to be; if crudFactory's SQL shape changes, this needs a
// matching update, which is an acceptable and known trade-off of testing
// against a double rather than a real database.

function createFakeDb() {
  let tables = {}; // { tableName: { rows: [...], nextId: 1 } }

  function ensureTable(name) {
    if (!tables[name]) tables[name] = { rows: [], nextId: 1 };
    return tables[name];
  }

  function parseConditions(whereStr, binds) {
    // e.g. "id = :id AND owner_id = :m0" -> [{ col: 'id', value: ... }, ...]
    return whereStr.split(' AND ').map((clause) => {
      const m = clause.trim().match(/^(\w+) = :(\w+)$/);
      if (!m) throw new Error(`fakeDb: unparseable WHERE clause "${clause}"`);
      const [, col, bindName] = m;
      return { col, value: binds[bindName] };
    });
  }

  // Task 6.5a fix: strict `===` alone missed the extremely common case of
  // a route param (`req.params.id`, always a string, e.g. `"1"`) bound
  // against a numeric primary key (`row.id`, e.g. `1`) — `1 === '1'` is
  // `false`, so every `findById`/`getOrThrow` call reached from an actual
  // Express route (as opposed to a unit test calling the crud instance
  // directly with a real number) silently matched nothing. This was
  // invisible until this session because no prior session had real
  // `npm`/`jest` access to actually run these suites (every "no npm
  // registry access" session verified via a scratch/manual harness
  // instead) — discovered while writing 6.5a's own
  // `GET /api/admin/restaurants/:id` tests, but it silently affected
  // every existing string-id-via-supertest test in this codebase (e.g.
  // `restaurant.routes.test.js`'s `GET /api/restaurants/:id` "returns
  // the restaurant" case), which were "passing" only where the expected
  // result already happened to be null/404.
  //
  // Falls back to a string comparison (not a bare `==`, to avoid other
  // JS-coercion surprises like `0 == false`) only when the strict check
  // fails and neither side is null/undefined — a reasonable double for
  // what a real NUMBER-column bind comparison against a numeric-string
  // value would actually match in Oracle.
  function rowMatches(row, conditions) {
    return conditions.every(({ col, value }) => {
      if (row[col] === value) return true;
      if (row[col] == null || value == null) return false;
      return String(row[col]) === String(value);
    });
  }

  function project(row, colsStr) {
    const cols = colsStr.split(',').map((s) => s.trim());
    const out = {};
    cols.forEach((c) => {
      out[c] = row[c] !== undefined ? row[c] : null;
    });
    return out;
  }

  const fakeConnection = {
    async execute(sql, binds = {}) {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      // INSERT INTO <table> (<cols>) VALUES (<placeholders>) RETURNING <pk> INTO :newId
      let m = normalized.match(
        /^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\) RETURNING (\w+) INTO :newId$/
      );
      if (m) {
        const [, table, colsStr, , pk] = m;
        const cols = colsStr.split(',').map((s) => s.trim());
        const t = ensureTable(table);
        const row = { [pk]: t.nextId };
        cols.forEach((col, i) => {
          row[col] = binds[`b${i}`];
        });
        row.created_at = new Date().toISOString();
        row.updated_at = null;
        t.rows.push(row);
        const insertedId = t.nextId;
        t.nextId += 1;
        return { outBinds: { newId: [insertedId] } };
      }

      // SELECT COUNT(*) AS total FROM <table> [WHERE <conds>]   (Task 1.9)
      // Checked before the generic "SELECT ... WHERE ..." shape below,
      // since that one would otherwise swallow this (it matches any
      // "SELECT <anything> FROM <table> WHERE <conds>" string) and try to
      // project a non-existent "COUNT(*) AS total" column instead of
      // actually counting.
      m = normalized.match(/^SELECT COUNT\(\*\) AS total FROM (\w+)(?: WHERE (.+))?$/);
      if (m) {
        const [, table, whereStr] = m;
        const t = ensureTable(table);
        let rows = t.rows;
        if (whereStr) {
          const conditions = parseConditions(whereStr, binds);
          rows = rows.filter((r) => rowMatches(r, conditions));
        }
        return { rows: [{ total: rows.length }] };
      }

      // SELECT <col> AS <col>, COUNT(*) AS <alias> FROM <table> WHERE <conds>
      // GROUP BY <col>   (Task 5.17 — orderCounts.js's status-grouped
      // count). Checked before the generic "SELECT ... WHERE ..." shape
      // below for the same reason the COUNT(*)-total shape above already
      // is: that generic shape's regex would otherwise match this too
      // (no ORDER BY) and try to treat it as a single-row select instead
      // of grouping. Deliberately generic on the grouped column name
      // (`\1` backreference), not hardcoded to "status" — any future
      // single-column GROUP BY count query gets this for free, same
      // "extend the double for a genuinely new SQL shape, don't special-
      // case one caller" reasoning Task 1.9's own COUNT(*) addition used.
      m = normalized.match(/^SELECT (\w+) AS \1, COUNT\(\*\) AS (\w+) FROM (\w+) WHERE (.+) GROUP BY \1$/);
      if (m) {
        const [, groupCol, countAlias, table, whereStr] = m;
        const t = ensureTable(table);
        const conditions = parseConditions(whereStr, binds);
        const rows = t.rows.filter((r) => rowMatches(r, conditions));
        const groups = {};
        rows.forEach((r) => {
          const key = r[groupCol];
          groups[key] = (groups[key] || 0) + 1;
        });
        return {
          rows: Object.entries(groups).map(([key, count]) => ({ [groupCol]: key, [countAlias]: count })),
        };
      }

      // SELECT <cols> FROM <table> WHERE <conds>   (single row, no ORDER BY)
      m = normalized.match(/^SELECT (.+) FROM (\w+) WHERE (.+)$/);
      if (m && !/ORDER BY/.test(normalized) && !/GROUP BY/.test(normalized)) {
        const [, colsStr, table, whereStr] = m;
        const t = ensureTable(table);
        const row = t.rows.find((r) => rowMatches(r, parseConditions(whereStr, binds)));
        return { rows: row ? [project(row, colsStr)] : [] };
      }

      // SELECT <cols> FROM <table> [WHERE ...] ORDER BY <col> <dir> [paging]
      m = normalized.match(
        /^SELECT (.+) FROM (\w+) (?:WHERE (.+?) )?ORDER BY (\w+) (ASC|DESC)(.*)$/
      );
      if (m) {
        const [, colsStr, table, whereStr, orderCol, dir, pagingStr] = m;
        const t = ensureTable(table);
        let rows = [...t.rows];

        if (whereStr) {
          const conditions = parseConditions(whereStr, binds);
          rows = rows.filter((r) => rowMatches(r, conditions));
        }

        rows.sort((a, b) => {
          if (a[orderCol] === b[orderCol]) return 0;
          const cmp = a[orderCol] < b[orderCol] ? -1 : 1;
          return dir === 'DESC' ? -cmp : cmp;
        });

        if (pagingStr && pagingStr.includes('OFFSET')) {
          const offsetMatch = pagingStr.match(/OFFSET :(\w+) ROWS/);
          const offset = offsetMatch ? binds[offsetMatch[1]] : 0;
          rows = rows.slice(offset);
        }
        if (pagingStr && pagingStr.includes('FETCH NEXT')) {
          const limitMatch = pagingStr.match(/FETCH NEXT :(\w+) ROWS ONLY/);
          const limit = limitMatch ? binds[limitMatch[1]] : undefined;
          if (limit !== undefined) rows = rows.slice(0, limit);
        }

        return { rows: rows.map((row) => project(row, colsStr)) };
      }

      // UPDATE <table> SET <col=:u0, ...> WHERE <conds>
      m = normalized.match(/^UPDATE (\w+) SET (.+) WHERE (.+)$/);
      if (m) {
        const [, table, setStr, whereStr] = m;
        const t = ensureTable(table);
        const row = t.rows.find((r) => rowMatches(r, parseConditions(whereStr, binds)));
        if (!row) return { rowsAffected: 0 };
        setStr.split(',').forEach((assign) => {
          const am = assign.trim().match(/^(\w+) = :(\w+)$/);
          if (am) {
            const [, col, bindName] = am;
            row[col] = binds[bindName];
          }
        });
        row.updated_at = new Date().toISOString();
        return { rowsAffected: 1 };
      }

      // DELETE FROM <table> WHERE <conds>
      m = normalized.match(/^DELETE FROM (\w+) WHERE (.+)$/);
      if (m) {
        const [, table, whereStr] = m;
        const t = ensureTable(table);
        const conditions = parseConditions(whereStr, binds);
        const before = t.rows.length;
        t.rows = t.rows.filter((r) => !rowMatches(r, conditions));
        return { rowsAffected: before - t.rows.length };
      }

      throw new Error(`fakeDb: unrecognized SQL shape:\n${normalized}`);
    },
    async commit() {
      // no-op — the in-memory store has no transaction concept to commit
    },
    async rollback() {
      // Restores whatever snapshot `withTransaction` took when it opened
      // this "connection" — see below. A plain `withConnection` caller
      // never calls this (it always commits after its one statement), so
      // this only matters for the withTransaction path.
      if (snapshot) {
        tables = snapshot;
        snapshot = undefined;
      }
    },
  };

  // Set by `withTransaction` just before invoking `work`, so `rollback()`
  // above has something to restore to. `withConnection` never touches
  // this — it has no rollback concept, matching the real `config/db.js`.
  let snapshot;

  function cloneTables() {
    // Structured-clone-ish deep copy good enough for the plain
    // string/number/null row shapes crudFactory ever writes.
    return JSON.parse(JSON.stringify(tables));
  }

  return {
    // Matches config/db.js's real exports that crudFactory.js imports.
    withConnection: async (work) => work(fakeConnection),
    // Matches config/db.js's real `withTransaction` (Task 1.15c): snapshot
    // the store before `work` runs, restore it if `work` throws (same
    // "no partial write survives an error" contract the real rollback
    // gives), and never auto-commit in between statements `work` issues —
    // `work` is expected to call `connection.commit()` itself.
    withTransaction: async (work) => {
      snapshot = cloneTables();
      try {
        const result = await work(fakeConnection);
        snapshot = undefined;
        return result;
      } catch (err) {
        await fakeConnection.rollback();
        throw err;
      }
    },
    // Test-only escape hatches, not part of the real config/db.js API:
    __reset: () => {
      tables = {};
      snapshot = undefined;
    },
    __getRows: (table) => (tables[table] ? [...tables[table].rows] : []),
  };
}

module.exports = { createFakeDb };
