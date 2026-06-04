-- Create orders table if not exists
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if not exists
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  event_ticket_id UUID,
  vip_booking_id UUID,
  name TEXT,
  price NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  selected_size TEXT,
  is_ticket BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  event_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cart_items table if not exists
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  product_id UUID,
  event_ticket_id UUID,
  vip_booking_id UUID,
  quantity INTEGER DEFAULT 1,
  selected_size TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Printful tracking columns to orders
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
