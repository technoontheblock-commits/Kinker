-- ============================================================
-- Kinker Bar Product Categories
-- Adds a dynamic category table for bar products so categories
-- can be managed (add, remove, sort) from the admin UI.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Category table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bar_product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_product_categories_sort_order
  ON bar_product_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_bar_product_categories_active
  ON bar_product_categories(active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_bar_product_categories_updated_at ON bar_product_categories;
CREATE TRIGGER update_bar_product_categories_updated_at
  BEFORE UPDATE ON bar_product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2. Seed default categories (keep existing enum slugs compatible)
-- ------------------------------------------------------------
INSERT INTO bar_product_categories (name, slug, sort_order, active)
VALUES
  ('Getränk', 'drink', 0, true),
  ('Shot', 'shot', 1, true),
  ('Snack', 'snack', 2, true),
  ('Sonstiges', 'other', 3, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- ------------------------------------------------------------
-- 3. Allow arbitrary category values in bar_products
-- ------------------------------------------------------------
ALTER TABLE bar_products
  DROP CONSTRAINT IF EXISTS bar_products_category_check;

-- Ensure existing products keep a valid category slug
UPDATE bar_products
SET category = c.slug
FROM bar_product_categories c
WHERE bar_products.category IS NOT NULL
  AND c.slug = bar_products.category;

-- ------------------------------------------------------------
-- 4. Foreign key from products to categories (optional, by slug)
-- ------------------------------------------------------------
-- We keep bar_products.category as TEXT referencing the slug for
-- simplicity. The application validates against bar_product_categories.
