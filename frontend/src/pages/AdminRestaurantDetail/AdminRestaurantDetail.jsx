import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageViewer from '../../components/ImageViewer';
import RoleShell from '../../components/RoleShell';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AdminRestaurantDetail.module.css';

function describeLiveState(restaurant) {
  if (Number(restaurant.is_suspended) === 1) return { label: 'Suspended', tone: 'error' };
  switch (restaurant.live_status) {
    case 'approved': return { label: 'Live', tone: 'success' };
    case 'pending': return { label: 'Pending review', tone: 'neutral' };
    case 'rejected': return { label: 'Rejected', tone: 'error' };
    default: return { label: 'Not requested', tone: 'neutral' };
  }
}

function describeLiveRequestStatus(status) {
  switch (status) {
    case 'approved': return { label: 'Approved', tone: 'success' };
    case 'rejected': return { label: 'Rejected', tone: 'error' };
    default: return { label: 'Pending review', tone: 'neutral' };
  }
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatPrice(price) {
  const value = Number(price);
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

function fetchRestaurantDetail(id, signal) {
  return api.get(`/admin/restaurants/${id}`, { signal });
}

function patchRestaurantSuspension(id, isSuspended) {
  return api.patch(`/admin/restaurants/${id}/suspension`, { is_suspended: isSuspended });
}

// Uses the existing approval API. No new Live Request mutation endpoint is
// introduced here; the same backend transition used by AdminLiveRequestDetail
// remains the source of truth for approval/rejection.
function patchLiveRequestStatus(id, status) {
  return api.patch(`/admin/live-requests/${id}/status`, { status });
}

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

  const {
    mutate: mutateLiveRequestStatus,
    error: liveRequestError,
    loading: liveRequestUpdating,
  } = useMutation(patchLiveRequestStatus);

  const notFound = error instanceof ApiError && error.status === 404;

  function handleSuspensionChange(isSuspended) {
    mutateSuspension(id, isSuspended)
      .then(() => refetch())
      .catch(() => {});
  }

  function handleLiveRequestStatusChange(status, liveRequestId) {
    mutateLiveRequestStatus(liveRequestId, status)
      .then(() => refetch())
      .catch(() => {});
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
            description={notFound ? "This restaurant doesn't exist." : 'Check your connection and try again.'}
            action={notFound ? undefined : (
              <button type="button" className={styles.retryButton} onClick={refetch}>Retry</button>
            )}
          />
        ) : loading || !data ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          (() => {
            const { restaurant, live_request: liveRequest } = data;
            const liveState = describeLiveState(restaurant);
            const requestState = liveRequest ? describeLiveRequestStatus(liveRequest.status) : null;

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

                {restaurant.description && <p className={styles.description}>{restaurant.description}</p>}

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Contact</h2>
                  <dl className={styles.detailList}>
                    <dt>Phone</dt><dd>{restaurant.phone}</dd>
                    <dt>Location</dt><dd>{restaurant.location_text || '—'}</dd>
                  </dl>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Registered</h2>
                  <dl className={styles.detailList}>
                    <dt>Created</dt><dd>{formatDateTime(restaurant.created_at)}</dd>
                    {restaurant.updated_at && <><dt>Last updated</dt><dd>{formatDateTime(restaurant.updated_at)}</dd></>}
                  </dl>
                </section>

                {liveRequest && (
                  <section className={styles.section}>
                    <div className={styles.header}>
                      <div className={styles.headerText}>
                        <h2 className={styles.sectionTitle}>Live Request</h2>
                        <StatusBadge label={requestState.label} tone={requestState.tone} />
                      </div>
                    </div>

                    <dl className={styles.detailList}>
                      <dt>Payment amount</dt>
                      <dd>{formatPrice(liveRequest.amount)}</dd>
                      <dt>Payment submitted</dt>
                      <dd>{formatDateTime(liveRequest.submitted_at)}</dd>
                      <dt>Request created</dt>
                      <dd>{formatDateTime(liveRequest.created_at)}</dd>
                    </dl>

                    {liveRequest.payment_screenshot_url && (
                      <ImageViewer
                        src={liveRequest.payment_screenshot_url}
                        alt={`${restaurant.name} payment screenshot`}
                        thumbnailClassName={styles.coverThumbnail}
                        className={styles.coverThumbnail}
                      />
                    )}

                    {liveRequest.status === 'pending' && (
                      <div className={styles.actionRow}>
                        <button
                          type="button"
                          className={styles.reactivateButton}
                          disabled={liveRequestUpdating}
                          onClick={() => handleLiveRequestStatusChange('approved', liveRequest.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className={styles.suspendButton}
                          disabled={liveRequestUpdating}
                          onClick={() => handleLiveRequestStatusChange('rejected', liveRequest.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {liveRequestError && (
                      <p className={styles.actionError}>
                        {liveRequestError.message || 'Could not update this request. Please try again.'}
                      </p>
                    )}
                  </section>
                )}

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
                    {suspensionError.message || 'Could not update this restaurant. Please try again.'}
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
