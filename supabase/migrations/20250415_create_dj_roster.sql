-- Create DJ Roster Applications table
CREATE TABLE IF NOT EXISTS dj_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER,
  city TEXT,
  country TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  country_code TEXT,
  genre TEXT,
  experience TEXT,
  artist_image TEXT,
  instagram TEXT,
  soundcloud TEXT,
  presskit_url TEXT NOT NULL,
  standard_gage TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dj_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Allow anonymous DJ applications" ON dj_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users (admins) to read all
CREATE POLICY "Allow admin read DJ applications" ON dj_applications
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users (admins) to update status
CREATE POLICY "Allow admin update DJ applications" ON dj_applications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users (admins) to delete
CREATE POLICY "Allow admin delete DJ applications" ON dj_applications
  FOR DELETE TO authenticated USING (true);
