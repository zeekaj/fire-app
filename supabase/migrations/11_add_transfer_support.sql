-- Add transfer support to transactions
-- This allows linking two transactions as a transfer pair

-- Add transfer_id column to link transfer transactions
alter table public.transactions
add column if not exists transfer_id uuid references public.transactions(id) on delete set null;

-- Add index for transfer lookups
create index if not exists transactions_transfer_id_idx on public.transactions(transfer_id);

-- Add constraint to ensure transfers link properly
-- Note: This allows null for non-transfer transactions
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
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger validate_transfer_trigger
  before insert or update on public.transactions
  for each row
  execute function validate_transfer_pair();
