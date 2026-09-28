import styles from './VerifiedBadge.module.css';

export default function VerifiedBadge({ className = '' }) {
  return (
    <span
      className={`${styles.badge} ${className}`.trim()}
      aria-label="Verified restaurant"
      title="Verified restaurant"
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className={styles.badgeShape}
          cx="12"
          cy="12"
          r="10.5"
        />
        <path
          className={styles.check}
          d="M7.2 12.2l3.1 3.1 6.5-6.6"
        />
      </svg>
    </span>
  );
}
