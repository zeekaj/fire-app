/**
 * AccountRegister Component
 * 
 * Shows all transactions for a specific account with running balance.
 * Like a checkbook register or bank statement with inline editing.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, requireAuth } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { EditTransaction } from '@/features/transactions/components/EditTransaction';
import type { AccountWithGroup } from '../hooks/useAccounts';

interface AccountRegisterProps {
  account: AccountWithGroup;
  onClose: () => void;
}

export function AccountRegister({ account, onClose }: AccountRegisterProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Determine if this is a liability account (credit cards, mortgages, loans)
  const isLiability = ['credit', 'mortgage'].includes(account.type);

  // Fetch transactions for this account with related data
  const { data: accountTransactions = [] } = useQuery({
    queryKey: ['account-transactions', account.id],
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
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Calculate running balance
  // For liabilities: negative amounts (charges) increase balance, positive amounts (payments) decrease balance
  // For assets: amounts work as-is (positive increases, negative decreases)
  let runningBalance = account.opening_balance || 0;
  const transactionsWithBalance = accountTransactions.map(tx => {
    runningBalance += isLiability ? -tx.amount : tx.amount;
    return {
      ...tx,
      runningBalance,
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Account Register • Current Balance: {formatCurrency(account.current_balance || 0)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Register Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isLiability ? 'Charge' : 'Expense'}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      —
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium" colSpan={2}>
                      Beginning Balance
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(account.opening_balance || 0)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {transactionsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactionsWithBalance.map((tx) => (
                      <tr 
                        key={tx.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTransactionId(tx.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(tx.date)}
                        </td>
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
                            {tx.notes && (
                              <div className="text-xs text-gray-500 mt-0.5">{tx.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {tx.category?.name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {/* Negative amounts = expenses/charges (money out for assets, debt increase for liabilities) */}
                          {tx.amount < 0 ? formatCurrency(Math.abs(tx.amount)) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {/* Positive amounts = payments/income (money in for assets, debt reduction for liabilities) */}
                          {tx.amount > 0 ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(tx.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
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

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
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
    </div>
  );
}
