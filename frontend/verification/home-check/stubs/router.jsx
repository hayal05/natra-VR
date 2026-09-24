// Stand-in for `react-router-dom` (not installed in the offline check
// environment). Only the two names the Home screen's tree actually uses.
// Navigation is recorded on `window.__navigations` instead of happening, so
// a check can assert "tapping X goes to Y" without a router.
import { createElement } from 'react';

export function useNavigate() {
  return (to) => {
    (window.__navigations = window.__navigations || []).push(String(to));
  };
}

// RoleShell's NavLink passes `className` as a function of `{ isActive }`.
// "Home" (`/`) is treated as the active tab, like the real app on this page.
// React Router's own NavLink-only props (`end`, `caseSensitive`, `replace`,
// `state`, `reloadDocument`) are consumed here, not forwarded to the <a>.
export function NavLink({ to, className, children, end, caseSensitive, replace, state, reloadDocument, ...rest }) {
  const isActive = to === '/';
  const cls = typeof className === 'function' ? className({ isActive }) : className;
  return createElement(
    'a',
    { href: '#' + to, className: cls, 'aria-current': isActive ? 'page' : undefined, ...rest },
    typeof children === 'function' ? children({ isActive }) : children
  );
}
