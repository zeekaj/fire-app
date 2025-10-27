-- Trigger to recalculate current_balance when opening_balance is changed on accounts table

-- Trigger function to update account balance when opening_balance changes
create or replace function update_account_balance_on_opening_balance_change()
returns trigger as $$
begin
  -- Only recalculate if opening_balance actually changed
  if (TG_OP = 'UPDATE' AND OLD.opening_balance IS DISTINCT FROM NEW.opening_balance) then
    -- Recalculate current_balance based on new opening_balance + transactions
    NEW.current_balance := (
      select coalesce(sum(amount), 0) + coalesce(NEW.opening_balance, 0)
      from transactions
      where account_id = NEW.id
    );
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger on accounts table
drop trigger if exists update_balance_on_opening_balance_change on accounts;
create trigger update_balance_on_opening_balance_change
  before update on accounts
  for each row
  execute function update_account_balance_on_opening_balance_change();

comment on function update_account_balance_on_opening_balance_change is 'Automatically recalculates current_balance when opening_balance is changed';
