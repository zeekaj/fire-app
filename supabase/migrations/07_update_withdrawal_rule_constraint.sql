-- 07_update_withdrawal_rule_constraint.sql
-- Update withdrawal_rule constraint to include 'percentage' strategy

-- Drop the old constraint
ALTER TABLE public.scenarios
DROP CONSTRAINT IF EXISTS scenarios_withdrawal_rule_check;

-- Add new constraint with 'percentage' included
ALTER TABLE public.scenarios
ADD CONSTRAINT scenarios_withdrawal_rule_check 
CHECK (withdrawal_rule IN ('guardrails', 'fixed', 'floorCeiling', 'percentage'));

-- Add helpful comment
COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, floorCeiling, or percentage';
