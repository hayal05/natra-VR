import { useId, useRef, useState } from 'react';
import styles from './ImageUploadField.module.css';

// Mirrors the backend's own allow-list (backend/src/services/
// uploadToObjectStorage.js's EXTENSION_BY_MIME_TYPE) — no point letting
// the user pick a file type the server will reject anyway.
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Resizes+recompresses an image file entirely client-side via
 * <canvas>.toBlob, no extra dependency — this project already has zero
 * frontend deps beyond react/react-dom/react-router (package.json), and
 * this session's sandbox can't `npm install` anyway (same 403/no-egress
 * gap as 2.10/2.11), so adding one wasn't a real option even ignoring
 * the "keep deps minimal" precedent the backend's own hand-rolled OCI
 * client and Brevo calls already set.
 *
 * Always re-encodes to JPEG regardless of the source type (including
 * PNG), at `quality`. This app's images are all photos (food, logos,
 * covers, payment screenshots — docs/DB_SCHEMA.md's `*_url` columns),
 * never graphics that need alpha transparency, so losing PNG's alpha
 * channel isn't a real loss here and JPEG compresses photos far smaller
 * than PNG — the whole point of this task, given Ethiopian mobile data
 * costs/speeds (docs/NATRA_MASTER_PROMPT.md's Oracle Free Tier framing
 * already prioritizes low-resource operation). GIFs pass through this
 * same path too, which flattens any animation to its first frame — an
 * acceptable trade-off since nothing in the reference UI or master
 * prompt calls for animated uploads.
 *
 * `maxDimension` (default 1600) caps the longer side before re-encoding,
 * same purpose as the backend's own re-encode step (Task 1.6) but run
 * before upload so a multi-MB phone photo never has to leave the device
 * at full size in the first place — the backend's pass still runs too
 * and stays the authoritative guarantee, this is purely a bandwidth/
 * speed optimization on top of it, not a replacement for it.
 */
function compressImage(file, { maxDimension, quality }) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('Could not process this image.'));
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], newName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This file could not be read as an image.'));
    };

    img.src = objectUrl;
  });
}

/**
 * ImageUploadField — pick an image, see a preview, get back a
 * compressed File ready to send through `api.post` as multipart form
 * data. Used for logos/covers/food photos/payment screenshots wherever
 * those forms land (restaurant application, food CRUD, checkout,
 * settings — per docs/NATRA_MASTER_PROMPT.md).
 *
 * `value` is either an existing image URL (string — editing a form that
 * already has one, e.g. a food's current photo) or null/undefined. Once
 * the user picks a new file, the local compressed preview takes over
 * from `value` until the caller re-renders with a new saved URL — this
 * component doesn't upload anything itself (no `api` import here); it
 * only ever calls `onChange(file)` with the compressed File and leaves
 * the actual `api.post` multipart request to whichever screen owns that
 * form's submit, same separation FormField keeps from form-submit logic.
 *
 * Compression/read failures surface through `onError(message)` rather
 * than a thrown promise the caller has to catch, since there's no
 * natural place to await this component's internal async work from the
 * outside — same reasoning QuantityStepper/FormField stay plain
 * value+callback props instead of exposing imperative handles.
 */
export default function ImageUploadField({
  value,
  onChange,
  onError,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  maxDimension = 1600,
  quality = 0.8,
  id,
  className,
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const displayedPreview = previewUrl ?? value ?? null;
  const hasMessage = Boolean(error || helperText);
  const messageId = `${fieldId}-message`;

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    // Let the user re-pick the same filename later (browsers otherwise
    // suppress the change event for an identical selection).
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      onError?.(`Unsupported file type — please choose a JPEG, PNG, WebP, or GIF image.`);
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, { maxDimension, quality });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(compressed));
      onChange(compressed);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <div className={styles.preview}>
        {displayedPreview ? (
          <img src={displayedPreview} alt="" className={styles.previewImage} />
        ) : (
          <span className={styles.placeholder}>No image selected</span>
        )}
      </div>

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        disabled={disabled || isProcessing}
        required={required && !displayedPreview}
        onChange={handleFileSelected}
        aria-describedby={hasMessage ? messageId : undefined}
        aria-invalid={error ? true : undefined}
        className={styles.input}
      />

      <button
        type="button"
        className={styles.button}
        disabled={disabled || isProcessing}
        onClick={() => inputRef.current?.click()}
      >
        {isProcessing ? 'Processing…' : displayedPreview ? 'Change image' : 'Choose image'}
      </button>

      {hasMessage && (
        <p
          id={messageId}
          className={error ? styles.errorMessage : styles.helperMessage}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
