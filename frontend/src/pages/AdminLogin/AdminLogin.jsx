import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import { tokenStorage } from '../../api/tokenStorage';
import FormField from '../../components/FormField';
import { useMutation } from '../../hooks';
import styles from './AdminLogin.module.css';

const EMAIL_MAX_LENGTH = 160;

// Same "only enough shape-checking to avoid an obviously-incomplete
// request" split OwnerLogin.jsx (Task 4.2) uses — no length/format rules
// beyond "non-empty", since a malformed value just fails the credential
// check below like any other wrong credential would.
function validate(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

function loginAdmin({ email, password }) {
  return api.post('/auth/login', { email, password }, { auth: false });
}

const WRONG_ROLE_MESSAGE = 'This account is not an admin account.';

/**
 * AdminLogin — Task 6.1, the admin counterpart to OwnerLogin (Task 4.2).
 *
 * There is no separate admin auth endpoint — `POST /api/auth/login`
 * (Task 1.13) is role-agnostic by design (`authController.js`'s
 * `loginSchema` takes only email/password, and `signToken` embeds
 * whatever `role` the matched `users` row actually has). So this screen
 * calls the exact same endpoint OwnerLogin does; the only thing that
 * differs is what happens with the response.
 *
 * **Role check happens here, client-side, after a successful login** —
 * a real `users` row was matched and the password verified, so this
 * is NOT a credentials failure (no `INVALID_CREDENTIALS_MESSAGE`
 * reuse); it's "this real account just isn't an admin". The token is
 * deliberately never persisted via `tokenStorage` in that case — an
 * owner who mistakenly (or deliberately) tries this form should not end
 * up with a stored token and the admin sidebar (`RoleShell role="admin"`,
 * already built by Task 2.19) rendering around content that isn't
 * theirs, even though nothing under `/admin/*` enforces server-side
 * authorization yet (that's Phase 6's job — see docs/TASKS.md's Task
 * 6.1 comment and the backend routes still to come in 6.4+). Rejecting
 * client-side now means later tasks that *do* add real admin-only
 * backend checks aren't the only thing standing between a non-admin
 * account and this screen's destination.
 *
 * **No `justRegistered`/prefill state to read** — unlike OwnerLogin,
 * there's no admin self-registration screen anywhere in TASKS.md (admin
 * accounts aren't a public signup flow); this screen has no prior
 * screen that could hand it router `state`, so it's a plain form with
 * no such branch.
 *
 * **No `RoleShell` wrapper**, same reasoning as OwnerLogin: a user on
 * this screen isn't authenticated yet, so there's no admin nav context
 * to render around it.
 *
 * On success, stores the token and navigates to `/admin/dashboard`
 * (still `App.jsx`'s own `Placeholder` until Task 6.3 gives it real
 * content — same "destination exists, content is a later task's job"
 * relationship OwnerLogin's `/owner/dashboard` had until Task 5.1).
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = Boolean(location.state?.sessionExpired);

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [wrongRole, setWrongRole] = useState(false);

  const { mutate, error, loading } = useMutation(loginAdmin);

  const errors = validate(values);

  const handleChange = (field) => (event) => {
    setWrongRole(false);
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setWrongRole(false);
    if (Object.keys(errors).length > 0) return;

    mutate(values)
      .then((data) => {
        if (data.user.role !== 'admin') {
          setWrongRole(true);
          return;
        }
        tokenStorage.set(data.token);
        navigate('/admin/dashboard');
      })
      .catch(() => {
        // Surfaced via `error` state below; nothing further to do here.
      });
  };

  const isInvalidCredentials = error instanceof ApiError && error.status === 401;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Task 10.1b — "NATRA" wordmark, the named exception. See
            OwnerLogin.jsx's fuller comment on this same addition for the
            full reasoning; identical here. */}
        <span className={styles.brandName}>NATRA</span>
        <h1 className={styles.heading}>Admin login</h1>
        <p className={styles.instructions}>
          Log in to manage restaurants, orders, and platform settings.
        </p>

        {sessionExpired && (
          <p className={styles.noticeBanner} role="status">
            Your session expired. Please log in again.
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            className={styles.inputField}
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
            className={styles.inputField}
            label="Password"
            type="password"
            required
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            placeholder="Your password"
            error={touched.password ? errors.password : undefined}
          />

          {wrongRole && (
            <p className={styles.formError} role="alert">
              {WRONG_ROLE_MESSAGE}
            </p>
          )}

          {!wrongRole && error && (
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
      </div>
    </div>
  );
}
