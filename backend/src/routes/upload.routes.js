// upload.routes — Task 3.14
//
// Mounted at `/api/uploads` in `app.js`. `multer`'s been a backend
// dependency since day one (`backend/package.json`) but nothing has
// ever actually wired it into a route — `uploadController.js`'s own
// header comment explains why this had to be the task that finally
// does. `memoryStorage` (not `diskStorage`) matches exactly what
// `uploadToObjectStorage` expects (a `{ buffer, mimetype }` file
// object, per that service's own JSDoc) and needs no cleanup step
// afterward, unlike a disk-backed temp file would.
//
// `limits.fileSize` is set generously above `uploadToObjectStorage`'s
// own 10 MB default max, not to relax that ceiling (the service still
// enforces its own 10 MB check and is the one whose error message the
// customer actually sees) but purely so an oversized upload gets
// `uploadToObjectStorage`'s clearer, already-written `badRequest`
// message instead of racing to see which check reports first.
//
// No `fileFilter` here — see `uploadController.js`'s header comment for
// why mimetype/size validation is left entirely to
// `uploadToObjectStorage`, the single existing source of truth for both,
// rather than a second copy of either living at this route layer.

const express = require('express');
const multer = require('multer');

const uploadController = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/authMiddleware');
const attachOwnerRestaurant = require('../middleware/attachOwnerRestaurant');
const { badRequest } = require('../utils/errors');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Multer's own errors (e.g. `LIMIT_FILE_SIZE`) are plain `MulterError`
// instances with no `.status`/`.publicMessage` — app.js's central error
// handler would otherwise fall back to a bare 500 for what's really a
// bad request. Wrapped by hand (rather than reached for
// `express-async-errors` or similar) since nothing else in this
// codebase pulls in an error-wrapping dependency for what a single
// `if` here handles just as well.
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(badRequest(err.message));
    }
    next(err);
  });
}

const router = express.Router();

router.post('/payment-screenshot', handleUpload, uploadController.uploadPaymentScreenshot);

// restaurant-logo / restaurant-cover (Task 5.3) — owner-authenticated,
// unlike the public payment-screenshot route above. `authMiddleware` →
// `attachOwnerRestaurant` run *before* `handleUpload` so an
// unauthenticated request (or an owner with no `restaurants` row yet —
// the standing gap flagged since 4.3) fails fast with 401/403 before
// this router spends any effort parsing a multipart body it's about to
// reject anyway.
router.post(
  '/restaurant-logo',
  authMiddleware,
  attachOwnerRestaurant,
  handleUpload,
  uploadController.uploadRestaurantLogo
);
router.post(
  '/restaurant-cover',
  authMiddleware,
  attachOwnerRestaurant,
  handleUpload,
  uploadController.uploadRestaurantCover
);

// food-photo (Task 5.10) — same owner-authenticated chain as
// restaurant-logo/cover above; see uploadController.js's own header
// comment for why this route only returns a URL rather than writing to
// `foods` itself (that's `POST /api/foods`'s `image_url` field, 1.15e).
router.post(
  '/food-photo',
  authMiddleware,
  attachOwnerRestaurant,
  handleUpload,
  uploadController.uploadFoodPhoto
);

module.exports = router;
