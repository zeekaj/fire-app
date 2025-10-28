/**
 * useTransfer Hook
 * 
 * React Query hook for creating and managing transfer transactions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface CreateTransferParams {
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
  isDebtPayment?: boolean; // If true, marks as debt_payment type
}

/**
 * Create a transfer between two accounts
 * Creates two linked transactions: withdrawal from source, deposit to destination
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTransferParams) => {
      const userId = await requireAuth();
      const { date, fromAccountId, toAccountId, amount, notes, isDebtPayment = false } = params;

      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      if (fromAccountId === toAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      const transactionType = isDebtPayment ? 'debt_payment' : 'transfer';

      // Create withdrawal transaction (negative amount)
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('transactions')
        .insert({
          created_by: userId as any,
          date,
          account_id: fromAccountId,
          amount: -Math.abs(amount), // Ensure negative
          payee_id: null,
          category_id: null,
          notes: notes || (isDebtPayment ? 'Debt payment' : 'Transfer to account'),
          is_pending: false,
          transaction_type: transactionType,
          transfer_id: null, // Will update after deposit is created
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;
      const withdrawal = withdrawalData as unknown as Transaction;

      // Create deposit transaction (positive amount)
      const { data: depositData, error: depositError } = await supabase
        .from('transactions')
        .insert({
          created_by: userId as any,
          date,
          account_id: toAccountId,
          amount: Math.abs(amount), // Ensure positive
          payee_id: null,
          category_id: null,
          notes: notes || (isDebtPayment ? 'Debt payment received' : 'Transfer from account'),
          is_pending: false,
          transaction_type: transactionType,
          transfer_id: withdrawal.id, // Link to withdrawal
        })
        .select()
        .single();

      if (depositError) {
        // Rollback: delete the withdrawal if deposit fails
        await supabase.from('transactions').delete().eq('id', withdrawal.id);
        throw depositError;
      }
      const deposit = depositData as unknown as Transaction;

      // Update withdrawal to link to deposit
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ transfer_id: deposit.id })
        .eq('id', withdrawal.id);

      if (updateError) {
        // Rollback: delete both transactions if linking fails
        await supabase.from('transactions').delete().in('id', [withdrawal.id, deposit.id]);
        throw updateError;
      }

      return { withdrawal, deposit };
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] }); // Invalidate account register queries
    },
  });
}

/**
 * Delete a transfer (deletes both linked transactions)
 */
export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const userId = await requireAuth();

      // Get the transaction to find its transfer pair
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('created_by', userId as any)
        .single();

      if (fetchError) throw fetchError;
      
      const tx = transaction as unknown as Transaction;
      
      if (!tx.transfer_id) {
        throw new Error('This is not a transfer transaction');
      }

      // Delete both transactions in the transfer pair
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', [transactionId, tx.transfer_id]);

      if (deleteError) throw deleteError;

      return { deletedIds: [transactionId, tx.transfer_id] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] }); // Invalidate account register queries
    },
  });
}
