/**
 * TransactionsList Component
 * 
 * Enhanced transactions view with search, filtering, sorting, bulk operations, and analytics.
 */

import { useState, useMemo } from 'react';
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { useDeleteTransfer } from '../hooks/useTransfer';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees } from '../hooks/usePayees';
import { useCategories } from '../hooks/useCategories';
import { TransactionRow } from './TransactionRow';
import { EditTransaction } from './EditTransaction';
import { TransactionAnalytics } from './TransactionAnalytics';
import { ImportCSV } from './ImportCSV';
import { SmartFeatures } from './SmartFeatures';
import { formatCurrency } from '@/lib/format';
import type { Database } from '@/lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type SortField = 'date' | 'amount' | 'payee' | 'category';
type SortDirection = 'asc' | 'desc';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function TransactionsList() {
  // State
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  // Data hooks
  const { data: transactions = [], isLoading, error } = useTransactions(500); // Increased limit
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: categories = [] } = useCategories();
  const deleteTransaction = useDeleteTransaction();
  const deleteTransfer = useDeleteTransfer();
  const updateTransaction = useUpdateTransaction();

  // Helper to get leaf category name from path
  const getCategoryLeafName = (category: typeof categories[0]) => {
    if (category.path) {
      const parts = category.path.split('>');
      return parts[parts.length - 1];
    }
    return category.name;
  };

  // Create lookup maps for performance
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const payeeMap = useMemo(() => new Map(payees.map((p) => [p.id, p.name])), [payees]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, getCategoryLeafName(c)])), [categories]);
  
  // Create a map for transfer linked accounts
  const transferAccountMap = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach(tx => {
      if (tx.transfer_id) {
        // Find the linked transaction
        const linkedTx = transactions.find(t => t.id === tx.transfer_id);
        if (linkedTx) {
          // Map this transaction to its linked account name
          const linkedAccountName = accountMap.get(linkedTx.account_id);
          if (linkedAccountName) {
            map.set(tx.id, linkedAccountName);
          }
        }
      }
    });
    return map;
  }, [transactions, accountMap]);

  // Date range calculation
  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: today };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: today };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart, end: today };
      default:
        return null;
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Account filter
    if (accountFilter !== 'all') {
      filtered = filtered.filter(tx => tx.account_id === accountFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tx => tx.category_id === categoryFilter);
    }

    // Date filter
    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= dateRange.start && txDate <= dateRange.end;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => {
        const payeeName = tx.payee_id ? payeeMap.get(tx.payee_id)?.toLowerCase() : '';
        const notes = tx.notes?.toLowerCase() || '';
        const amount = Math.abs(tx.amount).toString();
        return payeeName?.includes(search) || notes.includes(search) || amount.includes(search);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortField) {
        case 'date':
          compareA = new Date(a.date).getTime();
          compareB = new Date(b.date).getTime();
          break;
        case 'amount':
          compareA = Math.abs(a.amount);
          compareB = Math.abs(b.amount);
          break;
        case 'payee':
          compareA = payeeMap.get(a.payee_id || '') || '';
          compareB = payeeMap.get(b.payee_id || '') || '';
          break;
        case 'category':
          compareA = categoryMap.get(a.category_id || '') || '';
          compareB = categoryMap.get(b.category_id || '') || '';
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, accountFilter, categoryFilter, dateFilter, searchTerm, sortField, sortDirection, payeeMap, categoryMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    const income = filteredAndSortedTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expenses = filteredAndSortedTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    return {
      count: filteredAndSortedTransactions.length,
      income,
      expenses,
      net: income - expenses,
      average: filteredAndSortedTransactions.length > 0 
        ? filteredAndSortedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / filteredAndSortedTransactions.length
        : 0
    };
  }, [filteredAndSortedTransactions]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedTransactions.map(tx => tx.id)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} transaction${selectedIds.size !== 1 ? 's' : ''}?`)) {
      return;
    }
    
    try {
      // Track which transfer IDs we've already deleted to avoid duplicate deletions
      const deletedTransferIds = new Set<string>();
      
      for (const id of selectedIds) {
        // Skip if this was already deleted as part of a transfer pair
        if (deletedTransferIds.has(id)) {
          continue;
        }
        
        const transaction = transactions.find(tx => tx.id === id);
        if (transaction?.transfer_id) {
          // This is a transfer - delete both sides
          await deleteTransfer.mutateAsync(id);
          deletedTransferIds.add(id);
          deletedTransferIds.add(transaction.transfer_id);
        } else {
          // Regular transaction
          await deleteTransaction.mutateAsync(id);
        }
      }
      setSelectedIds(new Set());
    } catch (error) {
      alert('Failed to delete some transactions');
    }
  };

  const handleBulkCategorize = async (categoryId: string) => {
    if (!categoryId) return;
    
    try {
      for (const id of selectedIds) {
        await updateTransaction.mutateAsync({
          id,
          updates: { category_id: categoryId }
        });
      }
      setSelectedIds(new Set());
    } catch (error) {
      alert('Failed to update some transactions');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Account', 'Payee', 'Category', 'Amount', 'Notes'];
    const rows = filteredAndSortedTransactions.map(tx => [
      tx.date,
      accountMap.get(tx.account_id) || '',
      tx.payee_id ? payeeMap.get(tx.payee_id) || '' : '',
      tx.category_id ? categoryMap.get(tx.category_id) || '' : '',
      tx.amount.toString(),
      tx.notes || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load transactions. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {stats.count} {stats.count === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            📊 {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            📤 Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Income</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Expenses</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.expenses)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Net</div>
          <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.net)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Average</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.average)}</div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <TransactionAnalytics 
          transactions={filteredAndSortedTransactions}
          categories={categories}
          payees={payees}
        />
      )}

      {/* Smart Insights - Always visible */}
      <SmartFeatures 
        transactions={transactions}
        categories={categories}
        payees={payees}
      />

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.path || category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-900">
              {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => handleBulkCategorize(e.target.value)}
                className="px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white"
              >
                <option value="">Change Category...</option>
                {categories.filter(c => c.is_budgetable).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.path || category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {filteredAndSortedTransactions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No transactions found.</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchTerm || accountFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your filters.'
              : <>Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">N</kbd> to add your first transaction!</>
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th 
                    onClick={() => handleSort('payee')}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Payee {sortField === 'payee' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accountName={accountMap.get(transaction.account_id)}
                    payeeName={transaction.payee_id ? payeeMap.get(transaction.payee_id) : undefined}
                    categoryName={transaction.category_id ? categoryMap.get(transaction.category_id) : undefined}
                    transferAccountName={transferAccountMap.get(transaction.id)}
                    isSelected={selectedIds.has(transaction.id)}
                    onSelect={() => handleSelectTransaction(transaction.id)}
                    onClick={() => setSelectedTransaction(transaction)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {selectedTransaction && (
        <EditTransaction
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Import CSV Modal */}
      {showImport && (
        <ImportCSV onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
