/**
 * BudgetOverviewChart Component
 * 
 * Horizontal bar chart showing budget progress for all categories at a glance.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface BudgetData {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

interface BudgetOverviewChartProps {
  budgets: BudgetData[];
}

export function BudgetOverviewChart({ budgets }: BudgetOverviewChartProps) {
  const chartData = useMemo(() => {
    return budgets
      .map(b => ({
        name: b.category.length > 20 ? b.category.substring(0, 20) + '...' : b.category,
        fullName: b.category,
        budgeted: b.budgeted,
        spent: b.spent,
        percentUsed: b.budgeted > 0 ? (b.spent / b.budgeted) * 100 : 0,
      }))
      .sort((a, b) => b.percentUsed - a.percentUsed); // Sort by most over budget first
  }, [budgets]);

  if (chartData.length === 0) {
    return null;
  }

  const getBarColor = (percentUsed: number) => {
    if (percentUsed >= 100) return '#D64550'; // danger
    if (percentUsed >= 90) return '#F2C14E'; // warning
    if (percentUsed >= 75) return '#F59E0B'; // amber
    return '#2BB673'; // success
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
            <XAxis 
              type="number"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'spent') {
                  const percent = props.payload.percentUsed.toFixed(1);
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div>{formatCurrency(value)} spent</div>
                      <div className="text-gray-500">
                        {formatCurrency(props.payload.budgeted)} budgeted
                      </div>
                      <div className="font-semibold">{percent}% used</div>
                    </div>,
                    ''
                  ];
                }
                return [formatCurrency(value), name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
            />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentUsed)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2BB673' }} />
          <span className="text-gray-600">On track (&lt;75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-gray-600">Caution (75-90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F2C14E' }} />
          <span className="text-gray-600">Warning (90-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#D64550' }} />
          <span className="text-gray-600">Over budget (≥100%)</span>
        </div>
      </div>
    </div>
  );
}
