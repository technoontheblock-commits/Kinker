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

-- Insert sample merchandise
INSERT INTO merchandise (name, description, price, category, sizes, stock, active) VALUES
('KINKER Hoodie Black', 'Premium quality hoodie with embroidered KINKER logo. 80% cotton, 20% polyester.', 89.90, 'clothing', ARRAY['S', 'M', 'L', 'XL', 'XXL'], 25, true),
('KINKER T-Shirt', 'Classic black t-shirt with red KINKER print. 100% organic cotton.', 39.90, 'clothing', ARRAY['S', 'M', 'L', 'XL', 'XXL'], 50, true),
('KINKER Beanie', 'Black beanie with embroidered logo. Perfect for winter nights.', 29.90, 'accessories', ARRAY['One Size'], 30, true),
('KINKER Tote Bag', 'Durable canvas tote bag with KINKER print.', 19.90, 'accessories', ARRAY['One Size'], 40, true),
('Techno Tuesday Mixtape', 'Limited edition USB stick with exclusive DJ sets from our residents.', 24.90, 'music', ARRAY['One Size'], 15, true);
