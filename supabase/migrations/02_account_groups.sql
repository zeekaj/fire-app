-- ==============================================================================
-- FIRE Financial App - Account Groups Migration
-- ==============================================================================
-- Created: 2025-10-19
-- Description: Converts hardcoded account types to flexible account_groups table
--              This allows users to have individual accounts (e.g., "Chase Sapphire")
--              grouped into account types (e.g., "Credit Card")
-- 
-- NOTE: The 'type' column on accounts table is deprecated but kept for backward
--       compatibility. All new code should use 'account_group_id' for grouping.
--       Planned for removal in v2.0 migration.
-- ==============================================================================

-- Create account_groups table
create table if not exists public.account_groups (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  icon text, -- optional icon name (e.g., 'credit-card', 'bank', 'wallet')
  color text, -- hex color for UI (e.g., '#E4572E')
  sort_order integer default 0,
  is_system boolean default false, -- true for default groups, false for user-created
  created_at timestamptz default now(),
  unique(created_by, name)
);

-- Add account_group_id to accounts table
alter table public.accounts 
  add column if not exists account_group_id uuid references public.account_groups(id) on delete set null;

-- Create index for faster lookups
create index if not exists idx_accounts_account_group_id on public.accounts(account_group_id);
create index if not exists idx_account_groups_created_by on public.account_groups(created_by);

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Enable RLS on account_groups
alter table public.account_groups enable row level security;

-- Account groups policies
create policy "Users can view their own account groups"
  on public.account_groups for select
  using (auth.uid() = created_by);

create policy "Users can insert their own account groups"
  on public.account_groups for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own account groups"
  on public.account_groups for update
  using (auth.uid() = created_by);

create policy "Users can delete their own non-system account groups"
  on public.account_groups for delete
  using (auth.uid() = created_by and is_system = false);

-- ==============================================================================
-- DATA MIGRATION FUNCTION
-- ==============================================================================

-- Function to migrate existing accounts to use account_groups
create or replace function migrate_account_types_to_groups()
returns void as $$
declare
  user_record record;
  group_id uuid;
  type_record record;
begin
  -- For each user in the system
  for user_record in select id from public.users loop
    
    -- Create account groups for each unique account type the user has
    for type_record in 
      select distinct type 
      from public.accounts 
      where created_by = user_record.id
    loop
      
      -- Insert the account group
      insert into public.account_groups (created_by, name, icon, color, sort_order, is_system)
      values (
        user_record.id,
        case type_record.type
          when 'checking' then 'Checking'
          when 'savings' then 'Savings'
          when 'credit' then 'Credit Card'
          when 'investment' then 'Investment'
          when 'retirement' then 'Retirement'
          when 'hsa' then 'HSA'
          when 'mortgage' then 'Mortgage'
          when 'cash' then 'Cash'
          when 'asset' then 'Asset'
          else initcap(type_record.type)
        end,
        case type_record.type
          when 'checking' then 'bank'
          when 'savings' then 'piggy-bank'
          when 'credit' then 'credit-card'
          when 'investment' then 'trending-up'
          when 'retirement' then 'shield'
          when 'hsa' then 'heart'
          when 'mortgage' then 'home'
          when 'cash' then 'wallet'
          when 'asset' then 'box'
          else null
        end,
        case type_record.type
          when 'checking' then '#2E86AB'
          when 'savings' then '#10B981'
          when 'credit' then '#F59E0B'
          when 'investment' then '#8B5CF6'
          when 'retirement' then '#14B8A6'
          when 'hsa' then '#06B6D4'
          when 'mortgage' then '#EF4444'
          when 'cash' then '#6B7280'
          when 'asset' then '#6366F1'
          else '#E4572E'
        end,
        case type_record.type
          when 'checking' then 1
          when 'savings' then 2
          when 'credit' then 3
          when 'investment' then 4
          when 'retirement' then 5
          when 'hsa' then 6
          when 'mortgage' then 7
          when 'cash' then 8
          when 'asset' then 9
          else 99
        end,
        true
      )
      returning id into group_id;
      
      -- Update all accounts of this type to reference the new group
      update public.accounts
      set account_group_id = group_id
      where created_by = user_record.id
        and type = type_record.type;
      
    end loop;
  end loop;
end;
$$ language plpgsql security definer;

-- Run the migration
select migrate_account_types_to_groups();

-- Drop the migration function (no longer needed)
drop function migrate_account_types_to_groups();

-- ==============================================================================
-- CLEANUP
-- ==============================================================================

-- Note: We're keeping the 'type' column for now for backwards compatibility
-- Once all code is updated to use account_group_id, we can remove it with:
-- alter table public.accounts drop column type;

-- Add a check constraint to ensure accounts have a group
-- (commented out for now to allow gradual migration)
-- alter table public.accounts 
--   add constraint accounts_must_have_group 
--   check (account_group_id is not null);
