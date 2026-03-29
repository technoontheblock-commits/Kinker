-- ============================================
-- KINKER Rewards System - Complete Setup
-- ============================================

-- Create user_rewards table if not exists (without FK first to avoid issues)
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Bronze',
  last_login_reward TIMESTAMP WITH TIME ZONE,
  login_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add foreign key constraint separately (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- Check if constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_rewards_user_id_fkey' 
      AND table_name = 'user_rewards'
    ) THEN
      ALTER TABLE user_rewards 
      ADD CONSTRAINT user_rewards_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create rewards table (available rewards to redeem)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'free_ticket', 'discount', 'merchandise'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_redemptions table (user's redeemed rewards)
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  points_used INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_code ON reward_redemptions(code);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(active);

-- Enable RLS
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can view rewards" ON rewards;
DROP POLICY IF EXISTS "Users can view own redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Users can create own redemptions" ON reward_redemptions;

-- Create policies
CREATE POLICY "Users can view own rewards" 
  ON user_rewards FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own rewards" 
  ON user_rewards FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can view rewards" 
  ON rewards FOR SELECT 
  TO authenticated 
  USING (active = true);

CREATE POLICY "Users can view own redemptions" 
  ON reward_redemptions FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own redemptions" 
  ON reward_redemptions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Insert default rewards
INSERT INTO rewards (name, description, points_cost, reward_type, active) VALUES
  ('Free Ticket', 'Get one free entry to any KINKER event', 500, 'free_ticket', true),
  ('20% Discount', '20% off on merchandise', 200, 'discount', true),
  ('Free Drink', 'One free drink at the bar', 100, 'merchandise', true),
  ('VIP Upgrade', 'Upgrade to VIP status for one event', 1000, 'free_ticket', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Add missing columns to existing tables
-- ============================================

-- Add last_login_reward if not exists
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS last_login_reward TIMESTAMP WITH TIME ZONE;

-- Add login_streak if not exists
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;
