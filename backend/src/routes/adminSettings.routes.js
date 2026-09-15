// adminSettings.routes — Task 4.3
//
// Mounted at `/api/admin-settings` in `app.js`. A single public route,
// `GET /registration` — no `authMiddleware`, same reasoning
// `adminSettingsController.js`'s own header comment gives (an owner
// reading this screen may not be logged in yet this session, and none of
// these five fields are sensitive). No shadowing concern the way
// `/api/foods/popular`/`/api/categories/live` each needed a header
// comment for in `app.js`: this is the first and only router for
// `/api/admin-settings`, and its one route is a distinct `/registration`
// sub-path, not a bare `GET /` that a future owner-or-admin-scoped
// sibling route could collide with.

const express = require('express');

const { getRegistrationInfo } = require('../controllers/adminSettingsController');

const router = express.Router();

router.get('/registration', getRegistrationInfo);

module.exports = router;
