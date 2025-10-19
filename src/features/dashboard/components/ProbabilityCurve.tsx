/**
 * ProbabilityCurve.tsx
 * 
 * Recharts visualization of FIRE success probability vs retirement age.
 * Shows how success probability increases with later retirement dates.
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
import {
  generateProbabilityCurve,
  formatForRecharts,
  type ProbabilityCurveConfig,
} from '@/lib/sim';

interface ProbabilityCurveProps {
  config: ProbabilityCurveConfig;
  title?: string;
  className?: string;
}

export function ProbabilityCurve({ config, title, className = '' }: ProbabilityCurveProps) {
  const curveResult = useMemo(() => {
    return generateProbabilityCurve(config);
  }, [config]);

  const chartData = useMemo(() => {
    return formatForRecharts(curveResult.points);
  }, [curveResult]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900">Age {data.age}</p>
        <p className="text-sm text-gray-600">Year {data.year}</p>
        <p className="text-lg font-bold text-blue-600 mt-1">
          {data.probability}% success
        </p>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title || 'FIRE Probability Curve'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Success probability by retirement age (10,000 Monte Carlo simulations)
        </p>
      </div>

      {/* Key Ages */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-xs text-yellow-700 font-medium">Earliest Viable</p>
          <p className="text-2xl font-bold text-yellow-700">
            {curveResult.earliestViableAge}
          </p>
          <p className="text-xs text-yellow-600">≥50% success</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-700 font-medium">Optimal</p>
          <p className="text-2xl font-bold text-green-700">
            {curveResult.optimalRetirementAge}
          </p>
          <p className="text-xs text-green-600">≥90% success</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-xs text-blue-700 font-medium">Very Safe</p>
          <p className="text-2xl font-bold text-blue-700">
            {curveResult.safeRetirementAge}
          </p>
          <p className="text-xs text-blue-600">≥95% success</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="age"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Retirement Age', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for key thresholds */}
            <ReferenceLine
              y={90}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: '90% (Optimal)', position: 'right', fill: '#10b981', fontSize: 11 }}
            />
            <ReferenceLine
              y={75}
              stroke="#eab308"
              strokeDasharray="3 3"
              label={{ value: '75% (Moderate)', position: 'right', fill: '#eab308', fontSize: 11 }}
            />
            <ReferenceLine
              y={50}
              stroke="#f97316"
              strokeDasharray="3 3"
              label={{ value: '50% (Risky)', position: 'right', fill: '#f97316', fontSize: 11 }}
            />
            
            {/* Reference line for target retirement age */}
            <ReferenceLine
              x={config.minRetirementAge + Math.floor((config.maxRetirementAge - config.minRetirementAge) / 2)}
              stroke="#6b7280"
              strokeDasharray="5 5"
            />

            <Area
              type="monotone"
              dataKey="probability"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#probabilityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Very Safe (≥95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-lime-500"></div>
          <span>Optimal (90-95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Moderate (75-90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Risky (50-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Very Risky (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
}
