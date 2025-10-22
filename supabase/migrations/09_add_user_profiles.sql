-- supabase/migrations/09_add_user_profiles.sql

create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamptz,
  birth_date date not null
);

-- RLS policies for profiles
alter table profiles enable row level security;

create policy "Users can view their own profile."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to create a profile for a new user
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, birth_date)
  values (new.id, '1990-01-01');
  return new;
end;
$$;

-- Trigger to call the function when a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
