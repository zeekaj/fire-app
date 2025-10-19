/**
 * probability-curve.ts
 * 
 * Aggregate Monte Carlo simulation results to generate probability curves.
 * Shows success rate vs retirement age/date for scenario planning.
 * 
 * Used for visualizing FIRE probability in dashboard with Recharts.
 */

import { runMonteCarloSimulation, MonteCarloConfig, MonteCarloResult } from './monte-carlo';

export interface ProbabilityCurvePoint {
  retirementAge: number;
  retirementYear: number;
  successRate: number; // decimal, e.g., 0.85 for 85%
  yearsToRetirement: number;
  medianFinalPortfolio: number;
}

export interface ProbabilityCurveConfig {
  currentAge: number;
  currentYear: number;
  minRetirementAge: number;
  maxRetirementAge: number;
  currentNetWorth: number;
  annualSavings: number;
  annualExpenses: number;
  expectedReturn: number;
  stockAllocation: number;
  monteCarloConfig: Omit<MonteCarloConfig, 'initialPortfolio' | 'retirementYears'>;
}

export interface ProbabilityCurveResult {
  points: ProbabilityCurvePoint[];
  optimalRetirementAge: number; // Age with ~90% success rate
  safeRetirementAge: number; // Age with ~95% success rate
  earliestViableAge: number; // First age with >50% success rate
}

/**
 * Project net worth to a future retirement age
 */
function projectNetWorth(
  currentNetWorth: number,
  annualSavings: number,
  yearsToRetirement: number,
  expectedReturn: number
): number {
  let netWorth = currentNetWorth;

  for (let year = 0; year < yearsToRetirement; year++) {
    // Add savings at start of year
    netWorth += annualSavings;
    // Apply returns
    netWorth = netWorth * (1 + expectedReturn);
  }

  return netWorth;
}

/**
 * Calculate retirement duration based on life expectancy
 */
function calculateRetirementDuration(retirementAge: number, lifeExpectancy: number = 95): number {
  return Math.max(1, lifeExpectancy - retirementAge);
}

/**
 * Generate probability curve for different retirement ages
 */
export function generateProbabilityCurve(config: ProbabilityCurveConfig): ProbabilityCurveResult {
  const {
    currentAge,
    currentYear,
    minRetirementAge,
    maxRetirementAge,
    currentNetWorth,
    annualSavings,
    annualExpenses,
    expectedReturn,
    monteCarloConfig,
  } = config;

  const points: ProbabilityCurvePoint[] = [];

  // Run Monte Carlo for each retirement age
  for (let retirementAge = minRetirementAge; retirementAge <= maxRetirementAge; retirementAge++) {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const retirementYear = currentYear + yearsToRetirement;

    // Project net worth to retirement age
    const projectedNetWorth = projectNetWorth(
      currentNetWorth,
      annualSavings,
      yearsToRetirement,
      expectedReturn
    );

    // Calculate retirement duration
    const retirementYears = calculateRetirementDuration(retirementAge);

    // Run Monte Carlo simulation
    const mcConfig: MonteCarloConfig = {
      ...monteCarloConfig,
      initialPortfolio: projectedNetWorth,
      retirementYears,
      annualWithdrawal: annualExpenses,
    };

    const result: MonteCarloResult = runMonteCarloSimulation(mcConfig);

    points.push({
      retirementAge,
      retirementYear,
      successRate: result.successRate,
      yearsToRetirement,
      medianFinalPortfolio: result.medianFinalPortfolio,
    });
  }

  // Find key ages
  const optimalPoint = points.find(p => p.successRate >= 0.90);
  const safePoint = points.find(p => p.successRate >= 0.95);
  const earliestViablePoint = points.find(p => p.successRate >= 0.50);

  return {
    points,
    optimalRetirementAge: optimalPoint?.retirementAge || maxRetirementAge,
    safeRetirementAge: safePoint?.retirementAge || maxRetirementAge,
    earliestViableAge: earliestViablePoint?.retirementAge || maxRetirementAge,
  };
}

/**
 * Find retirement age for target success rate (inverse probability)
 */
export function findRetirementAgeForSuccessRate(
  targetSuccessRate: number,
  config: ProbabilityCurveConfig
): {
  retirementAge: number;
  actualSuccessRate: number;
  yearsToRetirement: number;
} {
  const curve = generateProbabilityCurve(config);

  // Find first point meeting or exceeding target
  const targetPoint = curve.points.find(p => p.successRate >= targetSuccessRate);

  if (!targetPoint) {
    // Target not achievable, return max age
    const lastPoint = curve.points[curve.points.length - 1];
    return {
      retirementAge: lastPoint.retirementAge,
      actualSuccessRate: lastPoint.successRate,
      yearsToRetirement: lastPoint.yearsToRetirement,
    };
  }

  return {
    retirementAge: targetPoint.retirementAge,
    actualSuccessRate: targetPoint.successRate,
    yearsToRetirement: targetPoint.yearsToRetirement,
  };
}

/**
 * Format probability curve data for Recharts
 */
export function formatForRecharts(points: ProbabilityCurvePoint[]): Array<{
  age: number;
  year: number;
  probability: number; // percentage, e.g., 85 for 85%
  label: string;
}> {
  return points.map(p => ({
    age: p.retirementAge,
    year: p.retirementYear,
    probability: Math.round(p.successRate * 100),
    label: `Age ${p.retirementAge}`,
  }));
}

/**
 * Get color for success rate (used in UI styling)
 */
export function getSuccessRateColor(successRate: number): string {
  if (successRate >= 0.95) return 'text-green-600'; // Very safe
  if (successRate >= 0.90) return 'text-green-500'; // Optimal
  if (successRate >= 0.75) return 'text-yellow-500'; // Moderate risk
  if (successRate >= 0.50) return 'text-orange-500'; // High risk
  return 'text-red-500'; // Very risky
}

/**
 * Get description for success rate tier
 */
export function getSuccessRateDescription(successRate: number): string {
  if (successRate >= 0.95) return 'Very Safe - Excellent probability of success';
  if (successRate >= 0.90) return 'Optimal - Good probability of success';
  if (successRate >= 0.75) return 'Moderate - Reasonable chance of success';
  if (successRate >= 0.50) return 'Risky - Uncertain outcome';
  return 'Very Risky - Low probability of success';
}
