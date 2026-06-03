-- ============================================
-- KINKER BONUS CARD SYSTEM
-- ============================================

-- Bonus Cards Table
CREATE TABLE IF NOT EXISTS bonus_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  card_number TEXT UNIQUE NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  holder_name TEXT NOT NULL,
  holder_email TEXT NOT NULL,
  purchase_price INTEGER NOT NULL DEFAULT 10000, -- 100 CHF in Rappen
  payment_method TEXT NOT NULL CHECK (payment_method IN ('twint', 'bank_transfer', 'sepa', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bonus Card Scan Log
CREATE TABLE IF NOT EXISTS bonus_card_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bonus_card_id UUID NOT NULL REFERENCES bonus_cards(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES scanner_users(id),
  scanner_name TEXT,
  scan_result TEXT NOT NULL CHECK (scan_result IN ('valid', 'already_used', 'invalid', 'cancelled', 'payment_pending', 'suspended')),
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bonus_cards_user_id ON bonus_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_cards_qr_token ON bonus_cards(qr_token);
CREATE INDEX IF NOT EXISTS idx_bonus_cards_card_number ON bonus_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_bonus_cards_payment_status ON bonus_cards(payment_status);
CREATE INDEX IF NOT EXISTS idx_bonus_cards_status ON bonus_cards(status);
CREATE INDEX IF NOT EXISTS idx_bonus_card_scans_bonus_card_id ON bonus_card_scans(bonus_card_id);
CREATE INDEX IF NOT EXISTS idx_bonus_card_scans_created_at ON bonus_card_scans(created_at);

-- Enable RLS
ALTER TABLE bonus_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_card_scans ENABLE ROW LEVEL SECURITY;

-- No public policies: access only via service role key (API routes)
