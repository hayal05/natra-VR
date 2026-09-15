import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

/**
 * Modal — the base overlay this codebase's own TASKS.md (2.15) describes
 * as meant to "host ImageViewer/confirmations". Portal-rendered into
 * document.body (not in place) so it isn't clipped by an ancestor's
 * `overflow: hidden` — e.g. EntityCard's card container — and so its
 * z-index only has to beat page content, not fight a specific parent's
 * stacking context. Same reasoning, and largely the same overlay
 * behavior (focus management, Escape-to-close, scroll lock), as
 * ImageViewer (2.5) — that component's own doc comment already flagged
 * this exact fold-in as "a reasonable follow-up" once Modal existed.
 * That refactor isn't done here, though: this task is "build Modal",
 * not "migrate ImageViewer onto it" — a deliberate follow-up, not an
 * oversight, same way 2.14 left multi-select chips as a future call
 * rather than guessing it in now.
 *
 * Unlike ImageViewer (which manages its own trigger ref), Modal doesn't
 * need the caller to hand it a trigger element to restore focus to —
 * it snapshots `document.activeElement` itself when it opens and
 * refocuses that on close, since whatever had focus right before the
 * caller set `isOpen=true` is, by definition, the thing that should get
 * focus back.
 *
 * `title` and `footer` are optional slots (not required children) so
 * this covers both of the task's two named uses without forcing either
 * shape: an image viewer wants neither (just its own full-bleed image),
 * a confirmation dialog wants both (a heading + Confirm/Cancel
 * buttons). `children` is the body content either way — plain
 * `ReactNode`, not a specific shape, matching EmptyState's/FormField's
 * own reserved-slot pattern for content this component shouldn't
 * presume the shape of.
 *
 * `size` picks a max-width preset (`sm`/`md`/`lg`/`full`) rather than
 * accepting an arbitrary CSS value — `full` in particular exists for
 * ImageViewer's eventual full-bleed-image use case, which needs the
 * dialog itself to be edge-to-edge rather than a centered card.
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

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

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
