-- ============================================
-- Fix auth_rls_initplan warnings
-- Replace auth.<function>() with (select auth.<function>()) in RLS policies
-- for better query planning performance.
-- No functional or UI changes.
-- ============================================

-- --------------------------------------------
-- user_profiles
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
CREATE POLICY "Users can manage own profile"
  ON user_profiles FOR ALL
  USING ((select auth.uid()) = id);

-- --------------------------------------------
-- user_wallets
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own wallet" ON user_wallets;
CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING ((select auth.uid()) = user_id);

-- --------------------------------------------
-- wallet_transactions
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own transactions" ON wallet_transactions;
CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  USING ((select auth.uid()) = user_id);

-- --------------------------------------------
-- orders
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (customer_email = (select auth.jwt()) ->> 'email');

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING ((select auth.jwt()) ->> 'role' IN ('admin', 'staff'));

-- --------------------------------------------
-- order_items
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_email = (select auth.jwt()) ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  USING ((select auth.jwt()) ->> 'role' IN ('admin', 'staff'));

-- --------------------------------------------
-- user_rewards
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
CREATE POLICY "Users can view own rewards"
  ON user_rewards FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own rewards" ON user_rewards;
CREATE POLICY "Users can update own rewards"
  ON user_rewards FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- --------------------------------------------
-- points_history
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own points history" ON points_history;
CREATE POLICY "Users can view own points history"
  ON points_history FOR SELECT
  USING ((select auth.uid()) = user_id);

-- --------------------------------------------
-- vip_bookings
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view own bookings" ON vip_bookings;
CREATE POLICY "Users can view own bookings"
  ON vip_bookings FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own bookings" ON vip_bookings;
CREATE POLICY "Users can create own bookings"
  ON vip_bookings FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update bookings" ON vip_bookings;
CREATE POLICY "Admins can update bookings"
  ON vip_bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete bookings" ON vip_bookings;
CREATE POLICY "Admins can delete bookings"
  ON vip_bookings FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can view all bookings" ON vip_bookings;
CREATE POLICY "Admins can view all bookings"
  ON vip_bookings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

-- --------------------------------------------
-- forum_categories
-- --------------------------------------------
DROP POLICY IF EXISTS "forum_categories_insert" ON forum_categories;
CREATE POLICY "forum_categories_insert"
  ON forum_categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "forum_categories_update" ON forum_categories;
CREATE POLICY "forum_categories_update"
  ON forum_categories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "forum_categories_delete" ON forum_categories;
CREATE POLICY "forum_categories_delete"
  ON forum_categories FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

-- --------------------------------------------
-- forum_subcategories
-- --------------------------------------------
DROP POLICY IF EXISTS "forum_subcategories_insert" ON forum_subcategories;
CREATE POLICY "forum_subcategories_insert"
  ON forum_subcategories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "forum_subcategories_update" ON forum_subcategories;
CREATE POLICY "forum_subcategories_update"
  ON forum_subcategories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "forum_subcategories_delete" ON forum_subcategories;
CREATE POLICY "forum_subcategories_delete"
  ON forum_subcategories FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

-- --------------------------------------------
-- forum_posts
-- --------------------------------------------
DROP POLICY IF EXISTS "forum_posts_insert" ON forum_posts;
CREATE POLICY "forum_posts_insert"
  ON forum_posts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "forum_posts_update" ON forum_posts;
CREATE POLICY "forum_posts_update"
  ON forum_posts FOR UPDATE USING (
    (select auth.uid()) = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "forum_posts_delete" ON forum_posts;
CREATE POLICY "forum_posts_delete"
  ON forum_posts FOR DELETE USING (
    (select auth.uid()) = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

-- --------------------------------------------
-- forum_comments
-- --------------------------------------------
DROP POLICY IF EXISTS "forum_comments_insert" ON forum_comments;
CREATE POLICY "forum_comments_insert"
  ON forum_comments FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "forum_comments_update" ON forum_comments;
CREATE POLICY "forum_comments_update"
  ON forum_comments FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "forum_comments_delete" ON forum_comments;
CREATE POLICY "forum_comments_delete"
  ON forum_comments FOR DELETE USING (
    (select auth.uid()) = user_id OR
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

-- --------------------------------------------
-- kanban_boards
-- --------------------------------------------
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_boards;
CREATE POLICY "Allow all operations for admins"
  ON kanban_boards FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_boards;
CREATE POLICY "Allow read for authenticated users"
  ON kanban_boards FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- --------------------------------------------
-- kanban_lists
-- --------------------------------------------
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_lists;
CREATE POLICY "Allow all operations for admins"
  ON kanban_lists FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_lists;
CREATE POLICY "Allow read for authenticated users"
  ON kanban_lists FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- --------------------------------------------
-- kanban_cards
-- --------------------------------------------
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_cards;
CREATE POLICY "Allow all operations for admins"
  ON kanban_cards FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_cards;
CREATE POLICY "Allow read for authenticated users"
  ON kanban_cards FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- --------------------------------------------
-- kanban_card_comments
-- --------------------------------------------
DROP POLICY IF EXISTS "Allow all operations for admins" ON kanban_card_comments;
CREATE POLICY "Allow all operations for admins"
  ON kanban_card_comments FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = (select auth.uid()) AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "Allow read for authenticated users" ON kanban_card_comments;
CREATE POLICY "Allow read for authenticated users"
  ON kanban_card_comments FOR SELECT USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow insert own comments" ON kanban_card_comments;
CREATE POLICY "Allow insert own comments"
  ON kanban_card_comments FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow delete own comments" ON kanban_card_comments;
CREATE POLICY "Allow delete own comments"
  ON kanban_card_comments FOR DELETE USING ((select auth.uid()) = user_id);
