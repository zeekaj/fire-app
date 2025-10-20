# Database Migration Status

## Current Status: Migration 03 Applied ✅ | Migration 04 Pending ⏳

---

## ✅ Migration 03: Scenarios RLS & Indexes (APPLIED)

**File**: `supabase/migrations/03_scenarios.sql`  
**Status**: ✅ Applied to production database  
**Applied**: Earlier in this session  

### What it did:
- Added Row Level Security (RLS) policies for scenarios table
- Created indexes for performance (created_by, name)
- Added table comments for documentation

### Verification:
- User confirmed: "03_scenarios.sql run in supabase"
- RLS policies are active
- Users can only see their own scenarios

---

## ⏳ Migration 04: Financial Fields (PENDING)

**File**: `supabase/migrations/04_add_scenario_financial_fields.sql`  
**Status**: ⏳ Created but not yet applied  
**Action Required**: Run in Supabase SQL Editor  

### What it will add:
```sql
ALTER TABLE scenarios 
  ADD COLUMN portfolio_value_now numeric(15,2) DEFAULT 0,
  ADD COLUMN savings numeric(15,2) DEFAULT 0,
  ADD COLUMN expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN portfolio_stocks numeric(5,4) DEFAULT 0.6,
  ADD COLUMN notes text;
```

### Why it's needed:
The original `scenarios` table (from 01_init.sql) only has:
- Dates (death_date, retirement_date)
- Return assumptions (mean_return_real, stdev_return_real)
- Withdrawal settings (withdrawal_rule, swr)

It's missing:
- Current portfolio value
- Savings/contribution amounts
- Annual expenses
- Asset allocation
- User notes

### Current Workaround:
The adapter layer uses **hardcoded defaults** until migration is applied:
- Current Savings: $100,000
- Annual Contribution: $20,000
- Annual Expenses: $40,000
- Stock Allocation: 60%

**This means**: Scenarios will save but financial amounts won't persist.

### Impact:
- ✅ Code compiles and runs
- ✅ Can create scenarios
- ⚠️ Financial data uses defaults (not saved)
- ✅ After migration, financial data will persist

---

## 📊 Migration Timeline

| Migration | Status | Date Applied | Description |
|-----------|--------|--------------|-------------|
| 01_init.sql | ✅ Applied | Before session | Initial schema (users, accounts, transactions, scenarios) |
| 02_account_groups.sql | ✅ Applied | Before session | Account grouping feature |
| 03_scenarios.sql | ✅ Applied | Today | Scenarios RLS & indexes |
| **04_add_scenario_financial_fields.sql** | ⏳ **Pending** | **Not yet** | **Financial fields for scenarios** |

---

## 🎯 How to Apply Migration 04

### Step 1: Open Supabase Dashboard
https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc/sql/new

### Step 2: Copy Migration SQL
Location: `supabase/migrations/04_add_scenario_financial_fields.sql`

Or copy directly:
```sql
-- 04_add_scenario_financial_fields.sql
-- Add financial input fields to scenarios table

-- Add columns for portfolio and financial data
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

### Step 3: Run It
- Click "Run" or press Cmd+Enter
- Should see: "Success. No rows returned"

### Step 4: Update Code
Follow instructions in `QUICK_START_PHASE_A.md`

---

## 🔍 Verification Queries

### After applying migration, verify columns exist:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'scenarios'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

Expected to see:
- `portfolio_value_now` | numeric | 0
- `savings` | numeric | 0
- `expenses` | numeric | 0
- `portfolio_stocks` | numeric | 0.6
- `notes` | text | NULL

### Test inserting a scenario with new fields:

```sql
INSERT INTO scenarios (
  created_by,
  name,
  death_date,
  retirement_date,
  portfolio_value_now,
  savings,
  expenses,
  portfolio_stocks,
  withdrawal_rule
) VALUES (
  auth.uid(),
  'Test Scenario',
  '2085-01-01',
  '2055-01-01',
  150000,
  25000,
  50000,
  0.70,
  'guardrails'
);
```

### Query to see all scenarios with new fields:

```sql
SELECT 
  name,
  portfolio_value_now,
  savings,
  expenses,
  portfolio_stocks,
  notes
FROM scenarios
WHERE created_by = auth.uid()
ORDER BY created_at DESC;
```

---

## 📝 Post-Migration Checklist

After running migration 04:

- [ ] Migration ran successfully (no errors)
- [ ] Columns visible in database schema
- [ ] Updated `scenarios.types.ts` adapter functions
- [ ] Regenerated TypeScript types
- [ ] Tested creating scenario with custom values
- [ ] Verified data persists (not using defaults)
- [ ] No TypeScript errors
- [ ] All calculations work correctly

---

## 🚨 Rollback Plan (if needed)

If migration causes issues:

```sql
-- Rollback: Remove added columns
ALTER TABLE scenarios
  DROP COLUMN IF EXISTS portfolio_value_now,
  DROP COLUMN IF EXISTS savings,
  DROP COLUMN IF EXISTS expenses,
  DROP COLUMN IF EXISTS portfolio_stocks,
  DROP COLUMN IF EXISTS notes;
```

**Note**: This is safe because the app has a workaround. Code will continue using defaults.

---

## 📚 Related Documentation

- `QUICK_START_PHASE_A.md` - Step-by-step guide to apply migration
- `PHASE_A_NEXT_STEPS.md` - Detailed architecture explanation
- `PHASE_A_SUMMARY.md` - Complete feature overview
- `supabase/migrations/04_add_scenario_financial_fields.sql` - The actual migration

---

**Last Updated**: 2024-02-XX  
**Next Action**: Apply migration 04 in Supabase Dashboard  
**Estimated Time**: 2 minutes  
**Risk Level**: Low (uses IF NOT EXISTS, has rollback plan)
