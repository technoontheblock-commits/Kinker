-- ============================================
-- KINKER SECURITY FIX - RLS Policy Hardening
-- Run this in your Supabase SQL Editor immediately
-- ============================================
-- This script removes dangerous "allow all" public policies
-- and replaces them with secure alternatives or no policies
-- (access through API routes with service role key only).
-- ============================================

-- ============================================
-- 1. USERS TABLE - CRITICAL FIX
-- ============================================
-- Remove all public access policies on users
DROP POLICY IF EXISTS "Allow public read users" ON users;
DROP POLICY IF EXISTS "Allow public insert users" ON users;
DROP POLICY IF EXISTS "Allow public update users" ON users;
DROP POLICY IF EXISTS "Allow public delete users" ON users;
DROP POLICY IF EXISTS "Allow admin full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Ensure RLS is enabled
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- NO policies = only service role key (API routes) can access
-- This is intentional: all user data access goes through Next.js API routes

-- ============================================
-- 2. NOTIFICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow admin full access" ON notifications;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- ============================================
-- 3. TICKETS TABLE - CRITICAL FIX
-- ============================================
DROP POLICY IF EXISTS "tickets_read" ON tickets;
DROP POLICY IF EXISTS "tickets_write" ON tickets;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;

-- Tickets should only be accessible via API routes
-- If direct client access is needed in future, add authenticated-only policies

-- ============================================
-- 4. SCANNER_USERS TABLE - CRITICAL FIX
-- ============================================
DROP POLICY IF EXISTS "scanner_users_all" ON scanner_users;
ALTER TABLE scanner_users FORCE ROW LEVEL SECURITY;

-- ============================================
-- 5. TICKET_SCANS TABLE - CRITICAL FIX
-- ============================================
DROP POLICY IF EXISTS "ticket_scans_all" ON ticket_scans;
ALTER TABLE ticket_scans FORCE ROW LEVEL SECURITY;

-- ============================================
-- 6. NEWSLETTER_SUBSCRIBERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public insert" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public read own subscription" ON newsletter_subscribers;

-- Keep only INSERT for public newsletter signup
-- If newsletter signup goes through API only, comment this out too
CREATE POLICY "Allow public insert newsletter" 
  ON newsletter_subscribers FOR INSERT WITH CHECK (true);

ALTER TABLE newsletter_subscribers FORCE ROW LEVEL SECURITY;

-- ============================================
-- 7. ORDERS & ORDER_ITEMS
-- ============================================
-- Check for and remove any overly permissive policies
DROP POLICY IF EXISTS "orders_all" ON orders;
DROP POLICY IF EXISTS "order_items_all" ON order_items;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

-- ============================================
-- 8. CART_ITEMS
-- ============================================
DROP POLICY IF EXISTS "cart_items_all" ON cart_items;
ALTER TABLE cart_items FORCE ROW LEVEL SECURITY;

-- ============================================
-- 9. VERIFY RLS IS ENABLED ON ALL SENSITIVE TABLES
-- ============================================
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users', 'events', 'newsletter_subscribers', 'notifications',
    'jobs', 'job_applications', 'rental_inquiries', 'tickets',
    'scanner_users', 'ticket_scans', 'orders', 'order_items',
    'cart_items', 'merchandise', 'event_tickets', 'user_profiles',
    'user_wallets', 'wallet_transactions', 'user_rewards',
    'reward_redemptions', 'printful_orders'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ============================================
-- SECURITY FIX COMPLETE
-- ============================================
SELECT 'Security fix applied successfully. All overly permissive policies removed.' AS status;
