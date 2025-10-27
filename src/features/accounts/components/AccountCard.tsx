/**
 * AccountCard Component
 * 
 * Displays a single account with its balance and account group.
 */

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { EditAccountModal } from './EditAccountModal';
import { AccountRegister } from './AccountRegister';
import type { AccountWithGroup } from '../hooks/useAccounts';

interface AccountCardProps {
  account: AccountWithGroup;
}

export function AccountCard({ account }: AccountCardProps) {
  const { name, current_balance, account_group } = account;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const balance = current_balance ?? 0;
  const isNegative = balance < 0;
  
  // Get group color or use default
  const groupColor = account_group?.color || '#6B7280';
  const groupName = account_group?.name || 'Ungrouped';

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group relative">
        {/* Edit Button */}
        <button
          onClick={() => setIsEditOpen(true)}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit account"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <span
              className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-md border"
              style={{
                backgroundColor: `${groupColor}15`,
                borderColor: `${groupColor}40`,
                color: groupColor,
              }}
            >
              {groupName}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-1">Current Balance</div>
          <div
            className={`text-2xl font-bold ${
              isNegative ? 'text-danger' : 'text-gray-900'
            }`}
          >
            {formatCurrency(balance)}
          </div>
        </div>

        {/* View Register Button */}
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="mt-4 w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Register
        </button>
      </div>

      <EditAccountModal
        account={account}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      {isRegisterOpen && (
        <AccountRegister
          account={account}
          onClose={() => setIsRegisterOpen(false)}
        />
      )}
    </>
  );
}
