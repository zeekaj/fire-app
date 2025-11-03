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
  const [sortField, setSortField] = useState<'date' | 'description' | 'category' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);

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

  // Calculate running balance on a chronologically sorted copy
  const chronologicalTransactions = sortChronologicalByDateCreatedAt(accountTransactions as any) as any[];
  const transactionsWithBalance = computeRunningBalances(
    chronologicalTransactions as any[],
    account.opening_balance || 0,
    isLiability
  ) as any[];

  // Sort helper
  const sortedTransactions = useMemo(() => {
    const rows = [...transactionsWithBalance];
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
  }, [transactionsWithBalance, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const content = (
    <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Account Register • Current Balance: {formatCurrency(account.current_balance || 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Register Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">—</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium" colSpan={2}>
                              <span className="inline-flex items-center gap-2">
                                Beginning Balance
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
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(account.opening_balance || 0)}
                            </td>
                          </tr>
                        )}
                        {sortedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No transactions yet</td>
                          </tr>
                        ) : (
                          sortedTransactions.map((tx) => (
                            <tr
                              key={tx.id}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setSelectedTransactionId(tx.id)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(tx.date)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <div>
                                  <div className="font-medium">
                                    {tx.transfer_id ? (
                                      <span className="flex items-center gap-1">
                                        {tx.transaction_type === 'payment' ? '💳' : '↔️'}
                                        {tx.transaction_type === 'payment' ? 'Debt Payment' : 'Transfer'}
                                      </span>
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
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">—</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium" colSpan={2}>
                              <span className="inline-flex items-center gap-2">
                                Beginning Balance
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
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(account.opening_balance || 0)}
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
          <div className="mt-6 flex justify-between items-center text-sm">
            <div className="text-gray-600">
              {transactionsWithBalance.length} transaction{transactionsWithBalance.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-gray-600">Total {isLiability ? 'Charges' : 'Expenses'}: </span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    transactionsWithBalance.reduce((sum, tx) => sum + (tx.amount < 0 ? Math.abs(tx.amount) : 0), 0)
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Payments: </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    transactionsWithBalance.reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0)
                  )}
                </span>
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
