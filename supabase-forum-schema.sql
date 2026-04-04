-- ============================================
-- FORUM SYSTEM SCHEMA
-- ============================================

-- Forum Posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Comments Table
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Categories Table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO forum_categories (name, description, sort_order) VALUES
  ('Allgemein', 'Allgemeine Diskussionen über KINKER Basel', 1),
  ('Events', 'Diskussionen über kommende Events', 2),
  ('Musik', 'Techno, DJs und Musikdiskussionen', 3),
  ('Community', 'Treffpunkt für die Community', 4)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_posts
DROP POLICY IF EXISTS "forum_posts_read" ON forum_posts;
CREATE POLICY "forum_posts_read" ON forum_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_posts_insert" ON forum_posts;
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_posts_update" ON forum_posts;
CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_posts_delete" ON forum_posts;
CREATE POLICY "forum_posts_delete" ON forum_posts FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')
);

-- RLS Policies for forum_comments
DROP POLICY IF EXISTS "forum_comments_read" ON forum_comments;
CREATE POLICY "forum_comments_read" ON forum_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_comments_insert" ON forum_comments;
CREATE POLICY "forum_comments_insert" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_comments_update" ON forum_comments;
CREATE POLICY "forum_comments_update" ON forum_comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "forum_comments_delete" ON forum_comments;
CREATE POLICY "forum_comments_delete" ON forum_comments FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')
);

-- RLS Policies for forum_categories (read-only for users, admin can modify)
DROP POLICY IF EXISTS "forum_categories_read" ON forum_categories;
CREATE POLICY "forum_categories_read" ON forum_categories FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON forum_posts(is_pinned DESC);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON forum_comments(created_at);

-- Add comment count function
CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM forum_comments 
    WHERE post_id = post_uuid AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql;

-- Add view count increment function
CREATE OR REPLACE FUNCTION increment_post_view(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts 
  SET view_count = view_count + 1 
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;
