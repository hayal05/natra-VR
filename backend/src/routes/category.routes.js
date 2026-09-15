// category.routes — Task 1.16a
//
// Mirrors food.routes.js's (1.15d) chain exactly — see that file's
// header comment for the full reasoning behind the middleware order and
// why GET/POST / don't chain ownershipMiddleware:
//   authMiddleware        (1.14) — who is this
//   attachOwnerRestaurant (1.15a) — resolves req.user.restaurant_id
//   ownershipMiddleware(categoriesCrud) (1.4) — on :id routes only,
//     fetches+confirms the row, attaches it as req.resource

const express = require('express');

const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');
const categoriesCrud = require('../models/categories');

const router = express.Router();

const requireOwnedCategory = ownershipMiddleware(categoriesCrud);

router.get('/', authMiddleware, attachOwnerRestaurant, categoryController.list);
router.post('/', authMiddleware, attachOwnerRestaurant, categoryController.create);

router.get('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedCategory, categoryController.getOne);
router.patch('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedCategory, categoryController.update);
router.delete('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedCategory, categoryController.remove);

module.exports = router;
