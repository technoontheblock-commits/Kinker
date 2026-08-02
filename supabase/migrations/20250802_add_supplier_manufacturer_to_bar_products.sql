-- ============================================================
-- Kinker Bar Product Supplier and Manufacturer
-- Adds supplier and manufacturer fields to bar products.
-- ============================================================

ALTER TABLE bar_products
  ADD COLUMN IF NOT EXISTS supplier TEXT,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT;
