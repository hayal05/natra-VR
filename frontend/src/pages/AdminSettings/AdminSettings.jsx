import { useEffect, useRef, useState } from 'react';

import { api } from '../../api/client';
import EmptyState from '../../components/EmptyState';
import FormField from '../../components/FormField';
import RoleShell from '../../components/RoleShell';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useApiQuery, useMutation } from '../../hooks';
import styles from './AdminSettings.module.css';

// docs/DB_SCHEMA.md's 0.10 `admin_settings` section — same VARCHAR2
// widths `backend/src/controllers/adminController.js`'s own
// `updateAdminSettingsSchema` (6.12a) enforces server-side, repeated
// here so an admin finds out while still typing rather than only after
// a round trip (same "client cap mirrors the real DB column" reasoning
// every other FormField form in this codebase follows).
const METHOD_NAME_MAX_LENGTH = 60;
const ACCOUNT_NUMBER_MAX_LENGTH = 60;
const ACCOUNT_NAME_MAX_LENGTH = 120;
const INSTRUCTIONS_MAX_LENGTH = 500;
// NUMBER(10,2) — same bound `AddFood.jsx`'s own `MAX_PRICE` and
// `adminController.js`'s own `MAX_REGISTRATION_FEE_AMOUNT` (6.12a) use
// for the identical column shape.
const MAX_FEE_AMOUNT = 99999999.99;

// docs/NATRA_MASTER_PROMPT.md's "Order timeout" section — the same
// four fixed durations plus "Custom" `adminController.js`'s own
// `ORDER_TIMEOUT_MODES` (6.13a) validates server-side, repeated here as
// `FormField`'s `select` options rather than free text so an admin can
// only ever submit one of the five real values.
const ORDER_TIMEOUT_MODE_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: 'custom', label: 'Custom' },
];
// NUMBER(5) — same bound `adminController.js`'s own
// `MAX_ORDER_TIMEOUT_CUSTOM_MINUTES` (6.13a) uses for the identical
// column.
const MAX_CUSTOM_MINUTES = 99999;

function fetchSettings(signal) {
  return api.get('/admin/settings', { signal }).then((data) => data.settings);
}

function updateSettings(payload) {
  return api.patch('/admin/settings', payload).then((data) => data.settings);
}

// A registration fee of exactly 0 is accepted server-side (6.12a's own
// `.nonnegative()`, not `.positive()` — a promotional free-to-go-Live
// period is a real admin choice), so this only rejects a missing/
// negative/malformed value, mirroring that boundary rather than the
// stricter "must be > 0" rule `AddFood.jsx`'s own price field uses for
// a menu item.
//
// `order_timeout_custom_minutes` mirrors 6.13a's own
// `orderTimeoutCustomMinutesSchema` exactly: required (and must be a
// positive whole number, capped at `MAX_CUSTOM_MINUTES`) only when
// `order_timeout_mode` is `'custom'` — for any other mode the field is
// simply not validated (and, per `handleSubmit` below, not sent at all).
function validate(values) {
  const errors = {};

  const fee = values.registration_fee_amount.trim();
  if (!fee) {
    errors.registration_fee_amount = 'Enter a registration fee.';
  } else {
    const parsed = Number(fee);
    if (Number.isNaN(parsed) || parsed < 0) {
      errors.registration_fee_amount = 'Fee must be a number that is 0 or greater.';
    } else if (parsed > MAX_FEE_AMOUNT) {
      errors.registration_fee_amount = `Fee cannot exceed ${MAX_FEE_AMOUNT}.`;
    } else if (Number(parsed.toFixed(2)) !== parsed) {
      errors.registration_fee_amount = 'Fee can have at most 2 decimal places.';
    }
  }

  if (!values.registration_method_name.trim()) {
    errors.registration_method_name = 'Enter a payment method name.';
  }
  if (!values.registration_account_number.trim()) {
    errors.registration_account_number = 'Enter an account number.';
  }
  if (!values.registration_account_name.trim()) {
    errors.registration_account_name = 'Enter an account name.';
  }

  if (values.order_timeout_mode === 'custom') {
    const minutes = values.order_timeout_custom_minutes.trim();
    if (!minutes) {
      errors.order_timeout_custom_minutes = 'Enter a number of minutes.';
    } else {
      const parsed = Number(minutes);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        errors.order_timeout_custom_minutes = 'Enter a whole number of minutes greater than 0.';
      } else if (parsed > MAX_CUSTOM_MINUTES) {
        errors.order_timeout_custom_minutes = `Minutes cannot exceed ${MAX_CUSTOM_MINUTES}.`;
      }
    }
  }

  return errors;
}

/**
 * AdminSettings — 6.12b filled in this screen with registration fee +
 * NATRA payment-method config (the five `registration_*` fields); 6.13b
 * (this task) extends the same form with a second section for the
 * remaining three `admin_settings` columns 6.13a's `PATCH
 * /api/admin/settings` now also validates: `order_timeout_mode`,
 * `order_timeout_custom_minutes`, and `notify_before_expiry` — per
 * `docs/NATRA_MASTER_PROMPT.md`'s own "Order timeout" section (Off/15m/
 * 30m/1h/Custom, plus an "optional notify-before-expiry toggle").
 *
 * **Still one form, one `useMutation`, one Save button** — 6.12b's own
 * comment flagged this as the likely shape ("6.13b will add [a] section,
 * as its own extension of this same page") rather than a second,
 * independent form: there's no real product reason an admin should be
 * able to save the order-timeout section without also being able to
 * save the registration section in the same visit, and a single
 * `PATCH` covering every field on the row is no more work for the
 * backend (6.13a's `updateAdminSettingsSchema` already accepts a
 * partial body with any subset of all eight fields; this page just
 * always sends all eight, same "resend everything on every save"
 * approach 6.12b's own five-field submit already used).
 *
 * **`order_timeout_custom_minutes` is only rendered — and only sent —
 * when `order_timeout_mode === 'custom'`**, mirroring 6.13a's own
 * "required only when mode is custom" rule exactly. Switching the
 * select away from `'custom'` doesn't just hide the field, it also
 * clears `values.order_timeout_custom_minutes` back to `''`, so a stray
 * leftover number from a previous "Custom" edit can't get silently
 * resubmitted once the field is hidden again — and `handleSubmit` below
 * sends an explicit `null` for this field whenever the mode being saved
 * isn't `'custom'`, so switching *away* from Custom actually clears the
 * stored value server-side too, not just in this form's own local state.
 *
 * **`notify_before_expiry`** is a `ToggleSwitch`, not a `FormField` —
 * same component `OwnerRestaurant.jsx`'s (5.2) own `is_open` toggle and
 * `OwnerRestaurant.jsx`'s per-day opening-hours toggles (5.5) already
 * use for a real boolean column, converted here from the API's `0`/`1`
 * (`Boolean(data.notify_before_expiry)`) back to `1`/`0` at submit time
 * (`toNotifyBeforeExpiryNumber`), the same boundary
 * `adminController.js`'s own `toNotifyBeforeExpiryNumber` (6.13a) draws
 * server-side. Unlike `OwnerRestaurant.jsx`'s `is_open` toggle, this one
 * does *not* mutate on flip — it's part of this page's one form/one
 * Save button, the same "batched with everything else" treatment the
 * five registration fields already get, since there's no operational
 * reason a notify-before-expiry preference needs to take effect
 * instantly the way "stop accepting orders right now" does.
 *
 * Everything else (fetch-then-edit via `seededRef`, the registration
 * section itself, the string-not-Number input convention) is unchanged
 * from 6.12b — see that task's own comment above for the reasoning,
 * which still applies unmodified to this task's own three new fields.
 */
export default function AdminSettings() {
  const { data, loading, error, refetch } = useApiQuery(fetchSettings, []);
  const { mutate, error: saveError, loading: saving, reset: resetSave } = useMutation(updateSettings);

  const [values, setValues] = useState(null);
  const [touched, setTouched] = useState({});
  const [saved, setSaved] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && data) {
      setValues({
        registration_fee_amount: String(data.registration_fee_amount),
        registration_method_name: data.registration_method_name,
        registration_account_number: data.registration_account_number,
        registration_account_name: data.registration_account_name,
        registration_instructions: data.registration_instructions ?? '',
        order_timeout_mode: data.order_timeout_mode,
        order_timeout_custom_minutes:
          data.order_timeout_custom_minutes === null || data.order_timeout_custom_minutes === undefined
            ? ''
            : String(data.order_timeout_custom_minutes),
        notify_before_expiry: Boolean(data.notify_before_expiry),
      });
      seededRef.current = true;
    }
  }, [data]);

  const errors = values ? validate(values) : {};

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setSaved(false);
    resetSave();
  };

  // Switching away from 'custom' clears the now-hidden minutes field
  // back to '' in local state too — see this component's own header
  // comment on why a stray leftover number shouldn't silently resurface
  // (or resubmit) if the admin switches back and forth.
  const handleModeChange = (event) => {
    const mode = event.target.value;
    setValues((prev) => ({
      ...prev,
      order_timeout_mode: mode,
      order_timeout_custom_minutes: mode === 'custom' ? prev.order_timeout_custom_minutes : '',
    }));
    setSaved(false);
    resetSave();
  };

  const handleNotifyChange = (checked) => {
    setValues((prev) => ({ ...prev, notify_before_expiry: checked }));
    setSaved(false);
    resetSave();
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched((prev) => ({
      ...prev,
      registration_fee_amount: true,
      registration_method_name: true,
      registration_account_number: true,
      registration_account_name: true,
      order_timeout_custom_minutes: true,
    }));
    if (Object.keys(errors).length > 0) return;

    const instructions = values.registration_instructions.trim();
    const isCustom = values.order_timeout_mode === 'custom';
    mutate({
      registration_fee_amount: Number(values.registration_fee_amount.trim()),
      registration_method_name: values.registration_method_name.trim(),
      registration_account_number: values.registration_account_number.trim(),
      registration_account_name: values.registration_account_name.trim(),
      registration_instructions: instructions === '' ? null : instructions,
      order_timeout_mode: values.order_timeout_mode,
      order_timeout_custom_minutes: isCustom ? Number(values.order_timeout_custom_minutes.trim()) : null,
      notify_before_expiry: values.notify_before_expiry,
    })
      .then(() => {
        setSaved(true);
        refetch();
      })
      .catch(() => {
        // Surfaced via `saveError` state below; nothing further here.
      });
  };

  return (
    <RoleShell role="admin">
      <div className={styles.page}>
        <h1 className={styles.heading}>Platform settings</h1>

        {error ? (
          <EmptyState
            title="Couldn't load settings"
            description="Check your connection and try again."
            action={
              <button type="button" className={styles.retryButton} onClick={refetch}>
                Retry
              </button>
            }
          />
        ) : loading || !values ? (
          <p className={styles.status}>Loading…</p>
        ) : (
          <section>
            <h2 className={styles.sectionHeading}>Registration fee &amp; payment</h2>
            <p className={styles.sectionBody}>
              Shown to a prospective owner on the "Request Live" screen before they pay the
              one-time registration fee.
            </p>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <FormField
                label="Registration fee (ETB)"
                type="number"
                required
                value={values.registration_fee_amount}
                onChange={handleChange('registration_fee_amount')}
                onBlur={handleBlur('registration_fee_amount')}
                min="0"
                step="0.01"
                placeholder="0.00"
                error={touched.registration_fee_amount ? errors.registration_fee_amount : undefined}
                disabled={saving}
              />

              <FormField
                label="Payment method name"
                required
                value={values.registration_method_name}
                onChange={handleChange('registration_method_name')}
                onBlur={handleBlur('registration_method_name')}
                maxLength={METHOD_NAME_MAX_LENGTH}
                placeholder="e.g. Telebirr"
                error={touched.registration_method_name ? errors.registration_method_name : undefined}
                disabled={saving}
              />

              <FormField
                label="Account number"
                required
                value={values.registration_account_number}
                onChange={handleChange('registration_account_number')}
                onBlur={handleBlur('registration_account_number')}
                maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
                error={
                  touched.registration_account_number ? errors.registration_account_number : undefined
                }
                disabled={saving}
              />

              <FormField
                label="Account name"
                required
                value={values.registration_account_name}
                onChange={handleChange('registration_account_name')}
                onBlur={handleBlur('registration_account_name')}
                maxLength={ACCOUNT_NAME_MAX_LENGTH}
                error={touched.registration_account_name ? errors.registration_account_name : undefined}
                disabled={saving}
              />

              <FormField
                as="textarea"
                label="Instructions"
                value={values.registration_instructions}
                onChange={handleChange('registration_instructions')}
                maxLength={INSTRUCTIONS_MAX_LENGTH}
                placeholder="e.g. Include your restaurant name as the payment reference."
                helperText="Optional."
                disabled={saving}
              />

              <hr className={styles.sectionDivider} />

              <h2 className={styles.sectionHeading}>Order timeout</h2>
              <p className={styles.sectionBody}>
                Automatically expire an order that's still New after this much time, instead of
                leaving it pending indefinitely.
              </p>

              <FormField
                as="select"
                label="Timeout"
                required
                value={values.order_timeout_mode}
                onChange={handleModeChange}
                options={ORDER_TIMEOUT_MODE_OPTIONS}
                disabled={saving}
              />

              {values.order_timeout_mode === 'custom' && (
                <FormField
                  label="Custom timeout (minutes)"
                  type="number"
                  required
                  value={values.order_timeout_custom_minutes}
                  onChange={handleChange('order_timeout_custom_minutes')}
                  onBlur={handleBlur('order_timeout_custom_minutes')}
                  min="1"
                  step="1"
                  placeholder="e.g. 45"
                  error={
                    touched.order_timeout_custom_minutes
                      ? errors.order_timeout_custom_minutes
                      : undefined
                  }
                  disabled={saving}
                />
              )}

              <div className={styles.toggleRow}>
                <div className={styles.toggleStatus}>
                  <span className={styles.toggleLabel}>Notify before expiry</span>
                  <span className={styles.toggleHint}>
                    Let the owner know shortly before an order is about to automatically expire.
                  </span>
                </div>
                <ToggleSwitch
                  checked={values.notify_before_expiry}
                  onChange={handleNotifyChange}
                  disabled={saving}
                  label={values.notify_before_expiry ? 'On' : 'Off'}
                />
              </div>

              {saveError && (
                <p className={styles.formError} role="alert">
                  {saveError.message || 'Something went wrong. Please try again.'}
                </p>
              )}

              {saved && !saveError && (
                <p className={styles.successBanner} role="status">
                  Saved.
                </p>
              )}

              <button type="submit" className={styles.submitButton} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </section>
        )}
      </div>
    </RoleShell>
  );
}
