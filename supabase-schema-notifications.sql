-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('booking', 'contact', 'career', 'system', 'newsletter')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public update notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public delete notifications" ON notifications;

-- Create policies
CREATE POLICY "Allow public read notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete notifications" ON notifications FOR DELETE USING (true);

-- Insert sample notifications
INSERT INTO notifications (type, title, message, read) VALUES
('booking', 'Neue Raumanfrage', 'Neue Anfrage für Wohnzimmer am 15.04.2024', false),
('contact', 'Kontaktformular', 'Neue Nachricht von max@example.com', false),
('career', 'Neue Bewerbung', 'Bewerbung als Barkeeper eingegangen', true),
('system', 'System Update', 'System erfolgreich aktualisiert', true);
