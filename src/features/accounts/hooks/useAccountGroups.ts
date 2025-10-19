/**
 * Account Groups Hooks
 * 
 * React Query hooks for fetching and managing account groups.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type AccountGroup = Database['public']['Tables']['account_groups']['Row'];

/**
 * Hook to fetch all account groups for the current user
 */
export function useAccountGroups() {
  return useQuery({
    queryKey: ['account-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_groups')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data as unknown as AccountGroup[];
    },
  });
}
