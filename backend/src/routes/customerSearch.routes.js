// customerSearch.routes — Task 3.6
//
// Mounted at `/api/search` in `app.js`. Unlike `/api/foods/popular`
// (3.5) or `/api/categories/live` (3.4), this segment doesn't shadow or
// get shadowed by anything else — there is no owner-scoped `/api/search`
// router it needs to be registered ahead of — so this mount has none of
// those two files' ordering constraints.
//
// No `authMiddleware`, same as every other customer-facing route (3.3,
// 3.4, 3.5) — customers have no accounts (docs/DB_SCHEMA.md).

const express = require('express');

const customerSearchController = require('../controllers/customerSearchController');

const router = express.Router();

router.get('/', customerSearchController.search);

module.exports = router;
