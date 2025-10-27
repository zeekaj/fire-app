/**
 * useTransactions Hook
 * 
 * React Query hooks for fetching and managing transactions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

/**
 * Fetch recent transactions
 */
export function useTransactions(limit = 50) {
  return useQuery({
    queryKey: ['transactions', limit],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('created_by', userId as any)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Transaction[];
    },
  });
}

/**
 * Create a new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<TransactionInsert, 'created_by'>) => {
      // Auto-set transaction_type based on amount if not provided
      const transactionWithType = {
        ...transaction,
        transaction_type: transaction.transaction_type || (transaction.amount < 0 ? 'expense' : 'income')
      };
      return await insertWithOwnership('transactions', transactionWithType);
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Update an existing transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TransactionInsert> }) => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('created_by', userId as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await requireAuth();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('created_by', userId as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
