-- ==============================================================================
-- Query Performance Indexes
-- ==============================================================================
-- Created: 2025-11-02
-- Description: Adds helpful indexes to speed up common dashboard/register queries
-- ==============================================================================

-- Transactions: common filters include created_by, account_id, date range; 
-- ordering is typically by date then created_at.
create index if not exists idx_transactions_user_account_date_created
  on public.transactions(created_by, account_id, date, created_at);

-- Transactions: dashboard aggregates by month/date often filter by created_by + date
create index if not exists idx_transactions_user_date
  on public.transactions(created_by, date);

-- Net worth snapshots already has (created_by, snapshot_date) index from migration 16.
-- No further action required here.
