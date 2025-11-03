/**
 * useIncomeExpenses Hook
 * 
 * Calculates income vs expenses data for monthly comparison and tracking.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface MonthlyData {
  month: string; // YYYY-MM
  monthLabel: string; // "Jan 2025"
  income: number;
  expenses: number;
  netIncome: number;
  savingsRate: number;
  transactionCount: number;
}

export interface IncomeExpensesData {
  currentMonth: MonthlyData;
  previousMonth: MonthlyData;
  last6Months: MonthlyData[];
  yearToDate: {
    income: number;
    expenses: number;
    netIncome: number;
    savingsRate: number;
    avgMonthlySavings: number;
  };
}

/**
 * Fetch and calculate income vs expenses data
 */
export function useIncomeExpenses() {
  return useQuery({
    queryKey: ['income-expenses'],
    queryFn: async () => {
      const userId = await requireAuth();

      // Get transactions from the last 12 months
      const startDate = startOfMonth(subMonths(new Date(), 11));
      const endDate = endOfMonth(new Date());

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount, category_id')
        .eq('created_by', userId as any)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      // Group transactions by month
      const monthlyMap = new Map<string, {
        income: number;
        expenses: number;
        count: number;
      }>();

      (transactions || []).forEach(tx => {
        const month = tx.date.substring(0, 7); // YYYY-MM
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { income: 0, expenses: 0, count: 0 });
        }
        
        const data = monthlyMap.get(month)!;
        data.count++;
        
        if (tx.amount > 0) {
          data.income += tx.amount;
        } else {
          data.expenses += Math.abs(tx.amount);
        }
      });

      // Helper to create MonthlyData
      const createMonthlyData = (month: string): MonthlyData => {
        const data = monthlyMap.get(month) || { income: 0, expenses: 0, count: 0 };
        const netIncome = data.income - data.expenses;
        const savingsRate = data.income > 0 ? (netIncome / data.income) * 100 : 0;
        
        // Format month label
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthLabel = format(date, 'MMM yyyy');

        return {
          month,
          monthLabel,
          income: data.income,
          expenses: data.expenses,
          netIncome,
          savingsRate,
          transactionCount: data.count,
        };
      };

      // Get current and previous month
      const now = new Date();
      const currentMonth = format(now, 'yyyy-MM');
      const previousMonth = format(subMonths(now, 1), 'yyyy-MM');

      // Get last 6 months of data
      const last6Months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = format(subMonths(now, i), 'yyyy-MM');
        last6Months.push(createMonthlyData(month));
      }

      // Calculate year-to-date totals
      const monthsSinceYearStart = now.getMonth() + 1;
      
      let ytdIncome = 0;
      let ytdExpenses = 0;
      
      for (let i = 0; i < monthsSinceYearStart; i++) {
        const month = format(new Date(now.getFullYear(), i, 1), 'yyyy-MM');
        const data = monthlyMap.get(month) || { income: 0, expenses: 0, count: 0 };
        ytdIncome += data.income;
        ytdExpenses += data.expenses;
      }

      const ytdNetIncome = ytdIncome - ytdExpenses;
      const ytdSavingsRate = ytdIncome > 0 ? (ytdNetIncome / ytdIncome) * 100 : 0;
      const avgMonthlySavings = monthsSinceYearStart > 0 ? ytdNetIncome / monthsSinceYearStart : 0;

      const result: IncomeExpensesData = {
        currentMonth: createMonthlyData(currentMonth),
        previousMonth: createMonthlyData(previousMonth),
        last6Months,
        yearToDate: {
          income: ytdIncome,
          expenses: ytdExpenses,
          netIncome: ytdNetIncome,
          savingsRate: ytdSavingsRate,
          avgMonthlySavings,
        },
      };

      return result;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
