/**
 * useDashboardMetrics Hook
 * 
 * Calculates key metrics for the dashboard.
 */

import { useMemo } from 'react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

export function useDashboardMetrics() {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions(100);

  const metrics = useMemo(() => {
    // Calculate Net Worth
    const netWorth = accounts.reduce((sum, account) => {
      return sum + (account.current_balance || 0);
    }, 0);

    // Calculate this month's spending
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const thisMonthTransactions = transactions.filter((tx) => {
      return tx.date.startsWith(currentMonth);
    });

    const monthlySpending = thisMonthTransactions.reduce((sum, tx) => {
      // Only count expenses (negative amounts)
      if (tx.amount < 0) {
        return sum + Math.abs(tx.amount);
      }
      return sum;
    }, 0);

    const monthlyIncome = thisMonthTransactions.reduce((sum, tx) => {
      // Only count income (positive amounts)
      if (tx.amount > 0) {
        return sum + tx.amount;
      }
      return sum;
    }, 0);

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlySpending) / monthlyIncome) * 100 
      : 0;

    // Simple FIRE calculation: 25x annual expenses (4% rule)
    const annualExpenses = monthlySpending * 12;
    const fireNumber = annualExpenses * 25;
    const progressToFire = fireNumber > 0 ? (netWorth / fireNumber) * 100 : 0;

    // Estimate years to FIRE (simplified)
    let yearsToFire = 0;
    if (monthlyIncome > monthlySpending && monthlyIncome > 0) {
      const monthlySavings = monthlyIncome - monthlySpending;
      const remainingNeeded = Math.max(0, fireNumber - netWorth);
      if (monthlySavings > 0) {
        yearsToFire = remainingNeeded / (monthlySavings * 12);
      }
    }

    return {
      netWorth,
      monthlySpending,
      monthlyIncome,
      savingsRate,
      fireNumber,
      progressToFire,
      yearsToFire: yearsToFire > 0 && yearsToFire < 100 ? yearsToFire : null,
      transactionCount: transactions.length,
      accountCount: accounts.length,
    };
  }, [accounts, transactions]);

  return metrics;
}
