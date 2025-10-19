/**
 * useScenarios.ts
 * 
 * React Query hook for fetching FIRE planning scenarios.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ScenarioDisplay } from '../scenarios.types';
import { scenarioToDisplayFormat } from '../scenarios.types';
import { logger } from '@/lib/logger';

/**
 * Fetch all scenarios for the current user
 */
async function fetchScenarios(): Promise<ScenarioDisplay[]> {
  logger.debug('Fetching scenarios');

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching scenarios', error);
    throw error;
  }

  logger.debug(`Fetched ${data?.length || 0} scenarios`);
  
  // Convert database format to display format
  return (data || []).map(scenarioToDisplayFormat);
}

/**
 * Hook to fetch scenarios with React Query
 */
export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios', 'v2'], // Added version to force cache refresh
    queryFn: fetchScenarios,
  });
}

/**
 * Fetch a single scenario by ID
 */
async function fetchScenario(scenarioId: string): Promise<ScenarioDisplay | null> {
  logger.debug(`Fetching scenario ${scenarioId}`);

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (error) {
    logger.error('Error fetching scenario', error, { scenarioId });
    throw error;
  }

  return data ? scenarioToDisplayFormat(data) : null;
}

/**
 * Hook to fetch a single scenario by ID
 */
export function useScenario(scenarioId: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', scenarioId],
    queryFn: () => fetchScenario(scenarioId!),
    enabled: !!scenarioId,
  });
}
