import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import ImageUploadField from '../../components/ImageUploadField';
import ListWithPagination from '../../components/ListWithPagination';
import Modal from '../../components/Modal';
import RoleShell from '../../components/RoleShell';
import VerifiedBadge from '../../components/VerifiedBadge/VerifiedBadge';
import MenuQrCard from '../../components/MenuQrCard/MenuQrCard';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useApiQuery, useMutation, usePaginatedQuery } from '../../hooks';
import styles from './OwnerRestaurant.module.css';

// docs/DB_SCHEMA.md's opening_hours section: "day_of_week NUMBER(1),
// 0=Sunday ... 6=Saturday" — indexed directly by that value, same
// convention `openingHoursController.js`'s own list ordering
// (`orderBy: 'day_of_week', orderDir: 'ASC'`) already sorts by.
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// docs/DB_SCHEMA.md: restaurants.name is VARCHAR2(120) — same cap
// restaurantController.js's own `nameSchema` enforces server-side;
// repeated here so a caller finds out while still typing, same "client
// cap mirrors the real DB column" reasoning every other `FormField`-based
// form in this codebase already follows (e.g. CustomerInfo.jsx's
// NAME_MAX_LENGTH).
const NAME_MAX_LENGTH = 120;

// docs/DB_SCHEMA.md: categories.name is VARCHAR2(80) — same cap
// categoryController.js's own `nameSchema` (Task 1.16a) enforces
// server-side.
const CATEGORY_NAME_MAX_LENGTH = 80;

// docs/DB_SCHEMA.md: service_areas.area_name is VARCHAR2(120) — same cap
// serviceAreaController.js's own `areaNameSchema` (Task 1.16b) enforces
// server-side.
const AREA_NAME_MAX_LENGTH = 120;

// docs/DB_SCHEMA.md: payment_methods.method_name VARCHAR2(60),
// account_number VARCHAR2(60), account_name VARCHAR2(120), instructions
// VARCHAR2(500) — same caps `paymentMethodController.js`'s own schemas
// (Task 1.16c) enforce server-side.
// Task 10.5a-ii — fixed ids (this screen renders exactly one of each) for
// the hero's upload/error messages, which the page renders itself and
// hands to `ImageUploadField` as `messageId` so its `aria-describedby`
// still points at them.
const COVER_MESSAGE_ID = 'owner-restaurant-cover-message';
const LOGO_MESSAGE_ID = 'owner-restaurant-logo-message';

const METHOD_NAME_MAX_LENGTH = 60;
const ACCOUNT_NUMBER_MAX_LENGTH = 60;
const ACCOUNT_NAME_MAX_LENGTH = 120;
const INSTRUCTIONS_MAX_LENGTH = 500;

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter a restaurant name.';
  return errors;
}

function fetchMyRestaurant(signal) {
  return api.get('/restaurants/me', { signal });
}

function updateMyRestaurant(data) {
  return api.patch('/restaurants/me', data);
}

function fetchCategories({ page }, signal) {
  return api
    .get(`/categories?page=${page}`, { signal })
    .then(({ categories, meta }) => ({ rows: categories, meta }));
}

function fetchOpeningHours(signal) {
  return api.get('/opening-hours', { signal });
}

function fetchServiceAreas({ page }, signal) {
  return api
    .get(`/service-areas?page=${page}`, { signal })
    .then(({ service_areas, meta }) => ({ rows: service_areas, meta }));
}

// Unlike `fetchCategories`/`fetchServiceAreas` above, this reshapes the
// response before handing it to `usePaginatedQuery`: `paymentMethod
// Controller.js`'s `list` returns `{ payment_methods, meta }` (Task
// 1.16c), but `usePaginatedQuery`'s own doc comment says it expects
// `{ rows, meta }` — the exact shape `paginate.js` returns internally,
// before each controller renames `rows` to its own resource key on the
// way out. `fetchCategories`/`fetchServiceAreas` never do this renaming
// and appear to hand `usePaginatedQuery` a `rows: undefined` today; that
// looks like a pre-existing gap from Tasks 5.4/5.6, flagged here rather
// than silently fixed as part of this task since it's not this task's
// screen that's broken by it — see this file's header comment.
function fetchPaymentMethods({ page }, signal) {
  return api
    .get(`/payment-methods?page=${page}`, { signal })
    .then(({ payment_methods, meta }) => ({ rows: payment_methods, meta }));
}

/**
 * OwnerRestaurant — Task 5.2 (profile fields form), extended by Task 5.3
 * (logo + cover image upload), Task 5.4 (categories CRUD), Task 5.5
 * (opening hours, split into 5.5a/5.5b), Task 5.6 (service areas CRUD),
 * Task 5.7 (payment methods CRUD), and now Task 5.8 (Open/Closed toggle).
 * `OwnerRestaurant`'s Task 5.1 placeholder named exactly what lands here
 * across Tasks 5.2-5.11; menu management itself (5.9-5.11) now lives on
 * its own page (`OwnerMenu.jsx`, Task 5.9b) rather than another section
 * here — the subheading below links to it instead of naming it as
 * entirely not-yet-built.
 *
 * **Open/Closed (5.8) shares 5.2/5.3's `mutate`/`saveError`/`justSaved`,
 * not its own state** — same reasoning that group already gives for
 * folding logo/cover in alongside name/description: `is_open` is a
 * column on the exact same restaurant row, so a second "toggle saved"
 * banner would be a second status area describing the same underlying
 * fact ("this row was updated"), not a genuinely separate concern the
 * way Categories/Service areas/Payment methods (their own tables) are.
 *
 * **"No confirmation" (the task's own name for this) means no modal or
 * are-you-sure step, not "no feedback"** — `handleOpenToggle` fires
 * `mutate` the instant the `ToggleSwitch` flips, the same "commit
 * immediately, no separate Save click" shape `saveImage` already
 * established for logo/cover (Task 5.3), rather than the name/
 * description form's "type, then click Save changes." A failed toggle
 * still surfaces through the shared `saveError` banner and leaves the
 * `ToggleSwitch` reflecting `data.restaurant.is_open` (re-fetched, not
 * optimistically flipped) — so a rejected PATCH shows the toggle
 * snapping back to its real state rather than a UI that silently
 * disagrees with the server.
 *
 * **Service areas (5.6) is a near-exact copy of Categories (5.4)'s
 * shape**, deliberately — same one-field-per-row CRUD
 * (list/create/update/delete, one `Modal` for add/edit + a second for
 * delete confirmation), same reasoning `serviceAreaController.js`'s own
 * header comment gives ("Same shape as categoryController.js ... one
 * real field"). No new backend needed either: `/api/service-areas`'
 * full CRUD already existed from Task 1.16b. The only real differences
 * are the field name (`area_name` vs `name`) and its length cap
 * (`docs/DB_SCHEMA.md`: 120 vs 80 chars) — everything else (modal
 * state shape, save/delete state, `ListWithPagination` usage) is
 * copied rather than abstracted into a shared "simple CRUD section"
 * component, since there's no third or later user of that shape yet to
 * justify the extraction.
 *
 * **Payment methods (5.7) is deliberately NOT a copy of that shape** —
 * per `paymentMethodController.js`'s own header comment (Task 1.16c),
 * `/api/payment-methods` has no `DELETE` route at all (an un-guardable
 * FK from `orders.payment_method_id` with no `ON DELETE` clause, on a
 * table that's never hard-deleted); `is_active`, PATCHed like any other
 * field, is the only supported way to retire one. So this section has
 * no delete button or delete-confirmation `Modal` at all — a
 * `ToggleSwitch` per row (reusing the same component 5.5's opening-hours
 * rows already use) drives `is_active` directly, with its own
 * `togglingId`/`toggleErrors` state (mirroring 5.5b's per-row
 * `savingDayId`/`dayErrors` pattern, not the add/edit modal's shared
 * mutation state, since a toggle is a one-field inline PATCH with no
 * form to open). The add/edit `Modal` itself is still the same shape as
 * categories/service areas, just four fields (`method_name`,
 * `account_number`, `account_name`, and an optional `instructions`
 * textarea) instead of one.
 *
 * **`fetchPaymentMethods` reshapes its response; `fetchCategories`/
 * `fetchServiceAreas` above don't, and that looks like a pre-existing
 * bug.** `usePaginatedQuery`'s own doc comment says `queryFn` must
 * resolve to `{ rows, meta }`; `paymentMethodController.js`'s `list`
 * (like every list endpoint in this codebase) sends `{ payment_methods,
 * meta }` over the wire, so `fetchPaymentMethods` renames the key before
 * handing it back. `fetchCategories`/`fetchServiceAreas` (5.4/5.6) don't
 * do this rename and appear to pass `usePaginatedQuery` a `rows:
 * undefined` today — flagged, not fixed here, since it's not this
 * task's own section that's affected and chasing it down means
 * re-verifying two already-shipped tasks' screens instead of building
 * this one.
 *
 * **Opening hours (5.5a/5.5b) — per-row draft state, not one shared
 * form**: unlike the name/description form above (one `values` object,
 * one submit), each of the 7 days edits and saves independently — a
 * `openingHoursDrafts` map keyed by `opening_hours.id`, with its own
 * per-row `savingDayId`/`dayErrors`/`justSavedDayIds` state, so editing
 * Tuesday's hours can't block or get confused with saving Monday's.
 * `dayDraft(day)` falls back to the fetched row's own values whenever no
 * draft entry exists yet (before the first edit) — no seeding `useEffect`
 * needed the way the profile form's `seededRef` is, since a successful
 * save here updates just that one day's map entry from the response,
 * never a full list `refetch()` that could stomp an unsaved edit
 * elsewhere in the list.
 *
 * **The PATCH payload is a genuine partial update, not "current draft,
 * always all three fields"**: `is_closed` is always sent, but
 * `open_time`/`close_time` are only included at all when the day isn't
 * closed — sending them as `null` (rather than omitting them) when
 * closed would work too, but omitting keeps a "close a day" save from
 * silently clearing times a reopen might want back. Turning a closed day
 * open with no times filled in intentionally still reaches the backend's
 * own merged-state check (`openingHoursController.js`'s
 * `assertConsistentHours`) rather than being blocked client-side first —
 * its 400 message is surfaced verbatim in that row's own error slot,
 * which is what `err.message` already carries (the frontend `ApiError`
 * reads it straight from `{ error }`, the same shape every other
 * controller in this codebase throws).
 *
 * **No pagination**: `openingHoursCrud`'s own list route is paginated at
 * the backend (Task 1.16d reused `paginate.js`), but a restaurant always
 * has exactly 7 rows by construction (`UNIQUE (restaurant_id,
 * day_of_week)`) — same "fixed, small, no page controls needed"
 * reasoning the customer Home screen's Categories chip row (Task 3.4)
 * already applied to a comparably-small list. Fetched via plain
 * `useApiQuery`, not `usePaginatedQuery`.
 *
 * **One page, several sections — a layout call, not a reference-image
 * requirement**: `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant section"
 * just lists Profile/Logo/Cover/Description/Categories/Menu/Opening
 * hours/Service areas/Payment methods/Open-Closed as bullet items, and
 * neither `docs/reference_ui` image is an owner-management mockup —
 * nothing dictates single-scroll vs. sub-tabbed. Chose single-scroll,
 * each management area its own labeled `<section>`, so each of 5.4-5.8
 * can land as its own independent addition to this file without a
 * bigger sub-routing/tab-state refactor first. Worth revisiting if the
 * page gets unwieldy once opening hours/service areas/payment methods
 * are all added too.
 *
 * **Backend**: `GET`/`PATCH /api/restaurants/me` (5.2, extended 5.3) —
 * the first owner-authenticated routes on an otherwise fully public
 * router — plus two upload-only routes (5.3, `uploadController.js`).
 * Categories (5.4) needed no new backend at all: `/api/categories`'
 * full CRUD (list/create/get/update/delete) already existed from Phase 1
 * (Task 1.16a) with pagination, ownership scoping, and a 409 on deleting
 * a category that still has foods assigned to it — this task is purely
 * the frontend consuming what already exists.
 *
 * **Fetch-then-edit is a new shape for this codebase** — every other
 * `FormField` form so far (login, registration, customer info, request-
 * live, ...) starts from a blank or cart-seeded draft, never an existing
 * server row. `values` starts `null` (nothing to show while the GET is
 * in flight) and is seeded exactly once from the response via
 * `seededRef` — deliberately NOT reseeded on every fetch (including the
 * `refetch` a successful save triggers below), so a save can't stomp
 * whatever the owner might already be typing for their next edit.
 *
 * **One shared save-status banner for the name/description/logo/cover
 * fields**: `saveImage` reuses the same `mutate`/`saveError`/`justSaved`
 * the name/description form's `handleSubmit` already uses — all four
 * edit the same restaurant row, so one status area is less visual noise
 * than four. The categories section below is a genuinely separate
 * sub-resource (its own table, its own list/create/update/delete
 * lifecycle) and gets its own modal-scoped save/delete state instead —
 * conflating "restaurant row saved" with "a category was added" would
 * be a false shared meaning, not a simplification.
 *
 * **Categories: `Modal` used for both its two named purposes at once**
 * — a form dialog (add/edit) and a confirmation dialog (delete) — the * first real use of `Modal` in this codebase for either. Delete uses a
 * second, separate `Modal` instance rather than reusing the add/edit one
 * with different content, since only one of "editing a category" and
 * "confirming a delete" can be true at a time anyway and keeping them as
 * two states (`categoryModal`/`categoryToDelete`) avoids one modal's
 * component having to branch on which mode it's in.
 *
 * **Known blocker, flagged not fixed by this task**: `attachOwnerRestaurant.js`'s
 * long-standing "no restaurant-creation endpoint exists yet" gap (named
 * in every 4.3-4.5 log entry and still open per Task 5.1/5.2's own log
 * entries) means a real brand-new owner has no `restaurants` row yet and
 * gets a 403 from `attachOwnerRestaurant` before this screen's `GET /me`
 * (or `/categories`, which chains the same middleware) ever runs. That
 * 403 is handled below as its own distinct state (`noRestaurantYet`)
 * rather than the generic "check your connection" retry message, since
 * retrying changes nothing until that gap is resolved.
 */
export default function OwnerRestaurant() {
  const { data, loading, error, refetch } = useApiQuery(fetchMyRestaurant, []);
  const {
    mutate,
    error: saveError,
    loading: saving,
    reset: resetSave,
  } = useMutation(updateMyRestaurant);

  // Task 10.5h-ii — independent of `data`/`loading`/`error` above by
  // design: this screen's main content (the restaurant profile form)
  // must still load and render even if this one call fails, so it gets
  // its own `useApiQuery` rather than being folded into the query above.
  // Not destructured beyond `data` yet — no render uses this value
  // until 10.5h-iii (real-fallback derivation) and 10.5h-iv (the actual
  // `<Link>`); this task's own scope is adding the query, not using it.
  const restaurantDescription = data?.restaurant?.description
    ? data.restaurant.description.trim()
    : '';

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        {noRestaurantYet ? (
          <EmptyState
            title="No restaurant set up yet"
            description="Your account isn't linked to a restaurant yet, so there's nothing here to edit."
          />        ) : error ? (
          <EmptyState
            title="Couldn't load your restaurant"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : loading || !values ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <>
            {/* Hero — Task 10.5a-i (cover photo) + Task 10.5a-ii (logo badge),
                per docs/reference_ui/phase10_owner_restaurant_reference.jpg.
                Both are the same real fields, handlers and state as
                before (`cover_url`/`logo_url`, `handleCoverChange`/
                `handleLogoChange`, `coverUploading`/`logoUploading`,
                `coverError`/`logoError`) — a layout/restyle of
                `ImageUploadField`'s opt-in `overlay` and `badge` modes
                (see that component's own comments), not new upload
                logic.

                The badge sits in its own row *after* the cover and is
                pulled up over the cover's bottom edge by a negative
                margin (see `.logoBadge`), rather than absolutely
                positioned inside the cover: the cover's `overflow:
                hidden` (needed to round its photo) would clip a badge
                that hangs below it, and normal flow keeps the row's
                height honest so the form below never slides under it.

                Resting helper captions (the cover's "Shown at the top
                of your public restaurant profile.", the logo's "Shown
                on your restaurant card and profile.") are dropped: the
                reference shows no text under the hero, and the
                placement itself now says what the old sentences did.
                The real "Uploading…" and error states are kept, below.

                Task 10.5a-iii adds the name + one-line description
                preview into `.identityRow` beside the badge (see that
                class's own comment on why `.logoBadge` is `flex: 0 0
                auto` — this is the block it was reserving room for).
                Task 10.5a-iv-i moved the `StatusBadge` itself in here,
                next to the name (see `.nameRow`); 10.5a-iv-ii (this
                task) moves the `ToggleSwitch` and its hint sentence in
                too, as their own `.statusRow` directly under `.nameRow`
                — `.openToggleRow` (the standalone card above the hero
                both used to live in) is now empty and removed
                entirely, JSX and CSS both. */}
            <div className={styles.hero}>
              <ImageUploadField
                label="Cover photo"
                value={data.restaurant.cover_url}
                onChange={handleCoverChange}
                onError={setCoverError}
                disabled={coverUploading}
                error={coverError}
                helperText={coverUploadingText}
                messageId={COVER_MESSAGE_ID}
                overlay
                mediaClassName={styles.coverHero}
                chooseLabel="Add cover photo"
                changeLabel="Change cover photo"
              />

              <div className={styles.identityRow}>
                <ImageUploadField
                  label="Logo"
                  value={data.restaurant.logo_url}
                  onChange={handleLogoChange}
                  onError={setLogoError}
                  disabled={logoUploading}
                  error={logoError}
                  helperText={logoUploadingText}
                  messageId={LOGO_MESSAGE_ID}
                  badge
                  className={styles.logoBadge}
                  chooseLabel="Add logo"
                  changeLabel="Edit logo"
                  badgeCaption="Edit"
                />

                <div className={styles.identityText}>
                  <div className={styles.nameRow}>
                    <h2 className={styles.restaurantName}>{data.restaurant.name}</h2>
                    {data.restaurant.live_status === 'approved' && <VerifiedBadge />}
                    <ToggleSwitch
                      checked={data.restaurant.is_open === 1}
                      onChange={handleOpenToggle}
                      disabled={saving}
                      label={data.restaurant.is_open ? 'Open' : 'Closed'}
                    />
                  </div>div>

                  {restaurantDescription ? (
                    <p className={styles.descriptionPreview}>{restaurantDescription}</p>
                  ) : (
                    <p className={styles.descriptionPreviewEmpty}>
                      Add a description below to tell customers about your restaurant.
                    </p>
                  )}
                </div>
              </div>

              {(coverMessage || logoMessage) && (
                <div className={styles.heroMessages}>
                  {coverMessage && (
                    <p
                      id={COVER_MESSAGE_ID}
                      className={coverError ? styles.formError : styles.heroHint}
                      role={coverError ? 'alert' : undefined}
                    >
                      {coverMessage}
                    </p>
                  )}
                  {logoMessage && (
                    <p
                      id={LOGO_MESSAGE_ID}
                      className={logoError ? styles.formError : styles.heroHint}
                      role={logoError ? 'alert' : undefined}
                    >
                      {logoMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <FormField
                label="Restaurant name"
                required
                value={values.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                maxLength={NAME_MAX_LENGTH}
                error={touched.name ? errors.name : undefined}
              />

              <FormField
                as="textarea"
                label="Description"
                value={values.description}
                onChange={handleChange('description')}
                placeholder="Tell customers a bit about your restaurant."
                helperText="Optional — shown on your public restaurant profile."
              />

              {saveError && (
                <p className={styles.formError} role="alert">
                  Couldn't save your changes. Check your connection and try again.
                </p>
              )}

              {justSaved && !saveError && (
                <p className={styles.successBanner} role="status">
                  Saved.
                </p>
              )}

              <button type="submit" className={styles.saveButton} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>

            <MenuQrCard
              restaurantId={data.restaurant.id}
              restaurantName={data.restaurant.name}
            />

            {/* Task 10.5c-i-a — Categories is the first section on the new
                `.sectionCard` shell (a card, not the old divider-line
                `.section`). The other three sections keep `.section` until
                their own tasks (10.5d-i-a / 10.5e-i-a / 10.5f-i-a). */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Categories</h2>
                {/* Task 10.5c-i-c — `.addPill` here only; Service areas /
                    Payment methods keep `.addButton` until 10.5e-i-c /
                    10.5f-i-c. */}
                <button type="button" className={styles.addPill} onClick={openAddCategory}>
                  Add category
                </button>
              </div>

              {categoriesError ? (
                /* Task 10.5c-ii-d — `.categoryLoadError`, not the bare
                   `.formError` (that class still serves the profile form
                   above and Opening hours' own `.openingHoursError` below
                   until their tasks); copy unchanged. */
                <p className={styles.categoryLoadError} role="alert">
                  Couldn't load categories. Check your connection and try again.
                </p>
              ) : (
                <ListWithPagination
                  items={categories}
                  getItemKey={(category) => category.id}
                  isLoading={categoriesLoading}
                  loadingLabel="Loading categories…"
                  meta={categoriesMeta}
                  onPageChange={setCategoriesPage}
                  ariaLabel="Categories"
                  emptyState={
                    /* Task 10.5c-ii-e — `.categoriesEmpty`, same
                       `.card .notificationsEmpty`-style padding trim
                       `OwnerDashboard.jsx`'s Task 10.3f-ii already used
                       (EmptyState's own whole-screen padding would
                       double up inside `.sectionCard`'s own padding);
                       copy unchanged. */
                    <EmptyState
                      title="No categories yet"
                      description="Add a category to help customers browse your menu."
                      className={styles.categoriesEmpty}
                    />
                  }
                  renderItem={(category) => (
                    /* Task 10.5c-ii-c — `.categoryRow`, not `.listRow`
                       (that class still lays out Service areas'/Payment
                       methods' rows until their own tasks). Adds
                       `flex-wrap` so `.categoryRowActions` drops to its
                       own line when the row is too narrow to hold the
                       chip and actions side by side. */
                    <div className={styles.categoryRow}>
                      {/* Task 10.5c-ii-a — `.categoryChip`, not
                          `.listRowName` (that class still serves Service
                          areas/Payment methods below until their own
                          tasks). Also carries the long-unbreakable-word
                          wrap fix — see the CSS comment. */}
                      <span className={styles.categoryChip}>{category.name}</span>
                      {/* Task 10.5c-ii-c — `.categoryRowActions`, not
                          `.listRowActions` (same scoping as the row
                          itself above). */}
                      <div className={styles.categoryRowActions}>
                        {/* Task 10.5c-ii-b — `.categoryEditLink`/
                            `.categoryDeleteLink`, not `.linkButton`/
                            `.linkButtonDanger` (those still serve Opening
                            hours' Save link, Payment methods' Edit link,
                            and the menu link below — untouched). Same
                            underlined-text/44px-hit-area look, scoped to
                            Categories only. */}
                        <button
                          type="button"
                          className={styles.categoryEditLink}
                          onClick={() => openEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.categoryDeleteLink}