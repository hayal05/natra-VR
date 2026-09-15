import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { useApiQuery } from '../../hooks';
import styles from './LiveStatus.module.css';

// `live_requests.status`'s pending/approved/rejected (docs/DB_SCHEMA.md's
// 0.10 section) isn't in `StatusBadge.STATUS_TONE` — per that
// component's own doc comment, no reference-UI image shows this status,
// so assigning it a real color is "a design decision for whoever needs
// it next." This screen is that decision point, same way TrackOrder.jsx
// (3.17) and OrderHistory.jsx (3.18c) already made the equivalent call
// for `orders.status` — kept as a local, per-screen `tone` override
// rather than widening the shared map on a guess, following those two
// screens' own precedent exactly (see either of their doc comments for
// the full reasoning).
const LIVE_REQUEST_STATUS_TONE = {
  pending: 'neutral',
  approved: 'success',
  rejected: 'error',
};

// Same "don't add a date library for one field" `OrderHistory.jsx`
// (3.18c) already established for `orders.created_at` — `live_requests`
// has the identical plain-TIMESTAMP-as-ISO-string shape.
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fetchLatestLiveRequest() {
  // Owner-authenticated (Task 4.6's new `GET /api/live-requests/latest`)
  // — `auth: true` is the default, attaching the bearer token an earlier
  // `/owner/login` (4.2) visit stored via `tokenStorage`, same as every
  // other owner-scoped request in this codebase.
  return api.get('/live-requests/latest');
}

/**
 * LiveStatus — Task 4.6, "the pending-state screen" `docs/TASKS.md`
 * names it. Reached after a successful Request Live submission
 * (`RequestLive.jsx`'s `onComplete`, Task 4.5d) navigates here instead
 * of showing its own former inline "not built yet — see Task 4.6"
 * confirmation.
 *
 * **New backend endpoint this task adds**: `GET
 * /api/live-requests/latest` (`liveRequestController.js`'s `getLatest`),
 * reading the caller's own restaurant's single most recent
 * `live_requests` row via `liveRequests.findAllForOwner(...,
 * { orderBy: 'id', orderDir: 'DESC', limit: 1 })` — exactly the read
 * `models/liveRequests.js`'s own header comment (4.5a) already named
 * this task as needing. Returns `{ live_request: null }` (not a 404)
 * when the owner hasn't submitted a request at all — a real, expected
 * state, not an error.
 *
 * **Four states this screen actually renders**, driven entirely by
 * that response:
 *   - no request yet (`live_request === null`) — points the owner back
 *     at `/owner/request-live` (4.3-4.5).
 *   - `status: 'pending'` — "Awaiting admin approval", the task's own
 *     named case. Nothing for the owner to do here but wait; Phase 6's
 *     admin review screens are what will eventually change this.
 *   - `status: 'approved'` — the restaurant is Live. This is Task 4.7's
 *     own manual-DB-flip scenario ("confirm owner sees Live state") —
 *     this task builds that rendering path now, even though nothing yet
 *     drives it for real (Phase 6 admin approval doesn't exist), so 4.7
 *     has something real to verify against rather than needing its own
 *     follow-up build.
 *   - `status: 'rejected'` — points the owner back at
 *     `/owner/request-live` to submit a new request, per
 *     `docs/DB_SCHEMA.md`'s own "one restaurant can have multiple
 *     requests over time (e.g. rejected -> owner reapplies)" note.
 *
 * **A 403 here is NOT a generic fetch failure** — `attachOwnerRestaurant`
 * (1.15a) 403s an owner with no `restaurants` row at all, the same
 * long-standing, explicitly-flagged gap `RequestLive.jsx`'s (4.5d) own
 * doc comment already describes ("an owner genuinely cannot complete
 * this screen end-to-end in this codebase today"). A owner reaching
 * *this* screen already implies they got past that 403 once (Request
 * Live's own submission succeeded) — so in practice this path is
 * unreachable today, but it's handled as its own named message rather
 * than folded into the generic "couldn't load" retry state, since
 * retrying a 403 caused by a genuinely missing restaurant row would
 * never succeed no matter how many times the owner taps Retry.
 *
 * **Loading/error-with-Retry shell reuses the same `EmptyState`
 * pattern** `RequestLive.jsx`'s own Step 1 (4.3) and
 * `RestaurantProfile.jsx`'s menu section (3.8) already established for
 * "a query failed, offer Retry" — not a bespoke shape for this screen.
 *
 * **No `RoleShell` wrapper**, even now that Task 5.1 has wired up a real
 * owner nav — same updated reasoning `RequestLive.jsx`'s own comment
 * gives: the standing `attachOwnerRestaurant.js` gap means an owner can
 * reach this screen with no restaurant row at all, so a Restaurant/
 * Orders tab pointing at real management screens doesn't reliably apply
 * yet. The one case this reasoning fits least well is `approved` (the
 * owner does have a Live restaurant by then) — its own "Go to
 * dashboard" button is the deliberate bridge into `RoleShell` for that
 * case rather than wrapping this whole screen in it for one of its four
 * states.
 */
export default function LiveStatus() {
  const navigate = useNavigate();
  const { data, error, loading, refetch } = useApiQuery(
    useCallback(() => fetchLatestLiveRequest(), []),
    []
  );

  const isMissingRestaurant = error instanceof ApiError && error.status === 403;
  const liveRequest = data?.live_request ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {loading && <p className={styles.loadingText}>Checking your request status…</p>}

        {error && isMissingRestaurant && (
          <EmptyState
            title="No restaurant on your account yet"
            description="Your account isn't linked to a restaurant, so there's nothing to check status for."
          />
        )}

        {error && !isMissingRestaurant && (
          <EmptyState
            title="Couldn't load your request status"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        )}

        {!loading && !error && liveRequest === null && (
          <EmptyState
            title="You haven't requested to go Live yet"
            description="Pay the one-time registration fee and upload your payment screenshot to get started."
            action={
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate('/owner/request-live')}
              >
                Request to go Live
              </button>
            }
          />
        )}

        {!loading && !error && liveRequest?.status === 'pending' && (
          <>
            <div className={styles.statusHeader}>
              <h1 className={styles.heading}>Awaiting admin approval</h1>
              <StatusBadge status={liveRequest.status} tone={LIVE_REQUEST_STATUS_TONE.pending} />
            </div>
            <p className={styles.instructions}>
              We've received your registration payment screenshot. An admin will review it
              shortly — this page will show your restaurant as Live as soon as it's approved.
            </p>
            {liveRequest.created_at && (
              <p className={styles.metaText}>Submitted {formatDate(liveRequest.created_at)}</p>
            )}
            <button type="button" className={styles.retryButton} onClick={refetch}>
              Check again
            </button>
          </>
        )}

        {!loading && !error && liveRequest?.status === 'approved' && (
          <>
            <div className={styles.statusHeader}>
              <h1 className={styles.heading}>You're Live!</h1>
              <StatusBadge status={liveRequest.status} tone={LIVE_REQUEST_STATUS_TONE.approved} />
            </div>
            <p className={styles.instructions}>
              Your restaurant has been approved and is now visible to customers on NATRA.
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate('/owner/dashboard')}
            >
              Go to dashboard
            </button>
          </>
        )}

        {!loading && !error && liveRequest?.status === 'rejected' && (
          <>
            <div className={styles.statusHeader}>
              <h1 className={styles.heading}>Your request was rejected</h1>
              <StatusBadge status={liveRequest.status} tone={LIVE_REQUEST_STATUS_TONE.rejected} />
            </div>
            <p className={styles.instructions}>
              You can submit a new request once you've addressed the issue with your payment
              screenshot.
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate('/owner/request-live')}
            >
              Submit a new request
            </button>
          </>
        )}
      </div>
    </div>
  );
}
