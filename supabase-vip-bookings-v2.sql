-- ============================================
-- VIP BOOKINGS SYSTEM SCHEMA (WITHOUT FK CONSTRAINT)
-- ============================================

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS vip_bookings;

-- Create VIP Bookings table
-- event_id is TEXT to match events table structure
CREATE TABLE vip_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('Bronze', 'Silver', 'Gold')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vip_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON vip_bookings;
CREATE POLICY "Users can view own bookings" ON vip_bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own bookings
DROP POLICY IF EXISTS "Users can create own bookings" ON vip_bookings;
CREATE POLICY "Users can create own bookings" ON vip_bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update bookings (status changes)
DROP POLICY IF EXISTS "Admins can update bookings" ON vip_bookings;
CREATE POLICY "Admins can update bookings" ON vip_bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Only admins can delete bookings
DROP POLICY IF EXISTS "Admins can delete bookings" ON vip_bookings;
CREATE POLICY "Admins can delete bookings" ON vip_bookings
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Admins can view all bookings
DROP POLICY IF EXISTS "Admins can view all bookings" ON vip_bookings;
CREATE POLICY "Admins can view all bookings" ON vip_bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Indexes for performance
CREATE INDEX idx_vip_bookings_user_id ON vip_bookings(user_id);
CREATE INDEX idx_vip_bookings_event_id ON vip_bookings(event_id);
CREATE INDEX idx_vip_bookings_status ON vip_bookings(status);
CREATE INDEX idx_vip_bookings_created_at ON vip_bookings(created_at DESC);
