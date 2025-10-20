# Database Migration Instructions - Age Columns

## Current Status: READY TO APPLY

The database migration for adding dedicated age columns to the scenarios table is prepared and ready to apply.

## Step 1: Apply Database Migration

**IMPORTANT**: Copy and paste the contents of `APPLY_AGE_MIGRATION.sql` into the Supabase SQL Editor:

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
2. Go to SQL Editor
3. Copy the entire contents of `APPLY_AGE_MIGRATION.sql`
4. Paste and click "Run"

## Step 2: Update Database Types

After the migration is applied successfully, run:

```bash
npm run supabase:types:remote
```

This will regenerate the TypeScript types to include the new age columns.

## Step 3: Verify Migration

Run the verification queries at the bottom of `APPLY_AGE_MIGRATION.sql` to confirm:

- New age columns exist and are populated
- Existing data was migrated from JSON notes format
- All scenarios have valid age values

## What This Migration Does

### Database Changes:
- ✅ Adds `current_age`, `retirement_age`, `life_expectancy` columns to scenarios table
- ✅ Migrates existing age data from JSON notes field to dedicated columns
- ✅ Preserves original user notes (removes JSON wrapper)
- ✅ Adds proper constraints and indexes
- ✅ Sets reasonable defaults for new scenarios

### Code Changes (Already Complete):
- ✅ Updated `scenarios.types.ts` to use new columns
- ✅ Simplified data conversion functions (no more JSON parsing)
- ✅ Removed temporary JSON storage logic

## Benefits After Migration:

1. **Better Data Integrity**: Age data has proper types and constraints
2. **Improved Performance**: Direct column access instead of JSON parsing
3. **Cleaner Code**: No more complex JSON wrapper logic
4. **Better Queries**: Can filter and sort by age columns directly
5. **User-Friendly**: Notes field returns to being just user notes

## Timeline:

- **Phase D**: Migration files created, code updated ✅
- **Manual Step**: Apply `APPLY_AGE_MIGRATION.sql` in Supabase SQL Editor
- **After Migration**: Run `npm run supabase:types:remote` to update types
- **Verification**: Test scenarios functionality works correctly

## Current Type Errors:

The TypeScript compiler currently shows errors because:
- Database types don't include new age columns yet (until migration applied + types regenerated)
- Code is already updated to use new columns (future-ready)

This is expected and will resolve after Step 2 above.