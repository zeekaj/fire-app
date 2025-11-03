// Clean implementation replacing corrupted content
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import {
  useNetWorthHistory,
  useCreateNetWorthSnapshot,
  useGenerateHistoricalSnapshots,
  useLatestNetWorthSnapshot,
} from '../hooks/useNetWorthHistory';
import { formatCurrency } from '@/lib/format';
import { ContextualHelp } from '@/components/ContextualHelp';

export type DateRange = '3M' | '6M' | '1Y' | '2Y' | 'ALL';

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded shadow text-xs">
        <div className="font-semibold mb-1">{format(new Date(label), 'MMM yyyy')}</div>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex justify-between">
            <span>{entry.name}:</span>
            <span className="font-bold ml-2">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function NetWorthHistoryChart() {
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Memoize dates to prevent infinite query loops
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start: Date | undefined;
    
    switch (dateRange) {
      case '3M': {
        const d = new Date(end);
        d.setMonth(d.getMonth() - 3);
        start = d;
        break;
      }
      case '6M': {
        const d = new Date(end);
        d.setMonth(d.getMonth() - 6);
        start = d;
        break;
      }
      case '1Y': {
        const d = new Date(end);
        d.setFullYear(d.getFullYear() - 1);
        start = d;
        break;
      }
      case '2Y': {
        const d = new Date(end);
        d.setFullYear(d.getFullYear() - 2);
        start = d;
        break;
      }
      case 'ALL':
      default:
        start = undefined;
    }
    
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const { data, isLoading, error } = useNetWorthHistory(startDate, endDate);
  const createSnapshot = useCreateNetWorthSnapshot();
  const generateHistorical = useGenerateHistoricalSnapshots();
  const { data: latestSnapshotDate } = useLatestNetWorthSnapshot();

  const chartData = data || [];
  const hasData = chartData.length > 0;

  const handleTakeSnapshot = () => {
    // satisfy mutation variable requirement; mutation defaults to today when provided
    createSnapshot.mutate(new Date());
  };
  const handleGenerateHistory = () => {
    const start = startDate ?? new Date(new Date().setFullYear(endDate.getFullYear() - 2));
    generateHistorical.mutate({ startDate: start, endDate, interval: 'monthly' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <ContextualHelp topic="net-worth">
            <h3 className="text-lg font-semibold text-gray-900 cursor-help">Net Worth History</h3>
          </ContextualHelp>
          <p className="text-sm text-gray-500 mt-1">Track your wealth accumulation over time</p>
          <p className="text-xs text-gray-400 mt-1">
            Last snapshot: {latestSnapshotDate ? format(new Date(latestSnapshotDate), 'MMM d, yyyy') : 'None'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['3M', '6M', '1Y', '2Y', 'ALL'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              showBreakdown ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Breakdown
          </button>
          <button
            onClick={handleTakeSnapshot}
            disabled={createSnapshot.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1"
            title="Save today's net worth"
            aria-label="Take snapshot"
          >
            {createSnapshot.isPending ? '...' : '📸'}
            <span className="hidden sm:inline">Snapshot</span>
          </button>
          <button
            onClick={handleGenerateHistory}
            disabled={generateHistorical.isPending}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 inline-flex items-center gap-1"
            title="Backfill historical snapshots"
            aria-label="Backfill history"
          >
            {generateHistorical.isPending ? '...' : '↺'}
            <span className="hidden sm:inline">Backfill</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : error ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">Failed to load net worth history</div>
            <div className="text-gray-500 text-xs">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      ) : !hasData ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No historical data yet</h4>
            <p className="text-sm text-gray-500 max-w-md">
              Start tracking your net worth by taking snapshots. You can also generate historical
              data based on your transaction history.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleTakeSnapshot}
              disabled={createSnapshot.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {createSnapshot.isPending ? 'Saving...' : 'Take First Snapshot'}
            </button>
            <button
              onClick={handleGenerateHistory}
              disabled={generateHistorical.isPending}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {generateHistorical.isPending ? 'Generating...' : 'Generate Historical Data'}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {showBreakdown ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM yyyy')} style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(value) => formatCurrency(value, { compact: true })} style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="assets" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Assets" />
                <Area type="monotone" dataKey="liabilities" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Liabilities" />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM yyyy')} style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(value) => formatCurrency(value, { compact: true })} style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="netWorth" stroke="#2E86AB" strokeWidth={2} dot={{ fill: '#2E86AB', r: 4 }} activeDot={{ r: 6 }} name="Net Worth" />
              </LineChart>
            )}
          </ResponsiveContainer>

          {hasData && chartData.length > 1 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(chartData[chartData.length - 1].netWorth)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Change</p>
                  <p className={`text-lg font-semibold mt-1 ${chartData[chartData.length - 1].netWorth >= chartData[0].netWorth ? 'text-green-600' : 'text-red-600'}`}> 
                    {formatCurrency(chartData[chartData.length - 1].netWorth - chartData[0].netWorth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Growth</p>
                  <p className={`text-lg font-semibold mt-1 ${chartData[chartData.length - 1].netWorth >= chartData[0].netWorth ? 'text-green-600' : 'text-red-600'}`}> 
                    {chartData[0].netWorth !== 0
                      ? `${(((chartData[chartData.length - 1].netWorth - chartData[0].netWorth) / Math.abs(chartData[0].netWorth)) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
