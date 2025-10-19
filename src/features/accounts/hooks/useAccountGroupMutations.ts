/**
 * Account Group Mutations
 * 
 * React Query mutations for creating, updating, and deleting account groups.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { insertWithOwnership } from '@/lib/data-utils';
import type { Database } from '@/lib/database.types';

type AccountGroupInsert = Database['public']['Tables']['account_groups']['Insert'];
type AccountGroupUpdate = Database['public']['Tables']['account_groups']['Update'];

/**
 * Hook to create a new account group
 */
export function useCreateAccountGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<AccountGroupInsert, 'created_by' | 'id' | 'created_at'>) => {
      const row = await insertWithOwnership('account_groups', data);
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
    },
  });
}

/**
 * Hook to update an existing account group
 */
export function useUpdateAccountGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AccountGroupUpdate & { id: string }) => {
      const { data, error} = await supabase
        .from('account_groups')
        // @ts-ignore - Generic type inference issue
        .update(updates as any)
        .eq('id', id as any)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
    },
  });
}

/**
 * Hook to delete an account group
 */
export function useDeleteAccountGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('account_groups')
        .delete()
        .eq('id', id as any);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-groups'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
