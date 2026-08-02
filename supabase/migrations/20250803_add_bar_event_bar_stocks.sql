CREATE TABLE bar_event_bar_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES bar_events(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES event_bars(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES bar_products(id) ON DELETE CASCADE,
  initial_stock INT,
  initial_submitted_at TIMESTAMPTZ,
  initial_submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  final_stock INT,
  final_submitted_at TIMESTAMPTZ,
  final_submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, bar_id, product_id)
);

CREATE INDEX idx_bar_event_bar_stocks_event_bar ON bar_event_bar_stocks(event_id, bar_id);
CREATE INDEX idx_bar_event_bar_stocks_product ON bar_event_bar_stocks(product_id);
