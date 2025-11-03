/**
 * IncomeExpensesChart Component
 * 
 * Visual comparison of monthly income vs expenses with trend analysis
 */

import { useMemo } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useIncomeExpenses } from '../hooks/useIncomeExpenses';
import { formatCurrency } from '@/lib/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function IncomeExpensesChart() {
  const { data, isLoading, error } = useIncomeExpenses();

  // Prepare chart data (12 months)
  const chartData = useMemo(() => {
    if (!data) return [];
    // Generate last 12 months
    const now = new Date();
    const months: { month: string; income: number; expenses: number; net: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      // Try to find the month in last6Months, fallback to zeroes
      const monthData = data.last6Months.find(m => m.month === monthKey) || {
        month: monthKey,
        monthLabel,
        income: 0,
        expenses: 0,
        netIncome: 0,
        savingsRate: 0,
        transactionCount: 0,
      };
      months.push({
        month: monthLabel,
        income: monthData.income,
        expenses: monthData.expenses,
        net: monthData.netIncome,
      });
    }
    return months;
  }, [data]);

  // Calculate trends
  const trend = useMemo(() => {
    if (!data) return { income: 0, expenses: 0, netIncome: 0 };
    
    const current = data.currentMonth;
    const previous = data.previousMonth;
    
    return {
      income: previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0,
      expenses: previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0,
      netIncome: current.netIncome - previous.netIncome,
    };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.month}</p>
        <div className="space-y-1">
          <p className="text-sm text-green-600">
            <span className="font-medium">Income:</span> {formatCurrency(data.income)}
          </p>
          <p className="text-sm text-red-600">
            <span className="font-medium">Expenses:</span> {formatCurrency(data.expenses)}
          </p>
          <p className="text-sm font-semibold border-t border-gray-200 pt-1 mt-1">
            <span className="font-medium">Net:</span>{' '}
            <span className={data.net >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(data.net)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  // Trend indicator component
  const TrendIndicator = ({ value, type }: { value: number; type: 'income' | 'expenses' }) => {
    const isPositive = type === 'income' ? value > 0 : value < 0; // For expenses, decrease is good
    const isNeutral = Math.abs(value) < 1;
    
    if (isNeutral) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Minus className="w-3 h-3" />
          <span className="text-xs">—</span>
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span className="text-xs font-medium">{Math.abs(value).toFixed(1)}%</span>
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Error loading income/expenses data</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
          <p className="text-sm text-gray-500 mt-1">Monthly cash flow comparison</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Current Month Income */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium uppercase">This Month Income</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(data.currentMonth.income)}
              </p>
            </div>
            <TrendIndicator value={trend.income} type="income" />
          </div>
        </div>

        {/* Current Month Expenses */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700 font-medium uppercase">This Month Expenses</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(data.currentMonth.expenses)}
              </p>
            </div>
            <TrendIndicator value={trend.expenses} type="expenses" />
          </div>
        </div>

        {/* Net Income / Savings */}
        <div className={`rounded-lg p-4 ${
          data.currentMonth.netIncome >= 0 ? 'bg-blue-50' : 'bg-orange-50'
        }`}>
          <div>
            <p className={`text-xs font-medium uppercase ${
              data.currentMonth.netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
              Net Savings
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              data.currentMonth.netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'
            }`}>
              {formatCurrency(data.currentMonth.netIncome)}
            </p>
            <p className={`text-sm mt-1 ${
              data.currentMonth.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {data.currentMonth.savingsRate.toFixed(1)}% savings rate
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10b981"
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#2E86AB"
              strokeWidth={2}
              dot={{ fill: '#2E86AB', r: 4 }}
              name="Net Income"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Year-to-Date Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Year-to-Date Totals</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">YTD Income</p>
            <p className="text-lg font-semibold text-green-600 mt-1">
              {formatCurrency(data.yearToDate.income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">YTD Expenses</p>
            <p className="text-lg font-semibold text-red-600 mt-1">
              {formatCurrency(data.yearToDate.expenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">YTD Net Savings</p>
            <p className={`text-lg font-semibold mt-1 ${
              data.yearToDate.netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {formatCurrency(data.yearToDate.netIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">YTD Savings Rate</p>
            <p className="text-lg font-semibold text-emerald-700 mt-1">
              {data.yearToDate.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
