import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import RoleShell from '../../components/RoleShell';
import { clearOwnerOrderBadge, useApiQuery, useMutation } from '../../hooks';
import styles from './OwnerAccount.module.css';

// Same "client cap mirrors the real DB column" reasoning every other
// FormField form in this codebase follows (CustomerInfo.jsx's
// NAME_MAX_LENGTH, OwnerRestaurant.jsx's NAME_MAX_LENGTH, ...) —
// mirrors `backend/migrations/0006_users_restaurants.up.sql`'s
// `users` column widths.
const FULL_NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 160;
const PHONE_MAX_LENGTH = 30;

// Same password-length rules authController.js's signup/changePassword
// schemas enforce server-side (MIN_PASSWORD_LENGTH/MAX_PASSWORD_LENGTH)
// — repeated here so a caller finds out while still typing, not only
// after a round trip.
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
 * OwnerAccount — Task 5.22, the last piece of Phase 5's four-tab owner
 * shell (`RoleShell`, Tasks 2.17-2.19 built the nav chrome; Dashboard
 * (5.1/5.17-5.21), Orders (5.12-5.16), and Restaurant (5.2-5.11) all
 * shipped their real content well before this one). `docs/NATRA_MASTER_
 * PROMPT.md`'s "Restaurant registration" section names exactly four
 * account fields an owner has: full name, phone, email, password —
 * this screen is "read and edit those back," nothing more.
 *
 * **Backend**: two new routes added alongside this task, both scoped to
 * `req.user.id` via `authMiddleware` (no `ownershipMiddleware` — a
 * `users` row isn't an owned resource the way `foods`/`categories` are):
 *   - `PATCH /api/auth/me` — full_name/email/phone, any subset
 *   - `PATCH /api/auth/me/password` — current_password + new_password
 * See `backend/src/controllers/authController.js`'s own header comment
 * for why both live there rather than a new controller: same zod-
 * schema-then-model-call shape signup/login already establish, same
 * `toPublicUser` strip, same lowercased-email-uniqueness check signup's
 * duplicate-email handling already has to do.
 *
 * **Two independent forms, two independent `useMutation`s** — a failed
 * password change (wrong current password) shouldn't blank out an
 * in-progress profile edit sitting in the other form, and vice versa.
 * Same "one shared status area per actually-related field group, not
 * per screen" reasoning `OwnerRestaurant.jsx`'s own header comment
 * gives for its own multiple save states.
 *
 * **Fetch-then-edit, same shape `OwnerRestaurant.jsx` (5.2) established
 * first**: `values` starts `null` (nothing to show while `GET /auth/me`
 * is in flight) and is seeded exactly once via `seededRef`, so a
 * successful save's own `refetch()` can't stomp whatever the owner is
 * mid-typing for their *next* edit. The password form has no such
 * seeding — it's write-only, always starts blank, and is explicitly
 * cleared back to blank after a successful change (Task's own
 * `EMPTY_PASSWORD_VALUES`) rather than staying filled with a password
 * that's no longer current.
 *
 * **A wrong current password (401) is one form-level error**, not
 * attached to the `current_password` field specifically — matches
 * `authController.js`'s own `WRONG_CURRENT_PASSWORD_MESSAGE`, which
 * (unlike login's deliberately-vague message) is fine to show plainly
 * here: the caller is already authenticated as this exact account, so
 * there's no email-enumeration concern a vague message would be
 * protecting against.
 *
 * **An email already taken by a different account (409) is attached to
 * the email field**, not a form-level banner — unlike the password
 * form's single failure mode, the profile form has a specific field the
 * conflict is about, and `FormField`'s own `error` prop is exactly the
 * slot for that.
 *
 * **Log out**: no logout affordance exists anywhere yet in this
 * codebase (`src/api/tokenStorage.js`'s `clear()` has had no caller
 * since Task 3.1 shipped it) — this screen is the only sensible home
 * for one (an owner has to go *somewhere* to end their session, and
 * there's no dedicated settings/menu screen anywhere else in the owner
 * app). Clears the stored token (`tokenStorage.clear()`) and the
 * per-device new-order badge count (`clearOwnerOrderBadge`, Task 5.21 —
 * a stale unread count shouldn't survive into a next owner's session on
 * a shared device) before navigating to `/owner/login`. No confirmation
 * dialog: logging out isn't destructive (nothing is lost — the token is
 * just a bearer credential, not owner data) the way, say, a category
 * delete is, so `OwnerRestaurant.jsx`'s confirm-`Modal` pattern for that
 * doesn't apply here.
 */
export default function OwnerAccount() {
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
    clearOwnerOrderBadge();
    navigate('/owner/login');
  };

  const emailConflict =
    profileSaveError instanceof ApiError && profileSaveError.status === 409
      ? profileSaveError.message || 'An account with this email already exists'
      : null;
  const isWrongCurrentPassword =
    passwordSaveError instanceof ApiError && passwordSaveError.status === 401;

  return (
    <RoleShell role="owner">
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
