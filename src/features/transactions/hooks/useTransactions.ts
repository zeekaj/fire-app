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
      // Server-side defensive validation
      if (!transaction.account_id) throw new Error('Account ID is required');
      if (!transaction.date) throw new Error('Date is required');
      if (transaction.amount === undefined || transaction.amount === null) throw new Error('Amount is required');
      if (Math.abs(transaction.amount) > 1_000_000_000) throw new Error('Amount is unrealistically large');
      if (Math.abs(transaction.amount) === 0) throw new Error('Amount cannot be zero');

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

/**
 * Bulk delete transactions
 */
export function useBulkDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const userId = await requireAuth();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids)
        .eq('created_by', userId as any);

      if (error) throw error;
      return ids.length;
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
 * Bulk update transactions (for categorization, account moves, etc.)
 */
export function useBulkUpdateTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<TransactionInsert> }) => {
      const userId = await requireAuth();

      // Update each transaction individually to ensure RLS policies are respected
      const results = await Promise.all(
        ids.map(id =>
          supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .eq('created_by', userId as any)
            .select()
            .single()
        )
      );

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} transaction(s)`);
      }

      return results.map(r => r.data);
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
