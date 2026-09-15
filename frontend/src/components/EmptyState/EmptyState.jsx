import styles from './EmptyState.module.css';

/**
 * EmptyState — centered "nothing here" placeholder: an optional icon, a
 * title, an optional description, and an optional action. Not tied to any
 * specific screen — this codebase has several places that can be empty
 * (no restaurants in a service area, no search results, an owner's menu
 * with no foods yet, no orders yet, no previous orders for a phone
 * number), none of which are shown in the reference UI images, so this
 * stays a generic shell rather than baking in copy or an illustration for
 * any one of them.
 *
 * `icon` is a ReactNode (emoji, inline SVG, whatever a caller wants), not
 * an image URL — there's no illustration asset set in this project, and
 * inventing one wasn't part of this task. Same reasoning as `EntityCard`'s
 * `badge`/`cta`: reserve the slot, don't assume what fills it.
 *
 * `role="status"` + `aria-live="polite"` so a screen reader announces it
 * when it appears after an action (e.g. a search that comes back with 0
 * results) without being disruptive like `assertive` would be.
 */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={[styles.emptyState, className].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className={styles.icon} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionSlot}>{action}</div>}
    </div>
  );
}
