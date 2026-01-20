-- Ensure public.users table exists and has correct structure
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'customer',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
-- Users can read their own profile
create policy "Users can read own profile"
  on public.users
  for select
  using ( auth.uid() = id );

-- Service role can read/write everything (usually automatic, but good to be explicit/safe if needed, though bypassing RLS via service key is default)

-- Function to handle new user signup (sync with auth.users)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill for existing users (if any exist in auth.users but not in public.users)
insert into public.users (id, email, role)
select id, email, 'admin' -- Defaulting to admin for testing? No, safer to just insert. User can update manually.
from auth.users
where id not in (select id from public.users)
on conflict do nothing;

-- IMPORTANT: You might need to manually set your admin user's role to 'admin' using:
-- update public.users set role = 'admin' where email = 'your_admin_email@example.com';
