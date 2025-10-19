/**
 * index.ts
 * 
 * Central export for FIRE simulation library.
 * Provides all calculation methods and utilities for retirement planning.
 */

// Deterministic calculations (Networthify formula)
export {
  type NetworthifyInputs,
  type NetworthifyResult,
  calculateYearsToFI,
  projectNetWorthGrowth,
  calculateRequiredSavingsRate,
} from './networthify';

// Guardrails withdrawal strategy
export {
  type GuardrailsConfig,
  type GuardrailsState,
  calculateGuardrailsWithdrawal,
  simulateGuardrailsRetirement,
  analyzeGuardrailsStrategy,
  DEFAULT_GUARDRAILS_CONFIG,
} from './guardrails';

// Monte Carlo simulation
export {
  type WithdrawalStrategy,
  type MonteCarloConfig,
  type MonteCarloResult,
  type SimulationRun,
  runMonteCarloSimulation,
  DEFAULT_MONTE_CARLO_CONFIG,
} from './monte-carlo';

// Historical returns simulation
export {
  type HistoricalReturnsData,
  type HistoricalSimulationConfig,
  type HistoricalSimulationResult,
  type HistoricalRun,
  runHistoricalSimulation,
  getHistoricalDataByYearRange,
  SAMPLE_HISTORICAL_DATA,
} from './historical';

// Probability curves
export {
  type ProbabilityCurvePoint,
  type ProbabilityCurveConfig,
  type ProbabilityCurveResult,
  generateProbabilityCurve,
  findRetirementAgeForSuccessRate,
  formatForRecharts,
  getSuccessRateColor,
  getSuccessRateDescription,
} from './probability-curve';
