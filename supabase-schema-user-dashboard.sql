-- ============================================
-- KINKER User Dashboard Database Schema
-- ============================================

-- ============================================
-- USER PROFILES
-- Extended user data beyond auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  address JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  date_of_birth DATE,
  newsletter_opt_in BOOLEAN DEFAULT true,
  last_login_reward TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER WALLETS
-- Balance system for store credit/refunds
-- ============================================
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'CHF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- WALLET TRANSACTIONS
-- History of all wallet movements
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'reward')),
  method TEXT CHECK (method IN ('twint', 'bank_transfer', 'card', 'cash', 'points')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER REWARDS / LOYALTY POINTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  lifetime_points INTEGER DEFAULT 0 CHECK (lifetime_points >= 0),
  tier TEXT DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  last_login_reward TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- AVAILABLE REWARDS
-- Rewards that can be redeemed with points
-- ============================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_ticket', 'merchandise', 'vip_upgrade')),
  reward_value JSONB NOT NULL, -- {discount_percent: 10} or {ticket_type: 'vip'}
  active BOOLEAN DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REWARD REDEMPTIONS
-- Track redeemed rewards
-- ============================================
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  points_used INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only access their own profile
CREATE POLICY "Users can manage own profile" 
  ON user_profiles FOR ALL 
  USING (auth.uid() = id);

-- User Wallets: Users can only view their own wallet
CREATE POLICY "Users can view own wallet" 
  ON user_wallets FOR SELECT 
  USING (auth.uid() = user_id);

-- Wallet Transactions: Users can only view their own transactions
CREATE POLICY "Users can view own transactions" 
  ON wallet_transactions FOR SELECT 
  USING (auth.uid() = user_id);

-- User Rewards: Users can only view their own rewards
CREATE POLICY "Users can view own rewards" 
  ON user_rewards FOR SELECT 
  USING (auth.uid() = user_id);

-- Rewards: Anyone can view active rewards
CREATE POLICY "Public can view active rewards" 
  ON rewards FOR SELECT 
  USING (active = true);

-- Reward Redemptions: Users can only view their own redemptions
CREATE POLICY "Users can view own redemptions" 
  ON reward_redemptions FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at 
  BEFORE UPDATE ON user_wallets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rewards_updated_at 
  BEFORE UPDATE ON user_rewards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create wallet and rewards on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  
  -- Create wallet
  INSERT INTO user_wallets (user_id, balance)
  VALUES (NEW.id, 0);
  
  -- Create rewards record
  INSERT INTO user_rewards (user_id, points, lifetime_points, tier)
  VALUES (NEW.id, 0, 0, 'Bronze');
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE REWARDS
-- ============================================
INSERT INTO rewards (name, description, points_cost, reward_type, reward_value, active, stock) VALUES
('10% Rabatt', '10% Rabatt auf Merchandise', 100, 'discount', '{"discount_percent": 10}', true, 100),
('20% Rabatt', '20% Rabatt auf Merchandise', 200, 'discount', '{"discount_percent": 20}', true, 50),
('Gratis Ticket', 'Ein gratis Ticket für eine Club Night', 500, 'free_ticket', '{"ticket_type": "regular"}', true, 20),
('VIP Upgrade', 'Upgrade auf VIP Status beim nächsten Event', 1000, 'vip_upgrade', '{"ticket_type": "vip"}', true, 10),
('KINKER Hoodie', 'Gratis KINKER Hoodie', 2000, 'merchandise', '{"product_id": "hoodie"}', true, 5),
('KINKER Cap', 'Gratis KINKER Cap', 800, 'merchandise', '{"product_id": "cap"}', true, 15)
ON CONFLICT DO NOTHING;
