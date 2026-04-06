-- Fix order_items table for VIP bookings
-- Add missing columns for VIP support

-- Add vip_booking_id column
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS vip_booking_id UUID REFERENCES vip_bookings(id);

-- Add is_vip column
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- Add metadata column for additional data
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_vip_booking_id ON order_items(vip_booking_id);

-- Update existing VIP bookings (if any cart items were converted)
UPDATE order_items 
SET is_vip = TRUE 
WHERE vip_booking_id IS NOT NULL;
