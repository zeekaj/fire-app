/**
 * usePayees Hook
 * 
 * React Query hook for fetching and managing payees.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type Payee = Database['public']['Tables']['payees']['Row'];
type PayeeInsert = Database['public']['Tables']['payees']['Insert'];

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

/**
 * Create a new payee
 */
export function useCreatePayee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payee: Omit<PayeeInsert, 'created_by'>) => {
      return await insertWithOwnership('payees', payee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payees'] });
    },
  });
}
