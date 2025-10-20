# Account Groups - Complete Guide

## Overview

Account Groups is a flexible system that allows you to organize individual accounts (e.g., "Chase Sapphire", "Wells Fargo Checking") into custom categories (e.g., "Credit Card", "Checking"). This replaces the old hardcoded account types with a user-customizable grouping system.

### Key Benefits
- ✅ Create custom account groups with your own names and colors
- ✅ Multiple accounts can belong to the same group
- ✅ Easily change an account's group at any time
- ✅ Color-coded visual organization
- ✅ System-provided default groups for quick start

---

## Quick Start

### For New Users
When you first log in, the app automatically creates 9 default account groups:
1. **Checking** (Blue #2E86AB)
2. **Savings** (Green #10B981)
3. **Credit Card** (Orange #F59E0B)
4. **Investment** (Purple #8B5CF6)
5. **Retirement** (Teal #14B8A6)
6. **HSA** (Cyan #06B6D4)
7. **Mortgage** (Red #EF4444)
8. **Cash** (Gray #6B7280)
9. **Asset** (Indigo #6366F1)

Each default group also creates a matching account to get you started.

### For Existing Users
If you had accounts before the Account Groups feature was added, a migration automatically:
- Creates account groups based on your existing account types
- Links your existing accounts to the appropriate groups
- Preserves all your data without any loss

---

## Features

### 1. Managing Account Groups

**Navigate to:** Main app → "Manage Groups" tab

#### Create a New Group
1. Click "Create New Group"
2. Enter a group name
3. Choose a color from 12 presets
4. Click "Create Group"

#### Edit an Existing Group
1. Find the group in the list
2. Click the "Edit" button
3. Modify the name or color
4. Changes save automatically

#### Delete a Custom Group
1. Click the "Delete" button next to the group
2. Confirm the deletion
3. ⚠️ **Note:** System groups (created by default) cannot be deleted

### 2. Managing Accounts

**Navigate to:** Main app → "Account Groups" tab

#### Create a New Account
1. Click "+ Add Account"
2. Enter account name
3. Select an account group from dropdown
4. (Optional) Create a new group inline
5. Enter opening balance
6. Click "Create Account"

#### Edit an Account
1. Click "Edit" on any account card
2. Update name, group, or balance
3. Click "Save Changes"

#### Change an Account's Group
1. Click "Edit" on the account
2. Select different group from dropdown
3. Click "Save Changes"

#### Delete an Account
1. Click "Edit" on the account
2. Click "Delete Account"
3. Confirm deletion
4. ⚠️ **Warning:** This cannot be undone

---

## Testing Guide

### Manual Testing Checklist

#### ✅ Account Groups Management
- [ ] Navigate to "Manage Groups" tab
- [ ] Verify all default groups are visible with correct colors
- [ ] Create a new custom group
- [ ] Edit a custom group's name and color
- [ ] Try to delete a system group (should be prevented)
- [ ] Delete a custom group

#### ✅ Account Management
- [ ] Navigate to "Account Groups" tab
- [ ] View all accounts organized by group with colored badges
- [ ] Create a new account and assign it to a group
- [ ] Create a new account with inline group creation
- [ ] Edit an existing account
- [ ] Change an account's group
- [ ] Update an account's balance
- [ ] Delete an account

#### ✅ Visual & UX
- [ ] Verify account cards show group badges with correct colors
- [ ] Verify color picker shows all 12 preset colors
- [ ] Verify responsive layout (mobile, tablet, desktop)
- [ ] Test keyboard navigation
- [ ] Test form validation (empty names, etc.)

#### ✅ Data Persistence
- [ ] Create account group → Refresh page → Verify it persists
- [ ] Update account group → Refresh → Verify changes saved
- [ ] Move account to different group → Refresh → Verify new group
- [ ] Check database directly in Supabase dashboard

### Expected Behavior

**Account Groups Display:**
- Accounts shown as tiles in a responsive grid
- Each account card shows:
  - Account name
  - Group name in a colored badge
  - Current balance
  - Edit button

**Color System:**
- 12 preset colors available
- Colors shown as large clickable squares in color picker
- Selected color highlighted with checkmark
- Badge background uses color with 15% opacity
- Badge border uses color with 40% opacity
- Badge text uses full color

**Error Handling:**
- Cannot delete system groups (prevented by RLS)
- Cannot create groups with duplicate names
- Form validation for empty fields
- User-friendly error messages

---

## Architecture

### Database Schema

#### `account_groups` Table
```sql
create table public.account_groups (
  id uuid primary key,
  created_by uuid references users(id),
  name text unique,
  icon text,
  color text,
  sort_order integer,
  is_system boolean,
  created_at timestamptz
);
```

#### `accounts` Table (Updated)
```sql
create table public.accounts (
  id uuid primary key,
  created_by uuid references users(id),
  name text,
  type text, -- Deprecated: kept for backward compatibility
  account_group_id uuid references account_groups(id),
  opening_balance numeric(14,2),
  current_balance numeric(14,2),
  ...
);
```

### Key Files

**Hooks:**
- `src/features/accounts/hooks/useAccountGroups.ts` - Fetch all account groups
- `src/features/accounts/hooks/useAccountGroupMutations.ts` - Create/update/delete groups
- `src/features/accounts/hooks/useAccounts.ts` - Fetch accounts with joined group data
- `src/features/accounts/hooks/useAccountMutations.ts` - Create/update/delete accounts

**Components:**
- `src/features/accounts/components/AccountsList.tsx` - Main accounts view with tile grid
- `src/features/accounts/components/AccountCard.tsx` - Individual account tile with colored badge
- `src/features/accounts/components/AccountGroupsManager.tsx` - Full CRUD for account groups
- `src/features/accounts/components/AddAccountModal.tsx` - Create new accounts
- `src/features/accounts/components/EditAccountModal.tsx` - Edit/delete accounts

**Setup:**
- `src/lib/first-login-setup.ts` - Creates default groups for new users

**Types:**
- `src/lib/database.types.ts` - TypeScript types for all database tables

### Row-Level Security (RLS)

All account groups operations are protected by RLS policies:
- Users can only view their own account groups
- Users can only create/update their own groups
- System groups cannot be deleted (enforced by policy)
- All queries automatically filtered by `created_by = auth.uid()`

---

## Migration Details

### What Changed?

**Before:**
- Accounts had a hardcoded `type` field
- Types were limited to: checking, savings, credit, investment, etc.
- No customization possible
- No visual grouping

**After:**
- Accounts link to `account_groups` via `account_group_id`
- Users can create custom groups with any name
- Each group has a customizable color
- Visual organization with colored badges
- The `type` field is kept for backward compatibility but deprecated

### Migration Process

The migration (`02_account_groups.sql`) automatically:
1. Creates the `account_groups` table
2. Adds `account_group_id` column to `accounts`
3. For each user, creates account groups from their existing account types
4. Links all existing accounts to the appropriate groups
5. Sets up RLS policies

**No data is lost** - all existing accounts are preserved and linked to their new groups.

### Backward Compatibility

The `type` field remains in the accounts table marked as deprecated. This ensures:
- Existing code that references `type` continues to work
- Gradual migration of codebase to use `account_group_id`
- Rollback capability if needed

---

## Troubleshooting

### Common Issues

**Q: I don't see any account groups**
- Check that you're logged in
- Verify the migration was applied (check Supabase dashboard)
- Try logging out and back in to trigger first-login setup

**Q: Can't delete an account group**
- System groups (is_system=true) cannot be deleted
- Custom groups with linked accounts may require moving accounts first
- Check browser console for specific error messages

**Q: Colors not showing correctly**
- Verify the color format is hex (e.g., #2E86AB)
- Check that Tailwind CSS is processing the inline styles
- Clear browser cache

**Q: Account group changes not persisting**
- Check network tab for failed API calls
- Verify RLS policies in Supabase dashboard
- Check authentication status

### Debug Checklist

1. **Check Authentication:** Verify `auth.uid()` returns valid ID
2. **Check Database:** Query `account_groups` table directly in Supabase
3. **Check RLS:** Temporarily disable RLS to test if it's a permissions issue
4. **Check Console:** Look for errors in browser developer console
5. **Check Network:** Verify API calls are succeeding (200 status)

---

## Future Enhancements

Potential improvements for the Account Groups feature:

- [ ] Drag-and-drop reordering of groups
- [ ] Import/export group configurations
- [ ] Group-level budgets or spending limits
- [ ] Group-level reports and analytics
- [ ] Custom icons for groups (beyond preset options)
- [ ] Nested groups (sub-groups)
- [ ] Bulk operations (move multiple accounts at once)
- [ ] Group templates (recommended setups for different user types)

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Check Supabase logs in dashboard
4. Verify database schema matches expected structure
5. Test with a fresh user account to isolate issues

---

**Last Updated:** October 19, 2025  
**Version:** 2.0 (After Account Groups Migration)
