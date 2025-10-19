/**
 * useBillMutations Hook
 * 
 * Mutations for creating, updating, and deleting bills.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type BillInsert = Database['public']['Tables']['bills']['Insert'];
type BillUpdate = Database['public']['Tables']['bills']['Update'];

/**
 * Create a new bill
 */
export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Omit<BillInsert, 'created_by'>) => {
      const data = await insertWithOwnership('bills', bill);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

/**
 * Update an existing bill
 */
export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BillUpdate }) => {
      const { data, error } = await supabase
        .from('bills')
        // @ts-ignore - Generic type inference issue
        .update(updates as any)
        .eq('id', id as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

/**
 * Delete a bill
 */
export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

/**
 * Toggle bill status (active/paused)
 */
export function useToggleBillStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { data, error } = await supabase
        .from('bills')
        // @ts-ignore - Generic type inference issue
        .update({ status } as any)
        .eq('id', id as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

/**
 * Mark a bill as paid (creates a transaction and updates next_due)
 */
export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      billId, 
      amount, 
      date, 
      accountId,
      categoryId,
      payeeId,
    }: { 
      billId: string; 
      amount: number;
      date: string;
      accountId: string;
      categoryId: string;
      payeeId: string | null;
    }) => {
      // Create transaction
      const transaction = await insertWithOwnership('transactions', {
        date,
        account_id: accountId,
        amount: -Math.abs(amount), // Negative for expense
        payee_id: payeeId,
        category_id: categoryId,
        notes: 'Bill payment',
        is_pending: false,
      });

      // TODO: Calculate next_due based on RRULE
      // For now, just set it to next month
      const nextDue = new Date(date);
      nextDue.setMonth(nextDue.getMonth() + 1);

      // Update bill's next_due
      await supabase
        .from('bills')
        // @ts-ignore - Generic type inference issue
        .update({ next_due: nextDue.toISOString().split('T')[0] } as any)
        .eq('id', billId as any);

      return transaction[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
