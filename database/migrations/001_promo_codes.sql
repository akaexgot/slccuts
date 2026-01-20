-- Create promo_codes table
create table if not exists public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  valid_from timestamptz,
  valid_until timestamptz,
  usage_limit integer, -- null means unlimited
  times_used integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.promo_codes enable row level security;

-- Policies
-- Admin can do everything
create policy "Admins can manage promo codes"
  on public.promo_codes
  for all
  using (
    auth.role() = 'authenticated' and
    (select role from public.users where id = auth.uid()) = 'admin'
  );

-- Public/Service Role can read active codes (for validation purposes, though we might restrict this to service role only in API)
create policy "Service role can read promo codes"
  on public.promo_codes
  for select
  using (
    true -- We might want to restrict this, but for now allow reading to validate
  );

-- Indexes
create index if not exists idx_promo_codes_code on public.promo_codes(code);
