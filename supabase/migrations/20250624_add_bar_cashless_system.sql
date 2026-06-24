-- ============================================================
-- Kinker Bar Cashless System
-- ============================================================

-- 1. Add 'bar' role to the users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'moderator', 'coworker', 'bar'));

-- 2. Products available at the bar
CREATE TABLE IF NOT EXISTS bar_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'drink' CHECK (category IN ('drink', 'shot', 'snack', 'other')),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_products_active_sort ON bar_products(active, sort_order, name);

-- 3. Wallets for bar customers (linked to the custom public.users table)
CREATE TABLE IF NOT EXISTS bar_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'CHF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_bar_wallets_user_id ON bar_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_wallets_qr_token ON bar_wallets(qr_token);

-- Create a wallet for every existing user that does not have one yet
INSERT INTO bar_wallets (user_id, qr_token, balance, currency)
SELECT id, gen_random_uuid()::text, 0, 'CHF'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM bar_wallets WHERE bar_wallets.user_id = users.id
);

-- 4. Bar orders
CREATE TABLE IF NOT EXISTS bar_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tip_amount >= 0),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'CHF',
  receipt_type TEXT NOT NULL DEFAULT 'none' CHECK (receipt_type IN ('none', 'app', 'email')),
  receipt_sent BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_orders_customer_id ON bar_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_bar_orders_staff_id ON bar_orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_bar_orders_created_at ON bar_orders(created_at);

-- 5. Bar order items
CREATE TABLE IF NOT EXISTS bar_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES bar_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES bar_products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_order_items_order_id ON bar_order_items(order_id);

-- 6. Bar wallet transactions
CREATE TABLE IF NOT EXISTS bar_wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES bar_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES bar_orders(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'payment', 'tip', 'refund', 'cancel')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_wallet_transactions_wallet_id ON bar_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_bar_wallet_transactions_user_id ON bar_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bar_wallet_transactions_order_id ON bar_wallet_transactions(order_id);

-- 7. updated_at helper (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bar_products_updated_at ON bar_products;
CREATE TRIGGER update_bar_products_updated_at
  BEFORE UPDATE ON bar_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bar_wallets_updated_at ON bar_wallets;
CREATE TRIGGER update_bar_wallets_updated_at
  BEFORE UPDATE ON bar_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bar_orders_updated_at ON bar_orders;
CREATE TRIGGER update_bar_orders_updated_at
  BEFORE UPDATE ON bar_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Auto-create a bar wallet for every new user
CREATE OR REPLACE FUNCTION handle_new_bar_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bar_wallets (user_id, qr_token, balance, currency)
  VALUES (NEW.id, gen_random_uuid()::text, 0, 'CHF')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
CREATE TRIGGER on_public_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_bar_wallet();

-- 9. Atomic payment function
CREATE OR REPLACE FUNCTION process_bar_payment(
  p_order_number TEXT,
  p_customer_id UUID,
  p_staff_id UUID,
  p_items JSONB,
  p_tip_amount DECIMAL(10, 2),
  p_receipt_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL(10, 2);
  v_subtotal DECIMAL(10, 2) := 0;
  v_total DECIMAL(10, 2);
  v_order_id UUID;
  v_item JSONB;
  v_item_total DECIMAL(10, 2);
BEGIN
  -- Lock the customer's wallet row
  SELECT id, balance
  INTO v_wallet_id, v_current_balance
  FROM bar_wallets
  WHERE user_id = p_customer_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for customer %', p_customer_id;
  END IF;

  -- Calculate subtotal from the provided items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_total := (v_item->>'price')::DECIMAL(10, 2) * (v_item->>'quantity')::INTEGER;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  v_total := v_subtotal + p_tip_amount;

  IF v_current_balance < v_total THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', v_current_balance, v_total;
  END IF;

  -- Create the bar order
  INSERT INTO bar_orders (
    order_number, customer_id, staff_id, status,
    subtotal, tip_amount, total, currency,
    receipt_type, receipt_sent, metadata
  ) VALUES (
    p_order_number, p_customer_id, p_staff_id, 'paid',
    v_subtotal, p_tip_amount, v_total, 'CHF',
    p_receipt_type, false, jsonb_build_object('items', p_items)
  )
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO bar_order_items (
      order_id, product_id, name, price, quantity, total
    ) VALUES (
      v_order_id,
      (v_item->>'productId')::UUID,
      v_item->>'name',
      (v_item->>'price')::DECIMAL(10, 2),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::DECIMAL(10, 2) * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- Deduct the total from the wallet
  UPDATE bar_wallets
  SET balance = balance - v_total
  WHERE id = v_wallet_id;

  -- Main payment transaction
  INSERT INTO bar_wallet_transactions (
    wallet_id, user_id, order_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_wallet_id, p_customer_id, v_order_id, v_total, 'payment', 'completed',
    'Bar payment', p_order_number, jsonb_build_object('tip', p_tip_amount)
  );

  -- Separate tip transaction for reporting
  IF p_tip_amount > 0 THEN
    INSERT INTO bar_wallet_transactions (
      wallet_id, user_id, order_id, amount, type, status,
      description, reference, metadata
    ) VALUES (
      v_wallet_id, p_customer_id, v_order_id, p_tip_amount, 'tip', 'completed',
      'Trinkgeld', p_order_number, '{}'
    );
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', p_order_number,
    'subtotal', v_subtotal,
    'tip', p_tip_amount,
    'total', v_total,
    'remaining_balance', v_current_balance - v_total
  );
END;
$$;

-- ============================================================
-- Optional / Manual setup (uncomment and adjust as needed)
-- ============================================================

-- Make an existing user a bar staff member:
-- UPDATE users SET role = 'bar' WHERE email = 'bar@kinker.ch';

-- Insert sample bar products (uncomment to have test data):
-- INSERT INTO bar_products (name, price, category, active, sort_order) VALUES
--   ('Bier', 5.00, 'drink', true, 1),
--   ('Wein', 6.50, 'drink', true, 2),
--   ('Softdrink', 4.00, 'drink', true, 3),
--   ('Wasser', 3.00, 'drink', true, 4),
--   ('Shot', 5.00, 'shot', true, 5),
--   ('Chips', 3.50, 'snack', true, 6);

-- Top up a wallet for testing (uncomment to add test credit):
-- UPDATE bar_wallets SET balance = 100.00
-- WHERE user_id = (SELECT id FROM users WHERE email = 'test@kinker.ch');
