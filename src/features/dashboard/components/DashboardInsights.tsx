/**
 * DashboardInsights.tsx
 * 
 * Smart insights panel that analyzes selected scenario and current financial state
 * to generate prioritized, actionable recommendations.
 */

import { useMemo } from 'react';
import { useSelectedScenario } from '@/features/dashboard/hooks/useSelectedScenario';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { runMonteCarloSimulation, type MonteCarloConfig } from '@/lib/sim';

// Insight types
type InsightCategory = 'pace' | 'risk' | 'optimization' | 'action';
type InsightPriority = 'high' | 'medium' | 'low';

interface Insight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string;
  description: string;
  icon: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function DashboardInsights() {
  const { selectedScenario } = useSelectedScenario();
  const metrics = useDashboardMetrics();

  // Calculate Monte Carlo success rate
  const successRate = useMemo(() => {
    if (!selectedScenario) return null;

    const yearsToRetirement = Math.max(0, selectedScenario.retirement_age - selectedScenario.current_age);
    
    // Project net worth to retirement
    let projectedNetWorth = metrics.netWorth;
    for (let i = 0; i < yearsToRetirement; i++) {
      const annualSavings = (metrics.monthlyIncome - metrics.monthlySpending) * 12;
      projectedNetWorth = (projectedNetWorth + annualSavings) * (1 + selectedScenario.expected_return_mean);
    }

    const retirementYears = selectedScenario.life_expectancy - selectedScenario.retirement_age;
    const withdrawalRate = selectedScenario.annual_expenses / projectedNetWorth || 0.04;

    const mcConfig: MonteCarloConfig = {
      numSimulations: 100,
      retirementYears,
      initialPortfolio: projectedNetWorth,
      annualWithdrawal: selectedScenario.withdrawal_strategy === 'percentage' ? undefined : selectedScenario.annual_expenses,
      withdrawalRate: selectedScenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
      withdrawalStrategy: selectedScenario.withdrawal_strategy,
      expectedReturnMean: selectedScenario.expected_return_mean,
      expectedReturnStdev: selectedScenario.expected_return_stdev,
      inflationRate: selectedScenario.inflation_rate,
    };

    const result = runMonteCarloSimulation(mcConfig);
    const successCount = result.simulations.filter(sim => 
      sim.finalPortfolio > 0
    ).length;
    
    return (successCount / result.simulations.length) * 100;
  }, [selectedScenario, metrics]);

  // Generate insights based on analysis
  const insights = useMemo((): Insight[] => {
    if (!selectedScenario) return [];

    const generatedInsights: Insight[] = [];

    // 1. PACE INSIGHTS - Are you on track?
    const savingsGap = selectedScenario.current_savings - metrics.netWorth;
    const savingsGapPct = selectedScenario.current_savings > 0 
      ? (savingsGap / selectedScenario.current_savings) * 100 
      : 0;

    if (Math.abs(savingsGapPct) > 10) {
      if (savingsGapPct > 0) {
        // Behind plan
        generatedInsights.push({
          id: 'pace-behind',
          category: 'pace',
          priority: 'high',
          title: 'Behind Target Savings',
          description: `Your current net worth ($${(metrics.netWorth / 1000).toFixed(0)}K) is ${Math.abs(savingsGapPct).toFixed(0)}% below your scenario target ($${(selectedScenario.current_savings / 1000).toFixed(0)}K). Consider increasing your savings rate or adjusting your timeline.`,
          icon: '📉',
        });
      } else {
        // Ahead of plan
        generatedInsights.push({
          id: 'pace-ahead',
          category: 'pace',
          priority: 'low',
          title: 'Ahead of Target!',
          description: `Excellent progress! You're ${Math.abs(savingsGapPct).toFixed(0)}% ahead of your scenario target. You might be able to retire earlier or increase your retirement spending.`,
          icon: '🎉',
        });
      }
    }

    // 2. SAVINGS RATE INSIGHTS
    const monthlyTarget = selectedScenario.annual_contribution / 12;
    const monthlySavings = metrics.monthlyIncome - metrics.monthlySpending;
    const savingsRateGap = monthlySavings - monthlyTarget;

    if (savingsRateGap < -500) {
      generatedInsights.push({
        id: 'savings-low',
        category: 'action',
        priority: 'high',
        title: 'Increase Monthly Savings',
        description: `You're saving $${monthlySavings.toFixed(0)}/month but your scenario requires $${monthlyTarget.toFixed(0)}/month. Find ways to save an additional $${Math.abs(savingsRateGap).toFixed(0)}/month.`,
        icon: '💰',
      });
    } else if (savingsRateGap > 500) {
      generatedInsights.push({
        id: 'savings-high',
        category: 'optimization',
        priority: 'medium',
        title: 'Extra Savings Available',
        description: `You're saving $${Math.abs(savingsRateGap).toFixed(0)}/month more than your scenario requires. Consider updating your scenario to reflect faster FI progress.`,
        icon: '💪',
      });
    }

    // 3. RISK INSIGHTS - Success probability
    if (successRate !== null) {
      if (successRate < 70) {
        generatedInsights.push({
          id: 'risk-low-success',
          category: 'risk',
          priority: 'high',
          title: 'Low Success Probability',
          description: `Your scenario has only a ${successRate.toFixed(0)}% success rate. Consider increasing savings, reducing expenses, or adjusting your retirement timeline for better odds.`,
          icon: '⚠️',
        });
      } else if (successRate < 85) {
        generatedInsights.push({
          id: 'risk-moderate-success',
          category: 'risk',
          priority: 'medium',
          title: 'Moderate Risk Level',
          description: `Your scenario has a ${successRate.toFixed(0)}% success rate. This is acceptable, but consider stress-testing with lower returns or higher expenses.`,
          icon: '📊',
        });
      } else {
        generatedInsights.push({
          id: 'risk-high-success',
          category: 'risk',
          priority: 'low',
          title: 'Strong Success Rate',
          description: `Excellent! Your scenario has a ${successRate.toFixed(0)}% success rate. Your plan is well-positioned for success.`,
          icon: '✅',
        });
      }
    }

    // 4. OPTIMIZATION INSIGHTS
    const yearsToFI = selectedScenario.retirement_age - selectedScenario.current_age;
    
    if (yearsToFI > 20 && metrics.savingsRate > 50) {
      generatedInsights.push({
        id: 'optimize-timeline',
        category: 'optimization',
        priority: 'medium',
        title: 'Consider Earlier Retirement',
        description: `With a ${metrics.savingsRate.toFixed(0)}% savings rate, you might reach FI sooner than ${yearsToFI} years. Run scenarios with earlier retirement dates.`,
        icon: '⏰',
      });
    }

    if (selectedScenario.portfolio_stock_pct < 0.6 && selectedScenario.current_age < 50) {
      generatedInsights.push({
        id: 'optimize-allocation',
        category: 'optimization',
        priority: 'low',
        title: 'Low Stock Allocation',
        description: `At ${selectedScenario.current_age} years old with ${yearsToFI} years to FI, you have a conservative ${(selectedScenario.portfolio_stock_pct * 100).toFixed(0)}% stock allocation. Consider increasing for potentially higher returns.`,
        icon: '📈',
      });
    }

    // 5. EXPENSE INSIGHTS
    const annualExpensesActual = metrics.monthlySpending * 12;
    const expenseGap = annualExpensesActual - selectedScenario.annual_expenses;
    const expenseGapPct = selectedScenario.annual_expenses > 0 
      ? (expenseGap / selectedScenario.annual_expenses) * 100 
      : 0;

    if (expenseGapPct > 15) {
      generatedInsights.push({
        id: 'expense-high',
        category: 'action',
        priority: 'high',
        title: 'Spending Above Plan',
        description: `Your actual spending ($${(annualExpensesActual / 1000).toFixed(0)}K/year) is ${expenseGapPct.toFixed(0)}% higher than your scenario ($${(selectedScenario.annual_expenses / 1000).toFixed(0)}K/year). Update your scenario or reduce spending.`,
        icon: '🔴',
      });
    } else if (expenseGapPct < -15) {
      generatedInsights.push({
        id: 'expense-low',
        category: 'optimization',
        priority: 'low',
        title: 'Spending Below Plan',
        description: `You're spending ${Math.abs(expenseGapPct).toFixed(0)}% less than your scenario assumes. You could update your scenario to reflect lower expenses and potentially retire sooner.`,
        icon: '🟢',
      });
    }

    // Sort by priority: high > medium > low
    const priorityOrder: Record<InsightPriority, number> = { high: 3, medium: 2, low: 1 };
    return generatedInsights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 5); // Show top 5 insights

  }, [selectedScenario, metrics, successRate]);

  if (!selectedScenario) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
        </div>
        <p className="text-sm text-gray-500">
          Select a FIRE scenario to see personalized insights and recommendations.
        </p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
        </div>
        <p className="text-sm text-gray-500">
          Your plan looks good! Keep monitoring your progress.
        </p>
      </div>
    );
  }

  const getCategoryColor = (category: InsightCategory): string => {
    switch (category) {
      case 'pace': return 'bg-blue-50 border-blue-200';
      case 'risk': return 'bg-red-50 border-red-200';
      case 'optimization': return 'bg-green-50 border-green-200';
      case 'action': return 'bg-orange-50 border-orange-200';
    }
  };

  const getCategoryBadgeColor = (category: InsightCategory): string => {
    switch (category) {
      case 'pace': return 'bg-blue-100 text-blue-800';
      case 'risk': return 'bg-red-100 text-red-800';
      case 'optimization': return 'bg-green-100 text-green-800';
      case 'action': return 'bg-orange-100 text-orange-800';
    }
  };

  const getPriorityBadgeColor = (priority: InsightPriority): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-xl">💡</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
          <p className="text-sm text-gray-500">
            Personalized recommendations for {selectedScenario.name}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-lg p-4 ${getCategoryColor(insight.category)}`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-2xl mt-0.5">
                {insight.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {insight.title}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryBadgeColor(insight.category)}`}>
                    {insight.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getPriorityBadgeColor(insight.priority)}`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insight.description}
                </p>
                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {insight.action.label} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Insights update automatically as you track transactions and update scenarios.
        </p>
      </div>
    </div>
  );
}
