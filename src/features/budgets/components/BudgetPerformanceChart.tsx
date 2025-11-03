/**
 * BudgetPerformanceChart Component
 * 
 * Displays budget vs actual spending for each category with visual indicators.
 */

import { useBudgetPerformance } from '../hooks/useBudgetPerformance';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';

interface BudgetPerformanceChartProps {
  month?: string;
}

export function BudgetPerformanceChart({ month = format(new Date(), 'yyyy-MM') }: BudgetPerformanceChartProps) {
  const { data, isLoading, error } = useBudgetPerformance(month);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-gray-500">Loading budget performance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-red-600">Error loading budget performance</div>
      </div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Performance</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No budgets set for this month.</p>
          <p className="text-sm mt-2">Create budgets to track your spending performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Budget Performance</h3>
        <div className="text-sm text-gray-600">
          {format(new Date(month + '-01'), 'MMMM yyyy')}
        </div>
      </div>

      {/* Overall Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Budgeted</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.budgeted)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Spent</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totals.actual)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Remaining</div>
            <div className={`text-lg font-bold ${data.totals.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.totals.remaining)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{data.totals.percentUsed.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                data.totals.percentUsed > 100
                  ? 'bg-red-500'
                  : data.totals.percentUsed > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(data.totals.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {data.categories.map((category) => (
          <div key={category.category_id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">{category.category_name}</div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  {formatCurrency(category.actual)} / {formatCurrency(category.budgeted)}
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.status === 'over'
                      ? 'bg-red-100 text-red-700'
                      : category.status === 'near'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {category.percentUsed.toFixed(0)}%
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  category.status === 'over'
                    ? 'bg-red-500'
                    : category.status === 'near'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(category.percentUsed, 100)}%` }}
              />
            </div>
            
            {/* Remaining Amount */}
            <div className="mt-2 text-xs text-gray-600">
              {category.remaining >= 0 ? (
                <span className="text-green-600">
                  {formatCurrency(category.remaining)} remaining
                </span>
              ) : (
                <span className="text-red-600">
                  {formatCurrency(Math.abs(category.remaining))} over budget
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
