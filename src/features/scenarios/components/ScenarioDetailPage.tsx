/**
 * ScenarioDetailPage.tsx
 * 
 * Detailed view of a single FIRE scenario with visualizations.
 * Shows scenario parameters, net worth projection chart, and key metrics.
 */

import { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Loader2 } from 'lucide-react';
import { NetWorthChart } from './charts/NetWorthChart';
import { MonteCarloHistogram } from './charts/MonteCarloHistogram';
import { HistoricalChart } from './charts/HistoricalChart';
import { WithdrawalStrategyComparison } from './charts/WithdrawalStrategyComparison';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { EditScenarioModal } from './EditScenarioModal';
import { 
  runMonteCarloSimulation, 
  runHistoricalSimulation,
  SAMPLE_HISTORICAL_DATA,
  type MonteCarloConfig,
  type HistoricalSimulationConfig 
} from '@/lib/sim';
import type { ScenarioDisplay } from '../scenarios.types';

interface ScenarioDetailPageProps {
  scenario: ScenarioDisplay;
  onBack?: () => void;
}

export function ScenarioDetailPage({ scenario, onBack }: ScenarioDetailPageProps) {
  const [isLoadingSimulations, setIsLoadingSimulations] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Calculate projected portfolio at retirement
  const projectedPortfolioAtRetirement = useMemo(() => {
    const yearsToRetirement = Math.max(0, scenario.retirement_age - scenario.current_age);
    let portfolio = scenario.current_savings;
    for (let i = 0; i < yearsToRetirement; i++) {
      portfolio = (portfolio + scenario.annual_contribution) * (1 + scenario.expected_return_mean);
    }
    return portfolio;
  }, [scenario]);

  // Run Monte Carlo simulation
  const monteCarloResult = useMemo(() => {
    // Calculate withdrawal rate for percentage strategy
    const withdrawalRate = scenario.annual_expenses / projectedPortfolioAtRetirement || 0.04;

    const config: MonteCarloConfig = {
      numSimulations: 1000,
      retirementYears: scenario.life_expectancy - scenario.retirement_age,
      initialPortfolio: projectedPortfolioAtRetirement,
      annualWithdrawal: scenario.withdrawal_strategy === 'percentage' ? undefined : scenario.annual_expenses,
      withdrawalRate: scenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
      withdrawalStrategy: scenario.withdrawal_strategy,
      expectedReturnMean: scenario.expected_return_mean,
      expectedReturnStdev: scenario.expected_return_stdev,
      inflationRate: scenario.inflation_rate,
    };

    return runMonteCarloSimulation(config);
  }, [scenario, projectedPortfolioAtRetirement]);

  // Run Historical simulation
  const historicalResult = useMemo(() => {
    const config: HistoricalSimulationConfig = {
      numSimulations: 100,
      retirementYears: scenario.life_expectancy - scenario.retirement_age,
      initialPortfolio: projectedPortfolioAtRetirement,
      annualWithdrawal: scenario.annual_expenses,
      stockAllocation: scenario.portfolio_stock_pct,
      historicalData: SAMPLE_HISTORICAL_DATA,
      inflationAdjusted: true,
    };

    return runHistoricalSimulation(config);
  }, [scenario, projectedPortfolioAtRetirement]);

  // Simulate loading delay for heavy computations
  useEffect(() => {
    setIsLoadingSimulations(true);
    const timer = setTimeout(() => {
      setIsLoadingSimulations(false);
    }, 100); // Small delay to show loading state
    return () => clearTimeout(timer);
  }, [scenario]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {scenario.name}
            </h1>
            {scenario.notes && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{scenario.notes}</p>
            )}
          </div>

          <div className="flex gap-2">
                        <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isLoadingSimulations}
              title="Edit scenario"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
                  alert('Delete functionality will be implemented to remove the scenario from the database.');
                }
              }}
              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete scenario"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Charts Section */}
      {isLoadingSimulations ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-12 mb-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Running Simulations...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Analyzing 1,100+ scenarios to calculate your retirement outlook
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Net Worth Projection Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <ChartErrorBoundary fallbackTitle="Net Worth Chart Error">
              <NetWorthChart scenario={scenario} height={400} />
            </ChartErrorBoundary>
          </div>

          {/* Monte Carlo Histogram */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <ChartErrorBoundary fallbackTitle="Monte Carlo Chart Error">
              <MonteCarloHistogram result={monteCarloResult} height={350} />
            </ChartErrorBoundary>
          </div>

          {/* Historical Backtest Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <ChartErrorBoundary fallbackTitle="Historical Chart Error">
              <HistoricalChart 
                result={historicalResult} 
                initialPortfolio={projectedPortfolioAtRetirement}
                height={350}
                maxLinesToShow={8}
              />
            </ChartErrorBoundary>
          </div>

          {/* Withdrawal Strategy Comparison */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <ChartErrorBoundary fallbackTitle="Withdrawal Strategy Chart Error">
              <WithdrawalStrategyComparison
                retirementYears={scenario.life_expectancy - scenario.retirement_age}
                initialPortfolio={projectedPortfolioAtRetirement}
                annualWithdrawal={scenario.annual_expenses}
                expectedReturnMean={scenario.expected_return_mean}
                expectedReturnStdev={scenario.expected_return_stdev}
                inflationRate={scenario.inflation_rate}
                height={350}
              />
            </ChartErrorBoundary>
          </div>
        </>
      )}

      {/* Scenario Parameters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Scenario Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Portfolio Settings
            </h3>
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
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Withdrawal Strategy
            </h3>
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

      {/* Edit Scenario Modal */}
      <EditScenarioModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        scenario={scenario}
      />
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
