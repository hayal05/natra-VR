import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import ImageUploadField from '../../components/ImageUploadField';
import RoleShell from '../../components/RoleShell';
import { useOrderCart } from '../../hooks';
import styles from './PaymentScreenshot.module.css';

/**
 * PaymentScreenshot — Payment screenshot upload screen, Task 3.14.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Payment" section: "Customer selects
 * one and uploads a payment screenshot" — this is the "uploads a
 * payment screenshot" half; Payment Method's (Task 3.13) own doc
 * comment already covers the "selects one" half.
 *
 * Reached from Payment Method's per-method tap, at
 * `/order/payment-screenshot`. Same "read the cart directly, don't rely
 * on router `state`" pattern every checkout screen since Customer Info
 * (Task 3.12) uses — this screen doesn't need anything Payment Method
 * would otherwise have to hand off, since `cart.paymentMethodId` is
 * already sitting in the same sessionStorage-backed cart.
 *
 * **An empty cart** renders the same "browse restaurants" `EmptyState`
 * every other checkout screen uses — same reasoning, not re-litigated
 * here. Unlike some later screen might, this one deliberately does NOT
 * also guard on `cart.paymentMethodId` being set (e.g. redirect back to
 * Payment Method if it's still `null`): no earlier checkout screen in
 * this codebase enforces that its own predecessor was completed either
 * (Payment Method itself only checks for an empty cart, not that
 * Customer Info was filled in first), so adding that guard only here
 * would be a new, inconsistent precedent rather than following one.
 *
 * **Picking a file** goes through `ImageUploadField` (Task 2.10), which
 * handles its own client-side compression and preview and hands back a
 * compressed `File` via `onChange` — this screen owns what happens
 * next: holding that `File` in local state until "Continue" is
 * pressed, per `ImageUploadField`'s own doc comment ("this component
 * doesn't upload anything itself ... leaves the actual `api.post`
 * multipart request to whichever screen owns that form's submit").
 * Task 8.4a/8.4b raised this call's own `maxDimension`/`quality` above
 * `ImageUploadField`'s defaults (see that prop's own comment at the
 * call site below) so this one screen's client-side recompression stays
 * closer to lossless than the default tuning chosen for the photo/logo/
 * cover uploads elsewhere in the app — a legible-text screenshot, not a
 * photo, is what's being compressed here.
 *
 * **Returning to this screen** after a successful upload (e.g. back
 * navigation from a later screen) shows the already-uploaded image via
 * `ImageUploadField`'s `value` prop sourced from
 * `cart.paymentScreenshotUrl`, exactly the "editing a form that already
 * has one" case that prop's own doc comment describes — so it doesn't
 * look like nothing was uploaded. "Continue" is enabled in that case
 * even with no new local file picked (re-uploading isn't required just
 * to move on).
 *
 * **On "Continue"**: if a new file was picked, it's uploaded via the
 * new public `POST /api/uploads/payment-screenshot`
 * (`backend/src/controllers/uploadController.js`'s
 * `uploadPaymentScreenshot` — the first real multipart route in this
 * codebase; see that file's own header comment for why this couldn't
 * stay deferred the way `foodController.js`'s `image_url` field still
 * is) as `multipart/form-data`, via the new `FormData` support this
 * task added to `frontend/src/api/client.js`. The returned `url` is
 * committed to the cart via `setPaymentScreenshotUrl` (this task's
 * addition to `useOrderCart`), then navigation moves on to
 * `/order/confirm` — Task 3.16's job to build for real; Task 3.15's
 * submit-order endpoint doesn't exist yet either, so this screen can't
 * actually submit anything yet, only get the screenshot durably stored
 * and ready for whichever of those two tasks needs it next. If no new
 * file was picked but `cart.paymentScreenshotUrl` already has a value
 * (the "returning to this screen" case above), "Continue" just
 * navigates on without a redundant re-upload.
 *
 * **Upload failures** (network error, or a 4xx from the endpoint, e.g.
 * an oversized file past multer's ceiling) surface as a page-level
 * error message with the button re-enabled to retry — not thrown out
 * of the click handler, since there's no error boundary above this
 * screen and a customer mid-checkout needs a way to try again rather
 * than a blank crashed page.
 */
export default function PaymentScreenshot() {
  const navigate = useNavigate();
  const { cart, setPaymentScreenshotUrl } = useOrderCart();

  const [pendingFile, setPendingFile] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isEmpty = cart.items.length === 0;
  const hasSomethingToContinueWith = Boolean(pendingFile) || Boolean(cart.paymentScreenshotUrl);

  const handleFileChange = (file) => {
    setFieldError(null);
    setUploadError(null);
    setPendingFile(file);
  };

  const handleContinue = async () => {
    if (!pendingFile) {
      // Already has a previously-uploaded screenshot from an earlier
      // visit to this screen — nothing new to send.
      navigate('/order/confirm');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', pendingFile);
      const { url } = await api.post('/uploads/payment-screenshot', formData, { auth: false });
      setPaymentScreenshotUrl(url);
      navigate('/order/confirm');
    } catch (err) {
      setUploadError(err.message || 'Could not upload the screenshot. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <RoleShell role="customer">
      <div className={styles.page}>
        <h1 className={styles.heading}>Payment screenshot</h1>

        {isEmpty ? (
          <EmptyState
            title="Your order is empty"
            description="Add a food from any restaurant to start an order."
            action={
              <button type="button" className={styles.primaryButton} onClick={() => navigate('/')}>
                Browse restaurants
              </button>
            }
          />
        ) : (
          <>
            <p className={styles.instructions}>
              Upload a screenshot showing your payment was sent for this order.
            </p>

            <ImageUploadField
              label="Payment screenshot"
              required
              value={cart.paymentScreenshotUrl}
              onChange={handleFileChange}
              onError={setFieldError}
              error={fieldError}
              disabled={isUploading}
              // Task 8.4a/8.4b — this screen is the one place in the app
              // where `ImageUploadField`'s own default client-side
              // recompression (1600px/quality 0.8, always re-encoded to
              // JPEG — see that component's own header comment) actively
              // worked against this exact upload's own documented intent:
              // `uploadController.js`'s `uploadPaymentScreenshot` already
              // passes `compress: false, generateThumbnail: false` to
              // `uploadToObjectStorage` specifically because "a reviewer
              // may want to zoom into exact pixels/text and any quality
              // loss is unwelcome" — but with no override here, every
              // screenshot was already being downscaled and lossily
              // recompressed client-side *before* it ever reached that
              // quality-preserving backend path, making the backend's own
              // `compress: false` effectively moot. Every other
              // `ImageUploadField` call site (`OwnerRestaurant.jsx`'s
              // cover/logo, `AddFood.jsx`'s photo) is left at the
              // defaults on purpose — those images genuinely are shown
              // downscaled in list/grid contexts, so the default's own
              // bandwidth-saving intent is exactly right there and
              // untouched by this fix.
              //
              // Raised to `maxDimension={2400}` (above the backend's own
              // 2000px `DEFAULT_MAX_DIMENSION` for the *main* image, so
              // this client-side step is never the tighter of the two
              // limits) and `quality={0.95}` (near-lossless for JPEG,
              // versus the default's 0.8) — legible text in a payment
              // app's screenshot is exactly the kind of content JPEG
              // compression artifacts (blocking/banding around sharp
              // edges) hurt most, unlike the photographic food/logo/cover
              // images the default tuning was chosen for. This narrows
              // the quality-loss gap without changing `ImageUploadField`
              // itself — the component still always re-encodes to JPEG
              // regardless of source type (including a PNG screenshot,
              // per that component's own header comment), so this isn't
              // truly lossless; skipping client-side re-encoding entirely
              // for this one call site would need a new prop on
              // `ImageUploadField` (e.g. `skipCompression`), which is a
              // real component change out of this audit task's own
              // scope, flagged here rather than built speculatively.
              maxDimension={2400}
              quality={0.95}
            />

            {uploadError && (
              <p className={styles.uploadError} role="alert">
                {uploadError}
              </p>
            )}

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleContinue}
              disabled={!hasSomethingToContinueWith || isUploading}
            >
              {isUploading ? 'Uploading…' : 'Continue'}
            </button>
          </>
        )}
      </div>
    </RoleShell>
  );
}
