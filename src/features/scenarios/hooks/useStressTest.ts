/**
 * useStressTest.ts
 * 
 * React hook for running stress tests on FIRE projections
 */

import { useMemo, useState } from 'react';
import { FIProjectionInputs } from '../../../lib/sim/projection';
import { MarketCrashScenario, StressTestResult, runStressTest, PRESET_CRASH_SCENARIOS } from '../../../lib/sim/stress-test';

export interface UseStressTestOptions {
  inputs: FIProjectionInputs;
  scenario: MarketCrashScenario;
  enabled?: boolean;
}

export function useStressTest({ inputs, scenario, enabled = true }: UseStressTestOptions) {
  const [isRunning, setIsRunning] = useState(false);

  const result = useMemo<StressTestResult | null>(() => {
    if (!enabled) return null;

    setIsRunning(true);
    try {
      const testResult = runStressTest(inputs, scenario);
      return testResult;
    } finally {
      setIsRunning(false);
    }
  }, [inputs, scenario, enabled]);

  return {
    result,
    isRunning,
  };
}

/**
 * Hook to manage multiple stress test scenarios
 */
export function useMultipleStressTests(inputs: FIProjectionInputs) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([
    '2008_FINANCIAL_CRISIS',
    'DOT_COM_CRASH',
    'COVID_CRASH',
  ]);

  const results = useMemo(() => {
    const testResults: Record<string, StressTestResult> = {};

    for (const scenarioKey of selectedScenarios) {
      const scenario = PRESET_CRASH_SCENARIOS[scenarioKey];
      if (scenario) {
        testResults[scenarioKey] = runStressTest(inputs, scenario);
      }
    }

    return testResults;
  }, [inputs, selectedScenarios]);

  return {
    results,
    selectedScenarios,
    setSelectedScenarios,
    presetScenarios: PRESET_CRASH_SCENARIOS,
  };
}
