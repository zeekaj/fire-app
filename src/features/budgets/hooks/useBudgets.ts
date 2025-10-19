/**
 * useBudgets Hook
 * 
 * React Query hooks for managing monthly budgets.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Fetch budgets for a specific month
 */
export function useBudgets(month: string = getCurrentMonth()) {
  return useQuery({
    queryKey: ['budgets', month],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('created_by', userId as any)
        .eq('month', month as any);

      if (error) throw error;
      return data as unknown as Budget[];
    },
  });
}

/**
 * Create a new budget
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: Omit<BudgetInsert, 'created_by'>) => {
      return await insertWithOwnership('budgets', budget);
    },
    onSuccess: (_, variables) => {
      // Invalidate budgets query for the specific month
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.month] });
    },
  });
}

/**
 * Update an existing budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, target }: { id: string; target: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        // @ts-ignore - Generic type inference issue
        .update({ target } as any)
        .eq('id', id as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all budget queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
