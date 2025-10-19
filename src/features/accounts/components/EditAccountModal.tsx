/**
 * EditAccountModal Component
 * 
 * Modal for editing an existing account.
 */

import { useState, useEffect } from 'react';
import { useUpdateAccount, useDeleteAccount } from '../hooks/useAccountMutations';
import { useAccountGroups } from '../hooks/useAccountGroups';
import { useCreateAccountGroup } from '../hooks/useAccountGroupMutations';
import type { AccountWithGroup } from '../hooks/useAccounts';
import { logger } from '@/lib/logger';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountWithGroup | null;
}

export function EditAccountModal({ isOpen, onClose, account }: EditAccountModalProps) {
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const { data: accountGroups } = useAccountGroups();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createGroup = useCreateAccountGroup();

  // Populate form when account changes
  useEffect(() => {
    if (account) {
      setName(account.name);
      setSelectedGroupId(account.account_group_id || '');
      setCurrentBalance((account.current_balance ?? 0).toString());
      setShowDeleteConfirm(false);
      setShowNewGroupForm(false);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account || !name.trim()) {
      alert('Please enter an account name');
      return;
    }

    if (!selectedGroupId) {
      alert('Please select an account group');
      return;
    }

    const balance = parseFloat(currentBalance);
    if (isNaN(balance)) {
      alert('Please enter a valid balance');
      return;
    }

    try {
      await updateAccount.mutateAsync({
        id: account.id,
        updates: {
          name: name.trim(),
          account_group_id: selectedGroupId,
          current_balance: balance,
          updated_at: new Date().toISOString(),
        },
      });

      onClose();
    } catch (error) {
      logger.error('Failed to update account', error);
      alert('Failed to update account');
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

  const handleDelete = async () => {
    if (!account) return;

    try {
      await deleteAccount.mutateAsync(account.id);
      onClose();
    } catch (error) {
      logger.error('Failed to delete account', error);
      alert('Failed to delete account. It may have transactions.');
    }
  };

  if (!isOpen || !account) return null;

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
            <h2 className="text-xl font-bold text-gray-900">Edit Account</h2>
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

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-danger flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-danger mb-1">
                      Delete Account?
                    </h3>
                    <p className="text-sm text-gray-700">
                      Are you sure you want to delete <strong>{account.name}</strong>?
                      This will also delete all transactions in this account.
                    </p>
                    <p className="text-sm text-danger font-medium mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteAccount.isPending}
                  className="flex-1 px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 disabled:opacity-50"
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          ) : (
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
                  required
                  autoFocus
                />
              </div>

              {/* Account Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Group <span className="text-danger">*</span>
                </label>
                
                {showNewGroupForm ? (
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
              </div>

              {/* Current Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Opening balance: {(account.opening_balance ?? 0).toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-danger text-danger rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger"
                >
                  Delete
                </button>
                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateAccount.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
