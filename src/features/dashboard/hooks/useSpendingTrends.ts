/**
 * useSpendingTrends Hook
 *
 * Provides category-level monthly spending trends and insights.
 */

import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import { format } from 'date-fns';

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  monthly: { month: string; amount: number }[];
  lastMonthAmount: number;
  thisMonthAmount: number;
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'flat';
}

export interface SpendingTrendsInsights {
  topIncreases: CategoryTrend[];
  topDecreases: CategoryTrend[];
  stableCategories: CategoryTrend[];
  summary: string;
}

export function useSpendingTrends(months: number = 6): SpendingTrendsInsights {
  const { data: transactions = [] } = useTransactions(months * 100);
  const { data: categories = [] } = useCategories();

  return useMemo(() => {
    // Get last N months
    const now = new Date();
    const monthKeys: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(format(d, 'yyyy-MM'));
    }

    // Aggregate spending by category and month
    const categoryMonthMap = new Map<string, Map<string, number>>();
    transactions.forEach((tx) => {
      if (tx.amount < 0 && tx.category_id) {
        const month = tx.date.slice(0, 7);
        if (!categoryMonthMap.has(tx.category_id)) {
          categoryMonthMap.set(tx.category_id, new Map());
        }
        const monthMap = categoryMonthMap.get(tx.category_id)!;
        monthMap.set(month, (monthMap.get(month) || 0) + Math.abs(tx.amount));
      }
    });

    // Build trends
    const trends: CategoryTrend[] = Array.from(categoryMonthMap.entries()).map(([categoryId, monthMap]) => {
      const category = categories.find((c: any) => c.id === categoryId);
      const monthly = monthKeys.map((month) => ({
        month,
        amount: monthMap.get(month) || 0,
      }));
      const lastMonthAmount = monthly[months - 2]?.amount || 0;
      const thisMonthAmount = monthly[months - 1]?.amount || 0;
      const change = thisMonthAmount - lastMonthAmount;
      const percentChange = lastMonthAmount > 0 ? (change / lastMonthAmount) * 100 : 0;
      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (percentChange > 10) trend = 'up';
      else if (percentChange < -10) trend = 'down';
      return {
        categoryId,
        categoryName: category?.name || 'Unknown',
        monthly,
        lastMonthAmount,
        thisMonthAmount,
        change,
        percentChange,
        trend,
      };
    });

    // Sort and select top movers
    const topIncreases = trends
      .filter((t) => t.trend === 'up' && t.thisMonthAmount > 50)
      .sort((a, b) => b.percentChange - a.percentChange)
      .slice(0, 3);
    const topDecreases = trends
      .filter((t) => t.trend === 'down' && t.lastMonthAmount > 50)
      .sort((a, b) => a.percentChange - b.percentChange)
      .slice(0, 3);
    const stableCategories = trends
      .filter((t) => t.trend === 'flat' && t.thisMonthAmount > 50)
      .sort((a, b) => b.thisMonthAmount - a.thisMonthAmount)
      .slice(0, 3);

    // Build summary
    let summary = '';
    if (topIncreases.length > 0) {
      summary += `Biggest increases: ${topIncreases.map(t => `${t.categoryName} (+${t.percentChange.toFixed(0)}%)`).join(', ')}. `;
    }
    if (topDecreases.length > 0) {
      summary += `Biggest decreases: ${topDecreases.map(t => `${t.categoryName} (${t.percentChange.toFixed(0)}%)`).join(', ')}. `;
    }
    if (!summary) {
      summary = 'Spending patterns are stable this month.';
    }

    return {
      topIncreases,
      topDecreases,
      stableCategories,
      summary,
    };
  }, [transactions, categories, months]);
}
