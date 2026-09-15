import { useNavigate } from 'react-router-dom';

import EmptyState from '../../components/EmptyState';
import styles from './NotFound.module.css';

/**
 * NotFound — Task 8.7d. Replaces `App.jsx`'s own inline dev `Placeholder`
 * (an unstyled `<div>` with a raw "— not built yet." string, left over
 * from before any real screen existed at any route) as the `*` catch-all
 * route's element. 8.7a/8.7c's own audits already established this
 * codebase's "every failure state is a real, visible thing, not a raw
 * fallback" bar for query/mutation/validation errors; `App.jsx`'s own
 * unmatched-route case was the one place left still failing it —
 * `Placeholder` is genuinely dev tooling (its own comment says as much),
 * meant to mark an unbuilt screen during development, not something a
 * real user should ever land on.
 *
 * **Deliberately outside every `RoleShell` variant** — same reasoning
 * `OwnerLogin.jsx`/`OwnerRegistration.jsx`/`AdminLogin.jsx` already give
 * for sitting outside all three (an unmatched URL carries no reliable
 * signal of which of the three roles, if any, the visitor is/was in —
 * unlike a resource-detail 404 such as `FoodDetails.jsx`'s or
 * `OrderDetail.jsx`'s own `notFound` case, which already knows its own
 * role/section and renders its `EmptyState` right inside that screen's
 * already-role-appropriate shell). Wrapping this in a `RoleShell`
 * variant chosen essentially at random (there's no way to tell from a
 * bad path alone) would suggest a role affiliation this screen has no
 * basis to claim.
 *
 * **Same `EmptyState` component every other "not found" case in this
 * codebase already uses** (`FoodDetails`/`RestaurantProfile`/
 * `OrderDetail`/`AdminRestaurantDetail`/`AdminLiveRequestDetail`/
 * `AddFood`, all Task 8.7d's own "unmatched resource ID" half already
 * found correctly wired — see this task's own `docs/PROJECT_STATUS.md`
 * log entry) — same title/description/action shape, just centered on
 * its own page instead of slotted into an existing screen's content
 * area, since there is no existing screen here for it to slot into.
 *
 * **Action navigates to `/`** (`Home.jsx`, the one route every visitor,
 * regardless of role, can always reach) rather than `navigate(-1)` —
 * browser history for a mistyped/stale/copy-pasted URL that never
 * matched anything may not contain a page worth returning to at all
 * (e.g. a bookmark to a since-removed route, or a link typed directly
 * into the address bar with nothing before it in this tab's history).
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <button type="button" className={styles.homeButton} onClick={() => navigate('/')}>
            Go to Home
          </button>
        }
      />
    </div>
  );
}
