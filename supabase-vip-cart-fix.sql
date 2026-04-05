-- ============================================
-- FIX CART ITEMS CONSTRAINT FOR VIP BOOKINGS
-- ============================================

-- First add the columns if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'vip_booking_id') THEN
        ALTER TABLE cart_items ADD COLUMN vip_booking_id UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'metadata') THEN
        ALTER TABLE cart_items ADD COLUMN metadata JSONB DEFAULT NULL;
    END IF;
END $$;

-- Drop existing check constraint if exists
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS check_item_type;

-- Add new check constraint that allows vip_booking_id
ALTER TABLE cart_items ADD CONSTRAINT check_item_type 
  CHECK (
    (product_id IS NOT NULL AND event_ticket_id IS NULL AND vip_booking_id IS NULL) OR
    (product_id IS NULL AND event_ticket_id IS NOT NULL AND vip_booking_id IS NULL) OR
    (product_id IS NULL AND event_ticket_id IS NULL AND vip_booking_id IS NOT NULL) OR
    (product_id IS NULL AND event_ticket_id IS NULL AND vip_booking_id IS NULL)
  );
