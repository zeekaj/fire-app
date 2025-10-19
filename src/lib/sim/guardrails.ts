/**
 * guardrails.ts
 * 
 * Guardrails withdrawal strategy for safe retirement spending.
 * Based on guardrails methodology with dynamic spending adjustments.
 * 
 * Rules:
 * - Initial withdrawal rate (typically 4%)
 * - ±10% guardbands around initial withdrawal amount (prosperity/capital preservation)
 * - ±20% annual adjustment cap
 * - Inflation-adjusted baseline
 */

export interface GuardrailsConfig {
  initialWithdrawalRate: number; // decimal, e.g., 0.04
  prosperityGuardband: number; // decimal, e.g., 0.10 for +10%
  capitalPreservationGuardband: number; // decimal, e.g., 0.10 for -10%
  annualAdjustmentCap: number; // decimal, e.g., 0.20 for ±20%
  inflationRate: number; // decimal, e.g., 0.02 for 2%
}

export interface GuardrailsState {
  year: number;
  portfolioValue: number;
  withdrawal: number;
  withdrawalRate: number;
  inflationAdjustedBaseline: number;
  upperGuardband: number;
  lowerGuardband: number;
  adjustment: 'none' | 'increase' | 'decrease';
  adjustmentAmount: number;
}

/**
 * Calculate guardrails withdrawal for a single year
 */
export function calculateGuardrailsWithdrawal(
  portfolioValue: number,
  previousWithdrawal: number,
  initialWithdrawal: number,
  yearsSinceRetirement: number,
  config: GuardrailsConfig
): GuardrailsState {
  const {
    initialWithdrawalRate,
    prosperityGuardband,
    capitalPreservationGuardband,
    annualAdjustmentCap,
    inflationRate,
  } = config;

  // Calculate inflation-adjusted baseline
  const inflationAdjustedBaseline = initialWithdrawal * Math.pow(1 + inflationRate, yearsSinceRetirement);

  // Calculate guardbands
  const upperGuardband = inflationAdjustedBaseline * (1 + prosperityGuardband);
  const lowerGuardband = inflationAdjustedBaseline * (1 - capitalPreservationGuardband);

  // Calculate current withdrawal rate
  const currentWithdrawalRate = previousWithdrawal / portfolioValue;

  // Determine if adjustment is needed
  let withdrawal = previousWithdrawal;
  let adjustment: 'none' | 'increase' | 'decrease' = 'none';
  let adjustmentAmount = 0;

  // Check if we're outside guardbands
  if (previousWithdrawal < lowerGuardband && currentWithdrawalRate < initialWithdrawalRate * 1.5) {
    // Increase spending (capital preservation breach - we can afford more)
    const targetIncrease = lowerGuardband - previousWithdrawal;
    const cappedIncrease = Math.min(targetIncrease, previousWithdrawal * annualAdjustmentCap);
    withdrawal = previousWithdrawal + cappedIncrease;
    adjustment = 'increase';
    adjustmentAmount = cappedIncrease;
  } else if (previousWithdrawal > upperGuardband || currentWithdrawalRate > initialWithdrawalRate * 1.5) {
    // Decrease spending (prosperity breach or withdrawal rate too high)
    const targetDecrease = previousWithdrawal - upperGuardband;
    const cappedDecrease = Math.min(Math.abs(targetDecrease), previousWithdrawal * annualAdjustmentCap);
    withdrawal = previousWithdrawal - cappedDecrease;
    adjustment = 'decrease';
    adjustmentAmount = -cappedDecrease;
  } else {
    // Within guardbands - apply inflation adjustment only
    withdrawal = previousWithdrawal * (1 + inflationRate);
    adjustmentAmount = withdrawal - previousWithdrawal;
  }

  return {
    year: yearsSinceRetirement,
    portfolioValue,
    withdrawal,
    withdrawalRate: withdrawal / portfolioValue,
    inflationAdjustedBaseline,
    upperGuardband,
    lowerGuardband,
    adjustment,
    adjustmentAmount,
  };
}

/**
 * Simulate guardrails withdrawal strategy over retirement period
 */
export function simulateGuardrailsRetirement(
  initialPortfolio: number,
  retirementYears: number,
  annualReturns: number[], // Array of annual returns (can be historical or simulated)
  config: GuardrailsConfig
): GuardrailsState[] {
  const { initialWithdrawalRate } = config;
  
  const results: GuardrailsState[] = [];
  let portfolioValue = initialPortfolio;
  let initialWithdrawal = initialPortfolio * initialWithdrawalRate;
  let currentWithdrawal = initialWithdrawal;

  for (let year = 0; year < retirementYears && year < annualReturns.length; year++) {
    // Calculate withdrawal for this year
    const state = calculateGuardrailsWithdrawal(
      portfolioValue,
      currentWithdrawal,
      initialWithdrawal,
      year,
      config
    );

    results.push(state);

    // Update portfolio value for next year
    portfolioValue = (portfolioValue - state.withdrawal) * (1 + annualReturns[year]);
    currentWithdrawal = state.withdrawal;

    // Check if portfolio depleted
    if (portfolioValue <= 0) {
      break;
    }
  }

  return results;
}

/**
 * Calculate success metrics for guardrails strategy
 */
export function analyzeGuardrailsStrategy(
  results: GuardrailsState[],
  targetYears: number
): {
  success: boolean; // Did portfolio last the full period?
  finalPortfolioValue: number;
  averageWithdrawal: number;
  totalWithdrawn: number;
  adjustmentsCount: {
    increases: number;
    decreases: number;
  };
  lowestPortfolioValue: number;
  highestWithdrawalRate: number;
} {
  if (results.length === 0) {
    return {
      success: false,
      finalPortfolioValue: 0,
      averageWithdrawal: 0,
      totalWithdrawn: 0,
      adjustmentsCount: { increases: 0, decreases: 0 },
      lowestPortfolioValue: 0,
      highestWithdrawalRate: 0,
    };
  }

  const success = results.length >= targetYears && results[results.length - 1].portfolioValue > 0;
  const finalPortfolioValue = results[results.length - 1].portfolioValue;
  const totalWithdrawn = results.reduce((sum, r) => sum + r.withdrawal, 0);
  const averageWithdrawal = totalWithdrawn / results.length;
  
  const adjustmentsCount = results.reduce(
    (acc, r) => {
      if (r.adjustment === 'increase') acc.increases++;
      if (r.adjustment === 'decrease') acc.decreases++;
      return acc;
    },
    { increases: 0, decreases: 0 }
  );

  const lowestPortfolioValue = Math.min(...results.map(r => r.portfolioValue));
  const highestWithdrawalRate = Math.max(...results.map(r => r.withdrawalRate));

  return {
    success,
    finalPortfolioValue,
    averageWithdrawal,
    totalWithdrawn,
    adjustmentsCount,
    lowestPortfolioValue,
    highestWithdrawalRate,
  };
}

/**
 * Default guardrails configuration
 */
export const DEFAULT_GUARDRAILS_CONFIG: GuardrailsConfig = {
  initialWithdrawalRate: 0.04, // 4% rule
  prosperityGuardband: 0.10, // +10% upper band
  capitalPreservationGuardband: 0.10, // -10% lower band
  annualAdjustmentCap: 0.20, // ±20% max adjustment per year
  inflationRate: 0.02, // 2% inflation
};
