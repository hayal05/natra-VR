/**
 * BackArrowIcon — Task 11.0c-i, one of Phase 11's new icon set. Same
 * inline-SVG convention `RoleShell.jsx`'s own icons already use
 * (`viewBox="0 0 24 24"`, `stroke="currentColor"`, feather-style line
 * icon) — a new glyph, same shape, just pulled into its own file per
 * this task's own "one small file each" line in `docs/TASKS.md` rather
 * than a local function inside the one component that uses it, the way
 * `RoleShell.jsx`'s own icons are — because this one is shared by more
 * than one section (11.0c's own list: 11.1/11.3/11.4/11.5).
 *
 * Used by Task 11.1b (Checkout header's back control, → Home).
 */
export default function BackArrowIcon(props) {
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
      <path d="M11 5 4 12l7 7" />
      <path d="M4 12h16" />
    </svg>
  );
}
