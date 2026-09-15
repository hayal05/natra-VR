import { useEffect, useState } from 'react';
import styles from './QuantityStepper.module.css';

/**
 * QuantityStepper — the "- / number / +" control from
 * docs/NATRA_MASTER_PROMPT.md's Food Details and Order Builder screens.
 * Controlled (`value` + `onChange`), so the order-builder state (Phase 3)
 * owns the actual quantity — this just presents/edits it.
 *
 * `min` defaults to 1, matching `order_items.quantity`'s `≥ 1` constraint
 * in docs/DB_SCHEMA.md. There's no `max` by default — nothing in the
 * schema caps a food's order quantity (no stock/inventory field exists),
 * so an unset `max` isn't an oversight, it's "this codebase doesn't have
 * a limit to enforce here." A `max` prop exists for if/when one shows up.
 *
 * The number input is intentionally NOT `type="number"` bound directly to
 * the clamped `value` — that would clamp on every keystroke (e.g. typing
 * "12" with `min={2}` would snap the first "1" to "2" before "2" could
 * ever be typed) and inherits `<input type="number">`'s known quirks
 * (scientific notation, stray "e", spin-button double UI). Instead it
 * keeps its own draft text while focused and only clamps/commits via
 * `onChange` on blur or Enter — the +/- buttons still clamp and commit
 * immediately, since there's no free-text ambiguity there.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  ariaLabel = 'Quantity',
  className,
}) {
  const [draft, setDraft] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setDraft(String(value));
  }, [value, isEditing]);

  const clamp = (n) => {
    let next = Number.isNaN(n) ? min : n;
    next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const commit = (raw) => {
    const parsed = parseInt(raw, 10);
    const clamped = clamp(Number.isNaN(parsed) ? value : parsed);
    if (clamped !== value) onChange(clamped);
    setDraft(String(clamped));
  };

  const canDecrement = !disabled && value - step >= min;
  const canIncrement = !disabled && (max === undefined || value + step <= max);

  return (
    <div
      className={[styles.stepper, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={styles.button}
        onClick={() => canDecrement && onChange(clamp(value - step))}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
      >
        &minus;
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className={styles.value}
        value={draft}
        disabled={disabled}
        aria-label={ariaLabel}
        onFocus={() => setIsEditing(true)}
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))}
        onBlur={(event) => {
          setIsEditing(false);
          commit(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />

      <button
        type="button"
        className={styles.button}
        onClick={() => canIncrement && onChange(clamp(value + step))}
        disabled={!canIncrement}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
