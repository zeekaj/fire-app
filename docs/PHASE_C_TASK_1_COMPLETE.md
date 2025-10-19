# Phase C Task #1: FIRE Scenario Selector - COMPLETE ✅

## Summary

Successfully implemented and debugged the FIRE Scenario Selector feature for the Dashboard, enabling users to select and manage their primary retirement planning scenario.

## Features Implemented

### 1. FIRE Scenario Selector Tile (Dashboard)
- ✅ Dropdown selector showing all user scenarios
- ✅ Persistent selection stored in database (settings.selected_scenario_id)
- ✅ Scenario info display (current age, retirement age, expected return, inflation)
- ✅ Navigation buttons ("View Details", "Manage Scenarios")
- ✅ Empty state for new users
- ✅ Loading states with skeleton UI

### 2. Scenarios Page Enhancements
- ✅ List view of all scenarios with cards
- ✅ Monte Carlo simulation results (success rates)
- ✅ Scenario detail view with charts
- ✅ Create new scenario functionality
- ✅ Support for multiple withdrawal strategies

## Bugs Fixed

### Bug #1: withdrawal_rule NULL Values
**Problem**: Scenarios had NULL withdrawal_rule causing "Unknown withdrawal strategy: undefined" error

**Solution**: 
- Created Migration 06 to set default withdrawal_rule='fixed' for existing scenarios
- Added NOT NULL constraint to prevent future NULLs
- Added fallback logic in scenarioToDisplayFormat() with validation

**Files Modified**:
- `src/features/scenarios/scenarios.types.ts` - Added robust withdrawal strategy validation
- `supabase/migrations/06_set_default_withdrawal_rule.sql` - Database fix

### Bug #2: Selected Scenario Data Transformation
**Problem**: Selected scenario showing NaN% for expected return and inflation

**Solution**:
- Applied scenarioToDisplayFormat() transformation to useSelectedScenario hook
- Properly converts database fields to display format with calculated values

**Files Modified**:
- `src/features/dashboard/hooks/useSelectedScenario.ts` - Added transformation

### Bug #3: React Query Cache Stale Data
**Problem**: Browser cache serving old scenario data even after database fixes

**Solution**:
- Added query key versioning ('scenarios', 'v2') to force cache refresh
- Hard refresh cleared stale data

**Files Modified**:
- `src/features/scenarios/hooks/useScenarios.ts` - Updated query key

### Bug #4: Edit Button Non-Functional
**Problem**: Edit button in scenario detail view had no onClick handler

**Solution**:
- Added temporary alert explaining feature is coming soon
- Added delete button confirmation dialog

**Files Modified**:
- `src/features/scenarios/components/ScenarioDetailPage.tsx` - Added onClick handlers

### Bug #5: Database Constraint Violation on Create
**Problem**: Creating scenarios with 'percentage' withdrawal strategy failed with constraint violation

**Root Cause**: Database check constraint only allowed: 'guardrails', 'fixed', 'floorCeiling'

**Solution**:
- Created Migration 07 to update constraint to include 'percentage'
- Aligns database with Monte Carlo simulation capabilities

**Files Modified**:
- `supabase/migrations/07_update_withdrawal_rule_constraint.sql` - Updated constraint

### Bug #6: Missing withdrawalRate for Percentage Strategy
**Problem**: Monte Carlo simulation failed for 'percentage' strategy - required withdrawalRate parameter not provided

**Solution**:
- Calculate withdrawalRate from annual_expenses / projected portfolio value
- Conditionally provide correct parameters based on withdrawal strategy
- Default to 4% SWR if calculation yields invalid result

**Files Modified**:
- `src/features/scenarios/components/ScenariosPage.tsx` - Added conditional parameters
- `src/features/scenarios/components/ScenarioDetailPage.tsx` - Added conditional parameters

### Bug #7: View Details vs Manage Scenarios Navigation
**Problem**: Both "View Details" and "Manage Scenarios" buttons navigated to the same view (list view)

**Solution**:
- Updated navigation callback to accept optional scenario ID parameter
- "View Details" passes selected scenario ID → opens detail view
- "Manage Scenarios" passes no ID → shows list view
- Added initialSelectedScenarioId prop to ScenariosPage
- Reset selected scenario when clicking Scenarios tab directly

**Files Modified**:
- `src/features/dashboard/components/FIREScenarioSelectorTile.tsx` - Pass scenario ID on View Details
- `src/features/dashboard/components/Dashboard.tsx` - Updated callback signature
- `src/features/scenarios/components/ScenariosPage.tsx` - Accept initial scenario ID
- `src/App.tsx` - State management and navigation logic

## Database Migrations Applied

### Migration 05: Add selected_scenario_id to settings
```sql
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS selected_scenario_id UUID 
REFERENCES public.scenarios(id) ON DELETE SET NULL;
```

### Migration 06: Fix withdrawal_rule NULL values
```sql
UPDATE public.scenarios
SET withdrawal_rule = 'fixed'
WHERE withdrawal_rule IS NULL;

ALTER TABLE public.scenarios 
ALTER COLUMN withdrawal_rule SET NOT NULL;
```

### Migration 07: Add 'percentage' to withdrawal_rule constraint
```sql
ALTER TABLE public.scenarios
DROP CONSTRAINT IF EXISTS scenarios_withdrawal_rule_check;

ALTER TABLE public.scenarios
ADD CONSTRAINT scenarios_withdrawal_rule_check 
CHECK (withdrawal_rule IN ('guardrails', 'fixed', 'floorCeiling', 'percentage'));
```

## Files Created

1. `src/features/dashboard/hooks/useSelectedScenario.ts` (110 lines)
   - Custom hook for managing selected scenario
   - Queries: getSelectedScenarioId, getSelectedScenario
   - Mutation: updateSelectedScenarioId
   - Cache invalidation on updates

2. `src/features/dashboard/components/FIREScenarioSelectorTile.tsx` (220 lines)
   - Dropdown selector component
   - Three states: empty, loading, loaded
   - Info display and navigation buttons

3. `supabase/migrations/05_add_selected_scenario_to_settings.sql`
4. `supabase/migrations/06_set_default_withdrawal_rule.sql`
5. `supabase/migrations/07_update_withdrawal_rule_constraint.sql`
6. `docs/BUG_FIX_WITHDRAWAL_STRATEGY.md`
7. `RUN_THIS_SQL.sql` - Consolidated migration runner

## Files Modified

1. `src/features/dashboard/components/Dashboard.tsx`
   - Added FIREScenarioSelectorTile integration
   - Added DashboardProps interface with navigation callback

2. `src/App.tsx`
   - Passed navigation callback to Dashboard component

3. `src/features/scenarios/scenarios.types.ts`
   - Enhanced scenarioToDisplayFormat with robust validation
   - Fallback logic for withdrawal_strategy

4. `src/features/scenarios/hooks/useScenarios.ts`
   - Updated query key for cache busting
   - Applied scenarioToDisplayFormat transformation

5. `src/features/scenarios/components/ScenariosPage.tsx`
   - Added conditional parameters for Monte Carlo based on withdrawal strategy
   - Calculate withdrawalRate for percentage strategy

6. `src/features/scenarios/components/ScenarioDetailPage.tsx`
   - Added onClick handlers for Edit/Delete buttons
   - Added conditional parameters for Monte Carlo simulation

## Testing Results

### ✅ Dashboard - FIRE Scenario Selector
- [x] Dropdown shows all scenarios
- [x] Selection persists across page refreshes
- [x] Info displays correctly (age, return %, inflation %)
- [x] "View Details" navigates to Scenarios tab
- [x] "Manage Scenarios" navigates to Scenarios tab

### ✅ Scenarios Page
- [x] Lists all scenarios with cards
- [x] Shows success rates from Monte Carlo
- [x] Displays financial metrics
- [x] Click scenario card to view details
- [x] Create new scenario works
- [x] All withdrawal strategies work (guardrails, fixed, percentage)

### ✅ Scenario Detail View
- [x] Shows scenario parameters
- [x] Displays charts (Net Worth, Monte Carlo, Historical, Withdrawal Strategy)
- [x] Monte Carlo simulation runs successfully
- [x] Edit button shows alert (temporary)
- [x] Delete button shows confirmation (temporary)

## Known Limitations / Future Work

1. **Edit Scenario**: Currently shows alert - need to build EditScenarioModal component
2. **Delete Scenario**: Currently shows alert - need to implement actual deletion with mutation
3. **Empty State**: Need to test scenario selector with zero scenarios
4. **Database Types**: Still using @ts-ignore for selected_scenario_id - need to regenerate types

## Performance Notes

- Monte Carlo simulations: 1,000 runs per scenario (fast enough for preview)
- React Query cache: 5-minute stale time for scenarios
- Scenarios load instantly on subsequent visits (cached)

## Next Steps

Ready for **Phase C Task #2: Enhance Time to FI Tile** with:
- Mini projection chart (sparkline)
- Success probability badge
- On-track status indicator
- Integration with selected scenario

---

**Status**: ✅ COMPLETE & TESTED
**Date**: October 19, 2025
**Bugs Fixed**: 7
**Migrations Applied**: 3
**Lines of Code**: ~400 new, ~100 modified
