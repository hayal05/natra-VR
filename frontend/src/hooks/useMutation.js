import { useCallback, useState } from 'react';

/**
 * useMutation — wraps a write call (create/update/delete via the api
 * client) as `{ mutate, data, error, loading, reset }` (Task 3.1). The
 * counterpart to `useApiQuery`/`usePaginatedQuery` for the other half of
 * "data fetching": those two fire automatically on mount/deps-change,
 * this one only runs when the caller explicitly calls `mutate(...)` —
 * a form submit (Task 3.12's customer info form, 3.14's payment
 * screenshot upload, ...), a button press — never on its own.
 *
 * `mutationFn` receives exactly whatever arguments `mutate(...)` is
 * called with and nothing else — no `AbortSignal` the way the two query
 * hooks' fetchers get one: a submit action isn't something a component
 * naturally wants to cancel mid-flight the way a superseded GET is (the
 * next keystroke in a search box should cancel the previous search
 * request; a form's own submit button being clicked once shouldn't be
 * racing itself the same way).
 *
 * `mutate` both updates `error`/`data` state *and* rethrows on failure —
 * so a caller can either read `error` reactively (e.g. to show it inline
 * next to a `FormField`, Task 2.10) or `try/catch` the `mutate(...)` call
 * directly at the point of use (e.g. to decide whether to advance a
 * `Wizard`, Task 2.20, to its next step) without needing both to be
 * mutually exclusive choices.
 */
export function useMutation(mutationFn) {
  const [state, setState] = useState({ data: null, error: null, loading: false });

  const mutate = useCallback(
    async (...args) => {
      setState({ data: null, error: null, loading: true });
      try {
        const data = await mutationFn(...args);
        setState({ data, error: null, loading: false });
        return data;
      } catch (err) {
        setState({ data: null, error: err, loading: false });
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => setState({ data: null, error: null, loading: false }), []);

  return { mutate, reset, ...state };
}
