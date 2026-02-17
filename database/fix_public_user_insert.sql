-- Function to handle new user insertion
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    'client' -- Default role
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
