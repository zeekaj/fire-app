/**
 * ScenarioComparisonView.tsx
 *
 * Side-by-side comparison of two FIRE scenarios.
 */

import { X } from 'lucide-react';
import { NetWorthChart } from './charts/NetWorthChart';
import type { ScenarioDisplay } from '../scenarios.types';

interface ScenarioComparisonViewProps {
  scenarios: ScenarioDisplay[];
  onClose: () => void;
}

export function ScenarioComparisonView({ scenarios, onClose }: ScenarioComparisonViewProps) {
  if (scenarios.length !== 2) return null;

  const [scenario1, scenario2] = scenarios;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Scenario Comparison
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {scenario1.name} vs {scenario2.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <ScenarioMetricsCard scenario={scenario1} />
            <ScenarioMetricsCard scenario={scenario2} />
          </div>

          {/* Net Worth Projection Charts */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {scenario1.name}
              </h3>
              <NetWorthChart scenario={scenario1} height={300} />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {scenario2.name}
              </h3>
              <NetWorthChart scenario={scenario2} height={300} />
            </div>
          </div>

          {/* Assumption Comparison */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Key Assumptions Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Assumption</th>
                    <th className="text-center py-2 px-4 font-medium text-gray-700 dark:text-gray-300">{scenario1.name}</th>
                    <th className="text-center py-2 px-4 font-medium text-gray-700 dark:text-gray-300">{scenario2.name}</th>
                    <th className="text-center py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    label="Current Savings"
                    value1={scenario1.current_savings}
                    value2={scenario2.current_savings}
                    format="currency"
                  />
                  <ComparisonRow
                    label="Annual Contribution"
                    value1={scenario1.annual_contribution}
                    value2={scenario2.annual_contribution}
                    format="currency"
                  />
                  <ComparisonRow
                    label="Annual Expenses"
                    value1={scenario1.annual_expenses}
                    value2={scenario2.annual_expenses}
                    format="currency"
                  />
                  <ComparisonRow
                    label="Expected Return"
                    value1={scenario1.expected_return_mean}
                    value2={scenario2.expected_return_mean}
                    format="percentage"
                  />
                  <ComparisonRow
                    label="Inflation Rate"
                    value1={scenario1.inflation_rate}
                    value2={scenario2.inflation_rate}
                    format="percentage"
                  />
                  <ComparisonRow
                    label="Stock Allocation"
                    value1={scenario1.portfolio_stock_pct}
                    value2={scenario2.portfolio_stock_pct}
                    format="percentage"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioMetricsCard({ scenario }: { scenario: ScenarioDisplay }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {scenario.name}
      </h3>
      <div className="grid grid-cols-2 gap-4">
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
          label="Annual Expenses"
          value={formatCurrency(scenario.annual_expenses)}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  value1,
  value2,
  format
}: {
  label: string;
  value1: number;
  value2: number;
  format: 'currency' | 'percentage';
}) {
  const formatValue = (value: number) => {
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percentage') return `${(value * 100).toFixed(1)}%`;
    return value.toString();
  };

  const diff = value2 - value1;
  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{label}</td>
      <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{formatValue(value1)}</td>
      <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{formatValue(value2)}</td>
      <td className={`py-3 px-4 text-center font-medium ${diffColor}`}>
        {diff === 0 ? '—' : (diff > 0 ? '+' : '') + formatValue(diff)}
      </td>
    </tr>
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