-- Add 'sumup' to allowed payment methods for orders
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('twint', 'bank_transfer', 'sepa', 'cash', 'sumup'));
