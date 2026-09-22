import { Link } from 'react-router-dom';

import styles from './StatTile.module.css';

const VARIANTS = new Set(['neutral', 'primary', 'success', 'error', 'info']);

/**
 * StatTile — Task 10.0d, one cell of the 2×2 stat grids on both
 * dashboards (Owner's Total/Completed/Rejected/Pending, `10.3c`; Admin's
 * Restaurants/Live/Pending/Orders, `10.4c`).
 *
 * - 10.0d-i: base shell — `count` + `label`, typography/color only. Both
 *   references show a leading icon per tile (bag/check/x/clock,
 *   storefront/signal/clock/document); none of those exist in this
 *   codebase's asset set (`UI_REDESIGN_ROADMAP.md`'s governing rule), so
 *   no icon slot is built — count + label carry the meaning instead.
 * - 10.0d-ii: `variant` prop — a color theme per tile (background tint +
 *   accent color) so callers can distinguish e.g. "Rejected" (error) from
 *   "Completed" (success) without duplicating the shell's markup. Colors
 *   reuse existing status/brand tokens (no new hex values) — `info` is
 *   the one addition, mapped to `--color-primary-tint` since no
 *   dedicated "info" token exists yet, used as the closest existing
 *   blue-ish variant for whichever tile each dashboard's own reference
 *   image shows in blue (Owner's "Pending", `10.3c`; Admin's "Pending",
 *   `10.4c` — see each screen's own header comment for its full
 *   reference-to-variant mapping, since the two screens' tiles don't
 *   share the same labels/order).
 * - 10.0d-iii: optional link affordance — only renders when `to` is
 *   passed, as a plain underlined text arrow ("View all →"), not an
 *   icon asset (both references show a plain chevron/arrow glyph here,
 *   which is typography, not an icon component, per the governing
 *   rule's own distinction between the 7 real icon assets and plain
 *   directional characters like the one `10.4d-ii` also uses).
 */
export default function StatTile({ count, label, variant = 'neutral', to, className }) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : 'neutral';

  const content = (
    <>
      <span className={styles.count}>{count}</span>
      <span className={styles.label}>{label}</span>
      {to && (
        <span className={styles.linkAffordance} aria-hidden="true">
          &rarr;
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={[styles.tile, styles[resolvedVariant], styles.linkable, className]
          .filter(Boolean)
          .join(' ')}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={[styles.tile, styles[resolvedVariant], className].filter(Boolean).join(' ')}>
      {content}
    </div>
  );
}
