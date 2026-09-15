import styles from './ListWithPagination.module.css';

/**
 * ListWithPagination — a vertical list plus page controls, for the three
 * named list screens in docs/TASKS.md (5.12 incoming orders, 6.4
 * restaurant management, 6.9 order management with search).
 *
 * `meta` takes the exact shape the backend's own pagination helper
 * already returns (`backend/src/utils/paginate.js`'s
 * `buildPaginationMeta`: `{ total, limit, offset, page, totalPages,
 * hasNextPage, hasPrevPage }`) rather than a frontend-invented shape —
 * that function's own doc comment already names "a `ListWithPagination`
 * frontend component (Task 2.16)" as its reason for existing, so this
 * is the other half of that contract: pass the API response's `meta`
 * straight through, no reshaping needed. `hasNextPage`/`hasPrevPage`
 * come from there directly rather than being recomputed client-side
 * (e.g. `page < totalPages`), since the backend already did that
 * arithmetic against the real `total`.
 *
 * `items` + `renderItem(item)` rather than baking in any one row shape —
 * this list hosts foods, restaurants, and orders across its three known
 * uses, which share nothing in common to template against (same
 * reasoning EmptyState's icon/EntityCard's badge stay reserved slots
 * instead of guessing a shape).
 *
 * `onPageChange(page)` is the only callback — this component doesn't
 * fetch anything itself (no `api` import here, same separation
 * ImageUploadField keeps from the actual upload request); the caller
 * re-fetches with the new page and passes down new `items`/`meta`/
 * `isLoading`.
 *
 * `emptyState` is a ReactNode slot (e.g. an `EmptyState` instance)
 * rendered instead of the list when `items` is empty and not loading —
 * left to the caller rather than this component importing EmptyState
 * itself, since the right copy/icon differs per screen (8.8's own task
 * list separately calls out "no orders, no foods, no restaurants, no
 * search results" as distinct empty states, not one generic message).
 *
 * **Task 8.6a/8.6b — visible loading text on first load.** 8.6a's own
 * audit found every one of this component's seven call sites
 * (AdminLiveRequests/AdminOrders/AdminRestaurants/OwnerMenu/OwnerOrders'
 * own lists, plus OwnerRestaurant's Categories/Service Areas/Payment
 * Methods sub-sections) rendered a genuinely blank list region on first
 * load: `isEmpty` was deliberately `false` while `isLoading` (so a slow
 * request doesn't flash "no results" first, per the comment above), but
 * nothing filled that gap with visible text of its own — only
 * `aria-busy` on the `<ul>`, which is invisible without a screen reader.
 * 8.6a's own log entry flagged this as one shared root cause across all
 * seven call sites and left the "fix here once vs. seven per-screen
 * patches" call for whoever started 8.6b/8.6c/8.6d; decided here, at the
 * start of 8.6b (customer scope), in favor of the shared fix — the exact
 * same gap recurs unchanged on the owner/admin screens 8.6c/8.6d cover,
 * and every other loading state already built in this codebase
 * (Home.jsx, OwnerDashboard.jsx, etc.) uses the same plain
 * "Loading <noun>…" text convention this adds here, not a spinner or
 * skeleton — so this is that same convention, not a new one.
 *
 * `loadingLabel` (default `'Loading…'`) is shown, in place of the list,
 * whenever `isLoading` is true and there are no `items` yet to show
 * (i.e. the very first fetch for this list's current filters/page — a
 * page change or filter change that already has prior `items` keeps
 * showing them, `aria-busy`, while the new page loads, same as before;
 * only the "nothing to show yet" case was actually blank). Callers pass
 * their own noun ("Loading your orders…", "Loading restaurants…") the
 * same way each screen's own pre-existing `useApiQuery` loading text
 * already does — this component doesn't guess a shared noun across its
 * three different row shapes (foods/restaurants/orders).
 */
export default function ListWithPagination({
  items,
  renderItem,
  getItemKey,
  meta,
  onPageChange,
  isLoading = false,
  emptyState = null,
  loadingLabel = 'Loading…',
  ariaLabel,
  className,
}) {
  const isInitialLoading = isLoading && items.length === 0;
  const isEmpty = !isLoading && items.length === 0;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {isInitialLoading ? (
        <p className={styles.loadingStatus} role="status" aria-live="polite">
          {loadingLabel}
        </p>
      ) : isEmpty ? (
        emptyState
      ) : (
        <ul className={styles.list} aria-label={ariaLabel} aria-busy={isLoading}>
          {items.map((item, index) => (
            <li key={getItemKey ? getItemKey(item) : index} className={styles.item}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(meta.page - 1)}
            disabled={!meta.hasPrevPage || isLoading}
          >
            Previous
          </button>

          <span className={styles.pageStatus}>
            Page {meta.page} of {meta.totalPages}
          </span>

          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(meta.page + 1)}
            disabled={!meta.hasNextPage || isLoading}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
