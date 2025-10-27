-- Auto-update account balances when transactions change
-- This trigger keeps account.current_balance in sync with transaction amounts

-- Function to recalculate an account's balance from all its transactions
create or replace function recalculate_account_balance(account_uuid uuid)
returns void as $$
begin
  update accounts
  set current_balance = (
    select coalesce(sum(amount), 0) + coalesce(opening_balance, 0)
    from transactions
    where account_id = account_uuid
  )
  where id = account_uuid;
end;
$$ language plpgsql security definer;

-- Trigger function to update account balance when a transaction changes
create or replace function update_account_balance_on_transaction_change()
returns trigger as $$
begin
  -- Handle INSERT
  if (TG_OP = 'INSERT') then
    perform recalculate_account_balance(NEW.account_id);
    return NEW;
  end if;

  -- Handle UPDATE
  if (TG_OP = 'UPDATE') then
    -- If account_id changed, update both old and new accounts
    if (OLD.account_id <> NEW.account_id) then
      perform recalculate_account_balance(OLD.account_id);
      perform recalculate_account_balance(NEW.account_id);
    else
      -- Same account, just recalculate it
      perform recalculate_account_balance(NEW.account_id);
    end if;
    return NEW;
  end if;

  -- Handle DELETE
  if (TG_OP = 'DELETE') then
    perform recalculate_account_balance(OLD.account_id);
    return OLD;
  end if;

  return null;
end;
$$ language plpgsql security definer;

-- Create trigger on transactions table
drop trigger if exists update_account_balance_trigger on transactions;
create trigger update_account_balance_trigger
  after insert or update or delete on transactions
  for each row
  execute function update_account_balance_on_transaction_change();

-- Recalculate all existing account balances to sync them
do $$
declare
  account_record record;
begin
  for account_record in select id from accounts loop
    perform recalculate_account_balance(account_record.id);
  end loop;
end;
$$;

-- Add helpful comment
comment on function recalculate_account_balance is 'Recalculates an account balance from opening_balance + sum of all transaction amounts';
comment on function update_account_balance_on_transaction_change is 'Trigger function that automatically updates account balances when transactions change';
