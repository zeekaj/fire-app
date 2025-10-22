-- Update existing accounts to have correct type based on account group
-- This fixes accounts that were created with wrong types before the group-based type mapping

UPDATE accounts
SET type = CASE
  WHEN account_groups.name = 'Credit Card' THEN 'credit'
  WHEN account_groups.name = 'Mortgage' THEN 'mortgage'
  WHEN account_groups.name = 'Checking' THEN 'checking'
  WHEN account_groups.name = 'Savings' THEN 'savings'
  WHEN account_groups.name = 'Investment' THEN 'investment'
  WHEN account_groups.name = 'Retirement' THEN 'retirement'
  WHEN account_groups.name = 'HSA' THEN 'hsa'
  WHEN account_groups.name = 'Cash' THEN 'cash'
  WHEN account_groups.name = 'Asset' THEN 'asset'
  ELSE 'checking' -- default fallback
END
FROM account_groups
WHERE accounts.account_group_id = account_groups.id
  AND accounts.created_by = account_groups.created_by;