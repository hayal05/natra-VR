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
  // Task 10.5a-i — additive-only overlay layout, opted into per caller.
  // With `overlay` unset (every pre-Phase-10 call site), nothing below
  // changes rendering at all: `label` still renders as a normal visible
  // `<label>`, `.preview`/`.button` keep their existing classes/position.
  // With `overlay` true, the preview box becomes the full-width "hero"
  // photo (sizing controlled entirely by the caller via `mediaClassName`,
  // same "component supplies the hook, caller supplies the CSS" pattern
  // `EntityCard`'s own `mediaAspectRatio`/`mediaClassName`-shaped props
  // already use elsewhere in this codebase) and the button renders as a
  // small overlaid pill in its bottom-right corner instead of a separate
  // block below. `label` is still rendered for its real purpose (this
  // input's accessible name) but visually hidden, since the reference
  // this mode is built for shows no separate "Cover photo" text — the
  // photo itself is self-explanatory content, not a labeled form field
  // the way a bare-preview upload field is.
  overlay = false,
  mediaClassName,
  chooseLabel = 'Choose image',
  changeLabel = 'Change image',
  // Task 10.5a-ii — second additive, opt-in layout (mutually exclusive
  // with `overlay`; `badge` wins if both are passed). Same "every
  // pre-Phase-10 call site renders unchanged" guarantee as `overlay`
  // above: none of the rules/markup below apply without the prop.
  //
  // `badge` renders a compact square tile — the logo badge that overlaps
  // a cover hero's bottom-left corner — in which the *whole tile is the
  // upload button* (no separate "Change image" button next to it; there
  // is no room for one on a ~72–96px badge). Its visible caption is the
  // same `chooseLabel`/`changeLabel` copy, so callers pass e.g. "Add
  // logo"/"Edit logo" — those are the button's accessible name (and the
  // empty-state text that fills the tile). Width comes from the caller
  // (`className`), the tile is always square. `label` is visually hidden,
  // as in `overlay`.
  badge = false,
  // `badgeCaption` — the short text actually shown on the tile once it
  // has an image (default: `changeLabel`). Separate from `changeLabel`
  // because the full accessible name ("Change logo") measured ~82px wide
  // at the 12px caption size, against ~66px of room on the smallest
  // 72px badge — it wrapped to two lines and covered half the logo. A
  // one-word caption ("Edit") fits on one line; passing a `changeLabel`
  // that *contains* the caption ("Edit logo" ⊃ "Edit") keeps the visible
  // text inside the accessible name (WCAG 2.5.3, label in name).
  badgeCaption,
  // `messageId` — when set, this field does NOT render its own
  // error/helper `<p>`; the caller renders that text itself, under this
  // id, wherever its layout has room (the field still wires
  // `aria-describedby`/`aria-invalid` to it). Needed because a badge is
  // pulled up over the photo above it with a negative margin and is only
  // ~72–96px wide: a message rendered *inside* this field would either
  // sit under the badge (overlapped) or wrap in a ~80px column.
  messageId: externalMessageId,
  // Task 11.5a-i — third additive, opt-in layout (mutually exclusive
  // with `overlay`/`badge`; checked first below, so `compact` wins if
  // more than one is ever passed — every pre-Phase-11 call site,
  // `overlay`/`badge` ones included, renders unchanged without it).
  //
  // `compact` is a single collapsed row — icon, a two-line title/
  // subtitle text block, and a trailing chevron, the whole row tappable
  // as one control — built for the Checkout page's "Upload payment
  // screenshot" row (Task 11.5), which has no room for a standalone
  // preview box plus a separate button the way a form page does.
  //
  // This task (11.5a-i) only builds the shell itself: a bordered,
  // rounded container that switches to a dashed border in the empty
  // state (no image picked/`value` yet) versus a solid border once one
  // exists — same "empty state looks visually different from filled"
  // idea `.placeholder`/`.badgePlaceholder` already carry elsewhere,
  // just expressed as a dashed border here since a one-line row has no
  // room for a dedicated empty-state text block the way a whole preview
  // box does. The icon (11.5a-ii), title/subtitle text (11.5a-iii) and
  // chevron (11.5a-iv) are each their own later sub-task — none of that
  // content exists yet, so the shell below renders with only its own
  // accessible name (`aria-label`, same pattern `badgeButton` already
  // uses) and no visible content until those tasks land.
  compact = false,
  // Task 11.5a-ii — first piece of real content inside the `compact`
  // shell. Same shape/convention as `FormField`'s own `icon` prop
  // (Task 11.3): a pre-built node the caller passes (e.g.
  // `<CameraIcon />` from `components/icons`, Task 11.0c), not a name/
  // type string — this component doesn't guess what the glyph looks
  // like, it only places it. Decorative only (the button's accessible
  // name still comes from `aria-label`, same as `FormField`'s label
  // icon is `aria-hidden` because the label text already names the
  // field), so it's wrapped in an `aria-hidden` span here too.
  //
  // Unlike `FormField`'s bare `.labelIcon` (a plain glyph sized by CSS,
  // no background of its own), the reference
  // (`docs/reference_ui/phase11_checkout_reference.jpg`) shows this
  // icon sitting inside its own small tinted square rather than bare
  // against the row's background — so `.compactIcon` gets a
  // `color-mix()`-derived primary tint background, the same
  // reuse-existing-tokens approach `StatTile`/`StatusBadge` already use
  // for their own tinted fills, rather than a new flat hex token.
  //
  // Purely additive: `icon` is optional (undefined for any caller that
  // doesn't pass one, including every non-`compact` call site), so
  // nothing renders here without it. Title/subtitle text (11.5a-iii)
  // and the trailing chevron (11.5a-iv) are still separate later tasks
  // — this shell has only the icon slot after this change.
  icon,
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const displayedPreview = previewUrl ?? value ?? null;
  const hasMessage = Boolean(error || helperText);
  const ownMessageId = `${fieldId}-message`;
  const describedById = externalMessageId ?? ownMessageId;

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

  const buttonLabel = isProcessing ? 'Processing…' : displayedPreview ? changeLabel : chooseLabel;
  // Badge tile text. While processing it says "Wait…" rather than
  // `buttonLabel`'s "Processing…": that is ~72px at this size and would
  // break mid-word in a ~66px tile (it's only on screen for the fraction
  // of a second the client-side compression takes).
  const badgeText = isProcessing ? 'Wait…' : displayedPreview ? (badgeCaption ?? changeLabel) : chooseLabel;

  return (
    <div
      className={[
        styles.field,
        overlay && styles.fieldOverlay,
        badge && styles.fieldBadge,
        compact && styles.fieldCompact,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className={[styles.label, (overlay || badge || compact) && styles.srOnly].filter(Boolean).join(' ')}
        >
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      {compact ? (
        // 11.5a-i built the shell; 11.5a-ii added the icon slot;
        // 11.5a-iii added the title/subtitle text block; 11.5a-iv (below)
        // adds the trailing chevron. Accessible name is still
        // `buttonLabel` via `aria-label`, same `badgeButton`-style
        // approach as before: everything inside is `aria-hidden`, so
        // none of it changes what this button is announced as.
        <button
          type="button"
          aria-label={buttonLabel}
          className={[styles.compactShell, !displayedPreview && styles.compactShellEmpty]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled || isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          {/* Task 11.5b-i — thumbnail swap. Once `displayedPreview`
              exists (a freshly-picked local file's blob preview, or an
              already-uploaded `value` URL on a return visit — same
              single source either way, per 11.5b-iii, so both render
              identically here), it replaces the `icon` slot rather than
              sitting alongside it: a compact row only has room for one
              36×36 leading glyph, and once there's a real photo, that
              photo *is* the more useful thing to show there — same
              "the image replaces the placeholder" idea `.badgeButton`'s
              own image-vs-`.badgePlaceholder` swap already uses, just
              applied to a smaller slot. `icon` itself is untouched
              (still whatever the caller passed) and reappears the
              moment `displayedPreview` goes away, e.g. `value` reset. */}
          {displayedPreview ? (
            <span className={styles.compactThumbnail} aria-hidden="true">
              <img src={displayedPreview} alt="" className={styles.compactThumbnailImage} />
            </span>
          ) : (
            icon && (
              <span className={styles.compactIcon} aria-hidden="true">
                {icon}
              </span>
            )
          )}
          {/* Task 11.5a-iii — title/subtitle text block. No new prop
              invented: the bold title is just `chooseLabel`/`changeLabel`
              (the same accessible-name copy `buttonLabel` already builds
              from below — mirrored here as visible text rather than a
              second string), and the subtitle is the existing
              `helperText` prop, reused rather than duplicated, same as
              `label`/`helperText` already get reused as visible copy
              elsewhere in this component. `aria-hidden` on the whole
              block: the button's accessible name is still `buttonLabel`
              via `aria-label` above, so this visible text would
              otherwise be announced twice. Wrapped in `flex: 1` so
              11.5a-iv's trailing chevron has a fixed slot to sit after
              it rather than being pushed off by a long title/subtitle.
              Task 11.5b-ii — once `displayedPreview` exists, the title
              already reads `changeLabel` for free (that's what
              `buttonLabel` already resolves to below); the subtitle,
              though, drops entirely rather than continuing to show the
              "Take a screenshot…"-style `helperText` prompt copy, since
              that copy describes what to do in the *empty* state and
              would be stale/misleading once a screenshot is selected —
              no replacement subtitle string invented, the row is just a
              single `changeLabel` title once filled. */}
          <span className={styles.compactText} aria-hidden="true">
            <span className={styles.compactTitle}>{buttonLabel}</span>
            {helperText && !displayedPreview && (
              <span className={styles.compactSubtitle}>{helperText}</span>
            )}
          </span>
          {/* Task 11.5a-iv — trailing chevron affordance, same precedent
              11.4b-iii already set for this codebase (a plain `>` text
              character, not a new icon asset — this component's own
              11.0c icon set has no chevron/disclosure glyph, and one
              wasn't worth adding for a single character). `aria-hidden`
              for the same reason as the icon/text block above: it's
              decorative, the row's accessible name is still
              `buttonLabel`. */}
          <span className={styles.compactChevron} aria-hidden="true">
            &gt;
          </span>
        </button>
      ) : badge ? (
        // Accessible name is the full `buttonLabel` ("Edit logo"), not
        // the shorter visible caption; the `<img>` is decorative
        // (`alt=""`), same as every other preview here.
        <button
          type="button"
          aria-label={buttonLabel}
          className={styles.badgeButton}
          disabled={disabled || isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          {displayedPreview ? (
            <>
              <img src={displayedPreview} alt="" className={styles.badgeImage} />
              <span className={styles.badgeCaption}>{badgeText}</span>
            </>
          ) : (
            <span className={styles.badgePlaceholder}>{badgeText}</span>
          )}
        </button>
      ) : (
        <div
          className={[styles.preview, overlay && styles.previewOverlay, overlay && mediaClassName]
            .filter(Boolean)
            .join(' ')}
        >
          {displayedPreview ? (
            <img src={displayedPreview} alt="" className={styles.previewImage} />
          ) : (
            <span className={styles.placeholder}>No image selected</span>
          )}

          {overlay && (
            <button
              type="button"
              className={styles.buttonOverlay}
              disabled={disabled || isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              {buttonLabel}
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        disabled={disabled || isProcessing}
        required={required && !displayedPreview}
        onChange={handleFileSelected}
        aria-describedby={hasMessage ? describedById : undefined}
        aria-invalid={error ? true : undefined}
        className={styles.input}
      />

      {!overlay && !badge && !compact && (
        <button
          type="button"
          className={styles.button}
          disabled={disabled || isProcessing}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </button>
      )}

      {/* 11.5a-iii: in `compact` mode, `helperText` is already shown as
          the row's own subtitle line above — rendering it again down
          here would duplicate it. An `error`, though, isn't shown in the
          row (the subtitle always shows `helperText`, not `error`), so
          it still needs this paragraph even in compact mode. */}
      {hasMessage && !externalMessageId && !(compact && !error) && (
        <p
          id={ownMessageId}
          className={error ? styles.errorMessage : styles.helperMessage}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
