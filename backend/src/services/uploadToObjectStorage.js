// uploadToObjectStorage — Task 1.5, extended by Task 1.6
//
// Higher-level upload service on top of the low-level Object Storage
// client from Task 0.12 (`../config/objectStorage.js`'s putObject /
// getObjectUrl, which handle OCI request signing etc). This is what
// route handlers will call once file-upload routes are wired (later
// Phase 1 tasks, e.g. 1.15/1.16) — hand it a file + a folder, get back a
// URL to store in one of the DB's `*_url` columns (foods.image_url,
// restaurants.logo_url/cover_url, registration_payments' screenshot,
// etc — see docs/DB_SCHEMA.md).
//
// Task 1.6 adds, on top of 1.5's validate-and-upload-as-is behavior:
//   - re-encoding the uploaded image through `sharp` (already a backend
//     dependency, used the same way in the Task 0.13/0.14 seed script) to
//     cap its longest dimension and recompress it, so a raw multi-MB phone
//     photo doesn't get stored (and later served) at full size/weight
//   - generating and uploading a separate, smaller thumbnail object
//     alongside the main one, for list/grid views (EntityCard, Popular
//     Foods grid, owner menu list, etc — Task 2.x/3.x/5.x) that don't need
//     full resolution
//
// Still deliberately NOT included here (a later Phase 1 task, not this
// one — see docs/ROADMAP.md):
//   - the multer middleware / route wiring that actually
//     produces the `file` object this function expects        -> 1.15/1.16

const crypto = require('crypto');
const sharp = require('sharp');

const { putObject, getObjectUrl } = require('../config/objectStorage');
const { badRequest } = require('../utils/errors');

// mimetype -> file extension for the generated object name. Deliberately
// NOT derived from the uploaded file's original filename — that's
// client-supplied and doesn't have to match the actual bytes (wrong or
// missing extension, path-y characters, etc) — so the extension always
// comes from this fixed mapping off the (separately validated) mimetype.
const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// This app only ever uploads images (logos, covers, food photos, payment
// screenshots — every `*_url`/screenshot column in docs/DB_SCHEMA.md), so
// that's the default allow-list; a caller can narrow it further (e.g. no
// gifs for a food photo) but not widen it past what has a known extension
// above, see the check at the bottom of uploadToObjectStorage().
const DEFAULT_ALLOWED_MIME_TYPES = Object.keys(EXTENSION_BY_MIME_TYPE);

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB — generous for a phone photo, still bounded

// Compression/thumbnail defaults (Task 1.6). Only apply to formats sharp
// can safely re-encode as a single static image — see the GIF note below.
const DEFAULT_MAX_DIMENSION = 2000; // px, longest side, after which we downscale
const DEFAULT_QUALITY = 80; // sharp's jpeg/webp "quality", and close enough in
// spirit for png's 0-100 "quality" (mapped to compressionLevel below)
const DEFAULT_GENERATE_THUMBNAIL = true;
const DEFAULT_THUMBNAIL_WIDTH = 320; // wide enough for any EntityCard/grid slot
// at current design-token sizes (Task 2.1 may want to revisit this once
// real tokens exist), small enough to be meaningfully lighter than the
// compressed main image
const DEFAULT_THUMBNAIL_QUALITY = 70; // a thumbnail is allowed to look a
// little softer than the main image in exchange for being smaller

// image/gif is deliberately excluded from compression/thumbnailing: sharp
// only operates on a single frame by default, so re-encoding an animated
// gif through it (for either the "compressed main image" or a thumbnail)
// would silently flatten the animation to its first frame — a surprising,
// hard-to-notice quality regression for whichever screen ends up showing
// it. Nothing in docs/DB_SCHEMA.md actually calls for animated images
// (logos/covers/food photos/payment screenshots are all naturally static),
// so gifs are just uploaded as-is, same as Task 1.5's behavior for every
// type before this task existed.
const COMPRESSIBLE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Re-encode `buffer` (already confirmed to be a COMPRESSIBLE_MIME_TYPES
 * type) through sharp: downscale to `maxDimension` on the longest side if
 * larger (never upscale — a small source image should stay that size, not
 * get padded/blurred up), then recompress at `quality` in its own format
 * (jpeg stays jpeg, png stays png, webp stays webp — this function never
 * changes the file's format/extension, so the object name built from the
 * original mimetype stays accurate).
 *
 * Metadata (EXIF/ICC etc) is deliberately stripped by not calling
 * `.withMetadata()` — sharp's default — since none of this app's images
 * need it preserved (no photographer-credit/orientation-sensitive use
 * case) and dropping it is itself part of what shrinks the file. `.rotate()`
 * is applied first specifically to “bake in” a photo's EXIF orientation
 * before that EXIF data gets stripped by the step after it — otherwise a
 * sideways phone photo would end up sideways for every viewer once the
 * orientation tag that today's browsers use to fix it up is gone.
 */
async function recompressImage(buffer, mimeType, { maxDimension, quality }) {
  let pipeline = sharp(buffer).rotate().resize({
    width: maxDimension,
    height: maxDimension,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (mimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (mimeType === 'image/webp') {
    pipeline = pipeline.webp({ quality });
  } else {
    // image/png — png has no direct "quality" knob the way jpeg/webp do;
    // map our 0-100 quality scale onto sharp's 0-9 compressionLevel
    // (higher = smaller/slower) plus palette quantization, which is
    // where png actually gets most of its size savings for logos/covers/
    // food photos (few flat color regions, not photographic noise).
    pipeline = pipeline.png({
      compressionLevel: 9,
      quality,
      palette: true,
    });
  }

  return pipeline.toBuffer();
}

/**
 * Build a small thumbnail from `buffer` (same compressible-type
 * restriction as recompressImage). Always resizes to `width` wide,
 * proportional height (`withoutEnlargement` here too — a source image
 * already narrower than the thumbnail width just gets recompressed at its
 * own size rather than upscaled).
 */
async function buildThumbnail(buffer, mimeType, { width, quality }) {
  let pipeline = sharp(buffer).rotate().resize({ width, withoutEnlargement: true });

  if (mimeType === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (mimeType === 'image/webp') {
    pipeline = pipeline.webp({ quality });
  } else {
    pipeline = pipeline.png({ compressionLevel: 9, quality, palette: true });
  }

  return pipeline.toBuffer();
}

// Inserts "-thumb" before the extension: "foods/123-abc.jpg" ->
// "foods/123-abc-thumb.jpg". Sharing the main object's base name (instead
// of a separately randomized one) is what lets a caller holding just the
// main `objectName` reconstruct the thumbnail's name later without having
// to have stashed it separately — same reasoning Task 1.5 used for
// returning `objectName` alongside `url` in the first place.
function thumbnailObjectNameFor(objectName) {
  const lastDot = objectName.lastIndexOf('.');
  return `${objectName.slice(0, lastDot)}-thumb${objectName.slice(lastDot)}`;
}

// `folder` becomes part of the object's path, so it's validated the same
// spirit as crudFactory's identifier checks (Task 1.1): plain path
// segments only, no leading/trailing slash, no "..". Also explicitly
// blocked from the "seed/" prefix, since Task 0.13/0.14's seed script
// already owns that prefix for its own (deterministic, non-random-named)
// objects — real uploads through this service should never collide with
// or overwrite seed data.
const SAFE_FOLDER = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

function assertSafeFolder(folder) {
  if (typeof folder !== 'string' || !SAFE_FOLDER.test(folder)) {
    throw new Error(
      `uploadToObjectStorage: invalid "folder" ("${folder}") — must be plain path segments ` +
        '(e.g. "foods" or "restaurants/logos"), no leading/trailing slash and no ".."'
    );
  }
  if (folder === 'seed' || folder.startsWith('seed/')) {
    throw new Error(
      'uploadToObjectStorage: "folder" must not be/start with "seed/" — that prefix is reserved ' +
        'for the seed script (Task 0.13/0.14)'
    );
  }
}

function randomSuffix() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Upload a file to Object Storage under `folder`, with a generated unique
 * name, and return its URL.
 *
 * @param {Object} file - a Multer-shaped file object: `{ buffer, mimetype }`
 *   at minimum (Multer's memoryStorage gives exactly this). `originalname`
 *   is intentionally never read — see EXTENSION_BY_MIME_TYPE above.
 * @param {string} folder - destination folder, e.g. "foods",
 *   "restaurants/logos", "restaurants/covers".
 * @param {Object} [options]
 * @param {string[]} [options.allowedMimeTypes] - defaults to
 *   DEFAULT_ALLOWED_MIME_TYPES (all image types this service knows an
 *   extension for). Pass a subset to narrow it for a specific upload
 *   (e.g. no gif for a logo); every entry must still be a key in
 *   EXTENSION_BY_MIME_TYPE, or construction fails loudly rather than
 *   silently producing an extension-less object name later.
 * @param {number} [options.maxBytes] - defaults to 10 MB.
 * @param {boolean} [options.compress] - defaults to `true`. Re-encode
 *   compressible images (jpeg/png/webp — see COMPRESSIBLE_MIME_TYPES)
 *   through sharp before upload: downscale to `maxDimension` and
 *   recompress at `quality`. Gifs are never compressed regardless of this
 *   flag (see the COMPRESSIBLE_MIME_TYPES comment above). Pass `false` to
 *   upload the original bytes untouched, same as all of Task 1.5's
 *   behavior — e.g. for a payment screenshot where a reviewer may want to
 *   zoom into exact pixels/text and any quality loss is unwelcome.
 * @param {number} [options.maxDimension] - defaults to 2000px. Longest
 *   side the *main* (non-thumbnail) image is downscaled to, if larger.
 * @param {number} [options.quality] - defaults to 80. Passed to sharp's
 *   jpeg/webp `quality` (and mapped onto png's `compressionLevel`) for the
 *   main image.
 * @param {boolean} [options.generateThumbnail] - defaults to `true`.
 *   Upload a second, smaller object alongside the main one. Same gif
 *   exclusion as `compress`. Pass `false` for images that are never shown
 *   in a list/grid context (e.g. a payment screenshot, which is only ever
 *   viewed full-size in the admin/owner order-detail `ImageViewer`).
 * @param {number} [options.thumbnailWidth] - defaults to 320px wide.
 * @param {number} [options.thumbnailQuality] - defaults to 70.
 * @returns {Promise<{ url: string, objectName: string, thumbnailUrl: (string|null), thumbnailObjectName: (string|null) }>}
 *   `url`/`objectName` as in Task 1.5. `thumbnailUrl`/`thumbnailObjectName`
 *   are `null` when no thumbnail was generated (gif, or
 *   `generateThumbnail: false`) rather than omitted, so callers can
 *   destructure without an `in`/`hasOwnProperty` check. As with
 *   `objectName`, `thumbnailObjectName` is returned (not just its URL) so
 *   a caller replacing an existing image later can delete both objects,
 *   not just the main one, via `../config/objectStorage`'s `deleteObject`.
 */
async function uploadToObjectStorage(file, folder, options = {}) {
  assertSafeFolder(folder);

  const allowedMimeTypes = options.allowedMimeTypes || DEFAULT_ALLOWED_MIME_TYPES;
  const unknownExtensionType = allowedMimeTypes.find((type) => !EXTENSION_BY_MIME_TYPE[type]);
  if (unknownExtensionType) {
    throw new Error(
      `uploadToObjectStorage: allowedMimeTypes includes "${unknownExtensionType}", which has no ` +
        'known extension in EXTENSION_BY_MIME_TYPE — add one there first'
    );
  }

  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
  const compress = options.compress !== false;
  const maxDimension = options.maxDimension || DEFAULT_MAX_DIMENSION;
  const quality = options.quality || DEFAULT_QUALITY;
  const generateThumbnail =
    options.generateThumbnail !== undefined ? options.generateThumbnail : DEFAULT_GENERATE_THUMBNAIL;
  const thumbnailWidth = options.thumbnailWidth || DEFAULT_THUMBNAIL_WIDTH;
  const thumbnailQuality = options.thumbnailQuality || DEFAULT_THUMBNAIL_QUALITY;

  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw badRequest('No file provided (expected a Multer-style { buffer, mimetype } object)');
  }
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw badRequest(
      `Unsupported file type "${file.mimetype}" — allowed: ${allowedMimeTypes.join(', ')}`
    );
  }
  if (file.buffer.length === 0) {
    throw badRequest('Uploaded file is empty');
  }
  if (file.buffer.length > maxBytes) {
    throw badRequest(`File too large (${file.buffer.length} bytes) — max ${maxBytes} bytes`);
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
  const canProcess = COMPRESSIBLE_MIME_TYPES.has(file.mimetype);

  let uploadBuffer = file.buffer;
  if (compress && canProcess) {
    try {
      uploadBuffer = await recompressImage(file.buffer, file.mimetype, { maxDimension, quality });
    } catch (err) {
      // A mimetype we trust (multer/browser-reported, checked above) but
      // bytes sharp can't actually decode — e.g. a renamed non-image file,
      // or a genuinely corrupt upload. Surface as a 400, not a 500: this
      // is a bad request, not a server fault, same as the other
      // file-shape checks above.
      throw badRequest(`Uploaded file could not be processed as a ${file.mimetype} image: ${err.message}`);
    }
  }

  // Date.now() prefix keeps objects roughly chronologically sortable/
  // debuggable when browsing the bucket by hand; the random suffix is
  // what actually guarantees uniqueness (two uploads in the same
  // millisecond must not collide).
  const objectName = `${folder}/${Date.now()}-${randomSuffix()}.${extension}`;

  await putObject(objectName, uploadBuffer, file.mimetype);

  let thumbnailUrl = null;
  let thumbnailObjectName = null;
  if (generateThumbnail && canProcess) {
    // Thumbnail built from the *original* buffer, not `uploadBuffer` —
    // re-deriving a small thumbnail from the already-downscaled main
    // image would work too, but starting from the source avoids
    // compounding two lossy re-encodes into one image when both are
    // enabled, at the cost of decoding the source twice. Uploads here are
    // infrequent, user-initiated actions (not a hot path), so that
    // trade-off favors quality.
    let thumbnailBuffer;
    try {
      thumbnailBuffer = await buildThumbnail(file.buffer, file.mimetype, {
        width: thumbnailWidth,
        quality: thumbnailQuality,
      });
    } catch (err) {
      throw badRequest(`Uploaded file could not be processed as a ${file.mimetype} image: ${err.message}`);
    }

    thumbnailObjectName = thumbnailObjectNameFor(objectName);
    await putObject(thumbnailObjectName, thumbnailBuffer, file.mimetype);
    thumbnailUrl = getObjectUrl(thumbnailObjectName);
  }

  return { url: getObjectUrl(objectName), objectName, thumbnailUrl, thumbnailObjectName };
}

module.exports = uploadToObjectStorage;
