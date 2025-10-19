/**
 * MonteCarloHistogram.tsx
 * 
 * Displays a histogram of Monte Carlo simulation outcomes.
 * Shows the distribution of final portfolio values with success/failure zones.
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
  ReferenceLine,
} from 'recharts';
import { monteCarloToHistogram, getMonteCarloPercentiles } from '@/lib/sim/chartDataTransformers';
import type { MonteCarloResult } from '@/lib/sim';

interface MonteCarloHistogramProps {
  result: MonteCarloResult;
  height?: number;
}

export function MonteCarloHistogram({ result, height = 400 }: MonteCarloHistogramProps) {
  const histogramData = useMemo(() => {
    return monteCarloToHistogram(result, 25); // 25 bins for good granularity
  }, [result]);

  const percentiles = useMemo(() => {
    return getMonteCarloPercentiles(result);
  }, [result]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {data.binLabel}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          Outcomes: {data.count} ({data.percentage.toFixed(1)}%)
        </p>
        <p className={`text-xs mt-1 ${data.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {data.isSuccess ? '✓ Success' : '✗ Failure'}
        </p>
      </div>
    );
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    if (value < 0) {
      return `-$${Math.abs(value).toFixed(0)}`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Custom bar color based on success
  const getBarColor = (entry: any) => {
    return entry.isSuccess ? '#10b981' : '#ef4444'; // green-500 : red-500
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Monte Carlo Simulation Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Distribution of {result.simulations.length.toLocaleString()} possible outcomes at end of retirement
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          
          <XAxis
            dataKey="binLabel"
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-gray-700 dark:text-gray-300"
            tick={{ fontSize: 11 }}
          />
          
          <YAxis
            label={{ value: 'Number of Outcomes', angle: -90, position: 'insideLeft' }}
            className="text-gray-700 dark:text-gray-300"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              if (value === 'count') return 'Outcomes';
              return value;
            }}
          />

          {/* Reference line at zero (failure threshold) */}
          <ReferenceLine
            x={0}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: 'Failure Threshold',
              position: 'top',
              fill: '#ef4444',
              fontSize: 10,
            }}
          />

          {/* Bars with conditional coloring */}
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              const color = getBarColor(payload);
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={color}
                  rx={4}
                  ry={4}
                />
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Percentile Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs text-red-700 dark:text-red-400">10th Percentile</p>
          <p className="text-lg font-semibold text-red-900 dark:text-red-200">
            {formatCurrency(percentiles.p10)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">Worst 10%</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">25th Percentile</p>
          <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
            {formatCurrency(percentiles.p25)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Lower Quartile</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400">Median (50th)</p>
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
            {formatCurrency(percentiles.p50)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Typical Outcome</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-400">75th Percentile</p>
          <p className="text-lg font-semibold text-green-900 dark:text-green-200">
            {formatCurrency(percentiles.p75)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Upper Quartile</p>
        </div>
        
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">90th Percentile</p>
          <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
            {formatCurrency(percentiles.p90)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Best 10%</p>
        </div>
      </div>

      {/* Success Rate Summary */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Success Rate</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Scenarios where portfolio remained positive throughout retirement
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {(result.successRate * 100).toFixed(1)}%
            </p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                result.successRate >= 0.90
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : result.successRate >= 0.75
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {result.successRate >= 0.90
                ? 'Excellent'
                : result.successRate >= 0.75
                ? 'Moderate'
                : 'High Risk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
