import { useMemo } from 'react';
import type { Database } from '../../../lib/database.types';
import { formatCurrency } from '../../../lib/format';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Payee = Database['public']['Tables']['payees']['Row'];

interface TransactionAnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
  payees: Payee[];
}

interface CategoryTotal {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface PayeeTotal {
  payee: string;
  amount: number;
  count: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export function TransactionAnalytics({ transactions, categories, payees }: TransactionAnalyticsProps) {
  // Helper to get leaf category name from path
  const getCategoryLeafName = (category: Category) => {
    if (category.path) {
      const parts = category.path.split('>');
      return parts[parts.length - 1];
    }
    return category.name;
  };

  // Create lookup maps
  const payeeMap = useMemo(() => new Map(payees.map(p => [p.id, p.name])), [payees]);
  const categoryNameMap = useMemo(() => 
    new Map(categories.map(c => [c.id, getCategoryLeafName(c)])), 
    [categories]
  );

  // Calculate category breakdown (expenses only, excluding transfers)
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalExpenses = 0;

    transactions.forEach(tx => {
      // Skip transfers
      if (tx.transfer_id) return;
      
      if (tx.amount < 0) {
        const categoryName = categoryNameMap.get(tx.category_id || '') || 'Uncategorized';
        const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };
        categoryMap.set(categoryName, {
          amount: current.amount + Math.abs(tx.amount),
          count: current.count + 1
        });
        totalExpenses += Math.abs(tx.amount);
      }
    });

    const breakdown: CategoryTotal[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories

    return breakdown;
  }, [transactions, categoryNameMap]);

  // Calculate top payees (expenses only, excluding transfers)
  const topPayees = useMemo(() => {
    const payeeAmountMap = new Map<string, { amount: number; count: number }>();

    transactions.forEach(tx => {
      // Skip transfers
      if (tx.transfer_id) return;
      
      if (tx.amount < 0) {
        const payeeName = payeeMap.get(tx.payee_id || '') || 'Unknown';
        const current = payeeAmountMap.get(payeeName) || { amount: 0, count: 0 };
        payeeAmountMap.set(payeeName, {
          amount: current.amount + Math.abs(tx.amount),
          count: current.count + 1
        });
      }
    });

    const payees: PayeeTotal[] = Array.from(payeeAmountMap.entries())
      .map(([payee, data]) => ({
        payee,
        amount: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 payees

    return payees;
  }, [transactions, payeeMap]);

  // Calculate monthly trends (last 6 months, excluding transfers)
  const monthlyTrends = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(tx => {
      // Skip transfers
      if (tx.transfer_id) return;
      
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (tx.amount > 0) {
        current.income += tx.amount;
      } else {
        current.expenses += Math.abs(tx.amount);
      }
      
      monthMap.set(monthKey, current);
    });

    const trends: MonthlyData[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return trends;
  }, [transactions]);

  // Calculate debt payment progress
  const debtPaymentStats = useMemo(() => {
    let totalDebtPayments = 0;
    let count = 0;
    const monthlyPayments = new Map<string, number>();

    transactions.forEach(tx => {
      if (tx.transaction_type === 'debt_payment' && tx.amount < 0) {
        const amount = Math.abs(tx.amount);
        totalDebtPayments += amount;
        count++;

        const date = new Date(tx.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyPayments.set(monthKey, (monthlyPayments.get(monthKey) || 0) + amount);
      }
    });

    const monthlyData = Array.from(monthlyPayments.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return {
      total: totalDebtPayments,
      count,
      monthlyData,
      averagePayment: count > 0 ? totalDebtPayments / count : 0
    };
  }, [transactions]);

  const maxCategoryAmount = categoryBreakdown[0]?.amount || 1;
  const maxPayeeAmount = topPayees[0]?.amount || 1;
  const maxMonthlyAmount = Math.max(
    ...monthlyTrends.map(m => Math.max(m.income, m.expenses))
  );
  const maxDebtPayment = Math.max(...debtPaymentStats.monthlyData.map(d => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Category Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Spending Categories
        </h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-gray-500 text-sm">No expense data available</p>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{cat.category}</span>
                  <span className="text-gray-600">
                    {formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(cat.amount / maxCategoryAmount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {cat.count} tx
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Payees */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Payees
        </h3>
        {topPayees.length === 0 ? (
          <p className="text-gray-500 text-sm">No payee data available</p>
        ) : (
          <div className="space-y-3">
            {topPayees.map((payee, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{payee.payee}</span>
                  <span className="text-gray-600">
                    {formatCurrency(payee.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(payee.amount / maxPayeeAmount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {payee.count} tx
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Trends (Last 6 Months)
        </h3>
        {monthlyTrends.length === 0 ? (
          <p className="text-gray-500 text-sm">No trend data available</p>
        ) : (
          <div className="space-y-4">
            {monthlyTrends.map((month, idx) => {
              const date = new Date(month.month + '-01');
              const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">
                    {monthLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Income Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Income</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(month.income)}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(month.income / maxMonthlyAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expenses Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Expenses</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(month.expenses)}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(month.expenses / maxMonthlyAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Net */}
                  <div className="text-xs text-right">
                    Net: <span className={`font-medium ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(month.net)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Payment Progress */}
      {debtPaymentStats.total > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💳</span>
            Debt Payment Progress
          </h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Total Paid</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(debtPaymentStats.total)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Payments Made</div>
              <div className="text-xl font-bold text-gray-900">
                {debtPaymentStats.count}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Avg Payment</div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(debtPaymentStats.averagePayment)}
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          {debtPaymentStats.monthlyData.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                Monthly Progress (Last 6 Months)
              </div>
              <div className="space-y-3">
                {debtPaymentStats.monthlyData.map((data, idx) => {
                  const date = new Date(data.month + '-01');
                  const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 font-medium">{monthLabel}</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(data.amount)}
                        </span>
                      </div>
                      <div className="bg-white rounded-full h-3 overflow-hidden border border-green-200">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(data.amount / maxDebtPayment) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
