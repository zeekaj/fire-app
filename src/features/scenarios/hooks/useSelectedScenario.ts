/**
 * useSelectedScenario Hook
 * 
 * Manages the user's selected primary FIRE scenario for dashboard calculations.
 * Stores selection in user settings and provides methods to get/set the scenario.
 * 
 * TODO: Regenerate database types to include selected_scenario_id in settings table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { scenarioToDisplayFormat, type ScenarioDisplay } from '@/features/scenarios/scenarios.types';

/**
 * Get the user's selected scenario ID from settings
 */
async function getSelectedScenarioId(): Promise<string | null> {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('settings')
    .select('selected_scenario_id')
    .eq('created_by', userId)
    .single();

  if (error) {
    console.error('Error fetching selected scenario ID:', error);
    return null;
  }

  // @ts-ignore - selected_scenario_id not in types yet
  return data?.selected_scenario_id || null;
}

/**
 * Get the full selected scenario object
 */
async function getSelectedScenario(): Promise<ScenarioDisplay | null> {
  const scenarioId = await getSelectedScenarioId();
  
  if (!scenarioId) {
    return null;
  }

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error) {
    console.error('Error fetching selected scenario:', error);
    return null;
  }

  // Convert database format to display format
  return data ? scenarioToDisplayFormat(data) : null;
}

/**
 * Update the selected scenario ID in settings
 */
async function updateSelectedScenarioId(scenarioId: string | null): Promise<void> {
  const userId = await requireAuth();

  const { error } = await supabase
    .from('settings')
    // @ts-ignore - selected_scenario_id not in types yet
    .update({ selected_scenario_id: scenarioId })
    .eq('created_by', userId);

  if (error) {
    throw new Error(`Failed to update selected scenario: ${error.message}`);
  }
}

/**
 * Hook to manage selected FIRE scenario
 */
export function useSelectedScenario() {
  const queryClient = useQueryClient();

  // Query for selected scenario ID
  const { data: selectedScenarioId, isLoading: isLoadingId } = useQuery({
    queryKey: ['selectedScenarioId'],
    queryFn: getSelectedScenarioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for full scenario object
  const { data: selectedScenario, isLoading: isLoadingScenario } = useQuery({
    queryKey: ['selectedScenario', selectedScenarioId],
    queryFn: getSelectedScenario,
    enabled: !!selectedScenarioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to update selected scenario
  const updateMutation = useMutation({
    mutationFn: updateSelectedScenarioId,
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['selectedScenarioId'] });
      queryClient.invalidateQueries({ queryKey: ['selectedScenario'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });

  return {
    selectedScenarioId,
    selectedScenario,
    isLoading: isLoadingId || isLoadingScenario,
    setSelectedScenario: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
