/**
 * monte-carlo.ts
 * 
 * Monte Carlo simulation for retirement portfolio analysis.
 * Uses stochastic modeling to estimate portfolio success probability.
 * 
 * Methodology:
 * - Simulate thousands of retirement scenarios
 * - Model returns using normal distribution with configurable mean/stdev
 * - Account for inflation
 * - Support multiple withdrawal strategies (fixed, percentage, guardrails)
 */

import { simulateGuardrailsRetirement, GuardrailsConfig, DEFAULT_GUARDRAILS_CONFIG } from './guardrails';

export type WithdrawalStrategy = 'fixed' | 'percentage' | 'guardrails';

export interface MonteCarloConfig {
  numSimulations: number; // e.g., 10000
  retirementYears: number; // e.g., 30
  initialPortfolio: number;
  annualWithdrawal?: number; // For 'fixed' strategy
  withdrawalRate?: number; // For 'percentage' strategy, decimal e.g., 0.04
  withdrawalStrategy: WithdrawalStrategy;
  guardrailsConfig?: GuardrailsConfig; // For 'guardrails' strategy
  expectedReturnMean: number; // decimal, e.g., 0.05 for 5%
  expectedReturnStdev: number; // decimal, e.g., 0.12 for 12%
  inflationRate: number; // decimal, e.g., 0.02 for 2%
}

export interface MonteCarloResult {
  successRate: number; // decimal, e.g., 0.85 for 85%
  medianFinalPortfolio: number;
  percentile10FinalPortfolio: number;
  percentile90FinalPortfolio: number;
  simulations: SimulationRun[];
  config: MonteCarloConfig;
}

export interface SimulationRun {
  runId: number;
  success: boolean;
  finalPortfolio: number;
  yearsLasted: number;
  totalWithdrawn: number;
  returns: number[]; // Annual returns for this run
}

/**
 * Generate random returns using normal distribution (Box-Muller transform)
 */
function generateNormalReturn(mean: number, stdev: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdev;
}

/**
 * Generate array of random annual returns
 */
function generateReturns(years: number, mean: number, stdev: number): number[] {
  const returns: number[] = [];
  for (let i = 0; i < years; i++) {
    returns.push(generateNormalReturn(mean, stdev));
  }
  return returns;
}

/**
 * Run a single simulation with fixed withdrawal amount
 */
function simulateFixedWithdrawal(
  initialPortfolio: number,
  annualWithdrawal: number,
  returns: number[],
  inflationRate: number
): SimulationRun {
  let portfolioValue = initialPortfolio;
  let currentWithdrawal = annualWithdrawal;
  let totalWithdrawn = 0;
  let yearsLasted = 0;

  for (let year = 0; year < returns.length; year++) {
    // Apply inflation to withdrawal
    if (year > 0) {
      currentWithdrawal = currentWithdrawal * (1 + inflationRate);
    }

    // Withdraw
    portfolioValue -= currentWithdrawal;
    totalWithdrawn += currentWithdrawal;

    // Check if depleted
    if (portfolioValue <= 0) {
      yearsLasted = year + 1;
      return {
        runId: 0,
        success: false,
        finalPortfolio: 0,
        yearsLasted,
        totalWithdrawn,
        returns: returns.slice(0, year + 1),
      };
    }

    // Apply returns
    portfolioValue = portfolioValue * (1 + returns[year]);
    yearsLasted = year + 1;
  }

  return {
    runId: 0,
    success: true,
    finalPortfolio: portfolioValue,
    yearsLasted,
    totalWithdrawn,
    returns,
  };
}

/**
 * Run a single simulation with percentage withdrawal
 */
function simulatePercentageWithdrawal(
  initialPortfolio: number,
  withdrawalRate: number,
  returns: number[]
): SimulationRun {
  let portfolioValue = initialPortfolio;
  let totalWithdrawn = 0;
  let yearsLasted = 0;

  for (let year = 0; year < returns.length; year++) {
    // Withdraw percentage of current portfolio
    const withdrawal = portfolioValue * withdrawalRate;
    portfolioValue -= withdrawal;
    totalWithdrawn += withdrawal;

    // Check if depleted
    if (portfolioValue <= 0) {
      yearsLasted = year + 1;
      return {
        runId: 0,
        success: false,
        finalPortfolio: 0,
        yearsLasted,
        totalWithdrawn,
        returns: returns.slice(0, year + 1),
      };
    }

    // Apply returns
    portfolioValue = portfolioValue * (1 + returns[year]);
    yearsLasted = year + 1;
  }

  return {
    runId: 0,
    success: true,
    finalPortfolio: portfolioValue,
    yearsLasted,
    totalWithdrawn,
    returns,
  };
}

/**
 * Run a single simulation with guardrails withdrawal strategy
 */
function simulateGuardrailsWithdrawal(
  initialPortfolio: number,
  returns: number[],
  guardrailsConfig: GuardrailsConfig
): SimulationRun {
  const results = simulateGuardrailsRetirement(
    initialPortfolio,
    returns.length,
    returns,
    guardrailsConfig
  );

  const success = results.length === returns.length && results[results.length - 1].portfolioValue > 0;
  const finalPortfolio = results.length > 0 ? results[results.length - 1].portfolioValue : 0;
  const totalWithdrawn = results.reduce((sum, r) => sum + r.withdrawal, 0);

  return {
    runId: 0,
    success,
    finalPortfolio,
    yearsLasted: results.length,
    totalWithdrawn,
    returns: returns.slice(0, results.length),
  };
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const {
    numSimulations,
    retirementYears,
    initialPortfolio,
    annualWithdrawal,
    withdrawalRate,
    withdrawalStrategy,
    guardrailsConfig,
    expectedReturnMean,
    expectedReturnStdev,
    inflationRate,
  } = config;

  const simulations: SimulationRun[] = [];

  for (let i = 0; i < numSimulations; i++) {
    // Generate returns for this simulation
    const returns = generateReturns(retirementYears, expectedReturnMean, expectedReturnStdev);

    let result: SimulationRun;

    // Run simulation based on withdrawal strategy
    switch (withdrawalStrategy) {
      case 'fixed':
        if (!annualWithdrawal) {
          throw new Error('annualWithdrawal is required for fixed withdrawal strategy');
        }
        result = simulateFixedWithdrawal(initialPortfolio, annualWithdrawal, returns, inflationRate);
        break;

      case 'percentage':
        if (!withdrawalRate) {
          throw new Error('withdrawalRate is required for percentage withdrawal strategy');
        }
        result = simulatePercentageWithdrawal(initialPortfolio, withdrawalRate, returns);
        break;

      case 'guardrails':
        const effectiveConfig = guardrailsConfig || DEFAULT_GUARDRAILS_CONFIG;
        result = simulateGuardrailsWithdrawal(initialPortfolio, returns, effectiveConfig);
        break;

      default:
        throw new Error(`Unknown withdrawal strategy: ${withdrawalStrategy}`);
    }

    result.runId = i;
    simulations.push(result);
  }

  // Calculate statistics
  const successfulRuns = simulations.filter(s => s.success);
  const successRate = successfulRuns.length / numSimulations;

  // Sort by final portfolio value for percentile calculations
  const sortedFinalPortfolios = simulations
    .map(s => s.finalPortfolio)
    .sort((a, b) => a - b);

  const medianFinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations / 2)];
  const percentile10FinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations * 0.1)];
  const percentile90FinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations * 0.9)];

  return {
    successRate,
    medianFinalPortfolio,
    percentile10FinalPortfolio,
    percentile90FinalPortfolio,
    simulations,
    config,
  };
}

/**
 * Default Monte Carlo configuration
 */
export const DEFAULT_MONTE_CARLO_CONFIG: Partial<MonteCarloConfig> = {
  numSimulations: 10000,
  retirementYears: 30,
  expectedReturnMean: 0.05, // 5% average return
  expectedReturnStdev: 0.12, // 12% standard deviation
  inflationRate: 0.02, // 2% inflation
};
