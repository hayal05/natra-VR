-- Task 8.4c-ii (prerequisite) rollback — drop the *_thumbnail_url columns.
-- No CHECK constraints/FKs on these columns to drop first (plain nullable
-- VARCHAR2, same as their non-thumbnail counterparts), so this is a
-- straight column drop, no reverse-dependency ordering needed between the
-- two ALTERs.

ALTER TABLE restaurants DROP (logo_thumbnail_url, cover_thumbnail_url);

ALTER TABLE foods DROP (image_thumbnail_url);

COMMIT;
