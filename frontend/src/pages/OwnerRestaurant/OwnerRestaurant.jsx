import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import ImageUploadField from '../../components/ImageUploadField';
import ListWithPagination from '../../components/ListWithPagination';
import Modal from '../../components/Modal';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
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
  return api.get(`/categories?page=${page}`, { signal });
}

function fetchOpeningHours(signal) {
  return api.get('/opening-hours', { signal });
}

function fetchServiceAreas({ page }, signal) {
  return api.get(`/service-areas?page=${page}`, { signal });
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
 * — a form dialog (add/edit) and a confirmation dialog (delete) — the
 * first real use of `Modal` in this codebase for either. Delete uses a
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

  const [values, setValues] = useState(null);
  const [touched, setTouched] = useState({});
  const [justSaved, setJustSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && data?.restaurant) {
      setValues({
        name: data.restaurant.name,
        description: data.restaurant.description ?? '',
      });
      seededRef.current = true;
    }
  }, [data]);

  const errors = values ? validate(values) : {};
  const noRestaurantYet = error instanceof ApiError && error.status === 403;

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setJustSaved(false);
    resetSave();
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ name: true });
    if (Object.keys(errors).length > 0) return;

    const description = values.description.trim();
    mutate({
      name: values.name.trim(),
      description: description === '' ? null : description,
    })
      .then(() => {
        setJustSaved(true);
        refetch();
      })
      .catch(() => {
        // Surfaced via `saveError` state below; nothing further to do here.
      });
  };

  // `thumbnailField`/8.4c-ii (migration 0012) — same upload response
  // (`uploadToObjectStorage`, Task 1.6) already carries `thumbnailUrl`
  // alongside `url`; it was silently discarded here before this fix (see
  // migration 0012's own header comment for how that was found). `?? null`
  // rather than leaving the key out: a gif upload (or `generateThumbnail:
  // false`) returns `thumbnailUrl: null`, and a caller replacing an
  // existing logo/cover with a gif needs that explicit `null` to actually
  // clear out whatever thumbnail URL an earlier, non-gif upload had saved
  // — omitting the key would leave the stale thumbnail in place instead.
  const saveImage = async (
    file,
    { uploadPath, field, thumbnailField, setUploading, setImageError }
  ) => {
    setImageError(null);
    setJustSaved(false);
    resetSave();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { url, thumbnailUrl } = await api.post(uploadPath, formData);
      await mutate({ [field]: url, [thumbnailField]: thumbnailUrl ?? null });
      setJustSaved(true);
      refetch();
    } catch (err) {
      setImageError(err.message || 'Could not upload the image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (file) =>
    saveImage(file, {
      uploadPath: '/uploads/restaurant-logo',
      field: 'logo_url',
      thumbnailField: 'logo_thumbnail_url',
      setUploading: setLogoUploading,
      setImageError: setLogoError,
    });

  const handleCoverChange = (file) =>
    saveImage(file, {
      uploadPath: '/uploads/restaurant-cover',
      field: 'cover_url',
      thumbnailField: 'cover_thumbnail_url',
      setUploading: setCoverUploading,
      setImageError: setCoverError,
    });

  // Open/Closed (Task 5.8) — see this file's header comment for why this
  // commits immediately (no Save-changes click, no confirmation) and
  // shares the name/description form's `mutate`/`saveError`/`justSaved`
  // rather than getting its own.
  const handleOpenToggle = (checked) => {
    setJustSaved(false);
    resetSave();
    mutate({ is_open: checked })
      .then(() => {
        setJustSaved(true);
        refetch();
      })
      .catch(() => {
        // Surfaced via `saveError` state below; `refetch()` isn't called
        // on failure so the toggle keeps reflecting the last-known-good
        // `data.restaurant.is_open` rather than a value that never saved.
      });
  };

  // --- Opening hours (Task 5.5a — read scaffold; Task 5.5b — editing/save) ---

  const {
    data: openingHoursData,
    loading: openingHoursLoading,
    error: openingHoursError,
  } = useApiQuery(fetchOpeningHours, []);

  const openingHours = openingHoursData?.opening_hours ?? [];

  // Keyed by opening_hours.id. Deliberately NOT seeded via a one-shot
  // ref the way the restaurant-profile form (5.2) seeds `values` —
  // there's no `refetch()` anywhere in this section to guard against
  // stomping (a successful save updates just that one day's entry
  // directly from the response, never a full re-fetch), so a per-render
  // fallback to the fetched row is enough: `openingHoursDrafts[day.id] ??
  // <derived from day>` in both `dayDraft` and every place below that
  // needs a draft.
  const [openingHoursDrafts, setOpeningHoursDrafts] = useState({});
  const [savingDayId, setSavingDayId] = useState(null);
  const [dayErrors, setDayErrors] = useState({});
  const [justSavedDayIds, setJustSavedDayIds] = useState({});

  function dayDraft(day) {
    return (
      openingHoursDrafts[day.id] ?? {
        is_closed: day.is_closed === 1,
        open_time: day.open_time ?? '',
        close_time: day.close_time ?? '',
      }
    );
  }

  function updateDayDraft(day, patch) {
    setOpeningHoursDrafts((prev) => ({
      ...prev,
      [day.id]: { ...dayDraft(day), ...patch },
    }));
    setDayErrors((prev) => ({ ...prev, [day.id]: undefined }));
    setJustSavedDayIds((prev) => {
      if (!prev[day.id]) return prev;
      const next = { ...prev };
      delete next[day.id];
      return next;
    });
  }

  // Deliberately a partial update, not always all three fields — mirrors
  // every other `*ForOwner` PATCH in this codebase (categories/payment
  // methods) sending only what changed, and lets the backend's own
  // merged-state check (`openingHoursController.js`'s `assertConsistentHours`,
  // checked against `req.resource` + this body, not just this body alone)
  // actually do the work: opening a day with no times filled in omits
  // `open_time`/`close_time` from the payload entirely rather than
  // guessing a value, so that 400 ("open_time and close_time are
  // required when is_closed is false") is the real backend rule
  // surfacing, not something masked by sending blanks.
  async function saveDay(day) {
    const draft = dayDraft(day);
    setDayErrors((prev) => ({ ...prev, [day.id]: undefined }));
    setSavingDayId(day.id);
    try {
      const payload = { is_closed: draft.is_closed };
      if (!draft.is_closed) {
        payload.open_time = draft.open_time.trim() === '' ? null : draft.open_time;
        payload.close_time = draft.close_time.trim() === '' ? null : draft.close_time;
      }
      const { opening_hours: updated } = await api.patch(`/opening-hours/${day.id}`, payload);
      setOpeningHoursDrafts((prev) => ({
        ...prev,
        [day.id]: {
          is_closed: updated.is_closed === 1,
          open_time: updated.open_time ?? '',
          close_time: updated.close_time ?? '',
        },
      }));
      setJustSavedDayIds((prev) => ({ ...prev, [day.id]: true }));
    } catch (err) {
      setDayErrors((prev) => ({
        ...prev,
        [day.id]: err.message || 'Could not save this day. Please try again.',
      }));
    } finally {
      setSavingDayId(null);
    }
  }

  // --- Categories (Task 5.4) ---

  const {
    items: categories,
    meta: categoriesMeta,
    loading: categoriesLoading,
    error: categoriesError,
    setPage: setCategoriesPage,
    refetch: refetchCategories,
  } = usePaginatedQuery(fetchCategories, []);

  // `null` (closed) | `{ mode: 'add' }` | `{ mode: 'edit', category }`
  const [categoryModal, setCategoryModal] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameTouched, setCategoryNameTouched] = useState(false);

  function saveCategory(payload) {
    return categoryModal.mode === 'edit'
      ? api.patch(`/categories/${categoryModal.category.id}`, payload)
      : api.post('/categories', payload);
  }

  const {
    mutate: submitCategory,
    error: categorySaveError,
    loading: savingCategory,
    reset: resetCategorySave,
  } = useMutation(saveCategory);

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState(null);

  const categoryNameError = !categoryName.trim() ? 'Enter a category name.' : undefined;

  function openAddCategory() {
    setCategoryModal({ mode: 'add' });
    setCategoryName('');
    setCategoryNameTouched(false);
    resetCategorySave();
  }

  function openEditCategory(category) {
    setCategoryModal({ mode: 'edit', category });
    setCategoryName(category.name);
    setCategoryNameTouched(false);
    resetCategorySave();
  }

  function closeCategoryModal() {
    setCategoryModal(null);
  }

  function handleCategorySubmit(event) {
    event.preventDefault();
    setCategoryNameTouched(true);
    if (categoryNameError) return;

    submitCategory({ name: categoryName.trim() })
      .then(() => {
        closeCategoryModal();
        refetchCategories();
      })
      .catch(() => {
        // Surfaced via `categorySaveError` state below.
      });
  }

  async function confirmDeleteCategory() {
    setCategoryDeleteError(null);
    setDeletingCategory(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      setCategoryToDelete(null);
      refetchCategories();
    } catch (err) {
      setCategoryDeleteError(
        err.message || 'Could not delete this category. Please try again.'
      );
    } finally {
      setDeletingCategory(false);
    }
  }

  // --- Service areas (Task 5.6) — same shape as Categories (5.4) above,
  // just `area_name` instead of `name`; see this file's header comment
  // for why this is a copy rather than a shared abstraction. ---

  const {
    items: serviceAreas,
    meta: serviceAreasMeta,
    loading: serviceAreasLoading,
    error: serviceAreasError,
    setPage: setServiceAreasPage,
    refetch: refetchServiceAreas,
  } = usePaginatedQuery(fetchServiceAreas, []);

  // `null` (closed) | `{ mode: 'add' }` | `{ mode: 'edit', serviceArea }`
  const [serviceAreaModal, setServiceAreaModal] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [areaNameTouched, setAreaNameTouched] = useState(false);

  function saveServiceArea(payload) {
    return serviceAreaModal.mode === 'edit'
      ? api.patch(`/service-areas/${serviceAreaModal.serviceArea.id}`, payload)
      : api.post('/service-areas', payload);
  }

  const {
    mutate: submitServiceArea,
    error: serviceAreaSaveError,
    loading: savingServiceArea,
    reset: resetServiceAreaSave,
  } = useMutation(saveServiceArea);

  const [serviceAreaToDelete, setServiceAreaToDelete] = useState(null);
  const [deletingServiceArea, setDeletingServiceArea] = useState(false);
  const [serviceAreaDeleteError, setServiceAreaDeleteError] = useState(null);

  const areaNameError = !areaName.trim() ? 'Enter a service area name.' : undefined;

  function openAddServiceArea() {
    setServiceAreaModal({ mode: 'add' });
    setAreaName('');
    setAreaNameTouched(false);
    resetServiceAreaSave();
  }

  function openEditServiceArea(serviceArea) {
    setServiceAreaModal({ mode: 'edit', serviceArea });
    setAreaName(serviceArea.area_name);
    setAreaNameTouched(false);
    resetServiceAreaSave();
  }

  function closeServiceAreaModal() {
    setServiceAreaModal(null);
  }

  function handleServiceAreaSubmit(event) {
    event.preventDefault();
    setAreaNameTouched(true);
    if (areaNameError) return;

    submitServiceArea({ area_name: areaName.trim() })
      .then(() => {
        closeServiceAreaModal();
        refetchServiceAreas();
      })
      .catch(() => {
        // Surfaced via `serviceAreaSaveError` state below.
      });
  }

  async function confirmDeleteServiceArea() {
    setServiceAreaDeleteError(null);
    setDeletingServiceArea(true);
    try {
      await api.delete(`/service-areas/${serviceAreaToDelete.id}`);
      setServiceAreaToDelete(null);
      refetchServiceAreas();
    } catch (err) {
      setServiceAreaDeleteError(
        err.message || 'Could not delete this service area. Please try again.'
      );
    } finally {
      setDeletingServiceArea(false);
    }
  }

  // --- Payment methods (Task 5.7) — same add/edit `Modal` shape as
  // Categories (5.4)/Service areas (5.6), but no delete: see this
  // file's header comment for why `is_active` (an inline per-row
  // `ToggleSwitch`, styled after 5.5b's per-day save state) is the only
  // supported way to retire one. ---

  const {
    items: paymentMethods,
    meta: paymentMethodsMeta,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
    setPage: setPaymentMethodsPage,
    refetch: refetchPaymentMethods,
  } = usePaginatedQuery(fetchPaymentMethods, []);

  // `null` (closed) | `{ mode: 'add' }` | `{ mode: 'edit', paymentMethod }`
  const [paymentMethodModal, setPaymentMethodModal] = useState(null);
  const [methodName, setMethodName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethodTouched, setPaymentMethodTouched] = useState({});

  function savePaymentMethod(payload) {
    return paymentMethodModal.mode === 'edit'
      ? api.patch(`/payment-methods/${paymentMethodModal.paymentMethod.id}`, payload)
      : api.post('/payment-methods', payload);
  }

  const {
    mutate: submitPaymentMethod,
    error: paymentMethodSaveError,
    loading: savingPaymentMethod,
    reset: resetPaymentMethodSave,
  } = useMutation(savePaymentMethod);

  // Inline per-row `is_active` toggle — a one-field PATCH with no modal
  // to open, so it gets its own state shaped like 5.5b's per-day
  // `savingDayId`/`dayErrors` rather than the add/edit modal's shared
  // mutation state above.
  const [togglingPaymentMethodId, setTogglingPaymentMethodId] = useState(null);
  const [toggleErrors, setToggleErrors] = useState({});

  const paymentMethodErrors = {
    method_name: !methodName.trim() ? 'Enter a payment method name.' : undefined,
    account_number: !accountNumber.trim() ? 'Enter an account number or phone.' : undefined,
    account_name: !accountName.trim() ? 'Enter the account holder name.' : undefined,
  };

  function openAddPaymentMethod() {
    setPaymentMethodModal({ mode: 'add' });
    setMethodName('');
    setAccountNumber('');
    setAccountName('');
    setInstructions('');
    setPaymentMethodTouched({});
    resetPaymentMethodSave();
  }

  function openEditPaymentMethod(paymentMethod) {
    setPaymentMethodModal({ mode: 'edit', paymentMethod });
    setMethodName(paymentMethod.method_name);
    setAccountNumber(paymentMethod.account_number);
    setAccountName(paymentMethod.account_name);
    setInstructions(paymentMethod.instructions ?? '');
    setPaymentMethodTouched({});
    resetPaymentMethodSave();
  }

  function closePaymentMethodModal() {
    setPaymentMethodModal(null);
  }

  function handlePaymentMethodSubmit(event) {
    event.preventDefault();
    setPaymentMethodTouched({ method_name: true, account_number: true, account_name: true });
    if (Object.values(paymentMethodErrors).some(Boolean)) return;

    const trimmedInstructions = instructions.trim();
    submitPaymentMethod({
      method_name: methodName.trim(),
      account_number: accountNumber.trim(),
      account_name: accountName.trim(),
      instructions: trimmedInstructions === '' ? null : trimmedInstructions,
    })
      .then(() => {
        closePaymentMethodModal();
        refetchPaymentMethods();
      })
      .catch(() => {
        // Surfaced via `paymentMethodSaveError` state below.
      });
  }

  async function toggleActivePaymentMethod(paymentMethod) {
    setToggleErrors((prev) => ({ ...prev, [paymentMethod.id]: undefined }));
    setTogglingPaymentMethodId(paymentMethod.id);
    try {
      await api.patch(`/payment-methods/${paymentMethod.id}`, {
        is_active: paymentMethod.is_active !== 1,
      });
      refetchPaymentMethods();
    } catch (err) {
      setToggleErrors((prev) => ({
        ...prev,
        [paymentMethod.id]: err.message || 'Could not update this payment method. Please try again.',
      }));
    } finally {
      setTogglingPaymentMethodId(null);
    }
  }

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        <h1 className={styles.heading}>Restaurant</h1>

        {noRestaurantYet ? (
          <EmptyState
            title="No restaurant set up yet"
            description="Your account isn't linked to a restaurant yet, so there's nothing here to edit."
          />
        ) : error ? (
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
            <div className={styles.openToggleRow}>
              <div className={styles.openToggleStatus}>
                <StatusBadge status={data.restaurant.is_open ? 'Open' : 'Closed'} />
                <span className={styles.openToggleHint}>
                  {data.restaurant.is_open
                    ? 'Customers can order from you right now.'
                    : "Customers can't place new orders while you're closed."}
                </span>
              </div>
              <ToggleSwitch
                checked={data.restaurant.is_open === 1}
                onChange={handleOpenToggle}
                disabled={saving}
                label={data.restaurant.is_open ? 'Open' : 'Closed'}
              />
            </div>

            <div className={styles.imageFields}>
              <ImageUploadField
                label="Cover photo"
                value={data.restaurant.cover_url}
                onChange={handleCoverChange}
                onError={setCoverError}
                disabled={coverUploading}
                error={coverError}
                helperText={coverUploading ? 'Uploading…' : 'Shown at the top of your public restaurant profile.'}
              />

              <ImageUploadField
                label="Logo"
                value={data.restaurant.logo_url}
                onChange={handleLogoChange}
                onError={setLogoError}
                disabled={logoUploading}
                error={logoError}
                helperText={logoUploading ? 'Uploading…' : 'Shown on your restaurant card and profile.'}
              />
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

              <button type="submit" className={styles.submitButton} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Categories</h2>
                <button type="button" className={styles.addButton} onClick={openAddCategory}>
                  Add category
                </button>
              </div>

              {categoriesError ? (
                <p className={styles.formError} role="alert">
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
                    <EmptyState
                      title="No categories yet"
                      description="Add a category to help customers browse your menu."
                    />
                  }
                  renderItem={(category) => (
                    <div className={styles.listRow}>
                      <span className={styles.listRowName}>{category.name}</span>
                      <div className={styles.listRowActions}>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => openEditCategory(category)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.linkButtonDanger}
                          onClick={() => setCategoryToDelete(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Opening hours</h2>
              </div>

              {openingHoursError ? (
                <p className={styles.formError} role="alert">
                  Couldn't load opening hours. Check your connection and try again.
                </p>
              ) : openingHoursLoading ? (
                <p className={styles.status}>Loading…</p>
              ) : openingHours.length === 0 ? (
                <EmptyState
                  title="No opening hours yet"
                  description="Opening hours are set up when a restaurant is created — check back once that's in place."
                />
              ) : (
                <div className={styles.openingHoursList}>
                  {openingHours.map((day) => {
                    const draft = dayDraft(day);
                    const isSaving = savingDayId === day.id;
                    return (
                      <div key={day.id} className={styles.openingHoursRow}>
                        <span className={styles.openingHoursDay}>
                          {DAY_LABELS[day.day_of_week]}
                        </span>

                        <ToggleSwitch
                          checked={draft.is_closed}
                          onChange={(checked) => updateDayDraft(day, { is_closed: checked })}
                          disabled={isSaving}
                          label="Closed"
                        />

                        {!draft.is_closed && (
                          <div className={styles.openingHoursTimes}>
                            <FormField
                              as="input"
                              type="time"
                              label="Opens"
                              value={draft.open_time}
                              onChange={(event) =>
                                updateDayDraft(day, { open_time: event.target.value })
                              }
                              disabled={isSaving}
                            />
                            <FormField
                              as="input"
                              type="time"
                              label="Closes"
                              value={draft.close_time}
                              onChange={(event) =>
                                updateDayDraft(day, { close_time: event.target.value })
                              }
                              disabled={isSaving}
                            />
                          </div>
                        )}

                        <div className={styles.openingHoursRowActions}>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => saveDay(day)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                          {justSavedDayIds[day.id] && !dayErrors[day.id] && (
                            <span className={styles.openingHoursSaved}>Saved</span>
                          )}
                        </div>

                        {dayErrors[day.id] && (
                          <p className={styles.openingHoursError} role="alert">
                            {dayErrors[day.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Service areas</h2>
                <button type="button" className={styles.addButton} onClick={openAddServiceArea}>
                  Add area
                </button>
              </div>

              {serviceAreasError ? (
                <p className={styles.formError} role="alert">
                  Couldn't load service areas. Check your connection and try again.
                </p>
              ) : (
                <ListWithPagination
                  items={serviceAreas}
                  getItemKey={(serviceArea) => serviceArea.id}
                  isLoading={serviceAreasLoading}
                  loadingLabel="Loading service areas…"
                  meta={serviceAreasMeta}
                  onPageChange={setServiceAreasPage}
                  ariaLabel="Service areas"
                  emptyState={
                    <EmptyState
                      title="No service areas yet"
                      description="Add the neighborhoods or areas you deliver to."
                    />
                  }
                  renderItem={(serviceArea) => (
                    <div className={styles.listRow}>
                      <span className={styles.listRowName}>{serviceArea.area_name}</span>
                      <div className={styles.listRowActions}>
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => openEditServiceArea(serviceArea)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.linkButtonDanger}
                          onClick={() => setServiceAreaToDelete(serviceArea)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Payment methods</h2>
                <button type="button" className={styles.addButton} onClick={openAddPaymentMethod}>
                  Add payment method
                </button>
              </div>

              {paymentMethodsError ? (
                <p className={styles.formError} role="alert">
                  Couldn't load payment methods. Check your connection and try again.
                </p>
              ) : (
                <ListWithPagination
                  items={paymentMethods}
                  getItemKey={(paymentMethod) => paymentMethod.id}
                  isLoading={paymentMethodsLoading}
                  loadingLabel="Loading payment methods…"
                  meta={paymentMethodsMeta}
                  onPageChange={setPaymentMethodsPage}
                  ariaLabel="Payment methods"
                  emptyState={
                    <EmptyState
                      title="No payment methods yet"
                      description="Add a bank account or mobile money number customers can pay to."
                    />
                  }
                  renderItem={(paymentMethod) => (
                    <div className={styles.listRow}>
                      <div className={styles.paymentMethodInfo}>
                        <span className={styles.listRowName}>{paymentMethod.method_name}</span>
                        <span className={styles.paymentMethodMeta}>
                          {paymentMethod.account_name} · {paymentMethod.account_number}
                        </span>
                        {paymentMethod.instructions && (
                          <span className={styles.paymentMethodMeta}>{paymentMethod.instructions}</span>
                        )}
                        {toggleErrors[paymentMethod.id] && (
                          <p className={styles.formError} role="alert">
                            {toggleErrors[paymentMethod.id]}
                          </p>
                        )}
                      </div>
                      <div className={styles.listRowActions}>
                        <ToggleSwitch
                          checked={paymentMethod.is_active === 1}
                          onChange={() => toggleActivePaymentMethod(paymentMethod)}
                          disabled={togglingPaymentMethodId === paymentMethod.id}
                          label="Active"
                        />
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => openEditPaymentMethod(paymentMethod)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                />
              )}
            </section>

            <p className={styles.subheading}>
              Menu management —{' '}
              <Link to="/owner/restaurant/menu" className={styles.linkButton}>
                manage your foods
              </Link>{' '}
              (adding/editing a food lands here in a later task).
            </p>
          </>
        )}
      </div>

      <Modal
        isOpen={categoryModal !== null}
        onClose={closeCategoryModal}
        title={categoryModal?.mode === 'edit' ? 'Edit category' : 'Add category'}
        size="sm"
        footer={
          <>
            <button type="button" className={styles.secondaryButton} onClick={closeCategoryModal}>
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              className={styles.submitButton}
              disabled={savingCategory}
            >
              {savingCategory ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleCategorySubmit} noValidate>
          <FormField
            label="Category name"
            required
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            error={categoryNameTouched ? categoryNameError : undefined}
          />

          {categorySaveError && (
            <p className={styles.formError} role="alert">
              Couldn't save this category. Check your connection and try again.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        title="Delete category?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCategoryToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={confirmDeleteCategory}
              disabled={deletingCategory}
            >
              {deletingCategory ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className={styles.modalText}>
          Delete &ldquo;{categoryToDelete?.name}&rdquo;? This can&rsquo;t be undone.
        </p>

        {categoryDeleteError && (
          <p className={styles.formError} role="alert">
            {categoryDeleteError}
          </p>
        )}
      </Modal>

      <Modal
        isOpen={serviceAreaModal !== null}
        onClose={closeServiceAreaModal}
        title={serviceAreaModal?.mode === 'edit' ? 'Edit service area' : 'Add service area'}
        size="sm"
        footer={
          <>
            <button type="button" className={styles.secondaryButton} onClick={closeServiceAreaModal}>
              Cancel
            </button>
            <button
              type="submit"
              form="service-area-form"
              className={styles.submitButton}
              disabled={savingServiceArea}
            >
              {savingServiceArea ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="service-area-form" onSubmit={handleServiceAreaSubmit} noValidate>
          <FormField
            label="Area name"
            required
            value={areaName}
            onChange={(event) => setAreaName(event.target.value)}
            maxLength={AREA_NAME_MAX_LENGTH}
            error={areaNameTouched ? areaNameError : undefined}
          />

          {serviceAreaSaveError && (
            <p className={styles.formError} role="alert">
              Couldn't save this service area. Check your connection and try again.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={serviceAreaToDelete !== null}
        onClose={() => setServiceAreaToDelete(null)}
        title="Delete service area?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setServiceAreaToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={confirmDeleteServiceArea}
              disabled={deletingServiceArea}
            >
              {deletingServiceArea ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className={styles.modalText}>
          Delete &ldquo;{serviceAreaToDelete?.area_name}&rdquo;? This can&rsquo;t be undone.
        </p>

        {serviceAreaDeleteError && (
          <p className={styles.formError} role="alert">
            {serviceAreaDeleteError}
          </p>
        )}
      </Modal>

      <Modal
        isOpen={paymentMethodModal !== null}
        onClose={closePaymentMethodModal}
        title={paymentMethodModal?.mode === 'edit' ? 'Edit payment method' : 'Add payment method'}
        size="sm"
        footer={
          <>
            <button type="button" className={styles.secondaryButton} onClick={closePaymentMethodModal}>
              Cancel
            </button>
            <button
              type="submit"
              form="payment-method-form"
              className={styles.submitButton}
              disabled={savingPaymentMethod}
            >
              {savingPaymentMethod ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="payment-method-form" onSubmit={handlePaymentMethodSubmit} noValidate>
          <FormField
            label="Method name"
            required
            value={methodName}
            onChange={(event) => setMethodName(event.target.value)}
            placeholder="e.g. Telebirr, CBE"
            maxLength={METHOD_NAME_MAX_LENGTH}
            error={paymentMethodTouched.method_name ? paymentMethodErrors.method_name : undefined}
          />

          <FormField
            label="Account number / phone"
            required
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
            error={paymentMethodTouched.account_number ? paymentMethodErrors.account_number : undefined}
          />

          <FormField
            label="Account name"
            required
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            maxLength={ACCOUNT_NAME_MAX_LENGTH}
            error={paymentMethodTouched.account_name ? paymentMethodErrors.account_name : undefined}
          />

          <FormField
            as="textarea"
            label="Instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Optional — any extra detail customers should know before paying."
            maxLength={INSTRUCTIONS_MAX_LENGTH}
            helperText="Optional."
          />

          {paymentMethodSaveError && (
            <p className={styles.formError} role="alert">
              Couldn't save this payment method. Check your connection and try again.
            </p>
          )}
        </form>
      </Modal>
    </RoleShell>
  );
}
