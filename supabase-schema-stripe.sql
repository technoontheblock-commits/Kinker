-- ============================================
-- KINKER Stripe Integration Schema Update
-- ============================================

-- Add stripe_session_id column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
  END IF;
END $$;

-- Add stripe_customer_id column (optional, for future use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Update payment_method check constraint to include stripe
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('twint', 'bank_transfer', 'sepa', 'cash', 'stripe'));

-- Create index on stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- ============================================
-- Verification
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
