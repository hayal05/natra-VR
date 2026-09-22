import { useLayoutEffect, useRef, useState } from 'react';

import styles from './HourlySalesChart.module.css';

// Task 10.3e2-ii — the Sales Overview hourly line chart (Phase 10's named
// exception, data from Task 10.3e2-i's `GET /api/orders/sales-hourly`).
// No chart library exists in this project, so this is a small hand-rolled
// inline SVG: one polyline + soft area fill + a dot per hour, with a
// baseline and a few hour labels. Decorative-with-summary: the SVG is
// `role="img"` with an `aria-label` giving the real day total, since the
// exact per-hour values aren't readable off a curve.
//
// Plotted window: the reference shows roughly 8am–11pm. The window starts
// at 8am, or earlier if any sales happened before 8am (so no real sale is
// silently dropped from the chart), and always ends at 11pm (hour 23).
//
// Geometry (Task 10.3z, project owner's option (a)): the viewBox width is
// the SVG's *measured* width, so one SVG unit is always one CSS pixel and
// the 12px axis labels render at exactly 12px at every viewport width. The
// original fixed 320-unit viewBox scaled with the card, which made the same
// labels ~9.5px on a 320px phone and ~21.5px from 768px up. Consequences,
// all handled below:
// - The viewBox height grows with width (`HEIGHT_RATIO`, clamped to
//   `MIN_HEIGHT`..`MAX_HEIGHT`) so a wide card gets a wide chart, not a
//   very flat one; the CSS (`width: 100%; height: auto`) then makes the
//   rendered height equal that value.
// - Label spacing is chosen from the real plot width (`labelEvery`), so
//   12px labels never touch on a narrow card.
// - `PAD_LEFT`/`PAD_RIGHT` are sized to half the widest label ("12am"/
//   "11pm", ~36px at 12px), because the first/last labels are centered on
//   the plot's end points and would otherwise hang past the SVG's edge.
// Before the first measurement (and if a measurement ever returns 0, e.g.
// a hidden card) the chart falls back to `FALLBACK_WIDTH`, which is the old
// geometry, so it always renders something valid and can't overflow.

const FALLBACK_WIDTH = 320;
// Guard so the plot width can never go negative on an absurdly narrow card.
const MIN_WIDTH = 160;
const HEIGHT_RATIO = 0.4375; // the original 140 / 320
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 180;
const PAD_LEFT = 20;
const PAD_RIGHT = 20;
const PAD_TOP = 10;
const PAD_BOTTOM = 26;
const DEFAULT_START_HOUR = 8;
const END_HOUR = 23;
const MIN_LABEL_EVERY_HOURS = 3;
// Centre-to-centre distance between two axis labels, in px: the widest
// adjacent pair (two 4-character labels, ~35px each at 12px) plus a gap.
const MIN_LABEL_SPACING = 40;

// Width of the element in CSS px, kept current with a ResizeObserver (a
// window `resize` listener where ResizeObserver doesn't exist). Measured in
// a layout effect so the first paint already uses the real width.
function useElementWidth(ref) {
  const [width, setWidth] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function formatHour(hour) {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function formatEtb(amount) {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return `${amount.toFixed(hasFraction ? 2 : 0)} ETB`;
}

export default function HourlySalesChart({ hours, className }) {
  const svgRef = useRef(null);
  const measuredWidth = useElementWidth(svgRef);
  const viewWidth = Math.max(measuredWidth ?? FALLBACK_WIDTH, MIN_WIDTH);
  const viewHeight = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, viewWidth * HEIGHT_RATIO)));

  const firstSaleHour = hours.find((h) => h.total > 0)?.hour;
  const startHour =
    firstSaleHour !== undefined ? Math.min(DEFAULT_START_HOUR, firstSaleHour) : DEFAULT_START_HOUR;
  const visible = hours.filter((h) => h.hour >= startHour && h.hour <= END_HOUR);

  const maxTotal = Math.max(...visible.map((h) => h.total), 0);
  // A flat zero day still needs a non-zero scale to avoid dividing by 0;
  // the line then sits on the baseline, like the reference's empty state.
  const yScale = maxTotal > 0 ? maxTotal : 1;

  const plotWidth = viewWidth - PAD_LEFT - PAD_RIGHT;
  const plotHeight = viewHeight - PAD_TOP - PAD_BOTTOM;
  const baselineY = PAD_TOP + plotHeight;
  const stepX = plotWidth / (visible.length - 1);
  // Label every 3 hours when that leaves room for 12px labels; otherwise
  // every N hours, N being the smallest that does (e.g. a 24-hour window on
  // a phone).
  const labelEvery = Math.max(MIN_LABEL_EVERY_HOURS, Math.ceil(MIN_LABEL_SPACING / stepX));

  const points = visible.map((h, i) => ({
    hour: h.hour,
    x: PAD_LEFT + i * stepX,
    y: baselineY - (h.total / yScale) * plotHeight,
  }));

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath =
    `M ${points[0].x},${baselineY} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x},${baselineY} Z`;

  const dayTotal = visible.reduce((sum, h) => sum + h.total, 0);
  const summary =
    dayTotal > 0
      ? `Hourly sales today, ${formatHour(startHour)} to ${formatHour(END_HOUR)}: ${formatEtb(dayTotal)} in total.`
      : 'Hourly sales today: no completed sales yet.';

  return (
    <svg
      ref={svgRef}
      className={[styles.chart, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      role="img"
      aria-label={summary}
    >
      <defs>
        <linearGradient id="hourlySalesArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className={styles.areaStart} />
          <stop offset="100%" className={styles.areaEnd} />
        </linearGradient>
      </defs>
      <line
        className={styles.baseline}
        x1={PAD_LEFT}
        x2={viewWidth - PAD_RIGHT}
        y1={baselineY}
        y2={baselineY}
      />
      <path d={areaPath} fill="url(#hourlySalesArea)" />
      <polyline className={styles.line} points={linePoints} />
      {points.map((p) => (
        <circle key={p.hour} className={styles.dot} cx={p.x} cy={p.y} r="2.5" />
      ))}
      {points
        .filter((p) => (p.hour - startHour) % labelEvery === 0)
        .map((p) => (
          <text key={p.hour} className={styles.tick} x={p.x} y={viewHeight - 8} textAnchor="middle">
            {formatHour(p.hour)}
          </text>
        ))}
    </svg>
  );
}
