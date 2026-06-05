-- Add 'sumup' to allowed payment methods for orders, remove 'twint' and 'sepa'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Update existing twint/sepa orders to bank_transfer before adding the new constraint
UPDATE orders 
SET payment_method = 'bank_transfer' 
WHERE payment_method IN ('twint', 'sepa');

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('bank_transfer', 'cash', 'stripe', 'sumup'));
