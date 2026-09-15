// liveRequest.routes — Task 4.5c
//
// One route, owner-only: POST / (mounted at /api/live-requests in
// app.js). Same first-two-middlewares chain `food.routes.js`'s
// collection routes use:
//   authMiddleware        (1.14) — who is this
//   attachOwnerRestaurant (1.15a) — resolves req.user.restaurant_id for
//                                   an owner; 403s an owner with no
//                                   restaurant yet; no-ops (relying on a
//                                   later 403) for any other role
//
// No `ownershipMiddleware` here — same reasoning `food.routes.js`
// already documents for its own `POST /`: that middleware is built
// around a single `:id` route param, which a create-only collection
// route has none of. There's nothing to scope a `POST` to fetch+confirm
// first; `attachOwnerRestaurant` already puts the right
// `req.user.restaurant_id` on the request for `submitLiveRequest`
// (4.5b) to use.
//
// GET /latest — Task 4.6. Same first-two-middlewares chain as POST /
// above (authMiddleware -> attachOwnerRestaurant): an owner-only read of
// their own restaurant's most recent live_requests row, for the
// pending-state screen to render (pending/approved/rejected) without
// yet needing a full list/pagination endpoint — no other screen named
// so far needs to see more than the latest one. A literal path segment
// ("latest"), not a query param on `GET /`, and mounted before any
// future `:id` route would be, same "register the specific path first"
// reasoning `order.routes.js` already gives for its own `/track`/
// `/history` routes.
//
// No `ownershipMiddleware` here either, same reasoning as `POST /`
// above: there's no `:id` route param to scope — `attachOwnerRestaurant`
// already puts the right `req.user.restaurant_id` on the request for
// `liveRequestController.getLatest` to scope its own read by.

const express = require('express');

const liveRequestController = require('../controllers/liveRequestController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');

const router = express.Router();

router.get('/latest', authMiddleware, attachOwnerRestaurant, liveRequestController.getLatest);
router.post('/', authMiddleware, attachOwnerRestaurant, liveRequestController.create);

module.exports = router;
