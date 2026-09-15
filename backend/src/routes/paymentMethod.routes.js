// paymentMethod.routes — Task 1.16c
//
// Same chain as category.routes.js/serviceArea.routes.js (1.16a/b), with
// one deliberate difference: no `DELETE /:id` route at all. See
// controllers/paymentMethodController.js's header comment for the full
// reasoning (an un-guardable FK from orders.payment_method_id) —
// `is_active`, toggled via the same PATCH as every other field, is the
// only supported way to retire a payment method.

const express = require('express');

const paymentMethodController = require('../controllers/paymentMethodController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const ownershipMiddleware = require('../middleware/ownershipMiddleware');
const paymentMethodsCrud = require('../models/paymentMethods');

const router = express.Router();

const requireOwnedPaymentMethod = ownershipMiddleware(paymentMethodsCrud);

router.get('/', authMiddleware, attachOwnerRestaurant, paymentMethodController.list);
router.post('/', authMiddleware, attachOwnerRestaurant, paymentMethodController.create);

router.get(
  '/:id',
  authMiddleware,
  attachOwnerRestaurant,
  requireOwnedPaymentMethod,
  paymentMethodController.getOne
);
router.patch(
  '/:id',
  authMiddleware,
  attachOwnerRestaurant,
  requireOwnedPaymentMethod,
  paymentMethodController.update
);

module.exports = router;
