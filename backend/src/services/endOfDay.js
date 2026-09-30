const { withConnection } = require('../config/db');

async function closeOpenRestaurants() {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `
      UPDATE restaurants
      SET is_open = 0
      WHERE is_open = 1
      `
    );

    await connection.commit();

    return {
      closedCount: result.rowsAffected || 0,
    };
  });
}

module.exports = {
  closeOpenRestaurants,
};
