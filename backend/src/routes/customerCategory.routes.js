// customerCategory.routes — Task 3.4
//
// Mounted at `/api/categories/live` in `app.js` — see this file's own
// mount-order comment there for why it MUST be registered before
// `app.use('/api/categories', categoryRoutes)` (Task 1.16a): Express
// tries `app.use(...)` mounts in registration order for any request path
// that matches more than one mount's prefix, and `/api/categories/live`
// is itself a prefix match for `/api/categories`. If the owner-scoped
// router were tried first, its own `GET /:id` route would happily match
// the literal segment "live" as an `:id` value and run
// `authMiddleware` → 401, before this route ever got a chance — the
// exact kind of accidental-shadowing bug worth naming explicitly rather
// than discovering by a customer's chip row silently 401ing.
//
// No `authMiddleware` at all, same as `restaurant.routes.js` (Task
// 3.3) — customers have no accounts (docs/DB_SCHEMA.md).

const express = require('express');

const customerCategoryController = require('../controllers/customerCategoryController');

const router = express.Router();

router.get('/', customerCategoryController.list);

module.exports = router;
