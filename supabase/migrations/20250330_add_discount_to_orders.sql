-- Add discount columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- Add comment
COMMENT ON COLUMN orders.discount_amount IS 'Discount amount applied to the order';
COMMENT ON COLUMN orders.discount_code IS 'Discount code used for the order';
