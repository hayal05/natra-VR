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
        <path
          className={styles.badgeShape}
          d="M12 1.5l1.55 1.28 1.99-.27.93 1.78 1.85.79-.27 1.99 1.28 1.55-1.28 1.55.27 1.99-1.85.79-.93 1.78-1.99-.27L12 22.5l-1.55-1.28-1.99.27-.93-1.78-1.85-.79.27-1.99-1.28-1.55 1.28-1.55-.27-1.99 1.85-.79.93-1.78 1.99.27L12 1.5z"
        />
        <path
          className={styles.check}
          d="M8.25 12.25l2.35 2.35 5.15-5.2"
        />
      </svg>
    </span>
  );
}
