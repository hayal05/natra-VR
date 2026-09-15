import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useApiQuery — generic "fetch one thing" data hook (Task 3.1) wrapping
 * the api client. For a paginated list wired to `ListWithPagination`
 * (Task 2.16), use `usePaginatedQuery` instead — this one is for screens
 * like Restaurant Profile / Food Details (Tasks 3.7/3.9) that just need
 * `{ data, loading, error }` for a single resource.
 *
 * `queryFn` is called with an `AbortSignal` — pass it straight through
 * to `api.get(path, { signal })` so an in-flight request actually gets
 * cancelled, not just ignored, when `deps` change again or the component
 * unmounts before it resolves. Two failure modes this guards against
 * that a naive `useEffect(() => { fetchIt() }, deps)` doesn't:
 *   1. **Out-of-order responses**: if `deps` change quickly (e.g. typing
 *      into a search box one keystroke apart) and an earlier request
 *      happens to resolve *after* a later one, a naive version would let
 *      the earlier, now-stale response overwrite the newer state — a
 *      `latestRequestRef` counter here discards any response that isn't
 *      from the most recently issued request.
 *   2. **setState after unmount**: a `mountedRef` flag skips the state
 *      update entirely (not just a wasted render) if the component is
 *      already gone by the time the response/error arrives, avoiding
 *      React's "can't update state on an unmounted component" warning.
 *
 * `deps` works like `useEffect`'s own dependency array — pass whatever
 * the query actually depends on (a restaurant id, a search term, ...).
 */
export function useApiQuery(queryFn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const mountedRef = useRef(true);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(() => {
    const requestId = ++latestRequestRef.current;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    queryFn(controller.signal)
      .then((data) => {
        if (!mountedRef.current || latestRequestRef.current !== requestId) return;
        setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        // A signal this same hook aborted (deps changed / unmounted) —
        // not a real error, and mountedRef/latestRequestRef would filter
        // it out below anyway, but skip the state update explicitly
        // rather than relying on that coincidence.
        if (err?.name === 'AbortError') return;
        if (!mountedRef.current || latestRequestRef.current !== requestId) return;
        setState({ data: null, error: err, loading: false });
      });

    return controller;
    // deps is caller-supplied and intentionally drives when a new request
    // fires; queryFn is expected to be stable-enough (or itself depend on
    // the same values already listed in deps) for the same reason
    // ListWithPagination's own callbacks assume a stable-per-render-cycle
    // function rather than demanding useCallback everywhere upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const controller = run();
    return () => controller.abort();
  }, [run]);

  // Exposed for a manual "Retry" button (EmptyState's `action` slot, Task
  // 2.8) on top of the automatic deps-driven fetch above.
  const refetch = useCallback(() => {
    run();
  }, [run]);

  return { ...state, refetch };
}
