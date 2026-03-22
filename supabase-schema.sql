-- Supabase Schema for KINKER Basel
-- Run this in your Supabase SQL Editor

-- Events Table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT,
  description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  lineup TEXT[] NOT NULL DEFAULT '{}',
  image TEXT NOT NULL,
  ticket_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('clubnight', 'festival', 'special')),
  price TEXT NOT NULL,
  timetable JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscribers Table
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT TRUE
);

-- Insert sample events
INSERT INTO events (id, name, date, time, end_time, description, full_description, lineup, image, ticket_url, type, price, timetable) VALUES
(
  'techno-tuesday-001',
  'TECHNO TUESDAY',
  '2026-04-07',
  '23:00',
  '06:00',
  'Weekly underground techno session with local and international DJs.',
  'Join us every Tuesday for the darkest techno night in Basel. Our residents and guest DJs deliver uncompromising hard techno in an intimate warehouse setting. No commercial nonsense, just pure underground energy.',
  ARRAY['Marco Bailey', 'Basel Underground Collective', 'KINKER Residents'],
  'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/techno-tuesday-001',
  'clubnight',
  'CHF 25',
  '[
    {"time": "23:00", "artist": "KINKER Residents"},
    {"time": "01:00", "artist": "Basel Underground Collective"},
    {"time": "03:00", "artist": "Marco Bailey"},
    {"time": "05:00", "artist": "B2B Closing"}
  ]'::jsonb
),
(
  'hard-sessions-042',
  'HARD SESSIONS #42',
  '2026-04-12',
  '22:00',
  '08:00',
  'Industrial hard techno all night long. Bring your energy.',
  'Hard Sessions returns for its 42nd edition. We are bringing the hardest industrial techno to Basel''s most iconic underground venue. Expect distorted kicks, relentless energy, and a crowd that knows how to rave.',
  ARRAY['SNTS', 'Somniac One', 'Nico Moreno', 'KOR'],
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/hard-sessions-042',
  'special',
  'CHF 35',
  '[
    {"time": "22:00", "artist": "KOR"},
    {"time": "00:00", "artist": "Somniac One"},
    {"time": "02:00", "artist": "Nico Moreno"},
    {"time": "04:00", "artist": "SNTS"},
    {"time": "06:30", "artist": "Closing Set"}
  ]'::jsonb
),
(
  'basement-rave-003',
  'BASEMENT RAVE',
  '2026-04-18',
  '23:59',
  '10:00',
  'Illegal vibes in a legal space. Raw, unfiltered techno.',
  'Basement Rave captures the spirit of the 90s illegal warehouse parties. Low ceilings, massive sound, strobe lights, and a crowd united by the love of hard techno. Limited capacity - get your tickets early.',
  ARRAY['DAX J', '999999999', 'I Hate Models', 'KINKER Residents'],
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/basement-rave-003',
  'special',
  'CHF 40',
  '[
    {"time": "23:59", "artist": "KINKER Residents"},
    {"time": "01:30", "artist": "999999999"},
    {"time": "03:30", "artist": "I Hate Models"},
    {"time": "05:30", "artist": "DAX J"},
    {"time": "08:00", "artist": "Afterhours"}
  ]'::jsonb
),
(
  'schwarz-nacht-015',
  'SCHWARZ NACHT',
  '2026-04-25',
  '23:00',
  '07:00',
  'Dark techno and EBM fusion night. Dress in black.',
  'Schwarz Nacht blends the hardest techno with EBM and darkwave influences. A night for those who like their music dark, aggressive, and unrelenting. All-black dress code encouraged but not required.',
  ARRAY['Ancient Methods', 'Phase Fatale', 'Schwefelgelb', 'Blush Response'],
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/schwarz-nacht-015',
  'clubnight',
  'CHF 30',
  '[
    {"time": "23:00", "artist": "Blush Response"},
    {"time": "01:00", "artist": "Schwefelgelb"},
    {"time": "03:00", "artist": "Phase Fatale"},
    {"time": "05:00", "artist": "Ancient Methods"}
  ]'::jsonb
),
(
  'kinker-festival-2026',
  'KINKER FESTIVAL 2026',
  '2026-05-15',
  '14:00',
  '12:00',
  'Our annual outdoor festival. 3 stages, 24 hours of techno.',
  'The biggest event of the year. KINKER Festival transforms an industrial outdoor location into techno heaven. Three stages, world-class lineup, and 24 hours of non-stop dancing. Camping available.',
  ARRAY['Amelie Lens', 'Charlotte de Witte', 'Nina Kraviz', 'Adam Beyer', 'Enrico Sangiuliano', 'Josef K', 'and many more...'],
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/kinker-festival-2026',
  'festival',
  'CHF 85',
  '[]'::jsonb
),
(
  'acid-madness-007',
  'ACID MADNESS',
  '2026-05-02',
  '23:00',
  '08:00',
  '303 overload. Acid techno from the underground.',
  'A night dedicated to the Roland TB-303 and all things acid. From classic Chicago acid to modern hard acid techno, this night will make your teeth rattle and your mind expand.',
  ARRAY['Hardfloor', 'Plastikman', 'Regal', 'Boston 168'],
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=2070&auto=format&fit=crop',
  'https://tickets.kinker.ch/acid-madness-007',
  'clubnight',
  'CHF 28',
  '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read own subscription" ON newsletter_subscribers FOR SELECT USING (true);
