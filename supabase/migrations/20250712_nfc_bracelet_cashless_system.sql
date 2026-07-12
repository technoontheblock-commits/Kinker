-- ============================================================
-- Kinker NFC Bracelet Cashless System
-- Replaces the QR-code/user-based bar cashless system with an
-- anonymous, reusable NFC wristband wallet for festival events.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Clean up legacy QR/user-based bar wallet system
-- ------------------------------------------------------------

-- Remove auto-wallet creation trigger for new users
DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
DROP FUNCTION IF EXISTS handle_new_bar_wallet();

-- Drop reporting function that depends on legacy tables
DROP FUNCTION IF EXISTS get_event_bar_stats(UUID);

-- Drop atomic functions that depend on legacy tables
DROP FUNCTION IF EXISTS process_bar_payment(TEXT, UUID, UUID, JSONB, DECIMAL, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS process_bar_topup(UUID, UUID, DECIMAL, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS process_bar_payment(TEXT, UUID, UUID, JSONB, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS process_bar_topup(UUID, UUID, DECIMAL, TEXT, TEXT);

-- Drop legacy wallet transaction table
DROP TABLE IF EXISTS bar_wallet_transactions;

-- Drop legacy wallet table
DROP TABLE IF EXISTS bar_wallets;

-- Remove QR-token related indexes on bar_orders if any remain
DROP INDEX IF EXISTS idx_bar_orders_customer_id;

-- Remove customer_id from bar_orders (anonymous festival bracelets)
ALTER TABLE bar_orders
  DROP CONSTRAINT IF EXISTS bar_orders_customer_id_fkey;
ALTER TABLE bar_orders
  DROP COLUMN IF EXISTS customer_id;

-- ------------------------------------------------------------
-- 2. NFC bracelet table: each wristband is its own wallet
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bar_bracelets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nfc_uid TEXT NOT NULL UNIQUE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'CHF',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'lost', 'refunded', 'void')),
  event_id UUID REFERENCES bar_events(id) ON DELETE SET NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  replaced_by_bracelet_id UUID REFERENCES bar_bracelets(id) ON DELETE SET NULL,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_bracelets_nfc_uid ON bar_bracelets(nfc_uid);
CREATE INDEX IF NOT EXISTS idx_bar_bracelets_status ON bar_bracelets(status);
CREATE INDEX IF NOT EXISTS idx_bar_bracelets_event_id ON bar_bracelets(event_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_bar_bracelets_updated_at ON bar_bracelets;
CREATE TRIGGER update_bar_bracelets_updated_at
  BEFORE UPDATE ON bar_bracelets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 3. Link bar_orders to bracelets instead of users
-- ------------------------------------------------------------
ALTER TABLE bar_orders
  ADD COLUMN IF NOT EXISTS bracelet_id UUID REFERENCES bar_bracelets(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_bar_orders_bracelet_id ON bar_orders(bracelet_id);

-- ------------------------------------------------------------
-- 4. Bracelet transaction ledger
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bar_bracelet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bracelet_id UUID NOT NULL REFERENCES bar_bracelets(id) ON DELETE CASCADE,
  order_id UUID REFERENCES bar_orders(id) ON DELETE SET NULL,
  event_id UUID REFERENCES bar_events(id) ON DELETE SET NULL,
  bar_id UUID REFERENCES event_bars(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('top_up', 'payment', 'tip', 'refund', 'cancel')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_bracelet_transactions_bracelet_id ON bar_bracelet_transactions(bracelet_id);
CREATE INDEX IF NOT EXISTS idx_bar_bracelet_transactions_order_id ON bar_bracelet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_bar_bracelet_transactions_event_id ON bar_bracelet_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_bar_bracelet_transactions_bar_id ON bar_bracelet_transactions(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_bracelet_transactions_created_at ON bar_bracelet_transactions(created_at);

-- ------------------------------------------------------------
-- 5. Atomic top-up function for NFC bracelets
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_bracelet_topup(
  p_nfc_uid TEXT,
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
  v_bracelet_id UUID;
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
  INTO v_bracelet_id, v_current_balance
  FROM bar_bracelets
  WHERE nfc_uid = p_nfc_uid
  FOR UPDATE;

  IF v_bracelet_id IS NULL THEN
    RAISE EXCEPTION 'Bracelet not found for NFC UID %', p_nfc_uid;
  END IF;

  IF (SELECT status FROM bar_bracelets WHERE id = v_bracelet_id) != 'active' THEN
    RAISE EXCEPTION 'Bracelet is not active';
  END IF;

  UPDATE bar_bracelets
  SET balance = balance + p_amount
  WHERE id = v_bracelet_id;

  INSERT INTO bar_bracelet_transactions (
    bracelet_id, event_id, bar_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_bracelet_id, p_event_id, p_bar_id, p_amount, 'top_up', 'completed',
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
    'bracelet_id', v_bracelet_id,
    'amount', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_current_balance + p_amount,
    'reference', p_reference,
    'payment_method', p_payment_method
  );
END;
$$;

-- ------------------------------------------------------------
-- 6. Atomic payment function for NFC bracelets
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_bracelet_payment(
  p_order_number TEXT,
  p_nfc_uid TEXT,
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
  v_bracelet_id UUID;
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
  INTO v_bracelet_id, v_current_balance
  FROM bar_bracelets
  WHERE nfc_uid = p_nfc_uid
  FOR UPDATE;

  IF v_bracelet_id IS NULL THEN
    RAISE EXCEPTION 'Bracelet not found for NFC UID %', p_nfc_uid;
  END IF;

  IF (SELECT status FROM bar_bracelets WHERE id = v_bracelet_id) != 'active' THEN
    RAISE EXCEPTION 'Bracelet is not active';
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
    order_number, bracelet_id, staff_id, event_id, bar_id, status,
    subtotal, tip_amount, total, currency,
    receipt_type, receipt_sent, metadata
  ) VALUES (
    p_order_number, v_bracelet_id, p_staff_id, p_event_id, p_bar_id, 'paid',
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

  UPDATE bar_bracelets
  SET balance = balance - v_total
  WHERE id = v_bracelet_id;

  INSERT INTO bar_bracelet_transactions (
    bracelet_id, order_id, event_id, bar_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_bracelet_id, v_order_id, p_event_id, p_bar_id, v_total, 'payment', 'completed',
    'Bar payment', p_order_number, jsonb_build_object('tip', p_tip_amount)
  );

  IF p_tip_amount > 0 THEN
    INSERT INTO bar_bracelet_transactions (
      bracelet_id, order_id, event_id, bar_id, amount, type, status,
      description, reference, metadata
    ) VALUES (
      v_bracelet_id, v_order_id, p_event_id, p_bar_id, p_tip_amount, 'tip', 'completed',
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

-- ------------------------------------------------------------
-- 7. Bracelet helper: lookup by NFC UID
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_bracelet_by_nfc_uid(p_nfc_uid TEXT)
RETURNS TABLE (
  id UUID,
  nfc_uid TEXT,
  balance DECIMAL(10, 2),
  currency TEXT,
  status TEXT,
  event_id UUID,
  issued_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  note TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.nfc_uid,
    b.balance,
    b.currency,
    b.status,
    b.event_id,
    b.issued_at,
    b.activated_at,
    b.note,
    b.metadata
  FROM bar_bracelets b
  WHERE b.nfc_uid = p_nfc_uid;
END;
$$;

-- ------------------------------------------------------------
-- 8. Bracelet replacement: transfer balance from lost to new bracelet
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION replace_bracelet(
  p_old_nfc_uid TEXT,
  p_new_nfc_uid TEXT,
  p_staff_id UUID,
  p_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_bracelet_id UUID;
  v_new_bracelet_id UUID;
  v_old_balance DECIMAL(10, 2);
  v_old_status TEXT;
BEGIN
  SELECT id, balance, status
  INTO v_old_bracelet_id, v_old_balance, v_old_status
  FROM bar_bracelets
  WHERE nfc_uid = p_old_nfc_uid
  FOR UPDATE;

  IF v_old_bracelet_id IS NULL THEN
    RAISE EXCEPTION 'Old bracelet not found';
  END IF;

  IF v_old_status IN ('refunded', 'void') THEN
    RAISE EXCEPTION 'Old bracelet is already refunded or void';
  END IF;

  SELECT id
  INTO v_new_bracelet_id
  FROM bar_bracelets
  WHERE nfc_uid = p_new_nfc_uid
  FOR UPDATE;

  IF v_new_bracelet_id IS NULL THEN
    RAISE EXCEPTION 'New bracelet not found';
  END IF;

  IF (SELECT status FROM bar_bracelets WHERE id = v_new_bracelet_id) != 'active' THEN
    RAISE EXCEPTION 'New bracelet is not active';
  END IF;

  IF v_old_balance > 0 THEN
    -- Debit old bracelet
    UPDATE bar_bracelets
    SET balance = 0, status = 'lost', deactivated_at = NOW(), replaced_by_bracelet_id = v_new_bracelet_id
    WHERE id = v_old_bracelet_id;

    -- Credit new bracelet
    UPDATE bar_bracelets
    SET balance = balance + v_old_balance
    WHERE id = v_new_bracelet_id;

    -- Log transfer transactions
    INSERT INTO bar_bracelet_transactions (
      bracelet_id, amount, type, status, description, reference, metadata
    ) VALUES (
      v_old_bracelet_id, v_old_balance, 'refund', 'completed',
      'Guthaben auf neues Armband uebertragen',
      p_reference,
      jsonb_build_object('staff_id', p_staff_id, 'transfer_to_bracelet_id', v_new_bracelet_id)
    );

    INSERT INTO bar_bracelet_transactions (
      bracelet_id, amount, type, status, description, reference, metadata
    ) VALUES (
      v_new_bracelet_id, v_old_balance, 'top_up', 'completed',
      'Guthaben von verlorenem Armband uebertragen',
      p_reference,
      jsonb_build_object('staff_id', p_staff_id, 'transfer_from_bracelet_id', v_old_bracelet_id)
    );
  ELSE
    UPDATE bar_bracelets
    SET status = 'lost', deactivated_at = NOW(), replaced_by_bracelet_id = v_new_bracelet_id
    WHERE id = v_old_bracelet_id;
  END IF;

  RETURN jsonb_build_object(
    'old_bracelet_id', v_old_bracelet_id,
    'new_bracelet_id', v_new_bracelet_id,
    'transferred_balance', v_old_balance
  );
END;
$$;

-- ------------------------------------------------------------
-- 9. Refund remaining balance on a bracelet
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION refund_bracelet_balance(
  p_nfc_uid TEXT,
  p_staff_id UUID,
  p_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_bracelet_id UUID;
  v_balance DECIMAL(10, 2);
BEGIN
  SELECT id, balance
  INTO v_bracelet_id, v_balance
  FROM bar_bracelets
  WHERE nfc_uid = p_nfc_uid
  FOR UPDATE;

  IF v_bracelet_id IS NULL THEN
    RAISE EXCEPTION 'Bracelet not found';
  END IF;

  IF v_balance > 0 THEN
    UPDATE bar_bracelets
    SET balance = 0
    WHERE id = v_bracelet_id;

    INSERT INTO bar_bracelet_transactions (
      bracelet_id, amount, type, status, description, reference, metadata
    ) VALUES (
      v_bracelet_id, v_balance, 'refund', 'completed',
      'Restguthaben zurueckgezahlt',
      p_reference,
      jsonb_build_object('staff_id', p_staff_id)
    );
  END IF;

  UPDATE bar_bracelets
  SET status = 'refunded', deactivated_at = NOW()
  WHERE id = v_bracelet_id;

  RETURN jsonb_build_object(
    'bracelet_id', v_bracelet_id,
    'refunded_balance', v_balance
  );
END;
$$;

-- ------------------------------------------------------------
-- 10. Reporting helper: per-bar sales and tips for an event
-- ------------------------------------------------------------
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
  LEFT JOIN bar_bracelet_transactions t ON t.bar_id = b.id AND t.event_id = p_event_id AND t.type IN ('payment', 'tip')
  WHERE b.event_id = p_event_id
  GROUP BY b.id, b.name
  ORDER BY b.sort_order, b.name;
END;
$$;
