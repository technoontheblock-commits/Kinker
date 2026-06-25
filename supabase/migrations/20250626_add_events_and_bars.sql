-- ============================================================
-- Events & Bars for cashless reporting
-- ============================================================

-- 1. Cashless events table (separate from public events to avoid conflicts)
CREATE TABLE IF NOT EXISTS bar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed', 'cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_events_date ON bar_events(date);
CREATE INDEX IF NOT EXISTS idx_bar_events_status ON bar_events(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_bar_events_updated_at ON bar_events;
CREATE TRIGGER update_bar_events_updated_at
  BEFORE UPDATE ON bar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Bars per event
CREATE TABLE IF NOT EXISTS event_bars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES bar_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_bars_event_id ON event_bars(event_id);

-- 3. Extend bar_orders with event and bar references
ALTER TABLE bar_orders
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES bar_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bar_id UUID REFERENCES event_bars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bar_orders_event_id ON bar_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_bar_orders_bar_id ON bar_orders(bar_id);

-- 4. Extend bar_wallet_transactions with event and bar references
ALTER TABLE bar_wallet_transactions
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES bar_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bar_id UUID REFERENCES event_bars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bar_wallet_transactions_event_id ON bar_wallet_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_bar_wallet_transactions_bar_id ON bar_wallet_transactions(bar_id);

-- 5. Update atomic payment function to include event/bar context
CREATE OR REPLACE FUNCTION process_bar_payment(
  p_order_number TEXT,
  p_customer_id UUID,
  p_staff_id UUID,
  p_items JSONB,
  p_tip_amount DECIMAL(10, 2),
  p_receipt_type TEXT,
  p_event_id UUID DEFAULT NULL,
  p_bar_id UUID DEFAULT NULL
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
  IF p_event_id IS NOT NULL THEN
    IF p_bar_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM event_bars WHERE id = p_bar_id AND event_id = p_event_id
    ) THEN
      RAISE EXCEPTION 'Bar does not belong to event';
    END IF;
  END IF;

  SELECT id, balance
  INTO v_wallet_id, v_current_balance
  FROM bar_wallets
  WHERE user_id = p_customer_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for customer %', p_customer_id;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_total := (v_item->>'price')::DECIMAL(10, 2) * (v_item->>'quantity')::INTEGER;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  v_total := v_subtotal + p_tip_amount;

  IF v_current_balance < v_total THEN
    RAISE EXCEPTION 'Insufficient balance: % < %', v_current_balance, v_total;
  END IF;

  INSERT INTO bar_orders (
    order_number, customer_id, staff_id, event_id, bar_id, status,
    subtotal, tip_amount, total, currency,
    receipt_type, receipt_sent, metadata
  ) VALUES (
    p_order_number, p_customer_id, p_staff_id, p_event_id, p_bar_id, 'paid',
    v_subtotal, p_tip_amount, v_total, 'CHF',
    p_receipt_type, false, jsonb_build_object('items', p_items)
  )
  RETURNING id INTO v_order_id;

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

  UPDATE bar_wallets
  SET balance = balance - v_total
  WHERE id = v_wallet_id;

  INSERT INTO bar_wallet_transactions (
    wallet_id, user_id, order_id, event_id, bar_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_wallet_id, p_customer_id, v_order_id, p_event_id, p_bar_id, v_total, 'payment', 'completed',
    'Bar payment', p_order_number, jsonb_build_object('tip', p_tip_amount)
  );

  IF p_tip_amount > 0 THEN
    INSERT INTO bar_wallet_transactions (
      wallet_id, user_id, order_id, event_id, bar_id, amount, type, status,
      description, reference, metadata
    ) VALUES (
      v_wallet_id, p_customer_id, v_order_id, p_event_id, p_bar_id, p_tip_amount, 'tip', 'completed',
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

-- 6. Update atomic top-up function to include event/bar context
CREATE OR REPLACE FUNCTION process_bar_topup(
  p_customer_id UUID,
  p_staff_id UUID,
  p_amount DECIMAL(10, 2),
  p_payment_method TEXT,
  p_reference TEXT,
  p_event_id UUID DEFAULT NULL,
  p_bar_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance DECIMAL(10, 2);
  v_transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Top-up amount must be positive';
  END IF;

  IF p_event_id IS NOT NULL AND p_bar_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM event_bars WHERE id = p_bar_id AND event_id = p_event_id
    ) THEN
      RAISE EXCEPTION 'Bar does not belong to event';
    END IF;
  END IF;

  SELECT id, balance
  INTO v_wallet_id, v_current_balance
  FROM bar_wallets
  WHERE user_id = p_customer_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for customer %', p_customer_id;
  END IF;

  UPDATE bar_wallets
  SET balance = balance + p_amount
  WHERE id = v_wallet_id;

  INSERT INTO bar_wallet_transactions (
    wallet_id, user_id, event_id, bar_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_wallet_id, p_customer_id, p_event_id, p_bar_id, p_amount, 'top_up', 'completed',
    'Guthaben aufgeladen (' || COALESCE(p_payment_method, 'unknown') || ')',
    p_reference,
    jsonb_build_object(
      'staff_id', p_staff_id,
      'payment_method', p_payment_method,
      'previous_balance', v_current_balance
    )
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'wallet_id', v_wallet_id,
    'amount', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_current_balance + p_amount,
    'reference', p_reference,
    'payment_method', p_payment_method
  );
END;
$$;

-- 7. Reporting helper: per-bar sales and tips for an event
CREATE OR REPLACE FUNCTION get_event_bar_stats(p_event_id UUID)
RETURNS TABLE (
  bar_id UUID,
  bar_name TEXT,
  order_count BIGINT,
  sales_total DECIMAL(10, 2),
  tip_total DECIMAL(10, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bar_id,
    b.name AS bar_name,
    COALESCE(COUNT(DISTINCT o.id), 0) AS order_count,
    COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS sales_total,
    COALESCE(SUM(CASE WHEN t.type = 'tip' THEN t.amount ELSE 0 END), 0) AS tip_total
  FROM event_bars b
  LEFT JOIN bar_orders o ON o.bar_id = b.id AND o.event_id = p_event_id
  LEFT JOIN bar_wallet_transactions t ON t.bar_id = b.id AND t.event_id = p_event_id AND t.type IN ('payment', 'tip')
  WHERE b.event_id = p_event_id
  GROUP BY b.id, b.name
  ORDER BY b.sort_order, b.name;
END;
$$;
