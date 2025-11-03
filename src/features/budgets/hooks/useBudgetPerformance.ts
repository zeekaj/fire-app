/**
 * useBudgetPerformance Hook
 * 
 * Provides budget vs actual spending analysis for categories.
 * Shows how much has been spent vs budgeted for each category.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  budgeted: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  status: 'under' | 'near' | 'over'; // under budget, near budget (>80%), over budget
}

export interface BudgetPerformanceData {
  month: string;
  categories: CategoryPerformance[];
  totals: {
    budgeted: number;
    actual: number;
    remaining: number;
    percentUsed: number;
  };
}

/**
 * Fetch budget performance for a specific month
 */
export function useBudgetPerformance(month: string = format(new Date(), 'yyyy-MM')) {
  return useQuery({
    queryKey: ['budget-performance', month],
    queryFn: async () => {
      const userId = await requireAuth();

      const startDate = format(startOfMonth(new Date(month + '-01')), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(month + '-01')), 'yyyy-MM-dd');

      // Fetch budgets for the month
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*, category:categories(name)')
        .eq('created_by', userId as any)
        .eq('month', month);

      if (budgetsError) throw budgetsError;

      // Fetch actual spending for the month (expenses only, negatives)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('created_by', userId as any)
        .gte('date', startDate)
        .lte('date', endDate)
        .lt('amount', 0); // Only expenses (negative amounts)

      if (transactionsError) throw transactionsError;

      // Calculate actual spending per category
      const actualSpending = new Map<string, number>();
      (transactions || []).forEach(tx => {
        if (tx.category_id) {
          const current = actualSpending.get(tx.category_id) || 0;
          actualSpending.set(tx.category_id, current + Math.abs(tx.amount));
        }
      });

      // Build performance data
      const categories: CategoryPerformance[] = (budgets || []).map((budget: any) => {
        const budgeted = budget.target;
        const actual = actualSpending.get(budget.category_id) || 0;
        const remaining = budgeted - actual;
        const percentUsed = budgeted > 0 ? (actual / budgeted) * 100 : 0;

        let status: 'under' | 'near' | 'over';
        if (percentUsed > 100) {
          status = 'over';
        } else if (percentUsed > 80) {
          status = 'near';
        } else {
          status = 'under';
        }

        return {
          category_id: budget.category_id,
          category_name: budget.category?.name || 'Unknown',
          budgeted,
          actual,
          remaining,
          percentUsed,
          status,
        };
      });

      // Calculate totals
      const totals = categories.reduce(
        (acc, cat) => ({
          budgeted: acc.budgeted + cat.budgeted,
          actual: acc.actual + cat.actual,
          remaining: acc.remaining + cat.remaining,
          percentUsed: 0, // Will calculate after
        }),
        { budgeted: 0, actual: 0, remaining: 0, percentUsed: 0 }
      );
      totals.percentUsed = totals.budgeted > 0 ? (totals.actual / totals.budgeted) * 100 : 0;

      const result: BudgetPerformanceData = {
        month,
        categories: categories.sort((a, b) => b.percentUsed - a.percentUsed), // Sort by percent used (highest first)
        totals,
      };

      return result;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
