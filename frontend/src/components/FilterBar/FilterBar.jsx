import HorizontalScroller from '../HorizontalScroller';
import styles from './FilterBar.module.css';

/**
 * FilterBar — one or more filter groups, each rendered as either a chip
 * row or a dropdown, per docs/TASKS.md's "dropdowns/chips" description.
 *
 * The chip style originally came from the pre-redesign reference UI's
 * Categories row (`docs/reference_ui/1000065033.jpg`: "All"/"Breakfast"/
 * "Lunch"/"Dinner"/"Drinks" pills, active one filled `--color-primary`,
 * inactive ones muted) — since superseded for its one real caller
 * (`Home.jsx`'s Categories row) by Task 10.2c-i's own restyle to a
 * squarer, text-only tile per
 * `docs/reference_ui/phase10_customer_home_reference.jpg` (see
 * `.chip`'s own comment in `FilterBar.module.css` for the full
 * reasoning). A chip group composes the existing `HorizontalScroller`
 * (2.6) rather than reimplementing horizontal-scroll-with-snap, matching
 * that component's own doc comment that it's specifically meant for the
 * Categories row.
 *
 * The dropdown style has no reference-image equivalent — neither image
 * shows one — so it's a plain native `<select>` styled as a pill to at
 * least sit visually with the chip groups on the same bar, flagged for
 * Task 2.22's visual QA the same way every other inferred-not-measured
 * choice in this codebase has been (2.10's border color, 2.11's toggle
 * sizing). A native `<select>` was chosen over a custom-built dropdown
 * for the same reason 2.10's FormField did — free keyboard/a11y/mobile
 * picker behavior — and because building a real custom popover is its
 * own task's worth of work (`Modal`, 2.15, hasn't landed yet for this to
 * lean on).
 *
 * `groups` is a plain data array (not JSX children) — same "data in, not
 * markup" shape as FormField's `options` and EntityCard's props — so a
 * screen can define its whole filter bar declaratively:
 *
 *   [
 *     { id: 'category', type: 'chips', options: [...], value, onChange },
 *     { id: 'sort', type: 'dropdown', options: [...], value, onChange,
 *       placeholder: 'Sort by' },
 *   ]
 *
 * Each group is always single-select and controlled (`value`+`onChange`,
 * `onChange` receiving the new value directly) — matching every other
 * component's callback shape so far. Multi-select chips aren't supported
 * here since neither the reference UI nor any task description (2.14,
 * 3.6) calls for filtering by more than one category/value at once; that
 * would be a real API/behavior decision for whoever needs it, not
 * something to guess into this primitive now.
 */
export default function FilterBar({ groups, className }) {
  return (
    <div className={[styles.bar, className].filter(Boolean).join(' ')}>
      {groups.map((group) => {
        if (group.type === 'dropdown') {
          return (
            <label key={group.id} className={styles.dropdownWrapper}>
              {group.label && (
                <span className={styles.dropdownLabel}>{group.label}</span>
              )}
              <select
                className={styles.dropdown}
                value={group.value}
                onChange={(event) => group.onChange(event.target.value)}
                aria-label={group.label ?? group.id}
              >
                {group.placeholder && (
                  <option value="" disabled hidden>
                    {group.placeholder}
                  </option>
                )}
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <HorizontalScroller
            key={group.id}
            gap="var(--space-sm)"
            ariaLabel={group.label ?? group.id}
          >
            {group.options.map((option) => {
              const isActive = option.value === group.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={[styles.chip, isActive && styles.chipActive]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isActive}
                  onClick={() => group.onChange(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </HorizontalScroller>
        );
      })}
    </div>
  );
}
