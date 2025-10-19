/**
 * ScenarioComparison.tsx
 * 
 * Side-by-side comparison widget for FIRE scenarios.
 * Shows key metrics and visual indicators for 2-3 scenarios.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { scenarioToDisplayFormat, type ScenarioDisplay } from '@/features/scenarios/scenarios.types';
import { runMonteCarloSimulation, type MonteCarloConfig } from '@/lib/sim';
import { formatCurrency } from '@/lib/format';

// Fetch all scenarios for comparison
async function getAllScenarios(): Promise<ScenarioDisplay[]> {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }

  return (data || []).map(scenarioToDisplayFormat);
}

interface ScenarioMetrics {
  yearsToFI: number;
  successRate: number;
  fiNumber: number;
  monthlyRequired: number;
}

export function ScenarioComparison() {
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ['scenarios', 'v2'],
    queryFn: getAllScenarios,
  });

  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [isSelectingScenarios, setIsSelectingScenarios] = useState(false);

  // Calculate metrics for each scenario
  const scenarioMetrics = useMemo((): Map<string, ScenarioMetrics> => {
    const metricsMap = new Map<string, ScenarioMetrics>();

    scenarios.forEach((scenario) => {
      const yearsToFI = Math.max(0, scenario.retirement_age - scenario.current_age);
      const fiNumber = scenario.annual_expenses * 25; // 4% rule
      const monthlyRequired = scenario.annual_contribution / 12;

      // Calculate success rate via Monte Carlo
      let successRate = 0;
      try {
        const retirementYears = scenario.life_expectancy - scenario.retirement_age;
        const withdrawalRate = scenario.annual_expenses / scenario.current_savings || 0.04;

        const mcConfig: MonteCarloConfig = {
          numSimulations: 100,
          retirementYears,
          initialPortfolio: scenario.current_savings,
          annualWithdrawal: scenario.withdrawal_strategy === 'percentage' ? undefined : scenario.annual_expenses,
          withdrawalRate: scenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
          withdrawalStrategy: scenario.withdrawal_strategy,
          expectedReturnMean: scenario.expected_return_mean,
          expectedReturnStdev: scenario.expected_return_stdev,
          inflationRate: scenario.inflation_rate,
        };

        const result = runMonteCarloSimulation(mcConfig);
        successRate = result.successRate * 100;
      } catch (error) {
        console.error('Error calculating success rate:', error);
      }

      metricsMap.set(scenario.id, {
        yearsToFI,
        successRate,
        fiNumber,
        monthlyRequired,
      });
    });

    return metricsMap;
  }, [scenarios]);

  // Get selected scenarios
  const selectedScenarios = useMemo(() => {
    return scenarios.filter(s => selectedScenarioIds.includes(s.id));
  }, [scenarios, selectedScenarioIds]);

  // Determine best/worst for each metric
  const getBestWorstIndicators = useMemo(() => {
    if (selectedScenarios.length < 2) return null;

    const metrics = selectedScenarios.map(s => ({
      id: s.id,
      yearsToFI: scenarioMetrics.get(s.id)?.yearsToFI || 0,
      successRate: scenarioMetrics.get(s.id)?.successRate || 0,
      fiNumber: scenarioMetrics.get(s.id)?.fiNumber || 0,
      monthlyRequired: scenarioMetrics.get(s.id)?.monthlyRequired || 0,
    }));

    const minYears = Math.min(...metrics.map(m => m.yearsToFI));
    const maxSuccess = Math.max(...metrics.map(m => m.successRate));
    const minFI = Math.min(...metrics.map(m => m.fiNumber));
    const minMonthly = Math.min(...metrics.map(m => m.monthlyRequired));

    return {
      bestYearsToFI: metrics.find(m => m.yearsToFI === minYears)?.id,
      bestSuccessRate: metrics.find(m => m.successRate === maxSuccess)?.id,
      bestFINumber: metrics.find(m => m.fiNumber === minFI)?.id,
      bestMonthlyRequired: metrics.find(m => m.monthlyRequired === minMonthly)?.id,
    };
  }, [selectedScenarios, scenarioMetrics]);

  const handleToggleScenario = (scenarioId: string) => {
    if (selectedScenarioIds.includes(scenarioId)) {
      setSelectedScenarioIds(selectedScenarioIds.filter(id => id !== scenarioId));
    } else {
      if (selectedScenarioIds.length < 3) {
        setSelectedScenarioIds([...selectedScenarioIds, scenarioId]);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (scenarios.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">⚖️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
        </div>
        <p className="text-sm text-gray-500">
          Create at least 2 scenarios to compare different FIRE strategies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">⚖️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
            <p className="text-sm text-gray-500">
              {selectedScenarios.length === 0
                ? 'Select 2-3 scenarios to compare'
                : `Comparing ${selectedScenarios.length} scenario${selectedScenarios.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsSelectingScenarios(!isSelectingScenarios)}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
        >
          {isSelectingScenarios ? 'Done' : 'Select Scenarios'}
        </button>
      </div>

      {/* Scenario Selection */}
      {isSelectingScenarios && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Select 2-3 scenarios to compare (max 3):
          </p>
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <label
                key={scenario.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedScenarioIds.includes(scenario.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${
                  !selectedScenarioIds.includes(scenario.id) && selectedScenarioIds.length >= 3
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedScenarioIds.includes(scenario.id)}
                  onChange={() => handleToggleScenario(scenario.id)}
                  disabled={!selectedScenarioIds.includes(scenario.id) && selectedScenarioIds.length >= 3}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{scenario.name}</p>
                  <p className="text-xs text-gray-500">
                    {scenario.current_age} → {scenario.retirement_age} years old
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {selectedScenarios.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Metric</th>
                {selectedScenarios.map((scenario) => (
                  <th key={scenario.id} className="text-center py-3 px-4">
                    <div className="text-sm font-semibold text-gray-900">{scenario.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{scenario.withdrawal_strategy}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Years to FI */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Years to FI</div>
                  <div className="text-xs text-gray-500">Time until retirement</div>
                </td>
                {selectedScenarios.map((scenario) => {
                  const metrics = scenarioMetrics.get(scenario.id);
                  const isBest = getBestWorstIndicators?.bestYearsToFI === scenario.id;
                  return (
                    <td key={scenario.id} className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isBest ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                      }`}>
                        {isBest && <span className="text-green-600">🏆</span>}
                        <span className={`text-lg font-bold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {metrics?.yearsToFI.toFixed(0)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Success Rate */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Success Rate</div>
                  <div className="text-xs text-gray-500">Monte Carlo probability</div>
                </td>
                {selectedScenarios.map((scenario) => {
                  const metrics = scenarioMetrics.get(scenario.id);
                  const isBest = getBestWorstIndicators?.bestSuccessRate === scenario.id;
                  return (
                    <td key={scenario.id} className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isBest ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                      }`}>
                        {isBest && <span className="text-green-600">🏆</span>}
                        <span className={`text-lg font-bold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {metrics?.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* FI Number */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">FI Number</div>
                  <div className="text-xs text-gray-500">25x annual expenses</div>
                </td>
                {selectedScenarios.map((scenario) => {
                  const metrics = scenarioMetrics.get(scenario.id);
                  const isBest = getBestWorstIndicators?.bestFINumber === scenario.id;
                  return (
                    <td key={scenario.id} className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isBest ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                      }`}>
                        {isBest && <span className="text-green-600">🏆</span>}
                        <span className={`text-sm font-bold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {formatCurrency(metrics?.fiNumber || 0)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Monthly Savings Required */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Monthly Savings</div>
                  <div className="text-xs text-gray-500">Required contribution</div>
                </td>
                {selectedScenarios.map((scenario) => {
                  const metrics = scenarioMetrics.get(scenario.id);
                  const isBest = getBestWorstIndicators?.bestMonthlyRequired === scenario.id;
                  return (
                    <td key={scenario.id} className="py-4 px-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isBest ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                      }`}>
                        {isBest && <span className="text-green-600">🏆</span>}
                        <span className={`text-sm font-bold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {formatCurrency(metrics?.monthlyRequired || 0)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Current Age */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Current Age</div>
                </td>
                {selectedScenarios.map((scenario) => (
                  <td key={scenario.id} className="py-4 px-4 text-center">
                    <span className="text-sm text-gray-700">{scenario.current_age}</span>
                  </td>
                ))}
              </tr>

              {/* Retirement Age */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Retirement Age</div>
                </td>
                {selectedScenarios.map((scenario) => (
                  <td key={scenario.id} className="py-4 px-4 text-center">
                    <span className="text-sm text-gray-700">{scenario.retirement_age}</span>
                  </td>
                ))}
              </tr>

              {/* Expected Return */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Expected Return</div>
                </td>
                {selectedScenarios.map((scenario) => (
                  <td key={scenario.id} className="py-4 px-4 text-center">
                    <span className="text-sm text-gray-700">
                      {(scenario.expected_return_mean * 100).toFixed(1)}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Stock Allocation */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Stock Allocation</div>
                </td>
                {selectedScenarios.map((scenario) => (
                  <td key={scenario.id} className="py-4 px-4 text-center">
                    <span className="text-sm text-gray-700">
                      {(scenario.portfolio_stock_pct * 100).toFixed(0)}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Annual Expenses */}
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">Annual Expenses</div>
                </td>
                {selectedScenarios.map((scenario) => (
                  <td key={scenario.id} className="py-4 px-4 text-center">
                    <span className="text-sm text-gray-700">
                      {formatCurrency(scenario.annual_expenses)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {selectedScenarios.length === 0 && !isSelectingScenarios && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚖️</div>
          <p className="text-gray-600 mb-4">No scenarios selected for comparison</p>
          <button
            onClick={() => setIsSelectingScenarios(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Select Scenarios to Compare
          </button>
        </div>
      )}

      {/* Legend */}
      {selectedScenarios.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-green-600">🏆</span>
            <span>= Best value for this metric</span>
            <span className="ml-4 text-gray-400">|</span>
            <span className="ml-2">Lower is better for Years to FI, FI Number, and Monthly Savings</span>
          </div>
        </div>
      )}
    </div>
  );
}
