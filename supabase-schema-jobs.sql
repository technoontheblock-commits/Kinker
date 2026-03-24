-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Basel',
  description TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read jobs" ON jobs;
DROP POLICY IF EXISTS "Allow public insert jobs" ON jobs;
DROP POLICY IF EXISTS "Allow public update jobs" ON jobs;
DROP POLICY IF EXISTS "Allow public delete jobs" ON jobs;

-- Create policies
CREATE POLICY "Allow public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow public insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete jobs" ON jobs FOR DELETE USING (true);

-- Insert sample jobs
INSERT INTO jobs (title, department, type, location, description, status) VALUES
('Barkeeper', 'Bar', 'Part-time', 'Basel', 'Wir suchen erfahrene Barkeeper für unsere Club-Nächte. Du solltest Erfahrung im Umgang mit Gästen haben und unter Druck arbeiten können.', 'Active'),
('Security', 'Security', 'Part-time', 'Basel', 'Wir suchen zuverlässige Security-Mitarbeiter für den Einlass und die Sicherheit im Club.', 'Active'),
('Lichttechniker', 'Technik', 'Freelance', 'Basel', 'Für unsere Events suchen wir einen erfahrenen Lichttechniker mit Kenntnissen in MA Lighting und grandMA.', 'Inactive');
