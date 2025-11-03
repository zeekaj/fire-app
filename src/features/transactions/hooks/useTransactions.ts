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
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Transaction[];
    },
    // Always consider data stale so it refetches
    staleTime: 0,
    // Refetch when component mounts
    refetchOnMount: 'always',
    // Don't keep data in cache (for limit=5 case)
    gcTime: limit === 5 ? 0 : 5 * 60 * 1000, // 0 for recent transactions, 5 min for others
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
    onSuccess: async () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
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
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
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
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['income-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
    },
  });
}
