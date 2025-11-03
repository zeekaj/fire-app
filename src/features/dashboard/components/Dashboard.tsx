/**
 * Dashboard Component
 * 
 * Main dashboard showing key FIRE metrics and insights.
 */

import { DashboardTile } from './DashboardTile';
import { ProjectedTimeToFICard } from './ProjectedTimeToFICard';
import { DashboardInsights } from './DashboardInsights';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { NetWorthHistoryChart } from './NetWorthHistoryChart';
import { IncomeExpensesChart } from './IncomeExpensesChart';
import { BudgetPerformanceChart } from '@/features/budgets';
import { SavingsRateOptimization } from './SavingsRateOptimization';
import { InvestmentRemindersTile } from './InvestmentReminders';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { formatCurrency } from '@/lib/format';
import { AppTab } from '@/lib/useEnhancedNavigation';

interface DashboardProps {
  onNavigate?: (tab: AppTab) => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const metrics = useDashboardMetrics();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your FIRE journey at a glance
        </p>
      </div>

      {/* Time to FI Tile - Full Width */}
      <div className="mb-6">
        <ProjectedTimeToFICard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Net Worth */}
        <DashboardTile
          title="Net Worth"
          value={formatCurrency(metrics.netWorth)}
          subtitle={`Across ${metrics.accountCount} accounts`}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Monthly Spending */}
        <DashboardTile
          title="This Month's Spending"
          value={formatCurrency(metrics.monthlySpending)}
          subtitle={`Income: ${formatCurrency(metrics.monthlyIncome)}`}
          color="danger"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        {/* Savings Rate */}
        <DashboardTile
          title="Savings Rate"
          value={`${metrics.savingsRate.toFixed(1)}%`}
          subtitle="This month"
          color={metrics.savingsRate >= 50 ? 'success' : metrics.savingsRate >= 25 ? 'warning' : 'danger'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Smart Insights Panel - Full Width */}
      <div className="mt-6">
        <DashboardInsights />
      </div>

      {/* Income vs Expenses Chart - Full Width */}
      <div className="mt-6">
        <IncomeExpensesChart />
      </div>

      {/* Budget Performance - Full Width */}
      <div className="mt-6">
        <BudgetPerformanceChart />
      </div>

      {/* Savings Rate Optimization - Full Width */}
      <div className="mt-6">
        <SavingsRateOptimization />
      </div>

      {/* Net Worth History Chart - Full Width */}
      <div className="mt-6">
        <NetWorthHistoryChart />
      </div>      {/* Spending Trends - Full Width */}
      <div className="mt-6">
        <SpendingTrendsChart />
      </div>

      {/* Investment Reminders - Full Width */}
      <div className="mt-6">
        <InvestmentRemindersTile onNavigate={onNavigate} />
      </div>
    </div>
  );
}
