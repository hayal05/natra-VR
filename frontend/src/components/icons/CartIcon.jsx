/**
 * CartIcon — Task 11.0c-ii, one of Phase 11's new icon set. Same
 * convention as `BackArrowIcon.jsx` (see its own comment for the full
 * reasoning behind giving each icon its own file).
 *
 * Used by Task 11.1d-ii (Checkout header's cart-summary pill).
 */
export default function CartIcon(props) {
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
      <path d="M3.5 4h2l2.2 11h9.8l1.9-7.5H6.9" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}
