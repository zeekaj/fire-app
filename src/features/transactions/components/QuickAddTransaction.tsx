/**
 * QuickAddTransaction Component
 * 
 * Keyboard-first transaction entry modal.
 * Keyboard shortcuts:
 * - N: Open modal
 * - T: Set date to today
 * - ESC: Close modal
 */

import { useState, useEffect, useRef } from 'react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useBudgetableCategories } from '../hooks/useCategories';
import { usePayees } from '../hooks/usePayees';
import { useCreatePayee } from '../hooks/useCreatePayee';
import { useCreateTransaction } from '../hooks/useTransactions';
import { PayeeSuggestionInput } from './PayeeSuggestionInput';
import { logger } from '@/lib/logger';

interface QuickAddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddTransaction({ isOpen, onClose }: QuickAddTransactionProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useBudgetableCategories();
  const { data: payees = [] } = usePayees();
  const createTransaction = useCreateTransaction();
  const createPayee = useCreatePayee();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // The PayeeSuggestionInput handles its own autoFocus

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // T = Today
      if (e.key === 't' || e.key === 'T') {
        if (document.activeElement === dateInputRef.current) {
          e.preventDefault();
          setDate(new Date().toISOString().split('T')[0]);
        }
      }

      // ESC = Close
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-fill category when payee is selected
  const handlePayeeChange = (value: string, suggestion?: {
    id: string;
    name: string;
    default_category_id: string | null;
    default_account_id: string | null;
  }) => {
    setPayeeName(value);

    // If a suggestion is provided, use its default values
    if (suggestion) {
      if (suggestion.default_category_id) {
        setCategoryId(suggestion.default_category_id);
      }
      if (suggestion.default_account_id && !accountId) {
        setAccountId(suggestion.default_account_id);
      }
    } else {
      // Fallback to the old logic for manual entry
      const matchingPayee = payees.find(
        (p) => p.name.toLowerCase() === value.toLowerCase()
      );

      if (matchingPayee && matchingPayee.default_category_id) {
        setCategoryId(matchingPayee.default_category_id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !payeeName || !categoryId || !amount) {
      alert('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      // Create or get payee
      let payeeId = payees.find((p) => p.name === payeeName)?.id;

      if (!payeeId) {
        // Create new payee inline
        const newPayees: any = await createPayee.mutateAsync({
          name: payeeName,
          default_category_id: categoryId || null,
          default_account_id: accountId || null,
        });
        
        // Get the newly created payee ID
        payeeId = Array.isArray(newPayees) ? newPayees[0]?.id : newPayees?.id;
      }

      await createTransaction.mutateAsync({
        date,
        account_id: accountId,
        payee_id: payeeId,
        category_id: categoryId,
        amount: amountNum,
        notes: notes || null,
        is_pending: false,
      });

      // Reset form
      setPayeeName('');
      setCategoryId('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);

      onClose();
    } catch (error) {
      logger.error('Failed to create transaction', error);
      alert('Failed to create transaction');
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Add Transaction</h2>
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
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-xs text-gray-500">(Press T for today)</span>
              </label>
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payee
              </label>
              <PayeeSuggestionInput
                value={payeeName}
                onChange={handlePayeeChange}
                placeholder="Enter or select payee..."
                required
                autoFocus
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.path}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-400">(optional)</span>
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTransaction.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {createTransaction.isPending ? 'Saving...' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
