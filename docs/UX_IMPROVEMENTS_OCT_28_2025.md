# UX Improvements - October 28, 2025

## Overview
Series of user experience improvements focused on liability account handling, Quick Add Transaction modal enhancements, smart notifications, and transaction filtering.

## Changes Implemented

### 1. Liability Account Fixes

#### Problem
- Credit card and mortgage accounts showed inverted charges/payments in register modal
- Database balance calculations didn't account for liability account types

#### Solution
**Files Modified:**
- `src/features/accounts/components/AccountRegister.tsx`
  - Added `isLiability` flag for credit/mortgage accounts
  - Inverted running balance calculation: `runningBalance += isLiability ? -tx.amount : tx.amount`
  - Changed column headers: "Charge" for liabilities, "Expense" for assets
  - Updated summary labels dynamically based on account type

**Database Migration:**
- `supabase/migrations/15_fix_liability_account_balances.sql`
  - Updated `recalculate_account_balance()` function to use `opening_balance - sum(amount)` for credit/mortgage
  - Updated `update_account_balance_on_opening_balance_change()` trigger similarly
  - Recalculated all existing liability balances

**Result:** Credit card charges now increase the balance, payments decrease it (matching real-world behavior).

---

### 2. Quick Add Transaction Modal - Cache Refresh

#### Problem
- "Copy Previous" and "Recent Transactions" sections didn't update immediately after creating a transaction
- Newly created transactions didn't appear in the Recent list

#### Solution
**Files Modified:**
- `src/features/transactions/hooks/useTransactions.ts`
  - Changed query ordering from `date` to `created_at DESC` (line 27)
  - Added aggressive cache management:
    - `staleTime: 0`
    - `refetchOnMount: 'always'`
    - `gcTime: 0` for limit=5 queries
  - Changed `onSuccess` to use `removeQueries` then `refetchQueries` pattern

**Result:** Most recently created transactions appear immediately in Recent list.

---

### 3. Smart Feature Notifications - Dismiss Functionality

#### Problem
- Smart notifications (duplicates, recurring, auto-categorize) couldn't be dismissed
- Notifications reappeared after every browser refresh

#### Solution
**Files Modified:**
- `src/features/transactions/components/SmartFeatures.tsx`
  - Added localStorage persistence with key `'fire-app-dismissed-smart-features'`
  - Added X dismiss button to each notification section
  - State initialized from localStorage, persisted via useEffect
  - Used Set serialization for dismissed section IDs

**Result:** Users can permanently dismiss annoying notifications.

---

### 4. Quick Add Modal - UX Cleanup

#### Changes
**Files Modified:**
- `src/features/transactions/components/QuickAddTransaction.tsx`
  - **Removed Quick Templates section** (lines 33-37, 151-166, 597-619)
    - Templates deemed useless by user
  - **Auto-focus date input** (lines 62-69)
    - 100ms delay on modal open
    - Text selected for quick replacement

**Result:** Cleaner modal interface, better keyboard workflow.

---

### 5. Active Tab Persistence

#### Problem
- Browser always returned to dashboard after refresh
- Active tab state not preserved

#### Solution
**Files Modified:**
- `src/lib/useEnhancedNavigation.ts`
  - Added localStorage persistence with key `'fire-app-active-tab'`
  - Initialize activeTab from localStorage with try/catch
  - Persist activeTab changes via useEffect

**Result:** Users stay on same page after browser refresh.

---

### 6. Custom Date Range Filter

#### Problem
- No way to filter transactions by custom date range
- Layout had two rows of filters (cluttered)

#### Solution
**Files Modified:**
- `src/features/transactions/components/TransactionsList.tsx`
  - Added `customStartDate` and `customEndDate` state (lines 30-31)
  - Updated `getDateRange()` to handle 'custom' case (lines 100-108)
    - Set end date to 23:59:59.999 of selected day (not next day midnight)
  - Restructured filter layout to single flexbox row with flex-wrap
  - Removed category filter dropdown entirely
  - Custom date inputs appear inline when "Custom Range" selected
  - Fixed date comparison bug (transaction on 9/19 showing when end date was 9/18)

**Result:** Clean single-row filter layout with powerful custom date range capability.

---

### 7. Category Input - Tab Navigation

#### Problem
- Tab key navigated through all category items in dropdown
- Couldn't quickly tab from category to amount field

#### Solution
**Files Modified:**
- `src/features/transactions/components/CategorySuggestionInput.tsx`
  - Added Tab key handling in `handleKeyDown()` to close dropdown
  - Added `tabIndex={-1}` to all category buttons in dropdown
  - Added `tabIndex={-1}` to "Create New Category" button

**Result:** Tab now moves from category input directly to amount field, closing the dropdown.

---

### 8. Category Dropdown - Visual Improvements

#### Problem
- Category group separators didn't stand out enough
- Hard to visually distinguish between groups

#### Solution
**Files Modified:**
- `src/features/transactions/components/CategorySuggestionInput.tsx`
  - Changed group header background from `bg-gray-50` to `bg-gray-100`
  - Changed border from `border-gray-200` to `border-gray-300`

**Result:** Better visual separation between category groups.

---

## Technical Details

### localStorage Keys
- `fire-app-active-tab` - Persists active navigation tab
- `fire-app-dismissed-smart-features` - Persists dismissed notification sections

### React Query Patterns
- Aggressive cache invalidation: `removeQueries()` → `refetchQueries()`
- `staleTime: 0` for immediate updates
- `refetchOnMount: 'always'` for fresh data
- `gcTime: 0` for short-lived queries (limit=5)

### Date Handling
- Custom range: `created_at DESC` ordering for chronological
- End date set to 23:59:59.999 (not next day midnight)
- Comparison: `txDate >= dateRange.start && txDate <= dateRange.end`

---

## Testing Completed

### Manual Testing
- ✅ Credit card register shows correct charge/payment behavior
- ✅ Credit card database balance matches register running balance
- ✅ Quick Add Recent list updates immediately after transaction creation
- ✅ Smart notifications dismiss and stay dismissed after refresh
- ✅ Active tab persists across browser refresh
- ✅ Quick Templates section removed from modal
- ✅ Date input auto-focuses on modal open
- ✅ Custom date range filters correctly (inclusive of both dates)
- ✅ Custom date range excludes transaction on day after end date
- ✅ Tab key moves from category to amount (skips dropdown items)
- ✅ Category group headers have better visual contrast

---

## Migration Notes

### Database Migration
**File:** `supabase/migrations/15_fix_liability_account_balances.sql`

**Applied:** Manually via Supabase dashboard SQL editor

**What it does:**
1. Updates `recalculate_account_balance()` to handle credit/mortgage types
2. Updates trigger function for opening balance changes
3. Recalculates all existing liability account balances

**Safe to re-run:** Yes, function uses `COALESCE` for null handling

---

## Files Modified Summary

1. `src/features/accounts/components/AccountRegister.tsx` - Liability display logic
2. `src/features/transactions/hooks/useTransactions.ts` - Query ordering & cache
3. `src/features/transactions/components/SmartFeatures.tsx` - Dismiss buttons
4. `src/features/transactions/components/QuickAddTransaction.tsx` - Templates removal, auto-focus
5. `src/lib/useEnhancedNavigation.ts` - Active tab persistence
6. `src/features/transactions/components/TransactionsList.tsx` - Custom date range, single-row layout
7. `src/features/transactions/components/CategorySuggestionInput.tsx` - Tab navigation, visual improvements
8. `supabase/migrations/15_fix_liability_account_balances.sql` - Database balance calculation

---

## Future Considerations

### Potential Enhancements
- Add category filter back as optional toggle or search-based filter
- Add keyboard shortcuts for common date ranges (Cmd+1 for "This Month", etc.)
- Consider adding preset custom date ranges (Last 30 days, Last Quarter, etc.)
- Add visual indicator when custom date range is active

### Performance
- Current cache strategy is aggressive for immediate UX
- Monitor query performance if transaction count grows significantly
- Consider pagination for large transaction sets

---

## Related Documentation
- [CRITICAL_BUG_FIXES_OCT_2025.md](./CRITICAL_BUG_FIXES_OCT_2025.md) - Previous bug fixes
- [USER_GUIDE.md](../USER_GUIDE.md) - User-facing documentation
- [TRANSACTION_SYSTEM_OVERHAUL.md](./TRANSACTION_SYSTEM_OVERHAUL.md) - Transaction system redesign

---

**Session Date:** October 28, 2025  
**Focus:** UX improvements and polish  
**Status:** Complete ✅
