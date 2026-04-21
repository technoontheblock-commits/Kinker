-- Add Printful tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_shipping_carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printful_shipping_number TEXT;

-- Table for Printful products synced from Printful catalog
CREATE TABLE IF NOT EXISTS printful_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printful_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  variants JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Printful order tracking
CREATE TABLE IF NOT EXISTS printful_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  printful_order_id INTEGER NOT NULL,
  printful_external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_carrier TEXT,
  shipping_number TEXT,
  tracking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
