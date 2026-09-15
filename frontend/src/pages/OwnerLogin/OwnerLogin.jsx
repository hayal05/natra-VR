import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import FormField from '../../components/FormField';
import { useMutation } from '../../hooks';
import styles from './OwnerLogin.module.css';

const EMAIL_MAX_LENGTH = 160;

// Only enough client-side shape-checking to avoid firing an obviously-
// incomplete request — same split `authController.js`'s own `loginSchema`
// (Task 1.13) makes: login doesn't re-validate password length/rules the
// way signup does, since a wrong-length password just fails the
// credential check below like any other wrong password would.
function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

function loginOwner({ email, password }) {
  return api.post('/auth/login', { email, password }, { auth: false });
}

/**
 * OwnerLogin — Task 4.2, the mirror-image frontend piece to Owner
 * Registration (4.1). `POST /api/auth/login` (Task 1.13) already exists
 * and already returns `{ user, token }`; this screen's only real job is
 * collecting email/password, calling it, and persisting the token.
 *
 * **`auth: false`** on the request for the same reason 4.1's signup call
 * uses it — there's no existing token to attach yet; this call is what
 * produces one.
 *
 * **On success, stores the token via `tokenStorage`** (Task 3.1, dormant
 * until now — the first real caller of `tokenStorage.set`) and navigates
 * to `/owner/dashboard`, now a real `RoleShell role="owner"`-wrapped
 * screen (Task 5.1) rather than the placeholder it was when this task
 * was written; landing a freshly-authenticated owner there (rather than
 * somewhere Phase 4-specific) matches what `docs/ROADMAP.md`'s Phase 4
 * exit check actually describes next — a newly-live-or-pending owner
 * belongs in their own app, not back on a public form. Task 4.6/5.1 gave
 * that destination its real content;
 * this task doesn't need to guess it.
 *
 * **Invalid credentials (`401`) are shown as one generic form-level
 * error**, not attached to either field — mirroring `authController.js`'s
 * own `INVALID_CREDENTIALS_MESSAGE` reasoning exactly: a login endpoint
 * that named which field was wrong would let itself be used to enumerate
 * registered emails, which is precisely what that backend message is
 * written to avoid. Repeating the same one message here (rather than
 * inventing a friendlier-sounding client-side rewrite) keeps that
 * property intact end-to-end.
 *
 * **Reads `location.state.justRegistered`** (set by `OwnerRegistration`,
 * Task 4.1, when it navigates here after a successful signup) to show a
 * one-line "account created" banner and prefill the email field — a
 * plain read of router `state`, not a query param, so refreshing this
 * screen or reaching it directly (e.g. a bookmark) just shows the normal
 * login form with nothing to clean up.
 *
 * **No `RoleShell` wrapper**, same reasoning as `OwnerRegistration`
 * (4.1) and `ComponentSandbox` (2.21): an owner on this screen isn't
 * authenticated yet, so there's no role-nav context to render around it.
 */
export default function OwnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = Boolean(location.state?.justRegistered);
  const sessionExpired = Boolean(location.state?.sessionExpired);

  const [values, setValues] = useState({
    email: location.state?.email || '',
    password: '',
  });
  const [touched, setTouched] = useState({});

  const { mutate, error, loading } = useMutation(loginOwner);

  const errors = validate(values);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0) return;

    mutate(values)
      .then((data) => {
        tokenStorage.set(data.token);
        navigate('/owner/dashboard');
      })
      .catch(() => {
        // Surfaced via `error` state below; nothing further to do here.
      });
  };

  const isInvalidCredentials = error instanceof ApiError && error.status === 401;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Owner login</h1>
        <p className={styles.instructions}>
          Log in to manage your restaurant, menu, and orders.
        </p>

        {justRegistered && (
          <p className={styles.successBanner} role="status">
            Account created — log in to continue.
          </p>
        )}

        {sessionExpired && (
          <p className={styles.noticeBanner} role="status">
            Your session expired. Please log in again.
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            label="Email"
            type="email"
            required
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            maxLength={EMAIL_MAX_LENGTH}
            placeholder="you@example.com"
            error={touched.email ? errors.email : undefined}
          />

          <FormField
            label="Password"
            type="password"
            required
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            placeholder="Your password"
            error={touched.password ? errors.password : undefined}
          />

          {error && (
            <p className={styles.formError} role="alert">
              {isInvalidCredentials
                ? 'Invalid email or password.'
                : error.message || 'Something went wrong. Please try again.'}
            </p>
          )}

          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <button
          type="button"
          className={styles.linkButton}
          onClick={() => navigate('/owner/register')}
        >
          Don&apos;t have an account? Register your restaurant
        </button>
      </div>
    </div>
  );
}
