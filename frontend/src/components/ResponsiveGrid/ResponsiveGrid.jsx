import { Children } from 'react';
import styles from './ResponsiveGrid.module.css';

/**
 * ResponsiveGrid — 2 columns on mobile, more on wider screens
 * (docs/NATRA_MASTER_PROMPT.md: Popular Foods "uses a responsive grid:
 * 2 columns on mobile, more columns on desktop"). CSS grid with a fixed
 * column count per breakpoint, rather than auto-fill/minmax — auto-fill
 * would happily collapse to 1 column on a narrow phone, which conflicts
 * with "2 columns on mobile" being a floor, not just a starting point.
 *
 * The breakpoints themselves (768/1024/1280px) aren't from
 * docs/DESIGN_TOKENS.md — neither reference image is anything but a
 * single phone-width mock, so there's no measurement to extract a
 * breakpoint from. They're a standard, commonly-used scale (matches
 * Tailwind's md/lg/xl steps), same "reasonable starting point, not a
 * verified spec" status as DESIGN_TOKENS.md's inferred spacing/font
 * values — Task 2.22's visual QA pass is where these actually get
 * checked, same as those.
 *
 * Column counts per breakpoint are configurable per instance via
 * `columns`, in case a future non-food grid (e.g. an admin list) needs a
 * different progression than the food grid's default.
 */
export default function ResponsiveGrid({
  children,
  columns = { base: 2, md: 3, lg: 4, xl: 5 },
  gap = 'var(--space-lg)',
  className,
  ariaLabel,
}) {
  const base = columns.base ?? 2;
  const md = columns.md ?? base;
  const lg = columns.lg ?? md;
  const xl = columns.xl ?? lg;

  return (
    <div
      className={[styles.grid, className].filter(Boolean).join(' ')}
      style={{
        '--grid-gap': gap,
        '--grid-cols-base': base,
        '--grid-cols-md': md,
        '--grid-cols-lg': lg,
        '--grid-cols-xl': xl,
      }}
      role="list"
      aria-label={ariaLabel}
    >
      {Children.map(children, (child) => (
        <div className={styles.item} role="listitem">
          {child}
        </div>
      ))}
    </div>
  );
}
