// serviceArea.routes — Task 1.16b
//
// Mirrors category.routes.js's (1.16a) chain exactly — see food.routes.js
// (1.15d) for the full reasoning behind the middleware order and why
// GET/POST / don't chain ownershipMiddleware.

const express = require('express');

const serviceAreaController = require('../controllers/serviceAreaController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');
const serviceAreasCrud = require('../models/serviceAreas');

const router = express.Router();

const requireOwnedServiceArea = ownershipMiddleware(serviceAreasCrud);

router.get('/', authMiddleware, attachOwnerRestaurant, serviceAreaController.list);
router.post('/', authMiddleware, attachOwnerRestaurant, serviceAreaController.create);

router.get('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedServiceArea, serviceAreaController.getOne);
router.patch('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedServiceArea, serviceAreaController.update);
router.delete('/:id', authMiddleware, attachOwnerRestaurant, requireOwnedServiceArea, serviceAreaController.remove);

module.exports = router;
