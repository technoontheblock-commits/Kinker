-- ============================================
-- KINKER MEMBERSHIP EXPIRATION
-- ============================================

-- Ensure expires_at column exists on bonus_cards
ALTER TABLE bonus_cards
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Function to set expires_at on insert when not provided
CREATE OR REPLACE FUNCTION set_bonus_card_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.purchased_at + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate expires_at before insert
DROP TRIGGER IF EXISTS trg_set_bonus_card_expires_at ON bonus_cards;
CREATE TRIGGER trg_set_bonus_card_expires_at
BEFORE INSERT ON bonus_cards
FOR EACH ROW
EXECUTE FUNCTION set_bonus_card_expires_at();

-- Backfill existing cards without expiration
UPDATE bonus_cards
SET expires_at = purchased_at + INTERVAL '1 year'
WHERE expires_at IS NULL;

-- Extend scan_result enum to support expired cards
ALTER TABLE bonus_card_scans
DROP CONSTRAINT IF EXISTS bonus_card_scans_scan_result_check;

ALTER TABLE bonus_card_scans
ADD CONSTRAINT bonus_card_scans_scan_result_check
CHECK (scan_result IN ('valid', 'already_used', 'invalid', 'cancelled', 'payment_pending', 'suspended', 'expired'));
