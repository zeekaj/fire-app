/**
 * useCreatePayee Hook
 * 
 * React Query hook for creating payees.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type PayeeInsert = Database['public']['Tables']['payees']['Insert'];

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
      // Invalidate payees query to refetch
      queryClient.invalidateQueries({ queryKey: ['payees'] });
    },
  });
}
