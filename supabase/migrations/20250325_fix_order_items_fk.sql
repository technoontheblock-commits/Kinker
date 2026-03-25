-- Fix foreign key constraint on order_items table
-- Change from products(id) to merchandise(id)

-- First, drop the existing foreign key constraint
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Add the new foreign key constraint pointing to merchandise table
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES merchandise(id) 
ON DELETE SET NULL;
