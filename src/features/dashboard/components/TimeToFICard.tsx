/**
 * TimeToFICard.tsx
 * 
 * A "dumb" presentational component for displaying Time to FI data.
 * It receives all data via props and is responsible for rendering the UI.
 */
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { format, addYears } from 'date-fns';
import { formatCurrency } from '@/lib/format';

interface ProjectionPoint {
  year: number;
  value: number;
}

interface OnTrackStatus {
  status: 'ahead' | 'behind' | 'on-track';
  variance: number;
  percentVariance: number;
}

interface TimeToFICardProps {
  title: string;
  yearsToFI: number;
  fiNumber: number;
  remainingNeeded: number;
  currentProgress: number;
  projectionData: ProjectionPoint[];
  annualSavings: number;
  successProbability?: number | null;
  onTrackStatus?: OnTrackStatus | null;
  isLoading: boolean;
  error?: Error | null;
}

export function TimeToFICard({
  title,
  yearsToFI,
  fiNumber,
  remainingNeeded,
  currentProgress,
  projectionData,
  annualSavings,
  successProbability,
  onTrackStatus,
  isLoading,
  error,
}: TimeToFICardProps) {

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Calculating your projection...</p>
        <div className="mt-4 h-32 w-full bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold">Error calculating projection</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const projectedFIDate = addYears(new Date(), yearsToFI);

  // Determine color based on years to FI
  const getYearsColor = (years: number) => {
    if (years <= 0) return 'text-green-600';
    if (years <= 10) return 'text-green-500';
    if (years <= 20) return 'text-yellow-500';
    if (years <= 30) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    if (probability >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  };

  const getOnTrackStatusDisplay = (status: string) => {
    switch (status) {
      case 'ahead':
        return { icon: '📈', text: 'Ahead of Plan', color: 'text-green-600' };
      case 'behind':
        return { icon: '📉', text: 'Behind Plan', color: 'text-red-600' };
      default:
        return { icon: '🎯', text: 'On Track', color: 'text-blue-600' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {successProbability !== null && typeof successProbability !== 'undefined' && (
          <div className={`px-2 py-1 rounded text-xs font-semibold border ${getSuccessProbabilityColor(successProbability).bg} ${getSuccessProbabilityColor(successProbability).text} ${getSuccessProbabilityColor(successProbability).border}`}>
            {successProbability.toFixed(0)}% Success
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Years to FI with mini chart */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Years to FI</p>
          <div className="flex items-end gap-4">
            <p className={`text-4xl font-bold ${getYearsColor(yearsToFI)}`}>
              {yearsToFI === Infinity
                ? '∞'
                : yearsToFI <= 0
                ? 'FI!'
                : yearsToFI.toFixed(1)}
            </p>
            {projectionData.length > 0 && (
              <div className="flex-1" style={{ height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {yearsToFI > 0 && yearsToFI < Infinity && (
            <p className="text-sm text-gray-600 mt-1">Expected: {format(projectedFIDate, 'MMMM yyyy')}</p>
          )}
        </div>

        {/* On-Track Status */}
        {onTrackStatus && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">{getOnTrackStatusDisplay(onTrackStatus.status).icon}</span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${getOnTrackStatusDisplay(onTrackStatus.status).color}`}>
                {getOnTrackStatusDisplay(onTrackStatus.status).text}
              </p>
              <p className="text-xs text-gray-600">
                {onTrackStatus.variance >= 0 ? '+' : ''}
                {formatCurrency(onTrackStatus.variance)} vs scenario
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{currentProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getProgressColor(currentProgress)} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(currentProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600">FI Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(fiNumber)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Remaining Needed</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(remainingNeeded)}
            </p>
          </div>
        </div>

        {/* Warning if not saving */}
        {annualSavings <= 0 && currentProgress < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You need to save money to reach FI. Current savings: {formatCurrency(annualSavings)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
