/**
 * TransferModal Component
 * 
 * Modal for creating transfer transactions between accounts
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useCreateTransfer } from '../hooks/useTransfer';
import { formatCurrency, formatDateForInput } from '@/lib/format';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultFromAccountId?: string;
}

export function TransferModal({ isOpen, onClose, defaultDate, defaultFromAccountId }: TransferModalProps) {
  const [date, setDate] = useState(defaultDate || formatDateForInput(new Date()));
  const [fromAccountId, setFromAccountId] = useState(defaultFromAccountId || '');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isDebtPayment, setIsDebtPayment] = useState(false);

  const { data: accounts } = useAccounts();
  const createTransfer = useCreateTransfer();

  // Filter out archived accounts and split by type
  const activeAccounts = accounts?.filter(a => !a.is_archived) || [];
  const checkingAccounts = activeAccounts.filter(a => a.type === 'checking');
  const savingsAccounts = activeAccounts.filter(a => a.type === 'savings');
  const investmentAccounts = activeAccounts.filter(a => a.type === 'investment');
  const creditCardAccounts = activeAccounts.filter(a => a.type === 'credit_card');
  const loanAccounts = activeAccounts.filter(a => a.type === 'loan');
  const otherAccounts = activeAccounts.filter(a => !['checking', 'savings', 'investment', 'credit_card', 'loan'].includes(a.type));

  // Auto-detect if this is likely a debt payment (destination is a liability account)
  const toAccount = accounts?.find(a => a.id === toAccountId);
  const isLikelyDebtPayment = toAccount && ['credit_card', 'loan'].includes(toAccount.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAccountId || !toAccountId || !amount) {
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (fromAccountId === toAccountId) {
      alert('Cannot transfer to the same account');
      return;
    }

    try {
      await createTransfer.mutateAsync({
        date,
        fromAccountId,
        toAccountId,
        amount: amountNum,
        notes: notes || undefined,
        isDebtPayment: isDebtPayment,
      });

      // Reset form and close
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setNotes('');
      setIsDebtPayment(false);
      onClose();
    } catch (error) {
      console.error('Failed to create transfer:', error);
      alert('Failed to create transfer. Please try again.');
    }
  };

  const handleCancel = () => {
    setFromAccountId(defaultFromAccountId || '');
    setToAccountId('');
    setAmount('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  const renderAccountGroup = (title: string, accts: typeof activeAccounts) => {
    if (accts.length === 0) return null;
    return (
      <optgroup label={title}>
        {accts.map(account => (
          <option key={account.id} value={account.id}>
            {account.name} ({formatCurrency(account.current_balance || 0)})
          </option>
        ))}
      </optgroup>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transfer Between Accounts</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-500"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* From Account */}
          <div>
            <label htmlFor="from-account" className="block text-sm font-medium text-gray-700 mb-1">
              From Account
            </label>
            <select
              id="from-account"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select source account...</option>
              {renderAccountGroup('Checking', checkingAccounts)}
              {renderAccountGroup('Savings', savingsAccounts)}
              {renderAccountGroup('Investment', investmentAccounts)}
              {renderAccountGroup('Other', otherAccounts)}
            </select>
          </div>

          {/* To Account */}
          <div>
            <label htmlFor="to-account" className="block text-sm font-medium text-gray-700 mb-1">
              To Account
            </label>
            <select
              id="to-account"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select destination account...</option>
              {renderAccountGroup('Checking', checkingAccounts)}
              {renderAccountGroup('Savings', savingsAccounts)}
              {renderAccountGroup('Investment', investmentAccounts)}
              {renderAccountGroup('Credit Cards', creditCardAccounts)}
              {renderAccountGroup('Loans', loanAccounts)}
              {renderAccountGroup('Other', otherAccounts)}
            </select>
            {isLikelyDebtPayment && (
              <p className="text-xs text-blue-600 mt-1">
                💡 Transferring to a credit card or loan account
              </p>
            )}
          </div>

          {/* Debt Payment Checkbox */}
          {isLikelyDebtPayment && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <input
                type="checkbox"
                id="is-debt-payment"
                checked={isDebtPayment}
                onChange={(e) => setIsDebtPayment(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is-debt-payment" className="text-sm text-gray-700 flex-1">
                <span className="font-medium">Track as debt payment</span>
                <span className="block text-xs text-gray-600 mt-0.5">
                  This will count toward your debt payoff progress in analytics
                </span>
              </label>
            </div>
          )}

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
              placeholder="Add a note about this transfer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTransfer.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTransfer.isPending ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
