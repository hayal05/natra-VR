-- Task 8.4c-ii (prerequisite) — add *_thumbnail_url columns
-- Source of truth: docs/DB_SCHEMA.md's 0.6/0.7 sections (updated alongside
-- this migration, per migrations/README.md's own convention).
--
-- `uploadToObjectStorage` (Task 1.6, backend/src/services/
-- uploadToObjectStorage.js) has returned a `thumbnailUrl` alongside `url`
-- for every restaurant logo/cover and food photo upload since that task —
-- but nothing ever persisted it: `restaurants`/`foods` had exactly one URL
-- column each (`logo_url`/`cover_url`/`image_url`), so the frontend save
-- paths (`OwnerRestaurant.jsx`/`AddFood.jsx`) only ever read `url` off the
-- upload response and discarded `thumbnailUrl`. Discovered while starting
-- Task 8.4c-ii (wiring `EntityCard`'s new `imageSrcSet`/Task 8.4c-i into
-- real data) — see docs/PROJECT_STATUS.md's 8.4c-i log entry for the full
-- trace. This migration is the schema half of closing that gap; the
-- persist-on-save half is a frontend/controller change (same task,
-- non-migration files).
--
-- Nullable, no default, no backfill: existing rows keep
-- `*_thumbnail_url IS NULL` (their thumbnail was generated at upload time
-- but never saved anywhere, so there's nothing to backfill it *from* —
-- only a fresh logo/cover/photo upload after this migration produces a
-- row with a real thumbnail URL). Frontend callers already treat a
-- missing/falsy image url as "no image" (e.g. Home.jsx's own
-- `FALLBACK_IMAGE` fallback), so `imageSrcSet` wiring (8.4c-ii) has to
-- handle a NULL thumbnail the same way regardless.
--
-- No column resize needed elsewhere: `VARCHAR2(500)`, matching every other
-- `*_url` column these two tables already have (`logo_url`/`cover_url`/
-- `image_url`), same length ceiling `uploadToObjectStorage`'s objects are
-- built to fit under.

ALTER TABLE restaurants ADD (
  logo_thumbnail_url  VARCHAR2(500),
  cover_thumbnail_url VARCHAR2(500)
);

ALTER TABLE foods ADD (
  image_thumbnail_url VARCHAR2(500)
);

COMMIT;
