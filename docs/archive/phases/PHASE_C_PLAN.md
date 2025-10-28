# Phase C: Dashboard Enhancement & Integration

**Status**: Planning  
**Priority**: High  
**Estimated Time**: 4-6 hours  
**Goal**: Connect FIRE scenarios to dashboard with live projections and insights

---

## 🎯 Objectives

Integrate the Phase B visualization engine into the main dashboard to provide users with:
1. **Live FIRE projections** based on actual financial data
2. **Interactive scenario selection** on dashboard
3. **Quick insights** without navigating to scenario detail
4. **Actionable recommendations** based on current trajectory

---

## 🧩 Phase C Features

### Feature 1: FIRE Scenario Selector Tile ⭐
**Priority**: High  
**Effort**: 2 hours

Create a dashboard tile that lets users select their primary FIRE scenario.

**Components**:
- Dropdown to select from existing scenarios
- Display selected scenario name and key parameters
- "View Details" button to navigate to full scenario page
- "Create Scenario" quick link if none exist

**Technical**:
- New component: `FIREScenarioSelectorTile.tsx`
- Store selected scenario ID in user settings
- Query scenarios from database
- Update settings on selection change

**User Value**:
- Quick access to scenarios from dashboard
- Set primary scenario for dashboard calculations
- Easy navigation to scenario details

---

### Feature 2: Time to FI Chart Enhancement ⭐⭐
**Priority**: High  
**Effort**: 2 hours

Enhance the existing `TimeToFITile` component with:
- Mini net worth projection chart (sparkline)
- Color-coded timeline based on years to FI
- Success probability badge from Monte Carlo
- Comparison to selected scenario

**Enhancements**:
- Add mini Recharts LineChart showing trajectory
- Calculate FI date based on selected scenario
- Show "On Track" / "Behind" / "Ahead" status
- Display success probability from simulation

**Technical**:
- Reuse `createNetWorthProjection` from chartDataTransformers
- Run quick Monte Carlo (100 sims instead of 1,000)
- Integrate with selected scenario from settings
- Add tooltip showing projection details

**User Value**:
- See FIRE trajectory without leaving dashboard
- Understand if current pace is sustainable
- Quick visual feedback on progress

---

### Feature 3: Probability Curve Integration ⭐⭐
**Priority**: High  
**Effort**: 1.5 hours

Update `ProbabilityCurve.tsx` to use actual scenario data.

**Current State**: Likely using placeholder/mock data  
**Target State**: Real Monte Carlo simulation results

**Enhancements**:
- Connect to selected scenario
- Run Monte Carlo simulation (500 sims for speed)
- Display probability curve (% chance of success by retirement age)
- Show key percentiles (10th, 50th, 90th)
- Add interactive tooltip

**Technical**:
- Use existing `runMonteCarloSimulation` function
- Calculate probability distribution
- Recharts AreaChart for smooth curve
- Cache results to avoid re-calculation

**User Value**:
- Understand likelihood of reaching FI at different ages
- See impact of early vs late retirement
- Data-driven decision making

---

### Feature 4: Scenario Comparison Widget ⭐
**Priority**: Medium  
**Effort**: 2 hours

Add a new dashboard widget comparing 2-3 scenarios side-by-side.

**Features**:
- Select 2-3 scenarios to compare
- Show key metrics in table format:
  - Years to FI
  - FI Number
  - Success Rate
  - Median Final Net Worth
- Highlight "best" option for each metric
- "View Full Comparison" link to detailed page

**Technical**:
- New component: `ScenarioComparisonWidget.tsx`
- Run simulations for each selected scenario
- Responsive table with color coding
- Store comparison selection in local state

**User Value**:
- Quickly compare different strategies
- Understand tradeoffs (aggressive vs conservative)
- Make informed scenario selection

---

### Feature 5: Dashboard Insights Panel ⭐⭐⭐
**Priority**: High  
**Effort**: 2 hours

Create an insights panel that provides AI-like recommendations.

**Insights Types**:
1. **Pace Insights**:
   - "On track to reach FI by 2045"
   - "Increase savings by $200/mo to retire 2 years earlier"
   
2. **Risk Insights**:
   - "Your scenario has 85% success rate - consider guardrails withdrawal"
   - "High volatility detected - diversify or lower return expectations"

3. **Optimization Insights**:
   - "Reducing expenses by $500/mo would cut 3 years off timeline"
   - "Your savings rate is excellent (45%) - stay the course!"

4. **Action Items**:
   - "No scenarios created - create one to see projections"
   - "Your scenario is outdated - update with current net worth"

**Technical**:
- New component: `InsightsPanel.tsx`
- Calculate insights from scenario + actual data
- Prioritize top 3-5 most actionable insights
- Use icon + color coding for visual hierarchy

**User Value**:
- Actionable recommendations without analysis paralysis
- Stay motivated with positive reinforcement
- Catch issues early (outdated scenarios, high risk, etc.)

---

### Feature 6: Quick Scenario Update ⭐
**Priority**: Medium  
**Effort**: 1.5 hours

Add "Update Scenario" button to dashboard that syncs current data.

**Functionality**:
- One-click update of selected scenario
- Sync current net worth from accounts
- Keep other parameters (retirement age, expenses, etc.)
- Show before/after comparison
- Confirm before saving

**Technical**:
- Modal component: `UpdateScenarioModal.tsx`
- Calculate current net worth from accounts
- Update scenario record in database
- Trigger re-calculation of dashboard metrics

**User Value**:
- Keep scenarios in sync with reality
- Reduce manual data entry
- See impact of account balance changes

---

## 🏗️ Technical Architecture

### Data Flow
```
User Selects Scenario (Dashboard)
  ↓
Settings Updated (selected_scenario_id)
  ↓
Dashboard Queries Scenario + Accounts
  ↓
Simulations Run (Monte Carlo, Deterministic)
  ↓
Results Display (Charts, Tiles, Insights)
```

### Components Structure
```
/features/dashboard/components/
  ├── Dashboard.tsx (main layout)
  ├── FIREScenarioSelectorTile.tsx (NEW)
  ├── TimeToFITile.tsx (ENHANCED)
  ├── ProbabilityCurve.tsx (ENHANCED)
  ├── ScenarioComparisonWidget.tsx (NEW)
  ├── InsightsPanel.tsx (NEW)
  └── UpdateScenarioModal.tsx (NEW)
```

### Hooks
```
/features/dashboard/hooks/
  ├── useDashboardMetrics.ts (existing)
  ├── useSelectedScenario.ts (NEW)
  ├── useFIREProjection.ts (NEW)
  └── useDashboardInsights.ts (NEW)
```

---

## 📊 Implementation Order

### Week 1: Core Integration (High Priority)
1. **Day 1**: FIRE Scenario Selector Tile
2. **Day 2**: Time to FI Chart Enhancement
3. **Day 3**: Probability Curve Integration

### Week 2: Value-Add Features (Medium Priority)
4. **Day 4**: Dashboard Insights Panel
5. **Day 5**: Quick Scenario Update
6. **Day 6**: Scenario Comparison Widget

---

## 🎯 Success Criteria

### Functionality
- [ ] User can select primary scenario from dashboard
- [ ] Dashboard shows live FIRE projections
- [ ] Time to FI tile displays trajectory
- [ ] Probability curve uses real simulation data
- [ ] Insights panel provides 3-5 recommendations
- [ ] User can update scenario with one click

### Performance
- [ ] Dashboard loads in < 1 second
- [ ] Simulations run in < 500ms
- [ ] No UI freezing during calculations
- [ ] Smooth transitions and animations

### Quality
- [ ] Zero TypeScript errors
- [ ] All components tested
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] Error handling in place

---

## 📝 Detailed Task Breakdown

### Task 1: FIRE Scenario Selector Tile

**Subtasks**:
1. Create `FIREScenarioSelectorTile.tsx` component
2. Add `useSelectedScenario` hook
3. Query scenarios from database
4. Implement dropdown with scenario names
5. Save selection to user settings
6. Add "View Details" navigation button
7. Handle empty state (no scenarios)
8. Style and polish

**Files Created**:
- `src/features/dashboard/components/FIREScenarioSelectorTile.tsx`
- `src/features/dashboard/hooks/useSelectedScenario.ts`

**Files Modified**:
- `src/features/dashboard/components/Dashboard.tsx` (add new tile)

---

### Task 2: Time to FI Chart Enhancement

**Subtasks**:
1. Enhance `TimeToFITile.tsx` component
2. Add mini projection chart (sparkline)
3. Calculate FI date from scenario
4. Run quick Monte Carlo (100 sims)
5. Display success probability
6. Add "On Track" status indicator
7. Show comparison to goal
8. Add interactive tooltip

**Files Modified**:
- `src/features/dashboard/components/TimeToFITile.tsx`

**Dependencies**:
- Reuse: `createNetWorthProjection` from Phase B
- Reuse: `runMonteCarloSimulation` from Phase B

---

### Task 3: Probability Curve Integration

**Subtasks**:
1. Update `ProbabilityCurve.tsx` component
2. Connect to selected scenario
3. Run Monte Carlo simulation (500 sims)
4. Calculate probability distribution
5. Create smooth curve with Recharts
6. Add percentile markers
7. Display tooltip with details
8. Cache results for performance

**Files Modified**:
- `src/features/dashboard/components/ProbabilityCurve.tsx`
- `src/features/dashboard/hooks/useDashboardMetrics.ts`

---

### Task 4: Dashboard Insights Panel

**Subtasks**:
1. Create `InsightsPanel.tsx` component
2. Create `useDashboardInsights.ts` hook
3. Implement insight calculation logic:
   - Pace insights (on track vs behind)
   - Risk insights (success rate analysis)
   - Optimization insights (what-if scenarios)
   - Action items (setup tasks)
4. Prioritize top insights
5. Design insight cards with icons
6. Add dismiss functionality
7. Style and polish

**Files Created**:
- `src/features/dashboard/components/InsightsPanel.tsx`
- `src/features/dashboard/hooks/useDashboardInsights.ts`

**Files Modified**:
- `src/features/dashboard/components/Dashboard.tsx` (add panel)

---

### Task 5: Quick Scenario Update

**Subtasks**:
1. Create `UpdateScenarioModal.tsx` component
2. Calculate current net worth from accounts
3. Show before/after comparison
4. Implement update logic
5. Add confirmation step
6. Handle errors gracefully
7. Trigger dashboard refresh
8. Add success notification

**Files Created**:
- `src/features/dashboard/components/UpdateScenarioModal.tsx`

**Files Modified**:
- `src/features/dashboard/components/FIREScenarioSelectorTile.tsx` (add button)

---

### Task 6: Scenario Comparison Widget

**Subtasks**:
1. Create `ScenarioComparisonWidget.tsx` component
2. Add multi-select for scenarios
3. Run simulations for each scenario
4. Build comparison table
5. Highlight best options
6. Add "View Full" navigation
7. Make responsive
8. Style and polish

**Files Created**:
- `src/features/dashboard/components/ScenarioComparisonWidget.tsx`

**Files Modified**:
- `src/features/dashboard/components/Dashboard.tsx` (add widget)

---

## 🧪 Testing Plan

### Unit Tests
- [ ] Scenario selector handles empty state
- [ ] Insights calculation logic correct
- [ ] Scenario update calculates correctly
- [ ] Comparison widget handles 1-3 scenarios

### Integration Tests
- [ ] Dashboard loads with selected scenario
- [ ] Simulations run and display results
- [ ] Settings persist scenario selection
- [ ] Navigation to scenario detail works

### Manual Tests
- [ ] All tiles render correctly
- [ ] Charts display properly
- [ ] Insights are relevant and helpful
- [ ] Mobile responsive
- [ ] Dark mode works

---

## 📚 Documentation

### User Documentation
- [ ] Dashboard overview guide
- [ ] How to select and manage scenarios
- [ ] Understanding insights and recommendations
- [ ] Interpreting dashboard charts

### Technical Documentation
- [ ] Phase C implementation summary
- [ ] Component API documentation
- [ ] Hook usage examples
- [ ] Integration guide for future features

---

## 🎁 Bonus Features (If Time Permits)

### Bonus 1: Goal Setting
- Set custom FI goals (age, net worth target)
- Track progress to custom goals
- Celebrate milestones

### Bonus 2: Historical Performance
- Show actual net worth growth over time
- Compare to projected trajectory
- "You're ahead by $X" messaging

### Bonus 3: Alerts & Notifications
- Alert when falling behind target
- Notify when scenario outdated (> 30 days)
- Celebrate when ahead of schedule

---

## 🚀 Getting Started

Ready to start Phase C? Let's begin with:

**Step 1**: FIRE Scenario Selector Tile  
**Why**: Foundation for all other features (need to select scenario first)  
**Time**: ~2 hours  
**Impact**: Enables all subsequent dashboard enhancements

**Command to start**:
```
Say "start phase c" and I'll begin with the scenario selector!
```

---

## 📋 Phase C Summary

**Total Tasks**: 6 core features  
**Estimated Time**: 12-15 hours  
**Dependencies**: Phase B complete ✅  
**Risk Level**: Low (building on proven Phase B foundation)  
**User Impact**: High (daily-use dashboard becomes much more powerful)

**When Complete, Users Will Have**:
- 🎯 Scenario-driven dashboard
- 📊 Live FIRE projections
- 💡 Actionable insights
- ⚡ Quick scenario management
- 📈 Visual progress tracking
- 🔄 Always up-to-date forecasts

---

**Ready to transform the dashboard? Let's build Phase C!** 🚀
