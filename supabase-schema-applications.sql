-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  cv_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'interview', 'hired', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read job_applications" ON job_applications;
DROP POLICY IF EXISTS "Allow public insert job_applications" ON job_applications;
DROP POLICY IF EXISTS "Allow public update job_applications" ON job_applications;
DROP POLICY IF EXISTS "Allow public delete job_applications" ON job_applications;

-- Create policies
CREATE POLICY "Allow public read job_applications" ON job_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert job_applications" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update job_applications" ON job_applications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete job_applications" ON job_applications FOR DELETE USING (true);

-- Insert sample applications (requires existing job IDs)
-- Note: Replace the job_id with actual UUIDs from your jobs table
-- INSERT INTO job_applications (job_id, name, email, phone, message, status) VALUES
-- ('your-job-uuid-here', 'Max Mustermann', 'max@example.com', '+41 79 123 45 67', 'Ich habe 5 Jahre Erfahrung als Barkeeper...', 'new'),
-- ('your-job-uuid-here', 'Anna Schmidt', 'anna@example.com', NULL, 'Ich würde mich sehr über eine Chance freuen...', 'reviewed');
