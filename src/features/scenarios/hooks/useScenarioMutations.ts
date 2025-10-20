/**
 * useScenarioMutations.ts
 * 
 * React Query mutations for CRUD operations on scenarios.
 */

/**
 * useScenarioMutations.ts
 * 
 * React Query mutations for CRUD operations on scenarios.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Scenario, ScenarioInsert, ScenarioUpdate } from '../scenarios.types';
import { logger } from '@/lib/logger';

/**
 * Create a new scenario
 */
async function createScenario(scenario: ScenarioInsert): Promise<Scenario> {
  logger.debug('Creating new scenario', { name: scenario.name });

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Add user ID to scenario
  const scenarioWithUser = {
    ...scenario,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('scenarios')
    .insert(scenarioWithUser)
    .select()
    .single();

  if (error) {
    logger.error('Error creating scenario', error);
    throw error;
  }

  logger.info('Scenario created successfully', { id: data.id, name: data.name });
  return data;
}

/**
 * Update an existing scenario
 */
async function updateScenario(id: string, updates: ScenarioUpdate): Promise<Scenario> {
  logger.debug('Updating scenario', { id });

  const { data, error } = await supabase
    .from('scenarios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating scenario', error, { id });
    throw error;
  }

  logger.info('Scenario updated successfully', { id, name: data.name });
  return data;
}

/**
 * Delete a scenario
 */
async function deleteScenario(id: string): Promise<void> {
  logger.debug('Deleting scenario', { id });

  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting scenario', error, { id });
    throw error;
  }

  logger.info('Scenario deleted successfully', { id });
}

/**
 * Hook for scenario mutations
 */
export function useScenarioMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      // Invalidate scenarios queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ScenarioUpdate }) =>
      updateScenario(id, updates),
    onSuccess: (data) => {
      // Invalidate scenarios queries
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['scenarios', data.id] });
      // Also invalidate selected scenario queries in case this was the selected one
      queryClient.invalidateQueries({ queryKey: ['selectedScenario'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      // Invalidate scenarios queries to refetch the list
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  return {
    createScenario: createMutation.mutateAsync,
    updateScenario: (id: string, updates: ScenarioUpdate) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteScenario: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
