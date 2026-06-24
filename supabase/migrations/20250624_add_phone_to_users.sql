-- Add phone column to users if it does not exist yet.
-- The bar cashless search uses this column to find customers by phone number.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
