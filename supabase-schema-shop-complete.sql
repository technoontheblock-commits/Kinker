-- ============================================
-- KINKER COMPLETE SHOP + TICKET SYSTEM
-- ============================================

-- Products Table
CREATE TABLE IF NOT EXISTS products (
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

-- Event Tickets Table (linked to events)
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- z.B. "Early Bird", "Regular", "VIP"
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  max_quantity INTEGER DEFAULT 100,
  sold_count INTEGER DEFAULT 0,
  sale_start TIMESTAMP WITH TIME ZONE,
  sale_end TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Cart Table (for logged in users)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT, -- for guests
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  event_ticket_id UUID REFERENCES event_tickets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_item_type CHECK (
    (product_id IS NOT NULL AND event_ticket_id IS NULL) OR
    (product_id IS NULL AND event_ticket_id IS NOT NULL)
  )
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL, -- KINKER-2024-000001
  user_id UUID,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  
  -- Payment
  payment_method TEXT NOT NULL CHECK (payment_method IN ('twint', 'bank_transfer', 'invoice', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Totals
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_code TEXT,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed')),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  event_ticket_id UUID REFERENCES event_tickets(id),
  
  name TEXT NOT NULL, -- snapshot at time of purchase
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  selected_size TEXT,
  
  -- For tickets
  is_ticket BOOLEAN DEFAULT false,
  event_id UUID,
  event_name TEXT,
  event_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Tickets (with QR codes)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id),
  event_ticket_id UUID REFERENCES event_tickets(id),
  
  -- Ticket Info
  ticket_number TEXT UNIQUE NOT NULL, -- T-2024-000001-A1
  qr_code TEXT UNIQUE NOT NULL, -- encrypted data
  qr_secret TEXT NOT NULL, -- for validation
  
  -- Status
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  
  -- Usage
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID, -- scanner user id
  scan_location TEXT, -- e.g. "Main Entrance", "VIP Entrance"
  
  -- Customer (for transfer)
  holder_name TEXT,
  holder_email TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scanner Users (Door Staff)
CREATE TABLE IF NOT EXISTS scanner_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'scanner' CHECK (role IN ('scanner', 'admin', 'manager')),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Scan Log
CREATE TABLE IF NOT EXISTS ticket_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  scanned_by UUID REFERENCES scanner_users(id),
  scanner_name TEXT, -- snapshot
  
  scan_result TEXT NOT NULL CHECK (scan_result IN ('valid', 'already_used', 'invalid', 'cancelled')),
  scan_location TEXT,
  device_info TEXT, -- user agent / device
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;

-- Policies for Products
DROP POLICY IF EXISTS "products_read" ON products;
DROP POLICY IF EXISTS "products_write" ON products;
CREATE POLICY "products_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_write" ON products FOR ALL USING (true);

-- Policies for Event Tickets
DROP POLICY IF EXISTS "event_tickets_read" ON event_tickets;
DROP POLICY IF EXISTS "event_tickets_write" ON event_tickets;
CREATE POLICY "event_tickets_read" ON event_tickets FOR SELECT USING (true);
CREATE POLICY "event_tickets_write" ON event_tickets FOR ALL USING (true);

-- Policies for Cart
DROP POLICY IF EXISTS "cart_all" ON cart_items;
CREATE POLICY "cart_all" ON cart_items FOR ALL USING (true);

-- Policies for Orders
DROP POLICY IF EXISTS "orders_all" ON orders;
CREATE POLICY "orders_all" ON orders FOR ALL USING (true);

-- Policies for Order Items
DROP POLICY IF EXISTS "order_items_all" ON order_items;
CREATE POLICY "order_items_all" ON order_items FOR ALL USING (true);

-- Policies for Tickets
DROP POLICY IF EXISTS "tickets_read" ON tickets;
DROP POLICY IF EXISTS "tickets_write" ON tickets;
CREATE POLICY "tickets_read" ON tickets FOR SELECT USING (true);
CREATE POLICY "tickets_write" ON tickets FOR ALL USING (true);

-- Policies for Scanner Users
DROP POLICY IF EXISTS "scanner_users_all" ON scanner_users;
CREATE POLICY "scanner_users_all" ON scanner_users FOR ALL USING (true);

-- Policies for Ticket Scans
DROP POLICY IF EXISTS "ticket_scans_all" ON ticket_scans;
CREATE POLICY "ticket_scans_all" ON ticket_scans FOR ALL USING (true);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample scanner user (password: scanner123)
INSERT INTO scanner_users (name, email, password_hash, role, active) VALUES
('Abendkasse 1', 'kasse1@kinker.ch', 'scanner123', 'scanner', true),
('Abendkasse 2', 'kasse2@kinker.ch', 'scanner123', 'scanner', true),
('Manager', 'manager@kinker.ch', 'scanner123', 'manager', true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get the next sequence number for this year
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'KINKER-' || year || '-%';
  
  new_number := 'KINKER-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  order_num TEXT;
  ticket_count INTEGER;
  new_number TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get order number
  SELECT order_number INTO order_num
  FROM orders
  WHERE id = p_order_id;
  
  -- Extract sequence from order number
  ticket_count := (SELECT COUNT(*) FROM tickets WHERE order_id = p_order_id) + 1;
  
  new_number := 'T-' || year || '-' || SUBSTRING(order_num FROM 'KINKER-\d{4}-(\d+)') || '-' || CHR(64 + ticket_count);
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
