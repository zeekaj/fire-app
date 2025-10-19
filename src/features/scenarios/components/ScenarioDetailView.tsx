/**
 * ScenarioDetailView.tsx
 * 
 * Detailed view of a single FIRE scenario with visualizations.
 * Shows scenario parameters, net worth projection chart, and key metrics.
 * Can be used as a modal or expandable section.
 */

import { X } from 'lucide-react';
import { NetWorthChart } from './charts/NetWorthChart';
import type { ScenarioDisplay } from '../scenarios.types';

interface ScenarioDetailViewProps {
  scenario: ScenarioDisplay;
  onClose: () => void;
}

export function ScenarioDetailView({ scenario, onClose }: ScenarioDetailViewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {scenario.name}
            </h2>
            {scenario.notes && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{scenario.notes}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Current Age"
              value={scenario.current_age.toString()}
            />
            <MetricCard
              label="Retirement Age"
              value={scenario.retirement_age.toString()}
            />
            <MetricCard
              label="Years to Retirement"
              value={(scenario.retirement_age - scenario.current_age).toString()}
            />
            <MetricCard
              label="Life Expectancy"
              value={scenario.life_expectancy.toString()}
            />
            <MetricCard
              label="Current Savings"
              value={formatCurrency(scenario.current_savings)}
            />
            <MetricCard
              label="Annual Contribution"
              value={formatCurrency(scenario.annual_contribution)}
            />
            <MetricCard
              label="Annual Expenses"
              value={formatCurrency(scenario.annual_expenses)}
            />
            <MetricCard
              label="Stock Allocation"
              value={`${(scenario.portfolio_stock_pct * 100).toFixed(0)}%`}
            />
          </div>

          {/* Net Worth Projection Chart */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 mb-8">
            <NetWorthChart scenario={scenario} height={400} />
          </div>

          {/* Scenario Parameters */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Scenario Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Portfolio Settings
                </h4>
                <div className="space-y-2">
                  <ParamRow
                    label="Expected Return (Mean)"
                    value={`${(scenario.expected_return_mean * 100).toFixed(1)}%`}
                  />
                  <ParamRow
                    label="Expected Return (Std Dev)"
                    value={`${(scenario.expected_return_stdev * 100).toFixed(1)}%`}
                  />
                  <ParamRow
                    label="Inflation Rate"
                    value={`${(scenario.inflation_rate * 100).toFixed(1)}%`}
                  />
                  <ParamRow
                    label="Stock Allocation"
                    value={`${(scenario.portfolio_stock_pct * 100).toFixed(0)}%`}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Withdrawal Strategy
                </h4>
                <div className="space-y-2">
                  <ParamRow
                    label="Strategy"
                    value={scenario.withdrawal_strategy}
                    capitalize
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

interface ParamRowProps {
  label: string;
  value: string;
  capitalize?: boolean;
}

function ParamRow({ label, value, capitalize }: ParamRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-900 dark:text-gray-100 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
