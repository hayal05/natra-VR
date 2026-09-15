import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageViewer from '../../components/ImageViewer';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AdminRestaurantDetail.module.css';

// Identical to AdminRestaurants.jsx's own `describeLiveState` — same
// "restaurants.live_status/is_suspended aren't a single field a
// StatusBadge status lookup can match, so a small owned helper derives
// the label/tone pair by hand" reasoning that file's own header comment
// gives, and the same "duplicated rather than imported, no shared
// module exists yet" precedent every copy of a backend-owned shape in
// this codebase already sets (see that file's own comment for the
// longer version of this reasoning).
function describeLiveState(restaurant) {
  if (Number(restaurant.is_suspended) === 1) {
    return { label: 'Suspended', tone: 'error' };
  }
  switch (restaurant.live_status) {
    case 'approved':
      return { label: 'Live', tone: 'success' };
    case 'pending':
      return { label: 'Pending review', tone: 'neutral' };
    case 'rejected':
      return { label: 'Rejected', tone: 'error' };
    default:
      return { label: 'Not requested', tone: 'neutral' };
  }
}

// Identical to OrderDetail.jsx's own `formatDateTime` — restaurants'
// `created_at`/`updated_at` are plain TIMESTAMP columns
// (docs/DB_SCHEMA.md's 0.6 section), same browser-default
// `Intl.DateTimeFormat` treatment, duplicated rather than imported for
// the same "no shared date util exists yet" reason every other copy of
// this function in this codebase already gives.
function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// `GET /api/admin/restaurants/:id` (Task 6.5a) returns `{ restaurant }`
// directly — no reshaping needed, same single-resource
// `useApiQuery`-straight-through shape `OrderDetail.jsx`'s own
// `fetchOrderDetail` already uses for `GET /api/orders/:id`.
function fetchRestaurantDetail(id, signal) {
  return api.get(`/admin/restaurants/${id}`, { signal });
}

// `PATCH /api/admin/restaurants/:id/suspension` (Task 6.8) — no `signal`
// param, same reasoning `OrderDetail.jsx`'s own `patchOrderStatus`/
// `AdminLiveRequestDetail.jsx`'s own `patchLiveRequestStatus` already
// give for every mutation in this codebase: a button press isn't
// something that races a superseded request the way a `useApiQuery`
// fetch does.
function patchRestaurantSuspension(id, isSuspended) {
  return api.patch(`/admin/restaurants/${id}/suspension`, { is_suspended: isSuspended });
}

/**
 * AdminRestaurantDetail — Task 6.5b. The "View details" half of
 * `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant management" list — 6.5a's
 * own new `GET /api/admin/restaurants/:id` is what this screen reads.
 * Reached by tapping a row on `AdminRestaurants.jsx` (Task 6.4b), whose
 * own doc comment had explicitly flagged "no tap-through to a detail
 * view (that's Task 6.5's job)" until now; this task also turns those
 * rows into real tap targets pointed at `/admin/restaurants/:id` (see
 * that file's own diff). Wrapped in `RoleShell role="admin"`, same as
 * every other admin screen.
 *
 * **Suspend/Reactivate (Task 6.8) added on top of 6.5b's display-only
 * screen** — this doc comment previously flagged both actions as 6.8's
 * job, landing here rather than a third screen, exactly as it
 * anticipated (view-details/review/approve-reject/suspend-reactivate
 * are still four distinct line items in `docs/NATRA_MASTER_PROMPT.md`'s
 * own list — no edit/delete form was ever added, per that list's very
 * next line, which this screen still honors). Wired to
 * `PATCH /api/admin/restaurants/:id/suspension` (6.8's own backend half)
 * via the same `useMutation` call/`handleSuspensionChange` helper shape
 * `AdminLiveRequestDetail.jsx`'s own Approve/Reject buttons (6.7d)
 * already established: fire on click, `refetch()` on success, leave the
 * error in a banner on failure — not an optimistic flip, so a
 * failed PATCH leaves `StatusBadge` showing the real last-known state
 * rather than one that never actually saved.
 *
 * **Button only shows for an `approved` restaurant** — `docs/DB_SCHEMA.md`'s
 * own `is_suspended` column comment scopes the action to "an approved
 * restaurant," so a `not_requested`/`pending`/`rejected` restaurant (none
 * of which is Live to begin with) shows no Suspend/Reactivate control at
 * all, only its `describeLiveState` badge — same "no button whose only
 * purpose doesn't apply here" reasoning `AdminLiveRequestDetail.jsx`'s own
 * `pending`-only Approve/Reject gating already follows, just against
 * `live_status` instead of a `statusTransition` 409.
 *
 * **Not-found is a real 404, not an ownership ambiguity** — unlike
 * `OrderDetail.jsx`'s own "can't tell not-found from not-yours apart"
 * note (that screen's `ownershipMiddleware` 404s identically for both
 * cases): `requireAdmin` has no per-caller resource to scope by at all,
 * same reasoning `AdminRestaurants.jsx`'s own "no `noRestaurantYet` 403
 * branching" note already gives for the list screen this one's reached
 * from. A 404 here only ever means the id genuinely doesn't exist.
 *
 * **Logo/cover use `ImageViewer`** (Task 2.6), same "tap a thumbnail,
 * see it full-screen" treatment `OrderDetail.jsx`'s own payment
 * screenshot already established — the first *admin* screen to use it,
 * but the same component, same reasoning: an admin reviewing a
 * restaurant's profile photos benefits from the same full-screen
 * inspection an owner's payment screenshot does. Both are optional
 * (`logo_url`/`cover_url` are nullable per `docs/DB_SCHEMA.md`) and
 * simply omitted when null, rather than rendering an empty/broken
 * `ImageViewer`.
 */
export default function AdminRestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback((signal) => fetchRestaurantDetail(id, signal), [id]);
  const { data, loading, error, refetch } = useApiQuery(fetchDetail, [id]);

  const {
    mutate: mutateSuspension,
    error: suspensionError,
    loading: suspensionUpdating,
  } = useMutation(patchRestaurantSuspension);

  const notFound = error instanceof ApiError && error.status === 404;

  function handleSuspensionChange(isSuspended) {
    mutateSuspension(id, isSuspended)
      .then(() => refetch())
      .catch(() => {
        // Surfaced via `suspensionError` below.
      });
  }

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/admin/restaurants')}
        >
          ← Restaurants
        </button>

        {error ? (
          <EmptyState
            title={notFound ? 'Restaurant not found' : "Couldn't load this restaurant"}
            description={
              notFound
                ? "This restaurant doesn't exist."
                : 'Check your connection and try again.'
            }
            action={
              notFound ? undefined : (
                <button type="button" className={styles.retryButton} onClick={refetch}>
                  Retry
                </button>
              )
            }
          />
        ) : loading || !data ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          (() => {
            const { restaurant } = data;
            const liveState = describeLiveState(restaurant);

            return (
              <div className={styles.card}>
                {restaurant.cover_url && (
                  <ImageViewer
                    src={restaurant.cover_url}
                    alt={`${restaurant.name} cover photo`}
                    thumbnailClassName={styles.coverThumbnail}
                    className={styles.coverThumbnail}
                  />
                )}

                <div className={styles.header}>
                  {restaurant.logo_url && (
                    <ImageViewer
                      src={restaurant.logo_url}
                      alt={`${restaurant.name} logo`}
                      thumbnailClassName={styles.logoThumbnail}
                      className={styles.logoThumbnail}
                    />
                  )}
                  <div className={styles.headerText}>
                    <span className={styles.name}>{restaurant.name}</span>
                    <div className={styles.badges}>
                      <StatusBadge label={liveState.label} tone={liveState.tone} />
                      <StatusBadge status={restaurant.is_open ? 'open' : 'closed'} />
                    </div>
                  </div>
                </div>

                {restaurant.description && (
                  <p className={styles.description}>{restaurant.description}</p>
                )}

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Contact</h2>
                  <dl className={styles.detailList}>
                    <dt>Phone</dt>
                    <dd>{restaurant.phone}</dd>
                    <dt>Location</dt>
                    <dd>{restaurant.location_text || '—'}</dd>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Registered</h2>
                  <dl className={styles.detailList}>
                    <dt>Created</dt>
                    <dd>{formatDateTime(restaurant.created_at)}</dd>
                    {restaurant.updated_at && (
                      <>
                        <dt>Last updated</dt>
                        <dd>{formatDateTime(restaurant.updated_at)}</dd>
                      </>
                    )}
                  </dl>
                </section>

                {restaurant.live_status === 'approved' && (
                  <div className={styles.actionRow}>
                    {Number(restaurant.is_suspended) === 1 ? (
                      <button
                        type="button"
                        className={styles.reactivateButton}
                        disabled={suspensionUpdating}
                        onClick={() => handleSuspensionChange(false)}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.suspendButton}
                        disabled={suspensionUpdating}
                        onClick={() => handleSuspensionChange(true)}
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                )}
                {suspensionError && (
                  <p className={styles.actionError}>
                    {suspensionError.message ||
                      'Could not update this restaurant. Please try again.'}
                  </p>
                )}
              </div>
            );
          })()
        )}
      </div>
    </RoleShell>
  );
}
