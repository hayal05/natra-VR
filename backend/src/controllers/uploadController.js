// uploadController — Task 3.14
//
// The first real *multipart* upload route in this codebase. Every
// `*_url` field wired so far (`foodController.js`'s `image_url`, see
// that file's own header comment) takes a plain string and leaves the
// actual `uploadToObjectStorage` (1.5/1.6) call as "still open — not
// this task's job." For a payment screenshot that deferral isn't
// possible: `docs/DB_SCHEMA.md`'s `orders.payment_screenshot_url` is
// `NOT NULL`, so *something* has to turn a customer's picked file into
// a real URL before Task 3.15's submit-order endpoint can accept it —
// this is that something.
//
// Deliberately its own route/controller rather than folded into a
// not-yet-existing `order.routes.js` (Task 3.15's job): a customer
// picks and uploads the screenshot on its own screen, one step before
// "submit order" exists at all, so this needs to work standalone.
// `order.routes.js`, once built, will accept `payment_screenshot_url`
// as a plain string the same way `foodController.js` already does for
// `image_url` — it never touches `req.file` itself.
//
// Public (no auth), same as every other customer-facing route since
// Task 3.3 — customers have no accounts.
//
// `compress: false, generateThumbnail: false` — per
// `uploadToObjectStorage`'s own doc comment, which names this exact
// case: a payment screenshot is "only ever viewed full-size in the
// admin/owner order-detail `ImageViewer`" and "a reviewer may want to
// zoom into exact pixels/text," so any quality loss from re-encoding is
// unwelcome and a thumbnail would never be shown anywhere.
//
// mimetype/size validation is deliberately NOT duplicated here (no
// multer `fileFilter`, no extra size check) — `uploadToObjectStorage`
// already throws a `badRequest` for both an unsupported mimetype and an
// oversized buffer, and the frontend's `ImageUploadField` already
// mirrors the same allow-list (see that component's own header
// comment). One allow-list, one size ceiling, both living in
// `uploadToObjectStorage`, is the existing convention this follows
// rather than re-inventing a second copy of either at the route layer.

const uploadToObjectStorage = require('../services/uploadToObjectStorage');
const { badRequest } = require('../utils/errors');

async function uploadPaymentScreenshot(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('No image file provided (expected multipart field "image")');
    }

    const { url } = await uploadToObjectStorage(req.file, 'payment-screenshots', {
      compress: false,
      generateThumbnail: false,
    });

    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
}

// uploadRestaurantLogo / uploadRestaurantCover — Task 5.3.
//
// Owner-authenticated (mounted behind `authMiddleware` →
// `attachOwnerRestaurant` in `upload.routes.js`, unlike
// `uploadPaymentScreenshot` above, which is public since customers have
// no accounts) — but, same split that screenshot upload already
// established for `orders.payment_screenshot_url`, this only turns a
// file into a URL. It does NOT write to the `restaurants` row itself;
// that's `restaurantController.js`'s `updateMe` (5.2, extended 5.3),
// which already accepts `logo_url`/`cover_url` as plain string fields.
// The frontend's `OwnerRestaurant.jsx` chains the two: upload here to
// get a URL, then `PATCH /me` with it.
//
// Left at `uploadToObjectStorage`'s defaults (`compress: true`,
// `generateThumbnail: true`) — unlike the payment screenshot, a
// logo/cover IS shown in list/grid contexts (`EntityCard`, the
// Restaurant Profile header) where the generated thumbnail/downscaled
// main image are exactly what's wanted, so there's no reason to
// override either default the way `uploadPaymentScreenshot` does.
//
// Two separate handlers/routes (`restaurant-logo` / `restaurant-cover`)
// rather than one with a `type` field: keeps each route's folder
// (`restaurants/logos` / `restaurants/covers` — the exact examples
// `uploadToObjectStorage`'s own header comment already names) a fixed
// constant instead of something a request body could steer, and needs
// no extra validation for what would otherwise be an arbitrary `type`
// string.
async function uploadRestaurantLogo(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('No image file provided (expected multipart field "image")');
    }

    const { url, thumbnailUrl } = await uploadToObjectStorage(req.file, 'restaurants/logos');

    res.status(201).json({ url, thumbnailUrl });
  } catch (err) {
    next(err);
  }
}

async function uploadRestaurantCover(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('No image file provided (expected multipart field "image")');
    }

    const { url, thumbnailUrl } = await uploadToObjectStorage(req.file, 'restaurants/covers');

    res.status(201).json({ url, thumbnailUrl });
  } catch (err) {
    next(err);
  }
}

// uploadFoodPhoto — Task 5.10. Same shape as uploadRestaurantLogo/Cover
// above: owner-authenticated, turns a file into a URL and nothing else.
// `foodController.js`'s `createFoodSchema`/`updateFoodSchema` have taken
// `image_url` as a plain string since 1.15e (that file's own header
// comment flagged the actual upload wiring as "still open — not this
// task's job"); this closes that gap the same way 5.3 closed it for
// `logo_url`/`cover_url` — the Add Food screen (5.10) chains this route
// then `POST /api/foods` with the returned url, exactly the two-step
// `OwnerRestaurant.jsx` `saveImage` already established for logo/cover.
//
// Left at `uploadToObjectStorage`'s defaults (`compress: true,
// generateThumbnail: true`), same reasoning as restaurant-logo/cover: a
// food photo IS shown in list/grid contexts (`EntityCard` on Home/
// RestaurantProfile, `OwnerMenu`'s own list) where a downscaled main
// image and thumbnail are exactly what's wanted — unlike the payment
// screenshot's `compress: false` case, which is only ever viewed
// full-size.
//
// Folder is `foods/photos` (plural "foods", matching the `foods` table
// name and the `restaurants/logos`/`restaurants/covers` naming shape
// those two routes already use) — a fixed constant, not something the
// request can steer.
async function uploadFoodPhoto(req, res, next) {
  try {
    if (!req.file) {
      throw badRequest('No image file provided (expected multipart field "image")');
    }

    const { url, thumbnailUrl } = await uploadToObjectStorage(req.file, 'foods/photos');

    res.status(201).json({ url, thumbnailUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadPaymentScreenshot,
  uploadRestaurantLogo,
  uploadRestaurantCover,
  uploadFoodPhoto,
};
