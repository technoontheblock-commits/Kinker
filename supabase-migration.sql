-- KINKER Database Migration
-- Safe migration: Only adds missing columns/policies, never drops data

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Events Table (if not exists)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT,
  description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  lineup TEXT[] NOT NULL DEFAULT '{}',
  image TEXT NOT NULL DEFAULT '',
  ticket_url TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('clubnight', 'festival', 'special')),
  price TEXT NOT NULL DEFAULT 'CHF 25',
  timetable JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscribers Table (if not exists)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. USER MANAGEMENT
-- ============================================

-- Users/Staff Table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. NOTIFICATIONS SYSTEM
-- ============================================

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('booking', 'contact', 'career', 'system', 'rental')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CAREERS / JOBS
-- ============================================

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Part-time', 'Full-time', 'Freelance')),
  location TEXT NOT NULL DEFAULT 'Basel',
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. RENTAL INQUIRIES
-- ============================================

-- Rental Inquiries Table
CREATE TABLE IF NOT EXISTS rental_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT NOT NULL,
  event_date DATE,
  guests INTEGER,
  rooms TEXT[] DEFAULT '{}',
  extras TEXT[] DEFAULT '{}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_inquiries ENABLE ROW LEVEL SECURITY;

-- Events: Public read, Admin write
DROP POLICY IF EXISTS "Allow public read access" ON events;
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);

-- Newsletter: Public insert, Admin read
DROP POLICY IF EXISTS "Allow public insert" ON newsletter_subscribers;
CREATE POLICY "Allow public insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Users: Admin only (for now - use service role key)
DROP POLICY IF EXISTS "Allow admin full access" ON users;
CREATE POLICY "Allow admin full access" ON users FOR ALL USING (true);

-- Notifications: Admin only
DROP POLICY IF EXISTS "Allow admin full access" ON notifications;
CREATE POLICY "Allow admin full access" ON notifications FOR ALL USING (true);

-- Jobs: Public read, Admin write
DROP POLICY IF EXISTS "Allow public read jobs" ON jobs;
CREATE POLICY "Allow public read jobs" ON jobs FOR SELECT USING (true);

-- Job Applications: Public insert, Admin read
DROP POLICY IF EXISTS "Allow public insert applications" ON job_applications;
CREATE POLICY "Allow public insert applications" ON job_applications FOR INSERT WITH CHECK (true);

-- Rental Inquiries: Public insert, Admin read
DROP POLICY IF EXISTS "Allow public insert inquiries" ON rental_inquiries;
CREATE POLICY "Allow public insert inquiries" ON rental_inquiries FOR INSERT WITH CHECK (true);

-- ============================================
-- 7. SAMPLE DATA
-- ============================================

-- Sample Users (only if empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (name, email, role, status) VALUES
        ('Admin User', 'admin@kinker.de', 'admin', 'active'),
        ('Max Mustermann', 'max@example.com', 'user', 'active'),
        ('Anna Schmidt', 'anna@example.com', 'user', 'active'),
        ('John Doe', 'john@example.com', 'moderator', 'active');
    END IF;
END $$;

-- Sample Notifications (only if empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM notifications LIMIT 1) THEN
        INSERT INTO notifications (type, title, message, read) VALUES
        ('booking', 'Neue Raumanfrage', 'Neue Anfrage für Wohnzimmer am 15.04.2024', false),
        ('contact', 'Kontaktformular', 'Neue Nachricht von max@example.com', false),
        ('career', 'Neue Bewerbung', 'Bewerbung als Barkeeper eingegangen', true),
        ('system', 'System Update', 'System erfolgreich aktualisiert', true);
    END IF;
END $$;

-- Sample Jobs (only if empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM jobs LIMIT 1) THEN
        INSERT INTO jobs (title, department, type, location, description, requirements, status) VALUES
        ('Barkeeper', 'Bar', 'Part-time', 'Basel', 
         'Du bist verantwortlich für die Zubereitung von Getränken und den Umgang mit Gästen.',
         ARRAY['Erfahrung in der Gastronomie', 'Gute Deutsch- und Englischkenntnisse', 'Teamfähigkeit'],
         'active'),
        ('Security', 'Security', 'Part-time', 'Basel',
         'Du sorgst für die Sicherheit unserer Gäste und des Personals.',
         ARRAY['Bewachungsbewilligung (von Vorteil)', 'Gute Deutsch- und Englischkenntnisse', 'Hohe Sozialkompetenz'],
         'active'),
        ('Lichttechniker', 'Technik', 'Freelance', 'Basel',
         'Du bist verantwortlich für das Lichtdesign bei unseren Events.',
         ARRAY['Erfahrung mit Lichtanlagen (MA Lighting, Avolites)', 'Flexibilität'],
         'active');
    END IF;
END $$;

-- Sample Events (with floor-based lineup)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM events LIMIT 1) THEN
        INSERT INTO events (id, name, date, time, end_time, description, full_description, lineup, image, ticket_url, type, price, timetable) VALUES
        (
          'techno-tuesday-001',
          'TECHNO TUESDAY',
          '2026-04-07',
          '23:00',
          '06:00',
          'Weekly underground techno session with local and international DJs.',
          'Join us every Tuesday for the darkest techno night in Basel.',
          ARRAY['Marco Bailey', 'Basel Underground Collective', 'KINKER Residents'],
          'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070&auto=format&fit=crop',
          'https://tickets.kinker.ch/techno-tuesday-001',
          'clubnight',
          'CHF 25',
          '[
            {"name": "Wohnzimmer", "djs": [{"name": "Marco Bailey", "type": "main"}, {"name": "Basel Underground Collective", "type": "support"}], "active": true},
            {"name": "Bunker", "djs": [{"name": "KINKER Residents", "type": "main"}], "active": true}
          ]'::jsonb
        ),
        (
          'hard-sessions-042',
          'HARD SESSIONS #42',
          '2026-04-12',
          '22:00',
          '08:00',
          'Industrial hard techno all night long. Bring your energy.',
          'Hard Sessions returns for its 42nd edition.',
          ARRAY['SNTS', 'Somniac One', 'Nico Moreno', 'KOR'],
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
          'https://tickets.kinker.ch/hard-sessions-042',
          'special',
          'CHF 35',
          '[
            {"name": "Wohnzimmer", "djs": [{"name": "SNTS", "type": "main"}, {"name": "Somniac One", "type": "main"}], "active": true},
            {"name": "Bunker", "djs": [{"name": "Nico Moreno", "type": "main"}, {"name": "KOR", "type": "support"}], "active": true}
          ]'::jsonb
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 8. STORAGE BUCKET (Manual step required!)
-- ============================================
-- Go to Supabase Dashboard → Storage → New Bucket
-- Name: "images", Public: true

-- Migration complete!
SELECT 'Migration completed successfully!' as status;
