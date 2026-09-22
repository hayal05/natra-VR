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

// Task 10.5h-ii — the header avatar's data source. Same local
// `fetchMe(signal)` shape `OwnerAccount.jsx`/`AdminAccount.jsx` already
// each define for themselves (not a shared import — same "duplicate,
// don't share" convention this file's other `fetch*` functions and
// `.paymentMethodEditLink`-style CSS classes both follow), returning
// `data.user` rather than the raw `{ user }` envelope so the hook's
// `data` is the user row directly, matching `fetchMyRestaurant`'s own
// "hand back exactly what the page will render" shape above. Wired to
// its own `useApiQuery` call below rather than reusing `fetchMyRestaurant`'s
// — this endpoint backs one small header element, not the page's main
// content, so a failure here shouldn't block or blank the rest of the
// screen the way `data`'s own loading/error states do (10.5h-ii's own
// scope: add the query, no render yet — 10.5h-iii/iv decide what a
// failure looks like on screen).
function fetchMe(signal) {
  return api.get('/auth/me', { signal }).then((data) => data.user);
}

// Task 10.5h-iii — initial derivation, with a real fallback.
//
// Governing rule (this task's own description): "name → email → a plain
// 'Account' text link (never a fake letter)". Reads as a fallback
// *chain*, not a single rule — so this returns `null` (never a made-up
// character) whenever there's nothing real to derive one from, and
// 10.5h-iv's render is the thing that turns a `null` here into the
// plain "Account" text link the task calls for; this function's own job
// stops at "is there a real letter, or not."
//
// Order matches the task's own wording exactly: `full_name` first (the
// more human-facing of the two — `users.full_name`, `NOT NULL` per
// `docs/DB_SCHEMA.md`/the 0006 migration, same column `OwnerAccount.jsx`'s
// profile form edits), `email` second (also `NOT NULL`, so this branch
// only matters if the same account theoretically has a blank/whitespace-
// only stored name — otherwise unreachable in practice, but "never a
// fake letter" is about correctness under every actual data shape, not
// just the common one). `me` itself (this task's own `useApiQuery`
// caller, 10.5h-ii) is `null` while loading or on error — both handled
// the same as "no usable name/email", the same "don't invent a
// placeholder while real data hasn't arrived yet" instinct
// `OwnerAccount.jsx`'s own `values` (starts `null`, not a blank-field
// placeholder object) already follows.
function deriveAccountInitial(user) {
  const source = (user?.full_name || user?.email || '').trim();
  return source ? source[0].toUpperCase() : null;
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

  // Task 10.5h-ii — independent of `data`/`loading`/`error` above by
  // design: this screen's main content (the restaurant profile form)
  // must still load and render even if this one call fails, so it gets
  // its own `useApiQuery` rather than being folded into the query above.
  // Not destructured beyond `data` yet — no render uses this value
  // until 10.5h-iii (real-fallback derivation) and 10.5h-iv (the actual
  // `<Link>`); this task's own scope is adding the query, not using it.
  const { data: me } = useApiQuery(fetchMe, []);

  // Task 10.5h-iii — computed once per render from `me`, cheap enough
  // (one `.trim()`/one character read) not to need `useMemo`. `null`
  // means "no real letter available" (still loading, errored, or —
  // unreachable today given both columns are `NOT NULL`, but handled
  // anyway — a blank name and email); 10.5h-iv's render is what turns
  // that into the fallback plain "Account" text link instead of an
  // avatar circle. Not read in JSX yet — that's 10.5h-iv's own scope.
  const accountInitial = deriveAccountInitial(me);

  // Task 10.5h-iv — the account link/avatar itself, built as a local
  // element here rather than inserted into the return tree yet — same
  // "compute/build now, place later" split 10.5h-ii's query and
  // 10.5h-iii's derivation already followed. `10.5h-v` decides *where*
  // this renders (assumed to be the right end of the `<h1>Restaurant</h1>`
  // row, not yet confirmed by this task); `10.5h-vi` gives
  // `.accountAvatar`/`.accountFallbackLink` their actual look (orange
  // circle/white letter, tap-target floor) — neither class has any CSS
  // yet as of this task, so both render unstyled (plain text) until
  // `10.5h-vi` lands. This task's own scope is just the two possible
  // shapes the markup can take: a lettered circle when `accountInitial`
  // is a real letter (10.5h-iii), or the plain "Account" text link the
  // task's own wording falls back to when it's `null` — never inventing
  // a placeholder letter for the circle case. `aria-label="Account"` on
  // the circle so a single letter isn't a screen reader's only signal
  // of what the link does; the fallback link already says "Account" as
  // its visible text, so it needs no separate label.
  const accountLink = accountInitial ? (
    <Link to="/owner/account" className={styles.accountAvatar} aria-label="Account">
      {accountInitial}
    </Link>
  ) : (
    <Link to="/owner/account" className={styles.accountFallbackLink}>
      Account
    </Link>
  );

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

  // Task 10.5a-ii — the cover and logo fields no longer render their own
  // upload/error text (see `messageId` on `ImageUploadField`): the logo
  // badge is pulled up over the cover, so neither field has room for a
  // message of its own. Both are rendered together under the hero
  // instead, so each names which image it's about. Before, position did
  // that job (each message sat right under its own field); side by side,
  // two raw server errors ("Could not upload the image…") would be
  // indistinguishable, and a screen reader hears the alert with no field
  // context at all — hence the "Uploading cover photo…" wording and the
  // "Cover photo: "/"Logo: " prefix on errors.
  const coverUploadingText = coverUploading ? 'Uploading cover photo…' : undefined;
  const logoUploadingText = logoUploading ? 'Uploading logo…' : undefined;
  const coverMessage = coverError ? `Cover photo: ${coverError}` : coverUploadingText;
  const logoMessage = logoError ? `Logo: ${logoError}` : logoUploadingText;

  // Task 10.5a-iii — one-line description preview beside the name, in the
  // hero. `description` is the same real, optional CLOB field the form
  // below edits (`values.description`) — reused, not duplicated, per the
  // roadmap's own "the presentation is new, the data isn't" finding.
  // `.descriptionPreview` (below) does the actual one-line clamp with
  // plain `white-space: nowrap` + `text-overflow: ellipsis`; normal CSS
  // whitespace collapsing already folds a multi-line description's own
  // newlines into single spaces before that, so no JS string-trimming is
  // needed here. A restaurant with nothing saved yet gets a real prompt
  // instead of blank space pretending to be content — not a fake tagline.
  // Optional-chained because this line runs on every render, including the
  // loading / error / no-restaurant-yet ones where `data` is still `null`
  // (found in the first real-browser render, during 10.5b-i — until then
  // this was a white-screen crash on initial load).
  const restaurantDescription = data?.restaurant?.description
    ? data.restaurant.description.trim()
    : '';

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        {/* Task 10.5h-v — `accountLink` (10.5h-iv) placed at the right
            end of this row. Placement was the task's own stated
            assumption, not a reference-image measurement: the
            reference (`docs/reference_ui/phase10_owner_restaurant_
            reference.jpg`) shows the avatar inside a full search+bell+
            avatar top bar sitting *above* the hero, not next to a
            "Restaurant" heading — but this page has never had that top
            bar (confirmed by grep: no `SearchBar`/bell/topbar markup
            anywhere in this file, matching this task's own parent note
            that none of the three has real backing behavior here). With
            no existing top-bar row to attach to, and the parent task's
            decision already dropping search/bell/chevron and keeping
            only the avatar, the `<h1>Restaurant</h1>` row is this page's
            only existing header-level row — the most reasonable real
            anchor available, not an invented one. Confirmed, not just
            assumed: this is a plain content decision (where does a
            page-level nav link belong when there's no dedicated top bar
            for it), not a pixel measurement the reference could settle
            either way. New `.headingRow` wraps both; `.heading`'s
            former `margin: 0 0 var(--space-lg)` moved onto the row
            (single call site, confirmed by grep, so edited in place —
            same convention `.subheading` followed at 10.5g-i) so the
            spacing below stays the same regardless of which of the two
            children ends up taller. */}
        <div className={styles.headingRow}>
          <h1 className={styles.heading}>Restaurant</h1>
          {accountLink}
        </div>

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
                    <StatusBadge
                      status={data.restaurant.is_open ? 'Open' : 'Closed'}
                      className={styles.nameBadge}
                    />
                  </div>

                  {/* Task 10.5a-iv-ii — `ToggleSwitch` + its hint sentence,
                      moved here from the now-removed `.openToggleRow`
                      card above the hero. Same `handleOpenToggle`/
                      `data.restaurant.is_open`/`saving` as before — no
                      new state, no new confirmation step, still commits
                      the instant the switch flips (see this file's
                      header comment on why Open/Closed shares the
                      profile form's save state rather than getting its
                      own). Sits directly under `.nameRow` so it reads as
                      "name + status pill, then the control that changes
                      that status" — the closest a linear DOM/visual
                      order gets to "next to the badge" once the hint
                      sentence (too long to sit on `.nameRow`'s own line
                      next to a possibly-long name) is accounted for. */}
                  <div className={styles.statusRow}>
                    <span className={styles.statusHint}>
                      {data.restaurant.is_open
                        ? 'Customers can order from you right now.'
                        : "Customers can't place new orders while you're closed."}
                    </span>
                    <ToggleSwitch
                      checked={data.restaurant.is_open === 1}
                      onChange={handleOpenToggle}
                      disabled={saving}
                      label={data.restaurant.is_open ? 'Open' : 'Closed'}
                    />
                  </div>

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

            {/* Task 10.5d-i-a — Opening hours moves to `.sectionCard`,
                same shell Categories adopted in 10.5c-i-a. Service areas
                / Payment methods keep `.section` until 10.5e-i-a /
                10.5f-i-a. Header row untouched (10.5d-i-b). */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Opening hours</h2>
              </div>

              {openingHoursError ? (
                /* Task 10.5d-ii-a — `.openingHoursLoadError`, not the bare
                   `.formError` (still serves the profile form) and not
                   `.openingHoursError` (the per-day *save* error inside
                   `.openingHoursRow`, 10.5d-ii-g); copy unchanged. */
                <p className={styles.openingHoursLoadError} role="alert">
                  Couldn't load opening hours. Check your connection and try again.
                </p>
              ) : openingHoursLoading ? (
                /* Task 10.5d-ii-b — `.openingHoursLoading`, not the bare
                   `.status` (still the whole-page loader above); copy
                   unchanged. */
                <p className={styles.openingHoursLoading}>Loading…</p>
              ) : openingHours.length === 0 ? (
                /* Task 10.5d-ii-c — `.openingHoursEmpty`, same padding
                   trim `.categoriesEmpty` (10.5c-ii-e) uses so
                   `EmptyState`'s whole-screen padding doesn't double up
                   inside `.sectionCard`; copy unchanged. */
                <EmptyState
                  title="No opening hours yet"
                  description="Opening hours are set up when a restaurant is created — check back once that's in place."
                  className={styles.openingHoursEmpty}
                />
              ) : (
                <div className={styles.openingHoursList}>
                  {openingHours.map((day) => {
                    const draft = dayDraft(day);
                    const isSaving = savingDayId === day.id;
                    return (
                      <div key={day.id} className={styles.openingHoursRow}>
                        {/* Task 10.5d-ii-e — day label + its own `Closed`
                            `ToggleSwitch` grouped into one flex unit
                            (`.openingHoursDayGroup`), so the pair reads as
                            "this day, toggled by this control" and — since
                            `.openingHoursRow` itself wraps (10.5d-i-a) —
                            stays together on one line instead of the label
                            and its own toggle splitting across two lines
                            independently at narrow widths. Same `gap:
                            var(--space-sm)` `.nameRow` already uses for its
                            own tightly-related label+control pair
                            (heading + `StatusBadge`, Task 10.5a-iv-i). */}
                        <div className={styles.openingHoursDayGroup}>
                          <span className={styles.openingHoursDay}>
                            {DAY_LABELS[day.day_of_week]}
                          </span>

                          <ToggleSwitch
                            checked={draft.is_closed}
                            onChange={(checked) => updateDayDraft(day, { is_closed: checked })}
                            disabled={isSaving}
                            label="Closed"
                          />
                        </div>

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
                          {/* Task 10.5d-ii-g — `.openingHoursSaveLink`, not the
                              shared `.linkButton` (still serves Payment
                              methods' Edit and the menu link below): same
                              "new class per section" convention as
                              `.categoryEditLink` (10.5c-ii-b), plus a real
                              disabled look for the "Saving…" state. */}
                          <button
                            type="button"
                            className={styles.openingHoursSaveLink}
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

            {/* Task 10.5e-i-a — Service areas adopts the `.sectionCard` shell
                Categories (10.5c-i-a) and Opening hours (10.5d-i-a) already
                use. The header row (10.5e-i-b) needed no change. Task
                10.5e-i-c below moves "Add area" onto `.addPill`; the list
                rows (10.5e-ii) are still untouched. Payment methods keeps
                `.section` / `.addButton` until 10.5f-i-a / 10.5f-i-c. */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Service areas</h2>
                {/* Task 10.5e-i-c — `.addPill` here, matching Categories'
                    "Add category" (10.5c-i-c). Payment methods' "Add payment
                    method" keeps `.addButton` until 10.5f-i-c. */}
                <button type="button" className={styles.addPill} onClick={openAddServiceArea}>
                  Add area
                </button>
              </div>

              {serviceAreasError ? (
                /* Task 10.5e-ii-d — `.areaLoadError`, not the bare
                   `.formError` (that class still serves the profile form
                   above and Payment methods' own load error until its
                   task); copy unchanged. */
                <p className={styles.areaLoadError} role="alert">
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
                    /* Task 10.5e-ii-e — `.areasEmpty`, same trim
                       `.categoriesEmpty` (10.5c-ii-e) and
                       `.openingHoursEmpty` (10.5d-ii-c) already use
                       (`EmptyState`'s own whole-screen padding would
                       double up inside `.sectionCard`'s own padding);
                       copy unchanged. */
                    <EmptyState
                      title="No service areas yet"
                      description="Add the neighborhoods or areas you deliver to."
                      className={styles.areasEmpty}
                    />
                  }
                  renderItem={(serviceArea) => (
                    /* Task 10.5e-ii-c — `.areaRow`, not `.listRow` directly
                       (Payment methods keeps `.listRow` until 10.5f-ii-a):
                       adds `flex-wrap` so `.areaRowActions` drops to its
                       own line when the row is too narrow to hold the chip
                       and actions side by side. */
                    <div className={styles.areaRow}>
                      {/* Task 10.5e-ii-a — `.areaChip`, not `.listRowName`
                          (that class still serves Payment methods until
                          10.5f-ii-b). Neutral gray, not Categories' peach
                          — see `.areaChip`'s own CSS comment for why. */}
                      <span className={styles.areaChip}>{serviceArea.area_name}</span>
                      {/* Task 10.5e-ii-c — `.areaRowActions`, not
                          `.listRowActions` directly (same reasoning as
                          `.areaRow` above). */}
                      <div className={styles.areaRowActions}>
                        {/* Task 10.5e-ii-b — `.areaEditLink`/`.areaDeleteLink`,
                            not `.linkButton`/`.linkButtonDanger` directly
                            (those still back Opening hours' Save link,
                            Payment methods' Edit link, and the menu link). */}
                        <button
                          type="button"
                          className={styles.areaEditLink}
                          onClick={() => openEditServiceArea(serviceArea)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.areaDeleteLink}
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

            {/* Task 10.5f-i-a — Payment methods moves onto `.sectionCard`,
                the same treatment Categories (10.5c-i-a), Opening hours
                (10.5d-i-a) and Service areas (10.5e-i-a) already adopted.
                JSX-only wrapper swap (`styles.section` -> `styles.sectionCard`);
                this is the fourth and last section to move, so 10.5f-iii can
                now delete `.section`/`.addButton` (grep first). */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionHeading}>Payment methods</h2>
                {/* Task 10.5f-i-c — `.addPill`, matching "Add category"
                    (10.5c-i-c) and "Add area" (10.5e-i-c); this is the
                    fourth and last "Add..." button to move, so
                    `.addButton` is now unused (10.5f-iii's cleanup job). */}
                <button type="button" className={styles.addPill} onClick={openAddPaymentMethod}>
                  Add payment method
                </button>
              </div>

              {paymentMethodsError ? (
                /* Task 10.5f-ii-g — `.paymentMethodsLoadError`, not the
                   bare `.formError` (still serves the profile form and
                   the cover/logo upload errors above). Copy unchanged —
                   same "Couldn't load..." pattern `.categoryLoadError`
                   (10.5c-ii-d) and `.areaLoadError` (10.5e-ii-d) already
                   gave their own sections. */
                <p className={styles.paymentMethodsLoadError} role="alert">
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
                    /* Task 10.5f-ii-g — `.paymentMethodsEmpty`, same trim
                       `.categoriesEmpty` (10.5c-ii-e), `.openingHoursEmpty`
                       (10.5d-ii-c) and `.areasEmpty` (10.5e-ii-e) already
                       use (`EmptyState`'s own whole-screen padding would
                       double up inside `.sectionCard`'s own padding);
                       copy unchanged. This is the fourth and last card on
                       this page to get this trim. */
                    <EmptyState
                      title="No payment methods yet"
                      description="Add a bank account or mobile money number customers can pay to."
                      className={styles.paymentMethodsEmpty}
                    />
                  }
                  renderItem={(paymentMethod) => (
                    /* Task 10.5f-ii-a — `.paymentMethodRow`, not `.listRow`
                       directly: same "new class per section" reasoning
                       `.categoryRow` (10.5c-ii-c) and `.areaRow`
                       (10.5e-ii-c) already used. Unlike those two,
                       `.listRow` was already this shape's own class
                       (nothing else references it once Categories/Service
                       areas moved off it — see the CSS comment), so this
                       is a straight rename/duplicate rather than a new
                       recipe; the inner `.listRowName`/`.listRowActions`
                       are untouched here, left for 10.5f-ii-b/d/e. */
                    <div className={styles.paymentMethodRow}>
                      <div className={styles.paymentMethodInfo}>
                        {/* Task 10.5f-ii-b — `.paymentMethodName`, not
                            `.listRowName` (10.5f-ii-a's shell task left
                            this one alone; this is its own task).
                            Reference pixel-zoomed: "CBE" renders bold/dark,
                            not the plain-weight text `.listRowName` gave
                            it — matching `.categoryChip`'s/`.areaChip`'s
                            own `font-weight-semibold` choice. Color stays
                            `--color-text-primary`, unchanged from
                            `.listRowName` (already dark, already matches). */}
                        <span className={styles.paymentMethodName}>{paymentMethod.method_name}</span>
                        {/* `.paymentMethodMeta` (font-size-caption,
                            color-text-secondary) already existed before
                            this task and already matches the reference's
                            "Hagelom - 0988416048" line — verified by the
                            same pixel-zoom, no change needed here.
                            Separator stays " · " (the real, pre-existing
                            code value): this task's own line in
                            `TASKS.md` already documents the field as
                            `account_name · account_number`, and the
                            reference image's hyphen is not grounds to
                            change what the running code actually joins
                            with — a copy/format change is outside a
                            restyle task's scope. */}
                        <span className={styles.paymentMethodMeta}>
                          {paymentMethod.account_name} · {paymentMethod.account_number}
                        </span>
                        {/* Task 10.5f-ii-c — optional `instructions` line.
                            No reference exists for this one (Payment
                            methods' own reference row has no
                            instructions set), so the ask is just to
                            match the existing secondary-text style —
                            already true: this reuses `.paymentMethodMeta`,
                            the same class the account line above uses.
                            Conditional render (`&&`) was already correct:
                            shown only when `instructions` is present, no
                            placeholder/fallback text invented for when
                            it's absent. No code change needed. */}
                        {paymentMethod.instructions && (
                          <span className={styles.paymentMethodMeta}>{paymentMethod.instructions}</span>
                        )}
                        {/* Task 10.5f-ii-f — `.paymentMethodToggleError`,
                            not the bare `.formError` (that class still
                            serves the profile form above, and Categories'/
                            Service areas' own load errors keep their own
                            scoped classes). Copy unchanged — this renders
                            whatever `toggleActivePaymentMethod`'s catch
                            block set (the real server message, or the
                            existing fallback "Could not update this
                            payment method. Please try again."), not a
                            new string. Sits inside `.paymentMethodInfo`,
                            a column (`flex-direction: column`), not a row
                            like `.openingHoursRow` — so no `flex: 1 0
                            100%` is needed the way `.openingHoursError`
                            (10.5d-ii-g) needed one; `composes: formError`
                            alone is enough, same as `.categoryLoadError`/
                            `.areaLoadError`. */}
                        {toggleErrors[paymentMethod.id] && (
                          <p className={styles.paymentMethodToggleError} role="alert">
                            {toggleErrors[paymentMethod.id]}
                          </p>
                        )}
                      </div>
                      {/* Task 10.5f-ii-d — `.paymentMethodActions`, not
                          `.listRowActions` directly: same "new class per
                          section" convention `.paymentMethodRow`
                          (10.5f-ii-a) and `.paymentMethodName`
                          (10.5f-ii-b) already established. Introduced
                          here (not deferred to 10.5f-ii-e) because
                          checking the `ToggleSwitch`'s placement means
                          looking at the container it sits in — the Edit
                          button inside keeps `.linkButton` for now,
                          10.5f-ii-e's own job. */}
                      <div className={styles.paymentMethodActions}>
                        {/* Task 10.5f-ii-d — reference pixel-zoomed: order
                            is toggle, then "Active" label, then "Edit",
                            left to right. `ToggleSwitch`'s own `label`
                            prop already renders the text *after* the
                            track (see `ToggleSwitch.jsx`), and this div's
                            existing `display: flex` already places the
                            toggle group before the Edit button — already
                            correct, no reorder needed. `ToggleSwitch`
                            itself (its track/thumb colors, its label's
                            font/color, its 44px tap-height padding) is
                            Task 8.9a2's own already-built, already-
                            verified shared component — out of scope to
                            re-touch here for one caller. */}
                        <ToggleSwitch
                          checked={paymentMethod.is_active === 1}
                          onChange={() => toggleActivePaymentMethod(paymentMethod)}
                          disabled={togglingPaymentMethodId === paymentMethod.id}
                          label="Active"
                        />
                        {/* Task 10.5f-ii-e — `.paymentMethodEditLink`, not
                            `.linkButton` directly: same "new class per
                            section" convention `.categoryEditLink`
                            (10.5e-ii-b's sibling task on Categories) and
                            `.areaEditLink` (10.5e-ii-b) already used.
                            `.linkButton` still serves the menu-management
                            link below (10.5g's own task), so it stays in
                            place, untouched, for that caller. No Delete
                            button exists here, by design — Task 5.7's own
                            doc comment already states payment methods are
                            deactivated (the `ToggleSwitch` above), not
                            deleted; confirmed by reading this render:
                            only one action button, "Edit". */}
                        <button
                          type="button"
                          className={styles.paymentMethodEditLink}
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
              <Link to="/owner/restaurant/menu" className={styles.menuManagementLink}>
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
