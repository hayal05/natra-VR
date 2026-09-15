import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ImageViewer.module.css';

/**
 * ImageViewer — a tappable thumbnail that opens the same image full-screen.
 *
 * Documented usage (docs/NATRA_MASTER_PROMPT.md, "Order details"): "Payment
 * screenshot is a small thumbnail and opens full-screen when tapped." That's
 * the only concrete spec this has to satisfy — no pinch-zoom/pan is called
 * for anywhere, so this deliberately stays a plain contained image in an
 * overlay, not an image-zoom widget.
 *
 * Renders the full-screen overlay through a portal into document.body
 * rather than in place, so it isn't clipped by an ancestor's
 * `overflow: hidden` — e.g. EntityCard's card container (Task 2.3) — and
 * so its z-index only has to beat page content, not fight a specific
 * parent's stacking context.
 *
 * Task 2.15 (`Modal`, "base, used to host ImageViewer/confirmations") comes
 * after this one in TASKS.md, so ImageViewer can't be built on top of it
 * yet — it has its own minimal overlay for now. Once Modal exists, folding
 * this into it (rather than keeping two overlay implementations) is a
 * reasonable follow-up, not part of this task.
 */
export default function ImageViewer({
  src,
  alt = '',
  thumbnailSrc,
  className,
  thumbnailClassName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    // Move focus into the overlay, lock background scroll, and restore
    // both when it closes — standard modal-overlay behavior, needed here
    // specifically because this renders outside the normal DOM flow.
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={[styles.thumbnailButton, thumbnailClassName]
          .filter(Boolean)
          .join(' ')}
        onClick={open}
        aria-haspopup="dialog"
      >
        <img
          className={[styles.thumbnail, className].filter(Boolean).join(' ')}
          src={thumbnailSrc ?? src}
          alt={alt}
          loading="lazy"
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label={alt || 'Image'}
            onClick={close}
          >
            <button
              type="button"
              ref={closeButtonRef}
              className={styles.closeButton}
              onClick={close}
              aria-label="Close"
            >
              &times;
            </button>
            <img
              className={styles.fullImage}
              src={src}
              alt={alt}
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
