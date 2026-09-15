// orderCode — Task 3.15a
//
// Pure generator for the customer-facing `order_code` shown at checkout
// and used for Track Order (docs/DB_SCHEMA.md's 0.8 section, e.g.
// "NTR-48291"). This module only produces a candidate code — it does NOT
// check the `orders` table for a collision or retry on one. `order_code`
// has a DB-level UNIQUE constraint (`uq_orders_order_code`, migration
// 0008); catching that constraint violation and retrying with a fresh
// code is `services/submitOrder.js`'s job (Task 3.15b), not this
// module's — a collision can only be detected against the real table,
// which a single-string generator has no connection to and shouldn't
// need one for.
//
// Uses `crypto.randomInt` (not `Math.random`) for a properly uniform
// distribution over the 90,000-value range, not because order codes are
// a security boundary — they're shown to the customer and typed back in
// at Track Order (Task 3.17), so guessability isn't a concern here.

const { randomInt } = require('crypto');

const PREFIX = 'NTR-';
// 5-digit body, matching docs/DB_SCHEMA.md's own example ("NTR-48291").
// `order_code` is VARCHAR2(20), so there's plenty of headroom if this
// range ever needs to widen later.
const MIN_DIGITS = 10000;
const MAX_DIGITS = 99999; // inclusive — randomInt's upper bound is exclusive

/**
 * Generate one candidate order code, e.g. "NTR-48291". Not guaranteed
 * unique against the `orders` table — see module header.
 *
 * @returns {string}
 */
function generateOrderCode() {
  const digits = randomInt(MIN_DIGITS, MAX_DIGITS + 1);
  return `${PREFIX}${digits}`;
}

module.exports = { generateOrderCode };
