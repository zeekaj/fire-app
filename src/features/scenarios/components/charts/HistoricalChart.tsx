/**
 * HistoricalChart.tsx
 * 
 * Displays historical backtest simulation results as line charts.
 * Shows multiple historical market sequences to visualize range of outcomes.
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
} from 'recharts';
import type { HistoricalSimulationResult } from '@/lib/sim';

interface HistoricalChartProps {
  result: HistoricalSimulationResult;
  initialPortfolio: number;
  height?: number;
  maxLinesToShow?: number;
}

export function HistoricalChart({ 
  result, 
  initialPortfolio,
  height = 400,
  maxLinesToShow = 10 
}: HistoricalChartProps) {
  
  // Select representative scenarios to display
  const selectedRuns = useMemo(() => {
    const { simulations } = result;
    
    // Sort by final portfolio value
    const sorted = [...simulations].sort((a, b) => a.finalPortfolio - b.finalPortfolio);
    
    const selected = [];
    
    // Add worst case
    selected.push({ ...sorted[0], label: 'Worst Case', color: '#ef4444' });
    
    // Add 10th percentile
    const p10Index = Math.floor(sorted.length * 0.1);
    if (p10Index > 0 && p10Index < sorted.length) {
      selected.push({ ...sorted[p10Index], label: '10th Percentile', color: '#f97316' });
    }
    
    // Add median
    const medianIndex = Math.floor(sorted.length * 0.5);
    selected.push({ ...sorted[medianIndex], label: 'Median', color: '#3b82f6' });
    
    // Add 90th percentile
    const p90Index = Math.floor(sorted.length * 0.9);
    if (p90Index < sorted.length - 1) {
      selected.push({ ...sorted[p90Index], label: '90th Percentile', color: '#22c55e' });
    }
    
    // Add best case
    selected.push({ ...sorted[sorted.length - 1], label: 'Best Case', color: '#10b981' });
    
    // Add a few random samples if we have room
    const remainingSlots = Math.max(0, maxLinesToShow - selected.length);
    const sampleInterval = Math.floor(sorted.length / (remainingSlots + 1));
    
    for (let i = 1; i <= remainingSlots && i * sampleInterval < sorted.length; i++) {
      const idx = i * sampleInterval;
      if (idx > p10Index && idx < p90Index) {
        selected.push({ ...sorted[idx], label: `${sorted[idx].startYear}`, color: '#94a3b8' });
      }
    }
    
    return selected;
  }, [result, maxLinesToShow]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    const maxYears = Math.max(...selectedRuns.map(r => r.returns.length));
    const data = [];
    
    for (let year = 0; year <= maxYears; year++) {
      const dataPoint: any = { year };
      
      selectedRuns.forEach((run, idx) => {
        const key = run.label || `Run ${idx}`;
        
        if (year === 0) {
          dataPoint[key] = initialPortfolio;
        } else if (year <= run.returns.length) {
          // Reconstruct portfolio value at this year
          let portfolioValue = initialPortfolio;
          
          for (let y = 0; y < year; y++) {
            // Simplified reconstruction - would need withdrawal info for accuracy
            portfolioValue = portfolioValue * (1 + run.returns[y]);
          }
          
          dataPoint[key] = Math.max(0, portfolioValue);
        } else {
          dataPoint[key] = null; // Portfolio depleted
        }
      });
      
      data.push(dataPoint);
    }
    
    return data;
  }, [selectedRuns, initialPortfolio]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Year {payload[0].payload.year}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
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
                {entry.value !== null ? formatCurrency(entry.value) : 'Depleted'}
              </span>
            </div>
          ))}
        </div>
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
          Historical Backtest Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Portfolio performance using actual historical market returns ({result.simulations.length} scenarios analyzed)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          
          <XAxis
            dataKey="year"
            label={{ value: 'Years in Retirement', position: 'insideBottom', offset: -5 }}
            className="text-gray-700 dark:text-gray-300"
          />
          
          <YAxis
            tickFormatter={formatYAxis}
            label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
            className="text-gray-700 dark:text-gray-300"
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Render lines for each selected scenario */}
          {selectedRuns.map((run) => {
            const key = run.label || `Run ${run.runId}`;
            const strokeWidth = ['Worst Case', 'Median', 'Best Case'].includes(run.label) ? 2.5 : 1.5;
            const opacity = run.color === '#94a3b8' ? 0.4 : 1;
            
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={run.color}
                strokeWidth={strokeWidth}
                dot={false}
                name={key}
                connectNulls={false}
                opacity={opacity}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(result.successRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {result.simulations.filter(s => s.success).length} / {result.simulations.length} scenarios
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-xs text-red-700 dark:text-red-400">Worst Case</p>
          <p className="text-lg font-semibold text-red-900 dark:text-red-200">
            {formatCurrency(result.percentile10FinalPortfolio)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Started {result.worstCaseStartYear}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs text-blue-700 dark:text-blue-400">Median</p>
          <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">
            {formatCurrency(result.medianFinalPortfolio)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Typical outcome</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-xs text-green-700 dark:text-green-400">Best Case</p>
          <p className="text-lg font-semibold text-green-900 dark:text-green-200">
            {formatCurrency(result.percentile90FinalPortfolio)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Started {result.bestCaseStartYear}
          </p>
        </div>
      </div>

      {/* Insight note */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Historical Context:</strong> This chart uses actual market returns from different historical periods. 
          Each line represents your portfolio's performance if you had retired in a specific year. 
          The worst case typically reflects retiring just before major market downturns (e.g., 1929, 2000, 2008).
        </p>
      </div>
    </div>
  );
}
