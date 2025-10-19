# FIRE Scenarios Feature - Quick Start Guide

## Overview
The FIRE Scenarios feature allows users to create and analyze different retirement planning scenarios using three calculation methodologies:
1. **Deterministic (Networthify)** - Quick estimate using logarithmic formula
2. **Monte Carlo** - Stochastic simulation with 1,000-10,000 runs
3. **Historical Bootstrap** - Real market data from 1926-2023

## Current Implementation Status

### ✅ Completed (90%)
- Full simulation library with 5 modules (networthify, guardrails, monte-carlo, historical, probability-curve)
- React Query hooks for CRUD operations
- Scenarios management page with live calculations
- Add scenario modal with comprehensive form
- Scenario selector component
- Probability curve visualization (Recharts)
- Time to FI tile component
- App navigation integration
- All TypeScript compilation passing (0 errors)

### ⚠️ Pending (10%)
- Database migration needs to be applied to Supabase
- database.types.ts needs regeneration
- Dashboard integration with live scenario selector
- End-to-end testing

## How to Complete Setup

### Step 1: Apply Database Migration

The `03_scenarios.sql` migration needs to be applied to your Supabase project. You have two options:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project (slgmjbbwqhcqtguudglc)
3. Go to SQL Editor
4. Copy contents of `/workspaces/fire-app/supabase/migrations/03_scenarios.sql`
5. Paste and run the SQL
6. Verify the `scenarios` table exists in Table Editor

#### Option B: Via Supabase CLI (if linked)
```bash
cd /workspaces/fire-app
npx supabase db push
```

### Step 2: Regenerate TypeScript Types

After applying the migration, regenerate database types:

```bash
cd /workspaces/fire-app
npx supabase gen types typescript --project-id slgmjbbwqhcqtguudglc > src/lib/database.types.ts
```

### Step 3: Remove Type Assertions

Once types are regenerated, remove `@ts-expect-error` directives from:
- `src/features/scenarios/hooks/useScenarios.ts`
- `src/features/scenarios/hooks/useScenarioMutations.ts`

Search for `@ts-expect-error` and remove those lines.

### Step 4: Test the Feature

1. Start the dev server: `npm run dev`
2. Navigate to the "Scenarios" tab
3. Click "+ New Scenario"
4. Fill out the form and create a scenario
5. Verify calculations appear on the scenario card
6. Test editing and deleting scenarios

## Feature Usage

### Creating a Scenario

1. Click "+ New Scenario" button
2. Fill out the form:
   - **Scenario Name**: Descriptive name (e.g., "Conservative Plan")
   - **Ages**: Current age, retirement age, life expectancy
   - **Financials**: Current savings, annual contribution, annual expenses
   - **Portfolio**: Stock allocation percentage (60% = 60/40 stocks/bonds)
   - **Returns**: Expected return mean (5%), standard deviation (12%)
   - **Inflation**: Expected inflation rate (2%)
   - **Withdrawal Strategy**: Guardrails (recommended), Fixed, or Percentage
   - **Notes**: Optional description
3. Click "Create Scenario"

### Understanding the Metrics

Each scenario card shows:

- **Years to FI**: Deterministic calculation using Networthify formula
  - Shows exact years or "∞" if not achievable
  - Shows "Reached!" if already at FI

- **Success Rate**: Monte Carlo simulation (1,000 runs)
  - **Good** (green): ≥90% success rate
  - **Moderate** (yellow): 75-90% success rate  
  - **Risky** (red): <75% success rate

- **Scenario Details**: Age range, savings, contributions, expenses, strategy

### Withdrawal Strategies

1. **Guardrails** (Recommended)
   - Dynamic spending based on portfolio performance
   - ±10% guardbands around baseline
   - ±20% annual adjustment cap
   - Balances flexibility with safety

2. **Fixed Dollar Amount**
   - Withdraw same amount each year
   - Adjusted for inflation
   - Traditional 4% rule approach

3. **Percentage of Portfolio**
   - Withdraw fixed percentage each year
   - No inflation adjustment needed
   - More volatile spending

## Simulation Library API

### Deterministic Calculation
```typescript
import { calculateYearsToFI } from '@/lib/sim';

const result = calculateYearsToFI({
  currentNetWorth: 100000,
  annualExpenses: 40000,
  annualSavings: 20000,
  expectedReturn: 0.05,
  withdrawalRate: 0.04,
});

console.log(result.yearsToFI); // e.g., 15.2 years
console.log(result.fiNumber); // e.g., $1,000,000
console.log(result.currentProgress); // e.g., 10% (percentage)
```

### Monte Carlo Simulation
```typescript
import { runMonteCarloSimulation } from '@/lib/sim';

const result = runMonteCarloSimulation({
  numSimulations: 10000,
  retirementYears: 30,
  initialPortfolio: 1000000,
  annualWithdrawal: 40000,
  withdrawalStrategy: 'guardrails',
  expectedReturnMean: 0.05,
  expectedReturnStdev: 0.12,
  inflationRate: 0.02,
});

console.log(result.successRate); // e.g., 0.85 (85%)
console.log(result.medianFinalPortfolio); // e.g., $1,500,000
```

### Historical Bootstrap
```typescript
import { runHistoricalSimulation, SAMPLE_HISTORICAL_DATA } from '@/lib/sim';

const result = runHistoricalSimulation({
  numSimulations: 5000,
  retirementYears: 30,
  initialPortfolio: 1000000,
  annualWithdrawal: 40000,
  stockAllocation: 0.60,
  historicalData: SAMPLE_HISTORICAL_DATA,
  inflationAdjusted: true,
});

console.log(result.successRate); // e.g., 0.82 (82%)
console.log(result.worstCaseStartYear); // e.g., 1929 (Great Depression)
console.log(result.bestCaseStartYear); // e.g., 1982 (Bull market)
```

### Probability Curve
```typescript
import { generateProbabilityCurve } from '@/lib/sim';

const curve = generateProbabilityCurve({
  currentAge: 35,
  currentYear: 2025,
  minRetirementAge: 50,
  maxRetirementAge: 70,
  currentNetWorth: 100000,
  annualSavings: 20000,
  annualExpenses: 40000,
  expectedReturn: 0.05,
  stockAllocation: 0.60,
  monteCarloConfig: {
    numSimulations: 10000,
    withdrawalStrategy: 'guardrails',
    expectedReturnMean: 0.05,
    expectedReturnStdev: 0.12,
    inflationRate: 0.02,
  },
});

console.log(curve.earliestViableAge); // e.g., 55 (50% success)
console.log(curve.optimalRetirementAge); // e.g., 62 (90% success)
console.log(curve.safeRetirementAge); // e.g., 65 (95% success)
```

## Component Usage

### Scenarios Page (standalone)
```typescript
import { ScenariosPage } from '@/features/scenarios';

function App() {
  return <ScenariosPage />;
}
```

### Scenario Selector (for dashboard/other pages)
```typescript
import { ScenarioSelector } from '@/features/scenarios';
import { useState } from 'react';

function Dashboard() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  return (
    <div>
      <ScenarioSelector
        selectedScenarioId={selectedScenario?.id || null}
        onSelect={setSelectedScenario}
      />
      {/* Use selectedScenario data for calculations */}
    </div>
  );
}
```

### Time to FI Tile
```typescript
import { TimeToFITile } from '@/features/dashboard/components/TimeToFITile';

function Dashboard() {
  return (
    <TimeToFITile
      currentNetWorth={100000}
      annualExpenses={40000}
      annualSavings={20000}
      expectedReturn={0.05}
      withdrawalRate={0.04}
    />
  );
}
```

### Probability Curve
```typescript
import { ProbabilityCurve } from '@/features/dashboard/components/ProbabilityCurve';

function Dashboard() {
  const config = {
    currentAge: 35,
    currentYear: 2025,
    minRetirementAge: 50,
    maxRetirementAge: 70,
    currentNetWorth: 100000,
    annualSavings: 20000,
    annualExpenses: 40000,
    expectedReturn: 0.05,
    stockAllocation: 0.60,
    monteCarloConfig: {
      numSimulations: 10000,
      withdrawalStrategy: 'guardrails' as const,
      expectedReturnMean: 0.05,
      expectedReturnStdev: 0.12,
      inflationRate: 0.02,
    },
  };
  
  return <ProbabilityCurve config={config} title="My FIRE Plan" />;
}
```

## Next Steps

### For Full Integration
1. Add scenario selector to Dashboard
2. Wire selected scenario to TimeToFITile
3. Add ProbabilityCurve to Dashboard with live scenario data
4. Store active scenario ID in local storage or user settings

### For Phase B (Bills Workflow)
See FIRE-APP REALIGNMENT PLAN document for:
- Pending bills workflow
- RRULE expansion to transactions
- Reserve account integration

### For Phase C (Month Close)
See FIRE-APP REALIGNMENT PLAN document for:
- Month close procedures
- Audit trail
- Reconciliation features

## Troubleshooting

### "scenarios table doesn't exist"
- Migration hasn't been applied yet
- Follow Step 1 above to apply migration via Supabase Dashboard

### TypeScript errors about scenarios
- database.types.ts hasn't been regenerated
- Follow Step 2 above to regenerate types

### Calculations seem slow
- Monte Carlo with 10,000 simulations can take 1-2 seconds
- Scenarios page uses 1,000 simulations for quick preview
- Consider reducing numSimulations for real-time UI updates

### Historical data seems limited
- Currently using 98 years (1926-2023) embedded in code
- Future enhancement: Store in database or fetch from API
- Can be filtered by year range using `getHistoricalDataByYearRange()`

## Architecture Notes

### Why Three Calculation Methods?

1. **Deterministic (Networthify)**
   - Fast (milliseconds)
   - Good for quick estimates
   - Doesn't account for volatility
   - Used in scenario cards and TimeToFITile

2. **Monte Carlo**
   - Realistic (accounts for volatility)
   - Shows probability distribution
   - Slower (1-2 seconds for 10,000 runs)
   - Used for success rate analysis

3. **Historical Bootstrap**
   - Most conservative
   - Actual market data
   - Shows worst/best case historical scenarios
   - Useful for "what if I retired in 1929?" analysis

### Data Flow

```
User Input (Scenario Form)
    ↓
Supabase (scenarios table)
    ↓
React Query Cache
    ↓
Simulation Library
    ↓
UI Components (Cards, Charts, Tiles)
```

---

**Last Updated:** Current session  
**Phase:** A - FIRE Simulation & Scenarios  
**Status:** 90% complete, ready for database migration
