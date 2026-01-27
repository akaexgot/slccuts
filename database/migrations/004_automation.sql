
-- 004: Automation of Marketing Emails
-- Adds tracking for automated email status and scheduled tasks

-- Add columns to track automated email status
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS feedback_email_sent BOOLEAN DEFAULT FALSE;

-- Function to find and process abandoned carts (users with items who haven't updated in 24h)
-- In a real production environment, you would call this via a Cron Job or Edge Function
-- For now, we expose the logic so it can be automated via Supabase Edge Functions / Pg_Cron

COMMENT ON COLUMN public.users.abandoned_cart_email_sent IS 'Prevents sending multiple recovery emails for the same cart session';
COMMENT ON COLUMN public.orders.feedback_email_sent IS 'Ensures we only ask for a review once per order';
