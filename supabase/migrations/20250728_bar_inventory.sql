-- ============================================================
-- Kinker Bar Inventory System
-- Adds barcode tracking, inventory transactions, and automatic
-- stock deduction on cashless bar sales.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add barcode to bar products
-- ------------------------------------------------------------
ALTER TABLE bar_products
  ADD COLUMN IF NOT EXISTS barcode TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bar_products_barcode
  ON bar_products(barcode)
  WHERE barcode IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Inventory transaction ledger
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bar_inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES bar_products(id) ON DELETE RESTRICT,
  bar_id UUID REFERENCES event_bars(id) ON DELETE SET NULL,
  event_id UUID REFERENCES bar_events(id) ON DELETE SET NULL,
  quantity_change INTEGER NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('delivery', 'transfer_out', 'transfer_in', 'sale', 'correction')),
  order_id UUID REFERENCES bar_orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES bar_order_items(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bar_inventory_transactions_product_id ON bar_inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_bar_inventory_transactions_bar_id ON bar_inventory_transactions(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_inventory_transactions_event_id ON bar_inventory_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_bar_inventory_transactions_type ON bar_inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_bar_inventory_transactions_created_at ON bar_inventory_transactions(created_at DESC);

-- ------------------------------------------------------------
-- 3. Automatically deduct stock when a bar order item is created
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION deduct_bar_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_bar_id UUID;
  v_event_id UUID;
BEGIN
  SELECT bar_id, event_id
  INTO v_bar_id, v_event_id
  FROM bar_orders
  WHERE id = NEW.order_id;

  IF v_bar_id IS NOT NULL THEN
    INSERT INTO bar_inventory_transactions (
      product_id, bar_id, event_id, quantity_change, type,
      order_id, order_item_id, notes
    ) VALUES (
      NEW.product_id, v_bar_id, v_event_id, -NEW.quantity, 'sale',
      NEW.order_id, NEW.id, 'Automatisch durch Bar-Verkauf'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_inventory_on_sale ON bar_order_items;
CREATE TRIGGER trg_deduct_inventory_on_sale
  AFTER INSERT ON bar_order_items
  FOR EACH ROW EXECUTE FUNCTION deduct_bar_inventory_on_sale();
