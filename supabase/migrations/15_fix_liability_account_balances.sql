-- Fix account balance calculation for liability accounts (credit cards, mortgages)
-- For liabilities, charges (negative amounts) should increase the balance
-- and payments (positive amounts) should decrease the balance

-- Drop and recreate the balance calculation function to handle liabilities correctly
create or replace function recalculate_account_balance(account_uuid uuid)
returns void as $$
declare
  account_type_val text;
begin
  -- Get the account type
  select type into account_type_val
  from accounts
  where id = account_uuid;

  -- For liability accounts (credit, mortgage), negate transaction amounts
  -- For asset accounts, use amounts as-is
  if account_type_val in ('credit', 'mortgage') then
    update accounts
    set current_balance = (
      select coalesce(opening_balance, 0) - coalesce(sum(amount), 0)
      from transactions
      where account_id = account_uuid
    )
    where id = account_uuid;
  else
    update accounts
    set current_balance = (
      select coalesce(opening_balance, 0) + coalesce(sum(amount), 0)
      from transactions
      where account_id = account_uuid
    )
    where id = account_uuid;
  end if;
end;
$$ language plpgsql security definer;

comment on function recalculate_account_balance is 'Recalculates account balance, handling liabilities (credit, mortgage) differently from assets';

-- Also fix the opening balance change trigger to handle liabilities
create or replace function update_account_balance_on_opening_balance_change()
returns trigger as $$
begin
  -- Only recalculate if opening_balance actually changed
  if (TG_OP = 'UPDATE' AND OLD.opening_balance IS DISTINCT FROM NEW.opening_balance) then
    -- For liabilities, negate transaction amounts
    if NEW.type in ('credit', 'mortgage') then
      NEW.current_balance := (
        select coalesce(NEW.opening_balance, 0) - coalesce(sum(amount), 0)
        from transactions
        where account_id = NEW.id
      );
    else
      -- For assets, use amounts as-is
      NEW.current_balance := (
        select coalesce(NEW.opening_balance, 0) + coalesce(sum(amount), 0)
        from transactions
        where account_id = NEW.id
      );
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

comment on function update_account_balance_on_opening_balance_change is 'Automatically recalculates current_balance when opening_balance is changed, handling liabilities correctly';

-- Recalculate all existing liability account balances
do $$
declare
  liability_account record;
begin
  for liability_account in 
    select id from accounts where type in ('credit', 'mortgage')
  loop
    perform recalculate_account_balance(liability_account.id);
  end loop;
end $$;
