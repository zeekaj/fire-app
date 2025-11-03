/**
 * SpendingTrendsChart Component
 * 
 * Line chart showing spending and income trends over the last 6 months.
 */

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { formatCurrency } from '@/lib/format';
import { useSpendingTrends } from '../hooks/useSpendingTrends';

export function SpendingTrendsChart() {
  const { data: transactions = [] } = useTransactions(500);
  const trends = useSpendingTrends(6);

  // For the line chart, keep the old chartData logic
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; spending: number; income: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthTransactions = transactions.filter(tx => tx.date.startsWith(monthKey));
      const spending = monthTransactions.reduce((sum, tx) => tx.amount < 0 ? sum + Math.abs(tx.amount) : sum, 0);
      const income = monthTransactions.reduce((sum, tx) => tx.amount > 0 ? sum + tx.amount : sum, 0);
      months.push({
        month: monthLabel,
        spending,
        income,
        savings: income - spending,
      });
    }
    return months;
  }, [transactions]);

  const hasData = chartData.some(d => d.spending > 0 || d.income > 0);

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No transaction data yet. Add some transactions to see trends!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>

      {/* Summary Insight */}
      <div className="mb-4">
        <div className="text-sm text-gray-700 font-medium">
          {trends.summary}
        </div>
      </div>

      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#2BB673"
              strokeWidth={2}
              dot={{ fill: '#2BB673', r: 4 }}
              activeDot={{ r: 6 }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="spending"
              stroke="#D64550"
              strokeWidth={2}
              dot={{ fill: '#D64550', r: 4 }}
              activeDot={{ r: 6 }}
              name="Spending"
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#2E86AB"
              strokeWidth={2}
              dot={{ fill: '#2E86AB', r: 4 }}
              activeDot={{ r: 6 }}
              name="Savings"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Increases</h4>
          {trends.topIncreases.length === 0 ? (
            <div className="text-xs text-gray-400">No significant increases.</div>
          ) : (
            <ul className="space-y-2">
              {trends.topIncreases.map((cat) => (
                <li key={cat.categoryId} className="bg-red-50 border-l-4 border-red-400 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-800">{cat.categoryName}</span>
                    <span className="text-xs font-semibold text-red-600">+{cat.percentChange.toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatCurrency(cat.thisMonthAmount)} this month
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Decreases</h4>
          {trends.topDecreases.length === 0 ? (
            <div className="text-xs text-gray-400">No significant decreases.</div>
          ) : (
            <ul className="space-y-2">
              {trends.topDecreases.map((cat) => (
                <li key={cat.categoryId} className="bg-green-50 border-l-4 border-green-400 rounded p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">{cat.categoryName}</span>
                    <span className="text-xs font-semibold text-green-600">{cat.percentChange.toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatCurrency(cat.thisMonthAmount)} this month
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
