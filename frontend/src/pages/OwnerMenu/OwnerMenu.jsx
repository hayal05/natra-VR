import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ListWithPagination from '../../components/ListWithPagination';
import Modal from '../../components/Modal';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { usePaginatedQuery } from '../../hooks';
import styles from './OwnerMenu.module.css';

// Identical "250 ETB" / "199.50 ETB" convention as FoodDetails.jsx/
// Home.jsx/RestaurantProfile.jsx/OrderBuilder.jsx's own `formatPrice` —
// not imported, same "cheaper to duplicate one small formatter than
// build a shared-utils module for it" call those files already made.
function formatPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value)) return null;
  const hasFraction = !Number.isInteger(value);
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// `foodController.js`'s `list` sends `{ foods, meta }` over the wire —
// reshaped to `{ rows, meta }` here before handing it to
// `usePaginatedQuery`, same rename `fetchPaymentMethods` in
// OwnerRestaurant.jsx (Task 5.7) already does for the same reason (see
// that file's own header comment for the `fetchCategories`/
// `fetchServiceAreas` pre-existing bug this rename avoids repeating).
function fetchFoods({ page }, signal) {
  return api
    .get(`/foods?page=${page}`, { signal })
    .then(({ foods, meta }) => ({ rows: foods, meta }));
}

/**
 * OwnerMenu — Task 5.9b, "food list screen with Edit/Delete/Hide
 * actions". The frontend half of Task 5.9; the backend half (5.9a) added
 * `PATCH /api/foods/:id/visibility` and had `GET /api/foods`/
 * `GET /api/foods/:id` start returning each food's `is_hidden` — see
 * `backend/README.md`'s own "Task 5.9a" entry for that side.
 *
 * **A new route, not another `OwnerRestaurant.jsx` section** — every
 * other Restaurant-tab sub-resource (categories/opening hours/service
 * areas/payment methods, Tasks 5.4-5.7) lives inline on that one page as
 * its own `<section>`, but that file's own header comment already flags
 * it as a candidate to "revisit ... if the page gets unwieldy" — and
 * Menu management is three tasks (5.9 list, 5.10 add, 5.11 edit), not
 * one CRUD section, with an Add/Edit form each substantial enough to
 * want its own screen rather than a `Modal`. So this is a new page at
 * `/owner/restaurant/menu`, reached via a link from `OwnerRestaurant.jsx`
 * (replacing that file's former "Menu management lands here in a later
 * task" placeholder line) rather than a fifth `RoleShell` owner nav tab —
 * `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant owner navigation" section
 * names exactly four tabs, and Menu management isn't one of them; it's a
 * sub-page of the Restaurant tab, the same relationship Track Order/
 * Order History (Task 3.17/3.18) have to their own bottom-nav tab.
 *
 * **Add and Edit both link to the real `AddFood.jsx` screen now**
 * (Tasks 5.10/5.11 — Edit is the same component, not a second one; see
 * that file's own doc comment for how it switches modes off the `:id`
 * route param). Nothing about this task's own work depended on either
 * existing for real at the time it was written.
 *
 * **Delete**: same `Modal`-confirmation shape as Categories/Service
 * areas (Tasks 5.4/5.6) in `OwnerRestaurant.jsx` — a separate
 * confirmation `Modal` instance, not the add/edit modal repurposed,
 * since this screen has no add/edit modal of its own to repurpose (Add/
 * Edit are full pages, 5.10/5.11's job).
 *
 * **Hide/Show is a text action, not a `ToggleSwitch`** — unlike Payment
 * methods' `is_active` (Task 5.7), which reuses the same
 * `ToggleSwitch` component opening hours (5.5) already established for
 * an owner-controlled 0/1 column, `docs/TASKS.md`'s own wording for this
 * task is "Edit/Delete/**Hide** actions" — a third same-shaped action
 * alongside Edit/Delete, not a switch. Rendered as a link-style button
 * whose label flips between "Hide"/"Show" (mirroring Edit/Delete's own
 * `linkButton`/`linkButtonDanger` styling), with its own per-row
 * `togglingFoodId`/`toggleErrors` state — the same "inline one-field
 * PATCH, no modal, no shared mutation state" shape 5.5b's per-day save
 * and 5.7's payment-method toggle both already use for exactly this
 * kind of action.
 *
 * A `StatusBadge` shows each row's current Hidden/Visible state, reusing
 * that component's existing `success`/`error` tones — the same
 * semantic pairing `is_open`'s Open/Closed badge (Task 5.8) already
 * established (available-to-customers = success, unavailable = error),
 * not a fabricated color for a status the reference UI never shows
 * (per `StatusBadge.jsx`'s own header comment on that point): a hidden
 * food, like a closed restaurant, is simply unavailable to customers
 * right now.
 */
export default function OwnerMenu() {
  const {
    items: foods,
    meta,
    loading,
    error,
    setPage,
    refetch,
  } = usePaginatedQuery(fetchFoods, []);

  const [foodToDelete, setFoodToDelete] = useState(null);
  const [deletingFood, setDeletingFood] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [togglingFoodId, setTogglingFoodId] = useState(null);
  const [toggleErrors, setToggleErrors] = useState({});

  async function confirmDeleteFood() {
    setDeleteError(null);
    setDeletingFood(true);
    try {
      await api.delete(`/foods/${foodToDelete.id}`);
      setFoodToDelete(null);
      refetch();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this food. Please try again.');
    } finally {
      setDeletingFood(false);
    }
  }

  async function toggleHidden(food) {
    setToggleErrors((prev) => ({ ...prev, [food.id]: undefined }));
    setTogglingFoodId(food.id);
    try {
      await api.patch(`/foods/${food.id}/visibility`, { is_hidden: food.is_hidden !== 1 });
      refetch();
    } catch (err) {
      setToggleErrors((prev) => ({
        ...prev,
        [food.id]: err.message || 'Could not update this food. Please try again.',
      }));
    } finally {
      setTogglingFoodId(null);
    }
  }

  return (
    <RoleShell role="owner">
      <div className={styles.page}>
        <Link to="/owner/restaurant" className={styles.backLink}>
          ← Back to Restaurant
        </Link>

        <div className={styles.sectionHeader}>
          <h1 className={styles.heading}>Menu</h1>
          <Link to="/owner/restaurant/menu/new" className={styles.addButton}>
            Add food
          </Link>
        </div>

        {error ? (
          <EmptyState
            title="Couldn't load your menu"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : (
          <ListWithPagination
            items={foods}
            getItemKey={(food) => food.id}
            isLoading={loading}
            loadingLabel="Loading your menu…"
            meta={meta}
            onPageChange={setPage}
            ariaLabel="Menu items"
            emptyState={
              <EmptyState
                title="No foods yet"
                description="Add a food to your menu to get started."
                action={
                  <Link to="/owner/restaurant/menu/new" className={styles.addButton}>
                    Add food
                  </Link>
                }
              />
            }
            renderItem={(food) => {
              const isHidden = food.is_hidden === 1;
              return (
                <div className={styles.listRow}>
                  <div className={styles.foodInfo}>
                    <div className={styles.foodNameRow}>
                      <span className={styles.listRowName}>{food.name}</span>
                      <StatusBadge
                        status={isHidden ? 'hidden' : 'visible'}
                        label={isHidden ? 'Hidden' : 'Visible'}
                        tone={isHidden ? 'error' : 'success'}
                      />
                    </div>
                    {formatPrice(food.price) && (
                      <span className={styles.foodMeta}>{formatPrice(food.price)}</span>
                    )}
                    {toggleErrors[food.id] && (
                      <p className={styles.formError} role="alert">
                        {toggleErrors[food.id]}
                      </p>
                    )}
                  </div>
                  <div className={styles.listRowActions}>
                    <Link to={`/owner/restaurant/menu/${food.id}/edit`} className={styles.linkButton}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => toggleHidden(food)}
                      disabled={togglingFoodId === food.id}
                    >
                      {togglingFoodId === food.id ? '…' : isHidden ? 'Show' : 'Hide'}
                    </button>
                    <button
                      type="button"
                      className={styles.linkButtonDanger}
                      onClick={() => setFoodToDelete(food)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      <Modal
        isOpen={foodToDelete !== null}
        onClose={() => setFoodToDelete(null)}
        title="Delete food?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setFoodToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={confirmDeleteFood}
              disabled={deletingFood}
            >
              {deletingFood ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className={styles.modalText}>
          Delete &ldquo;{foodToDelete?.name}&rdquo;? This can&rsquo;t be undone.
        </p>

        {deleteError && (
          <p className={styles.formError} role="alert">
            {deleteError}
          </p>
        )}
      </Modal>
    </RoleShell>
  );
}
