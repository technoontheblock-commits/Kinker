-- ============================================
-- ADD VIP BOOKING SUPPORT TO CART
-- ============================================

-- Add vip_booking_id column to cart_items if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'vip_booking_id') THEN
        ALTER TABLE cart_items ADD COLUMN vip_booking_id UUID REFERENCES vip_bookings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add metadata column for storing additional info (package type, event details, etc.)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'metadata') THEN
        ALTER TABLE cart_items ADD COLUMN metadata JSONB DEFAULT NULL;
    END IF;
END $$;
