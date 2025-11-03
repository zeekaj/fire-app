-- ===============================================================================
-- Add Mortgage Fields to Accounts
-- ===============================================================================
-- Created: 2025-11-02
-- Description: Adds mortgage-specific fields to accounts table
-- ===============================================================================

alter table public.accounts
  add column if not exists mortgage_interest_rate numeric(5,2),
  add column if not exists mortgage_start_date date,
  add column if not exists mortgage_term_months integer,
  add column if not exists mortgage_original_amount numeric(14,2),
  add column if not exists property_address text,
  add column if not exists escrow_amount numeric(14,2),
  add column if not exists next_payment_due_date date;

-- Optionally, add comments for documentation:
comment on column public.accounts.mortgage_interest_rate is 'Annual interest rate (APR) for mortgage accounts';
comment on column public.accounts.mortgage_start_date is 'Start date of the mortgage loan';
comment on column public.accounts.mortgage_term_months is 'Loan term in months';
comment on column public.accounts.mortgage_original_amount is 'Original loan amount';
comment on column public.accounts.property_address is 'Property address for the mortgage';
comment on column public.accounts.escrow_amount is 'Escrow amount for taxes/insurance';
comment on column public.accounts.next_payment_due_date is 'Next payment due date for mortgage';
