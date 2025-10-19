/**
 * FIRE Scenario Selector Tile
 * 
 * Dashboard tile that lets users select their primary FIRE scenario.
 * Shows selected scenario name and provides quick navigation to scenario details.
 * 
 * TODO: Regenerate database types to include new scenario fields (current_age, retirement_age, etc.)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { useSelectedScenario } from '../hooks/useSelectedScenario';
import { useScenarioMutations } from '@/features/scenarios/hooks/useScenarioMutations';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { formatCurrency } from '@/lib/format';

// Using any for now until database types are regenerated
async function getAllScenarios(): Promise<any[]> {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }

  return data || [];
}

interface FIREScenarioSelectorTileProps {
  onNavigateToScenarios?: (scenarioId?: string) => void;
}

export function FIREScenarioSelectorTile({ onNavigateToScenarios }: FIREScenarioSelectorTileProps) {
  const { selectedScenario, setSelectedScenario, isLoading, isUpdating } = useSelectedScenario();
  const { data: scenarios = [], isLoading: isLoadingScenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: getAllScenarios,
  });
  const { updateScenario } = useScenarioMutations();
  const metrics = useDashboardMetrics();

  const [isOpen, setIsOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  const handleSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setIsOpen(false);
  };

  const handleViewDetails = () => {
    // Navigate to scenarios page with selected scenario ID to show detail view
    if (onNavigateToScenarios && selectedScenario) {
      onNavigateToScenarios(selectedScenario.id);
    }
  };

  const handleCreateScenario = () => {
    // Navigate to scenarios page (list view)
    if (onNavigateToScenarios) {
      onNavigateToScenarios();
    }
  };

  const handleQuickUpdate = async () => {
    if (!selectedScenario) return;
    
    setIsProcessingUpdate(true);
    try {
      await updateScenario(selectedScenario.id, {
        portfolio_value_now: metrics.netWorth,
      });
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating scenario:', error);
    } finally {
      setIsProcessingUpdate(false);
    }
  };

  const needsUpdate = selectedScenario && 
    Math.abs(selectedScenario.current_savings - metrics.netWorth) > 100;

  // Empty state: no scenarios exist
  if (!isLoadingScenarios && scenarios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">FIRE Scenario</h3>
            <p className="text-sm text-gray-500 mt-1">No scenarios yet</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Create a FIRE scenario to see projections and track your progress.
        </p>

        <button
          onClick={handleCreateScenario}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          Create Your First Scenario
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading || isLoadingScenarios) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">FIRE Scenario</h3>
          <p className="text-sm text-gray-500 mt-1">
            {selectedScenario ? 'Active scenario' : 'Select scenario'}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
      </div>

      {/* Scenario Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm font-medium text-gray-900">
            {selectedScenario?.name || 'Select a scenario...'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelect(scenario.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  selectedScenario?.id === scenario.id ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{scenario.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Retire at {scenario.retirement_age} • {scenario.life_expectancy - scenario.retirement_age} years
                    </p>
                  </div>
                  {selectedScenario?.id === scenario.id && (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scenario Info */}
      {selectedScenario && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Current Age</p>
                <p className="font-semibold text-gray-900">{selectedScenario.current_age}</p>
              </div>
              <div>
                <p className="text-gray-500">Retirement Age</p>
                <p className="font-semibold text-gray-900">{selectedScenario.retirement_age}</p>
              </div>
              <div>
                <p className="text-gray-500">Expected Return</p>
                <p className="font-semibold text-gray-900">{(selectedScenario.expected_return_mean * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Inflation</p>
                <p className="font-semibold text-gray-900">{(selectedScenario.inflation_rate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Quick Update Alert */}
          {needsUpdate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Net Worth Changed
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    Scenario: {formatCurrency(selectedScenario.current_savings)} → 
                    Actual: {formatCurrency(metrics.netWorth)}
                  </p>
                  <button
                    onClick={() => setShowUpdateModal(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sync Scenario →
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedScenario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Update Scenario</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sync "{selectedScenario.name}" with your current net worth
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Scenario Value:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedScenario.current_savings)}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Value (Actual):</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(metrics.netWorth)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Change:</span>
                    <span className={`text-sm font-bold ${
                      metrics.netWorth > selectedScenario.current_savings 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {metrics.netWorth > selectedScenario.current_savings ? '+' : ''}
                      {formatCurrency(metrics.netWorth - selectedScenario.current_savings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                disabled={isProcessingUpdate}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickUpdate}
                disabled={isProcessingUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessingUpdate ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Scenario'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {selectedScenario && (
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            View Details
          </button>
        )}
        <button
          onClick={handleCreateScenario}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          Manage Scenarios
        </button>
      </div>
    </div>
  );
}
