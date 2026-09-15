import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * usePaginatedQuery — the paginated counterpart to `useApiQuery` (Task
 * 3.1), built specifically to plug straight into `ListWithPagination`
 * (Task 2.16) with no reshaping in between. `queryFn` is called as
 * `queryFn({ page }, signal)` and must resolve to `{ rows, meta }` — the
 * exact shape `backend/src/utils/paginate.js`'s `paginate`/
 * `paginateForOwner` (Task 1.9) already return, so a screen's own fetch
 * function is typically a one-line `(({ page }, signal) =>
 * api.get(\`/foods?page=${page}\`, { signal }))`, not a transform.
 *
 * Returns `items`/`meta`/`loading`/`error` plus `page`/`setPage` (wire
 * `setPage` straight to `ListWithPagination`'s `onPageChange`) and
 * `refetch`. Same out-of-order-response and setState-after-unmount
 * guards as `useApiQuery` — see that hook's own doc comment for why
 * those matter, not repeated here.
 *
 * `deps` (e.g. a search term, an active category filter) works like
 * `useApiQuery`'s: changing them resets `page` back to 1 — staying on
 * page 4 of what is now a *different* filtered result set is a stale-UI
 * bug (per the same reasoning `attachOwnerRestaurant`/pagination code on
 * the backend already applies to "don't let a caller-visible cursor
 * silently point at the wrong scope"), not a feature worth preserving.
 * That reset is skipped on the very first run so mounting straight onto
 * page 1 doesn't fire two requests back to back.
 */
export function usePaginatedQuery(queryFn, deps = []) {
  const [page, setPage] = useState(1);
  const [refetchTick, setRefetchTick] = useState(0);
  const [state, setState] = useState({ items: [], meta: null, error: null, loading: true });
  const mountedRef = useRef(true);
  const latestRequestRef = useRef(0);
  const isFirstDepsRun = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isFirstDepsRun.current) {
      isFirstDepsRun.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    queryFn({ page }, controller.signal)
      .then(({ rows, meta }) => {
        if (!mountedRef.current || latestRequestRef.current !== requestId) return;
        setState({ items: rows, meta, error: null, loading: false });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        if (!mountedRef.current || latestRequestRef.current !== requestId) return;
        setState((prev) => ({ ...prev, error: err, loading: false }));
      });

    return () => controller.abort();
    // page/refetchTick are the two things that should force a fresh
    // request even when deps haven't changed; deps itself is spread in
    // so a filter/search change also refetches (after the effect above
    // has already reset `page` back to 1 for the same change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refetchTick, ...deps]);

  // For a manual "Retry" (EmptyState's action slot) after an error, or
  // any caller-driven reload where neither `page` nor `deps` changed.
  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);

  return {
    items: state.items,
    meta: state.meta,
    error: state.error,
    loading: state.loading,
    page,
    setPage,
    refetch,
  };
}
