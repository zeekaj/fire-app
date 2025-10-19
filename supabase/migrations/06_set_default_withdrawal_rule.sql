-- 06_set_default_withdrawal_rule.sql
-- Fix scenarios missing withdrawal_rule value

-- Update existing scenarios that have NULL withdrawal_rule to use 'fixed' as default
UPDATE public.scenarios
SET withdrawal_rule = 'fixed'
WHERE withdrawal_rule IS NULL;

-- Ensure withdrawal_rule is NOT NULL going forward
ALTER TABLE public.scenarios 
  ALTER COLUMN withdrawal_rule SET NOT NULL;

-- Add a helpful comment
COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, or floorCeiling';
