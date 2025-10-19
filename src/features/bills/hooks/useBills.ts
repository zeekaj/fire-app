/**
 * useBills Hook
 * 
 * Fetches all bills for the current user with related data.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

export type Bill = Database['public']['Tables']['bills']['Row'] & {
  account: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  payee: { id: string; name: string } | null;
};

/**
 * Fetch all bills for the current user
 */
export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          account:accounts(id, name),
          category:categories(id, name),
          payee:payees(id, name)
        `)
        .eq('created_by', userId)
        .order('next_due', { ascending: true });

      if (error) throw error;
      return data as Bill[];
    },
  });
}

/**
 * Fetch active bills only
 */
export function useActiveBills() {
  return useQuery({
    queryKey: ['bills', 'active'],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          account:accounts(id, name),
          category:categories(id, name),
          payee:payees(id, name)
        `)
        .eq('created_by', userId)
        .eq('status', 'active')
        .order('next_due', { ascending: true });

      if (error) throw error;
      return data as Bill[];
    },
  });
}

/**
 * Calculate the next occurrence of a bill based on RRULE
 * For now, returns a simple placeholder. Full RRULE parsing can be added later.
 */
export function calculateNextDue(rrule: string): Date {
  // Simplified logic - in production, use rrule library
  const today = new Date();
  
  // Basic monthly recurrence (most common case)
  if (rrule.includes('FREQ=MONTHLY')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }
  
  // Default to next month
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth;
}
