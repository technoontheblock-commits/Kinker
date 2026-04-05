-- ============================================
-- KANBAN BOARD SYSTEM SCHEMA
-- ============================================

-- 1. BOARDS TABLE
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LISTS TABLE (Columns)
CREATE TABLE IF NOT EXISTS kanban_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CARDS TABLE
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES kanban_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CARD COMMENTS TABLE
CREATE TABLE IF NOT EXISTS kanban_card_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Boards: Admins can do everything, users can view
DROP POLICY IF EXISTS "Admins can manage boards" ON kanban_boards;
CREATE POLICY "Admins can manage boards" ON kanban_boards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can view boards" ON kanban_boards;
CREATE POLICY "Users can view boards" ON kanban_boards
  FOR SELECT TO authenticated
  USING (true);

-- Lists: Admins can do everything, users can view
DROP POLICY IF EXISTS "Admins can manage lists" ON kanban_lists;
CREATE POLICY "Admins can manage lists" ON kanban_lists
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can view lists" ON kanban_lists;
CREATE POLICY "Users can view lists" ON kanban_lists
  FOR SELECT TO authenticated
  USING (true);

-- Cards: Admins can do everything, users can view
DROP POLICY IF EXISTS "Admins can manage cards" ON kanban_cards;
CREATE POLICY "Admins can manage cards" ON kanban_cards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can view cards" ON kanban_cards;
CREATE POLICY "Users can view cards" ON kanban_cards
  FOR SELECT TO authenticated
  USING (true);

-- Comments: Admins can do everything, users can create/view their own
DROP POLICY IF EXISTS "Admins can manage comments" ON kanban_card_comments;
CREATE POLICY "Admins can manage comments" ON kanban_card_comments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can view comments" ON kanban_card_comments;
CREATE POLICY "Users can view comments" ON kanban_card_comments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON kanban_card_comments;
CREATE POLICY "Users can create comments" ON kanban_card_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kanban_lists_board ON kanban_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_lists_position ON kanban_lists(position);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_list ON kanban_cards(list_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_position ON kanban_cards(position);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_assigned ON kanban_cards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kanban_comments_card ON kanban_card_comments(card_id);

-- Insert default board with sample lists
INSERT INTO kanban_boards (title, description, created_by)
SELECT 'Main Board', 'Main project board', id FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;
