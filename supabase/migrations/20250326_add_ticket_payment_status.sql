-- Add payment_status column to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Update existing tickets to 'paid' (assuming they were created before this feature)
UPDATE tickets SET payment_status = 'paid' WHERE payment_status IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_tickets_payment_status ON tickets(payment_status);
