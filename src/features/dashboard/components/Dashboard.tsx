/**
 * Dashboard Component
 * 
 * Main dashboard showing key FIRE metrics and insights.
 */

import { DashboardTile } from './DashboardTile';
import { FIREScenarioSelectorTile } from './FIREScenarioSelectorTile';
import { TimeToFITile } from './TimeToFITile';
import { MonteCarloDistribution } from './MonteCarloDistribution';
import { DashboardInsights } from './DashboardInsights';
import { InvestmentRemindersTile } from './InvestmentReminders';
import { ScenarioComparison } from './ScenarioComparison';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { CategoryBreakdownChart } from './CategoryBreakdownChart';
import { UpcomingBillsWidget } from './UpcomingBillsWidget';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { formatCurrency } from '@/lib/format';

interface DashboardProps {
  onNavigateToScenarios?: (scenarioId?: string) => void;
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigateToScenarios, onNavigate }: DashboardProps = {}) {
  const metrics = useDashboardMetrics();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your FIRE journey at a glance
        </p>
      </div>

      {/* FIRE Scenario Selector - Full Width */}
      <div className="mb-6">
        <FIREScenarioSelectorTile onNavigateToScenarios={onNavigateToScenarios} />
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

      {/* Time to FI Tile - Full Width */}
      <div className="mt-6">
        <TimeToFITile
          currentNetWorth={metrics.netWorth}
          annualExpenses={metrics.monthlySpending * 12}
          annualSavings={(metrics.monthlyIncome - metrics.monthlySpending) * 12}
        />
      </div>

      {/* Monte Carlo Distribution - Full Width */}
      <div className="mt-6">
        <MonteCarloDistribution />
      </div>

      {/* Smart Insights Panel - Full Width */}
      <div className="mt-6">
        <DashboardInsights />
      </div>

      {/* Investment Reminders - Full Width */}
      <div className="mt-6">
        <InvestmentRemindersTile onNavigate={onNavigate} />
      </div>

      {/* Investment Reminders - Full Width */}
      <div className="mt-6">
        <InvestmentRemindersTile onNavigate={onNavigate} />
      </div>

      {/* FIRE Number Details */}
      <div className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your FIRE Number
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Based on the 4% rule (25x annual expenses)
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-600">Annual Expenses:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(metrics.monthlySpending * 12)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-600">FIRE Number (25x):</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(metrics.fireNumber)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-600">Current Net Worth:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(metrics.netWorth)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span className="text-sm font-semibold text-accent">
                  {formatCurrency(Math.max(0, metrics.fireNumber - metrics.netWorth))}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-shrink-0 w-32">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(metrics.progressToFire / 100, 1))}`}
                  className="text-primary transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.progressToFire.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Accounts</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.accountCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.transactionCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Income</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(metrics.monthlyIncome)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Savings</p>
          <p className="text-2xl font-bold text-accent">
            {formatCurrency(metrics.monthlyIncome - metrics.monthlySpending)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendsChart />
        <CategoryBreakdownChart />
      </div>

      {/* Scenario Comparison - Full Width */}
      <div className="mt-6">
        <ScenarioComparison />
      </div>

      {/* Upcoming Bills */}
      <div className="mt-6">
        <UpcomingBillsWidget />
      </div>
    </div>
  );
}
