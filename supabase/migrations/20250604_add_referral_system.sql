-- ============================================
-- KINKER REFERRAL SYSTEM
-- ============================================

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Points Table (Audit trail for points earned)
CREATE TABLE IF NOT EXISTS referral_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 200,
  source_bonus_card_id UUID NOT NULL REFERENCES bonus_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral_code_used to bonus_cards
ALTER TABLE bonus_cards
ADD COLUMN IF NOT EXISTS referral_code_used UUID REFERENCES referral_codes(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_points_user_id ON referral_points(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_points_source_bonus_card_id ON referral_points(source_bonus_card_id);
CREATE INDEX IF NOT EXISTS idx_bonus_cards_referral_code_used ON bonus_cards(referral_code_used);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_points ENABLE ROW LEVEL SECURITY;

-- No public policies: access only via service role key (API routes)
