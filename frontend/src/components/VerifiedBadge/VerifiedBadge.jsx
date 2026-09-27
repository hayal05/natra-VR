export default function VerifiedBadge({ className = '' }) {
  return (
    <span
      className={`verified-badge ${className}`.trim()}
      aria-label="Verified restaurant"
      title="Verified restaurant"
    >
      ✓
    </span>
  );
}
