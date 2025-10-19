# Phase C Task #1: Testing Checklist

**Date**: October 19, 2025  
**Feature**: FIRE Scenario Selector Tile  
**Status**: Ready for Testing ✅

---

## Pre-Test Verification

- [x] SQL migration run (selected_scenario_id column added to settings)
- [x] Dev server running
- [x] Router error fixed (using tab navigation instead)
- [x] No TypeScript compilation errors

---

## Test Checklist

### 1. Basic Rendering
- [ ] Navigate to Dashboard tab
- [ ] FIRE Scenario Selector tile appears at the top
- [ ] No console errors

### 2. Empty State (if no scenarios exist)
- [ ] Tile shows "No scenarios yet" message
- [ ] "Create Your First Scenario" button is visible
- [ ] Clicking button switches to Scenarios tab

### 3. Scenario Selection (if scenarios exist)
- [ ] Dropdown shows "Select a scenario..." or current selection
- [ ] Clicking dropdown opens list of scenarios
- [ ] Each scenario shows name and retirement info (age → age)
- [ ] Selected scenario has checkmark icon
- [ ] Clicking a scenario updates the selection
- [ ] Dropdown closes after selection

### 4. Scenario Display
- [ ] Selected scenario's name shows in dropdown
- [ ] Info box shows:
  - Current Age
  - Retirement Age
  - Expected Return (as percentage)
  - Inflation (as percentage)
- [ ] All values display correctly

### 5. Navigation Buttons
- [ ] "View Details" button visible when scenario selected
- [ ] Clicking "View Details" switches to Scenarios tab
- [ ] "Manage Scenarios" button visible
- [ ] Clicking "Manage Scenarios" switches to Scenarios tab

### 6. Data Persistence
- [ ] Select a scenario
- [ ] Refresh the browser
- [ ] Same scenario is still selected
- [ ] Selection persists across sessions

### 7. Loading States
- [ ] Shows skeleton/loading state while fetching
- [ ] Smooth transition to loaded state
- [ ] No flickering

### 8. Error Handling
- [ ] No console errors when selecting scenarios
- [ ] No errors when switching between scenarios
- [ ] Graceful handling if selected scenario is deleted

---

## Expected Behavior

### When You Have Scenarios
1. **Dropdown** shows current selection or "Select a scenario..."
2. **Click dropdown** → See list of all your scenarios
3. **Click a scenario** → Updates selection immediately
4. **Info box** updates to show selected scenario's parameters
5. **Click "View Details"** → Switches to Scenarios tab
6. **Selection persists** after page refresh

### When You Have No Scenarios
1. **Empty state** message displayed
2. **"Create Your First Scenario"** button prominent
3. **Click button** → Switches to Scenarios tab
4. **After creating** → Return to dashboard to see new scenario

---

## Known Limitations

1. **No scenario detail view** - "View Details" just goes to Scenarios tab (full list)
   - TODO: Future enhancement to show specific scenario detail
   
2. **Database types outdated** - Using `@ts-ignore` for new fields
   - TODO: Run `npm run supabase:types:remote` to regenerate types

---

## Next Steps After Testing

### If All Tests Pass ✅
- Mark task #1 as complete
- Move to task #2: Enhance Time to FI Tile
- Consider regenerating database types

### If Issues Found ⚠️
- Document issues below
- Fix critical bugs
- Re-test

---

## Issues Found

### Issue 1:
**Description**: 

**Severity**: Critical / Major / Minor

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 

**Actual**: 

---

## Testing Notes

**Tested By**: ___________  
**Date/Time**: ___________  
**Browser**: ___________  
**Result**: ✅ Pass / ⚠️ Pass with issues / ❌ Fail

**Comments**:
