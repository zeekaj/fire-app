# Quick Start: Complete Phase A Setup

## 🎯 Goal
Make the scenarios feature fully functional by adding missing database columns.

---

## Step 1: Apply Database Migration (2 minutes)

### Option A: Supabase Dashboard (Recommended)

1. Open: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc/sql/new
2. Copy the SQL below:

```sql
-- Add financial fields to scenarios table
ALTER TABLE scenarios 
  ADD COLUMN IF NOT EXISTS portfolio_value_now numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS savings numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portfolio_stocks numeric(5,4) DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS notes text;

-- Add helpful comments
COMMENT ON COLUMN scenarios.portfolio_value_now IS 'Current portfolio/net worth value';
COMMENT ON COLUMN scenarios.savings IS 'Annual savings/contribution amount';
COMMENT ON COLUMN scenarios.expenses IS 'Annual expenses in retirement';
COMMENT ON COLUMN scenarios.portfolio_stocks IS 'Portfolio stock allocation (0-1, e.g., 0.6 = 60%)';
COMMENT ON COLUMN scenarios.notes IS 'User notes about this scenario';
```

3. Click **Run** (or press Cmd+Enter)
4. ✅ Should see: "Success. No rows returned"

---

## Step 2: Update Adapter Code (3 minutes)

### Edit: `src/features/scenarios/scenarios.types.ts`

Find the `scenarioToDisplayFormat()` function around **line 44**.

**Replace these lines:**
```typescript
// These fields need to be added to database - using defaults for now
current_savings: 100000, // TODO: Add portfolio_value_now column to database
annual_contribution: 20000, // TODO: Add savings column to database
annual_expenses: 40000, // TODO: Add expenses column to database
portfolio_stock_pct: 0.6, // TODO: Add portfolio_stocks column to database
```

**With:**
```typescript
// Now using actual database columns
current_savings: scenario.portfolio_value_now || 0,
annual_contribution: scenario.savings || 0,
annual_expenses: scenario.expenses || 0,
portfolio_stock_pct: scenario.portfolio_stocks || 0.6,
```

**And replace:**
```typescript
notes: null, // TODO: Add notes column to database
```

**With:**
```typescript
notes: scenario.notes || null,
```

### Also update `formDataToScenarioInsert()` function

Find it around **line 36**. Add these fields **before** the closing brace:

```typescript
    created_by: '', // Will be set by RLS
    // Financial fields (now in database after migration 04)
    portfolio_value_now: formData.current_savings,
    savings: formData.annual_contribution,
    expenses: formData.annual_expenses,
    portfolio_stocks: formData.portfolio_stock_pct,
    notes: formData.notes || null,
  };
```

---

## Step 3: Regenerate Types (30 seconds)

```bash
cd /workspaces/fire-app
npx supabase gen types typescript --project-id slgmjbbwqhcqtguudglc > src/lib/database.types.ts
```

Expected: Types file updated with new columns.

---

## Step 4: Test the Feature (5 minutes)

### Start Dev Server (if not running)
```bash
npm run dev
```

### Test Create Scenario

1. Navigate to: `http://localhost:5173/scenarios`
2. Click **"+ New Scenario"**
3. Fill in:
   - **Name**: "My Retirement Plan"
   - **Current Age**: 35
   - **Retirement Age**: 65
   - **Life Expectancy**: 95
   - **Current Savings**: $150,000
   - **Annual Contribution**: $25,000
   - **Annual Expenses**: $50,000
   - **Stock Allocation**: 70%
   - **Expected Return**: 7%
   - **Std Deviation**: 15%
   - **Inflation**: 2.5%
   - **Strategy**: Guardrails
4. Click **"Create Scenario"**
5. ✅ Should see scenario card appear

### Verify Data Persists

1. Refresh the page
2. ✅ Scenario should still be there
3. ✅ All values should match what you entered
4. ✅ "Years to FI" should show a number (e.g., 22 years)
5. ✅ "Success Rate" should show percentage (e.g., 87%)

### Test Delete

1. Click the **×** button on scenario card
2. Confirm deletion
3. ✅ Scenario disappears

---

## Step 5: Verify on Dashboard (2 minutes)

1. Navigate to: `http://localhost:5173/`
2. ✅ Should see "Time to FI" tile
3. Create another scenario
4. ✅ Scenario selector should work
5. ✅ Years countdown should update

---

## ✅ Success Checklist

After completing all steps:

- [ ] Migration ran without errors
- [ ] Adapter code updated to use real columns
- [ ] Types regenerated successfully
- [ ] Can create scenarios with custom values
- [ ] Scenarios persist after page refresh
- [ ] Calculations show correct results
- [ ] Can delete scenarios
- [ ] No TypeScript errors

---

## 🎉 You're Done!

Phase A is now **100% complete**. You have:
- ✅ Full FIRE simulation library
- ✅ Scenarios CRUD operations
- ✅ Monte Carlo & historical backtesting
- ✅ Dashboard integration
- ✅ Type-safe database integration

---

## 🐛 Troubleshooting

### "Column already exists" error
**Cause**: Migration was already run  
**Fix**: No action needed, continue to step 2

### TypeScript errors after updating adapter
**Cause**: Types not regenerated  
**Fix**: Run step 3 again

### Scenario doesn't persist values
**Cause**: formDataToScenarioInsert() not updated  
**Fix**: Make sure you added the financial fields to the insert function

### "Cannot find name 'portfolio_value_now'" error
**Cause**: Types need regeneration  
**Fix**: Run step 3

---

## 📞 Need Help?

Check these files:
- `PHASE_A_SUMMARY.md` - Full implementation details
- `PHASE_A_NEXT_STEPS.md` - Detailed architecture explanation
- `supabase/migrations/04_add_scenario_financial_fields.sql` - The migration SQL

Total Time: ~10 minutes
Difficulty: Easy
