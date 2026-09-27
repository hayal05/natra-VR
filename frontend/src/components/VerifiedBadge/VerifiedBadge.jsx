import styles from './VerifiedBadge.module.css';

export default function VerifiedBadge({ className = '' }) {
  return (
    <span
      className={`${styles.badge} ${className}`.trim()}
      aria-label="Verified restaurant"
      title="Verified restaurant"
    >
      ✓
    </span>
  );
}
