import styles from './SearchBar.module.css';

/**
 * SearchBar — the pill-shaped search field from the reference UI's home
 * screen (`docs/reference_ui/1000065033.jpg`: a magnifier icon and
 * "Search foods, drinks, restaurants..." placeholder, sitting inside the
 * orange header itself). Static-layout use starts at Task 3.2; Task 3.6
 * is what actually wires it to a search/filter endpoint — this component
 * only presents/edits the query string, same separation FormField keeps
 * from whatever validates/submits it.
 *
 * Task 10.2a-ii: default `placeholder` reordered to "Search restaurants,
 * foods, drinks..." to match the Phase 10 reference image
 * (`docs/reference_ui/phase10_customer_home_reference.jpg`) exactly —
 * same three real search targets as the original copy, just the word
 * order the newer reference actually shows. Only `Home.jsx` relies on
 * this default (`AdminRestaurants`/`AdminOrders` both pass their own
 * `placeholder`; `ComponentSandbox`'s demo usage just follows whatever
 * the default is).
 *
 * **`variant` (added Task 2.22's visual QA pass):** the bar in the
 * reference image is NOT the plain white pill Task 2.13 originally
 * assumed — a clean-pixel sample of it (`docs/DESIGN_TOKENS.md`'s Task
 * 2.22 section) measures a distinct lighter tint of the header orange
 * (`--color-primary-tint`), with light text/icon, since it sits directly
 * on the orange header rather than on a white page background. Default
 * `variant="surface"` keeps 2.13's original white styling for any other
 * placement (e.g. a search field on a white owner/admin screen, which
 * neither reference image shows one way or the other); `variant="onPrimary"`
 * matches the actual reference header bar and is what Task 3.2's home
 * screen should use once it exists.
 *
 * Controlled (`value`/`onChange`), matching every other data-carrying
 * component so far. `onChange` receives the new string directly, not
 * the raw DOM event — same shape as QuantityStepper's/ToggleSwitch's
 * onChange handing back the new value directly rather than an event.
 *
 * `onSubmit` is optional and fires on Enter — not on every keystroke —
 * for a caller that wants to search on submit rather than live-filter
 * on every `onChange` (Task 3.6's own choice between the two isn't made
 * here; both paths are supported by exposing both callbacks).
 *
 * The magnifier is an inline SVG rather than an icon-font/library import
 * — this project has no icon dependency yet (`package.json`: zero
 * frontend deps beyond react/react-dom/react-router) and a single glyph
 * doesn't justify adding one, especially with this session's sandbox
 * still unable to `npm install` (same 403/no-egress gap as 2.10-2.12).
 *
 * The clear ("×") button only renders once there's text to clear, and
 * is a real `<button type="button">` (not a styled `<span>`) so it's
 * keyboard-reachable and gets a proper accessible name — same reasoning
 * QuantityStepper/ToggleSwitch use real interactive elements throughout
 * rather than clickable non-interactive ones.
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search restaurants, foods, drinks...',
  disabled = false,
  autoFocus = false,
  ariaLabel = 'Search',
  variant = 'surface',
  className,
}) {
  return (
    <div
      className={[
        styles.bar,
        variant === 'onPrimary' && styles.onPrimary,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.75" />
        <line
          x1="13.75"
          y1="13.75"
          x2="18"
          y2="18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.(value);
        }}
      />

      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange('')}
          disabled={disabled}
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
}
