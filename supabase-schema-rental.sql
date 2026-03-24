-- Rental Inquiries Table
CREATE TABLE IF NOT EXISTS rental_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT,
  date DATE NOT NULL,
  guests INTEGER DEFAULT 0,
  rooms TEXT[] DEFAULT '{}',
  extras TEXT[] DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'declined')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rental_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read rental_inquiries" ON rental_inquiries;
DROP POLICY IF EXISTS "Allow public insert rental_inquiries" ON rental_inquiries;
DROP POLICY IF EXISTS "Allow public update rental_inquiries" ON rental_inquiries;
DROP POLICY IF EXISTS "Allow public delete rental_inquiries" ON rental_inquiries;

-- Create policies
CREATE POLICY "Allow public read rental_inquiries" ON rental_inquiries FOR SELECT USING (true);
CREATE POLICY "Allow public insert rental_inquiries" ON rental_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rental_inquiries" ON rental_inquiries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete rental_inquiries" ON rental_inquiries FOR DELETE USING (true);

-- Insert sample rental inquiry
INSERT INTO rental_inquiries (name, email, phone, event_type, date, guests, rooms, extras, message, status) VALUES
('Max Mustermann', 'max@example.com', '+41 79 123 45 67', 'Geburtstagsparty', '2024-04-15', 50, ARRAY['Wohnzimmer', 'Bunker'], ARRAY['Catering', 'Technik'], 'Hallo, ich möchte gerne den Bunker und das Wohnzimmer für meine Geburtstagsparty mieten. Gibt es die Möglichkeit, auch eine Bar mit Personal zu buchen?', 'new'),
('Anna Schmidt', 'anna@example.com', NULL, 'Firmenevent', '2024-05-20', 80, ARRAY['Wohnzimmer'], ARRAY['Catering'], 'Wir planen ein Firmenevent und suchen einen passenden Raum. Bitte um Kontaktaufnahme.', 'contacted');
