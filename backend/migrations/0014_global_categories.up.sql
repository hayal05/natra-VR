-- =====================================================================
-- 0014_global_categories
-- Convert categories from restaurant-owned to platform-wide.
--
-- Existing category IDs and food.category_id assignments are preserved.
-- =====================================================================

ALTER TABLE categories
  DROP CONSTRAINT FK_CATEGORIES_RESTAURANT;

DROP INDEX ix_categories_restaurant_id;

ALTER TABLE categories
  ADD CONSTRAINT uq_categories_name UNIQUE (name);

ALTER TABLE categories
  DROP COLUMN restaurant_id;
