import { Link } from 'react-router-dom';

import ToggleSwitch from '../ToggleSwitch';
import styles from './QuickActionTile.module.css';

/**
 * QuickActionTile — Task 10.0e, one tile in the Owner Dashboard's Quick
 * Actions row (`10.3d`: Open/Closed, Add Food, View Orders, Check Live
 * status).
 *
 * - 10.0e-i: base shell — text `label` only, no icon (the reference
 *   shows a fork/plus/document/signal icon per tile; none exist in this
 *   codebase's 7-icon asset set, so dropped per the governing rule).
 * - 10.0e-ii: optional `caption` line under the label (the reference's
 *   own small descriptive line under each tile, e.g. "Create new menu
 *   items and update your menu.").
 * - 10.0e-iii: toggle-state variant, via `toggle` — needed only for the
 *   Open/Closed tile (`10.3d-i`). Wraps the real `ToggleSwitch`
 *   (Task 2.11) rather than reimplementing toggle behavior; this
 *   component only arranges it inside the tile shell.
 *
 * Two render shapes: a `toggle` tile (no navigation — the whole tile *is*
 * the on/off control) vs. a `to` tile (a plain link to an existing route,
 * e.g. `/owner/restaurant/menu/new`). Exactly one of `toggle`/`to` is
 * expected per use; passing neither renders inert text, which no caller
 * in this task's scope does.
 */
export default function QuickActionTile({ label, caption, to, toggle, className }) {
  const body = (
    <>
      <span className={styles.label}>{label}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </>
  );

  if (toggle) {
    return (
      <div className={[styles.tile, className].filter(Boolean).join(' ')}>
        <ToggleSwitch
          checked={toggle.checked}
          onChange={toggle.onChange}
          disabled={toggle.disabled}
          label={label}
          className={styles.toggleLabel}
        />
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
    );
  }

  if (to) {
    return (
      <Link to={to} className={[styles.tile, styles.linkable, className].filter(Boolean).join(' ')}>
        {body}
      </Link>
    );
  }

  return <div className={[styles.tile, className].filter(Boolean).join(' ')}>{body}</div>;
}
