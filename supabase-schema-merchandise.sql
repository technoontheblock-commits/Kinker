-- Merchandise Table
CREATE TABLE IF NOT EXISTS merchandise (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL DEFAULT 'clothing',
  sizes TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read merchandise" ON merchandise;
DROP POLICY IF EXISTS "Allow public insert merchandise" ON merchandise;
DROP POLICY IF EXISTS "Allow public update merchandise" ON merchandise;
DROP POLICY IF EXISTS "Allow public delete merchandise" ON merchandise;

-- Create policies
CREATE POLICY "Allow public read merchandise" ON merchandise FOR SELECT USING (true);
CREATE POLICY "Allow public insert merchandise" ON merchandise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update merchandise" ON merchandise FOR UPDATE USING (true);
CREATE POLICY "Allow public delete merchandise" ON merchandise FOR DELETE USING (true);

-- Note: Add products via Admin Dashboard
