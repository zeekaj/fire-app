# Transaction System Overhaul - October 27, 2025

## Summary
Complete redesign of the transaction system with 4 distinct transaction types, integrated transfer UI, automatic account balance tracking, and account register view.

## Features Implemented

### 1. Four Transaction Types
Replaced the old 2-type system (expense/income) with 4 clear types:

- **💸 Expense** - Purchases from any account (cash or credit)
- **💰 Income** - Outside money coming in
- **↔️ Transfer** - Moving money between accounts
- **💳 Payment** - Putting cash towards debts (credit cards, mortgages)

### 2. Integrated Transfer UI in QuickAddTransaction
**Problem**: Users had to open a separate modal for transfers, creating awkward modal stacking.

**Solution**: 
- Transaction type buttons now include all 4 types in a 2x2 grid
- Form fields change dynamically based on selected type:
  - Expense/Income: Shows Payee and Category fields
  - Transfer/Payment: Shows From/To Account selectors
- Account dropdowns show current balances for easy reference
- Payment type automatically filters destination accounts to only show credit cards and mortgages

**Files Changed**:
- `src/features/transactions/components/QuickAddTransaction.tsx`
  - Updated `TransactionType` to include 'transfer' and 'payment'
  - Modified `handleSubmit` to handle transfers/payments via `createTransfer.mutateAsync()`
  - Updated `validateForm` to conditionally require fields based on transaction type
  - Added conditional rendering for form fields
  - Removed `TransferModal` dependency and modal stacking logic

### 3. Automatic Account Balance Tracking
**Problem**: Account balances were static and didn't update when transactions were created.

**Solution**: Database triggers that automatically calculate and update account balances.

**Migrations Created**:
- `supabase/migrations/12_add_transaction_type.sql`
  - Added `transaction_type` column with check constraint
  - Values: 'expense', 'income', 'transfer', 'debt_payment'
  - Auto-backfilled existing transactions based on transfer_id and amount
  - Updated `validate_transfer_pair()` function to set transaction_type

- `supabase/migrations/13_auto_update_account_balances.sql`
  - Created `recalculate_account_balance()` function
  - Formula: `current_balance = opening_balance + sum(all transaction amounts)`
  - Created trigger on transactions table for INSERT/UPDATE/DELETE
  - Automatically recalculates affected account balances
  - Ran initial sync for all existing accounts

- `supabase/migrations/14_trigger_balance_on_opening_balance_change.sql`
  - Created trigger on accounts table for opening_balance changes
  - Automatically recalculates current_balance when opening_balance is edited
  - Ensures balance stays in sync without manual refresh

### 4. Account Register View
**Problem**: No way to view all transactions for a specific account with running balance.

**Solution**: New AccountRegister component accessible from each account card.

**Features**:
- Displays all transactions for the account chronologically
- Shows beginning balance at the top
- Calculates running balance after each transaction
- Separate columns for Payments (red) and Deposits (green)
- Click any transaction to edit it inline (uses EditTransaction modal)
- Shows summary totals at the bottom
- Works like a traditional checkbook register or bank statement

**Files Created**:
- `src/features/accounts/components/AccountRegister.tsx`
  - Full register view with running balance calculation
  - Fetches transactions with payee/category joins
  - Editable rows (click to edit)
  - Summary statistics

**Files Changed**:
- `src/features/accounts/components/AccountCard.tsx`
  - Added "View Register" button
  - Imports and renders AccountRegister modal

### 5. Account Management Improvements
**Changes**:
- Renamed "Opening Balance" to "Beginning Balance" in UI
- `AddAccountModal`: Creates accounts with beginning balance
- `EditAccountModal`: Now edits beginning balance (not current balance)
  - Shows read-only current balance with "(auto-calculated)" label
  - Current balance updates automatically via trigger when beginning balance changes

**Files Changed**:
- `src/features/accounts/components/AddAccountModal.tsx` - Label update
- `src/features/accounts/components/EditAccountModal.tsx` - Changed to edit opening_balance instead of current_balance

### 6. Payee Input Enhancement
**Problem**: Entering payees required too many clicks.

**Solution**: Added keyboard shortcut to PayeeSuggestionInput.
- When typing narrows results to exactly 1 payee, pressing Enter automatically selects it
- Faster workflow: Type a few letters → Enter → Done

**Files Changed**:
- `src/features/transactions/components/PayeeSuggestionInput.tsx`
  - Updated `handleKeyDown` to auto-select when only one suggestion remains

## Database Schema Changes

### New Column: `transactions.transaction_type`
- Type: `text` with check constraint
- Values: 'expense', 'income', 'transfer', 'debt_payment'
- NOT NULL with index
- Backfilled based on existing data (transfers marked, others by amount sign)

### New Functions:
1. `recalculate_account_balance(account_uuid uuid)` - Recalculates account balance from opening_balance + transactions
2. `update_account_balance_on_transaction_change()` - Trigger function for transaction changes
3. `update_account_balance_on_opening_balance_change()` - Trigger function for opening_balance changes

### New Triggers:
1. `update_account_balance_trigger` on `transactions` - Fires on INSERT/UPDATE/DELETE
2. `update_balance_on_opening_balance_change` on `accounts` - Fires on UPDATE when opening_balance changes

## User Experience Flow

### Creating a Transfer
1. Click "Quick Add Transaction" button
2. Select "Transfer" transaction type
3. Select From Account (shows current balance)
4. Select To Account (shows current balance)
5. Enter amount and optional notes
6. Click "Create Transfer"
7. Both account balances update automatically

### Creating a Debt Payment
1. Click "Quick Add Transaction" button
2. Select "Payment" transaction type
3. Select From Account (typically checking)
4. Select Pay To account (only credit cards and mortgages shown)
5. Enter amount
6. Click "Submit Payment"
7. Both balances update automatically
8. Payment is tracked in analytics as "debt_payment" type

### Viewing Account Register
1. Go to Accounts page
2. Click "View Register" on any account card
3. See all transactions with running balance
4. Click any transaction to edit it
5. Changes update balances automatically
6. Close register to return to accounts

## Technical Notes

### Balance Calculation
All balance calculations happen at the database level via triggers, ensuring:
- Consistency across all views
- No race conditions
- Automatic updates without client-side logic
- Works even if transactions are created via SQL directly

### Transaction Type Logic
- Transfers create two linked transactions (withdrawal + deposit)
- Both sides get transaction_type = 'transfer' or 'debt_payment'
- Analytics filter out transfers (where transfer_id IS NOT NULL) to avoid double-counting
- Debt payments are tracked separately for debt payoff analytics

### Data Integrity
- Transfer validation trigger ensures both sides belong to same user
- Check constraint ensures valid transaction_type values
- Foreign keys maintain referential integrity
- Triggers run in transaction context for atomicity

## Files Modified
- `src/features/transactions/components/QuickAddTransaction.tsx`
- `src/features/transactions/components/PayeeSuggestionInput.tsx`
- `src/features/accounts/components/AccountCard.tsx`
- `src/features/accounts/components/AddAccountModal.tsx`
- `src/features/accounts/components/EditAccountModal.tsx`

## Files Created
- `src/features/accounts/components/AccountRegister.tsx`
- `supabase/migrations/12_add_transaction_type.sql`
- `supabase/migrations/13_auto_update_account_balances.sql`
- `supabase/migrations/14_trigger_balance_on_opening_balance_change.sql`

## Testing Recommendations
1. Create a new account with beginning balance
2. Add various transaction types (expense, income, transfer, payment)
3. Verify balances update automatically
4. Edit beginning balance and verify current balance recalculates
5. View account register and verify running balance is correct
6. Edit transactions from register and verify changes propagate
7. Test transfer between accounts and verify both sides update
8. Test debt payment to credit card and verify both balances change

## Future Enhancements
- Add keyboard shortcuts for transaction type selection (E, I, T, P keys)
- Add bulk transaction import from CSV
- Add reconciliation feature to match with bank statements
- Add scheduled/recurring transfers
- Add transfer templates for common transfer patterns
