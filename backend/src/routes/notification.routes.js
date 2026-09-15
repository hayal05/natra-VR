// notification.routes — Task 7.5b
//
// Mounted at `/api/notifications` in `app.js`. No shadowing concern the
// way `/api/foods/popular`/`/api/categories/live` needed (see those
// routers' own header comments) — first and only router for this path,
// same as `order.routes.js`'s own note for `/api/orders`.
//
// Both routes require `authMiddleware` (Task 1.14) only — no
// `attachOwnerRestaurant` (Task 1.15a): a notification is scoped by
// `recipient_id` (a plain `users.id`), not a restaurant, so any
// authenticated user (owner today; nothing here assumes only owners ever
// will be) can read/mark-read their own.

const express = require('express');

const notificationController = require('../controllers/notificationController');
const notifications = require('../models/notifications');
const { authMiddleware } = require('../middleware/authMiddleware');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');

const router = express.Router();

// `recipient_id` (the DB column `notifications`'s `ownerColumn`, Task
// 7.5b) holds a `users.id`, matched against the logged-in caller's own
// `req.user.id` — same `{ ownerIdField: 'id' }` override
// `ownershipMiddleware`'s own file header already documents for
// `restaurants` (owner_id vs. req.user.id), applied here for the same
// reason.
const requireOwnedNotification = ownershipMiddleware(notifications, { ownerIdField: 'id' });

router.get('/', authMiddleware, notificationController.list);
router.patch('/:id/read', authMiddleware, requireOwnedNotification, notificationController.markRead);

module.exports = router;
