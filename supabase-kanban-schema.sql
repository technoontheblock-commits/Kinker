-- Kanban Board System Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boards table
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table (columns in a board)
CREATE TABLE IF NOT EXISTS kanban_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (tasks in a list)
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES kanban_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  position INTEGER DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card comments table
CREATE TABLE IF NOT EXISTS kanban_card_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_boards;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_boards;
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_lists;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_lists;
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_cards;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_cards;
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_card_comments;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_card_comments;

-- Policies for kanban_boards
CREATE POLICY "Allow all operations for admins" ON kanban_boards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow read for authenticated users" ON kanban_boards
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for kanban_lists
CREATE POLICY "Allow all operations for admins" ON kanban_lists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow read for authenticated users" ON kanban_lists
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for kanban_cards
CREATE POLICY "Allow all operations for admins" ON kanban_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow read for authenticated users" ON kanban_cards
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policies for kanban_card_comments
CREATE POLICY "Allow all operations for admins" ON kanban_card_comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Allow read for authenticated users" ON kanban_card_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow insert own comments" ON kanban_card_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own comments" ON kanban_card_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_lists_board_id ON kanban_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_list_id ON kanban_cards(list_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_assigned_to ON kanban_cards(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kanban_card_comments_card_id ON kanban_card_comments(card_id);
