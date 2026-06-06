-- Membership claims table for QR-code based membership distribution
CREATE TABLE IF NOT EXISTS membership_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bonus_card_id UUID REFERENCES bonus_cards(id) ON DELETE SET NULL,
  created_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_membership_claims_token ON membership_claims(token);
CREATE INDEX IF NOT EXISTS idx_membership_claims_expires_at ON membership_claims(expires_at);
CREATE INDEX IF NOT EXISTS idx_membership_claims_claimed_at ON membership_claims(claimed_at);

ALTER TABLE membership_claims ENABLE ROW LEVEL SECURITY;

-- Allow public read access for token validation
CREATE POLICY "Allow public read membership_claims" ON membership_claims FOR SELECT USING (true);

-- Allow public insert when redeeming (will be controlled by API logic)
CREATE POLICY "Allow public update membership_claims" ON membership_claims FOR UPDATE USING (true);

-- Allow admin insert
CREATE POLICY "Allow admin insert membership_claims" ON membership_claims FOR INSERT WITH CHECK (true);
