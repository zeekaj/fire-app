/**
 * TransactionsList Component
 * 
 * Displays recent transactions in a table with filtering.
 */

import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees } from '../hooks/usePayees';
import { useCategories } from '../hooks/useCategories';
import { TransactionRow } from './TransactionRow';

export function TransactionsList() {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const { data: transactions, isLoading, error } = useTransactions(50);
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: categories = [] } = useCategories();

  // Create lookup maps for performance
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const payeeMap = new Map(payees.map((p) => [p.id, p.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.path || c.name]));

  // Filter transactions
  const filteredTransactions = transactions?.filter((tx) => {
    if (accountFilter === 'all') return true;
    return tx.account_id === accountFilter;
  }) || [];

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        {/* Account Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
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
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No transactions found.</p>
          <p className="text-sm text-gray-500 mt-1">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">N</kbd> to add your first transaction!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    accountName={accountMap.get(transaction.account_id)}
                    payeeName={transaction.payee_id ? payeeMap.get(transaction.payee_id) : undefined}
                    categoryName={transaction.category_id ? categoryMap.get(transaction.category_id) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
