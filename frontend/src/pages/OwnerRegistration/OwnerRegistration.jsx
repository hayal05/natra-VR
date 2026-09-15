import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, ApiError } from '../../api/client';
import FormField from '../../components/FormField';
import { useMutation } from '../../hooks';
import styles from './OwnerRegistration.module.css';

// Mirrors `backend/src/controllers/authController.js`'s own
// `signupSchema` limits exactly (`full_name` VARCHAR-equivalent cap,
// `email`, `phone`, and the two password bounds) — same "the person
// finds out here, while still editing, rather than getting bounced by
// the endpoint" reasoning `CustomerInfo.jsx`'s own `maxLength` props
// (Task 3.12) already use for `orders`' column caps. Unlike that form's
// deliberately format-agnostic `phone`/free-text fields, the password
// bounds here aren't a guess at a stricter rule than the backend enforces
// — they're the exact same named constants (`MIN_PASSWORD_LENGTH`/
// `MAX_PASSWORD_LENGTH`) that file documents, including *why* 72 is the
// cap (bcrypt silently truncates beyond it), so repeating them here is
// mirroring a real, stable rule, not inventing one.
const FULL_NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 160;
const PHONE_MAX_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function validate(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.';
  if (!values.email.trim()) errors.email = 'Enter your email address.';
  if (!values.phone.trim()) errors.phone = 'Enter your phone number.';
  if (!values.password) {
    errors.password = 'Enter a password.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

// `role: 'owner'` is hardcoded, not a field on this form — `signupSchema`
// (1.12) accepts `'owner' | 'admin'` because the same endpoint also
// backs Task 6's admin account creation, but this screen is specifically
// the *owner* registration screen `docs/NATRA_MASTER_PROMPT.md`'s
// "Restaurant registration" section describes; there is no product
// reason to ever let someone self-register as an admin from a public
// form, so this screen never exposes that choice.
function registerOwner({ fullName, email, phone, password }) {
  return api.post(
    '/auth/signup',
    { role: 'owner', full_name: fullName, email, phone, password },
    { auth: false }
  );
}

/**
 * OwnerRegistration — the owner-side "Create account" screen, Task 4.1.
 * `docs/NATRA_MASTER_PROMPT.md`'s "Restaurant registration" section:
 * "Required account fields only: Full name, Phone number, Email,
 * Password" — exactly the four fields this form collects, and exactly
 * `authController.js`'s existing `signupSchema` shape.
 *
 * **The endpoint side of this task was already done** — `POST
 * /api/auth/signup` (Task 1.12) already accepts `role: 'owner'` and
 * everything else this form sends; there was no new backend work for
 * 4.1, only this screen. `auth: false` on the request (the api client's
 * own flag, `api/client.js`) since a brand-new account obviously has no
 * token to attach yet — same reasoning `TrackOrder`/`OrderHistory`'s own
 * public reads use it for the opposite reason (no account at all).
 *
 * **Deliberately does NOT log the new owner in.** `POST /api/auth/signup`
 * returns only `{ user }` (Task 1.12), never a token — token issuance is
 * `POST /api/auth/login`'s job alone (Task 1.13), and "Owner login screen
 * wired to auth" is explicitly its own, separate task (4.2). Chaining an
 * automatic login call here would quietly do 4.2's job inside 4.1's
 * screen instead of leaving that a clean, separately-buildable piece —
 * so on success this screen navigates to `/owner/login` with a
 * `state.justRegistered` flag (and the entered `state.email`), which
 * that screen (built for real by Task 4.2, `OwnerLogin.jsx`) reads to
 * show an "account created, log in to continue" banner and prefill the
 * email field.
 *
 * **Password bounds are enforced client-side** with the same
 * `MIN_PASSWORD_LENGTH`/`MAX_PASSWORD_LENGTH` values `authController.js`
 * itself uses (see this file's own top-of-file comment for why that's
 * mirroring a real rule, not guessing one) — `type="password"` plus a
 * `maxLength` so a browser's own password manager still behaves
 * normally, no confirm-password field (the spec's own "required account
 * fields only" list names four fields, not five, and a wrong password
 * here just means a login failure the owner can recover by resetting to
 * the intended one there — no Phase 4/5 task adds password reset yet,
 * flagged here rather than invented).
 *
 * **Duplicate email** (`POST /api/auth/signup`'s `409` for
 * `uq_users_email`) is shown as a field-level error on the email input
 * specifically, not a generic banner — unlike Track Order's "can't tell
 * which of two fields was wrong" 404, a signup conflict genuinely does
 * point at one exact field, so there's no reason to under-inform here
 * the way that screen deliberately does.
 *
 * **No `RoleShell` wrapper** — unlike every Phase 3 customer screen,
 * this isn't part of an authenticated app frame with a persistent nav
 * bar; an owner reaching this screen has no account yet, so there's
 * nothing for `RoleShell role="owner"`'s four-tab nav to make sense
 * pointing at. Same reasoning `ComponentSandbox` (Task 2.21) already
 * gives for sitting outside all three `RoleShell` variants, applied here
 * for a different reason (pre-auth, not "not a role screen at all").
 */
export default function OwnerRegistration() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [touched, setTouched] = useState({});

  const { mutate, error, loading, reset } = useMutation(registerOwner);

  const errors = validate(values);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    // Task 8.7c: without this, a 409 (`isDuplicateEmail` below) kept
    // showing "An account with this email already exists" on the email
    // field even after the person edited it to a different address —
    // `useMutation`'s own `error` only clears at the *start* of the next
    // `mutate(...)` call, not on every keystroke, so nothing here used
    // to clear it in between. `OwnerAccount.jsx`'s own
    // `handleProfileChange` (its equivalent email-conflict case) already
    // calls its own `resetProfileSave()` on every change for exactly
    // this reason; this file just hadn't been wired the same way.
    reset();
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, password: true });
    if (Object.keys(errors).length > 0) return;

    mutate(values)
      .then(() => {
        navigate('/owner/login', { state: { justRegistered: true, email: values.email.trim() } });
      })
      .catch(() => {
        // Surfaced via `error` state below; nothing further to do here.
      });
  };

  const isDuplicateEmail = error instanceof ApiError && error.status === 409;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Register your restaurant</h1>
        <p className={styles.instructions}>
          Create an owner account to get started. You can request to go live once
          registration is complete.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField
            label="Full name"
            required
            value={values.fullName}
            onChange={handleChange('fullName')}
            onBlur={handleBlur('fullName')}
            maxLength={FULL_NAME_MAX_LENGTH}
            placeholder="Abebe Kebede"
            error={touched.fullName ? errors.fullName : undefined}
          />

          <FormField
            label="Email"
            type="email"
            required
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            maxLength={EMAIL_MAX_LENGTH}
            placeholder="you@example.com"
            error={touched.email ? errors.email : isDuplicateEmail ? 'An account with this email already exists.' : undefined}
          />

          <FormField
            label="Phone"
            type="tel"
            required
            value={values.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            maxLength={PHONE_MAX_LENGTH}
            placeholder="09XXXXXXXX"
            error={touched.phone ? errors.phone : undefined}
          />

          <FormField
            label="Password"
            type="password"
            required
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            maxLength={MAX_PASSWORD_LENGTH}
            placeholder="At least 8 characters"
            error={touched.password ? errors.password : undefined}
          />

          {error && !isDuplicateEmail && (
            <p className={styles.formError} role="alert">
              {error.message || 'Something went wrong. Please try again.'}
            </p>
          )}

          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <button type="button" className={styles.linkButton} onClick={() => navigate('/owner/login')}>
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}
