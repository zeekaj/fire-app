# Phase B: Advanced Visualizations - Implementation Plan

## Overview
Build interactive charts and visualizations to help users understand their FIRE projections and scenario outcomes.

---

## 🎯 Goals

1. **Visual Net Worth Projections** - Line charts showing portfolio growth over time
2. **Monte Carlo Distribution** - Histogram showing probability distribution of outcomes
3. **Historical Backtest Comparison** - Compare scenario against historical market periods
4. **Success Probability Curves** - Visual representation of retirement success rates
5. **Withdrawal Strategy Comparison** - Side-by-side comparison of different strategies

---

## 📊 Features to Build

### 1. Net Worth Projection Chart
**Component**: `NetWorthChart.tsx`

**What it shows**:
- Line chart of portfolio value from now to death
- Accumulation phase (before retirement)
- Withdrawal phase (after retirement)
- Multiple scenarios overlaid (if comparing)

**Technologies**:
- Recharts (React charting library)
- Data from deterministic projection

**Key Features**:
- Zoom/pan capabilities
- Hover tooltips showing exact values
- Toggle between nominal and inflation-adjusted
- Highlight retirement date

---

### 2. Monte Carlo Distribution Chart
**Component**: `MonteCarloHistogram.tsx`

**What it shows**:
- Histogram of final portfolio values
- Success/failure threshold line
- Percentile markers (10th, 50th, 90th)
- Success rate percentage

**Technologies**:
- Recharts (bar chart)
- Data from Monte Carlo simulation results

**Key Features**:
- Color-coded (green = success, red = failure)
- Interactive tooltips
- Adjustable bin sizes
- Export data capability

---

### 3. Historical Backtest Timeline
**Component**: `HistoricalBacktestChart.tsx`

**What it shows**:
- Multiple lines, each representing a different historical start year
- Shows which historical periods would have succeeded/failed
- Overlay actual market returns

**Technologies**:
- Recharts (multi-line chart)
- Historical Shiller data

**Key Features**:
- Filter by decade
- Highlight worst/best periods
- Compare against current scenario
- Show market crashes/booms

---

### 4. Success Probability Heatmap
**Component**: `SuccessProbabilityHeatmap.tsx`

**What it shows**:
- Heatmap of success rates across different:
  - Withdrawal rates (3%, 3.5%, 4%, 4.5%, 5%)
  - Retirement durations (20, 25, 30, 35, 40 years)
  - Stock allocations (40%, 50%, 60%, 70%, 80%)

**Technologies**:
- Recharts or custom D3.js
- Calculate permutations on demand

**Key Features**:
- Interactive cells
- Color gradient (red → yellow → green)
- Click to apply settings to scenario
- Export as image

---

### 5. Withdrawal Strategy Comparison
**Component**: `WithdrawalStrategyChart.tsx`

**What it shows**:
- Three lines showing portfolio over time for:
  1. Fixed withdrawal
  2. Percentage-based
  3. Guardrails
- Highlight differences in outcomes

**Technologies**:
- Recharts (multi-line)
- Run simulations for all three strategies

**Key Features**:
- Toggle strategies on/off
- Show annual withdrawal amounts
- Highlight adjustments (for guardrails)
- Compare success rates

---

### 6. Scenario Comparison Dashboard
**Component**: `ScenarioComparisonView.tsx`

**What it shows**:
- Side-by-side comparison of 2-4 scenarios
- Key metrics in table format
- Mini charts for each scenario
- Highlight differences

**Technologies**:
- Grid layout with Tailwind
- Reuse existing chart components

**Key Features**:
- Select scenarios to compare
- Color-coded differences
- Quick "copy scenario" button
- Export comparison report

---

## 📁 File Structure

```
src/
├── features/
│   └── scenarios/
│       ├── components/
│       │   ├── charts/                    ← New folder
│       │   │   ├── NetWorthChart.tsx
│       │   │   ├── MonteCarloHistogram.tsx
│       │   │   ├── HistoricalBacktestChart.tsx
│       │   │   ├── SuccessProbabilityHeatmap.tsx
│       │   │   ├── WithdrawalStrategyChart.tsx
│       │   │   └── index.ts
│       │   ├── ScenarioDetailPage.tsx     ← New
│       │   ├── ScenarioComparisonView.tsx ← New
│       │   └── [existing files...]
│       └── [existing folders...]
└── lib/
    └── sim/
        └── chartDataTransformers.ts       ← New utility
```

---

## 🛠️ Dependencies to Add

```json
{
  "recharts": "^2.10.3",           // React charting library
  "date-fns": "^3.0.6",            // Date formatting
  "lodash": "^4.17.21",            // Data manipulation
  "@types/lodash": "^4.14.202"     // TypeScript types
}
```

---

## 🎨 Design Specifications

### Color Palette
- **Success**: `#10b981` (green-500)
- **Warning**: `#f59e0b` (amber-500)
- **Failure**: `#ef4444` (red-500)
- **Primary Line**: `#3b82f6` (blue-500)
- **Secondary Line**: `#8b5cf6` (purple-500)
- **Grid**: `#e5e7eb` (gray-200)

### Chart Dimensions
- **Desktop**: 800x400px
- **Mobile**: 100% width, 300px height
- **Dashboard widgets**: 400x250px

### Typography
- **Chart Title**: text-xl font-semibold
- **Axis Labels**: text-sm text-gray-600
- **Tooltips**: text-xs bg-white shadow-lg
- **Legend**: text-sm text-gray-700

---

## 📝 Implementation Order

### Sprint 1: Foundation (2-3 hours)
1. ✅ Install dependencies
2. ✅ Create chart data transformer utilities
3. ✅ Create base chart wrapper component
4. ✅ Set up routing for scenario detail page

### Sprint 2: Core Charts (3-4 hours)
5. ✅ Build Net Worth Projection Chart
6. ✅ Build Monte Carlo Histogram
7. ✅ Create ScenarioDetailPage with both charts
8. ✅ Add responsive design

### Sprint 3: Advanced Charts (3-4 hours)
9. ✅ Build Historical Backtest Chart
10. ✅ Build Withdrawal Strategy Comparison
11. ✅ Add interactive features (zoom, pan, tooltips)
12. ✅ Test with real data

### Sprint 4: Comparison Features (2-3 hours)
13. ✅ Build Success Probability Heatmap
14. ✅ Create Scenario Comparison View
15. ✅ Add export capabilities
16. ✅ Polish UI/UX

### Sprint 5: Integration & Testing (1-2 hours)
17. ✅ Integrate all charts into existing pages
18. ✅ Add loading states and error handling
19. ✅ Write documentation
20. ✅ Performance optimization

**Total Estimated Time**: 11-16 hours

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] Users can see visual net worth projections
- [ ] Users can view Monte Carlo distribution
- [ ] Users can compare historical periods
- [ ] Users can compare different scenarios
- [ ] All charts are interactive (hover, zoom)
- [ ] Charts are responsive (mobile-friendly)

### Technical Requirements
- [ ] 0 TypeScript errors
- [ ] Charts load in <500ms
- [ ] Smooth animations (60fps)
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Print-friendly

### UX Requirements
- [ ] Intuitive tooltips
- [ ] Clear legends and labels
- [ ] Color-blind friendly palette
- [ ] Export functionality
- [ ] Help text explaining each chart

---

## 🔍 Technical Challenges

### Challenge 1: Performance with Large Datasets
**Issue**: Monte Carlo with 10,000 runs = lots of data points
**Solution**: 
- Aggregate data into bins
- Use React.memo for chart components
- Lazy load charts (only render when visible)

### Challenge 2: Responsive Charts
**Issue**: Charts need to work on mobile and desktop
**Solution**:
- Use Recharts' ResponsiveContainer
- Adjust tick counts based on screen size
- Hide less critical elements on mobile

### Challenge 3: Data Transformation
**Issue**: Simulation data needs formatting for charts
**Solution**:
- Create dedicated transformer utilities
- Cache transformed data
- Use useMemo for expensive calculations

---

## 📚 Documentation to Create

1. **CHARTS_GUIDE.md** - How to use each chart
2. **PHASE_B_SUMMARY.md** - Implementation summary
3. **Component README** - Props and usage for each chart
4. **DATA_TRANSFORMATION.md** - How data flows to charts

---

## 🚀 Quick Start

Once approved, I'll:
1. Install dependencies
2. Create base chart components
3. Build Net Worth Chart first (highest value)
4. Add to Scenario Detail page
5. Iterate from there

**Ready to start Phase B?** Let me know and I'll begin with the foundation!

---

## 🎨 Preview (What Users Will See)

```
┌─────────────────────────────────────────────────────────────┐
│  Scenario: My Retirement Plan                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Net Worth Projection                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ╱────────────╲                                │  │
│  │      ╱──                ╲──                           │  │
│  │   ╱──                      ╲──                        │  │
│  │ ─                              ╲                      │  │
│  │                                  ─────────────        │  │
│  └──────────────────────────────────────────────────────┘  │
│  Retirement ↑                                               │
│                                                             │
│  Monte Carlo Success Rate: 87%                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     ▄                                                 │  │
│  │   ▄▄█▄▄                                               │  │
│  │  ▄██████▄                                             │  │
│  │▄█████████▄                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↑ Success threshold                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Status**: Ready to begin Phase B
**Next**: Install dependencies and create foundation
