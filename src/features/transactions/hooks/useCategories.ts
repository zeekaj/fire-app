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
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

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

/**
 * Delete a category (only if it has no children)
 * - We block deletion when the category still has children because
 *   the schema sets child parent_id to null on parent delete, leaving orphaned paths.
 * - Transactions referencing the category will have category_id set to null (per FK rule).
 * - Budgets / bills referencing the category are cascaded by FK and will be removed.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await requireAuth();

      // Check for children
      const { data: children, error: childrenError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId as any)
        .limit(1);
      if (childrenError) throw childrenError;
      if (children && children.length > 0) {
        throw new Error('Cannot delete a parent category with subcategories. Delete subcategories first.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId as any);
      if (error) throw error;
      return categoryId;
    },
    onSuccess: (deletedId) => {
      // Optimistically remove from cache
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return old;
        return (old as Category[]).filter(c => c.id !== deletedId);
      });
    },
  });
}

/**
 * Cascade delete a category and all descendants.
 * Finds all categories whose path starts with the target category's path.
 */
export function useCascadeDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await requireAuth();

      // Get target category path
      const { data: targetData, error: targetError } = await supabase
        .from('categories')
        .select('id, path')
        .eq('id', categoryId as any)
        .limit(1);
      if (targetError) throw targetError;
      const target = targetData?.[0];
      if (!target) throw new Error('Category not found');

      // Get descendants by path prefix
      const { data: allCats, error: allErr } = await supabase
        .from('categories')
        .select('id, path');
      if (allErr) throw allErr;
      const toDelete = (allCats || []).filter(c => c.path === target.path || c.path?.startsWith(target.path + '>'));
      const ids = toDelete.map(c => c.id);
      if (ids.length === 0) return [];

      const { error: delError } = await supabase
        .from('categories')
        .delete()
        .in('id', ids as any);
      if (delError) throw delError;
      return ids;
    },
    onSuccess: (deletedIds) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return old;
        return (old as Category[]).filter(c => !deletedIds.includes(c.id));
      });
    },
  });
}

/**
 * Update a category (name/parent/budgetable) and fix descendant paths.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; name: string; parentId: string | null; isBudgetable: boolean }) => {
      await requireAuth();

      // Fetch existing category
      const { data: existingData, error: existingError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', payload.id as any)
        .limit(1);
      if (existingError) throw existingError;
      const existing = existingData?.[0] as Category | undefined;
      if (!existing) throw new Error('Category not found');

      // Determine new path
      let newPath: string;
      if (payload.parentId) {
        // Fetch parent name
        const { data: parentData, error: parentError } = await supabase
          .from('categories')
          .select('id, name, path')
          .eq('id', payload.parentId as any)
          .limit(1);
        if (parentError) throw parentError;
        const parent = parentData?.[0];
        if (!parent) throw new Error('Parent category not found');
        newPath = `${parent.name}>${payload.name}`;
      } else {
        newPath = payload.name;
      }

      // Update target category
      const { error: updateErr } = await supabase
        .from('categories')
        .update({
          name: payload.name,
          parent_id: payload.parentId,
          path: newPath,
          is_budgetable: payload.isBudgetable,
        } as CategoryUpdate)
        .eq('id', payload.id as any);
      if (updateErr) throw updateErr;

      // If path changed, update descendants
      if (existing.path && existing.path !== newPath) {
        const { data: allCats, error: allErr } = await supabase
          .from('categories')
          .select('id, path');
        if (allErr) throw allErr;
        const descendants = (allCats || []).filter(c => c.path?.startsWith(existing.path + '>'));
        for (const desc of descendants) {
          if (!desc.path) continue;
          const newDescPath = desc.path.replace(existing.path + '>', newPath + '>');
          const { error: descErr } = await supabase
            .from('categories')
            .update({ path: newDescPath } as CategoryUpdate)
            .eq('id', desc.id as any);
          if (descErr) throw descErr;
        }
      }
      return payload.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
