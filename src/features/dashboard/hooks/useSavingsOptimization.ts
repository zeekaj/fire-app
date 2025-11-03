/**
 * useSavingsOptimization Hook
 * 
 * Analyzes spending patterns and provides recommendations for improving savings rate.
 */

import { useMemo } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import { useBudgets } from '@/features/budgets/hooks/useBudgets';
import { startOfMonth, format } from 'date-fns';

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentOfTotal: number;
  hasbudget: boolean;
  budgetAmount?: number;
  overBudget?: boolean;
}

export interface OptimizationInsight {
  type: 'high-spending' | 'over-budget' | 'no-budget' | 'savings-opportunity';
  title: string;
  description: string;
  categoryName?: string;
  amount?: number;
  potentialSavings?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SavingsOptimization {
  currentSavingsRate: number;
  monthlyIncome: number;
  monthlySpending: number;
  monthlySavings: number;
  categorySpending: CategorySpending[];
  insights: OptimizationInsight[];
  potentialSavingsRate: number;
  totalPotentialSavings: number;
}

export function useSavingsOptimization(): SavingsOptimization {
  const { data: transactions = [] } = useTransactions(500);
  const { data: categories = [] } = useCategories();
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
  const { data: budgets = [] } = useBudgets(currentMonth);

  return useMemo(() => {
    // Get this month's transactions
    const thisMonthTransactions = transactions.filter((tx) => 
      tx.date.startsWith(currentMonth)
    );

    // Calculate income and spending
    const monthlyIncome = thisMonthTransactions.reduce((sum, tx) => {
      if (tx.amount > 0) return sum + tx.amount;
      return sum;
    }, 0);

    const monthlySpending = thisMonthTransactions.reduce((sum, tx) => {
      if (tx.amount < 0) return sum + Math.abs(tx.amount);
      return sum;
    }, 0);

    const monthlySavings = monthlyIncome - monthlySpending;
    const currentSavingsRate = monthlyIncome > 0 
      ? (monthlySavings / monthlyIncome) * 100 
      : 0;

    // Analyze spending by category
    const categorySpendingMap = new Map<string, number>();
    thisMonthTransactions.forEach((tx) => {
      if (tx.amount < 0 && tx.category_id) {
        const current = categorySpendingMap.get(tx.category_id) || 0;
        categorySpendingMap.set(tx.category_id, current + Math.abs(tx.amount));
      }
    });

    const categorySpending: CategorySpending[] = Array.from(categorySpendingMap.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find((c: any) => c.id === categoryId);
        const budget = budgets.find((b) => b.category_id === categoryId);
        
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          amount,
          percentOfTotal: monthlySpending > 0 ? (amount / monthlySpending) * 100 : 0,
          hasbudget: !!budget,
          budgetAmount: budget?.target,
          overBudget: budget ? amount > budget.target : false,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Generate insights
    const insights: OptimizationInsight[] = [];

    // 1. High spending categories (>20% of total spending)
    categorySpending.forEach((cat) => {
      if (cat.percentOfTotal > 20 && cat.amount > 100) {
        insights.push({
          type: 'high-spending',
          title: `High spending in ${cat.categoryName}`,
          description: `This category represents ${cat.percentOfTotal.toFixed(1)}% of your total spending. Even a 10% reduction could save you $${(cat.amount * 0.1).toFixed(0)}/month.`,
          categoryName: cat.categoryName,
          amount: cat.amount,
          potentialSavings: cat.amount * 0.1,
          priority: 'high',
        });
      }
    });

    // 2. Over-budget categories
    categorySpending.forEach((cat) => {
      if (cat.overBudget && cat.budgetAmount) {
        const overAmount = cat.amount - cat.budgetAmount;
        insights.push({
          type: 'over-budget',
          title: `Over budget in ${cat.categoryName}`,
          description: `You've spent $${overAmount.toFixed(0)} more than your budget of $${cat.budgetAmount.toFixed(0)}. Staying on budget would increase your savings rate.`,
          categoryName: cat.categoryName,
          amount: overAmount,
          potentialSavings: overAmount,
          priority: 'high',
        });
      }
    });

    // 3. Categories without budgets (top 3 by spending)
    const noBudgetCategories = categorySpending
      .filter((cat) => !cat.hasbudget && cat.amount > 50)
      .slice(0, 3);
    
    noBudgetCategories.forEach((cat) => {
      insights.push({
        type: 'no-budget',
        title: `No budget set for ${cat.categoryName}`,
        description: `You spent $${cat.amount.toFixed(0)} in this category this month. Setting a budget could help control spending.`,
        categoryName: cat.categoryName,
        amount: cat.amount,
        priority: 'medium',
      });
    });

    // 4. General savings opportunities based on savings rate
    if (currentSavingsRate < 10) {
      insights.push({
        type: 'savings-opportunity',
        title: 'Low savings rate detected',
        description: `Your current savings rate is ${currentSavingsRate.toFixed(1)}%. Consider reviewing your top spending categories to find areas to cut back.`,
        priority: 'high',
      });
    } else if (currentSavingsRate < 20) {
      insights.push({
        type: 'savings-opportunity',
        title: 'Room for improvement',
        description: `Your savings rate of ${currentSavingsRate.toFixed(1)}% is decent, but increasing it to 20%+ would significantly accelerate your FIRE journey.`,
        priority: 'medium',
      });
    } else if (currentSavingsRate >= 50) {
      insights.push({
        type: 'savings-opportunity',
        title: 'Excellent savings rate!',
        description: `Your ${currentSavingsRate.toFixed(1)}% savings rate is fantastic! You're on track for an early FIRE.`,
        priority: 'low',
      });
    }

    // Calculate potential savings
    const totalPotentialSavings = insights
      .filter((i) => i.potentialSavings)
      .reduce((sum, i) => sum + (i.potentialSavings || 0), 0);

    const potentialSavingsRate = monthlyIncome > 0
      ? ((monthlySavings + totalPotentialSavings) / monthlyIncome) * 100
      : currentSavingsRate;

    // Sort insights by priority
    insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      currentSavingsRate,
      monthlyIncome,
      monthlySpending,
      monthlySavings,
      categorySpending,
      insights,
      potentialSavingsRate,
      totalPotentialSavings,
    };
  }, [transactions, categories, budgets, currentMonth]);
}
