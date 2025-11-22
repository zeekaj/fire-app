-- Add updated_at trigger for transactions table
-- This ensures updated_at is automatically set whenever a transaction is modified

create or replace function update_transactions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row
  execute function update_transactions_updated_at();
