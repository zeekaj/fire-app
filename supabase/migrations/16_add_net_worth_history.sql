-- ==============================================================================
-- Net Worth History Migration
-- ==============================================================================
-- Created: 2025-11-02
-- Description: Adds net_worth_snapshots table to track historical net worth data
-- ==============================================================================

-- Create net_worth_snapshots table
create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric(14,2) not null default 0,
  total_liabilities numeric(14,2) not null default 0,
  net_worth numeric(14,2) not null default 0,
  account_count integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one snapshot per user per date
  unique(created_by, snapshot_date)
);

-- Add index for efficient date range queries
create index if not exists idx_net_worth_snapshots_user_date 
  on public.net_worth_snapshots(created_by, snapshot_date desc);

-- Enable RLS
alter table public.net_worth_snapshots enable row level security;

-- RLS Policies
create policy "Users can view their own snapshots"
  on public.net_worth_snapshots
  for select
  using (auth.uid() = created_by);

create policy "Users can insert their own snapshots"
  on public.net_worth_snapshots
  for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own snapshots"
  on public.net_worth_snapshots
  for update
  using (auth.uid() = created_by);

create policy "Users can delete their own snapshots"
  on public.net_worth_snapshots
  for delete
  using (auth.uid() = created_by);

-- Add updated_at trigger
create or replace function update_net_worth_snapshots_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.net_worth_snapshots
  for each row
  execute function update_net_worth_snapshots_updated_at();
