/**
 * AddAccountModal Component
 * 
 * Modal for creating a new account with account group selection.
 */

import { useState } from 'react';
import { useCreateAccount } from '../hooks/useAccountMutations';
import { useAccountGroups } from '../hooks/useAccountGroups';
import { useCreateAccountGroup } from '../hooks/useAccountGroupMutations';
import { logger } from '@/lib/logger';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const { data: accountGroups, isLoading: groupsLoading } = useAccountGroups();
  const createAccount = useCreateAccount();
  const createGroup = useCreateAccountGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an account name');
      return;
    }

    if (!selectedGroupId) {
      alert('Please select an account group');
      return;
    }

    const balance = parseFloat(openingBalance) || 0;

    // Find the selected group to determine account type
    const selectedGroup = accountGroups?.find(g => g.id === selectedGroupId);
    const typeMap: Record<string, string> = {
      'Checking': 'checking',
      'Savings': 'savings',
      'Credit Card': 'credit',
      'Investment': 'investment',
      'Retirement': 'retirement',
      'HSA': 'hsa',
      'Mortgage': 'mortgage',
      'Cash': 'cash',
      'Asset': 'asset',
    };
    const accountType = selectedGroup ? (typeMap[selectedGroup.name] || 'checking') : 'checking';

    try {
      await createAccount.mutateAsync({
        name: name.trim(),
        type: accountType,
        account_group_id: selectedGroupId,
        opening_balance: balance,
        current_balance: balance,
        is_archived: false,
      });

      // Reset form
      setName('');
      setSelectedGroupId('');
      setOpeningBalance('');
      onClose();
    } catch (error) {
      logger.error('Failed to create account', error);
      alert('Failed to create account');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      const newGroup = await createGroup.mutateAsync({
        name: newGroupName.trim(),
        is_system: false,
        sort_order: (accountGroups?.length || 0) + 1,
      });

      // Select the newly created group
      setSelectedGroupId((newGroup as any).id);
      setNewGroupName('');
      setShowNewGroupForm(false);
    } catch (error) {
      logger.error('Failed to create group', error);
      alert('Failed to create account group');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add New Account</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Chase Sapphire, Wells Fargo Checking"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Give this account a specific name (not just "Credit Card")
              </p>
            </div>

            {/* Account Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Group <span className="text-danger">*</span>
              </label>
              
              {groupsLoading ? (
                <div className="text-sm text-gray-500">Loading groups...</div>
              ) : showNewGroupForm ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Business Checking, Kids Savings"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      disabled={createGroup.isPending}
                      className="flex-1 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createGroup.isPending ? 'Creating...' : 'Create Group'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewGroupForm(false);
                        setNewGroupName('');
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Select a group...</option>
                    {accountGroups?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewGroupForm(true)}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create new group
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Group similar accounts together (e.g., "Credit Cards", "Savings")
              </p>
            </div>

            {/* Beginning Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beginning Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the current balance of this account
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAccount.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {createAccount.isPending ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
