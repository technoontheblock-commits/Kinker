-- Add 'abendkasse' role so evening-cashier staff can top up wallets.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'user', 'moderator', 'coworker', 'bar', 'abendkasse'));

-- Atomic top-up function for the evening cashier.
-- Locks the wallet row, credits the balance and writes an immutable top_up transaction.
CREATE OR REPLACE FUNCTION process_bar_topup(
  p_customer_id UUID,
  p_staff_id UUID,
  p_amount DECIMAL(10, 2),
  p_payment_method TEXT,
  p_reference TEXT
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

  -- Lock wallet row
  SELECT id, balance
  INTO v_wallet_id, v_current_balance
  FROM bar_wallets
  WHERE user_id = p_customer_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for customer %', p_customer_id;
  END IF;

  -- Credit wallet
  UPDATE bar_wallets
  SET balance = balance + p_amount
  WHERE id = v_wallet_id;

  -- Record immutable top-up transaction
  INSERT INTO bar_wallet_transactions (
    wallet_id, user_id, amount, type, status,
    description, reference, metadata
  ) VALUES (
    v_wallet_id, p_customer_id, p_amount, 'top_up', 'completed',
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
