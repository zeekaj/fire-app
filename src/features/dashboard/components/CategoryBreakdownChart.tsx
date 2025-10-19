/**
 * CategoryBreakdownChart Component
 * 
 * Pie chart showing spending breakdown by category for the current month.
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import { formatCurrency } from '@/lib/format';

const COLORS = [
  '#E4572E', // primary
  '#2E86AB', // accent
  '#2BB673', // success
  '#F2C14E', // warning
  '#D64550', // danger
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#10B981', // emerald
  '#F59E0B', // amber
  '#6366F1', // indigo
];

export function CategoryBreakdownChart() {
  const { data: transactions = [] } = useTransactions(500);
  const { data: categories = [] } = useCategories();

  const chartData = useMemo(() => {
    // Get current month transactions
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthTransactions = transactions.filter(tx => 
      tx.date.startsWith(currentMonth) && tx.amount < 0
    );

    // Create category lookup
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    // Group by category
    const categoryTotals = new Map<string, number>();
    
    monthTransactions.forEach(tx => {
      const categoryName = tx.category_id ? categoryMap.get(tx.category_id) || 'Uncategorized' : 'Uncategorized';
      const current = categoryTotals.get(categoryName) || 0;
      categoryTotals.set(categoryName, current + Math.abs(tx.amount));
    });

    // Convert to array and sort by amount
    const data = Array.from(categoryTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories

    return data;
  }, [transactions, categories]);

  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Breakdown
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No spending data for this month yet</p>
        </div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Category Breakdown
      </h3>
      <div className="text-sm text-gray-500 mb-4">
        This month's spending: {formatCurrency(total)}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
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
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
