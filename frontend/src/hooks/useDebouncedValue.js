import { useEffect, useState } from 'react';

/**
 * useDebouncedValue — Task 3.6. Returns `value`, but only after it has
 * stopped changing for `delayMs`. Built for the Home screen's search bar
 * (`SearchBar`, Task 2.13): typing fires `onChange` on every keystroke,
 * but firing a real network request on every keystroke would mean an
 * in-flight request per character for a fast typist — `useApiQuery`'s own
 * doc comment (Task 3.1) already names exactly this scenario
 * ("typing into a search box one keystroke apart") as the out-of-order-
 * response case its `latestRequestRef` guards against, but debouncing the
 * *input* to that hook avoids firing most of those requests in the first
 * place rather than just cleaning up after them.
 *
 * Generic rather than baked into Home.jsx directly — nothing about this
 * is specific to search text (a future filter/admin-search screen, e.g.
 * 6.10's `FilterBar` text input, would want the same behavior), same
 * "small reusable hook, not a page-local `useState`+`useEffect` pair"
 * call `useApiQuery`/`usePaginatedQuery`/`useMutation` (3.1) already made
 * for data-fetching.
 *
 * `delayMs` defaults to 300 — a common debounce window for search-as-
 * you-type (short enough to still feel responsive, long enough to skip
 * most keystrokes), not a measured value from any reference image or doc
 * (neither shows/specifies search latency).
 */
export function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
