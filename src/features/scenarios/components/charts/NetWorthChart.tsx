/**
 * NetWorthChart.tsx
 * 
 * Displays a line chart showing projected net worth over time.
 * Shows accumulation phase (before retirement) and retirement phase with different styling.
 * Uses the createNetWorthProjection transformer to generate chart data.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { createNetWorthProjection } from '@/lib/sim/chartDataTransformers';
import type { ScenarioDisplay } from '../../scenarios.types';

interface NetWorthChartProps {
  scenario: ScenarioDisplay;
  height?: number;
}

export function NetWorthChart({ scenario, height = 400 }: NetWorthChartProps) {
  const chartData = useMemo(() => {
    return createNetWorthProjection(
      scenario.current_age,
      scenario.retirement_age,
      scenario.life_expectancy,
      scenario.current_savings,
      scenario.annual_contribution,
      scenario.annual_expenses,
      scenario.expected_return_mean,
      scenario.inflation_rate
    );
  }, [scenario]);

  // Find retirement year for reference line
  const retirementYear = scenario.retirement_age - scenario.current_age;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {data.yearLabel} (Age {data.age})
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          Net Worth: {formatCurrency(data.netWorth)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
          {data.phase}
        </p>
      </div>
    );
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Format Y-axis
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Net Worth Projection
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Expected portfolio growth over time ({(scenario.expected_return_mean * 100).toFixed(1)}% return, {(scenario.inflation_rate * 100).toFixed(1)}% inflation)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          
          <XAxis
            dataKey="year"
            label={{ value: 'Years from Now', position: 'insideBottom', offset: -5 }}
            className="text-gray-700 dark:text-gray-300"
          />
          
          <YAxis
            tickFormatter={formatYAxis}
            label={{ value: 'Net Worth', angle: -90, position: 'insideLeft' }}
            className="text-gray-700 dark:text-gray-300"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Reference line at retirement */}
          <ReferenceLine
            x={retirementYear}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: 'Retirement',
              position: 'top',
              fill: '#ef4444',
              fontSize: 12,
            }}
          />

          {/* Line with different colors for accumulation vs retirement */}
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Net Worth"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary stats below chart */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Current</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(scenario.current_savings)}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">At Retirement</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(chartData[retirementYear]?.netWorth || 0)}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">At Age {scenario.life_expectancy}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(chartData[chartData.length - 1]?.netWorth || 0)}
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Years to Retirement</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {scenario.retirement_age - scenario.current_age}
          </p>
        </div>
      </div>
    </div>
  );
}
