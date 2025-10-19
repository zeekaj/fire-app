/**
 * useCategorySpending Hook
 * 
 * Calculate spending by category for a given month.
 */

import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

/**
 * Calculate spending by category for a specific month
 */
export function useCategorySpending(month: string) {
  const { data: transactions = [] } = useTransactions(500); // Get more transactions for accurate totals

  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    // Filter transactions for the specified month
    const monthTransactions = transactions.filter((tx) => {
      return tx.date.startsWith(month) && tx.category_id;
    });

    // Sum spending by category (only expenses - negative amounts)
    monthTransactions.forEach((tx) => {
      if (tx.category_id && tx.amount < 0) {
        const current = categoryMap.get(tx.category_id) || 0;
        categoryMap.set(tx.category_id, current + Math.abs(tx.amount));
      }
    });

    return categoryMap;
  }, [transactions, month]);

  return spendingByCategory;
}
