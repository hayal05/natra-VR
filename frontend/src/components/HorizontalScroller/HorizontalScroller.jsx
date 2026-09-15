import { Children } from 'react';
import styles from './HorizontalScroller.module.css';

/**
 * HorizontalScroller — a horizontally swipeable row, no scrollbar shown.
 * Used for the Restaurants row and the Categories chip row on the customer
 * home screen (docs/NATRA_MASTER_PROMPT.md: "Restaurants are horizontally
 * scrollable cards, not a vertical list" / "Categories can be horizontal
 * scrolling chips").
 *
 * No prev/next arrow buttons — the reference UI is a phone-sized mock and
 * the master prompt only describes swipe/scroll, not desktop arrow
 * controls, so adding them would be scope this task wasn't given. Native
 * scroll (touch drag, trackpad, shift+wheel, arrow keys once an item is
 * focused) covers it.
 *
 * Each child is wrapped in a snap-aligned item slot. `itemWidth` is left
 * unset (content-sized) by default, which is right for chips — but a
 * fixed-width child like EntityCard (which fills 100% of *its* container)
 * needs the scroller to actually hand it a width, or it'll size to
 * whatever its content renders at. Pass `itemWidth` (any CSS length, e.g.
 * "70%" or "220px") for that case; there's no built-in default since
 * neither reference image gives a real card width to default to (see
 * DESIGN_TOKENS.md's spacing-scale note on the same limitation).
 */
export default function HorizontalScroller({
  children,
  itemWidth,
  gap = 'var(--space-lg)',
  ariaLabel,
  className,
}) {
  return (
    <div
      className={[styles.scroller, className].filter(Boolean).join(' ')}
      style={{ '--scroller-gap': gap }}
      role="list"
      aria-label={ariaLabel}
    >
      {Children.map(children, (child) => (
        <div
          className={styles.item}
          style={itemWidth ? { '--scroller-item-width': itemWidth } : undefined}
          role="listitem"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
