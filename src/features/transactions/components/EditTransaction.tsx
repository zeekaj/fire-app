/**
 * EditTransaction Component
 * 
 * Modal for editing existing transactions with delete capability
 */

import { useState, useEffect, useRef } from 'react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees } from '../hooks/usePayees';
import { useCreatePayee } from '../hooks/useCreatePayee';
import { useUpdateTransaction, useDeleteTransaction, useTransactions } from '../hooks/useTransactions';
import { useDeleteTransfer } from '../hooks/useTransfer';
import { PayeeSuggestionInput } from './PayeeSuggestionInput';
import { CategorySuggestionInput } from './CategorySuggestionInput';
import { logger } from '@/lib/logger';
import type { Database } from '@/lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface EditTransactionProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

type TransactionType = 'expense' | 'income';

export function EditTransaction({ transaction, isOpen, onClose }: EditTransactionProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: transactions = [] } = useTransactions(); // Need this to find linked transfer
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const deleteTransfer = useDeleteTransfer();
  const createPayee = useCreatePayee();

  // Check if this is a transfer or debt payment
  const isTransfer = !!transaction.transfer_id;
  const isDebtPayment = transaction.transaction_type === 'debt_payment';
  
  // Get linked transaction if this is a transfer
  const linkedTransaction = isTransfer 
    ? transactions.find(t => t.id === transaction.transfer_id)
    : null;

  // For transfers, we need different state
  const [date, setDate] = useState(transaction.date);
  const [amount, setAmount] = useState(Math.abs(transaction.amount).toString());
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isDebtPaymentChecked, setIsDebtPaymentChecked] = useState(isDebtPayment);
  
  // For regular transactions
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction.amount < 0 ? 'expense' : 'income'
  );
  const [accountId, setAccountId] = useState(transaction.account_id);
  const [payeeName, setPayeeName] = useState('');
  const [categoryId, setCategoryId] = useState(transaction.category_id || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Initialize payee name from transaction
  useEffect(() => {
    if (transaction.payee_id && payees.length > 0) {
      const payee = payees.find(p => p.id === transaction.payee_id);
      if (payee) {
        setPayeeName(payee.name);
      }
    }
  }, [transaction.payee_id, payees]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

      if ((e.key === 't' || e.key === 'T') && document.activeElement === dateInputRef.current) {
        e.preventDefault();
        setDate(new Date().toISOString().split('T')[0]);
      }

      if ((e.key === 'i' || e.key === 'I') && !isInputField) {
        e.preventDefault();
        setTransactionType('income');
      }

      if ((e.key === 'e' || e.key === 'E') && !isInputField) {
        e.preventDefault();
        setTransactionType('expense');
      }

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePayeeChange = (value: string, suggestion?: {
    id: string;
    name: string;
    default_category_id: string | null;
    default_account_id: string | null;
  }) => {
    setPayeeName(value);
    if (errors.payeeName) {
      setErrors(prev => ({ ...prev, payeeName: '' }));
    }

    if (suggestion) {
      if (suggestion.default_category_id) {
        setCategoryId(suggestion.default_category_id);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountId) newErrors.accountId = 'Account is required';
    if (!payeeName.trim()) newErrors.payeeName = 'Payee is required';
    if (!categoryId) newErrors.categoryId = 'Category is required';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For transfers, we have a simpler validation
    if (isTransfer) {
      if (!amount || parseFloat(amount) <= 0) {
        alert('Valid amount is required');
        return;
      }
      if (!date) {
        alert('Date is required');
        return;
      }

      const amountNum = parseFloat(amount);
      const newTransactionType = isDebtPaymentChecked ? 'debt_payment' : 'transfer';

      try {
        // Update both sides of the transfer
        // Current transaction (withdrawal - negative)
        await updateTransaction.mutateAsync({
          id: transaction.id,
          updates: {
            date,
            amount: -Math.abs(amountNum), // Ensure negative for withdrawal
            notes: notes || null,
            transaction_type: newTransactionType,
          },
        });

        // Linked transaction (deposit - positive)
        if (linkedTransaction) {
          await updateTransaction.mutateAsync({
            id: linkedTransaction.id,
            updates: {
              date,
              amount: Math.abs(amountNum), // Ensure positive for deposit
              notes: notes || null,
              transaction_type: newTransactionType,
            },
          });
        }

        onClose();
      } catch (error) {
        logger.error('Failed to update transfer', error);
        alert('Failed to update transfer');
      }
      return;
    }

    // Regular transaction validation and update
    if (!validateForm()) {
      return;
    }

    const amountNum = parseFloat(amount);
    const finalAmount = transactionType === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum);

    try {
      // Create or get payee
      let payeeId = payees.find((p) => p.name === payeeName)?.id;

      if (!payeeId) {
        const newPayees: any = await createPayee.mutateAsync({
          name: payeeName,
          default_category_id: categoryId || null,
          default_account_id: accountId || null,
        });
        
        payeeId = Array.isArray(newPayees) ? newPayees[0]?.id : newPayees?.id;
      }

      await updateTransaction.mutateAsync({
        id: transaction.id,
        updates: {
          date,
          account_id: accountId,
          payee_id: payeeId,
          category_id: categoryId,
          amount: finalAmount,
          notes: notes || null,
        },
      });

      onClose();
    } catch (error) {
      logger.error('Failed to update transaction', error);
      alert('Failed to update transaction');
    }
  };

  const handleDelete = async () => {
    try {
      if (isTransfer) {
        // Delete both sides of the transfer
        await deleteTransfer.mutateAsync(transaction.id);
      } else {
        // Delete regular transaction
        await deleteTransaction.mutateAsync(transaction.id);
      }
      onClose();
    } catch (error) {
      logger.error('Failed to delete transaction', error);
      alert('Failed to delete transaction');
    }
  };

  if (!isOpen) return null;

  // Get account names for display
  const fromAccount = accounts.find(a => a.id === transaction.account_id);
  const toAccount = linkedTransaction ? accounts.find(a => a.id === linkedTransaction.account_id) : null;

  // Transfer/Debt Payment Edit UI
  if (isTransfer) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isDebtPaymentChecked ? '💳 Edit Debt Payment' : '↔️ Edit Transfer'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info Banner */}
              <div className={`p-3 rounded-lg text-sm ${isDebtPaymentChecked ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                <p className="flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Editing will update both linked transactions</span>
                </p>
              </div>

              {/* Transfer Details - Read Only */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From Account:</span>
                  <span className="font-medium">{fromAccount?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Account:</span>
                  <span className="font-medium">{toAccount?.name || 'Unknown'}</span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="transfer-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="transfer-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="transfer-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="transfer-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="transfer-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="transfer-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Debt Payment Toggle */}
              {(toAccount?.type === 'credit_card' || toAccount?.type === 'loan' || isDebtPaymentChecked) && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <input
                    type="checkbox"
                    id="is-debt-payment-edit"
                    checked={isDebtPaymentChecked}
                    onChange={(e) => setIsDebtPaymentChecked(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="is-debt-payment-edit" className="text-sm text-gray-700 flex-1">
                    <span className="font-medium">Track as debt payment</span>
                    <span className="block text-xs text-gray-600 mt-0.5">
                      Counts toward debt payoff progress in analytics
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTransaction.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    Delete this {isDebtPaymentChecked ? 'debt payment' : 'transfer'}? This will remove both linked transactions.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteTransfer.isPending}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteTransfer.isPending ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Transaction</h2>
              <p className="text-xs text-gray-500 mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">I</kbd> for Income, 
                <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">E</kbd> for Expense
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Income/Expense Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType('expense')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    transactionType === 'expense'
                      ? 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">💸</span>
                    <span>Expense</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('income')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    transactionType === 'income'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">💰</span>
                    <span>Income</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Date & Account Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">📅 Date</span>
                </label>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">🏦 Account</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    if (errors.accountId) setErrors(prev => ({ ...prev, accountId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.accountId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {errors.accountId && <p className="text-xs text-red-600 mt-1">{errors.accountId}</p>}
              </div>
            </div>

            {/* Payee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">👤 Payee</span>
              </label>
              <PayeeSuggestionInput
                value={payeeName}
                onChange={handlePayeeChange}
                placeholder="Enter or select payee..."
                required
              />
              {errors.payeeName && <p className="text-xs text-red-600 mt-1">{errors.payeeName}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">🏷️ Category</span>
              </label>
              <CategorySuggestionInput
                value={categoryId}
                onChange={(id) => {
                  setCategoryId(id);
                  if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: '' }));
                }}
                placeholder="Search or select category..."
                required
                error={errors.categoryId}
              />
              {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">💵 Amount</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
              </div>
              {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  📝 Notes <span className="text-gray-400 font-normal">(optional)</span>
                </span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Add a note..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {/* Delete Button */}
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteTransaction.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {deleteTransaction.isPending ? 'Deleting...' : 'Confirm Delete'}
                </button>
              )}
              
              <div className="flex-1 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTransaction.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors font-medium"
                >
                  {updateTransaction.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
