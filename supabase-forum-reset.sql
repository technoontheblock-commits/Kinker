-- ============================================
-- FORUM SYSTEM - COMPLETE RESET (DROPS ALL FORUM DATA!)
-- ============================================
-- WARNUNG: Dieses Script löscht ALLE Forum-Daten!
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING FORUM TABLES
-- ============================================
DROP TABLE IF EXISTS forum_comments CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS forum_subcategories CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;

-- ============================================
-- 2. CREATE MAIN CATEGORIES TABLE
-- ============================================
CREATE TABLE forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'Folder',
  color TEXT DEFAULT '#FF4D00',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE SUBCATEGORIES TABLE
-- ============================================
CREATE TABLE forum_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'MessageSquare',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- ============================================
-- 4. CREATE POSTS TABLE (NEW SCHEMA)
-- ============================================
CREATE TABLE forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id UUID NOT NULL REFERENCES forum_subcategories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. CREATE COMMENTS TABLE
-- ============================================
CREATE TABLE forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. ENABLE RLS
-- ============================================
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Categories: Everyone can read, only admin can modify
CREATE POLICY "forum_categories_read" ON forum_categories FOR SELECT USING (is_active = true);
CREATE POLICY "forum_categories_insert" ON forum_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "forum_categories_update" ON forum_categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "forum_categories_delete" ON forum_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Subcategories: Everyone can read, only admin can modify
CREATE POLICY "forum_subcategories_read" ON forum_subcategories FOR SELECT USING (is_active = true);
CREATE POLICY "forum_subcategories_insert" ON forum_subcategories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "forum_subcategories_update" ON forum_subcategories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "forum_subcategories_delete" ON forum_subcategories FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Posts: Everyone can read, authenticated users can create, only author or admin can modify
CREATE POLICY "forum_posts_read" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_posts_update" ON forum_posts FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "forum_posts_delete" ON forum_posts FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Comments: Everyone can read, authenticated users can create, only author or admin can modify
CREATE POLICY "forum_comments_read" ON forum_comments FOR SELECT USING (true);
CREATE POLICY "forum_comments_insert" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "forum_comments_update" ON forum_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "forum_comments_delete" ON forum_comments FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================
-- 8. INDEXES
-- ============================================
CREATE INDEX idx_forum_categories_sort ON forum_categories(sort_order);
CREATE INDEX idx_forum_categories_slug ON forum_categories(slug);

CREATE INDEX idx_forum_subcategories_category ON forum_subcategories(category_id);
CREATE INDEX idx_forum_subcategories_sort ON forum_subcategories(sort_order);
CREATE INDEX idx_forum_subcategories_slug ON forum_subcategories(slug);

CREATE INDEX idx_forum_posts_subcategory ON forum_posts(subcategory_id);
CREATE INDEX idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_pinned ON forum_posts(is_pinned DESC);

CREATE INDEX idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_user ON forum_comments(user_id);
CREATE INDEX idx_forum_comments_parent ON forum_comments(parent_id);
CREATE INDEX idx_forum_comments_created ON forum_comments(created_at);

-- ============================================
-- 9. DEFAULT DATA
-- ============================================

-- Insert Main Categories
INSERT INTO forum_categories (name, slug, description, icon, color, sort_order, is_active) VALUES
  ('Kinker Club', 'kinker-club', 'Alles rund um den Kinker Club Basel', 'Building', '#FF4D00', 1, true),
  ('Veranstaltungen', 'veranstaltungen', 'Events, Partys und Ankündigungen', 'Calendar', '#8B5CF6', 2, true),
  ('Community', 'community', 'Community-Bereich für Member', 'Users', '#10B981', 3, true),
  ('Support', 'support', 'Hilfe und Support-Bereich', 'HelpCircle', '#3B82F6', 4, true);

-- Insert Subcategories for "Kinker Club"
INSERT INTO forum_subcategories (category_id, name, slug, description, icon, sort_order)
SELECT 
  c.id,
  sub.name,
  sub.slug,
  sub.description,
  sub.icon,
  sub.sort_order
FROM forum_categories c
CROSS JOIN (VALUES
  ('Allgemeine Informationen', 'allgemein', 'Allgemeine Infos zum Club', 'Info', 1),
  ('Forum Regelwerk', 'regeln', 'Regeln und Richtlinien des Forums', 'Shield', 2),
  ('Diskussionen', 'diskussionen', 'Allgemeine Diskussionen', 'MessageCircle', 3)
) AS sub(name, slug, description, icon, sort_order)
WHERE c.slug = 'kinker-club';

-- Insert Subcategories for "Veranstaltungen"
INSERT INTO forum_subcategories (category_id, name, slug, description, icon, sort_order)
SELECT 
  c.id,
  sub.name,
  sub.slug,
  sub.description,
  sub.icon,
  sub.sort_order
FROM forum_categories c
CROSS JOIN (VALUES
  ('Ankündigungen', 'ankuendigungen', 'Offizielle Event-Ankündigungen', 'Megaphone', 1),
  ('Feedback', 'feedback', 'Feedback zu vergangenen Events', 'Star', 2),
  ('Wünsche', 'wuensche', 'Event-Wünsche und Ideen', 'Lightbulb', 3)
) AS sub(name, slug, description, icon, sort_order)
WHERE c.slug = 'veranstaltungen';

-- Insert Subcategories for "Community"
INSERT INTO forum_subcategories (category_id, name, slug, description, icon, sort_order)
SELECT 
  c.id,
  sub.name,
  sub.slug,
  sub.description,
  sub.icon,
  sub.sort_order
FROM forum_categories c
CROSS JOIN (VALUES
  ('Vorstellungen', 'vorstellungen', 'Stell dich der Community vor', 'UserPlus', 1),
  ('Musik', 'musik', 'Techno, DJs und Musikdiskussionen', 'Music', 2),
  ('Off-Topic', 'off-topic', 'Alles andere', 'Coffee', 3)
) AS sub(name, slug, description, icon, sort_order)
WHERE c.slug = 'community';

-- Insert Subcategories for "Support"
INSERT INTO forum_subcategories (category_id, name, slug, description, icon, sort_order)
SELECT 
  c.id,
  sub.name,
  sub.slug,
  sub.description,
  sub.icon,
  sub.sort_order
FROM forum_categories c
CROSS JOIN (VALUES
  ('Technischer Support', 'technik', 'Technische Probleme und Hilfe', 'Wrench', 1),
  ('Tickets & Buchungen', 'tickets', 'Fragen zu Tickets und Buchungen', 'Ticket', 2)
) AS sub(name, slug, description, icon, sort_order)
WHERE c.slug = 'support';

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Get post count for subcategory
CREATE OR REPLACE FUNCTION get_subcategory_post_count(subcategory_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM forum_posts 
    WHERE subcategory_id = subcategory_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Get comment count for post
CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM forum_comments 
    WHERE post_id = post_uuid AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_post_view(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forum_posts 
  SET view_count = view_count + 1 
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;
