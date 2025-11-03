-- ===============================================================================
-- Add Credit Card Fields to Accounts
-- ===============================================================================
-- Created: 2025-11-02
-- Description: Adds interest rate, payment due day, statement close day, and credit limit to accounts table
-- ===============================================================================

alter table public.accounts
  add column if not exists interest_rate numeric(5,2),
  add column if not exists payment_due_day integer,
  add column if not exists statement_close_day integer,
  add column if not exists credit_limit numeric(14,2);

-- Optionally, you can add comments for documentation:
comment on column public.accounts.interest_rate is 'Annual interest rate (APR) for credit card accounts';
comment on column public.accounts.payment_due_day is 'Day of month payment is due (1-31)';
comment on column public.accounts.statement_close_day is 'Day of month statement closes (1-31, optional)';
comment on column public.accounts.credit_limit is 'Credit limit for credit card accounts';
