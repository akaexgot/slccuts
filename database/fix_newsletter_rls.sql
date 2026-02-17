-- Fix Newsletter RLS Policies
-- This script configures the correct RLS policies for newsletter_subscribers table

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public signup" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admin full access newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can read subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Only admins can delete subscribers" ON newsletter_subscribers;

-- Allow anyone to INSERT (public signup)
CREATE POLICY "Allow public signup" 
ON newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to SELECT (to check if email exists)
CREATE POLICY "Allow public read" 
ON newsletter_subscribers 
FOR SELECT 
USING (true);

-- Only admins can DELETE
CREATE POLICY "Only admins can delete" 
ON newsletter_subscribers 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);

-- Only admins can UPDATE
CREATE POLICY "Only admins can update" 
ON newsletter_subscribers 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);
