// entityCardImages — Task 8.4c-ii
//
// Builds the `imageSrcSet`/`logoSrcSet` string EntityCard's new (Task
// 8.4c-i) passthrough props expect, from a `{ url, thumbnailUrl }`-shaped
// pair — `restaurants.cover_url`/`cover_thumbnail_url`,
// `restaurants.logo_url`/`logo_thumbnail_url`, `foods.image_url`/
// `image_thumbnail_url` (migration 0012; see that migration's own header
// comment for why the thumbnail column exists at all — it's the
// `uploadToObjectStorage`/Task 1.6 thumbnail that was previously
// generated on every upload but never persisted).
//
// The two width descriptors below are NOT arbitrary/estimated — they're
// `uploadToObjectStorage`'s own DEFAULT_THUMBNAIL_WIDTH and
// DEFAULT_MAX_DIMENSION (backend/src/services/uploadToObjectStorage.js),
// i.e. the actual caps that pipeline resizes to. A real uploaded image is
// often narrower than its cap (`withoutEnlargement: true` on both sharp
// resizes there), so these are upper bounds, not exact per-image widths —
// same simplification `sizes` itself already trades in (a caller's
// `sizes` value is also an approximation of real rendered width, not
// pixel-exact), not something worth a network round trip per image to
// avoid.
const THUMBNAIL_WIDTH_DESCRIPTOR = '320w';
const MAIN_WIDTH_DESCRIPTOR = '2000w';

/**
 * @param {string|null|undefined} mainUrl - e.g. restaurant.cover_url
 * @param {string|null|undefined} thumbnailUrl - e.g. restaurant.cover_thumbnail_url
 * @returns {string|undefined} a `srcSet` value, or `undefined` when there's
 *   nothing to offer beyond the plain `src` EntityCard already falls back
 *   to — no thumbnail (older row, saved before migration 0012; a gif,
 *   which `uploadToObjectStorage` never thumbnails at all — see that
 *   service's own COMPRESSIBLE_MIME_TYPES comment) or no main image at
 *   all (nothing uploaded yet, `FALLBACK_IMAGE` in play at each call site
 *   instead). `undefined` rather than a one-candidate `srcSet` string:
 *   EntityCard passes this straight to the `<img>`'s own `srcSet`, and a
 *   single-candidate `srcSet` is redundant with `src` anyway.
 */
export function buildImageSrcSet(mainUrl, thumbnailUrl) {
  if (!mainUrl || !thumbnailUrl || mainUrl === thumbnailUrl) return undefined;
  return `${thumbnailUrl} ${THUMBNAIL_WIDTH_DESCRIPTOR}, ${mainUrl} ${MAIN_WIDTH_DESCRIPTOR}`;
}

// --- `sizes` values, one per distinct EntityCard layout context ---
// Each is derived from that context's own CSS, not guessed — see each
// comment for the source. `sizes` is itself always an approximation of
// real rendered width (ignoring row/column gaps and container padding is
// standard practice for this attribute), so these don't need to be
// pixel-exact, just in the right ballpark per breakpoint.

// `HorizontalScroller`'s Restaurants row — every caller passes a fixed
// `itemWidth="220px"` regardless of viewport (Home.jsx x2, RestaurantProfile
// doesn't use this one), so the card's rendered width never varies.
export const SCROLLER_CARD_SIZES = '220px';

// `ResponsiveGrid`'s Popular Foods / search-results-foods grid — that
// component's own 2/3/4/5-column, 768/1024/1280px breakpoints (Task 2.7),
// capped by Home.module.css's own 1280px page max-width at the xl tier
// (5 columns of a 1280px-wide page ≈ 256px each; below that tier the page
// is effectively full-viewport width, so `vw` tracks it directly).
export const POPULAR_FOODS_GRID_SIZES =
  '(min-width: 1280px) 256px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

// RestaurantProfile's single-column menu list — capped at 640px
// (RestaurantProfile.module.css's own `.menuSection`), full-viewport-width
// below that.
export const MENU_LIST_CARD_SIZES = '(min-width: 640px) 640px, 100vw';

// The circular restaurant logo overlay — fixed 40x40px at every
// breakpoint (EntityCard.module.css's own `.logo`), never grid/scroller-
// dependent like the three above.
export const LOGO_SIZES = '40px';
