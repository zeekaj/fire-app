# Manual Database Update for Phase C

Since Supabase CLI isn't linked, you can manually run this SQL in the Supabase SQL Editor:

## Migration 05: Add selected_scenario_id column to settings table

```sql
-- Add selected_scenario_id to settings table for dashboard integration
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS selected_scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.settings.selected_scenario_id IS 'Primary FIRE scenario used for dashboard calculations and projections';
```

## Migration 06: Fix missing withdrawal_rule values (IMPORTANT!)

```sql
-- Fix scenarios missing withdrawal_rule value
UPDATE public.scenarios
SET withdrawal_rule = 'fixed'
WHERE withdrawal_rule IS NULL;

-- Ensure withdrawal_rule is NOT NULL going forward
ALTER TABLE public.scenarios 
  ALTER COLUMN withdrawal_rule SET NOT NULL;

COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, or floorCeiling';
```

## Migration 07: Add 'percentage' to withdrawal_rule constraint (IMPORTANT!)

```sql
-- Update withdrawal_rule constraint to include 'percentage' strategy
ALTER TABLE public.scenarios
DROP CONSTRAINT IF EXISTS scenarios_withdrawal_rule_check;

ALTER TABLE public.scenarios
ADD CONSTRAINT scenarios_withdrawal_rule_check 
CHECK (withdrawal_rule IN ('guardrails', 'fixed', 'floorCeiling', 'percentage'));

COMMENT ON COLUMN scenarios.withdrawal_rule IS 'Withdrawal strategy: guardrails, fixed, floorCeiling, or percentage';
```

## Step 2: Verify the migrations

```sql
-- Check settings table has selected_scenario_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check all scenarios have withdrawal_rule set
SELECT id, name, withdrawal_rule
FROM public.scenarios;
```

You should see:
- `selected_scenario_id` in the settings columns
- All scenarios should have `withdrawal_rule` values (not NULL)

## Alternative: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste **BOTH** Migration 05 AND Migration 06 SQL above (copy all the SQL from both sections)
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see "Success. No rows returned" for the ALTER commands
7. For the UPDATE command, you should see something like "Success. X rows affected" where X is the number of scenarios that were fixed

## To Test

After running **BOTH** SQL migrations, refresh your browser and:
1. The FIRE Scenario Selector tile should work without errors
2. You should be able to view scenarios without the "Unknown withdrawal strategy: undefined" error
3. All existing scenarios will use 'fixed' withdrawal strategy by default
