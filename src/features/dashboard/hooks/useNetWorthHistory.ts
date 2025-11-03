/**
 * useNetWorthHistory Hook
 * 
 * Fetches and manages net worth historical data for charting.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import type { Database } from '@/lib/database.types';

type NetWorthSnapshotInsert = Database['public']['Tables']['net_worth_snapshots']['Insert'];

export interface NetWorthDataPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

/**
 * Fetch net worth snapshots for a given date range
 */
export function useNetWorthHistory(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['net-worth-history', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        const userId = await requireAuth();

        let query = supabase
          .from('net_worth_snapshots')
          .select('*')
          .eq('created_by', userId)
          .order('snapshot_date', { ascending: true });

        if (startDate) {
          query = query.gte('snapshot_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          query = query.lte('snapshot_date', endDate.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Net Worth History Query Error:', error);
          throw error;
        }

        // Transform to chart-friendly format
        const chartData: NetWorthDataPoint[] = (data || []).map((snapshot) => ({
          date: snapshot.snapshot_date,
          netWorth: Number(snapshot.net_worth),
          assets: Number(snapshot.total_assets),
          liabilities: Number(snapshot.total_liabilities),
        }));

        return chartData;
      } catch (error) {
        console.error('Net Worth History Error:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Fetch the most recent snapshot date for the current user
 */
export function useLatestNetWorthSnapshot() {
  return useQuery({
    queryKey: ['net-worth-latest'],
    queryFn: async () => {
      const userId = await requireAuth();
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .select('snapshot_date')
        .eq('created_by', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data && data.length > 0 ? data[0].snapshot_date as string : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Calculate current net worth from accounts
 */
export function useCurrentNetWorth() {
  const { data: accounts = [] } = useAccounts();

  const netWorthData = {
    assets: 0,
    liabilities: 0,
    netWorth: 0,
  };

  accounts.forEach(account => {
    const balance = account.current_balance || 0;
    const liabilityTypes = ['credit', 'mortgage'];
    
    if (liabilityTypes.includes(account.type)) {
      netWorthData.liabilities += Math.abs(balance);
    } else if (balance > 0) {
      netWorthData.assets += balance;
    } else {
      netWorthData.liabilities += Math.abs(balance);
    }
  });

  netWorthData.netWorth = netWorthData.assets - netWorthData.liabilities;

  return netWorthData;
}

/**
 * Create a new net worth snapshot
 */
export function useCreateNetWorthSnapshot() {
  const queryClient = useQueryClient();
  const currentNetWorth = useCurrentNetWorth();
  const { data: accounts = [] } = useAccounts();

  return useMutation({
    mutationFn: async (date: Date = new Date()) => {
      const userId = await requireAuth();

      const snapshot: NetWorthSnapshotInsert = {
        created_by: userId,
        snapshot_date: date.toISOString().split('T')[0],
        total_assets: currentNetWorth.assets,
        total_liabilities: currentNetWorth.liabilities,
        net_worth: currentNetWorth.netWorth,
        account_count: accounts.length,
      };

      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .upsert(snapshot, { onConflict: 'created_by,snapshot_date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-latest'] });
    },
  });
}

/**
 * Generate historical snapshots by calculating net worth at various dates
 * This is useful for backfilling data based on transaction history
 */
export function useGenerateHistoricalSnapshots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ startDate, endDate, interval = 'monthly' }: {
      startDate: Date;
      endDate: Date;
      interval?: 'daily' | 'weekly' | 'monthly';
    }) => {
      const userId = await requireAuth();

      // Fetch all accounts and transactions
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('created_by', userId);

      if (accountsError) throw accountsError;

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Generate snapshot dates based on interval
      const dates: Date[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        
        if (interval === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (interval === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Calculate net worth for each date
      const snapshots: NetWorthSnapshotInsert[] = dates.map(date => {
        let assets = 0;
        let liabilities = 0;

        accounts?.forEach(account => {
          // Start with opening balance
          let balance = Number(account.opening_balance || 0);

          // Add all transactions up to this date
          const accountTransactions = transactions?.filter(
            tx => tx.account_id === account.id && new Date(tx.date) <= date
          ) || [];

          accountTransactions.forEach(tx => {
            balance += Number(tx.amount);
          });

          // Categorize as asset or liability
          const liabilityTypes = ['credit', 'mortgage'];
          if (liabilityTypes.includes(account.type)) {
            liabilities += Math.abs(balance);
          } else if (balance > 0) {
            assets += balance;
          } else {
            liabilities += Math.abs(balance);
          }
        });

        return {
          created_by: userId,
          snapshot_date: date.toISOString().split('T')[0],
          total_assets: assets,
          total_liabilities: liabilities,
          net_worth: assets - liabilities,
          account_count: accounts?.length || 0,
        };
      });

      // Insert all snapshots
      const { data, error } = await supabase
        .from('net_worth_snapshots')
        .upsert(snapshots, { onConflict: 'created_by,snapshot_date' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-latest'] });
    },
  });
}
