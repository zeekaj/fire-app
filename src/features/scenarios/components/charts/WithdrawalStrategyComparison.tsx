/**
 * WithdrawalStrategyComparison.tsx
 * 
 * Compares different withdrawal strategies (Fixed vs Guardrails) side-by-side.
 * Shows how dynamic withdrawals can improve portfolio longevity.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { runMonteCarloSimulation, type MonteCarloConfig } from '@/lib/sim';

interface WithdrawalStrategyComparisonProps {
  retirementYears: number;
  initialPortfolio: number;
  annualWithdrawal: number;
  expectedReturnMean: number;
  expectedReturnStdev: number;
  inflationRate: number;
  height?: number;
}

export function WithdrawalStrategyComparison({
  retirementYears,
  initialPortfolio,
  annualWithdrawal,
  expectedReturnMean,
  expectedReturnStdev,
  inflationRate,
  height = 400,
}: WithdrawalStrategyComparisonProps) {
  
  // Run simulations for both strategies
  const { fixedResult, guardrailsResult } = useMemo(() => {
    const baseConfig = {
      numSimulations: 1000,
      retirementYears,
      initialPortfolio,
      expectedReturnMean,
      expectedReturnStdev,
      inflationRate,
    };

    const fixedResult = runMonteCarloSimulation({
      ...baseConfig,
      withdrawalStrategy: 'fixed',
      annualWithdrawal,
    } as MonteCarloConfig);

    const guardrailsResult = runMonteCarloSimulation({
      ...baseConfig,
      withdrawalStrategy: 'guardrails',
      annualWithdrawal,
    } as MonteCarloConfig);

    return { fixedResult, guardrailsResult };
  }, [retirementYears, initialPortfolio, annualWithdrawal, expectedReturnMean, expectedReturnStdev, inflationRate]);

  // Comparison data for bar chart
  const comparisonData = [
    {
      metric: 'Success Rate',
      Fixed: fixedResult.successRate * 100,
      Guardrails: guardrailsResult.successRate * 100,
    },
    {
      metric: 'Median Final',
      Fixed: fixedResult.medianFinalPortfolio / 1000,
      Guardrails: guardrailsResult.medianFinalPortfolio / 1000,
    },
    {
      metric: '10th Percentile',
      Fixed: fixedResult.percentile10FinalPortfolio / 1000,
      Guardrails: guardrailsResult.percentile10FinalPortfolio / 1000,
    },
  ];

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const metric = payload[0].payload.metric;
    const isPercentage = metric === 'Success Rate';
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {metric}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {isPercentage 
                ? `${entry.value.toFixed(1)}%` 
                : formatCurrency(entry.value * 1000)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  const successRateDiff = (guardrailsResult.successRate - fixedResult.successRate) * 100;
  const medianDiff = guardrailsResult.medianFinalPortfolio - fixedResult.medianFinalPortfolio;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Withdrawal Strategy Comparison
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Fixed withdrawals vs. Dynamic guardrails strategy
        </p>
      </div>

      {/* Comparison Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          
          <XAxis
            dataKey="metric"
            className="text-gray-700 dark:text-gray-300"
          />
          
          <YAxis
            className="text-gray-700 dark:text-gray-300"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
          />

          <Bar 
            dataKey="Fixed" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]}
            name="Fixed Withdrawal"
          />
          <Bar 
            dataKey="Guardrails" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
            name="Dynamic Guardrails"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed Comparison Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fixed Strategy */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
              Fixed Withdrawal
            </h4>
            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
              Conservative
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-700 dark:text-red-300">Success Rate</span>
              <span className="font-medium text-red-900 dark:text-red-100">
                {(fixedResult.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-700 dark:text-red-300">Median Final</span>
              <span className="font-medium text-red-900 dark:text-red-100">
                {formatCurrency(fixedResult.medianFinalPortfolio)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-700 dark:text-red-300">10th Percentile</span>
              <span className="font-medium text-red-900 dark:text-red-100">
                {formatCurrency(fixedResult.percentile10FinalPortfolio)}
              </span>
            </div>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-3">
            Withdraws same amount every year, inflation-adjusted
          </p>
        </div>

        {/* Guardrails Strategy */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-200">
              Dynamic Guardrails
            </h4>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
              Adaptive
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Success Rate</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {(guardrailsResult.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Median Final</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {formatCurrency(guardrailsResult.medianFinalPortfolio)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">10th Percentile</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {formatCurrency(guardrailsResult.percentile10FinalPortfolio)}
              </span>
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-3">
            Adjusts withdrawals based on portfolio performance
          </p>
        </div>
      </div>

      {/* Summary Insight */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">💡</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Strategy Comparison
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {successRateDiff > 0 ? (
                <>
                  Guardrails strategy improves success rate by <strong>{successRateDiff.toFixed(1)}%</strong> 
                  {medianDiff > 0 && ` and increases median final portfolio by ${formatCurrency(medianDiff)}`}.
                  Dynamic adjustments help preserve capital during downturns while allowing higher withdrawals in good times.
                </>
              ) : successRateDiff < 0 ? (
                <>
                  Fixed strategy shows <strong>{Math.abs(successRateDiff).toFixed(1)}%</strong> higher success rate.
                  This scenario may benefit from predictable withdrawals.
                </>
              ) : (
                <>
                  Both strategies show similar success rates. Consider personal preference for withdrawal consistency vs. flexibility.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
