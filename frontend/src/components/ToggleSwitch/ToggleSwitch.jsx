import { useId } from 'react';
import styles from './ToggleSwitch.module.css';

/**
 * ToggleSwitch — a binary on/off control. First named use is 5.5's
 * per-day opening-hours "closed" toggle (docs/TASKS.md), but like every
 * other Phase 2 primitive it's built generic (label + checked/onChange)
 * so anything later needing an on/off (e.g. an admin "active" flag) can
 * reuse it rather than each screen rolling its own.
 *
 * Not in either reference image — neither reference UI shows a toggle
 * control, so unlike EntityCard/StatusBadge/etc there's no measured
 * geometry or color to extract. It reuses existing tokens rather than
 * inventing new ones: `--color-primary` for the "on" track (same brand
 * color already used for CTAs/active states elsewhere) and
 * `--color-surface-muted` for "off", `--radius-pill` for the pill shape
 * (already established by StatusBadge's badges). Track/thumb dimensions
 * are a plain, commonly-used toggle proportion (44×24 track, 18px thumb)
 * rather than anything measured — flagged the same way DESIGN_TOKENS.md
 * flags its own inferred values, for Task 2.22's visual QA pass.
 *
 * Implemented as a visually-hidden real `<input type="checkbox">` plus a
 * styled track/thumb sibling, not a plain `<div>` with a click handler —
 * this keeps native checkbox semantics (keyboard toggling via Space,
 * screen-reader "checkbox, checked/unchecked" announcement, works inside
 * a `<form>`/FormData) for free, same reasoning QuantityStepper (2.9)
 * used real buttons instead of clickable `<div>`s.
 *
 * Always controlled (`checked`/`onChange`), matching every other
 * data-carrying component so far. `onChange` receives the new boolean
 * directly (not the raw DOM event) since that's the only thing a toggle's
 * caller ever actually needs — same shape as QuantityStepper's `onChange`
 * receiving the new number rather than an event.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
  name,
  disabled = false,
  required = false,
  className,
  ...rest
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label
      htmlFor={fieldId}
      className={[
        styles.wrapper,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="checkbox"
        id={fieldId}
        name={name}
        role="switch"
        checked={checked}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.checked)}
        className={styles.input}
        {...rest}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
