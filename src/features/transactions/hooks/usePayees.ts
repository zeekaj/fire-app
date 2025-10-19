/**
 * usePayees Hook
 * 
 * React Query hook for fetching and managing payees.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Payee = Database['public']['Tables']['payees']['Row'];

/**
 * Fetch all payees for the current user
 */
export function usePayees() {
  return useQuery({
    queryKey: ['payees'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('payees')
        .select('*')
        .eq('created_by', userId as any)
        .order('name');

      if (error) throw error;
      return data as unknown as Payee[];
    },
  });
}
