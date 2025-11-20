/**
 * FinancialAnalytics Component
 * 
 * Comprehensive financial analytics dashboard with interactive charts
 * Shows spending patterns, income trends, debt progress, and category breakdown
 */

import { useMemo, useState } from 'react';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import { formatCurrency } from '@/lib/format';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = '3m' | '6m' | '12m' | 'ytd' | 'all';

export function FinancialAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const { data: allTransactions = [] } = useTransactions(1000);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  // Build accounts map for quick lookups
  const accountsById = useMemo(() => {
    const map = new Map<string, { id: string; type: string }>();
    accounts.forEach(a => map.set(a.id, { id: a.id, type: a.type }));
    return map;
  }, [accounts]);

  // Filter transactions by time range and exclude transfers
  const transactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '12m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        return allTransactions.filter(tx => !tx.transfer_id); // Exclude transfers
    }

    return allTransactions.filter(tx => new Date(tx.date) >= startDate && !tx.transfer_id); // Exclude transfers
  }, [allTransactions, timeRange]);

  // Calculate transaction type breakdown
  const typeBreakdown = useMemo(() => {
    const expenses = transactions
      .filter(tx => tx.transaction_type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const income = transactions
      .filter(tx => tx.transaction_type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Only count non-credit debt payments (withdrawals), exclude credit card payoffs to avoid double counting
    const isCreditAccount = (accountType?: string) => ['credit', 'credit_card'].includes(accountType || '');
    const debtPaymentWithdrawals = transactions.filter(
      tx => tx.transaction_type === 'debt_payment' && tx.amount < 0
    ).filter(tx => {
      const paired = transactions.find(t => t.id === tx.transfer_id);
      const pairedAccountType = paired ? accountsById.get(paired.account_id)?.type : undefined;
      return !isCreditAccount(pairedAccountType);
    });
    const debtPayments = debtPaymentWithdrawals.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return [
      { name: 'Expenses', value: expenses, color: '#EF4444' },
      { name: 'Income', value: income, color: '#10B981' },
      { name: 'Debt Payments', value: debtPayments, color: '#8B5CF6' },
    ].filter(item => item.value > 0);
  }, [transactions]);

  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number; debtPayments: number; net: number }>();

    transactions.forEach(tx => {
      if (tx.transaction_type === 'transfer') return; // Skip transfers

      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expenses: 0, debtPayments: 0, net: 0 });
      }

      const data = monthMap.get(monthKey)!;

      if (tx.transaction_type === 'income') {
        data.income += tx.amount;
      } else if (tx.transaction_type === 'expense') {
        data.expenses += Math.abs(tx.amount);
      } else if (tx.transaction_type === 'debt_payment') {
        // Count only withdrawals that are not credit card payments
        if (tx.amount < 0) {
          const paired = transactions.find(t => t.id === tx.transfer_id);
          const pairedAccountType = paired ? accountsById.get(paired.account_id)?.type : undefined;
          if (!['credit', 'credit_card'].includes(pairedAccountType || '')) {
            data.debtPayments += Math.abs(tx.amount);
          }
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => {
        const date = new Date(month + '-01');
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          income: data.income,
          expenses: data.expenses,
          debtPayments: data.debtPayments,
          net: data.income - data.expenses - data.debtPayments,
          savings: data.income > 0 ? ((data.income - data.expenses - data.debtPayments) / data.income * 100) : 0,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months max
  }, [transactions]);

  // Calculate top spending categories
  const topCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    const categoryNames = new Map(categories.map(c => [c.id, c.name]));

    transactions
      .filter(tx => tx.transaction_type === 'expense' && tx.category_id)
      .forEach(tx => {
        const categoryName = categoryNames.get(tx.category_id!) || 'Uncategorized';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Math.abs(tx.amount));
      });

    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, categories]);

  // Calculate debt payment stats
  const debtStats = useMemo(() => {
    // Use only withdrawal side of non-credit debt payments
    const debtTxs = transactions.filter(tx => tx.transaction_type === 'debt_payment' && tx.amount < 0).filter(tx => {
      const paired = transactions.find(t => t.id === tx.transfer_id);
      const pairedType = paired ? accountsById.get(paired.account_id)?.type : undefined;
      return !['credit', 'credit_card'].includes(pairedType || '');
    });
    const total = debtTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const count = debtTxs.length; // one withdrawal per payment

    const monthlyPayments = new Map<string, number>();
    debtTxs.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyPayments.set(monthKey, (monthlyPayments.get(monthKey) || 0) + Math.abs(tx.amount));
    });

    const monthlyData = Array.from(monthlyPayments.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    return { total, count, average: count > 0 ? total / count : 0, monthlyData };
  }, [transactions]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(tx => tx.transaction_type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = transactions.filter(tx => tx.transaction_type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalDebtPayments = transactions
      .filter(tx => tx.transaction_type === 'debt_payment' && tx.amount < 0)
      .filter(tx => {
        const paired = transactions.find(t => t.id === tx.transfer_id);
        const pairedType = paired ? accountsById.get(paired.account_id)?.type : undefined;
        return !['credit', 'credit_card'].includes(pairedType || '');
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const netSavings = totalIncome - totalExpenses - totalDebtPayments;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      totalDebtPayments,
      netSavings,
      savingsRate,
      avgMonthlyIncome: totalIncome / Math.max(monthlyData.length, 1),
      avgMonthlyExpenses: totalExpenses / Math.max(monthlyData.length, 1),
    };
  }, [transactions, monthlyData, accountsById]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '12m', label: '12 Months' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Deep insights into your spending and income patterns</p>
        </div>
        <div className="flex gap-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                timeRange === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800 mb-1">Total Income</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalIncome)}</div>
          <div className="text-xs text-green-600 mt-1">
            Avg: {formatCurrency(stats.avgMonthlyIncome)}/mo
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalExpenses)}</div>
          <div className="text-xs text-red-600 mt-1">
            Avg: {formatCurrency(stats.avgMonthlyExpenses)}/mo
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800 mb-1">Debt Payments</div>
          <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalDebtPayments)}</div>
          <div className="text-xs text-purple-600 mt-1">
            {debtStats.count} payment{debtStats.count !== 1 ? 's' : ''}
          </div>
        </div>

        <div className={`bg-gradient-to-br border rounded-lg p-4 ${
          stats.savingsRate >= 50 
            ? 'from-green-50 to-emerald-50 border-green-200' 
            : stats.savingsRate >= 25
            ? 'from-yellow-50 to-amber-50 border-yellow-200'
            : 'from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            stats.savingsRate >= 50 ? 'text-green-800' : stats.savingsRate >= 25 ? 'text-yellow-800' : 'text-red-800'
          }`}>
            Savings Rate
          </div>
          <div className={`text-2xl font-bold ${
            stats.savingsRate >= 50 ? 'text-green-900' : stats.savingsRate >= 25 ? 'text-yellow-900' : 'text-red-900'
          }`}>
            {stats.savingsRate.toFixed(1)}%
          </div>
          <div className={`text-xs mt-1 ${
            stats.savingsRate >= 50 ? 'text-green-600' : stats.savingsRate >= 25 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            Net: {formatCurrency(stats.netSavings)}
          </div>
        </div>
      </div>

      {/* Charts Row 1: Monthly Trends */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income, Expenses & Debt Payments</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis 
                stroke="#6B7280" 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Bar dataKey="debtPayments" fill="#8B5CF6" name="Debt Payments" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Savings Rate Trend & Transaction Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Rate Line Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis 
                  stroke="#6B7280" 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ fill: '#2563EB', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Savings Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Type Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Money Flow Breakdown</h3>
          <div className="h-64">
            {typeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3: Top Categories & Debt Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((category, idx) => {
                const maxAmount = topCategories[0].amount;
                const percentage = (category.amount / maxAmount) * 100;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-gray-600">{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-8">
                No expense data available
              </div>
            )}
          </div>
        </div>

        {/* Debt Payment Progress */}
        {debtStats.total > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💳</span>
              Debt Payment Progress
            </h3>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-xs text-gray-600">Total Paid</div>
                  <div className="text-lg font-bold text-purple-900">{formatCurrency(debtStats.total)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-xs text-gray-600">Payments</div>
                  <div className="text-lg font-bold text-gray-900">{debtStats.count}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-xs text-gray-600">Average</div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(debtStats.average)}</div>
                </div>
              </div>

              {/* Monthly Progress Bars */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Recent Months</div>
                {debtStats.monthlyData.map((data, idx) => {
                  const maxAmount = Math.max(...debtStats.monthlyData.map(d => d.amount));
                  const percentage = (data.amount / maxAmount) * 100;

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{data.month}</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(data.amount)}</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 border border-purple-200">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600">
            Add some transactions to see beautiful analytics and insights!
          </p>
        </div>
      )}
    </div>
  );
}
