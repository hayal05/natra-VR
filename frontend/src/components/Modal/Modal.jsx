import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Modal — the base overlay this codebase's own TASKS.md (2.15) describes
 * as meant to "host ImageViewer/confirmations". Portal-rendered into
 * document.body (not in place) so it isn't clipped by an ancestor's
 * `overflow: hidden` — e.g. EntityCard's card container — and so its
 * z-index only has to beat page content, not fight a specific parent's
 * stacking context. Same reasoning, and largely the same overlay behavior
 * (focus management, Escape-to-close, scroll lock), as ImageViewer.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  ariaLabel,
  closeOnBackdropClick = true,
  className,
}) {
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  // Keep the latest callback available without making the focus-management
  // effect re-run on every parent render. Modal children are controlled
  // inputs, so parent renders must not trigger the effect cleanup/focus restore.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className={[styles.dialog, styles[size], className]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={!title ? ariaLabel : undefined}
        aria-labelledby={title ? titleId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          ref={closeButtonRef}
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {title && (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
