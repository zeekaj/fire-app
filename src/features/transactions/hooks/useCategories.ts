/**
 * useCategories Hook
 * 
 * React Query hook for fetching categories.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

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
 * Returns only leaf categories (those without children) to avoid duplicates
 */
export function useBudgetableCategories() {
  return useQuery({
    queryKey: ['categories', 'budgetable'],
    queryFn: async () => {
      const userId = await requireAuth();

      // First get all categories
      const { data: allCategories, error: allError } = await supabase
        .from('categories')
        .select('*')
        .eq('created_by', userId as any)
        .eq('is_budgetable', true as any)
        .order('path');

      if (allError) throw allError;
      
      const categories = allCategories as unknown as Category[];
      
      // Find all parent IDs (categories that have children)
      const parentIds = new Set(
        categories
          .map(cat => cat.parent_id)
          .filter(id => id !== null)
      );
      
      // Return only leaf categories (those that are not parents)
      // This prevents showing both "Food" and "Food > Groceries"
      const leafCategories = categories.filter(cat => !parentIds.has(cat.id));
      
      return leafCategories;
    },
  });
}

/**
 * Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<CategoryInsert, 'created_by'>) => {
      const result = await insertWithOwnership('categories', category);
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
