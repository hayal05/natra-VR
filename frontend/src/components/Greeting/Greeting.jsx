import styles from './Greeting.module.css';

/**
 * Greeting — Task 10.0c, the "Good afternoon! ..." block under both
 * dashboards' headers (`10.3b` Owner, `10.4b` Admin).
 *
 * - 10.0c-i: time-of-day text, computed client-side from `Date` (no
 *   backend field for this) — plain text only, no sun/moon icon, since
 *   neither reference's icon exists in this codebase's asset set.
 * - 10.0c-ii: `subtitle`, a prop — the two dashboards' second lines
 *   differ ("Here's what's happening with your restaurant today." /
 *   "...your business today."), so it's caller-supplied text, not
 *   hardcoded here.
 *
 * Hour boundaries (5–11 morning, 12–16 afternoon, 17–20 evening, else
 * night) are a standard convention, not measured from anything — neither
 * reference image shows the boundary times, only one example greeting
 * each ("Good afternoon!").
 */
function timeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning!';
  if (hour >= 12 && hour < 17) return 'Good afternoon!';
  if (hour >= 17 && hour < 21) return 'Good evening!';
  return 'Good night!';
}

export default function Greeting({ subtitle, className }) {
  return (
    <div className={[styles.greeting, className].filter(Boolean).join(' ')}>
      <p className={styles.headline}>{timeOfDayGreeting()}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
