/**
 * chartDataTransformers.ts
 * 
 * Utilities to transform simulation results into chart-ready data formats.
 * These functions bridge the gap between our simulation library and Recharts.
 */

import type {
  MonteCarloResult,
  HistoricalSimulationResult,
  HistoricalRun,
} from './index';

/**
 * Chart data point for net worth over time
 */
export interface NetWorthChartDataPoint {
  year: number;
  age: number;
  netWorth: number;
  phase: 'accumulation' | 'retirement';
  yearLabel: string;
}

/**
 * Create net worth projection data for charting
 * Simulates year-by-year growth manually since we don't have it stored
 */
export function createNetWorthProjection(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
  currentSavings: number,
  annualContribution: number,
  annualExpenses: number,
  expectedReturn: number,
  inflationRate: number = 0.02
): NetWorthChartDataPoint[] {
  const currentYear = new Date().getFullYear();
  const yearsToProject = lifeExpectancy - currentAge;
  const data: NetWorthChartDataPoint[] = [];
  
  let netWorth = currentSavings;
  
  for (let i = 0; i <= yearsToProject; i++) {
    const age = currentAge + i;
    const year = currentYear + i;
    const phase = age < retirementAge ? 'accumulation' : 'retirement';
    
    data.push({
      year,
      age,
      netWorth,
      phase,
      yearLabel: `${year}`,
    });
    
    // Calculate next year's net worth
    if (i < yearsToProject) {
      if (phase === 'accumulation') {
        // Accumulation: add contributions, apply returns
        netWorth = (netWorth + annualContribution) * (1 + expectedReturn);
      } else {
        // Retirement: subtract expenses (inflation-adjusted from retirement year), apply returns
        const yearsIntoRetirement = age - retirementAge;
        const inflationAdjustedExpenses = annualExpenses * Math.pow(1 + inflationRate, yearsIntoRetirement);
        netWorth = (netWorth - inflationAdjustedExpenses) * (1 + expectedReturn);
        netWorth = Math.max(0, netWorth); // Can't go negative
      }
    }
  }
  
  return data;
}

/**
 * Transform Monte Carlo results into histogram data
 * Groups outcomes into bins for visualization
 */
export interface MonteCarloHistogramBin {
  binStart: number;
  binEnd: number;
  binLabel: string;
  count: number;
  percentage: number;
  isSuccess: boolean;
}

export function monteCarloToHistogram(
  result: MonteCarloResult,
  binCount: number = 20
): MonteCarloHistogramBin[] {
  const finalValues = result.simulations.map(sim => sim.finalPortfolio);
  
  const min = Math.min(...finalValues);
  const max = Math.max(...finalValues);
  const binSize = (max - min) / binCount;
  
  const bins: MonteCarloHistogramBin[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binStart = min + (i * binSize);
    const binEnd = binStart + binSize;
    
    const valuesInBin = finalValues.filter(v => v >= binStart && v < binEnd);
    const count = valuesInBin.length;
    const percentage = (count / finalValues.length) * 100;
    
    bins.push({
      binStart,
      binEnd,
      binLabel: formatCurrencyRange(binStart, binEnd),
      count,
      percentage,
      isSuccess: binEnd > 0,
    });
  }
  
  return bins;
}

/**
 * Get percentile data from Monte Carlo results
 */
export interface PercentileData {
  p10: number;
  p25: number;
  p50: number; // median
  p75: number;
  p90: number;
}

export function getMonteCarloPercentiles(result: MonteCarloResult): PercentileData {
  const finalValues = result.simulations
    .map(sim => sim.finalPortfolio)
    .sort((a, b) => a - b);
  
  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * finalValues.length);
    return finalValues[index] || 0;
  };
  
  return {
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
  };
}

/**
 * Transform historical simulation results into chart series
 * Each historical run becomes a line on the chart
 */
export interface HistoricalChartSeries {
  startYear: number;
  data: Array<{
    year: number;
    age: number;
    netWorth: number;
  }>;
  succeeded: boolean;
}

export function historicalToChartData(
  result: HistoricalSimulationResult,
  currentAge: number
): HistoricalChartSeries[] {
  return result.simulations.map((run: HistoricalRun) => {
    // Reconstruct year-by-year data from returns
    const data = [];
    let netWorth = 0; // This would need initial portfolio value passed in
    
    for (let i = 0; i < run.returns.length; i++) {
      netWorth *= (1 + run.returns[i]);
      data.push({
        year: run.startYear + i,
        age: currentAge + i,
        netWorth,
      });
    }
    
    return {
      startYear: run.startYear,
      succeeded: run.success,
      data,
    };
  });
}

/**
 * Aggregate multiple projection scenarios for comparison
 */
export interface ScenarioComparisonData {
  scenarioId: string;
  scenarioName: string;
  yearsToFI: number;
  successRate: number;
  finalNetWorth: number;
  projectionLine: NetWorthChartDataPoint[];
}

/**
 * Format currency range for bin labels
 */
function formatCurrencyRange(start: number, end: number): string {
  const formatValue = (val: number) => {
    if (val === 0) return '$0';
    if (Math.abs(val) >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val.toFixed(0)}`;
  };
  
  return `${formatValue(start)} - ${formatValue(end)}`;
}

/**
 * Downsample data for performance
 * Useful when displaying many years of data
 */
export function downsampleChartData<T extends { year: number }>(
  data: T[],
  maxPoints: number = 100
): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Calculate moving average for smoothing
 */
export function addMovingAverage(
  data: NetWorthChartDataPoint[],
  window: number = 5
): (NetWorthChartDataPoint & { movingAverage: number })[] {
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(window / 2));
    const end = Math.min(data.length, index + Math.ceil(window / 2));
    const slice = data.slice(start, end);
    const average = slice.reduce((sum, p) => sum + p.netWorth, 0) / slice.length;
    
    return {
      ...point,
      movingAverage: average,
    };
  });
}

/**
 * Get summary statistics from chart data
 */
export interface ChartDataSummary {
  min: number;
  max: number;
  average: number;
  median: number;
  finalValue: number;
}

export function getChartDataSummary(
  data: NetWorthChartDataPoint[]
): ChartDataSummary {
  const values = data.map(d => d.netWorth).sort((a, b) => a - b);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: values.reduce((a, b) => a + b, 0) / values.length,
    median: values[Math.floor(values.length / 2)] || 0,
    finalValue: data[data.length - 1]?.netWorth || 0,
  };
}
