// liveCategories — Task 3.4
//
// Backs the customer-facing Home screen's Categories chip row
// (frontend/src/pages/Home/Home.jsx). Flagged as a real backend gap in
// docs/PROJECT_STATUS.md's own "Next" note on Task 3.3: `/api/categories`
// (Task 1.16a) already exists, but it's owner-scoped — it 403s with no
// `req.user.restaurant_id` to resolve, and even if it didn't, it would
// only ever return one restaurant's own categories, never the
// aggregate-across-every-Live-restaurant list a customer browsing the
// home screen actually needs. That's a genuinely different query shape,
// the same reasoning Task 3.3 needed a brand new `restaurantController`
// rather than reusing an owner-scoped one for the Restaurants row.
//
// `crudFactory` (Task 1.1/1.2) only ever does single-table reads/writes
// against one configured table (see that file's own header comment) — it
// has no join support at all, so this can't be built as another
// crudFactory instance the way `categories`/`restaurants` are. This is a
// small hand-written raw-SQL read instead, following the same pattern
// `routes/health.routes.js` (Task 0.15) already uses for its own
// `SELECT 1 FROM DUAL` check: call `withConnection` directly rather than
// stretch crudFactory to cover a shape it was never meant to.
//
// Query: distinct `categories.name` values, joined to `restaurants` and
// filtered to exactly `restaurantController.js`'s own `LIVE_FILTER`
// (`live_status = 'approved' AND is_suspended = 0`) — Task 3.3's own
// definition of "Live" (docs/DB_SCHEMA.md's "Live is derived, not a raw
// flag"), reused here as the identical two-condition filter rather than
// redefining it a second time. `is_open` is not filtered on, same
// reasoning as 3.3: a Live-but-Closed restaurant's categories should
// still show up as a browsable chip (a customer can still look, they
// just can't order until it reopens) — hiding them here would make the
// chip row flicker in and out as restaurants toggle Open/Closed for
// reasons that have nothing to do with what categories exist.
//
// Deliberately NOT filtered by whether the category actually has any
// foods (let alone any *visible* — `food_visibility.is_hidden = 0` —
// foods) in it: Task 3.5 (Popular Foods grid) and 3.6 (search/filter
// wiring) are what a chip selection will actually feed into, and neither
// exists yet in this codebase to define what "usable" means for a
// category. Scoping this list down to only-categories-with-foods now
// would be a filtering *decision* this task wasn't asked to make, not an
// extraction of something already decided elsewhere — flagged here the
// same way 2.14's own doc comment left multi-select chips as a real
// future call rather than a silent guess.
//
// No pagination: unlike `/api/restaurants` (Task 3.3, built on
// `paginate()`), this returns every distinct name in one response. A
// horizontally-scrolling chip row (`HorizontalScroller`/`FilterBar`,
// Tasks 2.6/2.14) has no page controls to hand a `page`/`limit` to, and
// this app's whole category vocabulary is owner-authored by hand
// (docs/NATRA_MASTER_PROMPT.md: "Restaurant owners create and manage
// their own categories") across a small, seeded number of restaurants —
// nothing here is likely to grow into the thousands the way a raw
// `foods`/`orders` table might. Worth revisiting if that assumption ever
// stops holding, not designed around from the start the way `paginate`
// was for genuinely large tables.
//
// Column-casing note: Oracle returns unquoted aliases in uppercase when
// using OUT_FORMAT_OBJECT. The SQL below therefore quotes the alias so
// the service's existing `row.name` mapping remains correct and stable.

const { withConnection } = require('../config/db');

async function listLiveCategoryNames() {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT DISTINCT c.name AS "name"
         FROM categories c
         JOIN restaurants r ON r.id = c.restaurant_id
        WHERE r.live_status = :liveStatus
          AND r.is_suspended = :isSuspended
        ORDER BY c.name ASC`,
      { liveStatus: 'approved', isSuspended: 0 }
    );
    return result.rows.map((row) => row.name);
  });
}

module.exports = { listLiveCategoryNames };
