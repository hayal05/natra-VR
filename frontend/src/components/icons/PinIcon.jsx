/**
 * PinIcon — Task 11.0c-v, one of Phase 11's new icon set. Same
 * convention as `BackArrowIcon.jsx` (see its own comment for the full
 * reasoning behind giving each icon its own file).
 *
 * Used by Task 11.3d ("Your details" section, Delivery location field).
 */
export default function PinIcon(props) {
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
      <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
