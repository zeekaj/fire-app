/**
 * AccountRegister Component
 * 
 * Shows all transactions for a specific account with running balance.
 * Like a checkbook register or bank statement with inline editing.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { EditTransaction } from '@/features/transactions/components/EditTransaction';
import { EditAccountModal } from './EditAccountModal';
import { sortChronologicalByDateCreatedAt, computeRunningBalances } from '../utils/register';
import { useBulkDeleteTransactions, useBulkUpdateTransactions } from '@/features/transactions/hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import type { AccountWithGroup } from '../hooks/useAccounts';

interface AccountRegisterProps {
  account: AccountWithGroup;
  onClose?: () => void;
  /**
   * Render style
   * - modal: existing full-screen modal (default for backward compatibility)
   * - inline: panel content for embedding in a page layout (no overlay/close requirements)
   */
  variant?: 'modal' | 'inline';
  /** Optional date filters (inclusive) */
  startDate?: string;
  endDate?: string;
}

export function AccountRegister({ account, onClose, variant = 'modal', startDate, endDate }: AccountRegisterProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'date' | 'description' | 'category' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Bulk operation hooks
  const bulkDelete = useBulkDeleteTransactions();
  const bulkUpdate = useBulkUpdateTransactions();
  const { data: allAccounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  // Calculate next occurrence of a specific day of the month
  const getNextDateForDay = (dayOfMonth: number): Date => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Try this month first
    let nextDate = new Date(currentYear, currentMonth, dayOfMonth);
    
    // If the date has already passed this month, move to next month
    if (currentDay >= dayOfMonth) {
      nextDate = new Date(currentYear, currentMonth + 1, dayOfMonth);
    }
    
    return nextDate;
  };

  // Load saved sort per account
  useEffect(() => {
    const raw = localStorage.getItem(`register-sort:${account.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { field: typeof sortField; dir: typeof sortDir };
        if (parsed?.field && parsed?.dir) {
          setSortField(parsed.field);
          setSortDir(parsed.dir);
        }
      } catch {}
    }
  }, [account.id]);

  // Persist sort per account
  useEffect(() => {
    localStorage.setItem(
      `register-sort:${account.id}`,
      JSON.stringify({ field: sortField, dir: sortDir })
    );
  }, [account.id, sortField, sortDir]);

  // Determine if this is a liability account (credit cards, mortgages, loans)
  const isLiability = ['credit', 'mortgage'].includes(account.type);

  // Fetch transactions for this account with related data
  const { data: accountTransactions = [] } = useQuery({
    queryKey: ['account-transactions', account.id, startDate ?? null, endDate ?? null],
    queryFn: async () => {
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          payee:payees(name),
          category:categories(name)
        `)
        .eq('created_by', userId as any)
        .eq('account_id', account.id)
        .gte('date', startDate || '0001-01-01')
        .lte('date', endDate || '9999-12-31')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions BEFORE the startDate to calculate the starting balance for filtered view
  const { data: priorTransactions = [] } = useQuery({
    queryKey: ['account-transactions-prior', account.id, startDate ?? null],
    queryFn: async () => {
      // If no startDate filter, we don't need prior transactions
      if (!startDate) return [];
      
      const userId = await requireAuth();

      const { data, error } = await supabase
        .from('transactions')
        .select('date, created_at, amount')
        .eq('created_by', userId as any)
        .eq('account_id', account.id)
        .lt('date', startDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Calculate the starting balance based on whether we have a date filter
  const startingBalance = useMemo(() => {
    if (!startDate || priorTransactions.length === 0) {
      // No date filter or no prior transactions - use opening balance
      return account.opening_balance || 0;
    }
    
    // Calculate balance from opening balance + all prior transactions
    let balance = account.opening_balance || 0;
    for (const tx of priorTransactions) {
      balance += isLiability ? -tx.amount : tx.amount;
    }
    return balance;
  }, [startDate, priorTransactions, account.opening_balance, isLiability]);

  // Calculate running balance on a chronologically sorted copy
  const chronologicalTransactions = sortChronologicalByDateCreatedAt(accountTransactions as any) as any[];
  const transactionsWithBalance = computeRunningBalances(
    chronologicalTransactions as any[],
    startingBalance,
    isLiability
  ) as any[];

  // Gather transfer IDs present in this account's transactions so we can fetch the counterparty account names
  const transferIds = Array.from(
    new Set(transactionsWithBalance.filter(tx => tx.transfer_id).map(tx => tx.transfer_id))
  ).filter(Boolean) as string[];

  const { data: transferCounterparts = [] } = useQuery({
    queryKey: ['transfer-counterparts', account.id, transferIds.join(',')],
    queryFn: async () => {
      if (transferIds.length === 0) return [];
      const userId = await requireAuth();
      // Fetch only the opposite side transactions (where account_id != this account)
      const { data, error } = await supabase
        .from('transactions')
        .select('id, account_id, transfer_id, account:accounts(name)')
        // partner transactions will have id equal to the transfer_id referenced by the rows
        .in('id', transferIds)
        .neq('account_id', account.id)
        .eq('created_by', userId as any);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Build a map transfer_id -> other account name (the account that is not this account)
  const transferMap = useMemo(() => {
    const map: Record<string, { accountId: string; accountName: string } | undefined> = {};
    transferCounterparts.forEach((tx: any) => {
      // Map by the partner transaction id (tx.id) so we can lookup by the original row's transfer_id
      if (!tx || !tx.id) return;
      map[tx.id] = { accountId: tx.account_id, accountName: tx.account?.name || 'Account' };
    });
    return map;
  }, [transferCounterparts, account.id]);

  // Sort helper
  const sortedTransactions = useMemo(() => {
    let rows = [...transactionsWithBalance];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter((tx: any) => {
        const payeeName = tx.payee?.name?.toLowerCase() || '';
        const categoryName = tx.category?.name?.toLowerCase() || '';
        const notes = tx.notes?.toLowerCase() || '';
        const amount = Math.abs(tx.amount).toString();
        const date = tx.date || '';
        
        return payeeName.includes(query) || 
               categoryName.includes(query) || 
               notes.includes(query) || 
               amount.includes(query) ||
               date.includes(query);
      });
    }
    
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a: any, b: any) => {
      let av: any;
      let bv: any;
      switch (sortField) {
        case 'date':
          av = a.date;
          bv = b.date;
          // ISO dates compare lexicographically
          if (av === bv) {
            // When dates are equal, sort by created_at to maintain chronological order
            const aCreated = a.created_at || '';
            const bCreated = b.created_at || '';
            return aCreated < bCreated ? -1 * dir : 1 * dir;
          }
          return av < bv ? -1 * dir : 1 * dir;
        case 'description':
          av = (a.payee?.name || '').toLowerCase();
          bv = (b.payee?.name || '').toLowerCase();
          return av.localeCompare(bv) * dir;
        case 'category':
          av = (a.category?.name || '').toLowerCase();
          bv = (b.category?.name || '').toLowerCase();
          return av.localeCompare(bv) * dir;
        case 'amount':
          av = a.amount;
          bv = b.amount;
          return (av === bv ? 0 : av < bv ? -1 : 1) * dir;
        default:
          return 0;
      }
    });
    return rows;
  }, [transactionsWithBalance, sortField, sortDir, searchQuery]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const toggleTransactionSelection = (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedTransactions.map(tx => tx.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleRowClick = (id: string, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Cmd/Ctrl+click: toggle selection
      toggleTransactionSelection(id, event);
    } else if (event.shiftKey && selectedIds.size > 0) {
      // Shift+click: range selection
      const currentIndex = sortedTransactions.findIndex(tx => tx.id === id);
      const selectedArray = Array.from(selectedIds);
      const lastSelectedId = selectedArray[selectedArray.length - 1];
      const lastIndex = sortedTransactions.findIndex(tx => tx.id === lastSelectedId);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = sortedTransactions.slice(start, end + 1).map(tx => tx.id);
        setSelectedIds(new Set([...selectedIds, ...rangeIds]));
      }
    } else if (selectedIds.size > 0) {
      // If there are selections, clicking adds to selection
      toggleTransactionSelection(id, event);
    } else {
      // Normal click: open edit modal
      setSelectedTransactionId(id);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!confirm(`Delete ${count} transaction${count !== 1 ? 's' : ''}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds));
      deselectAll();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete transactions. Please try again.');
    }
  };

  const handleBulkCategorize = async (categoryId: string) => {
    try {
      await bulkUpdate.mutateAsync({
        ids: Array.from(selectedIds),
        updates: { category_id: categoryId }
      });
      deselectAll();
    } catch (error) {
      console.error('Bulk categorize failed:', error);
      alert('Failed to update categories. Please try again.');
    }
  };

  const handleBulkMoveToAccount = async (accountId: string) => {
    try {
      await bulkUpdate.mutateAsync({
        ids: Array.from(selectedIds),
        updates: { account_id: accountId }
      });
      deselectAll();
    } catch (error) {
      console.error('Bulk move failed:', error);
      alert('Failed to move transactions. Please try again.');
    }
  };

  const content = (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Account Register • Current Balance: {formatCurrency(account.current_balance || 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
              />
              {/* Edit account button */}
              <button
                onClick={() => setIsEditAccountOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                title="Edit account (name, group, opening balance)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Account
              </button>
              {variant === 'modal' && onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Account Details for Credit Cards */}
          {account.type === 'credit' && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {account.credit_limit !== undefined && account.credit_limit !== null && (
                  <div>
                    <div className="text-xs text-blue-700">Credit Limit</div>
                    <div className="text-sm font-semibold text-blue-900">{formatCurrency(account.credit_limit)}</div>
                  </div>
                )}
                {account.interest_rate !== undefined && account.interest_rate !== null && (
                  <div>
                    <div className="text-xs text-blue-700">Interest Rate (APR)</div>
                    <div className="text-sm font-semibold text-blue-900">{account.interest_rate}%</div>
                  </div>
                )}
                {account.payment_due_day !== undefined && account.payment_due_day !== null && (
                  <div>
                    <div className="text-xs text-blue-700">Next Payment Due</div>
                    <div className="text-sm font-semibold text-blue-900">{formatDate(getNextDateForDay(account.payment_due_day).toISOString().split('T')[0])}</div>
                  </div>
                )}
                {account.statement_close_day !== undefined && account.statement_close_day !== null && (
                  <div>
                    <div className="text-xs text-blue-700">Next Statement Closes</div>
                    <div className="text-sm font-semibold text-blue-900">{formatDate(getNextDateForDay(account.statement_close_day).toISOString().split('T')[0])}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Details for Mortgages */}
          {account.type === 'mortgage' && (
            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {account.mortgage_interest_rate !== undefined && account.mortgage_interest_rate !== null && (
                  <div>
                    <div className="text-xs text-purple-700">Interest Rate (APR)</div>
                    <div className="text-sm font-semibold text-purple-900">{account.mortgage_interest_rate}%</div>
                  </div>
                )}
                {account.mortgage_original_amount !== undefined && account.mortgage_original_amount !== null && (
                  <div>
                    <div className="text-xs text-purple-700">Original Amount</div>
                    <div className="text-sm font-semibold text-purple-900">{formatCurrency(account.mortgage_original_amount)}</div>
                  </div>
                )}
                {account.mortgage_term_months !== undefined && account.mortgage_term_months !== null && (
                  <div>
                    <div className="text-xs text-purple-700">Loan Term</div>
                    <div className="text-sm font-semibold text-purple-900">{account.mortgage_term_months} months ({Math.round(account.mortgage_term_months / 12)} years)</div>
                  </div>
                )}
                {account.mortgage_start_date && (
                  <div>
                    <div className="text-xs text-purple-700">Start Date</div>
                    <div className="text-sm font-semibold text-purple-900">{formatDate(account.mortgage_start_date)}</div>
                  </div>
                )}
                {account.escrow_amount !== undefined && account.escrow_amount !== null && (
                  <div>
                    <div className="text-xs text-purple-700">Monthly Escrow</div>
                    <div className="text-sm font-semibold text-purple-900">{formatCurrency(account.escrow_amount)}</div>
                  </div>
                )}
                {account.next_payment_due_date && (
                  <div>
                    <div className="text-xs text-purple-700">Next Payment Due</div>
                    <div className="text-sm font-semibold text-purple-900">{formatDate(account.next_payment_due_date)}</div>
                  </div>
                )}
                {account.property_address && (
                  <div className="col-span-2">
                    <div className="text-xs text-purple-700">Property Address</div>
                    <div className="text-sm font-semibold text-purple-900">{account.property_address}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-blue-700 hover:text-blue-900 underline"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="text-sm text-blue-700 hover:text-blue-900 underline"
                  >
                    {showBulkActions ? 'Hide actions' : 'More actions'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDelete.isPending}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {bulkDelete.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Expanded Bulk Actions */}
              {showBulkActions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                  {/* Categorize */}
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">
                      Change Category
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkCategorize(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      disabled={bulkUpdate.isPending}
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Move to Account */}
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">
                      Move to Account
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkMoveToAccount(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      disabled={bulkUpdate.isPending}
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">Select account...</option>
                      {allAccounts.filter(a => a.id !== account.id).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Register Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === sortedTransactions.length}
                        onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        title="Select all transactions"
                      />
                    </th>
                    <th
                      role="columnheader button"
                      aria-sort={sortField === 'date' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      onClick={() => toggleSort('date')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider select-none cursor-pointer hover:text-gray-900"
                      title="Sort by date"
                    >
                      <span className="inline-flex items-center gap-1">
                        Date
                        {sortField === 'date' && (
                          <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th
                      role="columnheader button"
                      aria-sort={sortField === 'description' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      onClick={() => toggleSort('description')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider select-none cursor-pointer hover:text-gray-900"
                      title="Sort by description"
                    >
                      <span className="inline-flex items-center gap-1">
                        Description
                        {sortField === 'description' && (
                          <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th
                      role="columnheader button"
                      aria-sort={sortField === 'category' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      onClick={() => toggleSort('category')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider select-none cursor-pointer hover:text-gray-900"
                      title="Sort by type/category"
                    >
                      <span className="inline-flex items-center gap-1">
                        Type
                        {sortField === 'category' && (
                          <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isLiability ? 'Charge' : 'Expense'}
                    </th>
                    <th
                      role="columnheader button"
                      aria-sort={sortField === 'amount' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      onClick={() => toggleSort('amount')}
                      className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider select-none cursor-pointer hover:text-gray-900"
                      title="Sort by amount"
                    >
                      <span className="inline-flex items-center gap-1 justify-end w-full">
                        Payment
                        {sortField === 'amount' && (
                          <span>{sortDir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider" title="Balance is not sortable">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const openingRowAtBottom = sortField === 'date' && sortDir === 'desc';
                    return (
                      <>
                        {!openingRowAtBottom && (
                          <tr className="bg-blue-50">
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">—</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium" colSpan={2}>
                              <span className="inline-flex items-center gap-2">
                                {startDate ? `Beginning Balance (as of ${formatDate(startDate)})` : 'Beginning Balance'}
                                {!startDate && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEditAccountOpen(true)}
                                    className="inline-flex items-center p-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title="Edit opening balance"
                                    aria-label="Edit opening balance"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(startingBalance)}
                            </td>
                          </tr>
                        )}
                        {sortedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No transactions yet</td>
                          </tr>
                        ) : (
                          sortedTransactions.map((tx) => (
                            <tr
                              key={tx.id}
                              className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                selectedIds.has(tx.id) ? 'bg-blue-50' : ''
                              }`}
                              onClick={(e) => handleRowClick(tx.id, e)}
                            >
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(tx.id)}
                                  onChange={(e) => toggleTransactionSelection(tx.id, e as any)}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(tx.date)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div>
                                  <div className="font-medium">
                                    {tx.transfer_id ? (
                                      (() => {
                                        const cp = transferMap[tx.transfer_id];
                                        const cpName = cp?.accountName || 'Other Account';
                                        const isOutgoing = Number(tx.amount) < 0;
                                        if (tx.transaction_type === 'payment') {
                                          return (
                                            <span className="flex items-center gap-1">
                                              <span>💳</span>
                                              <span>{isOutgoing ? `Payment to ${cpName}` : `Payment from ${cpName}`}</span>
                                            </span>
                                          );
                                        }

                                        // Transfer
                                        return (
                                          <span className="flex items-center gap-1">
                                            <span>↔️</span>
                                            <span>{isOutgoing ? `Transfer to ${cpName}` : `Transfer from ${cpName}`}</span>
                                          </span>
                                        );
                                      })()
                                    ) : (
                                      tx.payee?.name || '—'
                                    )}
                                  </div>
                                  {tx.notes && <div className="text-xs text-gray-500 mt-0.5">{tx.notes}</div>}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{tx.category?.name || '—'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                {tx.amount < 0 ? formatCurrency(Math.abs(tx.amount)) : '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                {tx.amount > 0 ? formatCurrency(tx.amount) : '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                {formatCurrency(tx.runningBalance)}
                              </td>
                            </tr>
                          ))
                        )}
                        {openingRowAtBottom && (
                          <tr className="bg-blue-50">
                            <td className="px-4 py-3"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">—</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium" colSpan={2}>
                              <span className="inline-flex items-center gap-2">
                                {startDate ? `Beginning Balance (as of ${formatDate(startDate)})` : 'Beginning Balance'}
                                {!startDate && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEditAccountOpen(true)}
                                    className="inline-flex items-center p-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                    title="Edit opening balance"
                                    aria-label="Edit opening balance"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(startingBalance)}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-start text-sm">
              <div className="text-gray-600">
                {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
                {searchQuery.trim() && sortedTransactions.length !== transactionsWithBalance.length && (
                  <span className="text-gray-500 ml-1">
                    (filtered from {transactionsWithBalance.length})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
                {/* Regular expenses/charges (excluding interest) */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    {isLiability ? 'Charges' : 'Expenses'}
                  </div>
                  <div className="font-semibold text-red-600">
                    {formatCurrency(
                      sortedTransactions
                        .filter(tx => tx.amount < 0 && !tx.category?.name?.toLowerCase().includes('interest') && !tx.category?.name?.toLowerCase().includes('reward'))
                        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                    )}
                  </div>
                </div>

                {/* Regular payments (excluding interest payments/rewards) */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    {isLiability ? 'Payments' : 'Income'}
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      sortedTransactions
                        .filter(tx => tx.amount > 0 && !tx.category?.name?.toLowerCase().includes('interest') && !tx.category?.name?.toLowerCase().includes('reward'))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </div>
                </div>

                {/* Interest charged (negative amounts) */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    Interest Charged
                  </div>
                  <div className="font-semibold text-red-600">
                    {formatCurrency(
                      sortedTransactions
                        .filter(tx => tx.amount < 0 && tx.category?.name?.toLowerCase().includes('interest'))
                        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                    )}
                  </div>
                </div>

                {/* Interest earned (positive amounts) */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    Interest Earned
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      sortedTransactions
                        .filter(tx => tx.amount > 0 && tx.category?.name?.toLowerCase().includes('interest'))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </div>
                </div>

                {/* Rewards charged (negative - unlikely but possible) */}
                {sortedTransactions.some(tx => tx.amount < 0 && tx.category?.name?.toLowerCase().includes('reward')) && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-0.5">
                      Rewards Redeemed
                    </div>
                    <div className="font-semibold text-red-600">
                      {formatCurrency(
                        sortedTransactions
                          .filter(tx => tx.amount < 0 && tx.category?.name?.toLowerCase().includes('reward'))
                          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
                      )}
                    </div>
                  </div>
                )}

                {/* Rewards earned (positive amounts) */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    Rewards Earned
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      sortedTransactions
                        .filter(tx => tx.amount > 0 && tx.category?.name?.toLowerCase().includes('reward'))
                        .reduce((sum, tx) => sum + tx.amount, 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {variant === 'modal' && onClose && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="w-full">
        {content}
        {/* Edit Transaction Modal (still modal) */}
        {selectedTransactionId && (
          <EditTransaction
            transaction={accountTransactions.find(tx => tx.id === selectedTransactionId)!}
            isOpen={true}
            onClose={() => setSelectedTransactionId(null)}
          />
        )}
        {/* Edit Account Modal */}
        <EditAccountModal
          account={account}
          isOpen={isEditAccountOpen}
          onClose={() => setIsEditAccountOpen(false)}
        />
      </div>
    );
  }

  // Default: modal
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Centered modal container */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="max-w-5xl w-full">
          {content}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {selectedTransactionId && (
        <EditTransaction
          transaction={accountTransactions.find(tx => tx.id === selectedTransactionId)!}
          isOpen={true}
          onClose={() => setSelectedTransactionId(null)}
        />
      )}

      {/* Edit Account Modal */}
      <EditAccountModal
        account={account}
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
      />
    </div>
  );
}
