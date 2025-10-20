# Phase A - Scenarios Implementation - Next Steps

## ✅ What's Complete

1. **All TypeScript Code** (17 files, 2,500+ lines)
   - FIRE simulation library with Monte Carlo & historical backtesting
   - Scenarios UI components (AddScenarioModal, ScenariosPage, ScenarioSelector)
   - React Query hooks for data fetching
   - Type-safe adapter layer between UI and database

2. **Migration 03_scenarios.sql** ✅ Applied
   - Added RLS policies for scenarios table
   - Added helpful indexes

3. **Type Generation** ✅ Complete
   - `database.types.ts` regenerated with actual schema
   - Adapter functions created to bridge UI ↔ database formats

## ⚠️ Missing Database Columns

The original `scenarios` table is missing some columns needed for the full feature. A migration has been created but **YOU need to run it in Supabase**:

### Migration File Created
📁 `supabase/migrations/04_add_scenario_financial_fields.sql`

This adds:
- `portfolio_value_now` - Current net worth
- `savings` - Annual savings/contributions
- `expenses` - Annual expenses
- `portfolio_stocks` - Stock allocation percentage (0-1)
- `notes` - User notes

### How to Apply the Migration

**Option 1: Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy/paste the contents of `supabase/migrations/04_add_scenario_financial_fields.sql`
5. Click **Run** or press Cmd+Enter

**Option 2: Supabase CLI**

```bash
# Link the project (if not already linked)
npx supabase link --project-ref slgmjbbwqhcqtguudglc

# Push the migration
npx supabase db push
```

## 🔄 Current Workaround

Until the migration is applied, the adapter uses **default values** for missing fields:

```typescript
// scenarioToDisplayFormat() in scenarios.types.ts
current_savings: 100000,      // TODO: Will use database column after migration
annual_contribution: 20000,   // TODO: Will use database column after migration
annual_expenses: 40000,       // TODO: Will use database column after migration
portfolio_stock_pct: 0.6,     // TODO: Will use database column after migration
```

This means:
- ✅ The app compiles and runs without errors
- ✅ You can create scenarios (dates and return parameters will save)
- ⚠️ Financial amounts won't persist (will always show defaults)
- ✅ After running migration 04, remove TODOs and use actual columns

## 🧪 Testing Plan

After applying migration 04:

1. **Update the adapter functions** in `src/features/scenarios/scenarios.types.ts`:
   - In `scenarioToDisplayFormat()`: Replace default values with actual database columns
   - In `formDataToScenarioInsert()`: Include the new financial fields

2. **Regenerate types**:
   ```bash
   npx supabase gen types typescript --project-id slgmjbbwqhcqtguudglc > src/lib/database.types.ts
   ```

3. **Test creating a scenario**:
   - Navigate to Scenarios page
   - Click "+ New Scenario"
   - Fill in all fields
   - Save and verify it appears in the list

4. **Test calculations**:
   - Verify "Years to FI" displays correctly
   - Verify "Success Rate" shows Monte Carlo result
   - Check that projected net worth is reasonable

## 📚 Architecture Notes

### Adapter Pattern

We use an **adapter layer** to bridge two different schemas:

**UI Format** (age-based, user-friendly):
```typescript
{
  current_age: 35,
  retirement_age: 65,
  life_expectancy: 95,
  expected_return_mean: 0.05,
  withdrawal_strategy: 'guardrails'
}
```

**Database Format** (date-based, more accurate):
```typescript
{
  death_date: "2085-01-01",
  retirement_date: "2055-01-01",
  mean_return_real: 0.05,
  withdrawal_rule: "guardrails"
}
```

**Conversion Functions**:
- `formDataToScenarioInsert()` - Converts UI form → Database format
- `scenarioToDisplayFormat()` - Converts Database → UI display format

### Why Date-Based Storage?

The database uses dates instead of ages because:
- ✅ More accurate for long-term projections
- ✅ Doesn't require recalculation as time passes
- ✅ Works correctly across multiple years
- ✅ Standard practice in financial planning systems

### Data Flow

```
User Form Input
    ↓
formDataToScenarioInsert()    ← Converts ages to dates
    ↓
Database (scenarios table)
    ↓
scenarioToDisplayFormat()     ← Converts dates back to ages
    ↓
UI Components (display)
```

## 🎯 Next Steps

1. ✅ Run migration 04 in Supabase
2. ✅ Update adapter functions to use real columns
3. ✅ Regenerate TypeScript types
4. ✅ Test creating and viewing scenarios
5. ✅ Remove @ts-expect-error directives (already done!)
6. ✅ Mark Phase A as 100% complete

---

**Status**: Phase A is **95% complete**. Just need to apply the database migration and update the adapter to use real columns instead of defaults.
