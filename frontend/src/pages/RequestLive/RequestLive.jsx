import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageUploadField from '../../components/ImageUploadField';
import Wizard from '../../components/Wizard';
import { useApiQuery } from '../../hooks';
import styles from './RequestLive.module.css';

// Same "250 ETB" / "199.50 ETB" convention every other price-displaying
// screen in this codebase (RestaurantProfile.jsx, OrderBuilder.jsx,
// FoodDetails.jsx, TrackOrder.jsx, OrderHistory.jsx) redefines locally
// rather than importing from a shared module — not exported here either,
// for the same reason those files each give: this one-liner isn't worth
// a shared utility yet.
function formatFee(value) {
  const hasFraction = Math.round(value * 100) % 100 !== 0;
  return `${value.toFixed(hasFraction ? 2 : 0)} ETB`;
}

function fetchRegistrationInfo() {
  // `auth: false` — same reasoning `OwnerRegistration`/`OwnerLogin`
  // (4.1/4.2) use it for: this is `GET /api/admin-settings/registration`
  // (Task 4.3's new backend endpoint), a public route with no
  // `authMiddleware` at all (see that route's own header comment for
  // why — an owner reading this screen may not even be logged in this
  // session yet, and none of these five fields are sensitive).
  return api.get('/admin-settings/registration', { auth: false });
}

// The exact `steps` shape (keys/labels) `ComponentSandbox.jsx`'s own
// Wizard demo (Task 2.20) already previews with mock data — kept
// identical here rather than reinvented, so the sandbox's preview
// actually previews what this real screen looks like.
const WIZARD_STEPS = [
  { key: 'fee', label: 'Payment Info' },
  { key: 'upload', label: 'Upload Screenshot' },
];

/**
 * RequestLive — Tasks 4.3 (Step 1: fee/payment info) and 4.4 (Step 2:
 * payment screenshot upload), the "Request Live" screen.
 * `docs/NATRA_MASTER_PROMPT.md`'s registration flow, steps 2-3: "Request
 * Live" → "Show one-time registration fee and NATRA payment information".
 * Step 4 ("Owner pays manually") happens off-screen, in whatever payment
 * app the owner uses; this screen's only job is showing them what to pay
 * and where.
 *
 * **New backend endpoint this task adds**: `GET
 * /api/admin-settings/registration` (`adminSettingsController.js`),
 * reading the five `registration_*` columns off the `admin_settings`
 * singleton row (`docs/DB_SCHEMA.md`'s 0.10 section) an admin will
 * eventually configure via Task 6.12's Platform Settings screen — until
 * then, migration 0010's own seeded placeholder ('TBD'/0) is what this
 * screen shows, which is expected, not a bug.
 *
 * **Wizard (Task 2.20) used for real for the first time** — until now
 * only previewed against mock data in `ComponentSandbox` (2.21).
 * `Wizard.jsx`'s own doc comment names this exact flow ("registration
 * fee/payment info display → upload payment screenshot") as its one
 * concrete spec'd use. Task 4.3 built the wizard shell plus Step 1's
 * real content; **this task (4.4) builds Step 2's real content** — a
 * real `ImageUploadField` (Task 2.10), picking up where 4.3's own
 * placeholder ("Screenshot upload coming soon — see Task 4.4") left
 * off.
 *
 * **Reuses the existing public `POST /api/uploads/payment-screenshot`**
 * (`uploadController.js`'s `uploadPaymentScreenshot`, built for the
 * customer order flow's `PaymentScreenshot.jsx`, Task 3.14) rather than
 * a second, registration-specific upload endpoint — a stated reuse
 * decision, not an oversight: that endpoint is already generic (a bare
 * multipart `image` field, no order/restaurant id involved anywhere in
 * its request or response), already public (owner registration's own
 * Task 4.1/4.2 log entries establish the same "no `RoleShell`, no
 * assumed auth state" posture this screen carries), and already
 * uploads with `compress: false` — the same "a reviewer needs to zoom
 * into exact pixels/text" reasoning that endpoint's own header comment
 * gives for order payment screenshots applies identically to an admin
 * reviewing a registration payment (Task 6.x, not built yet). The one
 * real trade-off: both kinds of screenshot land in the same
 * `payment-screenshots/` Object Storage folder, indistinguishable by
 * path alone — acceptable since `uploadToObjectStorage` (1.5) already
 * names every object with a random suffix (never anything path-like
 * that would need to disambiguate context), and splitting the folder
 * would mean adding a second near-identical route+controller for zero
 * behavioral difference. Worth revisiting only if a future task
 * actually needs to enumerate/audit registration screenshots
 * separately from order ones by folder prefix — not needed by anything
 * named so far.
 *
 * **Upload happens on Submit (the wizard's `onComplete`), not on file
 * pick** — same "`ImageUploadField` doesn't upload anything itself"
 * division of responsibility `PaymentScreenshot.jsx` (3.14) already
 * established: this screen owns holding the picked `File` in local
 * state and deciding when the actual `multipart/form-data` request
 * fires. `isNextDisabled` on Step 2 is `true` until a file has been
 * picked (or one was already uploaded on an earlier visit to this
 * step), mirroring Step 1's own "can't proceed until this step's real
 * precondition is met" gating.
 *
 * **Task 4.5 (the submit endpoint) is now wired up** — `onComplete`
 * uploads the screenshot (if a new file was picked; a previously
 * uploaded URL from an earlier visit to this step is reused as-is,
 * exactly the way `uploadedUrl` already worked before this task), then
 * POSTs `{ payment_screenshot_url }` to the real, owner-authenticated
 * `POST /api/live-requests` (Task 4.5c) — `api.post`'s default `auth:
 * true` attaches the owner's bearer token via `tokenStorage` (Task 3.1),
 * same as every other owner-authenticated request in this codebase; no
 * `restaurant_id`/`amount` is ever sent from here, since 4.5b/4.5c both
 * enforce that server-side. **A successful submission navigates to
 * `/owner/live-status` (Task 4.6's real pending-state screen)** — this
 * screen no longer shows its own inline confirmation once that
 * navigation fires, since 4.6's screen re-fetches the just-created
 * request from `GET /api/live-requests/latest` itself rather than
 * needing anything handed off via router `state`.
 *
 * **Known gap, not this task's to fix**: `attachOwnerRestaurant.js`'s
 * own header comment (and this file's note below) already flag that no
 * restaurant-creation endpoint exists yet — a brand-new owner has a
 * `users` row but no `restaurants` row, so `attachOwnerRestaurant`
 * (mounted ahead of this controller) 403s before `submitLiveRequest`
 * ever runs. That means an owner genuinely cannot complete this screen
 * end-to-end in this codebase today; a 403 here surfaces as a plain
 * inline error (see `submitError` below) rather than a screen this task
 * can silently work around.
 *
 * **Loading/error states for the fee/payment fetch reuse the same
 * `EmptyState` shell** `RestaurantProfile.jsx`'s own menu section (Task
 * 3.8) already established for this exact "a query failed, offer Retry"
 * shape, rather than a bespoke one for this screen.
 *
 * **No `RoleShell` wrapper**, even now that Task 5.1 has wired up a real
 * owner nav: the standing `attachOwnerRestaurant.js` gap this screen's
 * own comments already flag (4.3/4.4/4.5 — a brand-new owner has a
 * `users` row but no `restaurants` row at all, still unresolved) means
 * an owner can reach this exact screen with no restaurant for the
 * Restaurant/Orders tabs to mean anything about yet. A mid-submission
 * Wizard flow (fee info → upload → submit) is also not somewhere a
 * bottom nav should invite navigating away from mid-step — this
 * screen's own `navigate('/owner/live-status')` on success is the
 * intended way out, not a tab tap.
 */
export default function RequestLive() {
  const navigate = useNavigate();
  const { data, error, loading, refetch } = useApiQuery(
    useCallback(() => fetchRegistrationInfo(), []),
    []
  );

  // Wizard (Task 2.20) manages its own `activeStep` internally and only
  // exposes it via `onStepChange` — mirrored into local state here
  // because `isNextDisabled` needs to mean something different per step
  // (see this file's own doc comment): Step 1's Next is gated on the
  // fee/payment fetch actually having succeeded, Step 2's Submit is
  // gated on a screenshot having been picked (or already uploaded on an
  // earlier visit to this step).
  const [activeStep, setActiveStep] = useState(0);

  // Step 2 state — same three-piece shape `PaymentScreenshot.jsx`
  // (Task 3.14) uses for the identical "pick now, upload on submit"
  // flow: the picked-but-not-yet-uploaded `File`, the uploaded URL once
  // that upload succeeds, and an in-flight flag for the Submit button's
  // own label/disabled state.
  const [pendingFile, setPendingFile] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Task 4.5d addition — the actual live_requests submission, once a
  // screenshot URL exists (either just uploaded, or from an earlier
  // visit to this step). `hasSubmitted` only needs to be a boolean now
  // (Task 4.6): a successful submission navigates straight to
  // `/owner/live-status` rather than rendering anything in place here,
  // so there's no reason to hold onto the created row itself — this
  // flag exists purely to keep `isNextDisabled` true for the brief
  // window between a successful POST and the navigation actually
  // unmounting this screen, so a second click can't double-submit.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const hasScreenshot = Boolean(pendingFile) || Boolean(uploadedUrl);
  const isNextDisabled =
    activeStep === 0
      ? loading || !!error
      : !hasScreenshot || isUploading || isSubmitting || hasSubmitted;

  const handleFileChange = (file) => {
    setFieldError(null);
    setUploadError(null);
    // A previously-uploaded screenshot is superseded the moment a new
    // file is picked — same "don't silently keep the old URL around
    // once it no longer matches what's shown" reasoning `useOrderCart`
    // (Task 3.10/3.13) already applies when a cart's own upstream
    // selection changes.
    setUploadedUrl(null);
    setPendingFile(file);
  };

  // Wizard's own `onComplete` fires only from its last step's Submit
  // button, and only when `isNextDisabled` is false — so by the time
  // this runs, either `pendingFile` or `uploadedUrl` is guaranteed set
  // (and, once a submission has already succeeded, `isNextDisabled`
  // stays true so this can't be called a second time for the same
  // request).
  const handleSubmitScreenshot = async () => {
    let screenshotUrl = uploadedUrl;

    if (pendingFile) {
      setUploadError(null);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', pendingFile);
        const { url } = await api.post('/uploads/payment-screenshot', formData, { auth: false });
        setUploadedUrl(url);
        setPendingFile(null);
        screenshotUrl = url;
      } catch (err) {
        setUploadError(err.message || 'Could not upload the screenshot. Please try again.');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // `screenshotUrl` is guaranteed set here — either just uploaded
    // above, or already present from an earlier visit to this step.
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // Owner-authenticated (Task 4.5c) — default `auth: true` attaches
      // the bearer token an earlier `/owner/login` (Task 4.2) visit
      // stored via `tokenStorage`. Never sends `restaurant_id`/`amount`
      // — both are resolved/read server-side (4.5b/4.5c).
      await api.post('/live-requests', {
        payment_screenshot_url: screenshotUrl,
      });
      // Task 4.6 — the real pending-state screen now exists; it
      // re-fetches the just-created request itself via
      // `GET /api/live-requests/latest`, so nothing needs to be handed
      // off via router `state` here.
      setHasSubmitted(true);
      navigate('/owner/live-status');
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Request to go Live</h1>
        <p className={styles.instructions}>
          Pay the one-time registration fee below, then upload your payment
          screenshot to submit your request.
        </p>

        <Wizard
          steps={WIZARD_STEPS}
          isNextDisabled={isNextDisabled}
          onStepChange={setActiveStep}
          onComplete={handleSubmitScreenshot}
          nextLabel="Continue"
          completeLabel={isUploading ? 'Uploading…' : isSubmitting ? 'Submitting…' : 'Submit'}
        >
          {(activeStep) =>
            activeStep === 0 ? (
              <div className={styles.stepBody}>
                {loading && <p className={styles.loadingText}>Loading payment info…</p>}

                {error && (
                  <EmptyState
                    title="Couldn't load payment info"
                    description="Check your connection and try again."
                    action={
                      <button type="button" className={styles.retryButton} onClick={refetch}>
                        Retry
                      </button>
                    }
                  />
                )}

                {data && (
                  <dl className={styles.feeInfo}>
                    <div className={styles.feeInfoRow}>
                      <dt>Registration fee</dt>
                      <dd className={styles.feeAmount}>
                        {formatFee(data.registration_fee_amount)}
                      </dd>
                    </div>
                    <div className={styles.feeInfoRow}>
                      <dt>Pay via</dt>
                      <dd>{data.registration_method_name}</dd>
                    </div>
                    <div className={styles.feeInfoRow}>
                      <dt>Account / phone number</dt>
                      <dd>{data.registration_account_number}</dd>
                    </div>
                    <div className={styles.feeInfoRow}>
                      <dt>Account name</dt>
                      <dd>{data.registration_account_name}</dd>
                    </div>
                    {data.registration_instructions && (
                      <div className={styles.feeInfoRow}>
                        <dt>Instructions</dt>
                        <dd>{data.registration_instructions}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            ) : (
              <div className={styles.stepBody}>
                <p className={styles.instructions}>
                  Upload a screenshot showing the registration fee payment
                  above was sent.
                </p>

                <ImageUploadField
                  label="Payment screenshot"
                  required
                  value={uploadedUrl}
                  onChange={handleFileChange}
                  onError={setFieldError}
                  error={fieldError}
                  disabled={isUploading || isSubmitting}
                />

                {uploadError && (
                  <p className={styles.uploadError} role="alert">
                    {uploadError}
                  </p>
                )}

                {submitError && (
                  <p className={styles.uploadError} role="alert">
                    {submitError}
                  </p>
                )}
              </div>
            )
          }
        </Wizard>
      </div>
    </div>
  );
}
