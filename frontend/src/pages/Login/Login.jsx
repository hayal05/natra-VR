import { useNavigate } from 'react-router-dom';

import styles from './Login.module.css';

/**
 * Login — unified login entry point. The customer bottom-nav's "Profile"
 * tab (`RoleShell.jsx`) has no account/profile of its own to show —
 * `docs/NATRA_MASTER_PROMPT.md` is explicit customers have no accounts —
 * so that tab now points here instead of at the unbuilt `/profile`. This
 * screen's only job is routing whoever taps it to whichever *real* login
 * actually applies to them: `OwnerLogin` (Task 4.2, `/owner/login`) or
 * `AdminLogin` (Task 6.1, `/admin/login`). It doesn't collect credentials
 * itself and doesn't call the API — both destination screens already own
 * their own `POST /api/auth/login` call, form validation, and
 * `tokenStorage` handling; this is purely a fork in the road one level
 * above them.
 *
 * **Two equal-weight options, not a dropdown or a guess** — there's no
 * reliable signal on this screen (no email typed yet, no prior route) to
 * infer which role a visitor is, so both destinations are presented as
 * plain, equally-sized choices rather than defaulting to one.
 *
 * **No `RoleShell` wrapper**, same reasoning `OwnerLogin.jsx`/
 * `AdminLogin.jsx` themselves already give: a visitor here isn't
 * authenticated as any role yet, so there's no role-nav chrome to wrap
 * this in. It's reachable from the customer bottom-nav (which *is*
 * inside a `RoleShell`), but this screen itself renders standalone, the
 * same way tapping into `OwnerLogin`/`AdminLogin` directly already does.
 */
export default function Login() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Log in</h1>
        <p className={styles.instructions}>Choose the account you'd like to log in to.</p>

        <div className={styles.options}>
          <button
            type="button"
            className={styles.optionButton}
            onClick={() => navigate('/owner/login')}
          >
            <StorefrontIcon className={styles.optionIcon} />
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Restaurant owner</span>
              <span className={styles.optionSubtitle}>Manage your restaurant, menu, and orders</span>
            </span>
          </button>

          <button
            type="button"
            className={styles.optionButton}
            onClick={() => navigate('/admin/login')}
          >
            <SettingsIcon className={styles.optionIcon} />
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Admin</span>
              <span className={styles.optionSubtitle}>Manage the platform</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Same two glyphs `RoleShell.jsx` already uses for the owner "Restaurant"
// tab and the admin "Platform Settings" tab, reused here rather than
// redrawn — this screen is just an earlier fork onto those same two
// roles, so the icons that already mean "owner" and "admin" elsewhere in
// this app carry that meaning here too.
function StorefrontIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h16l1.5 5a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12.5 12a2.5 2.5 0 0 1-4.5-1.5A2.5 2.5 0 0 1 3 9L4 4Z" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}
