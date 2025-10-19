/**
 * useAccounts Hook
 * 
 * React Query hook for fetching and managing accounts.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountGroup = Database['public']['Tables']['account_groups']['Row'];

export type AccountWithGroup = Account & {
  account_group: AccountGroup | null;
};

/**
 * Fetch all accounts for the current user with their account groups
 */
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          account_group:account_groups(*)
        `)
        .eq('created_by', userId as any)
        .order('name');

      if (error) throw error;
      return data as unknown as AccountWithGroup[];
    },
  });
}
