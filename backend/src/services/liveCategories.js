// liveCategories
//
// Customer-facing global category names used by /api/categories/live.
//
// Categories are platform-wide, so there is no restaurant_id on categories.
// A category is included when at least one food using that category belongs
// to a Live restaurant.

const { withConnection } = require('../config/db');

async function listLiveCategoryNames() {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT DISTINCT c.name AS "name"
         FROM categories c
         JOIN foods f ON f.category_id = c.id
         JOIN restaurants r ON r.id = f.restaurant_id
        WHERE r.live_status = :liveStatus
          AND r.is_suspended = :isSuspended
        ORDER BY c.name ASC`,
      {
        liveStatus: 'approved',
        isSuspended: 0,
      }
    );

    return result.rows.map((row) => row.name);
  });
}

module.exports = { listLiveCategoryNames };
