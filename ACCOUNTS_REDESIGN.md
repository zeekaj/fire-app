# Accounts Redesign

## Overview
The Accounts view has been redesigned to prioritize individual account visibility and management, with account groups serving as a secondary organizational tool rather than the primary focus.

## Key Changes

### Before
- **Account Groups front and center** - Groups were the primary focus
- **Separate "Manage Groups" tab** - Required navigation to manage account groups
- **All accounts in one flat grid** - No meaningful grouping by financial significance

### After
- **Individual accounts are the focus** - Clear visibility of all accounts
- **Equity-based grouping** - Accounts grouped by Assets vs Liabilities
- **Net Worth summary** - Quick overview of financial position
- **Groups View as optional** - Secondary view accessible via toggle button

## New Layout

### Default View: Equity View
```
┌─────────────────────────────────────────────────┐
│ Accounts                    [Groups View] [Add] │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌───────────┐ ┌──────────┐         │
│ │ Assets  │ │Liabilities│ │Net Worth │         │
│ │ $50,000 │ │  $10,000  │ │ $40,000  │         │
│ └─────────┘ └───────────┘ └──────────┘         │
├─────────────────────────────────────────────────┤
│ Assets                             $50,000      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Checking │ │ Savings  │ │  401k    │        │
│ │ $5,000   │ │ $15,000  │ │ $30,000  │        │
│ │ [Cash]   │ │ [Savings]│ │[Retirement]       │
│ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│ Liabilities                        $10,000      │
│ ┌──────────┐                                    │
│ │ Credit   │                                    │
│ │ -$10,000 │                                    │
│ │ [Debt]   │                                    │
│ └──────────┘                                    │
└─────────────────────────────────────────────────┘
```

### Optional View: Groups View
Accessible by clicking "Groups View" button - shows accounts organized by their account group assignments.

## Features

### Equity View (Default)
✅ **Assets Section** - All accounts with positive balances
- Total assets displayed
- Green color scheme
- Account count

✅ **Liabilities Section** - All accounts with negative balances  
- Total liabilities displayed (as positive number)
- Red color scheme
- Account count

✅ **Net Worth Summary Cards**
- Assets total (green)
- Liabilities total (red)
- Net Worth calculation (blue)
- Account counts for each

### Groups View (Optional)
✅ **Group-based organization** - Accounts grouped by their account_group assignment
- Color-coded group headers
- Group totals
- Shows only groups that have accounts

### Toggle Between Views
✅ **"Groups View" / "Equity View" button** - Easy switching between organizational modes
- State preserved during session
- Visual button to indicate current view

## Technical Implementation

### Files Modified
- `src/features/accounts/components/AccountsList.tsx` - Complete rewrite
  - Added equity-based grouping logic
  - Added net worth calculations
  - Added view toggle functionality
  - Added summary cards

- `src/App.tsx` - Simplified Accounts tab
  - Removed "Manage Groups" subtab
  - Removed AccountGroupsManager import and state
  - Direct rendering of AccountsList

### Grouping Logic
```typescript
// Equity-based grouping
const assetAccounts = accounts.filter(a => a.current_balance >= 0);
const liabilityAccounts = accounts.filter(a => a.current_balance < 0);

// Totals calculation
const totalAssets = assetAccounts.reduce((sum, a) => sum + a.current_balance, 0);
const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + Math.abs(a.current_balance), 0);
const netWorth = totalAssets - totalLiabilities;
```

## Benefits

1. **Financial Clarity** - Immediately see your assets vs liabilities
2. **Net Worth Visibility** - Always visible, not buried in calculations
3. **Better Organization** - Accounts grouped by what matters (equity type)
4. **Cleaner UI** - Less navigation, more content
5. **Flexibility** - Still can view by account groups when needed

## Account Groups Still Available

Account groups haven't been removed - they're just not the primary focus:
- ✅ Still displayed on account cards as colored badges
- ✅ Still selectable when creating/editing accounts  
- ✅ Still viewable via "Groups View" toggle
- ✅ Management available through modal in AddAccountModal

Account groups now serve their intended purpose: **organizational metadata** rather than the primary navigation structure.

## Future Enhancements

Potential additions:
- [ ] Sort accounts within sections (by balance, name, etc.)
- [ ] Filter accounts (show/hide closed accounts)
- [ ] Account type icons (checking, savings, credit card, etc.)
- [ ] Quick balance update from account list
- [ ] Export accounts list
- [ ] Net worth trend graph
