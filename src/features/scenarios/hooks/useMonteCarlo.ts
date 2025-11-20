/**
 * useMonteCarlo.ts
 *
 * Hook for running Monte Carlo simulations for FIRE scenarios.
 */

import { useState, useRef, useCallback } from 'react';
import type { ScenarioDisplay } from '../scenarios.types';

interface MonteCarloResult {
  success_rate: number;
  median_balance: number;
  percentile_10: number;
  percentile_90: number;
  results: Array<{
    success: boolean;
    final_balance: number;
    years_to_depletion?: number;
  }>;
}

export function useMonteCarlo() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const runSimulation = useCallback((scenario: ScenarioDisplay, numSimulations = 1000) => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    setIsRunning(true);
    setResult(null);

    const worker = new Worker(new URL('../monte-carlo.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.postMessage({
      params: {
        current_age: scenario.current_age,
        retirement_age: scenario.retirement_age,
        life_expectancy: scenario.life_expectancy,
        current_savings: scenario.current_savings,
        annual_contribution: scenario.annual_contribution,
        annual_expenses: scenario.annual_expenses,
        portfolio_stock_pct: scenario.portfolio_stock_pct,
        expected_return_mean: scenario.expected_return_mean,
        expected_return_stdev: scenario.expected_return_stdev,
        inflation_rate: scenario.inflation_rate,
        withdrawal_strategy: scenario.withdrawal_strategy,
      },
      numSimulations,
    });

    worker.onmessage = (e: MessageEvent<MonteCarloResult>) => {
      setResult(e.data);
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (error) => {
      console.error('Monte Carlo worker error:', error);
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const cancelSimulation = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  return {
    runSimulation,
    cancelSimulation,
    isRunning,
    result,
  };
}