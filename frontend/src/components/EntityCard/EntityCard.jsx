import styles from './EntityCard.module.css';

/**
 * EntityCard — the generic card used for both the Restaurants row and the
 * Popular Foods grid on the customer home screen (see
 * docs/NATRA_MASTER_PROMPT.md's "Customer home UI" section).
 *
 * It intentionally does NOT know about restaurants or foods specifically —
 * it's a slot-based shell. Callers decide which slots to fill:
 *   - Restaurant card:  image + logo + title + badge (Open/Closed) + metaLine
 *                       (distance/service-area text), no cta.
 *   - Popular Food card: image + title + subtitle (restaurant name) +
 *                        metaLine (price) + cta ("Order Now"), no logo/badge.
 *
 * `badge` and `cta` are passed as nodes rather than being built in here on
 * purpose: StatusBadge (Task 2.4) doesn't exist yet, and there's no generic
 * Button component planned in TASKS.md either, so this component shouldn't
 * assume either one's shape — it just reserves the layout slot for them.
 *
 * `imageSrcSet`/`imageSizes` (Task 8.4c-i) are optional passthroughs to the
 * `<img>`'s own `srcSet`/`sizes` attributes, for callers that have more than
 * one candidate image to offer (e.g. the Task 1.6 thumbnail alongside the
 * main compressed image). Deliberately just passthroughs, not something
 * this component builds itself from a `{ url, thumbnailUrl }`-shaped prop:
 * `.card`'s own comment above already establishes that EntityCard sizes
 * itself to whatever container places it (HorizontalScroller vs
 * ResponsiveGrid, different column counts per breakpoint), so only the
 * caller actually knows the right `sizes` value for its own layout — same
 * "shouldn't assume the shape" reasoning `badge`/`cta` already use, just
 * applied to image candidates instead of markup. `image`/`logo` stay
 * required as the plain `src` fallback (a caller with only one image size
 * passes nothing else and gets exactly today's behavior); `logoSrcSet`/
 * `logoSizes` exist for the same reason even though the circular logo's
 * fixed 40x40 display size (see `.logo` below) makes it a less likely
 * candidate for this than the main image.
 */
export default function EntityCard({
  image,
  imageAlt = '',
  imageSrcSet,
  imageSizes,
  logo,
  logoAlt = '',
  logoSrcSet,
  logoSizes,
  title,
  subtitle,
  badge,
  metaLine,
  cta,
  onClick,
  className,
}) {
  const isInteractive = typeof onClick === 'function';

  const handleKeyDown = (event) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <article
      className={[styles.card, className].filter(Boolean).join(' ')}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className={styles.media}>
        <img
          className={styles.image}
          src={image}
          srcSet={imageSrcSet}
          sizes={imageSizes}
          alt={imageAlt}
          loading="lazy"
        />
        {logo && (
          <img
            className={styles.logo}
            src={logo}
            srcSet={logoSrcSet}
            sizes={logoSizes}
            alt={logoAlt}
            loading="lazy"
          />
        )}
      </div>

      <div className={styles.body}>
        {badge && <div className={styles.badgeSlot}>{badge}</div>}
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {metaLine && <p className={styles.metaLine}>{metaLine}</p>}
        {cta && <div className={styles.ctaSlot}>{cta}</div>}
      </div>
    </article>
  );
}
