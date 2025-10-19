/**
 * AccountsList Component
 * 
 * Displays all user accounts grouped by equity type (Assets vs Liabilities).
 */

import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountGroups } from '../hooks/useAccountGroups';
import { AccountCard } from './AccountCard';
import { AddAccountModal } from './AddAccountModal';
import { formatCurrency } from '@/lib/format';

export function AccountsList() {
  const { data: accounts, isLoading, error } = useAccounts();
  const { data: accountGroups } = useAccountGroups();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showGroupsView, setShowGroupsView] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          Failed to load accounts. Please try again.
        </p>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">No accounts yet</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No accounts found.</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Account" to create your first account.
          </p>
        </div>

        <AddAccountModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      </>
    );
  }

  // Group accounts by equity type
  const assetAccounts = accounts.filter(a => (a.current_balance ?? 0) >= 0);
  const liabilityAccounts = accounts.filter(a => (a.current_balance ?? 0) < 0);

  // Calculate totals
  const totalAssets = assetAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + Math.abs(a.current_balance ?? 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Group accounts by account_group for the groups view
  const accountsByGroup = new Map<string, typeof accounts>();
  if (showGroupsView && accountGroups) {
    accountGroups.forEach(group => {
      accountsByGroup.set(group.id, accounts.filter(a => a.account_group_id === group.id));
    });
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGroupsView(!showGroupsView)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {showGroupsView ? 'Equity View' : 'Groups View'}
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Account
            </button>
          </div>
        </div>

        {/* Net Worth Summary */}
        {!showGroupsView && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700 font-medium">Assets</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(totalAssets)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {assetAccounts.length} {assetAccounts.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700 font-medium">Liabilities</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(totalLiabilities)}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {liabilityAccounts.length} {liabilityAccounts.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700 font-medium">Net Worth</div>
              <div className={`text-2xl font-bold mt-1 ${netWorth >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                {formatCurrency(netWorth)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Total equity
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Equity View */}
      {!showGroupsView && (
        <div className="space-y-8">
          {/* Assets Section */}
          {assetAccounts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assets
                </h3>
                <div className="text-sm font-medium text-green-700">
                  {formatCurrency(totalAssets)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assetAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}

          {/* Liabilities Section */}
          {liabilityAccounts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Liabilities
                </h3>
                <div className="text-sm font-medium text-red-700">
                  {formatCurrency(totalLiabilities)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liabilityAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Groups View */}
      {showGroupsView && accountGroups && (
        <div className="space-y-8">
          {accountGroups.map((group) => {
            const groupAccounts = accountsByGroup.get(group.id) || [];
            if (groupAccounts.length === 0) return null;

            const groupTotal = groupAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

            return (
              <div key={group.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color || '#6B7280' }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.name}
                    </h3>
                  </div>
                  <div className={`text-sm font-medium ${groupTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(groupTotal)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupAccounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddAccountModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
}
