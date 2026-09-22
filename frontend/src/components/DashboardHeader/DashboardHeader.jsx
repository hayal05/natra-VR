import { Link } from 'react-router-dom';

import styles from './DashboardHeader.module.css';

/**
 * DashboardHeader — Task 10.0b, the shared header band for the Owner
 * (`10.3a`) and Admin (`10.4a`) redesigned dashboards. Built as one file
 * across 10.0b-i through -vi, per that task's own split:
 *
 * - 10.0b-i: the gradient shell (`.header`, `--gradient-header` from
 *   Task 10.0a) — no content of its own.
 * - 10.0b-ii: the "NATRA" wordmark — the one named exception in
 *   `docs/UI_REDESIGN_ROADMAP.md`'s governing rule (plain text only, no
 *   logo dot/mark). Reuses `--font-family-brand` (the 'Astra' font)
 *   already shipped for this exact purpose on `Home.jsx`'s header and
 *   `RoleShell`'s admin sidebar brand — not a new font choice.
 * - 10.0b-iii: `subtitle`, a prop — each caller supplies its own real
 *   copy ("Owner Dashboard" / "Admin Dashboard"), not hardcoded here.
 * - 10.0b-iv: the notification indicator. Both reference images show a
 *   bell icon with a numeric badge; neither exists in this codebase (no
 *   bell asset anywhere — confirmed in `UI_REDESIGN_ROADMAP.md`), so
 *   this renders as a plain text link instead ("Notifications (3)"),
 *   using the real unread count the caller passes in — never a
 *   0/invented placeholder. Renders nothing if `notificationHref` isn't
 *   passed, so a caller that has no real destination for it yet doesn't
 *   get a dead link.
 * - 10.0b-v: the account/profile element, same reasoning — a plain text
 *   link (the caller's own label, e.g. an owner's name or "Account"),
 *   not an avatar icon/image (`users` has no photo column, no avatar
 *   asset exists). Also renders nothing without `accountHref`.
 * - 10.0b-vi: this JSX itself — assembling i-v into one row (brand+
 *   subtitle left, notifications+account right), spacing/alignment only.
 *
 * Not used by `Home.jsx` (10.2's customer header): that header holds a
 * search bar in the same band and has neither a notification nor an
 * account affordance (customers have no accounts) — different enough
 * content that it stays its own markup in `Home.jsx`, just sharing this
 * component's `--gradient-header`/`--font-family-brand` tokens.
 */
export default function DashboardHeader({
  subtitle,
  notificationCount,
  notificationHref,
  accountLabel,
  accountHref,
  className,
}) {
  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.topRow}>
        <div className={styles.brandBlock}>
          <span className={styles.brandName}>NATRA</span>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {(notificationHref || accountHref) && (
          <div className={styles.actions}>
            {notificationHref && (
              <Link to={notificationHref} className={styles.notificationLink}>
                Notifications
                {typeof notificationCount === 'number' ? ` (${notificationCount})` : ''}
              </Link>
            )}
            {accountHref && (
              <Link to={accountHref} className={styles.accountLink}>
                {accountLabel ?? 'Account'}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
