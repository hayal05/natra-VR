import styles from './StatusBadge.module.css';

/**
 * Status → visual tone map.
 *
 * Only `open`/`closed` have a real color, from docs/DESIGN_TOKENS.md
 * (measured from the "Open"/"Closed" badges in the reference UI). Every
 * other status this codebase has — orders.status's New/Accepted/Completed/
 * Rejected, restaurants.live_status's not_requested/pending/approved/
 * rejected, live_requests.status's pending/approved/rejected (see
 * docs/DB_SCHEMA.md) — is NOT in the reference images, so per
 * DESIGN_TOKENS.md's own note ("that's a call for whoever builds
 * StatusBadge, not something to invent from a reference image that
 * doesn't show them"), this map deliberately does not assign them a color.
 * They fall through to `neutral` below instead of getting a fabricated
 * green/red/etc. that would look authoritative without being backed by
 * anything. Extending this map with real per-status colors is a design
 * decision for whoever needs it next (order-status UI is Phase 4/5) — add
 * entries here when that decision is made, rather than guessing now.
 */
export const STATUS_TONE = {
  open: 'success',
  closed: 'error',
};

const TONES = new Set(['success', 'error', 'neutral']);

function defaultLabel(status) {
  return String(status)
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * @param {string} status - the raw status value (e.g. "Open", "pending").
 *   Matched against STATUS_TONE case-insensitively; unmatched values render
 *   as the neutral tone rather than throwing or guessing.
 * @param {string} [label] - display text override. Defaults to `status`
 *   reformatted from snake_case/lowercase into Title Case.
 * @param {'success'|'error'|'neutral'} [tone] - force a specific tone,
 *   bypassing STATUS_TONE. Useful for a status not yet in the map once its
 *   color has actually been decided, without editing this file.
 */
export default function StatusBadge({ status, label, tone, className }) {
  const resolvedTone = TONES.has(tone)
    ? tone
    : STATUS_TONE[String(status).trim().toLowerCase()] ?? 'neutral';

  return (
    <span
      className={[styles.badge, styles[resolvedTone], className]
        .filter(Boolean)
        .join(' ')}
    >
      {label ?? defaultLabel(status)}
    </span>
  );
}
