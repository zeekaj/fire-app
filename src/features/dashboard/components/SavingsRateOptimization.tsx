/**
 * SavingsRateOptimization Component
 * 
 * Provides actionable recommendations for improving savings rate based on spending analysis.
 */

import { useSavingsOptimization } from '../hooks/useSavingsOptimization';
import { formatCurrency } from '@/lib/format';

export function SavingsRateOptimization() {
  const optimization = useSavingsOptimization();

  const {
    currentSavingsRate,
    monthlyIncome,
    monthlySpending,
    monthlySavings,
    categorySpending,
    insights,
    potentialSavingsRate,
    totalPotentialSavings,
  } = optimization;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">💡 Savings Rate Optimization</h3>
          <p className="text-sm text-gray-500 mt-1">
            Personalized recommendations to improve your savings
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">Current Rate</div>
          <div className="text-2xl font-bold text-blue-900">
            {currentSavingsRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">Monthly Income</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(monthlyIncome)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">Monthly Spending</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(monthlySpending)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium mb-1">Monthly Savings</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(monthlySavings)}
          </div>
        </div>
      </div>

      {/* Potential Improvement */}
      {totalPotentialSavings > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-800 mb-1">
                💰 Potential Improvement
              </div>
              <div className="text-lg font-semibold text-green-900">
                Save an additional {formatCurrency(totalPotentialSavings)}/month
              </div>
              <div className="text-sm text-green-700 mt-1">
                This would increase your savings rate to{' '}
                <span className="font-semibold">{potentialSavingsRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Recommendations
        </h4>
        
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-sm">Great job! No specific optimization recommendations at this time.</p>
            <p className="text-xs mt-1">Keep tracking your spending to get personalized insights.</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-lg p-4 ${
                insight.priority === 'high'
                  ? 'bg-red-50 border-red-400'
                  : insight.priority === 'medium'
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'bg-green-50 border-green-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className={`font-semibold ${
                      insight.priority === 'high'
                        ? 'text-red-900'
                        : insight.priority === 'medium'
                        ? 'text-yellow-900'
                        : 'text-green-900'
                    }`}>
                      {insight.title}
                    </h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      insight.priority === 'high'
                        ? 'bg-red-200 text-red-800'
                        : insight.priority === 'medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-green-200 text-green-800'
                    }`}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    insight.priority === 'high'
                      ? 'text-red-700'
                      : insight.priority === 'medium'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`}>
                    {insight.description}
                  </p>
                </div>
                {insight.potentialSavings && (
                  <div className="ml-4 text-right">
                    <div className={`text-sm font-medium ${
                      insight.priority === 'high'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      Save
                    </div>
                    <div className={`text-lg font-bold ${
                      insight.priority === 'high'
                        ? 'text-red-900'
                        : 'text-yellow-900'
                    }`}>
                      {formatCurrency(insight.potentialSavings)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top Spending Categories */}
      {categorySpending.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Top Spending Categories This Month
          </h4>
          <div className="space-y-2">
            {categorySpending.slice(0, 5).map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cat.categoryName}</span>
                    {cat.overBudget && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        Over Budget
                      </span>
                    )}
                    {!cat.hasbudget && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                        No Budget
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cat.overBudget ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(cat.percentOfTotal, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                      {cat.percentOfTotal.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(cat.amount)}
                  </div>
                  {cat.budgetAmount && (
                    <div className="text-xs text-gray-500">
                      of {formatCurrency(cat.budgetAmount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
