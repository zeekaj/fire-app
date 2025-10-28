# Transfer Feature - Migration Instructions

## Overview
The transfer feature allows users to create linked transactions that represent money moving between accounts, without inflating income/expense analytics.

## Database Migration

### Step 1: Apply Migration to Supabase

You need to apply migration `11_add_transfer_support.sql` to your database. Choose one of these methods:

**Option A: Via Supabase Dashboard (Recommended)**
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `/workspaces/fire-app/supabase/migrations/11_add_transfer_support.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

**Option B: Via Supabase CLI**
```bash
# From the project root
npx supabase db push
```

This will apply all pending migrations, including the new transfer support migration.

### What the Migration Does

The migration adds:

1. **`transfer_id` column** to the `transactions` table
   - Nullable UUID that references another transaction
   - Self-referencing foreign key with CASCADE delete
   - Indexed for performance

2. **`validate_transfer_pair()` function**
   - Validates that linked transactions belong to the same user
   - Prevents cross-user transfer manipulation

3. **`validate_transfer_trigger`**
   - Automatically runs before INSERT/UPDATE on transactions
   - Ensures transfer integrity

### Verifying the Migration

After applying, verify it worked:

```sql
-- Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name = 'transfer_id';

-- Should return:
-- column_name  | data_type
-- transfer_id  | uuid
```

## Code Changes Completed

### New Files Created

1. **`src/features/transactions/hooks/useTransfer.ts`**
   - `useCreateTransfer()` - Creates linked transaction pairs
   - `useDeleteTransfer()` - Deletes both sides of a transfer
   - Handles rollback on errors

2. **`src/features/transactions/components/TransferModal.tsx`**
   - Modal UI for creating transfers
   - Source/destination account selectors grouped by type
   - Amount and notes inputs
   - Form validation

3. **`src/lib/database.types.ts`** (updated)
   - Added `transfer_id: string | null` to transactions Row/Insert/Update types

### Exports Updated

- `src/features/transactions/index.ts` now exports:
  - `TransferModal` component
  - `useCreateTransfer` hook
  - `useDeleteTransfer` hook

## Next Steps (Not Yet Implemented)

After you apply the migration, these tasks remain:

### 1. Integrate Transfer Button into QuickAddTransaction
Add a "Transfer" button next to the Income/Expense toggle that opens the TransferModal.

### 2. Update TransactionsList to Display Transfers
- Show transfer icon/badge for transactions with `transfer_id`
- Display "From Account → To Account" instead of payee
- Handle deletion (delete both sides)

### 3. Filter Transfers from Analytics
Update the following to exclude transactions where `transfer_id IS NOT NULL`:
- `TransactionAnalytics` - Category breakdown, top payees, trends
- `SmartFeatures` - Duplicate detection, recurring patterns
- Budget calculations

### 4. Update Transaction Row Display
Modify `TransactionRow` to:
- Show a transfer icon (↔️ or similar)
- Display source → destination account names
- Style differently from regular transactions

## Testing Checklist

Once integrated:

- [ ] Can create a transfer between two accounts
- [ ] Withdrawal shows negative amount in source account
- [ ] Deposit shows positive amount in destination account
- [ ] Both transactions have matching `transfer_id` values
- [ ] Deleting one side deletes both
- [ ] Transfers don't appear in analytics category breakdown
- [ ] Transfers don't affect top payees list
- [ ] Cannot create transfer to same account
- [ ] Cannot create transfer with negative/zero amount

## Database Schema Reference

```sql
-- transactions table (relevant columns)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.users(id),
  date text NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  amount numeric NOT NULL,
  payee_id uuid REFERENCES public.payees(id),
  category_id uuid REFERENCES public.categories(id),
  notes text,
  is_pending boolean DEFAULT false,
  transfer_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE, -- NEW
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for transfer lookups
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id 
ON public.transactions(transfer_id);
```

## Migration File Location

`/workspaces/fire-app/supabase/migrations/11_add_transfer_support.sql`
