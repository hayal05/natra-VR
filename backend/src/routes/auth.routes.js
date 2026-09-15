// auth.routes — Tasks 1.12 (signup) + 1.13 (login) + 1.14d (auth
// middleware wired in for the first time, protecting GET /me).
//
// `authMiddleware` (Task 1.14a-c, backend/src/middleware/authMiddleware.js)
// verifies the token and attaches the public `users` row as `req.user`.
// KNOWN GAP, not fixed by this task: `req.user` has no `restaurant_id` —
// a `users` row doesn't carry one (`restaurants.owner_id` points AT
// `users.id`, not the reverse — see docs/DB_SCHEMA.md). Any future route
// here or elsewhere that needs `ownershipMiddleware` (Task 1.4) — which
// reads `req.user[ownerColumn]`, i.e. `req.user.restaurant_id`, by
// default for owner-scoped tables like foods/categories — cannot just
// chain `authMiddleware` then `ownershipMiddleware` yet. That gap is a
// named dependency for whichever of Task 1.15/1.16 first wires an
// owner-scoped route (most likely needs authMiddleware extended to also
// look up the owner's `restaurants` row by `owner_id`, or a second small
// middleware layered after this one — an open design question left for
// that task, not decided here).

const express = require('express');

const { signup, login, me, updateProfile, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// The first protected route: confirms a token is valid and returns who
// it belongs to. No `ownershipMiddleware` involved — this route isn't
// scoped to any owned resource, just "who am I".
router.get('/me', authMiddleware, me);

// Task 5.22 — owner (or admin) editing their own account. Both scoped to
// `req.user.id` inside the controller, same `authMiddleware`-only
// (no `ownershipMiddleware`) shape as `GET /me` above, for the same
// reason: a `users` row isn't an owned resource the way `foods`/
// `categories` are, it's the caller's own identity.
router.patch('/me', authMiddleware, updateProfile);
router.patch('/me/password', authMiddleware, changePassword);

module.exports = router;
