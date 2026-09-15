import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import ImageUploadField from '../../components/ImageUploadField';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AddFood.module.css';

// Mirrors `backend/src/controllers/foodController.js`'s own
// `createFoodSchema`/`updateFoodSchema` limits exactly (`NAME_MAX_LENGTH`/
// `DESCRIPTION_MAX_LENGTH`/`MAX_PRICE` — identical on both schemas) —
// same "the owner finds out here, while still typing, rather than
// getting bounced by the endpoint" reasoning `OwnerRegistration.jsx`'s
// own top-of-file comment already gives for its own copied constants.
const NAME_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_PRICE = 99999999.99;

// `?limit=100` rather than a paginated `usePaginatedQuery` the way
// OwnerRestaurant.jsx's own Categories *section* (Task 5.4) fetches
// them: this is a single `<select>`'s option list, not a browsable
// list with its own pager, so all of a restaurant's categories in one
// request is the right shape here — 100 is `paginate.js`'s own
// `MAX_LIMIT` ceiling, comfortably above any real restaurant's category
// count. Reshapes `{ categories, meta }` (`categoryController.js`'s
// `list`) down to just the array this screen actually renders options
// from, rather than repeating the `{ rows, meta }`-shaped
// `fetchCategories` bug `OwnerRestaurant.jsx`'s own header comment
// already flags as pre-existing and not this task's to fix.
//
// Task 8.7b: this query's own `error` used to be dropped entirely (only
// `data`/`loading` were destructured where this is called below), and a
// failed fetch fell back to `categories ?? []` — indistinguishable, to
// the category `FormField`'s own `helperText` logic, from a restaurant
// that genuinely has zero categories, so it confidently showed "No
// categories yet — you can add some from the Restaurant tab." on a
// plain network failure. 8.7a's own audit flagged this as worse than a
// silent gap: a wrong, confident explanation with no reason for the
// owner to retry. `error`/`refetch` are both captured now — see the
// category `FormField`'s own `error` prop and the retry line right
// below it.
function fetchCategories(signal) {
  return api.get('/categories?limit=100', { signal }).then((data) => data.categories);
}

// `foodId` is undefined in Add mode (`/owner/restaurant/menu/new`),
// where there's obviously nothing to fetch — resolving to `null`
// immediately rather than skipping the hook call entirely, since hooks
// can't be conditional; `useApiQuery`'s own `deps` (`[foodId]`) still
// keys correctly off it either way.
function fetchFood(foodId) {
  return (signal) =>
    foodId ? api.get(`/foods/${foodId}`, { signal }).then((data) => data.food) : Promise.resolve(null);
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Enter a food name.';

  const price = values.price.trim();
  if (!price) {
    errors.price = 'Enter a price.';
  } else {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors.price = 'Price must be a number greater than 0.';
    } else if (parsed > MAX_PRICE) {
      errors.price = `Price cannot exceed ${MAX_PRICE}.`;
    } else if (Number(parsed.toFixed(2)) !== parsed) {
      errors.price = 'Price can have at most 2 decimal places.';
    }
  }

  return errors;
}

/**
 * AddFood — Task 5.10, "Menu management: Add Food form (name, photo,
 * description, price, category)", extended by Task 5.11 to also serve
 * as the Edit Food form ("reuse Add Food form" — `docs/TASKS.md`'s own
 * wording for 5.11, not a suggestion to build a second, near-identical
 * screen). One component, two routes:
 *   - `/owner/restaurant/menu/new` (Add, no `:id` param)
 *   - `/owner/restaurant/menu/:id/edit` (Edit)
 * `useParams()`'s `id` is the only thing that distinguishes the two —
 * everything below (`isEditing = Boolean(foodId)`) branches off that
 * single value rather than two copies of the same JSX existing as
 * separate files, the same "one component, mode-derived from a prop/
 * param" shape `OwnerRestaurant.jsx`'s own category/service-area/
 * payment-method modals already use for their own add/edit split
 * (`categoryModal.mode === 'edit'`), just keyed off a route param here
 * instead of local modal state.
 *
 * **A full page, not a `Modal`** — unchanged from 5.10's own reasoning;
 * `OwnerMenu.jsx`'s header comment already made this call for Menu
 * management generally.
 *
 * **Edit mode fetches the existing food** via `GET /api/foods/:id`
 * (`foodController.js`'s `getOne`, unchanged since 1.15d, already
 * behind `ownershipMiddleware` so another owner's food 404s here the
 * same way it does everywhere else) and seeds `values`/the photo
 * preview from it exactly once — a `seededRef` guard, same shape
 * `OwnerRestaurant.jsx`'s own profile-form seeding (5.2) already uses,
 * so a background refetch (there isn't one here, but the guard costs
 * nothing) could never stomp an owner's in-progress edits. `price` is
 * seeded via `String(existingFood.price)` since `FormField`'s
 * `type="number"` input wants a string value like every other
 * controlled field in this codebase, not the raw number the API
 * returns. A fetch error (another owner's food, a deleted food) shows
 * the same `EmptyState` shape `FoodDetails.jsx` (3.9) already
 * established for a single-resource load failure, with no path back
 * into a form that has nothing real to edit.
 *
 * **Photo upload is deferred to submit, not immediate-on-pick** — unlike
 * `OwnerRestaurant.jsx`'s logo/cover fields (Task 5.3), which upload the
 * moment a file is chosen because there's already a saved `restaurants`
 * row to `PATCH` with the result, this screen (in *both* modes, for
 * consistency — not just Add) holds the compressed `File`
 * `ImageUploadField` hands back in local state until the actual submit.
 * Same "uploading is a step of saving the form, not of picking the
 * file" shape `PaymentScreenshot.jsx` (Task 3.14) established. In Edit
 * mode, `ImageUploadField`'s `value` falls back to the food's existing
 * `image_url` whenever no new file has been picked yet, so reopening
 * Edit shows the current photo rather than looking like there isn't
 * one — the exact "editing a form that already has one" case that
 * component's own doc comment describes.
 *
 * **`POST /api/uploads/food-photo`** (Task 5.10's new route) is reused
 * as-is for Edit's photo changes too — it only ever turns a file into a
 * URL, never writes to a `foods` row, so there was nothing mode-specific
 * about it to begin with. See `backend/README.md`'s own "Task 5.10"
 * entry for that route's full writeup.
 *
 * **On submit**: if a new photo was picked, it's uploaded first to get
 * a fresh `image_url` (and, since Task 8.4c-ii's prerequisite migration
 * 0012, `image_thumbnail_url` from that same upload response — carried
 * forward from the existing food in Edit mode exactly like `image_url`
 * whenever no new photo was picked); otherwise the existing `image_url` (Edit mode)
 * or `null` (Add mode, no photo picked) is sent — so both modes always
 * submit a complete payload with every field the schema accepts, not a
 * partial one, even though `PATCH /api/foods/:id`
 * (`updateFoodSchema`) would accept a partial update. Sending the full
 * shape either way is what lets `saveFood` below be a single one-line
 * branch (`foodId ? api.patch(...) : api.post(...)`) rather than two
 * differently-shaped payload builders. A failed photo upload surfaces
 * its own inline error next to the image field and stops the flow
 * there in both modes — this screen never silently saves with a
 * dropped photo just because the upload step failed.
 *
 * **Category is optional** — unchanged from 5.10's own reasoning; see
 * that entry above for why the select's first option is a real
 * "Uncategorized" choice (`category_id: null`) rather than
 * `FormField`'s own `placeholder` slot.
 *
 * **On success**: navigates back to `/owner/restaurant/menu` in both
 * modes, so the change (new food, or an edited one) shows up in
 * `OwnerMenu.jsx`'s (5.9b) list immediately via that screen's own
 * fetch-on-mount.
 */
export default function AddFood() {
  const navigate = useNavigate();
  const { id: foodId } = useParams();
  const isEditing = Boolean(foodId);

  const {
    data: existingFood,
    loading: foodLoading,
    error: foodError,
  } = useApiQuery(fetchFood(foodId), [foodId]);

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useApiQuery(fetchCategories, []);

  const [values, setValues] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
  });
  const [touched, setTouched] = useState({});

  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [photoFieldError, setPhotoFieldError] = useState(null);
  const [photoUploadError, setPhotoUploadError] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && existingFood) {
      setValues({
        name: existingFood.name,
        description: existingFood.description ?? '',
        price: String(existingFood.price),
        categoryId: existingFood.category_id != null ? String(existingFood.category_id) : '',
      });
      seededRef.current = true;
    }
  }, [existingFood]);

  const saveFood = (payload) =>
    isEditing ? api.patch(`/foods/${foodId}`, payload) : api.post('/foods', payload);

  const { mutate, error: saveError, loading: isSaving } = useMutation(saveFood);

  const errors = validate(values);
  const isSubmitting = isUploadingPhoto || isSaving;
  const notFound = foodError instanceof ApiError && foodError.status === 404;

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePhotoChange = (file) => {
    setPhotoFieldError(null);
    setPhotoUploadError(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPendingPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  // A real first option, not `FormField`'s `placeholder` prop — that
  // prop renders a `disabled hidden` prompt option (see FormField.jsx's
  // own select branch), meant for "must actively choose one" fields.
  // "Uncategorized" here is a genuine, always-selectable choice (the
  // `category_id: null` case `foodController.js`'s `categoryIdSchema`
  // explicitly allows, per this file's own header comment), not a
  // placeholder standing in for a required pick.
  const categoryOptions = [
    { value: '', label: 'Uncategorized' },
    ...(categories ?? []).map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, price: true });
    if (Object.keys(errors).length > 0) return;

    let imageUrl = existingFood?.image_url ?? null;
    // `image_thumbnail_url` (Task 8.4c-ii prerequisite, migration 0012) —
    // same "carry the existing value forward unless a new photo was
    // picked" treatment as `imageUrl` right above; see that migration's
    // own header comment for why this field exists (the upload response
    // has always returned `thumbnailUrl`, this screen just never saved
    // it before now).
    let imageThumbnailUrl = existingFood?.image_thumbnail_url ?? null;
    if (pendingPhoto) {
      setPhotoUploadError(null);
      setIsUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('image', pendingPhoto);
        const { url, thumbnailUrl } = await api.post('/uploads/food-photo', formData);
        imageUrl = url;
        imageThumbnailUrl = thumbnailUrl ?? null;
      } catch (err) {
        setPhotoUploadError(err.message || 'Could not upload the photo. Please try again.');
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    const description = values.description.trim();

    try {
      await mutate({
        name: values.name.trim(),
        description: description === '' ? null : description,
        price: Number(values.price.trim()),
        category_id: values.categoryId === '' ? null : Number(values.categoryId),
        image_url: imageUrl,
        image_thumbnail_url: imageThumbnailUrl,
      });
      navigate('/owner/restaurant/menu');
    } catch {
      // Surfaced via `saveError` state below; nothing further to do here.
    }
  };

  const displayedPhoto = photoPreviewUrl ?? existingFood?.image_url ?? null;
  const isLoadingExistingFood = isEditing && (foodLoading || !existingFood) && !foodError;

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate('/owner/restaurant/menu')}
        >
          ← Back to Menu
        </button>

        <h1 className={styles.heading}>{isEditing ? 'Edit food' : 'Add food'}</h1>

        {foodError ? (
          <EmptyState
            title={notFound ? 'Food not found' : "Couldn't load this food"}
            description={
              notFound
                ? "This food isn't available anymore."
                : 'Check your connection and try again.'
            }
          />
        ) : isLoadingExistingFood ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <ImageUploadField
              label="Photo"
              value={displayedPhoto}
              onChange={handlePhotoChange}
              onError={setPhotoFieldError}
              error={photoFieldError || photoUploadError}
              helperText={isUploadingPhoto ? 'Uploading…' : 'Optional — shown on your menu and this food’s details page.'}
              disabled={isSubmitting}
            />

            <FormField
              label="Name"
              required
              value={values.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Doro Wat"
              error={touched.name ? errors.name : undefined}
              disabled={isSubmitting}
            />

            <FormField
              as="textarea"
              label="Description"
              value={values.description}
              onChange={handleChange('description')}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="Tell customers what's in it."
              helperText="Optional."
              disabled={isSubmitting}
            />

            <FormField
              label="Price (ETB)"
              type="number"
              required
              value={values.price}
              onChange={handleChange('price')}
              onBlur={handleBlur('price')}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              error={touched.price ? errors.price : undefined}
              disabled={isSubmitting}
            />

            <FormField
              as="select"
              label="Category"
              value={values.categoryId}
              onChange={handleChange('categoryId')}
              options={categoryOptions}
              error={categoriesError ? "Couldn't load categories." : undefined}
              helperText={
                categoriesLoading
                  ? 'Loading categories…'
                  : categoryOptions.length === 1
                    ? 'No categories yet — you can add some from the Restaurant tab.'
                    : 'Optional.'
              }
              disabled={isSubmitting || categoriesLoading}
            />
            {categoriesError && (
              <div className={styles.categoryFieldFooter}>
                <button
                  type="button"
                  className={styles.retryButtonInline}
                  onClick={refetchCategories}
                >
                  Retry
                </button>
              </div>
            )}

            {saveError && (
              <p className={styles.formError} role="alert">
                {saveError.message ||
                  (isEditing ? 'Could not save this food. Please try again.' : 'Could not add this food. Please try again.')}
              </p>
            )}

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isUploadingPhoto
                ? 'Uploading photo…'
                : isSaving
                  ? isEditing
                    ? 'Saving…'
                    : 'Adding…'
                  : isEditing
                    ? 'Save changes'
                    : 'Add food'}
            </button>
          </form>
        )}
      </div>
    </RoleShell>
  );
}
