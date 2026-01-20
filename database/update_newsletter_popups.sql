-- =====================================================
-- SLC CUTS - NEWSLETTER & POPUPS SCHEMA
-- =====================================================

-- 1. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CUSTOM POPUPS
CREATE TABLE IF NOT EXISTS public.popups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    button_text TEXT,
    button_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENHANCE SETTINGS
INSERT INTO public.settings (key, value) VALUES ('newsletter_enabled', true) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('popups_enabled', true) ON CONFLICT (key) DO NOTHING;

-- 4. ENHANCE ORDERS (Ensure payment_method exists and has correct constraints)
-- Note: Check if column exists first to avoid error if already present
DO $$ 
BEGIN 
    -- Add payment_method
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('card', 'cash'));
    END IF;
    
    -- Add total_amount (as alias/fallback for total_price)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_amount') THEN
        ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10, 2);
        UPDATE public.orders SET total_amount = total_price;
    END IF;
END $$;

-- 5. RLS POLICIES

-- Newsletter
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public signup" ON public.newsletter_subscribers;
CREATE POLICY "Allow public signup" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admin full access newsletter" ON public.newsletter_subscribers FOR ALL USING (is_admin());

-- Popups
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active popups" ON public.popups;
CREATE POLICY "Public read active popups" ON public.popups FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin full access popups" ON public.popups;
CREATE POLICY "Admin full access popups" ON public.popups FOR ALL USING (is_admin());

-- Re-apply full access for admin to settings just in case
DROP POLICY IF EXISTS "Admin full access settings" ON public.settings;
CREATE POLICY "Admin full access settings" ON public.settings FOR ALL USING (is_admin());
