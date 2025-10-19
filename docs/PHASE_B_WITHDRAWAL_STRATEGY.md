# Withdrawal Strategy Comparison Chart

## Overview

The Withdrawal Strategy Comparison chart helps users understand the tradeoffs between different retirement withdrawal strategies by running parallel Monte Carlo simulations and comparing the results side-by-side.

## Strategies Compared

### 1. Fixed Withdrawal (Conservative)
- **Description**: Withdraws the same inflation-adjusted amount every year
- **Pros**: 
  - Predictable income
  - Easy to budget
  - Simple to understand
- **Cons**:
  - Higher portfolio depletion risk in bear markets
  - No flexibility during downturns
  - May withdraw too much when markets are poor

### 2. Guardrails Withdrawal (Adaptive)
- **Description**: Adjusts withdrawals based on portfolio performance using guardrails
- **Mechanism**:
  - Sets upper guardrail at 120% of baseline
  - Sets lower guardrail at 80% of baseline
  - Adjusts withdrawals by 10% when guardrails are breached
- **Pros**:
  - Better portfolio longevity (typically 5-15% higher success rate)
  - Preserves capital during downturns
  - Allows spending increases during bull markets
- **Cons**:
  - Variable income year-to-year
  - Requires budgeting flexibility
  - May reduce spending when you'd prefer not to

## Chart Features

### Visual Comparison
The chart displays three key metrics in a side-by-side bar chart:
1. **Success Rate** - Percentage of simulations that didn't run out of money
2. **Median Final Portfolio** - 50th percentile portfolio value at end of retirement
3. **10th Percentile Final** - Portfolio value in worst-case scenarios (excluding catastrophic failures)

### Comparison Cards
Two detailed cards show comprehensive statistics for each strategy:
- Success rate
- Median final portfolio value
- 10th percentile final value
- 90th percentile final value
- Average final portfolio value

### Smart Insights
The insight box automatically calculates which strategy performs better and by how much:
- Success rate improvement
- Median portfolio difference
- Contextual recommendations based on the comparison

## How to Interpret

### When Fixed Strategy May Be Better
- Success rate difference is negligible (< 2%)
- You need very predictable income
- You have significant other income sources (Social Security, pension)
- Your spending is inflexible

### When Guardrails Strategy May Be Better (Common)
- Success rate improvement is significant (> 5%)
- You have flexibility in your budget
- You want to maximize portfolio longevity
- You're comfortable with variable income (within bounds)

### Typical Results
Based on historical data and common scenarios:
- Guardrails typically improves success rate by 5-15%
- Median final portfolio is often 20-40% higher with guardrails
- The benefit increases with higher volatility and longer retirement periods

## Technical Implementation

### Simulation Details
- **Runs**: 1,000 Monte Carlo simulations for each strategy (2,000 total)
- **Data**: Uses scenario-specific return mean, standard deviation, and inflation rate
- **Duration**: Full retirement period (retirement age to life expectancy)
- **Initial Portfolio**: Projected portfolio value at retirement
- **Annual Withdrawal**: User-specified retirement expenses

### Performance
- **Calculation Time**: ~200-400ms (2,000 simulations)
- **Memoization**: Results cached until scenario parameters change
- **Efficiency**: Leverages optimized simulation engine

### Code Location
```
src/features/scenarios/components/charts/WithdrawalStrategyComparison.tsx
```

## User Guide

### Viewing the Comparison
1. Navigate to a scenario detail page
2. Scroll to "Withdrawal Strategy Comparison" section
3. Review the bar chart and comparison cards
4. Read the insight box for recommendations

### Understanding the Results

**Success Rate**: 
- 90%+ is excellent
- 80-90% is moderate risk
- < 80% is high risk

**Portfolio Values**:
- Higher values mean more legacy/buffer
- Focus on 10th percentile for worst-case planning
- Median represents "typical" outcome

**Insight Box**:
- Green highlight = guardrails is better
- Red highlight = fixed is better
- Shows specific percentage improvements

## Future Enhancements

Potential improvements for future versions:
- **Additional Strategies**: VPW (Variable Percentage Withdrawal), RMD-based, etc.
- **Custom Guardrails**: Let users set their own upper/lower bounds
- **Income Visualization**: Show year-by-year income for both strategies
- **Risk Tolerance Matching**: Recommend strategy based on user's risk profile
- **Inflation Scenarios**: Compare under different inflation environments
- **Tax-Aware Comparison**: Account for tax implications of variable withdrawals

## Related Documentation
- [Phase B Complete](./PHASE_B_COMPLETE.md)
- [Chart Data Transformers](../src/lib/sim/chartDataTransformers.ts)
- [Monte Carlo Simulation](../src/lib/sim/index.ts)

## References

The guardrails methodology is based on:
- Guyton-Klinger withdrawal rules
- Dynamic spending research by Wade Pfau
- Safe withdrawal rate studies by Michael Kitces

---

**Last Updated**: January 2025  
**Component Version**: 1.0.0  
**Status**: Production Ready
