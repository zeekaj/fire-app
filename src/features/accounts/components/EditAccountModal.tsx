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
  const [openingBalance, setOpeningBalance] = useState('');
  // Credit card fields
  const [interestRate, setInterestRate] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [statementCloseDay, setStatementCloseDay] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  // Mortgage fields
  const [mortgageInterestRate, setMortgageInterestRate] = useState('');
  const [mortgageStartDate, setMortgageStartDate] = useState('');
  const [mortgageTermMonths, setMortgageTermMonths] = useState('');
  const [mortgageOriginalAmount, setMortgageOriginalAmount] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const { data: accountGroups } = useAccountGroups();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createGroup = useCreateAccountGroup();

  // Account type calculation for conditional rendering
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
  const selectedGroup = accountGroups?.find(g => g.id === selectedGroupId);
  const accountType = selectedGroup ? (typeMap[selectedGroup.name] || 'checking') : 'checking';

  // Populate form when account changes
  useEffect(() => {
    if (account) {
      setName(account.name);
      setSelectedGroupId(account.account_group_id || '');
      setOpeningBalance((account.opening_balance ?? 0).toString());
      setShowDeleteConfirm(false);
      setShowNewGroupForm(false);
      setInterestRate(account.interest_rate !== undefined && account.interest_rate !== null ? account.interest_rate.toString() : '');
      setPaymentDueDay(account.payment_due_day !== undefined && account.payment_due_day !== null ? account.payment_due_day.toString() : '');
      setStatementCloseDay(account.statement_close_day !== undefined && account.statement_close_day !== null ? account.statement_close_day.toString() : '');
      setCreditLimit(account.credit_limit !== undefined && account.credit_limit !== null ? account.credit_limit.toString() : '');
      setMortgageInterestRate(account.mortgage_interest_rate !== undefined && account.mortgage_interest_rate !== null ? account.mortgage_interest_rate.toString() : '');
      setMortgageStartDate(account.mortgage_start_date || '');
      setMortgageTermMonths(account.mortgage_term_months !== undefined && account.mortgage_term_months !== null ? account.mortgage_term_months.toString() : '');
      setMortgageOriginalAmount(account.mortgage_original_amount !== undefined && account.mortgage_original_amount !== null ? account.mortgage_original_amount.toString() : '');
      setPropertyAddress(account.property_address || '');
      setEscrowAmount(account.escrow_amount !== undefined && account.escrow_amount !== null ? account.escrow_amount.toString() : '');
      setNextPaymentDueDate(account.next_payment_due_date || '');
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

    const balance = parseFloat(openingBalance);
    if (isNaN(balance)) {
      alert('Please enter a valid balance');
      return;
    }

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

    // Prepare credit card fields if type is credit
    const updates: any = {
      name: name.trim(),
      type: accountType,
      account_group_id: selectedGroupId,
      opening_balance: balance,
      updated_at: new Date().toISOString(),
    };
    if (accountType === 'credit') {
      updates.interest_rate = interestRate ? parseFloat(interestRate) : null;
      updates.payment_due_day = paymentDueDay ? parseInt(paymentDueDay) : null;
      updates.statement_close_day = statementCloseDay ? parseInt(statementCloseDay) : null;
      updates.credit_limit = creditLimit ? parseFloat(creditLimit) : null;
    }
    if (accountType === 'mortgage') {
      updates.mortgage_interest_rate = mortgageInterestRate ? parseFloat(mortgageInterestRate) : null;
      updates.mortgage_start_date = mortgageStartDate || null;
      updates.mortgage_term_months = mortgageTermMonths ? parseInt(mortgageTermMonths) : null;
      updates.mortgage_original_amount = mortgageOriginalAmount ? parseFloat(mortgageOriginalAmount) : null;
      updates.property_address = propertyAddress || null;
      updates.escrow_amount = escrowAmount ? parseFloat(escrowAmount) : null;
      updates.next_payment_due_date = nextPaymentDueDate || null;
    }

    try {
      await updateAccount.mutateAsync({
        id: account.id,
        updates,
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
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Current balance (auto-calculated): ${(account?.current_balance ?? 0).toFixed(2)}
                </p>
              </div>

              {/* Credit Card Fields (only for credit accounts) */}
              {accountType === 'credit' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (APR %)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="99"
                      value={interestRate}
                      onChange={e => setInterestRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 19.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Due Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={e => setPaymentDueDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Statement Close Day (optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={statementCloseDay}
                      onChange={e => setStatementCloseDay(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditLimit}
                      onChange={e => setCreditLimit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
              )}

              {/* Mortgage Fields (only for mortgage accounts) */}
              {accountType === 'mortgage' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (APR %)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="99"
                      value={mortgageInterestRate}
                      onChange={e => setMortgageInterestRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Start Date
                    </label>
                    <input
                      type="date"
                      value={mortgageStartDate}
                      onChange={e => setMortgageStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loan Term (months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mortgageTermMonths}
                      onChange={e => setMortgageTermMonths(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 360 (30 years)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Loan Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={mortgageOriginalAmount}
                      onChange={e => setMortgageOriginalAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 250000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Address (optional)
                    </label>
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={e => setPropertyAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Escrow Amount (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={escrowAmount}
                      onChange={e => setEscrowAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g. 500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Payment Due Date (optional)
                    </label>
                    <input
                      type="date"
                      value={nextPaymentDueDate}
                      onChange={e => setNextPaymentDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}

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
