// users — Task 1.12
//
// crudFactory instance for `users` (owners/admins only — see
// docs/DB_SCHEMA.md's 0.6 section; customers never get a row here). This
// is the first real crudFactory instance in the codebase: Tasks 1.1–1.10
// only built and unit-tested the factory itself against dummy
// "widgets"/"gadgets" tables, never wired it to an actual NATRA table.
//
// No `ownerColumn` — `users` isn't owned by anything else, it's the thing
// `restaurants.owner_id` points *at*.
//
// `password_hash` is listed as a settable column because crudFactory has
// no concept of "sensitive" — it just knows what's on the allow-list.
// Callers (authController, 1.12) are responsible for:
//   - only ever writing the output of `hashPassword` (1.11) here, never
//     a raw password
//   - stripping `password_hash` back out of anything returned to a
//     client (see authController.js's `toPublicUser`)

const crudFactory = require('../utils/crudFactory');

const users = crudFactory({
  table: 'users',
  columns: ['role', 'full_name', 'email', 'phone', 'password_hash'],
});

module.exports = users;
