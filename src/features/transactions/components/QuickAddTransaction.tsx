/**
 * QuickAddTransaction Component
 * 
 * Keyboard-first transaction entry modal.
 * Keyboard shortcuts:
 * - N: Open modal
 * - T: Set date to today
 * - I: Toggle to Income
 * - E: Toggle to Expense
 * - ESC: Close modal
 * - Enter: Submit (when form is valid)
 */

import { useState, useEffect, useRef } from 'react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees } from '../hooks/usePayees';
import { useCreatePayee } from '../hooks/useCreatePayee';
import { useCreateTransaction, useTransactions } from '../hooks/useTransactions';
import { useCreateTransfer } from '../hooks/useTransfer';
import { PayeeSuggestionInput } from './PayeeSuggestionInput';
import { CategorySuggestionInput } from './CategorySuggestionInput';
import { logger } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/format';
import { validateTransactionInput } from '@/lib/data-utils';

interface QuickAddTransactionProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional defaults when opening from context (e.g., account register) */
  defaultAccountId?: string;
  defaultType?: 'expense' | 'income' | 'transfer' | 'payment';
  defaultToAccountId?: string;
  /** If true, hide/lock the account selector to the provided defaultAccountId */
  lockAccountSelection?: boolean;
}

type TransactionType = 'expense' | 'income' | 'transfer' | 'payment';

export function QuickAddTransaction({ isOpen, onClose, defaultAccountId, defaultType, defaultToAccountId, lockAccountSelection }: QuickAddTransactionProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const { data: recentTransactions = [] } = useTransactions(5);
  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();
  const createPayee = useCreatePayee();

  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Transfer/Payment-specific state
  const [toAccountId, setToAccountId] = useState('');

  // When opened from an account context, lock the account selection to that account
  const isAccountLocked = !!lockAccountSelection || !!defaultAccountId;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length === 0) return;
    if (defaultAccountId) {
      setAccountId(defaultAccountId);
      return;
    }
    if (!accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId, defaultAccountId]);

  // Auto-focus and apply default type/to-account when modal opens
  useEffect(() => {
    if (isOpen && dateInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        dateInputRef.current?.focus();
        dateInputRef.current?.select();
      }, 100);
    }
    if (isOpen && defaultType) {
      setTransactionType(defaultType);
    }
    if (isOpen && defaultToAccountId) {
      setToAccountId(defaultToAccountId);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

      // T = Today (only in date field)
      if ((e.key === 't' || e.key === 'T') && document.activeElement === dateInputRef.current) {
        e.preventDefault();
        setDate(new Date().toISOString().split('T')[0]);
      }

      // I = Income (when not typing)
      if ((e.key === 'i' || e.key === 'I') && !isInputField) {
        e.preventDefault();
        setTransactionType('income');
      }

      // E = Expense (when not typing)
      if ((e.key === 'e' || e.key === 'E') && !isInputField) {
        e.preventDefault();
        setTransactionType('expense');
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
    // Clear error when user types
    if (errors.payeeName) {
      setErrors(prev => ({ ...prev, payeeName: '' }));
    }

    // If a suggestion is provided, use its default values
    if (suggestion) {
      if (suggestion.default_category_id) {
        setCategoryId(suggestion.default_category_id);
      }
      if (suggestion.default_account_id && !accountId && !isAccountLocked) {
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

  // Copy data from previous transaction
  const copyPreviousTransaction = () => {
    if (recentTransactions.length === 0) return;
    
    const lastTx = recentTransactions[0];
    if (!isAccountLocked) {
      setAccountId(lastTx.account_id);
    }
    setCategoryId(lastTx.category_id || '');
    setAmount(Math.abs(lastTx.amount).toString());
    setTransactionType(lastTx.amount < 0 ? 'expense' : 'income');
    
    // Find and set payee name
    const payee = payees.find(p => p.id === lastTx.payee_id);
    if (payee) {
      setPayeeName(payee.name);
    }
  };

  // Validate form using shared helper
  const validateForm = (): boolean => {
    const parsedAmount = amount ? parseFloat(amount) : undefined;
    const selectedAccount = accounts.find(a => a.id === accountId);
    const selectedToAccount = accounts.find(a => a.id === toAccountId);
    const inputErrors = validateTransactionInput({
      transactionType,
      accountId,
      accountType: selectedAccount?.type,
      toAccountId,
      toAccountType: selectedToAccount?.type,
      payeeName,
      categoryId,
      amount: parsedAmount,
      date,
    });

    setErrors(inputErrors);
    return Object.keys(inputErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const amountNum = parseFloat(amount);

    try {
      // Handle transfers and payments (both use the transfer mechanism)
      if (transactionType === 'transfer' || transactionType === 'payment') {
        if (!toAccountId) {
          alert('Please select a destination account');
          return;
        }
        if (accountId === toAccountId) {
          alert('Cannot transfer to the same account');
          return;
        }

        await createTransfer.mutateAsync({
          date,
          fromAccountId: accountId,
          toAccountId: toAccountId,
          amount: amountNum,
          notes: notes || undefined,
          isDebtPayment: transactionType === 'payment',
        });

        // Reset form
        setAccountId(accounts[0]?.id || '');
        setToAccountId('');
        setAmount('');
        setNotes('');
        setDate(new Date().toISOString().split('T')[0]);
        setTransactionType('expense');
        setErrors({});

        onClose();
        return;
      }

      // Handle regular transactions (expense/income)
      const finalAmount = transactionType === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum);

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
        amount: finalAmount,
        notes: notes || null,
        is_pending: false,
      });

      // Reset form
      setPayeeName('');
      setCategoryId('');
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setTransactionType('expense');
      setErrors({});

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
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Add Transaction</h2>
              <p className="text-xs text-gray-500 mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">I</kbd> for Income, 
                <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">E</kbd> for Expense,
                <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">T</kbd> for Today
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left/Center Column */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date & Account Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        📅 Date
                      </span>
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

                  {/* Account selector omitted entirely when locked */}
                  {!isAccountLocked && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1">
                          🏦 {transactionType === 'transfer' || transactionType === 'payment' ? 'From Account' : 'Account'}
                        </span>
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
                            {account.name} ({formatCurrency(account.current_balance || 0)})
                          </option>
                        ))}
                      </select>
                      {errors.accountId && <p className="text-xs text-red-600 mt-1">{errors.accountId}</p>}
                    </div>
                  )}
                </div>

                {/* Transaction Type Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionType('expense')}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
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
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        transactionType === 'income'
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">�</span>
                        <span>Income</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType('transfer')}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        transactionType === 'transfer'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">↔️</span>
                        <span>Transfer</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType('payment')}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        transactionType === 'payment'
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">💳</span>
                        <span>Payment</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* For Transfers/Payments: Show To Account */}
                {(transactionType === 'transfer' || transactionType === 'payment') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        🏦 {transactionType === 'payment' ? 'Pay To' : 'To Account'}
                      </span>
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => {
                        setToAccountId(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Select destination...</option>
                      {accounts
                        .filter(account => {
                          // For payments, only show credit cards and mortgages (debt accounts)
                          if (transactionType === 'payment') {
                            const isDebtAccount = account.type === 'credit' || account.type === 'mortgage';
                            const isDifferentAccount = account.id !== accountId;
                            return isDebtAccount && isDifferentAccount;
                          }
                          // For transfers, show all accounts except the from account
                          return account.id !== accountId;
                        })
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name} ({formatCurrency(account.current_balance || 0)})
                          </option>
                        ))}
                      {transactionType === 'payment' && accounts.filter(a => 
                        (a.type === 'credit' || a.type === 'mortgage') && a.id !== accountId
                      ).length === 0 && (
                        <option value="" disabled>No credit cards or mortgages available</option>
                      )}
                    </select>
                  </div>
                )}

                {/* For Expense/Income: Show Payee and Category */}
                {transactionType !== 'transfer' && transactionType !== 'payment' && (
                  <>
            {/* Payee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  👤 Payee
                </span>
              </label>
              <PayeeSuggestionInput
                value={payeeName}
                onChange={handlePayeeChange}
                placeholder="Enter or select payee..."
                required
                autoFocus
              />
              {errors.payeeName && <p className="text-xs text-red-600 mt-1">{errors.payeeName}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  🏷️ Category
                </span>
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
                  </>
                )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  💵 Amount
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  ref={amountInputRef}
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTransaction.isPending || createTransfer.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors font-medium"
              >
                {(createTransaction.isPending || createTransfer.isPending) 
                  ? 'Saving...' 
                  : transactionType === 'transfer' 
                    ? 'Create Transfer'
                    : transactionType === 'payment'
                      ? 'Submit Payment'
                      : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Quick Actions & Recent */}
        <div className="space-y-4">
          {/* Copy Previous */}
          {recentTransactions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Copy Previous</h3>
              <button
                type="button"
                onClick={copyPreviousTransaction}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
              >
                <div className="text-sm font-medium text-gray-900">
                  {payees.find(p => p.id === recentTransactions[0].payee_id)?.name || 'Last Transaction'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatCurrency(recentTransactions[0].amount)}
                </div>
              </button>
            </div>
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent</h3>
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((tx) => {
                  const account = accounts.find(a => a.id === tx.account_id);
                  const payee = payees.find(p => p.id === tx.payee_id);
                  return (
                    <div
                      key={tx.id}
                      className="text-xs bg-white border border-gray-200 rounded p-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {payee?.name || 'Unknown'}
                          </div>
                          <div className="text-gray-500 truncate">
                            {account?.name || 'Unknown'}
                          </div>
                        </div>
                        <div className={`font-semibold ml-2 ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                      <div className="text-gray-400 mt-1">
                        {formatDate(tx.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
