# Apply Migration Instructions

## 🎯 Goal
Apply the `03_scenarios.sql` migration to enable the FIRE Scenarios feature.

## 📋 Step-by-Step Instructions

### Option 1: Via Supabase Dashboard (Recommended - 3 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: `slgmjbbwqhcqtguudglc` (fire-app)

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query"

3. **Copy Migration SQL**
   ```sql
   -- 03_scenarios.sql
   -- Scenarios table for FIRE projections and "what-if" planning
   -- This table already exists in 01_init.sql, but we're adding indices and policies

   -- Add helpful indices for scenarios queries
   CREATE INDEX IF NOT EXISTS idx_scenarios_user ON scenarios(created_by);
   CREATE INDEX IF NOT EXISTS idx_scenarios_name ON scenarios(created_by, name);

   -- Ensure RLS is enabled
   ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

   -- Drop existing policies if any (idempotent)
   DROP POLICY IF EXISTS "Users can view own scenarios" ON scenarios;
   DROP POLICY IF EXISTS "Users can insert own scenarios" ON scenarios;
   DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
   DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;

   -- RLS Policies for scenarios
   CREATE POLICY "Users can view own scenarios"
     ON scenarios FOR SELECT
     USING (auth.uid() = created_by);

   CREATE POLICY "Users can insert own scenarios"
     ON scenarios FOR INSERT
     WITH CHECK (auth.uid() = created_by);

   CREATE POLICY "Users can update own scenarios"
     ON scenarios FOR UPDATE
     USING (auth.uid() = created_by)
     WITH CHECK (auth.uid() = created_by);

   CREATE POLICY "Users can delete own scenarios"
     ON scenarios FOR DELETE
     USING (auth.uid() = created_by);

   -- Add helpful comment
   COMMENT ON TABLE scenarios IS 'FIRE projection scenarios with user-defined assumptions for Monte Carlo and historical simulations';
   ```

4. **Run the Query**
   - Click "Run" or press Ctrl+Enter
   - Verify success message appears

5. **Verify Table Exists**
   - Click "Table Editor" in left sidebar
   - Confirm `scenarios` table is listed
   - Click on it to see columns and structure

### Option 2: Via Supabase CLI (If linked - 1 minute)

```bash
cd /workspaces/fire-app
npx supabase db push
```

**Note:** This currently fails with "Cannot find project ref" - the project isn't linked to CLI.

## ✅ Verification

After applying the migration, verify:

1. **Table exists:**
   - Go to Table Editor → scenarios
   - Should see 15 columns including: name, current_age, retirement_age, etc.

2. **Policies are active:**
   - In Table Editor, click on scenarios table
   - Click "Policies" tab
   - Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)

3. **Indices created:**
   - Queries on created_by and name will be fast

## 🔄 Next Steps

After migration is applied:

1. **Regenerate Database Types**
   ```bash
   cd /workspaces/fire-app
   npx supabase gen types typescript --project-id slgmjbbwqhcqtguudglc > src/lib/database.types.ts
   ```

2. **Remove Type Assertions**
   - Open `src/features/scenarios/hooks/useScenarios.ts`
   - Remove the `@ts-expect-error` comment (line ~18)
   - Open `src/features/scenarios/hooks/useScenarioMutations.ts`
   - Remove 2 `@ts-expect-error` comments (lines ~18, ~48)

3. **Test the Feature**
   ```bash
   npm run dev
   ```
   - Navigate to "Scenarios" tab
   - Click "+ New Scenario"
   - Create a test scenario
   - Verify calculations appear

## 🐛 Troubleshooting

### "relation 'scenarios' does not exist"
**Cause:** Migration wasn't applied  
**Fix:** Follow Option 1 above

### "permission denied for table scenarios"
**Cause:** RLS policies not created  
**Fix:** Re-run the migration SQL (it's idempotent)

### TypeScript errors about scenarios
**Cause:** database.types.ts not regenerated  
**Fix:** Run the `npx supabase gen types` command above

### "Cannot find project ref"
**Cause:** Supabase CLI not linked to project  
**Fix:** Use Option 1 (Dashboard) instead of CLI

## 📊 Expected Results

After successful migration:

- ✅ scenarios table with RLS enabled
- ✅ 4 policies protecting user data
- ✅ 2 indices for fast queries
- ✅ Ready to create scenarios in the app
- ✅ All CRUD operations working

---

**Estimated Time:** 3-5 minutes  
**Difficulty:** Easy (copy/paste SQL)  
**Risk:** None (migration is idempotent and safe)
