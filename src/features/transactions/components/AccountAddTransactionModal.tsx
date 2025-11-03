import { useEffect, useRef, useState } from 'react';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { usePayees } from '../hooks/usePayees';
import { useCreatePayee } from '../hooks/useCreatePayee';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useCreateTransfer } from '../hooks/useTransfer';
import { PayeeSuggestionInput } from './PayeeSuggestionInput';
import { CategorySuggestionInput } from './CategorySuggestionInput';
import { logger } from '@/lib/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string; // locked account context
  defaultType?: 'expense' | 'income' | 'transfer' | 'payment';
  defaultToAccountId?: string;
}

type TxType = 'expense' | 'income' | 'transfer' | 'payment';

export function AccountAddTransactionModal({ isOpen, onClose, accountId, defaultType, defaultToAccountId }: Props) {
  const { data: accounts = [] } = useAccounts();
  const { data: payees = [] } = usePayees();
  const createPayee = useCreatePayee();
  const createTransaction = useCreateTransaction();
  const createTransfer = useCreateTransfer();

  const [transactionType, setTransactionType] = useState<TxType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payeeName, setPayeeName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => dateRef.current?.focus(), 100);
      if (defaultType) setTransactionType(defaultType);
      if (defaultToAccountId) setToAccountId(defaultToAccountId);
    }
  }, [isOpen, defaultType, defaultToAccountId]);

  const handlePayeeChange = (value: string, suggestion?: {
    id: string;
    name: string;
    default_category_id: string | null;
    default_account_id: string | null;
  }) => {
    setPayeeName(value);
    if (errors.payeeName) setErrors(prev => ({ ...prev, payeeName: '' }));
    if (suggestion?.default_category_id) setCategoryId(suggestion.default_category_id);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!date) e.date = 'Date is required';
    if (!amount || parseFloat(amount) <= 0) e.amount = 'Valid amount is required';

    if (transactionType === 'transfer' || transactionType === 'payment') {
      if (!toAccountId) e.toAccountId = 'Destination account is required';
      if (toAccountId && toAccountId === accountId) e.toAccountId = 'Cannot transfer to the same account';
    } else {
      if (!payeeName.trim()) e.payeeName = 'Payee is required';
      if (!categoryId) e.categoryId = 'Category is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setPayeeName('');
    setCategoryId('');
    setAmount('');
    setNotes('');
    setToAccountId('');
    setDate(new Date().toISOString().split('T')[0]);
    setTransactionType('expense');
    setErrors({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const amountNum = parseFloat(amount);

    try {
      if (transactionType === 'transfer' || transactionType === 'payment') {
        await createTransfer.mutateAsync({
          date,
          fromAccountId: accountId,
          toAccountId,
          amount: amountNum,
          notes: notes || undefined,
          isDebtPayment: transactionType === 'payment',
        });
      } else {
        const finalAmount = transactionType === 'expense' ? -Math.abs(amountNum) : Math.abs(amountNum);

        let payeeId = payees.find(p => p.name === payeeName)?.id;
        if (!payeeId) {
          const created: any = await createPayee.mutateAsync({
            name: payeeName,
            default_category_id: categoryId || null,
            default_account_id: accountId || null,
          });
          payeeId = Array.isArray(created) ? created[0]?.id : created?.id;
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
      }

      resetForm();
      onClose();
    } catch (err) {
      logger.error('Failed to add transaction', err);
      alert('Failed to add transaction');
    }
  };

  if (!isOpen) return null;

  const accountName = accounts.find(a => a.id === accountId)?.name || 'Account';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
              <p className="text-xs text-gray-500 mt-1">{accountName} • Account locked</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date</label>
              <input
                ref={dateRef}
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors(prev => ({ ...prev, date: '' })); }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>

            {/* Transaction Type */}
            <div className="grid grid-cols-2 gap-2">
              {(['expense','income','transfer','payment'] as TxType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransactionType(t)}
                  className={`px-4 py-2.5 rounded-lg font-medium border-2 transition-all ${
                    transactionType === t ? 'shadow-sm ' + (t === 'expense' ? 'bg-red-100 text-red-700 border-red-300' :
                    t === 'income' ? 'bg-green-100 text-green-700 border-green-300' :
                    t === 'transfer' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                    'bg-green-100 text-green-700 border-green-300') : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {t === 'expense' ? '💸 Expense' : t === 'income' ? '💰 Income' : t === 'transfer' ? '↔️ Transfer' : '💳 Payment'}
                </button>
              ))}
            </div>

            {/* To Account for transfers/payments */}
            {(transactionType === 'transfer' || transactionType === 'payment') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🏦 {transactionType === 'payment' ? 'Pay To' : 'To Account'}</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.toAccountId ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="">Select...</option>
                  {accounts
                    .filter(a => a.id !== accountId)
                    .filter(a => transactionType === 'payment' ? (a.type === 'credit' || a.type === 'mortgage') : true)
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
                {errors.toAccountId && <p className="text-xs text-red-600 mt-1">{errors.toAccountId}</p>}
              </div>
            )}

            {/* Payee & Category for expense/income */}
            {(transactionType !== 'transfer' && transactionType !== 'payment') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">👤 Payee</label>
                  <PayeeSuggestionInput
                    value={payeeName}
                    onChange={handlePayeeChange}
                    placeholder="Enter or select payee..."
                    required
                  />
                  {errors.payeeName && <p className="text-xs text-red-600 mt-1">{errors.payeeName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Category</label>
                  <CategorySuggestionInput
                    value={categoryId}
                    onChange={(id) => { setCategoryId(id); if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: '' })); }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">💵 Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
                required
              />
              {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📝 Notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Add a note..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={createTransaction.isPending || createTransfer.isPending} className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 font-medium">
                {createTransaction.isPending || createTransfer.isPending ? 'Saving...' : (transactionType === 'transfer' ? 'Create Transfer' : transactionType === 'payment' ? 'Submit Payment' : 'Add Transaction')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
