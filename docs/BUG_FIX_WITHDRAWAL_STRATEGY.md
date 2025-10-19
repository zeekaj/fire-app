# 🔧 Bug Fix: "Unknown withdrawal strategy: undefined"

## The Problem

When viewing the Scenarios page, you encountered this error:
```
Uncaught Error: Unknown withdrawal strategy: undefined
    at runMonteCarloSimulation (monte-carlo.ts:245:15)
```

## Root Cause

When scenarios were created in the database, the `withdrawal_rule` column was **not being set** (it was NULL). This happened because:

1. The database table has a column called `withdrawal_rule`
2. The UI code expects this field to be mapped to `withdrawal_strategy`
3. The mapping happens correctly in `scenarios.types.ts` (line 106)
4. BUT: When creating scenarios, if `withdrawal_rule` is NULL, it gets mapped to `undefined`
5. Monte Carlo simulation code throws an error when it receives `undefined` as the withdrawal strategy

## The Fix

Created **Migration 06** which:

1. **Updates all existing scenarios** that have `NULL` withdrawal_rule to use `'fixed'` as the default
2. **Sets the column to NOT NULL** to prevent this from happening in the future

## How to Apply the Fix

Run this SQL in your Supabase SQL Editor:

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

## Steps to Fix

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
2. Click "New Query"
3. Paste the SQL above
4. Click "Run"
5. Refresh your browser
6. Navigate to Scenarios tab
7. Error should be gone! ✅

## What This Does

- All your existing scenarios will now use the **'fixed' withdrawal strategy**
- This means they use a fixed annual withdrawal amount adjusted for inflation
- You can change the withdrawal strategy later when editing scenarios if you want to use 'percentage' or 'guardrails' instead

## Files Changed

- ✅ Created: `/supabase/migrations/06_set_default_withdrawal_rule.sql`
- ✅ Updated: `/workspaces/fire-app/MANUAL_DB_UPDATE.md` (added Migration 06 instructions)

## Testing

After applying the migration:

1. ✅ Scenarios page should load without errors
2. ✅ Scenario cards should display success rates
3. ✅ Clicking on a scenario should work
4. ✅ Monte Carlo simulations should run successfully
5. ✅ Charts should display in scenario detail view

## Next Steps

After you run this SQL migration, the error will be fixed and you can:

1. Test the Scenarios page (should work now)
2. Test the FIRE Scenario Selector on Dashboard (from Phase C Task #1)
3. Continue with Phase C development

Let me know when you've run the migration and confirmed it's working! 🚀
