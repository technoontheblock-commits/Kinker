-- ============================================
-- KINKER Stripe Integration Schema Update (FIX 2)
-- ============================================

-- Step 1: Drop the old constraint FIRST
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Step 2: Now update existing orders with invalid payment_method
UPDATE orders 
SET payment_method = 'stripe' 
WHERE payment_method IS NOT NULL 
  AND payment_method NOT IN ('twint', 'bank_transfer', 'sepa', 'cash', 'stripe');

-- Step 3: Add stripe_session_id column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
  END IF;
END $$;

-- Step 4: Add stripe_customer_id column (optional, for future use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Step 5: Create the new constraint with stripe included
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IS NULL OR payment_method IN ('twint', 'bank_transfer', 'sepa', 'cash', 'stripe'));

-- Step 6: Create index on stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
