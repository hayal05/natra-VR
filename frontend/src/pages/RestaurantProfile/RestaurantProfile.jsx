import { useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import EntityCard from '../../components/EntityCard';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery } from '../../hooks';
import { buildImageSrcSet, MENU_LIST_CARD_SIZES } from '../../utils/entityCardImages';
import styles from './RestaurantProfile.module.css';

// Same reasoning as Home.jsx's own FALLBACK_IMAGE (Task 3.3) — a
// restaurant's `cover_url`/`logo_url` and a food's `image_url` are all
// nullable (docs/DB_SCHEMA.md), so nothing here should render a broken
// `<img>` before a photo's been uploaded. One shared placeholder for
// both the cover and menu-item images (Home.jsx itself reuses its own
// single `FALLBACK_IMAGE` the same way across restaurant/food cards) —
// not imported from Home.jsx, since that module doesn't export it and
// duplicating one small inline SVG constant is cheaper than a shared-
// constants file for a string used in two places so far.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

// A restaurant's own menu is shown in full on this screen (unlike Home's
// Popular Foods grid, which is deliberately a bounded preview via
// `POPULAR_FOODS_GRID_LIMIT`) — this is the dedicated place to browse
// everything a restaurant sells, not a homepage teaser, so the limit is
// generous rather than tight. The backend (`restaurantMenu.js`, Task
// 3.8) still builds real pagination `meta` behind this, same "worth it
// even though today's only caller asks for one bounded page" call
// `popularFoods.js` already made — this screen just doesn't need page
// controls yet at this size.
const MENU_LIST_LIMIT = 100;

// `foods.price` formatting — identical helper to Home.jsx's own
// `formatPrice` (Task 3.3), not imported since that module doesn't
// export it either; same "250 ETB" / "199.50 ETB" display convention.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

/**
 * RestaurantProfile — the Restaurant Profile screen: header (Task 3.7)
 * plus, as of this update, the menu list below it (Task 3.8).
 * `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant profile" section describes
 * exactly this: "Tapping a restaurant opens its profile with the menu
 * already visible below the profile header" — one screen, not two
 * separately-navigated ones, so both sections live in this same
 * component rather than the menu being a second route.
 *
 * Wrapped in `RoleShell role="customer"` (Task 2.17), same as every
 * other customer screen.
 *
 * **Header (Task 3.7)** — cover image, logo, name, Open/Closed status,
 * phone, location, description, service areas; see `RestaurantHeader`
 * below and its own Task 3.7 reasoning, unchanged by this update.
 *
 * **Menu (Task 3.8, this update)** — `docs/NATRA_MASTER_PROMPT.md`'s
 * "Restaurant menu" section: "a single-column list of larger food
 * cards: Large food image, Food name, Price, Buy Now" (plus: "Hidden
 * foods disappear from the customer menu and cannot be ordered").
 * Wired to the new public `GET /api/restaurants/:id/foods` (see
 * `backend/src/controllers/restaurantController.js`'s `getMenu` header
 * comment) via a second `useApiQuery` call, fetched independently of
 * the header's own restaurant-profile request rather than waiting on
 * it — the two are separate resources (`getMenu` re-derives the same
 * Live check itself rather than trusting the profile fetch already
 * did), so there's no reason one has to finish before the other starts.
 *
 * Each menu item reuses `EntityCard` (Task 2.3) — the same component
 * Home.jsx's Popular Foods grid and search results already use for a
 * food — rather than a new one-off card, with the same food-card slot
 * combination (`image`, `title`, `metaLine`=price, `cta`="Buy Now"),
 * just laid out one-per-row (`.menuList`, a plain vertical stack) in
 * place of `ResponsiveGrid`'s multi-column layout: `EntityCard` sizes
 * itself to its container's width, so a full-width single-column
 * container is what makes each card's image genuinely "large" here, no
 * new large-card component needed. No `subtitle` (the restaurant name)
 * — redundant on a screen that's already scoped to this one restaurant,
 * unlike Home's grid which mixes foods from many restaurants together.
 * `cta` is still a plain styled span, not a separate button — but as of
 * Task 3.9 (Food Details), the whole card (including the cta) is a real
 * clickable/keyboard-activatable link via `onClick`, the same `goToFood`
 * pattern Home.jsx's own Popular Foods grid and search results now use.
 *
 * Loading/error/empty states for the menu section reuse the same
 * `EmptyState` shell Home.jsx's own sections use, with menu-specific
 * copy — an empty menu ("no visible foods yet") is a normal, expected
 * state for a brand-new restaurant, not an error.
 *
 * **"Add another item" (Task 3.11)** — Order Builder's own "Add another
 * item" button (`frontend/src/pages/OrderBuilder`) navigates here with
 * `state: { addingToOrder: true }`, always against `cart.restaurantId`
 * (never a different restaurant's id) — that URL is the actual
 * same-restaurant enforcement, not anything this screen checks. This
 * screen just reads the flag to show a small banner confirming what's
 * happening ("Adding to your current order"), and forwards it on to
 * Food Details via `goToFood`'s own navigation `state` so that screen
 * can skip its different-restaurant confirm check (see its own doc
 * comment) for a trip that's already guaranteed to be the same
 * restaurant.
 */
export default function RestaurantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const addingToOrder = Boolean(location.state?.addingToOrder);

  // Task 3.9 built the Food Details screen this navigates to
  // (`frontend/src/pages/FoodDetails`) — same reasoning Home.jsx's own
  // `goToFood` doc comment gives: before that task, this menu's food
  // cards had no real destination to link to. Forwards `addingToOrder`
  // along (Task 3.11) so Food Details knows this trip started from
  // "Add another item" against this exact restaurant.
  const goToFood = useCallback(
    (foodId) => navigate(`/food/${foodId}`, { state: { addingToOrder } }),
    [navigate, addingToOrder]
  );

  const fetchProfile = useCallback(
    (signal) => api.get(`/restaurants/${id}`, { signal, auth: false }),
    [id]
  );
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApiQuery(fetchProfile, [id]);

  const fetchMenu = useCallback(
    (signal) =>
      api
        .get(`/restaurants/${id}/foods?limit=${MENU_LIST_LIMIT}`, { signal, auth: false })
        .then((data) => data.foods),
    [id]
  );
  const {
    data: menuFoods,
    loading: menuLoading,
    error: menuError,
    refetch: refetchMenu,
  } = useApiQuery(fetchMenu, [id]);

  const notFound = profileError instanceof ApiError && profileError.status === 404;

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        {profileError ? (
          <EmptyState
            title={notFound ? 'Restaurant not found' : "Couldn't load this restaurant"}
            description={
              notFound
                ? "This restaurant isn't available right now."
                : 'Check your connection and try again.'
            }
            action={
              notFound ? undefined : (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={refetchProfile}
                >
                  Retry
                </button>
              )
            }
          />
        ) : profileLoading || !profileData ? (
          <p className={styles.status}>Loading restaurant…</p>
        ) : (
          <>
            <RestaurantHeader
              restaurant={profileData.restaurant}
              serviceAreas={profileData.service_areas}
            />

            <div className={styles.menuSection}>
              <h2 className={styles.menuHeading}>Menu</h2>

              {addingToOrder && (
                <p className={styles.addingToOrderBanner}>
                  Adding to your current order — pick another food from this
                  restaurant's menu.
                </p>
              )}

              {menuError ? (
                <EmptyState
                  title="Couldn't load the menu"
                  description="Check your connection and try again."
                  action={
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={refetchMenu}
                    >
                      Retry
                    </button>
                  }
                />
              ) : menuLoading || !menuFoods ? (
                <p className={styles.status}>Loading menu…</p>
              ) : menuFoods.length === 0 ? (
                <EmptyState
                  title="No foods yet"
                  description="This restaurant hasn't added any visible foods yet."
                />
              ) : (
                <div className={styles.menuList}>
                  {menuFoods.map((food) => (
                    <EntityCard
                      key={food.id}
                      image={food.image_url || FALLBACK_IMAGE}
                      imageAlt={food.name}
                      imageSrcSet={buildImageSrcSet(food.image_url, food.image_thumbnail_url)}
                      imageSizes={MENU_LIST_CARD_SIZES}
                      title={food.name}
                      metaLine={formatPrice(food.price)}
                      cta={<span className={styles.buyNowCta}>Buy Now</span>}
                      onClick={() => goToFood(food.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RoleShell>
  );
}

function RestaurantHeader({ restaurant, serviceAreas }) {
  return (
    <>
      <div className={styles.coverWrap}>
        <img
          className={styles.cover}
          src={restaurant.cover_url || FALLBACK_IMAGE}
          alt={restaurant.name}
        />
        {/* Task 8.1b — `.coverInner` is new: an absolutely-positioned,
            max-width/centered box the same width as `.info`/
            `.menuSection` below, that the logo positions itself against
            instead of against `.coverWrap` directly. Without it, the
            logo's `left: var(--space-lg)` below would stay pinned to the
            actual screen edge on a wide viewport while `.info`'s own
            content recentres inward — the two would visibly stop lining
            up past 640px. See `.coverInner`'s own CSS comment for why
            640px specifically. */}
        <div className={styles.coverInner}>
          {restaurant.logo_url && (
            <img className={styles.logo} src={restaurant.logo_url} alt="" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{restaurant.name}</h1>
          <StatusBadge status={restaurant.is_open ? 'Open' : 'Closed'} />
        </div>

        <a className={styles.detailLine} href={`tel:${restaurant.phone}`}>
          {restaurant.phone}
        </a>

        {restaurant.location_text && (
          <p className={styles.detailLine}>{restaurant.location_text}</p>
        )}

        {restaurant.description && (
          <p className={styles.description}>{restaurant.description}</p>
        )}

        {serviceAreas.length > 0 && (
          <div className={styles.serviceAreas}>
            <h2 className={styles.serviceAreasHeading}>Service areas</h2>
            <div className={styles.chipRow}>
              {serviceAreas.map((area) => (
                <span key={area.id} className={styles.chip}>
                  {area.area_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

