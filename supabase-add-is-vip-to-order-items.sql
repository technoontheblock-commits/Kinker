-- Add is_vip column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- Update existing order_items to set is_vip based on vip_booking_id
UPDATE order_items SET is_vip = TRUE WHERE vip_booking_id IS NOT NULL;
