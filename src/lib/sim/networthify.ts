/**
 * networthify.ts
 * 
 * Deterministic FIRE calculation using the Networthify formula.
 * Based on: https://networthify.com/calculator/earlyretirement
 * 
 * Formula: Years to FI = log(1 + (FI Number - Current NW) × (ROI - WR) / Annual Savings) / log(1 + ROI)
 * 
 * Where:
 * - FI Number = Annual Expenses / Withdrawal Rate (typically 25x expenses for 4% rule)
 * - ROI = Expected annual return on investments (e.g., 0.05 for 5%)
 * - WR = Withdrawal rate (e.g., 0.04 for 4% rule)
 */

export interface NetworthifyInputs {
  currentNetWorth: number;
  annualExpenses: number;
  annualSavings: number;
  expectedReturn: number; // decimal, e.g., 0.05 for 5%
  withdrawalRate: number; // decimal, e.g., 0.04 for 4%
  safetyMargin?: number; // optional multiplier, e.g., 1.1 for 10% safety margin
}

export interface NetworthifyResult {
  yearsToFI: number;
  fiNumber: number;
  currentProgress: number; // percentage (0-100)
  projectedFIDate: Date;
  remainingNeeded: number;
}

/**
 * Calculate years to Financial Independence using deterministic formula
 */
export function calculateYearsToFI(inputs: NetworthifyInputs): NetworthifyResult {
  const {
    currentNetWorth,
    annualExpenses,
    annualSavings,
    expectedReturn,
    withdrawalRate,
    safetyMargin = 1.0,
  } = inputs;

  // Calculate FI Number (25x rule by default, adjusted by safety margin)
  const fiNumber = (annualExpenses / withdrawalRate) * safetyMargin;

  // Calculate current progress
  const currentProgress = fiNumber > 0 ? Math.min((currentNetWorth / fiNumber) * 100, 100) : 0;

  // Calculate remaining needed
  const remainingNeeded = Math.max(0, fiNumber - currentNetWorth);

  // Edge case: already at FI
  if (currentNetWorth >= fiNumber) {
    return {
      yearsToFI: 0,
      fiNumber,
      currentProgress: 100,
      projectedFIDate: new Date(),
      remainingNeeded: 0,
    };
  }

  // Edge case: not saving or negative savings
  if (annualSavings <= 0) {
    return {
      yearsToFI: Infinity,
      fiNumber,
      currentProgress,
      projectedFIDate: new Date(9999, 11, 31), // far future
      remainingNeeded,
    };
  }

  // Calculate years to FI using Networthify formula
  const roiMinusWR = expectedReturn - withdrawalRate;
  
  // Edge case: ROI equals withdrawal rate (special formula)
  if (Math.abs(roiMinusWR) < 0.0001) {
    const yearsToFI = remainingNeeded / annualSavings;
    return {
      yearsToFI,
      fiNumber,
      currentProgress,
      projectedFIDate: addYears(new Date(), yearsToFI),
      remainingNeeded,
    };
  }

  // Standard Networthify formula
  const numerator = 1 + (remainingNeeded * roiMinusWR) / annualSavings;
  
  // Edge case: formula breaks down (numerator <= 0)
  if (numerator <= 0) {
    return {
      yearsToFI: Infinity,
      fiNumber,
      currentProgress,
      projectedFIDate: new Date(9999, 11, 31),
      remainingNeeded,
    };
  }

  const yearsToFI = Math.log(numerator) / Math.log(1 + expectedReturn);

  return {
    yearsToFI: Math.max(0, yearsToFI),
    fiNumber,
    currentProgress,
    projectedFIDate: addYears(new Date(), yearsToFI),
    remainingNeeded,
  };
}

/**
 * Calculate year-by-year projection of net worth growth
 */
export function projectNetWorthGrowth(
  inputs: NetworthifyInputs,
  years: number
): Array<{ year: number; netWorth: number; date: Date }> {
  const { currentNetWorth, annualSavings, expectedReturn } = inputs;
  const projection: Array<{ year: number; netWorth: number; date: Date }> = [];
  
  let netWorth = currentNetWorth;
  const startDate = new Date();

  for (let year = 0; year <= years; year++) {
    projection.push({
      year,
      netWorth,
      date: addYears(startDate, year),
    });

    // Calculate next year's net worth
    netWorth = netWorth * (1 + expectedReturn) + annualSavings;
  }

  return projection;
}

/**
 * Calculate savings rate required to reach FI in target years
 */
export function calculateRequiredSavingsRate(
  currentNetWorth: number,
  annualIncome: number,
  annualExpenses: number,
  targetYears: number,
  expectedReturn: number = 0.05,
  withdrawalRate: number = 0.04
): {
  requiredAnnualSavings: number;
  requiredSavingsRate: number; // percentage
  isFeasible: boolean;
} {
  const fiNumber = annualExpenses / withdrawalRate;
  const remainingNeeded = Math.max(0, fiNumber - currentNetWorth);

  // Calculate required annual savings using future value of annuity formula
  const r = expectedReturn;
  const n = targetYears;
  
  let requiredAnnualSavings: number;
  
  if (Math.abs(r) < 0.0001) {
    // No growth case
    requiredAnnualSavings = remainingNeeded / n;
  } else {
    // Future value of annuity formula solved for payment
    const futureValueFactor = (Math.pow(1 + r, n) - 1) / r;
    requiredAnnualSavings = remainingNeeded / futureValueFactor;
  }

  const requiredSavingsRate = annualIncome > 0 ? (requiredAnnualSavings / annualIncome) * 100 : 0;
  const isFeasible = requiredAnnualSavings <= (annualIncome - annualExpenses) && requiredSavingsRate <= 100;

  return {
    requiredAnnualSavings,
    requiredSavingsRate,
    isFeasible,
  };
}

/**
 * Helper: Add years to a date
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
