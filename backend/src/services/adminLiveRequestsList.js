// adminLiveRequestsList — Task 6.6a, extended by 6.6c
//
// Backs the admin "Live-request review" queue with pending live_requests
// rows joined with restaurants and registration_payments. The detail read
// intentionally does not filter by status so an already-reviewed request
// can still be opened directly.

const { withConnection } = require('../config/db');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/paginate');
const { notFound } = require('../utils/errors');

const PENDING_STATUS = 'pending';

const LIVE_REQUEST_COLUMNS = `lr.id AS id,
                lr.restaurant_id AS restaurant_id,
                r.name AS restaurant_name,
                lr.status AS status,
                lr.created_at AS created_at,
                rp.amount AS amount,
                rp.payment_screenshot_url AS payment_screenshot_url,
                rp.submitted_at AS submitted_at`;

const LIVE_REQUEST_FROM_JOIN = `FROM live_requests lr
           JOIN restaurants r ON r.id = lr.restaurant_id
           JOIN registration_payments rp ON rp.live_request_id = lr.id`;

async function listLiveRequestsForAdmin(rawParams = {}) {
  const { limit, offset } = parsePaginationParams(rawParams);

  return withConnection(async (connection) => {
    const [rowsResult, countResult] = await Promise.all([
      connection.execute(
        `SELECT ${LIVE_REQUEST_COLUMNS}
           ${LIVE_REQUEST_FROM_JOIN}
          WHERE lr.status = :status
          ORDER BY lr.created_at ASC
          OFFSET :pagingOffset ROWS
          FETCH NEXT :pagingLimit ROWS ONLY`,
        { status: PENDING_STATUS, pagingOffset: offset, pagingLimit: limit }
      ),
      connection.execute(`SELECT COUNT(*) AS total FROM live_requests WHERE status = :status`, {
        status: PENDING_STATUS,
      }),
    ]);

    const total = Number(countResult.rows[0].total);
    return { rows: rowsResult.rows, meta: buildPaginationMeta({ total, limit, offset }) };
  });
}

async function getLiveRequestForAdmin(id) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT ${LIVE_REQUEST_COLUMNS}
         ${LIVE_REQUEST_FROM_JOIN}
        WHERE lr.id = :id`,
      { id }
    );

    const row = result.rows[0];
    if (!row) throw notFound('live_requests not found');
    return row;
  });
}

// Returns the most recently created Live Request for a restaurant. This is
// used by Admin Restaurant Detail so the restaurant page can show the
// current request without changing the existing Live Request approval API.
// A restaurant may have historical rejected/approved requests, so the
// latest request is the relevant one to display.
async function getLatestLiveRequestForRestaurant(restaurantId) {
  return withConnection(async (connection) => {
    const result = await connection.execute(
      `SELECT ${LIVE_REQUEST_COLUMNS}
         ${LIVE_REQUEST_FROM_JOIN}
        WHERE lr.restaurant_id = :restaurantId
        ORDER BY lr.created_at DESC
        FETCH FIRST 1 ROW ONLY`,
      { restaurantId }
    );

    return result.rows[0] || null;
  });
}

module.exports = {
  listLiveRequestsForAdmin,
  getLiveRequestForAdmin,
  getLatestLiveRequestForRestaurant,
  PENDING_STATUS,
};
