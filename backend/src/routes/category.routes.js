// category.routes — global platform categories.
//
// Categories are shared across the platform.
// Authenticated users may read them.
// Only the Master Admin (role: admin) may create, update, or delete them.

const express = require('express');

const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');
const categoriesCrud = require('../models/categories');

const router = express.Router();

async function requireExistingCategory(req, res, next) {
  try {
    const rawId = req.params.id;
    const id = Number(rawId);

    if (rawId === undefined || !Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid or missing "id" route parameter' });
    }

    req.resource = await categoriesCrud.getOrThrow(id);
    next();
  } catch (err) {
    next(err);
  }
}

router.get(
  '/',
  authMiddleware,
  categoryController.list
);

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  categoryController.create
);

router.get(
  '/:id',
  authMiddleware,
  requireExistingCategory,
  categoryController.getOne
);

router.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  requireExistingCategory,
  categoryController.update
);

router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  requireExistingCategory,
  categoryController.remove
);

module.exports = router;
