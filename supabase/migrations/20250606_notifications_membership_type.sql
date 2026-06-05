-- Extend notifications type check to include membership
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('booking', 'contact', 'career', 'system', 'rental', 'newsletter', 'membership'));

-- Add data column if missing (for compatibility with different schema versions)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
