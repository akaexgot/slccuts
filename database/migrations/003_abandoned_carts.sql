
-- 003: Abandoned Cart Tracking & User Enhancements
-- Adds columns to track shopping carts and improve marketing personalization

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS cart_items JSONB,
ADD COLUMN IF NOT EXISTS last_cart_update TIMESTAMP WITH TIME ZONE;

-- Add a comment for documentation
COMMENT ON COLUMN public.users.cart_items IS 'Stores the current content of the user shopping cart for recovery emails';
COMMENT ON COLUMN public.users.last_cart_update IS 'Timestamp of the last cart interaction to calculate abandonment';
