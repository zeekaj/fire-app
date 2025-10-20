/**
 * useSettings Hook
 * 
 * React Query hook for fetching user settings.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Settings = Database['public']['Tables']['settings']['Row'];

/**
 * Fetch user settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('created_by', userId as any)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Settings | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}