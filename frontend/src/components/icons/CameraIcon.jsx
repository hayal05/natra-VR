/**
 * CameraIcon — Task 11.0c-viii, one of Phase 11's new icon set. Same
 * convention as `BackArrowIcon.jsx` (see its own comment for the full
 * reasoning behind giving each icon its own file).
 *
 * Used by Task 11.5a ("Upload payment screenshot" row).
 */
export default function CameraIcon(props) {
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
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
