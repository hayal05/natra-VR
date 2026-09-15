import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import EntityCard from '../../components/EntityCard';
import FilterBar from '../../components/FilterBar';
import HorizontalScroller from '../../components/HorizontalScroller';
import ResponsiveGrid from '../../components/ResponsiveGrid';
import RoleShell from '../../components/RoleShell';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useDebouncedValue } from '../../hooks';
import {
  buildImageSrcSet,
  POPULAR_FOODS_GRID_SIZES,
  SCROLLER_CARD_SIZES,
  LOGO_SIZES,
} from '../../utils/entityCardImages';
import styles from './Home.module.css';

// Task 3.6's own debounce window — see useDebouncedValue's doc comment
// for why 300-ish ms rather than firing a request on every keystroke.
const SEARCH_DEBOUNCE_MS = 350;

// The "browse everything" chip FilterBar's own `value`/`onChange` shape
// (Task 2.14) needs a real value distinct from any actual category name —
// `''` (rather than `null`/`undefined`) so it round-trips cleanly through
// a controlled <select>-style comparison (`option.value === group.value`)
// with no special-casing.
const ALL_CATEGORIES_VALUE = '';

// A restaurant's `cover_url`/`logo_url` are both nullable
// (docs/DB_SCHEMA.md's `restaurants` table) — a restaurant that's Live
// but hasn't uploaded a cover/logo yet (nothing in the Phase 4/5 owner
// flow requires one at Live-request time) shouldn't render a broken
// `<img>`. A flat inline SVG placeholder, same "no external image host"
// reasoning `ComponentSandbox`'s own `placeholderImage` helper used for
// mock data (Task 2.21) — not shared with that file since this one only
// ever needs a single neutral fallback, not per-mock-row colors/labels.
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
      '<rect width="100%" height="100%" fill="#e6e9ed"/>' +
      '</svg>'
  );

const RESTAURANTS_ROW_LIMIT = 12;

// Same reasoning as RESTAURANTS_ROW_LIMIT: the Home screen's grid wants
// one bounded page's worth of foods, not full page-by-page navigation
// (that's ListWithPagination's job elsewhere — 5.12/6.4/6.9) — the
// backend endpoint itself is still built on `paginate()` (same as
// `/api/restaurants`) for a real `meta`/total-count story, this page
// just doesn't consume it yet.
const POPULAR_FOODS_GRID_LIMIT = 12;

// A food's `image_url` (docs/DB_SCHEMA.md's `foods` table) is nullable
// until a photo is uploaded, same as a restaurant's `cover_url`/
// `logo_url` — FALLBACK_IMAGE above is reused as-is for a food card's
// image slot rather than defining a second, near-identical placeholder.

/**
 * Home — the customer home screen. Task 3.2 built the header + search
 * bar (static layout, no logic); Task 3.3 wired the first real data
 * section (Restaurants row) to the actual backend; Task 3.4 (this
 * update) wires the Categories chip row the same way.
 * Wrapped in `RoleShell role="customer"`
 * (Task 2.17) so the bottom nav/content-clearance padding come for free,
 * the same way every future customer screen will use it.
 *
 * Structure follows `docs/NATRA_MASTER_PROMPT.md`'s "Customer home UI"
 * section item 1 ("NATRA header and search") and the actual reference
 * image (`docs/reference_ui/1000065033.jpg`): an orange header block
 * holding the brand row, with the search bar sitting inside that same
 * block rather than below it on the white page background — this is
 * exactly the placement `SearchBar`'s `onPrimary` variant (added by
 * Task 2.22's visual QA pass) was measured and built for, and its first
 * real usage outside the component sandbox.
 *
 * **Search bar (Task 3.2 built it decorative-only; Task 3.6, this
 * update, wires it for real)** — see this component's own "Search"
 * section further down for the full Task 3.6 writeup (search-as-you-type
 * via a debounced `onChange`, not `onSubmit`; what it searches; and how
 * it replaces the browse sections below while active).
 *
 * **Notification bell**: the reference image's header shows a bell icon
 * next to the brand name. Kept here as a visual-match, but rendered as a
 * plain, non-interactive (`aria-hidden`, no `onClick`) glyph rather than
 * a real button — `docs/NATRA_MASTER_PROMPT.md`'s "Customer" section is
 * explicit that customers have no accounts, and nothing in `docs/DB_SCHEMA.md`
 * gives a customer-facing notifications table or feed for a bell to open
 * (the `notifications` table, migration 0010, is scoped to "owner/admin
 * notifications only" per its own migration comment). Making it a live
 * control now would mean inventing a feature the spec doesn't describe;
 * flagged here rather than silently wired to nothing or silently dropped
 * from the layout it's visually part of.
 *
 * **Restaurants row (Task 3.3, this update)** — the first real section
 * below the header, wired to `GET /api/restaurants` (new this task —
 * see `backend/src/controllers/restaurantController.js`'s header comment
 * for why it's the first genuinely public endpoint in the codebase) via
 * Task 3.1's `useApiQuery`, not `usePaginatedQuery`: this is a swipeable
 * `HorizontalScroller` row, not a `ListWithPagination` screen with
 * page controls, so it just wants "one page's worth of Live restaurants"
 * (`RESTAURANTS_ROW_LIMIT`), not `page`/`setPage` state. `auth: false` is
 * passed explicitly on the request even though it's already the
 * effective behavior for a customer with no stored token (customers
 * never log in — `docs/DB_SCHEMA.md`) — this is a public endpoint by
 * design, not one that merely happens to work token-less right now.
 *
 * Each restaurant renders through `EntityCard`'s restaurant-card slot
 * combination (Task 2.3): `image`=`cover_url`, `logo`=`logo_url` (both
 * falling back to `FALLBACK_IMAGE` above when null), `badge`=a
 * `StatusBadge` keyed off `is_open` — **not** `live_status`: every
 * restaurant this endpoint returns is already Live by construction (the
 * backend's own `LIVE_FILTER`), so the only status left worth showing a
 * customer is Open/Closed, exactly the reference UI's own badge
 * vocabulary (`docs/reference_ui/560d4168-...png`) — and `metaLine`=
 * `location_text`. No distance figure (unlike `ComponentSandbox`'s own
 * "Bole • 1.2 km"-style mock data) — `docs/NATRA_MASTER_PROMPT.md`/
 * `DB_SCHEMA.md` are explicit this app has no GPS, so `location_text` is
 * free text with nothing to compute a real distance from.
 *
 * Loading/error/empty states use the same `EmptyState` shell (Task 2.8)
 * with different copy/action rather than three different components —
 * an error state's action is `refetch` (`useApiQuery`'s own manual-retry
 * escape hatch, meant for exactly this).
 *
 * **Categories chips (Task 3.4, this update)** — wired to the new
 * `GET /api/categories/live` (see
 * `backend/src/controllers/customerCategoryController.js`'s header
 * comment for why this needed its own new public endpoint rather than
 * reusing the existing owner-scoped `/api/categories`, Task 1.16a).
 * Rendered via `FilterBar` (Task 2.14) as a single chip group — an
 * always-present leading "All" chip (`ALL_CATEGORIES_VALUE`, not itself
 * a category returned by the API) plus one chip per distinct category
 * name aggregated across every Live restaurant. Uses `useApiQuery`
 * (Task 3.1), same reasoning as the Restaurants row: this is one
 * unpaged list feeding a horizontally-scrolling chip row, not a
 * `ListWithPagination` screen.
 *
 * `selectedCategory` is real `useState`, and the active chip does
 * visually reflect it (`FilterBar`'s own controlled `value`/`onChange`),
 * but **selecting a chip still doesn't filter anything** — Task 3.6
 * (search) deliberately left this open rather than resolving it (see
 * this component's own "Search" section below for why), so it remains a
 * real follow-up rather than something this task silently decided.
 * `EmptyState` is deliberately not used for a
 * categories-loading error (unlike the Restaurants row) — a chip row
 * failing to load doesn't block the rest of the page from being usable
 * the way a restaurant list failing does, so it degrades to a small
 * inline status line/retry instead of the row's usual space.
 *
 * **Popular Foods grid (Task 3.5, this update)** — the third and last
 * Home-screen section (`docs/NATRA_MASTER_PROMPT.md`'s own list:
 * Restaurants → Categories → Popular Foods), wired to the new
 * `GET /api/foods/popular` (see
 * `backend/src/services/popularFoods.js`'s header comment for the full
 * reasoning) via `useApiQuery`, same "one bounded page, no page
 * controls" reasoning as the Restaurants row
 * (`POPULAR_FOODS_GRID_LIMIT`, not `usePaginatedQuery`). Rendered
 * through `ResponsiveGrid` (Task 2.7) with each food in `EntityCard`'s
 * food-card slot combination (Task 2.3): `image`=`image_url` (falling
 * back to `FALLBACK_IMAGE`), `title`=`name`, `subtitle`=
 * `restaurant_name`, `metaLine`=a formatted `price` (`"250 ETB"`, same
 * display convention `ComponentSandbox`'s own mock food data already
 * uses), and `cta`="Order Now" (still a plain styled span, not a
 * separate button — see `goToFood` below: as of Task 3.9, the whole
 * card, cta included, is a real clickable/keyboard-activatable link to
 * Food Details, since that screen now exists to link to).
 *
 * The ranking itself is a backend-side placeholder (alphabetical by food
 * name), not real popularity — `docs/NATRA_MASTER_PROMPT.md` calls for
 * ranking "by actual completed sales/order volume," which is Task 7.2's
 * job and doesn't exist yet; see `popularFoods.js`'s own header comment
 * for the full reasoning, which this page inherits without re-deciding.
 * Selecting a category chip above still doesn't filter this grid —
 * Task 3.6 (search) deliberately left that composition open rather than
 * resolving it (see this component's own "Search" section below), so
 * it's still a real follow-up, not a silently-decided behavior.
 *
 * Loading/error/empty states reuse `EmptyState` the same way the
 * Restaurants row's do, for the same reasoning (a shared shell with
 * different copy/action, not three bespoke components).
 *
 * **Search (Task 3.6, this update)** — `SearchBar`'s two open questions
 * (its own doc comment, and `docs/PROJECT_STATUS.md`'s "Next: 3.6" note)
 * are resolved here:
 *
 *   - **search-as-you-type, via `onChange`** — not `onSubmit`. A food-
 *     marketplace search bar is exactly the case `useDebouncedValue`
 *     (Task 3.6) exists for: the raw keystroke-by-keystroke `searchValue`
 *     stays local `useState` (unchanged since Task 3.2) so the input
 *     itself never feels laggy, but the value actually handed to
 *     `useApiQuery`'s `deps` is `debouncedSearch` — so a fast typist
 *     doesn't fire one request per character. `onSubmit` is left
 *     unwired; nothing about this task needs an Enter-to-search path
 *     once typing itself already searches.
 *   - **what it searches**: both foods and restaurants by name, via the
 *     new `GET /api/search?q=` (see `backend/src/services/search.js`'s
 *     header comment for the full reasoning, including why "drinks" in
 *     the placeholder text isn't a third thing to search).
 *
 * While `isSearching` (a non-blank trimmed query), the Restaurants row,
 * Categories chips, and Popular Foods grid are all replaced by a single
 * "Search results" section — not layered alongside them. Nothing on this
 * screen defines what a search term composing with an already-selected
 * category chip would even mean (3.4's own doc comment already flagged
 * that composition as an open question this task isn't the one deciding
 * either), and showing all four sections' worth of loading/error states
 * at once for a single search box would be a confusing screen, not a
 * more complete one. Clearing the search box (the existing `SearchBar`
 * clear button, unchanged since Task 2.13) returns to the normal browse
 * view once the debounce catches up.
 *
 * Search results reuse the exact same `EntityCard` slot shapes the
 * Restaurants row and Popular Foods grid already established (same
 * `FALLBACK_IMAGE`/`formatPrice` helpers) — a search result card should
 * look like the card it's a search hit *for*, not a third visual style.
 * A combined empty state (no foods and no restaurants matched) uses the
 * same `EmptyState` shell as everywhere else on this screen.
 */
export default function Home() {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSearching = trimmedSearch.length > 0;
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);

  const fetchLiveCategories = useCallback(
    (signal) =>
      api
        .get('/categories/live', { signal, auth: false })
        .then((data) => data.categories.map((category) => category.name)),
    []
  );
  const {
    data: categoryNames,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useApiQuery(fetchLiveCategories, []);

  const fetchRestaurants = useCallback(
    (signal) =>
      api
        .get(`/restaurants?limit=${RESTAURANTS_ROW_LIMIT}`, { signal, auth: false })
        .then((data) => data.restaurants),
    []
  );
  const {
    data: restaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useApiQuery(fetchRestaurants, []);

  const fetchPopularFoods = useCallback(
    (signal) =>
      api
        .get(`/foods/popular?limit=${POPULAR_FOODS_GRID_LIMIT}`, { signal, auth: false })
        .then((data) => data.foods),
    []
  );
  const {
    data: popularFoods,
    loading: popularFoodsLoading,
    error: popularFoodsError,
    refetch: refetchPopularFoods,
  } = useApiQuery(fetchPopularFoods, []);

  // Only actually hits the network once there's a non-blank debounced
  // query — resolving with `null` otherwise (rather than skipping the
  // hook call entirely) keeps `useApiQuery`'s own out-of-order-response
  // guard in charge of every request this screen makes, same as the
  // three fetches above, instead of this screen managing a second,
  // parallel "should I even fetch" concern by hand.
  const fetchSearchResults = useCallback(
    (signal) => {
      if (!isSearching) return Promise.resolve(null);
      return api.get(`/search?q=${encodeURIComponent(trimmedSearch)}`, { signal, auth: false });
    },
    [isSearching, trimmedSearch]
  );
  const {
    data: searchResults,
    loading: searchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useApiQuery(fetchSearchResults, [trimmedSearch]);

  const navigate = useNavigate();
  // Task 3.7 built the Restaurant Profile screen this navigates to
  // (`frontend/src/pages/RestaurantProfile`) — before that task, neither
  // restaurant card here had a real `onClick` (EntityCard's `onClick`
  // slot, Task 2.3, was simply left unfilled), since wiring navigation
  // to a screen that didn't exist yet would've meant guessing its route
  // shape early. Now that it exists, both places a restaurant card
  // renders (the browse-view row and the search-results row below) get
  // the same handler.
  const goToRestaurant = useCallback(
    (restaurantId) => navigate(`/restaurant/${restaurantId}`),
    [navigate]
  );

  // Task 3.9 built the Food Details screen this navigates to
  // (`frontend/src/pages/FoodDetails`) — before that task, neither food
  // card here had a real destination (EntityCard's `onClick`, Task 2.3,
  // was left unfilled and `cta` was a plain inert `<span>`), for the same
  // "don't guess a route that doesn't exist yet" reasoning `goToRestaurant`
  // above already explains for Task 3.7. Now that it exists, every place
  // a food card renders (the Popular Foods grid and the search-results
  // grid below) gets the same handler, on both the card itself and its
  // "Order Now" cta.
  const goToFood = useCallback((foodId) => navigate(`/food/${foodId}`), [navigate]);

  return (
    <RoleShell role="customer">
      <header className={styles.header}>
        {/* Task 8.1a — `.headerInner` is new: it's what actually gets
            the max-width/centering treatment, so `.header` itself can
            stay a full-bleed colored block behind it at every width
            instead of the orange background also getting capped and
            leaving bare page-background on either side of it on a wide
            screen. See Home.module.css's own comment on `.headerInner`
            for the max-width value's reasoning. */}
        <div className={styles.headerInner}>
          <div className={styles.brandRow}>
            {/* Task 8.7g — the circular "N" logo mark that used to sit
                to the left of the "NATRA" wordmark is removed; this is
                now just the wordmark on its own, so `.brand` no longer
                needs to be a multi-child flex row (see Home.module.css's
                own comment on `.brand`/`.brandName` for the repositioning
                that went with removing it). */}
            <span className={styles.brandName}>NATRA</span>

            <div className={styles.headerActions}>
              {/* Task 8.7h — "Sign up" button, positioned left of the
                  bell icon. Customers themselves have no accounts to
                  sign up for (docs/NATRA_MASTER_PROMPT.md is explicit on
                  that), so this routes to `/owner/register` (Task 4.1's
                  Owner Registration screen, already wired in App.jsx) —
                  the one actual signup flow this app has. Styled as
                  plain white text on the orange header
                  (`.signUpButton`, below) rather than a filled/bordered
                  button, so it reads as a header action alongside the
                  bell icon rather than competing with `SearchBar`'s own
                  primary-looking chrome right below it. Grouped with
                  `BellIcon` in its own `.headerActions` flex row (rather
                  than left as `.brandRow`'s third child) so
                  `.brandRow`'s `space-between` still puts exactly one
                  gap — between the wordmark and this group — instead of
                  spreading three items out evenly and stranding "Sign
                  up" in the middle, away from the icon it's meant to
                  sit next to. */}
              <button
                type="button"
                className={styles.signUpButton}
                onClick={() => navigate('/owner/register')}
              >
                Sign up
              </button>

              <BellIcon className={styles.bellIcon} aria-hidden="true" />
            </div>
          </div>

          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            variant="onPrimary"
          />
        </div>
      </header>

      <div className={styles.body}>
        {isSearching ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Search results</h2>

            {searchError ? (
              <EmptyState
                title="Couldn't search"
                description="Check your connection and try again."
                action={
                  <button type="button" className={styles.retryButton} onClick={refetchSearch}>
                    Retry
                  </button>
                }
              />
            ) : searchLoading || !searchResults ? (
              <p className={styles.sectionStatus}>Searching…</p>
            ) : searchResults.restaurants.length === 0 && searchResults.foods.length === 0 ? (
              <EmptyState
                title="No results"
                description={`Nothing matched "${trimmedSearch}". Try a different search.`}
              />
            ) : (
              <>
                {searchResults.restaurants.length > 0 && (
                  <div className={styles.searchSubsection}>
                    <h3 className={styles.searchSubheading}>Restaurants</h3>
                    <HorizontalScroller
                      itemWidth="220px"
                      ariaLabel="Restaurants matching your search"
                      className={styles.restaurantsScroller}
                    >
                      {searchResults.restaurants.map((restaurant) => (
                        <EntityCard
                          key={restaurant.id}
                          image={restaurant.cover_url || FALLBACK_IMAGE}
                          imageAlt={restaurant.name}
                          imageSrcSet={buildImageSrcSet(
                            restaurant.cover_url,
                            restaurant.cover_thumbnail_url
                          )}
                          imageSizes={SCROLLER_CARD_SIZES}
                          logo={restaurant.logo_url || undefined}
                          logoAlt={restaurant.name}
                          logoSrcSet={buildImageSrcSet(
                            restaurant.logo_url,
                            restaurant.logo_thumbnail_url
                          )}
                          logoSizes={LOGO_SIZES}
                          title={restaurant.name}
                          badge={<StatusBadge status={restaurant.is_open ? 'Open' : 'Closed'} />}
                          metaLine={restaurant.location_text}
                          onClick={() => goToRestaurant(restaurant.id)}
                        />
                      ))}
                    </HorizontalScroller>
                  </div>
                )}

                {searchResults.foods.length > 0 && (
                  <div className={styles.searchSubsection}>
                    <h3 className={styles.searchSubheading}>Foods</h3>
                    <ResponsiveGrid
                      ariaLabel="Foods matching your search"
                      className={styles.popularFoodsGrid}
                    >
                      {searchResults.foods.map((food) => (
                        <EntityCard
                          key={food.id}
                          image={food.image_url || FALLBACK_IMAGE}
                          imageAlt={food.name}
                          imageSrcSet={buildImageSrcSet(food.image_url, food.image_thumbnail_url)}
                          imageSizes={POPULAR_FOODS_GRID_SIZES}
                          title={food.name}
                          subtitle={food.restaurant_name}
                          metaLine={formatPrice(food.price)}
                          cta={<span className={styles.orderNowCta}>Order Now</span>}
                          onClick={() => goToFood(food.id)}
                        />
                      ))}
                    </ResponsiveGrid>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Restaurants</h2>

              {restaurantsError ? (
                <EmptyState
                  title="Couldn't load restaurants"
                  description="Check your connection and try again."
                  action={
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={refetchRestaurants}
                    >
                      Retry
                    </button>
                  }
                />
              ) : restaurantsLoading ? (
                <p className={styles.sectionStatus}>Loading restaurants…</p>
              ) : restaurants.length === 0 ? (
                <EmptyState
                  title="No restaurants yet"
                  description="Check back soon — new restaurants go live all the time."
                />
              ) : (
                <HorizontalScroller
                  itemWidth="220px"
                  ariaLabel="Restaurants"
                  className={styles.restaurantsScroller}
                >
                  {restaurants.map((restaurant) => (
                    <EntityCard
                      key={restaurant.id}
                      image={restaurant.cover_url || FALLBACK_IMAGE}
                      imageAlt={restaurant.name}
                      imageSrcSet={buildImageSrcSet(
                        restaurant.cover_url,
                        restaurant.cover_thumbnail_url
                      )}
                      imageSizes={SCROLLER_CARD_SIZES}
                      logo={restaurant.logo_url || undefined}
                      logoAlt={restaurant.name}
                      logoSrcSet={buildImageSrcSet(
                        restaurant.logo_url,
                        restaurant.logo_thumbnail_url
                      )}
                      logoSizes={LOGO_SIZES}
                      title={restaurant.name}
                      badge={<StatusBadge status={restaurant.is_open ? 'Open' : 'Closed'} />}
                      metaLine={restaurant.location_text}
                      onClick={() => goToRestaurant(restaurant.id)}
                    />
                  ))}
                </HorizontalScroller>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Categories</h2>

              {categoriesError ? (
                <div className={styles.categoriesError}>
                  <span className={styles.sectionStatus}>Couldn't load categories.</span>
                  <button
                    type="button"
                    className={styles.retryButtonInline}
                    onClick={refetchCategories}
                  >
                    Retry
                  </button>
                </div>
              ) : categoriesLoading ? (
                <p className={styles.sectionStatus}>Loading categories…</p>
              ) : (
                <FilterBar
                  className={styles.categoriesFilterBar}
                  groups={[
                    {
                      id: 'category',
                      type: 'chips',
                      value: selectedCategory,
                      onChange: setSelectedCategory,
                      options: [
                        { value: ALL_CATEGORIES_VALUE, label: 'All' },
                        ...categoryNames.map((name) => ({ value: name, label: name })),
                      ],
                    },
                  ]}
                />
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Popular Foods</h2>

              {popularFoodsError ? (
                <EmptyState
                  title="Couldn't load popular foods"
                  description="Check your connection and try again."
                  action={
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={refetchPopularFoods}
                    >
                      Retry
                    </button>
                  }
                />
              ) : popularFoodsLoading ? (
                <p className={styles.sectionStatus}>Loading popular foods…</p>
              ) : popularFoods.length === 0 ? (
                <EmptyState
                  title="No foods yet"
                  description="Check back soon — restaurants are still building out their menus."
                />
              ) : (
                <ResponsiveGrid ariaLabel="Popular Foods" className={styles.popularFoodsGrid}>
                  {popularFoods.map((food) => (
                    <EntityCard
                      key={food.id}
                      image={food.image_url || FALLBACK_IMAGE}
                      imageAlt={food.name}
                      imageSrcSet={buildImageSrcSet(food.image_url, food.image_thumbnail_url)}
                      imageSizes={POPULAR_FOODS_GRID_SIZES}
                      title={food.name}
                      subtitle={food.restaurant_name}
                      metaLine={formatPrice(food.price)}
                      cta={<span className={styles.orderNowCta}>Order Now</span>}
                      onClick={() => goToFood(food.id)}
                    />
                  ))}
                </ResponsiveGrid>
              )}
            </section>
          </>
        )}
      </div>
    </RoleShell>
  );
}

// `foods.price` (docs/DB_SCHEMA.md's NUMBER(10,2)) arrives over JSON as a
// plain number — formatted here rather than trusting a backend string,
// same "ETB, no decimal noise for a whole-birr price" display convention
// `ComponentSandbox`'s own mock food data already established
// (`"250 ETB"`). `Number(...)` guards against a value that arrives as a
// numeric string instead (oracledb's NUMBER binding can do either
// depending on driver config — nothing in this codebase has exercised
// that against a live Oracle instance yet, same standing gap
// `popularFoods.js`'s own header comment flags for column casing).
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

function BellIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}
