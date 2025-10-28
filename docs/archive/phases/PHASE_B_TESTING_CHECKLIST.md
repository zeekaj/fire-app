# Phase B Testing Checklist

**Date**: October 19, 2025  
**Version**: 1.0.0  
**Status**: Ready for Testing

---

## Overview

This checklist ensures all Phase B visualization features work correctly across different scenarios, devices, and edge cases.

---

## Pre-Testing Setup

### Environment Check
- [ ] Development server running (`npm run dev`)
- [ ] Database connection active (Supabase)
- [ ] User authenticated
- [ ] At least 2-3 test scenarios created

### Browser Testing
- [ ] Chrome/Edge (primary)
- [ ] Firefox (secondary)
- [ ] Safari (if available)

---

## Feature Testing

### 1. Net Worth Projection Chart

**Basic Functionality**
- [ ] Chart renders without errors
- [ ] Line shows accumulation phase (upward trend)
- [ ] Line shows retirement phase (withdrawals)
- [ ] Retirement age reference line appears
- [ ] X-axis shows ages correctly
- [ ] Y-axis shows currency values formatted

**Interactive Elements**
- [ ] Hover tooltip works
- [ ] Tooltip shows age and net worth
- [ ] Tooltip follows cursor
- [ ] Tooltip disappears on mouse out

**Summary Cards**
- [ ] "Current Net Worth" card shows correct value
- [ ] "At Retirement" card shows projected value
- [ ] "At End" card shows final value
- [ ] All values formatted as currency

**Data Accuracy**
- [ ] Uses scenario's expected_return_mean (not hard-coded)
- [ ] Uses scenario's inflation_rate (not hard-coded)
- [ ] Description shows actual rates
- [ ] Calculations appear reasonable

**Edge Cases**
- [ ] Works with very small initial portfolio ($1,000)
- [ ] Works with very large portfolio ($10M+)
- [ ] Works with high contribution rates
- [ ] Works with zero contributions
- [ ] Works with short time horizon (10 years)
- [ ] Works with long time horizon (50 years)

---

### 2. Monte Carlo Histogram

**Basic Functionality**
- [ ] Histogram renders without errors
- [ ] Shows ~25 bins
- [ ] Bars colored correctly (green/red based on success)
- [ ] X-axis shows portfolio values
- [ ] Y-axis shows frequency counts
- [ ] Legend displays

**Percentile Cards**
- [ ] 10th percentile card shows value
- [ ] 25th percentile card shows value
- [ ] 50th (median) percentile card shows value
- [ ] 75th percentile card shows value
- [ ] 90th percentile card shows value
- [ ] All values formatted as currency

**Success Rate**
- [ ] Success rate percentage displays
- [ ] Risk assessment shows (Excellent/Moderate/High Risk)
- [ ] Color coding matches risk level
- [ ] Success rate appears reasonable (0-100%)

**Interactive Elements**
- [ ] Hover tooltip works on bars
- [ ] Tooltip shows portfolio range
- [ ] Tooltip shows frequency count
- [ ] Tooltip shows success/failure status

**Data Accuracy**
- [ ] Runs 1,000 simulations
- [ ] Distribution looks bell-curved (mostly)
- [ ] Success rate matches visual distribution
- [ ] Percentiles in correct order (10th < 25th < 50th < 75th < 90th)

**Edge Cases**
- [ ] Works with guaranteed success scenario (100% success rate)
- [ ] Works with guaranteed failure scenario (0% success rate)
- [ ] Works with high volatility (stdev = 0.20+)
- [ ] Works with low volatility (stdev = 0.05)

---

### 3. Historical Backtest Chart

**Basic Functionality**
- [ ] Chart renders without errors
- [ ] Shows 8-10 historical scenario lines
- [ ] Lines colored by outcome quality
- [ ] X-axis shows years into retirement
- [ ] Y-axis shows portfolio values
- [ ] Legend displays with scenario labels

**Line Selection**
- [ ] Shows worst-case scenario (red)
- [ ] Shows 10th percentile scenario (orange)
- [ ] Shows median scenario (blue)
- [ ] Shows 90th percentile scenario (light green)
- [ ] Shows best-case scenario (dark green)
- [ ] Shows 3-5 random additional scenarios
- [ ] Key lines are thicker

**Interactive Elements**
- [ ] Hover tooltip works
- [ ] Tooltip shows year and portfolio value
- [ ] Tooltip shows which scenario line
- [ ] Legend items can toggle lines (if enabled)

**Summary Cards**
- [ ] Shows total scenarios run (100)
- [ ] Shows success rate percentage
- [ ] Shows historical context
- [ ] Context mentions relevant crashes (1929, 2008, etc.)

**Data Accuracy**
- [ ] Uses SAMPLE_HISTORICAL_DATA (1926-2023)
- [ ] Lines show realistic volatility
- [ ] Some scenarios fail (hit zero)
- [ ] Some scenarios succeed (stay positive)
- [ ] Median outcome appears reasonable

**Edge Cases**
- [ ] Works with short retirement (10 years)
- [ ] Works with long retirement (40 years)
- [ ] Works with high withdrawal rate (failure-prone)
- [ ] Works with low withdrawal rate (success-likely)

---

### 4. Withdrawal Strategy Comparison

**Basic Functionality**
- [ ] Chart renders without errors
- [ ] Shows side-by-side bar chart
- [ ] Three metrics displayed (Success Rate, Median Final, 10th Percentile)
- [ ] Fixed strategy bars (red) visible
- [ ] Guardrails strategy bars (green) visible
- [ ] X-axis labels clear
- [ ] Y-axis values formatted correctly

**Comparison Cards**
- [ ] Fixed strategy card displays (red border)
- [ ] Guardrails strategy card displays (green border)
- [ ] Both show success rate
- [ ] Both show median final value
- [ ] Both show 10th percentile value
- [ ] Both show 90th percentile value
- [ ] Both show average final value
- [ ] All values formatted as currency or percentage

**Insight Box**
- [ ] Insight box displays
- [ ] Shows which strategy performs better
- [ ] Shows success rate difference
- [ ] Shows median difference
- [ ] Message makes sense contextually
- [ ] Recommends guardrails when it performs better

**Interactive Elements**
- [ ] Hover tooltip works on bars
- [ ] Tooltip shows strategy name
- [ ] Tooltip shows value
- [ ] Tooltip formatted correctly (% or $)

**Data Accuracy**
- [ ] Guardrails typically has higher success rate
- [ ] Guardrails typically has higher median final
- [ ] Both run 1,000 simulations each
- [ ] Success rate difference is reasonable (0-20%)
- [ ] Both strategies use same initial conditions

**Edge Cases**
- [ ] Works when fixed performs better (rare)
- [ ] Works when both strategies fail equally
- [ ] Works with very conservative scenarios (both succeed)
- [ ] Works with very aggressive scenarios (both fail)

---

## Integration Testing

### Scenario Detail Page

**Navigation**
- [ ] Can click scenario card to open detail
- [ ] Back button returns to scenario list
- [ ] Detail page shows scenario name
- [ ] Edit/Delete buttons work

**Loading State**
- [ ] Loading spinner appears immediately
- [ ] Message says "Running Simulations..."
- [ ] Message says "Analyzing 2,100+ scenarios"
- [ ] Charts don't appear until loaded
- [ ] No layout shift when charts appear
- [ ] Loading time is reasonable (< 1 second)

**Chart Order**
- [ ] Net Worth Projection appears first
- [ ] Monte Carlo Histogram appears second
- [ ] Historical Backtest appears third
- [ ] Withdrawal Strategy Comparison appears fourth
- [ ] Scenario Parameters section appears last

**Error Boundaries**
- [ ] Each chart wrapped in error boundary
- [ ] If one chart errors, others still work
- [ ] Error UI is user-friendly
- [ ] Error details expandable
- [ ] Can recover from error

**Responsive Layout**
- [ ] All 4 charts visible on desktop
- [ ] Charts stack vertically on mobile
- [ ] No horizontal scrolling
- [ ] All text readable on small screens
- [ ] Padding adjusts for screen size

---

## Cross-Browser Testing

### Chrome/Edge
- [ ] All charts render
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Tooltips work
- [ ] Responsive design works

### Firefox
- [ ] All charts render
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Tooltips work
- [ ] Responsive design works

### Safari (if available)
- [ ] All charts render
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Tooltips work
- [ ] Responsive design works

---

## Performance Testing

**Simulation Speed**
- [ ] 1,000 Monte Carlo runs < 200ms
- [ ] 100 Historical runs < 100ms
- [ ] 2,000 Withdrawal comparison runs < 400ms
- [ ] Total loading time < 1 second
- [ ] No UI freezing during calculations

**Render Speed**
- [ ] Charts appear instantly after data ready
- [ ] No lag when scrolling
- [ ] Tooltips respond immediately
- [ ] Smooth animations (if any)

**Memory Usage**
- [ ] No memory leaks on navigation
- [ ] Can switch between scenarios without slowdown
- [ ] Browser doesn't slow down over time

---

## Accessibility Testing

**Keyboard Navigation**
- [ ] Can tab through interactive elements
- [ ] Focus indicators visible
- [ ] Can activate buttons with Enter/Space

**Screen Readers** (if available)
- [ ] Chart titles announced
- [ ] Summary statistics announced
- [ ] Error messages announced

**Color Contrast**
- [ ] Text readable in light mode
- [ ] Text readable in dark mode
- [ ] Color-blind friendly (not relying solely on color)

**Visual Design**
- [ ] Consistent spacing
- [ ] Aligned elements
- [ ] No overlapping text
- [ ] Professional appearance

---

## Dark Mode Testing

**Theme Switching**
- [ ] Charts respect dark mode
- [ ] Background colors appropriate
- [ ] Text colors readable
- [ ] Grid lines visible but subtle
- [ ] Tooltips themed correctly

**Color Palette**
- [ ] Success colors work in both modes
- [ ] Warning/error colors work in both modes
- [ ] Neutral colors work in both modes

---

## Edge Case Testing

### Data Edge Cases
- [ ] $0 initial portfolio
- [ ] $0 annual contributions
- [ ] $0 annual expenses
- [ ] Negative expected return
- [ ] 0% inflation
- [ ] 10%+ inflation
- [ ] Very short retirement (1 year)
- [ ] Very long retirement (60 years)

### Scenario Edge Cases
- [ ] Already retired (current age = retirement age)
- [ ] Never retiring (retirement age > life expectancy)
- [ ] Young age (18 years old)
- [ ] Old age (80+ years old)

### Error Cases
- [ ] Missing scenario data (should not crash)
- [ ] Invalid simulation results (error boundary catches)
- [ ] Network errors during load (graceful fallback)

---

## Regression Testing

**Previously Fixed Issues**
- [ ] Hard-coded rates not used (uses scenario values)
- [ ] Retirement inflation calculated correctly
- [ ] Scenario click navigation works
- [ ] Delete button doesn't trigger navigation
- [ ] Nullable balances handled

**Type Safety**
- [ ] Zero TypeScript compilation errors
- [ ] All props properly typed
- [ ] No `any` types used unnecessarily

---

## Final Checks

**Code Quality**
- [ ] No console warnings in production mode
- [ ] No unused imports
- [ ] No commented-out code
- [ ] Consistent formatting
- [ ] JSDoc comments present

**Documentation**
- [ ] README updated (if needed)
- [ ] PHASE_B_COMPLETE.md accurate
- [ ] PHASE_B_WITHDRAWAL_STRATEGY.md complete
- [ ] Inline comments clear

**Git Status**
- [ ] All changes committed
- [ ] Commit messages descriptive
- [ ] No merge conflicts
- [ ] Branch up to date

---

## Test Results Summary

### Passed: _____ / _____
### Failed: _____ / _____
### Blocked: _____ / _____

### Critical Issues Found:
1. 
2. 
3. 

### Non-Critical Issues Found:
1. 
2. 
3. 

### Notes:


---

**Tested By**: _________________  
**Date**: _________________  
**Sign-Off**: ✅ Ready for Production / ⚠️ Needs Fixes / ❌ Not Ready
