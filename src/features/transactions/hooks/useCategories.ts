/**
 * useCategories Hook
 * 
 * React Query hook for fetching categories.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

/**
 * Fetch all categories for the current user
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('created_by', userId as any)
        .order('path');

      if (error) throw error;
      return data as unknown as Category[];
    },
  });
}

/**
 * Get budgetable categories (for transaction categorization)
 */
export function useBudgetableCategories() {
  return useQuery({
    queryKey: ['categories', 'budgetable'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('created_by', userId as any)
        .eq('is_budgetable', true as any)
        .order('path');

      if (error) throw error;
      return data as unknown as Category[];
    },
  });
}
