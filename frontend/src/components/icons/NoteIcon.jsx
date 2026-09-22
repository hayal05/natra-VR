/**
 * NoteIcon — Task 11.0c-vi, one of Phase 11's new icon set. Same
 * convention as `BackArrowIcon.jsx` (see its own comment for the full
 * reasoning behind giving each icon its own file).
 *
 * Used by Task 11.3e ("Your details" section, optional Note field).
 */
export default function NoteIcon(props) {
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
      <path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3.5V7a1 1 0 0 0 1 1H18.5" />
      <path d="M8 12.5h8M8 16h5" />
    </svg>
  );
}
