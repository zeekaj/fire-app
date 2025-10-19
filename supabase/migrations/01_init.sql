-- ==============================================================================
-- FIRE Financial App - Initial Schema Migration
-- ==============================================================================
-- Created: 2025-10-19
-- Description: Creates all tables, RLS policies, indexes, and seed data
-- ==============================================================================

-- ==============================================================================
-- EXTENSIONS
-- ==============================================================================
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- Users table (mirrors auth.users for convenience)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

-- Accounts (checking, savings, credit, investment, etc.)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','credit','investment','mortgage','cash','asset','retirement','hsa')),
  opening_balance numeric(14,2) default 0,
  current_balance numeric(14,2) default 0,
  valuation_updated_at timestamptz,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories (hierarchical with envelope/budgetable flags)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  path text, -- e.g. "Housing>Utilities>Electric"
  is_envelope boolean default false,
  is_budgetable boolean default true,
  is_transfer boolean default false,
  is_debt_service boolean default false,
  created_at timestamptz default now()
);

-- Payees
create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  default_category_id uuid references public.categories(id) on delete set null,
  default_account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz default now()
);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  date date not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric(14,2) not null,
  payee_id uuid references public.payees(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  tags text[] default '{}',
  notes text,
  is_pending boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Budgets (monthly targets or envelope)
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  month char(7) not null, -- 'YYYY-MM'
  category_id uuid not null references public.categories(id) on delete cascade,
  target numeric(14,2) not null,
  model text not null check (model in ('monthlyTarget','envelope')),
  carry numeric(14,2) default 0,
  created_at timestamptz default now(),
  unique(created_by, month, category_id)
);

-- Bills (recurring with RRULE)
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  payee_id uuid references public.payees(id) on delete set null,
  rrule text not null,
  next_due date,
  status text not null check (status in ('active','paused')) default 'active',
  notes text,
  created_at timestamptz default now()
);

-- Scenarios (FI projection assumptions)
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  retirement_date date,
  death_date date not null,
  withdrawal_rule text not null check (withdrawal_rule in ('guardrails','fixed','floorCeiling')),
  swr numeric(5,2),
  mean_return_real numeric(5,2) default 5.0,
  stdev_return_real numeric(5,2) default 12.0,
  inflation numeric(4,2) default 2.0,
  use_monte_carlo boolean default true,
  use_historical boolean default true,
  created_at timestamptz default now()
);

-- Settings (singleton per user)
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null unique references public.users(id) on delete cascade,
  learning jsonb default jsonb_build_object(
    'enabled', true,
    'requireApproval', false,
    'dimensions', jsonb_build_object(
      'expenses', true,
      'seasonality', true,
      'savingsCadence', true,
      'contributions', true
    )
  ),
  feature_flags jsonb default jsonb_build_object(
    'budgets', true,
    'envelopes', true,
    'learning', true,
    'scenarios', true
  ),
  export_prefs jsonb default jsonb_build_object(
    'csv', true,
    'json', true
  ),
  created_at timestamptz default now()
);

-- Migrations log (category renames/merges)
create table if not exists public.migrations_log (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('category-rename','merge','split')),
  mapping jsonb not null,
  run_at timestamptz default now()
);

-- Snapshots (net worth, budgets, etc.)
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('netWorth','accounts','budgets')),
  period text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Users
create index if not exists users_email_idx on public.users(email);

-- Accounts
create index if not exists accounts_created_by_idx on public.accounts(created_by);
create index if not exists accounts_type_idx on public.accounts(type);
create index if not exists accounts_archived_idx on public.accounts(is_archived) where is_archived = false;

-- Categories
create index if not exists categories_created_by_idx on public.categories(created_by);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists categories_path_idx on public.categories(path);
create index if not exists categories_envelope_idx on public.categories(is_envelope) where is_envelope = true;

-- Payees
create index if not exists payees_created_by_idx on public.payees(created_by);
create index if not exists payees_name_idx on public.payees(name);

-- Transactions
create index if not exists transactions_created_by_idx on public.transactions(created_by);
create index if not exists transactions_date_idx on public.transactions(date desc);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_payee_id_idx on public.transactions(payee_id);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
create index if not exists transactions_pending_idx on public.transactions(is_pending) where is_pending = true;
create index if not exists transactions_tags_idx on public.transactions using gin(tags);

-- Budgets
create index if not exists budgets_created_by_idx on public.budgets(created_by);
create index if not exists budgets_month_idx on public.budgets(month);
create index if not exists budgets_category_id_idx on public.budgets(category_id);

-- Bills
create index if not exists bills_created_by_idx on public.bills(created_by);
create index if not exists bills_status_idx on public.bills(status) where status = 'active';
create index if not exists bills_next_due_idx on public.bills(next_due);

-- Scenarios
create index if not exists scenarios_created_by_idx on public.scenarios(created_by);

-- Settings
create index if not exists settings_created_by_idx on public.settings(created_by);

-- Migrations log
create index if not exists migrations_log_created_by_idx on public.migrations_log(created_by);
create index if not exists migrations_log_run_at_idx on public.migrations_log(run_at desc);

-- Snapshots
create index if not exists snapshots_created_by_idx on public.snapshots(created_by);
create index if not exists snapshots_kind_idx on public.snapshots(kind);
create index if not exists snapshots_period_idx on public.snapshots(period);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Users
alter table public.users enable row level security;

create policy "users_select" on public.users
  for select using (id = auth.uid());

create policy "users_insert" on public.users
  for insert with check (id = auth.uid());

-- Accounts
alter table public.accounts enable row level security;

create policy "accounts_select" on public.accounts
  for select using (created_by = auth.uid());

create policy "accounts_insert" on public.accounts
  for insert with check (created_by = auth.uid());

create policy "accounts_update" on public.accounts
  for update using (created_by = auth.uid());

create policy "accounts_delete" on public.accounts
  for delete using (created_by = auth.uid());

-- Categories
alter table public.categories enable row level security;

create policy "categories_select" on public.categories
  for select using (created_by = auth.uid());

create policy "categories_insert" on public.categories
  for insert with check (created_by = auth.uid());

create policy "categories_update" on public.categories
  for update using (created_by = auth.uid());

create policy "categories_delete" on public.categories
  for delete using (created_by = auth.uid());

-- Payees
alter table public.payees enable row level security;

create policy "payees_select" on public.payees
  for select using (created_by = auth.uid());

create policy "payees_insert" on public.payees
  for insert with check (created_by = auth.uid());

create policy "payees_update" on public.payees
  for update using (created_by = auth.uid());

create policy "payees_delete" on public.payees
  for delete using (created_by = auth.uid());

-- Transactions
alter table public.transactions enable row level security;

create policy "transactions_select" on public.transactions
  for select using (created_by = auth.uid());

create policy "transactions_insert" on public.transactions
  for insert with check (created_by = auth.uid());

create policy "transactions_update" on public.transactions
  for update using (created_by = auth.uid());

create policy "transactions_delete" on public.transactions
  for delete using (created_by = auth.uid());

-- Budgets
alter table public.budgets enable row level security;

create policy "budgets_select" on public.budgets
  for select using (created_by = auth.uid());

create policy "budgets_insert" on public.budgets
  for insert with check (created_by = auth.uid());

create policy "budgets_update" on public.budgets
  for update using (created_by = auth.uid());

create policy "budgets_delete" on public.budgets
  for delete using (created_by = auth.uid());

-- Bills
alter table public.bills enable row level security;

create policy "bills_select" on public.bills
  for select using (created_by = auth.uid());

create policy "bills_insert" on public.bills
  for insert with check (created_by = auth.uid());

create policy "bills_update" on public.bills
  for update using (created_by = auth.uid());

create policy "bills_delete" on public.bills
  for delete using (created_by = auth.uid());

-- Scenarios
alter table public.scenarios enable row level security;

create policy "scenarios_select" on public.scenarios
  for select using (created_by = auth.uid());

create policy "scenarios_insert" on public.scenarios
  for insert with check (created_by = auth.uid());

create policy "scenarios_update" on public.scenarios
  for update using (created_by = auth.uid());

create policy "scenarios_delete" on public.scenarios
  for delete using (created_by = auth.uid());

-- Settings
alter table public.settings enable row level security;

create policy "settings_select" on public.settings
  for select using (created_by = auth.uid());

create policy "settings_insert" on public.settings
  for insert with check (created_by = auth.uid());

create policy "settings_update" on public.settings
  for update using (created_by = auth.uid());

create policy "settings_delete" on public.settings
  for delete using (created_by = auth.uid());

-- Migrations log
alter table public.migrations_log enable row level security;

create policy "migrations_log_select" on public.migrations_log
  for select using (created_by = auth.uid());

create policy "migrations_log_insert" on public.migrations_log
  for insert with check (created_by = auth.uid());

-- Snapshots
alter table public.snapshots enable row level security;

create policy "snapshots_select" on public.snapshots
  for select using (created_by = auth.uid());

create policy "snapshots_insert" on public.snapshots
  for insert with check (created_by = auth.uid());

create policy "snapshots_update" on public.snapshots
  for update using (created_by = auth.uid());

create policy "snapshots_delete" on public.snapshots
  for delete using (created_by = auth.uid());

-- ==============================================================================
-- SEED DATA: FIRE-Tuned Category Hierarchy
-- ==============================================================================
-- Note: This seed data will be inserted via app code on first login to ensure
-- created_by = auth.uid(). The structure is documented here for reference.
--
-- Top-level categories (parent_id = null):
--   - Income (is_budgetable=false)
--   - Housing
--   - Transportation
--   - Food
--   - Utilities
--   - Healthcare
--   - Insurance
--   - Debt Payments (is_debt_service=true)
--   - Savings & Investments (is_budgetable=false, is_transfer=true)
--   - Personal
--   - Entertainment
--   - Giving
--   - Travel (is_envelope=true)
--   - Taxes (is_budgetable=false)
--   - Uncategorized
--
-- Envelope categories (is_envelope=true):
--   - Travel
--   - Gifts (under Personal)
--   - Repairs (under Housing)
--   - Car Maintenance (under Transportation)
--   - Medical (under Healthcare)
--   - Annual Subscriptions (under Personal)
--   - Property Tax (under Housing)
--
-- The app will create this hierarchy on first login.
-- ==============================================================================
