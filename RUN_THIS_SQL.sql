-- ============================================================================
-- PHASE C DATABASE MIGRATIONS - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Copy this entire file and paste into Supabase SQL Editor, then click Run
-- URL: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
-- ============================================================================

-- Migration 05: Add selected_scenario_id to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS selected_scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.settings.selected_scenario_id IS 'Primary FIRE scenario used for dashboard calculations and projections';

-- Migration 06: Fix missing withdrawal_rule values (CRITICAL FIX!)
UPDATE public.scenarios
SET withdrawal_rule = 'fixed'
WHERE withdrawal_rule IS NULL;

ALTER TABLE public.scenarios 
  ALTER COLUMN withdrawal_rule SET NOT NULL;

COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, or floorCeiling';

-- Migration 07: Add 'percentage' to withdrawal_rule constraint
ALTER TABLE public.scenarios
DROP CONSTRAINT IF EXISTS scenarios_withdrawal_rule_check;

ALTER TABLE public.scenarios
ADD CONSTRAINT scenarios_withdrawal_rule_check 
CHECK (withdrawal_rule IN ('guardrails', 'fixed', 'floorCeiling', 'percentage'));

COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, floorCeiling, or percentage';

-- ============================================================================
-- VERIFICATION QUERIES (run these after to confirm)
-- ============================================================================

-- Should show selected_scenario_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
AND table_schema = 'public'
AND column_name = 'selected_scenario_id';

-- Should show all scenarios with withdrawal_rule set (no NULLs)
SELECT id, name, withdrawal_rule
FROM public.scenarios;
