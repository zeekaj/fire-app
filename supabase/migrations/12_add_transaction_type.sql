-- Add transaction_type to track expense/income/transfer/debt_payment
-- This allows tracking debt payoff progress while keeping transfers neutral in analytics

-- Add transaction_type column
alter table public.transactions
add column if not exists transaction_type text;

-- Add check constraint for valid types
alter table public.transactions
add constraint valid_transaction_type 
check (transaction_type in ('expense', 'income', 'transfer', 'debt_payment'));

-- Set defaults for existing data based on current patterns
update public.transactions
set transaction_type = case
  -- If it has a transfer_id, it's a transfer
  when transfer_id is not null then 'transfer'
  -- If amount is negative, it's an expense
  when amount < 0 then 'expense'
  -- If amount is positive, it's income
  when amount > 0 then 'income'
  else 'expense'
end
where transaction_type is null;

-- Make it required going forward
alter table public.transactions
alter column transaction_type set not null;

-- Set default for new records (will be overridden by application logic)
alter table public.transactions
alter column transaction_type set default 'expense';

-- Create index for filtering by type
create index if not exists transactions_type_idx on public.transactions(transaction_type);

-- Update the validate_transfer_pair function to set transaction_type
create or replace function validate_transfer_pair()
returns trigger as $$
begin
  -- If transfer_id is set, ensure it points to another transaction
  if new.transfer_id is not null then
    -- Check that the linked transaction exists
    if not exists (select 1 from public.transactions where id = new.transfer_id) then
      raise exception 'Transfer must link to an existing transaction';
    end if;
    
    -- Ensure both transactions belong to the same user
    if not exists (
      select 1 from public.transactions 
      where id = new.transfer_id and created_by = new.created_by
    ) then
      raise exception 'Transfer must be between accounts owned by the same user';
    end if;
    
    -- Auto-set transaction_type to 'transfer' if not specified as 'debt_payment'
    if new.transaction_type not in ('transfer', 'debt_payment') then
      new.transaction_type := 'transfer';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;
