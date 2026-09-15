import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageViewer from '../../components/ImageViewer';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AdminLiveRequestDetail.module.css';

// Identical to AdminRestaurants.jsx's/AdminLiveRequests.jsx's own
// `describeLiveState`-style helper, but simpler: `live_requests.status`
// (docs/DB_SCHEMA.md's 0.10 section) is a single raw column here, not a
// derived restaurant-wide state, so there's no `is_suspended` override to
// check first — just the three values `submitLiveRequest.js`/6.7's
// Approve/Reject (`updateLiveRequestStatus.js`) can ever set it to.
function describeStatus(status) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', tone: 'success' };
    case 'rejected':
      return { label: 'Rejected', tone: 'error' };
    default:
      return { label: 'Pending review', tone: 'neutral' };
  }
}

// Identical to OwnerOrders.jsx's/AdminLiveRequests.jsx's own
// `formatPrice` — duplicated per this codebase's established no-shared-
// currency-util precedent.
function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

// Identical to AdminRestaurantDetail.jsx's own `formatDateTime` —
// `live_requests.created_at`/`registration_payments.submitted_at` are
// plain TIMESTAMP columns (docs/DB_SCHEMA.md's 0.10 section), same
// browser-default `Intl.DateTimeFormat` treatment.
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

// `GET /api/admin/live-requests/:id` (Task 6.6c) returns `{ live_request }`
// directly — no reshaping needed, same single-resource
// `useApiQuery`-straight-through shape `AdminRestaurantDetail.jsx`'s own
// `fetchRestaurantDetail` already uses for `GET /api/admin/restaurants/:id`.
function fetchLiveRequestDetail(id, signal) {
  return api.get(`/admin/live-requests/${id}`, { signal });
}

// `PATCH /api/admin/live-requests/:id/status` (Task 6.7c) — no `signal`
// param, same reasoning `OrderDetail.jsx`'s own `patchOrderStatus`
// already gives for every mutation in this codebase: a button press
// isn't something that races a superseded request the way a
// `useApiQuery` fetch does.
function patchLiveRequestStatus(id, status) {
  return api.patch(`/admin/live-requests/${id}/status`, { status });
}

/**
 * AdminLiveRequestDetail — Task 6.6f. The "Review Live requests"/"View
 * payment screenshot" half of `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant
 * management" list — 6.6c's own `GET /api/admin/live-requests/:id` is what
 * this screen reads. Reached by tapping a row on `AdminLiveRequests.jsx`
 * (6.6e), whose own doc comment had explicitly flagged "no tap-through yet
 * (that's 6.6f's job)" until now; this task also turns those rows into
 * real tap targets pointed at `/admin/live-requests/:id` (see that file's
 * own diff), same "6.4b lists, 6.5b adds tap-through" staging
 * `AdminRestaurants.jsx`/`AdminRestaurantDetail.jsx` already established.
 *
 * **Approve/Reject (Task 6.7d) added on top of 6.6f's display-only
 * screen** — this doc comment previously flagged both actions as 6.7's
 * job, landing here rather than a third screen, exactly as it
 * anticipated. Wired to `PATCH /api/admin/live-requests/:id/status`
 * (6.7c) via the same `useMutation` call/`handleStatusChange` helper
 * shape `OrderDetail.jsx`'s own Accept/Reject/Complete buttons (5.14b/
 * 5.15) already established: fire on click, `refetch()` on success, leave
 * the error in a banner on failure — not an optimistic status flip, so a
 * rejected/failed PATCH (e.g. someone else already reviewed this request
 * — 6.7a/6.7b's own 409) leaves `StatusBadge` showing the real
 * last-known status rather than one that never actually saved.
 *
 * **Buttons only render for a `pending` request** — same "which buttons
 * render is a plain function of status" reasoning `OrderDetail.jsx`'s own
 * doc comment gives: `updateLiveRequestStatus.js`'s transitions map
 * (6.7a/6.7b) would 409 an out-of-turn Approve/Reject attempt anyway
 * (`approved`/`rejected` are both terminal, no outgoing transitions), but
 * there's no reason to show a button whose only possible outcome is that
 * error — an already-reviewed request (reached fresh via 6.6c's own
 * no-status-filter detail read, or via `refetch()` right after this
 * screen's own successful mutation) shows its `StatusBadge` with no
 * action row underneath.
 *
 * **Status shown, unlike the list screen** — `AdminLiveRequests.jsx`
 * (6.6e) skips a status badge entirely since 6.6a's queue is hardcoded to
 * `pending`-only; this screen has no such filter (6.6c's own "detail
 * reads aren't curated the way list reads are" note), so a request that's
 * already been approved/rejected — reached via a stale link, or a future
 * reviewed-history view — can land here and needs to say so, via a new
 * `describeStatus` (simpler than `AdminRestaurantDetail.jsx`'s own
 * `describeLiveState`, since there's no `is_suspended` override to check
 * first).
 *
 * **Two distinct dates** — `created_at` (when the `live_requests` row
 * itself was created, i.e. when the owner started the flow) and
 * `submitted_at` (`registration_payments.submitted_at`, when the payment
 * evidence was actually submitted) are separate columns per
 * `docs/DB_SCHEMA.md`'s 0.10 section and shown as separate fields rather
 * than collapsed into one, since `submitLiveRequest.js` can create both
 * rows in the same transaction but the two timestamps aren't guaranteed
 * identical.
 *
 * **Payment screenshot uses `ImageViewer`** (Task 2.6), same "small
 * thumbnail, opens full-screen when tapped" treatment
 * `OrderDetail.jsx`'s/`AdminRestaurantDetail.jsx`'s own screenshots/photos
 * already use — this is the whole reason the queue exists (6.6a's own
 * header comment), so unlike those two optional/nullable cases this one
 * is always rendered, never conditionally omitted.
 *
 * **Not-found is a real 404**, same reasoning `AdminRestaurantDetail.jsx`'s
 * own note already gives: `requireAdmin` has no per-caller resource to
 * scope by, so a 404 here only ever means the id genuinely doesn't exist.
 */
export default function AdminLiveRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback((signal) => fetchLiveRequestDetail(id, signal), [id]);
  const { data, loading, error, refetch } = useApiQuery(fetchDetail, [id]);

  const {
    mutate: mutateStatus,
    error: statusError,
    loading: statusUpdating,
  } = useMutation(patchLiveRequestStatus);

  const notFound = error instanceof ApiError && error.status === 404;

  function handleStatusChange(status) {
    mutateStatus(id, status)
      .then(() => refetch())
      .catch(() => {
        // Surfaced via `statusError` below.
      });
  }

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/admin/live-requests')}
        >
          ← Live Requests
        </button>

        {error ? (
          <EmptyState
            title={notFound ? 'Live request not found' : "Couldn't load this request"}
            description={
              notFound ? "This request doesn't exist." : 'Check your connection and try again.'
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
            const { live_request: liveRequest } = data;
            const statusState = describeStatus(liveRequest.status);

            return (
              <div className={styles.card}>
                <div className={styles.header}>
                  <span className={styles.name}>{liveRequest.restaurant_name}</span>
                  <StatusBadge label={statusState.label} tone={statusState.tone} />
                </div>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Payment</h2>
                  <dl className={styles.detailList}>
                    <dt>Amount</dt>
                    <dd>{formatPrice(liveRequest.amount)}</dd>
                    <dt>Submitted</dt>
                    <dd>{formatDateTime(liveRequest.submitted_at)}</dd>
                  </dl>
                  <ImageViewer
                    src={liveRequest.payment_screenshot_url}
                    alt={`${liveRequest.restaurant_name} payment screenshot`}
                    thumbnailClassName={styles.screenshotThumbnail}
                    className={styles.screenshotThumbnail}
                  />
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Request</h2>
                  <dl className={styles.detailList}>
                    <dt>Requested</dt>
                    <dd>{formatDateTime(liveRequest.created_at)}</dd>
                  </dl>
                </section>

                {liveRequest.status === 'pending' && (
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.approveButton}
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange('approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={styles.rejectButton}
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange('rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {statusError && (
                  <p className={styles.actionError}>
                    {statusError.message || 'Could not update this request. Please try again.'}
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
