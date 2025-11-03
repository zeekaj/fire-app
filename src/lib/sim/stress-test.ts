/**
 * stress-test.ts
 * 
 * Stress testing engine for FIRE projections.
 * Simulates market crashes and adverse scenarios to test plan resilience.
 */

import { FIProjectionInputs, FIProjectionResult, FIProjectionYear, calculateFIProjection } from './projection';

export type RecoveryPattern = 'V-shape' | 'U-shape' | 'L-shape';

export interface MarketCrashScenario {
  /** Name/description of the crash scenario */
  name: string;
  /** Percentage drop in market value (0-100, e.g., 50 for 50% crash) */
  crashPercentage: number;
  /** Year when crash occurs (0 = immediately, 1 = after 1 year, etc.) */
  startYear: number;
  /** Duration of crash bottom in years */
  crashDuration: number;
  /** Recovery pattern after crash bottom */
  recoveryPattern: RecoveryPattern;
  /** Years to full recovery (after crash duration ends) */
  recoveryYears: number;
}

export interface StressTestResult {
  baseline: FIProjectionResult;
  stressed: FIProjectionResult;
  impact: {
    delayInYears: number;
    percentageDelay: number;
    netWorthAtCrash: number;
    netWorthAfterCrash: number;
    recovered: boolean;
    recoveryYear?: number;
  };
}

/**
 * Preset crash scenarios based on historical market crashes
 */
export const PRESET_CRASH_SCENARIOS: Record<string, MarketCrashScenario> = {
  '2008_FINANCIAL_CRISIS': {
    name: '2008 Financial Crisis',
    crashPercentage: 50,
    startYear: 0,
    crashDuration: 1,
    recoveryPattern: 'V-shape',
    recoveryYears: 4,
  },
  'DOT_COM_CRASH': {
    name: 'Dot-com Bubble (2000-2002)',
    crashPercentage: 45,
    startYear: 0,
    crashDuration: 2,
    recoveryPattern: 'U-shape',
    recoveryYears: 5,
  },
  'COVID_CRASH': {
    name: 'COVID-19 Crash (2020)',
    crashPercentage: 35,
    startYear: 0,
    crashDuration: 0.25, // 3 months
    recoveryPattern: 'V-shape',
    recoveryYears: 1,
  },
  'SEVERE_RECESSION': {
    name: 'Severe Recession',
    crashPercentage: 60,
    startYear: 0,
    crashDuration: 2,
    recoveryPattern: 'L-shape',
    recoveryYears: 8,
  },
  'MILD_CORRECTION': {
    name: 'Mild Market Correction',
    crashPercentage: 20,
    startYear: 0,
    crashDuration: 0.5,
    recoveryPattern: 'V-shape',
    recoveryYears: 2,
  },
};

/**
 * Calculate modified growth rates during crash and recovery periods
 */
function getStressedGrowthRates(
  year: number,
  normalStockRate: number,
  normalBondRate: number,
  scenario: MarketCrashScenario
): { stockRate: number; bondRate: number } {
  const crashStart = scenario.startYear;
  const crashEnd = crashStart + scenario.crashDuration;
  const recoveryEnd = crashEnd + scenario.recoveryYears;

  // Before crash: normal rates
  if (year < crashStart) {
    return { stockRate: normalStockRate, bondRate: normalBondRate };
  }

  // During crash: immediate drop
  if (year === crashStart) {
    const crashReturn = -scenario.crashPercentage / 100;
    return { stockRate: crashReturn, bondRate: normalBondRate * 0.5 }; // Bonds also decline but less
  }

  // During crash bottom: flat or slightly negative
  if (year > crashStart && year < crashEnd) {
    return { stockRate: -0.05, bondRate: 0.01 };
  }

  // During recovery: depends on pattern
  if (year >= crashEnd && year < recoveryEnd) {
    const recoveryProgress = (year - crashEnd) / scenario.recoveryYears;
    
    switch (scenario.recoveryPattern) {
      case 'V-shape':
        // Fast recovery: accelerated growth to make up losses
        const vRecoveryRate = normalStockRate * 1.5; // 50% faster growth
        return { stockRate: vRecoveryRate, bondRate: normalBondRate };
      
      case 'U-shape':
        // Gradual recovery: slowly return to normal
        const uRecoveryRate = normalStockRate * (0.5 + recoveryProgress * 0.5);
        return { stockRate: uRecoveryRate, bondRate: normalBondRate };
      
      case 'L-shape':
        // Slow recovery: extended low growth period
        const lRecoveryRate = normalStockRate * (0.2 + recoveryProgress * 0.8);
        return { stockRate: lRecoveryRate, bondRate: normalBondRate };
      
      default:
        return { stockRate: normalStockRate, bondRate: normalBondRate };
    }
  }

  // After recovery: back to normal
  return { stockRate: normalStockRate, bondRate: normalBondRate };
}

/**
 * Calculate FI projection with a market crash scenario applied
 */
function calculateStressedProjection(
  inputs: FIProjectionInputs,
  scenario: MarketCrashScenario
): FIProjectionResult {
  const {
    currentAge,
    currentNetWorth,
    initialAnnualSavings,
    initialAnnualExpenses,
    stockGrowthRate,
    bondGrowthRate,
    inflationRate,
    incomeGrowthRate,
    withdrawalRate,
    glidePath,
  } = inputs;

  // Helper to get stock allocation at any age
  function getStockAllocation(age: number): number {
    const { startAge, endAge, startStockAllocation, endStockAllocation } = glidePath;
    if (age <= startAge) return startStockAllocation;
    if (age >= endAge) return endStockAllocation;
    const progress = (age - startAge) / (endAge - startAge);
    return startStockAllocation - progress * (startStockAllocation - endStockAllocation);
  }

  let year = 0;
  let age = currentAge;
  let netWorth = currentNetWorth;
  let annualSavings = initialAnnualSavings;
  let annualExpenses = initialAnnualExpenses;

  const projection: FIProjectionYear[] = [];
  const MAX_YEARS = 100;

  while (year <= MAX_YEARS) {
    // Get stressed growth rates for this year
    const { stockRate, bondRate } = getStressedGrowthRates(
      year,
      stockGrowthRate,
      bondGrowthRate,
      scenario
    );

    // Calculate blended return based on current stock allocation
    const stockAllocation = getStockAllocation(age);
    const blendedReturn = stockAllocation * stockRate + (1 - stockAllocation) * bondRate;

    // Store current year state
    projection.push({
      year,
      age,
      netWorth,
      expenses: annualExpenses,
      savings: annualSavings,
      investmentReturn: blendedReturn,
    });

    // Check for FI condition
    const fiNumber = annualExpenses / withdrawalRate;
    if (netWorth >= fiNumber && year > 0) {
      const projectedFIDate = new Date();
      projectedFIDate.setFullYear(projectedFIDate.getFullYear() + year);
      
      return {
        yearsToFI: year,
        projectedFIDate,
        fiNumber,
        projection,
      };
    }

    // Advance to next year
    year++;
    age++;

    // Apply growth and savings
    netWorth *= (1 + blendedReturn);
    netWorth += annualSavings;

    // Update for inflation and income growth
    annualExpenses *= (1 + inflationRate);
    annualSavings *= (1 + incomeGrowthRate);
  }

  // FI not reached within MAX_YEARS
  return {
    yearsToFI: Infinity,
    projectedFIDate: new Date(9999, 11, 31),
    fiNumber: annualExpenses / withdrawalRate,
    projection,
  };
}

/**
 * Run a stress test by comparing baseline and stressed projections
 */
export function runStressTest(
  inputs: FIProjectionInputs,
  scenario: MarketCrashScenario
): StressTestResult {
  // Run baseline projection (no crash)
  const baseline = calculateFIProjection(inputs);

  // Run stressed projection (with crash)
  const stressed = calculateStressedProjection(inputs, scenario);

  // Calculate impact metrics
  const delayInYears = stressed.yearsToFI === Infinity 
    ? Infinity 
    : stressed.yearsToFI - baseline.yearsToFI;
  
  const percentageDelay = baseline.yearsToFI === Infinity || delayInYears === Infinity
    ? Infinity
    : (delayInYears / baseline.yearsToFI) * 100;

  // Find net worth at crash and after crash
  const crashYearIndex = Math.min(scenario.startYear, baseline.projection.length - 1);
  const postCrashYearIndex = Math.min(
    scenario.startYear + scenario.crashDuration,
    stressed.projection.length - 1
  );

  const netWorthAtCrash = baseline.projection[crashYearIndex]?.netWorth ?? 0;
  const netWorthAfterCrash = stressed.projection[postCrashYearIndex]?.netWorth ?? 0;

  // Check if portfolio recovered to pre-crash levels
  let recovered = false;
  let recoveryYear: number | undefined;

  for (let i = postCrashYearIndex + 1; i < stressed.projection.length; i++) {
    if (stressed.projection[i].netWorth >= netWorthAtCrash) {
      recovered = true;
      recoveryYear = stressed.projection[i].year;
      break;
    }
  }

  return {
    baseline,
    stressed,
    impact: {
      delayInYears,
      percentageDelay,
      netWorthAtCrash,
      netWorthAfterCrash,
      recovered,
      recoveryYear,
    },
  };
}
