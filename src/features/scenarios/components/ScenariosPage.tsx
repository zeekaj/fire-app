/**
 * ScenariosPage.tsx
 * 
 * Main page for managing FIRE planning scenarios.
 * Lists all scenarios and provides CRUD operations.
 */

import { useState } from 'react';
import { useScenarios } from '../hooks/useScenarios';
import { useScenarioMutations } from '../hooks/useScenarioMutations';
import { AddScenarioModal } from './AddScenarioModal';
import type { ScenarioDisplay } from '../scenarios.types';
import {
  calculateYearsToFI,
  runMonteCarloSimulation,
  type MonteCarloConfig,
} from '@/lib/sim';
import { ScenarioDetailPage } from './ScenarioDetailPage';
import { FIREScenarioSelectorTile } from './FIREScenarioSelectorTile';
import { ScenarioTimeToFICard } from './ScenarioTimeToFICard';
import { ScenarioComparisonView } from './ScenarioComparisonView';

interface ScenariosPageProps {
  initialSelectedScenarioId?: string | null;
}

export function ScenariosPage({ initialSelectedScenarioId }: ScenariosPageProps = {}) {
  const { data: scenarios, isLoading, error } = useScenarios();
  const { deleteScenario, isDeleting } = useScenarioMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(initialSelectedScenarioId || null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [scenariosToCompare, setScenariosToCompare] = useState<string[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);

  // Show comparison view if requested
  if (showComparisonView && scenariosToCompare.length === 2) {
    const comparisonScenarios = scenarios?.filter(s => scenariosToCompare.includes(s.id)) || [];
    return (
      <ScenarioComparisonView
        scenarios={comparisonScenarios}
        onClose={() => {
          setShowComparisonView(false);
          setScenariosToCompare([]);
          setComparisonMode(false);
        }}
      />
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    setDeletingId(id);
    try {
      await deleteScenario(id);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleScenarioForComparison = (scenarioId: string) => {
    setScenariosToCompare(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : prev.length < 2 ? [...prev, scenarioId] : prev
    );
  };

  const clearComparison = () => {
    setScenariosToCompare([]);
    setComparisonMode(false);
  };

  const calculateScenarioMetrics = (scenario: ScenarioDisplay) => {
    // Deterministic calculation
    const yearsToFI = calculateYearsToFI({
      currentNetWorth: scenario.current_savings,
      annualExpenses: scenario.annual_expenses,
      annualSavings: scenario.annual_contribution,
      expectedReturn: scenario.expected_return_mean,
      withdrawalRate: 0.04, // 4% rule
    });

    // Monte Carlo simulation (quick 1000 runs for preview)
    const retirementYears = scenario.life_expectancy - scenario.retirement_age;
    const yearsToRetirement = Math.max(0, scenario.retirement_age - scenario.current_age);
    
    // Project net worth to retirement
    let projectedNetWorth = scenario.current_savings;
    for (let i = 0; i < yearsToRetirement; i++) {
      projectedNetWorth = (projectedNetWorth + scenario.annual_contribution) * (1 + scenario.expected_return_mean);
    }

    // Calculate withdrawal rate for percentage strategy (4% SWR as default)
    const withdrawalRate = scenario.annual_expenses / projectedNetWorth || 0.04;

    const mcConfig: MonteCarloConfig = {
      numSimulations: 1000,
      retirementYears,
      initialPortfolio: projectedNetWorth,
      annualWithdrawal: scenario.withdrawal_strategy === 'percentage' ? undefined : scenario.annual_expenses,
      withdrawalRate: scenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
      withdrawalStrategy: scenario.withdrawal_strategy,
      expectedReturnMean: scenario.expected_return_mean,
      expectedReturnStdev: scenario.expected_return_stdev,
      inflationRate: scenario.inflation_rate,
    };

    const mcResult = runMonteCarloSimulation(mcConfig);

    return {
      yearsToFI,
      successRate: mcResult.successRate,
      projectedNetWorth,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading scenarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading scenarios. Please try again.</p>
      </div>
    );
  }

  if (selectedScenarioId) {
    const selected = scenarios?.find((s: ScenarioDisplay) => s.id === selectedScenarioId);
    if (selected) {
      return (
        <div>
          <button onClick={() => setSelectedScenarioId(null)} className="text-blue-600 hover:underline mb-4">
            &larr; Back to all scenarios
          </button>
          <ScenarioTimeToFICard scenario={selected} />
          <div className="mt-6">
            <ScenarioDetailPage scenario={selected} onBack={() => setSelectedScenarioId(null)} />
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FIRE Scenarios</h1>
          <p className="text-gray-600 mt-1">
            Create and compare different retirement planning scenarios
          </p>
        </div>
        <div className="flex gap-2">
          {comparisonMode ? (
            <>
              <button
                onClick={clearComparison}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel Compare
              </button>
              {scenariosToCompare.length === 2 && (
                <button
                  onClick={() => setShowComparisonView(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Compare Selected
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setComparisonMode(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Compare Scenarios
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Scenario
          </button>
        </div>
      </div>

      {/* FIRE Scenario Selector */}
      <div className="mb-6">
        <FIREScenarioSelectorTile onNavigateToScenarios={(scenarioId) => setSelectedScenarioId(scenarioId ?? null)} />
      </div>

      {/* Scenarios List */}
      {!scenarios || scenarios.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No scenarios yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first FIRE planning scenario to see personalized projections and probability analysis.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Scenario
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const metrics = calculateScenarioMetrics(scenario);
            const isCurrentlyDeleting = deletingId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                  comparisonMode ? 'cursor-default' : 'cursor-pointer'
                } ${scenariosToCompare.includes(scenario.id) ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => {
                  if (comparisonMode) {
                    toggleScenarioForComparison(scenario.id);
                  } else {
                    setSelectedScenarioId(scenario.id);
                  }
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  {comparisonMode && (
                    <input
                      type="checkbox"
                      checked={scenariosToCompare.includes(scenario.id)}
                      onChange={() => toggleScenarioForComparison(scenario.id)}
                      className="mr-3 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">{scenario.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scenario.id);
                    }}
                    disabled={isCurrentlyDeleting || isDeleting}
                    className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                    title="Delete scenario"
                  >
                    {isCurrentlyDeleting ? '...' : '×'}
                  </button>
                </div>

                {/* Key Metrics */}
                <div className="space-y-3 mb-4">
                  {/* Years to FI */}
                  <div>
                    <p className="text-sm text-gray-600">Years to FI</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.yearsToFI.yearsToFI === Infinity
                        ? '∞'
                        : metrics.yearsToFI.yearsToFI <= 0
                        ? 'Reached!'
                        : metrics.yearsToFI.yearsToFI.toFixed(1)}
                    </p>
                  </div>

                  {/* Success Rate */}
                  <div>
                    <p className="text-sm text-gray-600">Success Rate (Monte Carlo)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-semibold text-gray-900">
                        {(metrics.successRate * 100).toFixed(1)}%
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          metrics.successRate >= 0.90
                            ? 'bg-green-100 text-green-700'
                            : metrics.successRate >= 0.75
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {metrics.successRate >= 0.90
                          ? 'Good'
                          : metrics.successRate >= 0.75
                          ? 'Moderate'
                          : 'Risky'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scenario Details */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Age</span>
                    <span className="text-gray-900 font-medium">
                      {scenario.current_age} → {scenario.retirement_age}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Savings</span>
                    <span className="text-gray-900 font-medium">
                      ${scenario.current_savings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Contribution</span>
                    <span className="text-gray-900 font-medium">
                      ${scenario.annual_contribution.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Retirement Expenses</span>
                    <span className="text-gray-900 font-medium">
                      ${scenario.annual_expenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Withdrawal Strategy</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {scenario.withdrawal_strategy}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {scenario.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 line-clamp-2">{scenario.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Scenario Modal */}
      <AddScenarioModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
