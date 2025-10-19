/**
 * MonteCarloDistribution.tsx
 * 
 * Visualizes the distribution of Monte Carlo simulation outcomes.
 * Shows probability density of final portfolio values with percentiles.
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { runMonteCarloSimulation, type MonteCarloConfig } from '@/lib/sim';
import { useSelectedScenario } from '../hooks/useSelectedScenario';

export function MonteCarloDistribution() {
  const { selectedScenario } = useSelectedScenario();

  // Run Monte Carlo simulation
  const simulationResult = useMemo(() => {
    if (!selectedScenario) return null;

    const yearsToRetirement = Math.max(0, selectedScenario.retirement_age - selectedScenario.current_age);
    let projectedNetWorth = selectedScenario.current_savings;
    for (let i = 0; i < yearsToRetirement; i++) {
      projectedNetWorth = (projectedNetWorth + selectedScenario.annual_contribution) * (1 + selectedScenario.expected_return_mean);
    }

    const retirementYears = selectedScenario.life_expectancy - selectedScenario.retirement_age;
    const withdrawalRate = selectedScenario.annual_expenses / projectedNetWorth || 0.04;

    const mcConfig: MonteCarloConfig = {
      numSimulations: 500, // More simulations for better distribution
      retirementYears,
      initialPortfolio: projectedNetWorth,
      annualWithdrawal: selectedScenario.withdrawal_strategy === 'percentage' ? undefined : selectedScenario.annual_expenses,
      withdrawalRate: selectedScenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
      withdrawalStrategy: selectedScenario.withdrawal_strategy,
      expectedReturnMean: selectedScenario.expected_return_mean,
      expectedReturnStdev: selectedScenario.expected_return_stdev,
      inflationRate: selectedScenario.inflation_rate,
    };

    return runMonteCarloSimulation(mcConfig);
  }, [selectedScenario]);

  // Create distribution histogram data
  const distributionData = useMemo(() => {
    if (!simulationResult) return [];

    // Get final portfolio values and sort
    const finalValues = simulationResult.simulations
      .map(s => s.finalPortfolio)
      .sort((a, b) => a - b);

    // Create bins for histogram
    const numBins = 30;
    const min = Math.min(...finalValues);
    const max = Math.max(...finalValues);
    const binSize = (max - min) / numBins;

    const bins: { value: number; count: number; probability: number }[] = [];
    
    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = finalValues.filter(v => v >= binStart && v < binEnd).length;
      
      bins.push({
        value: binStart / 1000, // Convert to thousands for display
        count,
        probability: (count / finalValues.length) * 100,
      });
    }

    return bins;
  }, [simulationResult]);

  // Calculate percentiles
  const percentiles = useMemo(() => {
    if (!simulationResult) return null;

    const sorted = simulationResult.simulations
      .map(s => s.finalPortfolio)
      .sort((a, b) => a - b);

    const getPercentile = (p: number) => {
      const index = Math.floor((p / 100) * sorted.length);
      return sorted[index];
    };

    return {
      p10: getPercentile(10),
      p50: getPercentile(50),
      p90: getPercentile(90),
    };
  }, [simulationResult]);

  if (!selectedScenario) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Monte Carlo Distribution
        </h3>
        <p className="text-sm text-gray-600">
          Select a FIRE scenario to see the distribution of possible outcomes.
        </p>
      </div>
    );
  }

  if (!simulationResult) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Monte Carlo Distribution
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Distribution of final portfolio values ({simulationResult.simulations.length} simulations)
          </p>
        </div>
        <div className={`px-3 py-1 rounded text-sm font-semibold ${
          simulationResult.successRate >= 0.8 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : simulationResult.successRate >= 0.5
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {(simulationResult.successRate * 100).toFixed(0)}% Success
        </div>
      </div>

      {/* Percentiles */}
      {percentiles && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-xs text-red-700 font-medium">10th Percentile</p>
            <p className="text-lg font-bold text-red-700">
              ${(percentiles.p10 / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-red-600">Worst case</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-xs text-blue-700 font-medium">Median (50th)</p>
            <p className="text-lg font-bold text-blue-700">
              ${(percentiles.p50 / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-blue-600">Expected</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-xs text-green-700 font-medium">90th Percentile</p>
            <p className="text-lg font-bold text-green-700">
              ${(percentiles.p90 / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-green-600">Best case</p>
          </div>
        </div>
      )}

      {/* Distribution Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={distributionData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="value"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${value.toFixed(0)}K`}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900">
                      ${(data.value).toFixed(0)}K
                    </p>
                    <p className="text-sm text-blue-600">
                      {data.probability.toFixed(1)}% of outcomes
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {data.count} simulations
                    </p>
                  </div>
                );
              }}
            />
            <defs>
              <linearGradient id="distributionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="probability"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#distributionGradient)"
              isAnimationActive={false}
            />
            {percentiles && (
              <>
                <ReferenceLine
                  x={percentiles.p10 / 1000}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'P10', position: 'top', fill: '#ef4444', fontSize: 10 }}
                />
                <ReferenceLine
                  x={percentiles.p50 / 1000}
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  label={{ value: 'Median', position: 'top', fill: '#3b82f6', fontSize: 10 }}
                />
                <ReferenceLine
                  x={percentiles.p90 / 1000}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: 'P90', position: 'top', fill: '#10b981', fontSize: 10 }}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          This shows the range of possible final portfolio values at age {selectedScenario.life_expectancy} based on {simulationResult.simulations.length} simulations.
          Success is defined as having money remaining at the end of your projected lifespan.
        </p>
      </div>
    </div>
  );
}
