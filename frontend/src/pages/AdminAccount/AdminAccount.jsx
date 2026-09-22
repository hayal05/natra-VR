import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import RoleShell from '../../components/RoleShell';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AdminAccount.module.css';

// Same "client cap mirrors the real DB column" reasoning `OwnerAccount.jsx`
// already follows (this screen is a straight port of that one, see its
// own header comment below) — `users` is one shared table for both roles
// (`backend/migrations/0006_users_restaurants.up.sql`), so the same
// column widths apply.
const FULL_NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 160;
const PHONE_MAX_LENGTH = 30;

// Same password-length rules `authController.js`'s signup/changePassword
// schemas enforce server-side, mirrored client-side same as
// `OwnerAccount.jsx`.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function fetchMe(signal) {
  return api.get('/auth/me', { signal }).then((data) => data.user);
}

function updateProfile(payload) {
  return api.patch('/auth/me', payload).then((data) => data.user);
}

function changePassword(payload) {
  return api.patch('/auth/me/password', {
    current_password: payload.current_password,
    new_password: payload.new_password,
  });
}

function validateProfile(values) {
  const errors = {};
  if (!values.full_name.trim()) errors.full_name = 'Enter your full name.';
  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  return errors;
}

function validatePassword(values) {
  const errors = {};
  if (!values.current_password) errors.current_password = 'Enter your current password.';
  if (!values.new_password) {
    errors.new_password = 'Enter a new password.';
  } else if (values.new_password.length < MIN_PASSWORD_LENGTH) {
    errors.new_password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (values.new_password.length > MAX_PASSWORD_LENGTH) {
    errors.new_password = `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!values.confirm_password) {
    errors.confirm_password = 'Re-enter your new password.';
  } else if (values.new_password && values.confirm_password !== values.new_password) {
    errors.confirm_password = 'Passwords do not match.';
  }
  return errors;
}

const EMPTY_PASSWORD_VALUES = { current_password: '', new_password: '', confirm_password: '' };

/**
 * AdminAccount — Task 10.4a-iii, the project owner's own answer to the
 * "no real destination exists yet" decision that task was left open on:
 * a minimal profile + password + logout screen for the admin role.
 *
 * This is a near-verbatim port of `OwnerAccount.jsx` (Task 5.22), not a
 * from-scratch build — `users` is one shared table/shape for owner and
 * admin alike (`docs/DB_SCHEMA.md`), `PATCH /api/auth/me`/`PATCH
 * /api/auth/me/password` are already role-agnostic (scoped by
 * `req.user.id` via `authMiddleware`, no owner-specific branching —
 * confirmed by reading `authController.js` directly, not assumed from
 * this task's own earlier "already support an admin caller" note), and
 * there's no reason this screen's own form/validation/error handling
 * should differ from the owner version. Differences from that file,
 * all deliberate:
 * - `RoleShell role="admin"`, and logout navigates to `/admin/login`
 *   instead of `/owner/login`.
 * - No `clearOwnerOrderBadge()` call on logout — that badge (Task 5.21)
 *   is an owner-only concept with no admin equivalent; nothing here to
 *   clear.
 * - Not wired into `RoleShell`'s own 4-item admin nav (Dashboard/
 *   Restaurants/Orders/Platform Settings, Task 2.19) — that nav's shape
 *   was settled separately in Task 10.4e (bottom tabs <768px, sidebar
 *   >=768px, unchanged) and no fifth item was added. Reached instead via
 *   `DashboardHeader`'s account link (`AdminDashboard.jsx`, Task
 *   10.4a-iii) and a direct `/admin/account` route in `App.jsx`. Rendered
 *   and checked in a real browser in Task 10.4f (all breakpoints).
 * - No "restaurant" in any copy — an admin has no restaurant to speak
 *   of, unlike the owner screen's implicit framing.
 */
export default function AdminAccount() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApiQuery(fetchMe, []);

  const {
    mutate: mutateProfile,
    error: profileSaveError,
    loading: profileSaving,
    reset: resetProfileSave,
  } = useMutation(updateProfile);
  const {
    mutate: mutatePassword,
    error: passwordSaveError,
    loading: passwordSaving,
    reset: resetPasswordSave,
  } = useMutation(changePassword);

  const [profileValues, setProfileValues] = useState(null);
  const [profileTouched, setProfileTouched] = useState({});
  const [profileSaved, setProfileSaved] = useState(false);
  const seededRef = useRef(false);

  const [passwordValues, setPasswordValues] = useState(EMPTY_PASSWORD_VALUES);
  const [passwordTouched, setPasswordTouched] = useState({});
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!seededRef.current && data) {
      setProfileValues({ full_name: data.full_name, email: data.email, phone: data.phone });
      seededRef.current = true;
    }
  }, [data]);

  const profileErrors = profileValues ? validateProfile(profileValues) : {};
  const passwordErrors = validatePassword(passwordValues);

  const handleProfileChange = (field) => (event) => {
    setProfileValues((prev) => ({ ...prev, [field]: event.target.value }));
    setProfileSaved(false);
    resetProfileSave();
  };

  const handleProfileBlur = (field) => () => {
    setProfileTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setProfileTouched({ full_name: true, email: true, phone: true });
    if (Object.keys(profileErrors).length > 0) return;

    mutateProfile({
      full_name: profileValues.full_name.trim(),
      email: profileValues.email.trim(),
      phone: profileValues.phone.trim(),
    })
      .then(() => {
        setProfileSaved(true);
        refetch();
      })
      .catch(() => {
        // Surfaced via `profileSaveError` state below; nothing further here.
      });
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordValues((prev) => ({ ...prev, [field]: event.target.value }));
    setPasswordSaved(false);
    resetPasswordSave();
  };

  const handlePasswordBlur = (field) => () => {
    setPasswordTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    setPasswordTouched({ current_password: true, new_password: true, confirm_password: true });
    if (Object.keys(passwordErrors).length > 0) return;

    mutatePassword(passwordValues)
      .then(() => {
        setPasswordSaved(true);
        setPasswordValues(EMPTY_PASSWORD_VALUES);
        setPasswordTouched({});
      })
      .catch(() => {
        // Surfaced via `passwordSaveError` state below; nothing further here.
      });
  };

  const handleLogout = () => {
    tokenStorage.clear();
    navigate('/admin/login');
  };

  const emailConflict =
    profileSaveError instanceof ApiError && profileSaveError.status === 409
      ? profileSaveError.message || 'An account with this email already exists'
      : null;
  const isWrongCurrentPassword =
    passwordSaveError instanceof ApiError && passwordSaveError.status === 401;

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Account</h1>

        {error ? (
          <EmptyState
            title="Couldn't load your account"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : loading || !profileValues ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <>
            <section>
              <h2 className={styles.sectionHeading}>Profile</h2>
              <form className={styles.form} onSubmit={handleProfileSubmit} noValidate>
                <FormField
                  label="Full name"
                  required
                  value={profileValues.full_name}
                  onChange={handleProfileChange('full_name')}
                  onBlur={handleProfileBlur('full_name')}
                  maxLength={FULL_NAME_MAX_LENGTH}
                  error={profileTouched.full_name ? profileErrors.full_name : undefined}
                />

                <FormField
                  label="Email"
                  type="email"
                  required
                  value={profileValues.email}
                  onChange={handleProfileChange('email')}
                  onBlur={handleProfileBlur('email')}
                  maxLength={EMAIL_MAX_LENGTH}
                  error={(profileTouched.email ? profileErrors.email : undefined) || emailConflict}
                />

                <FormField
                  label="Phone"
                  type="tel"
                  required
                  value={profileValues.phone}
                  onChange={handleProfileChange('phone')}
                  onBlur={handleProfileBlur('phone')}
                  maxLength={PHONE_MAX_LENGTH}
                  error={profileTouched.phone ? profileErrors.phone : undefined}
                />

                {profileSaveError && !emailConflict && (
                  <p className={styles.formError} role="alert">
                    {profileSaveError.message || 'Something went wrong. Please try again.'}
                  </p>
                )}

                {profileSaved && !profileSaveError && (
                  <p className={styles.successBanner} role="status">
                    Saved.
                  </p>
                )}

                <button type="submit" className={styles.submitButton} disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>Password</h2>
              <form className={styles.form} onSubmit={handlePasswordSubmit} noValidate>
                <FormField
                  label="Current password"
                  type="password"
                  required
                  value={passwordValues.current_password}
                  onChange={handlePasswordChange('current_password')}
                  onBlur={handlePasswordBlur('current_password')}
                  error={
                    (passwordTouched.current_password ? passwordErrors.current_password : undefined)
                  }
                />

                <FormField
                  label="New password"
                  type="password"
                  required
                  value={passwordValues.new_password}
                  onChange={handlePasswordChange('new_password')}
                  onBlur={handlePasswordBlur('new_password')}
                  helperText={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                  error={passwordTouched.new_password ? passwordErrors.new_password : undefined}
                />

                <FormField
                  label="Confirm new password"
                  type="password"
                  required
                  value={passwordValues.confirm_password}
                  onChange={handlePasswordChange('confirm_password')}
                  onBlur={handlePasswordBlur('confirm_password')}
                  error={
                    passwordTouched.confirm_password ? passwordErrors.confirm_password : undefined
                  }
                />

                {passwordSaveError && (
                  <p className={styles.formError} role="alert">
                    {isWrongCurrentPassword
                      ? 'Current password is incorrect.'
                      : passwordSaveError.message || 'Something went wrong. Please try again.'}
                  </p>
                )}

                {passwordSaved && !passwordSaveError && (
                  <p className={styles.successBanner} role="status">
                    Password changed.
                  </p>
                )}

                <button type="submit" className={styles.submitButton} disabled={passwordSaving}>
                  {passwordSaving ? 'Changing…' : 'Change password'}
                </button>
              </form>
            </section>

            <section className={styles.section}>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Log out
              </button>
            </section>
          </>
        )}
      </div>
    </RoleShell>
  );
}
