/**
 * PersonIcon — Task 11.0c-iii, one of Phase 11's new icon set. Same
 * convention as `BackArrowIcon.jsx` (see its own comment for the full
 * reasoning behind giving each icon its own file). Same glyph shape as
 * `RoleShell.jsx`'s own (not-exported) `ProfileIcon` — a new file rather
 * than importing that one, since `RoleShell.jsx`'s icons are internal to
 * that component, not shared exports.
 *
 * Used by Task 11.3a/11.3b ("Your details" section heading + Name
 * field).
 */
export default function PersonIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" />
    </svg>
  );
}
