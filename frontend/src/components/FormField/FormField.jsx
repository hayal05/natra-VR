import { useId } from 'react';
import styles from './FormField.module.css';

/**
 * FormField — label + input/textarea/select + validation message, the
 * shared shell every form in this codebase builds on (restaurant
 * application, food/category CRUD, checkout, login, admin settings, etc.
 * per docs/NATRA_MASTER_PROMPT.md's various forms). Like EmptyState and
 * EntityCard's reserved slots, this doesn't bake in any one form's fields —
 * it's the primitive those screens compose.
 *
 * `as` picks the control ('input' | 'textarea' | 'select'), separate from
 * `type`, which is only meaningful when `as="input"` (text/email/password/
 * number/tel/date/...). Splitting them this way means `type` doesn't have
 * to grow non-native values like "textarea" or "select" to select a
 * different element — it stays exactly the native `<input type>` values
 * `as="input"` actually renders.
 *
 * Always controlled (`value` + `onChange`), matching QuantityStepper
 * (2.9) and every other data-carrying component so far — the caller's
 * form state is the single source of truth, this only presents/edits it.
 *
 * `select` takes an `options` array of `{ value, label }` rather than
 * expecting the caller to pass raw `<option>` children — keeps every
 * FormField usage the same shape (props in, no JSX children needed)
 * regardless of which control it renders, and matches how EntityCard/
 * StatusBadge take data, not markup.
 *
 * Error handling: `error` is a validation message string (or falsy for no
 * error). When present, it's rendered below the control, the control gets
 * `aria-invalid` + `aria-describedby` pointing at it, and the border turns
 * `--color-error` (docs/DESIGN_TOKENS.md's measured error color) rather
 * than introducing a separate "error state" token. `helperText` is a
 * second, non-error slot for plain guidance ("We'll only use this to
 * confirm your order") — showing both at once would be visual noise, so
 * the error takes over that space when there is one rather than stacking.
 *
 * `id` is optional — `useId()` generates one when omitted, since most
 * callers won't need a fixed id (nothing outside this component needs to
 * reference it) and forcing one on every usage would just be boilerplate.
 * Pass an explicit `id` when something external does need to target the
 * control (e.g. a `<label>` elsewhere, or an autofill/test hook).
 */
export default function FormField({
  as = 'input',
  type = 'text',
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className,
  ...rest
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const hasMessage = Boolean(error || helperText);

  // `placeholder` is a real HTML attribute on input/textarea but not on
  // `<select>` (React warns on unknown DOM attributes) — `select` uses it
  // above to render a disabled placeholder <option> instead, so it's kept
  // out of the props spread onto the <select> element itself.
  const sharedProps = {
    id: fieldId,
    name,
    value,
    disabled,
    required,
    onChange,
    onBlur,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hasMessage ? messageId : undefined,
    className: [styles.control, error && styles.controlError]
      .filter(Boolean)
      .join(' '),
    ...rest,
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      {as === 'textarea' && (
        <textarea rows={rows} placeholder={placeholder} {...sharedProps} />
      )}

      {as === 'select' && (
        <select {...sharedProps}>
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {(options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {as === 'input' && (
        <input type={type} placeholder={placeholder} {...sharedProps} />
      )}

      {hasMessage && (
        <p
          id={messageId}
          className={error ? styles.errorMessage : styles.helperMessage}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
