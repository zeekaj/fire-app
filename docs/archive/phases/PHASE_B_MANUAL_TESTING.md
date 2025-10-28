# Phase B Manual Testing Guide

## Quick Start Testing

### Prerequisites
1. Development server running: `npm run dev`
2. Navigate to: http://localhost:3000
3. Log in with test credentials
4. Ensure you have at least 1 scenario created

---

## 5-Minute Smoke Test

### Step 1: Navigate to Scenarios Page
- [ ] Click on "Scenarios" in navigation
- [ ] Verify scenarios list loads
- [ ] No console errors

### Step 2: Open Scenario Detail
- [ ] Click on any scenario card
- [ ] Verify loading spinner appears with "Running Simulations..." message
- [ ] Wait for charts to load (should be < 1 second)
- [ ] No console errors

### Step 3: Verify All 4 Charts Render
- [ ] **Net Worth Projection Chart** visible
  - Line chart with blue line
  - Red vertical line at retirement age
  - 3 summary cards (Current, At Retirement, At End)
  
- [ ] **Monte Carlo Histogram** visible
  - Histogram with green/red bars
  - 5 percentile cards (10th, 25th, 50th, 75th, 90th)
  - Success rate badge
  
- [ ] **Historical Backtest Chart** visible
  - Multiple colored lines (8-10 lines)
  - Legend with scenario labels
  - Summary cards
  
- [ ] **Withdrawal Strategy Comparison** visible
  - Side-by-side bar chart (red vs green)
  - 2 comparison cards (Fixed vs Guardrails)
  - Insight box with recommendation

### Step 4: Test Interactivity
- [ ] Hover over Net Worth Projection → tooltip appears
- [ ] Hover over Monte Carlo bars → tooltip shows range
- [ ] Hover over Historical lines → tooltip shows year/value
- [ ] Hover over Withdrawal bars → tooltip shows strategy/value

### Step 5: Test Responsiveness
- [ ] Open browser DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select mobile device (iPhone, Pixel, etc.)
- [ ] Verify charts stack vertically
- [ ] Verify all text readable
- [ ] Verify no horizontal scroll

### Step 6: Test Dark Mode (if implemented)
- [ ] Toggle dark mode
- [ ] Verify charts update colors
- [ ] Verify text readable on dark background
- [ ] Toggle back to light mode

### Step 7: Test Navigation
- [ ] Click "Back" button
- [ ] Verify returns to scenarios list
- [ ] Click different scenario
- [ ] Verify new charts load with different data
- [ ] No errors

---

## Common Issues to Look For

### Visual Issues
- ❌ Charts overlapping
- ❌ Text cutoff or hidden
- ❌ Tooltips not appearing
- ❌ Colors too similar (hard to distinguish)
- ❌ Layout shift when charts load

### Functional Issues
- ❌ Charts not loading
- ❌ Loading spinner never disappears
- ❌ Wrong data displayed
- ❌ Navigation broken
- ❌ Console errors

### Performance Issues
- ❌ Loading takes > 2 seconds
- ❌ UI freezes during calculation
- ❌ Scrolling is laggy
- ❌ Memory usage increasing

---

## Expected Behavior

### Net Worth Projection
- Should show upward trend during accumulation
- Should show gradual decline during retirement
- Values should match scenario parameters

### Monte Carlo Histogram
- Should show bell-curve-like distribution
- Success rate should be reasonable (50-95% for typical scenarios)
- Percentiles should be in ascending order

### Historical Backtest
- Should show variety of outcomes (some good, some bad)
- Worst cases should be red/orange
- Best cases should be green
- ~60-80% success rate typical

### Withdrawal Strategy Comparison
- Guardrails should usually have higher success rate
- Guardrails should usually have higher median final
- Insight should make sense (recommend better strategy)

---

## Testing Different Scenarios

### Conservative Scenario
- High contributions
- Low expenses
- Long accumulation period
- **Expected**: Very high success rate (90%+)

### Moderate Scenario
- Medium contributions
- Medium expenses
- Standard timeline
- **Expected**: Good success rate (70-85%)

### Aggressive Scenario
- Low contributions
- High expenses
- Short accumulation
- **Expected**: Lower success rate (50-70%)

### Edge Case Scenario
- Already retired (current age = retirement age)
- **Expected**: Only retirement phase shown
- No accumulation phase in Net Worth chart

---

## Quick Win Checklist

If all of these pass, Phase B is ready:

- [ ] 1. All 4 charts render without errors
- [ ] 2. Loading state works (spinner → charts)
- [ ] 3. Tooltips work on all charts
- [ ] 4. Mobile responsive (no horizontal scroll)
- [ ] 5. Navigation works (scenario list ↔ detail)
- [ ] 6. No TypeScript errors (`npm run type-check`)
- [ ] 7. No console errors in browser
- [ ] 8. Charts show different data for different scenarios
- [ ] 9. Performance acceptable (< 1 second load)
- [ ] 10. Visual polish (no overlaps, good spacing, readable)

---

## Reporting Issues

### Bug Template
```
**Chart**: [Net Worth / Monte Carlo / Historical / Withdrawal]
**Issue**: [Description]
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Screenshot**: [If applicable]
**Console Errors**: [If any]
```

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Mark todo #8 complete
2. Update PHASE_B_COMPLETE.md with test results
3. Consider implementing todo #9 (Scenario Comparison View)
4. Or consider Phase B complete and move to next phase

### If Issues Found ⚠️
1. Document issues in testing checklist
2. Prioritize by severity (critical → nice-to-have)
3. Fix critical issues first
4. Re-test after fixes
5. Iterate until all critical issues resolved

---

**Happy Testing! 🎉**
