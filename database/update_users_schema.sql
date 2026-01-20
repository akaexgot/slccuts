-- 1. Ensure customer_email column exists (it should, based on schema.sql)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Data Migration: Populate customer_email for existing orders that have email in contact_info
UPDATE public.orders
SET customer_email = contact_info->>'email'
WHERE customer_email IS NULL AND contact_info ? 'email';

-- 3. Update users table with missing profile columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4b. RLS Policies for orders (Visibility)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id 
  OR LOWER(customer_email) = LOWER(auth.jwt() ->> 'email')
  OR LOWER(guest_email) = LOWER(auth.jwt() ->> 'email')
  OR LOWER(contact_info->>'email') = LOWER(auth.jwt() ->> 'email')
);

-- 4c. RLS Policies for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id
  )
);

-- 5. Robust Order Association Function (Security Definer)
DROP FUNCTION IF EXISTS public.associate_user_orders(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.associate_user_orders(user_uuid UUID, user_email TEXT)
RETURNS JSON AS $$
DECLARE
    updated_count INTEGER;
BEGIN
  UPDATE public.orders
  SET user_id = user_uuid
  WHERE (
    LOWER(customer_email) = LOWER(user_email) 
    OR LOWER(guest_email) = LOWER(user_email) 
    OR LOWER(contact_info->>'email') = LOWER(user_email)
  )
  AND user_id IS NULL;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'count', updated_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger for profile persistence from Auth Metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name, phone)
  VALUES (
    new.id, 
    new.email, 
    'client',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
