/**
 * AddBillModal Component
 * 
 * Modal for creating a new recurring bill.
 */

import { useState } from 'react';
import { useCreateBill } from '../hooks/useBillMutations';
import { useAccounts } from '@/features/accounts';
import { useCategories } from '@/features/transactions/hooks/useCategories';
import { usePayees } from '@/features/transactions/hooks/usePayees';
import { logger } from '@/lib/logger';

interface AddBillModalProps {
  onClose: () => void;
}

export function AddBillModal({ onClose }: AddBillModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [notes, setNotes] = useState('');

  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: payees } = usePayees();
  const createBill = useCreateBill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a bill name');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!accountId) {
      alert('Please select an account');
      return;
    }

    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    if (!nextDue) {
      alert('Please enter the next due date');
      return;
    }

    try {
      // Build RRULE string
      const rrule = `FREQ=${frequency}`;

      await createBill.mutateAsync({
        name: name.trim(),
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId,
        payee_id: payeeId || null,
        rrule,
        next_due: nextDue,
        status: 'active',
        notes: notes.trim() || null,
      });

      logger.info('Bill created', { billName: name });
      onClose();
    } catch (err) {
      logger.error('Failed to create bill', { error: err });
      alert('Failed to create bill. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Bill</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Bill Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Rent, Electric Bill"
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Account */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">
                Pay From Account *
              </label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payee */}
            <div>
              <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">
                Payee (Optional)
              </label>
              <select
                id="payee"
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a payee</option>
                {payees?.map((payee) => (
                  <option key={payee.id} value={payee.id}>
                    {payee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            {/* Next Due Date */}
            <div>
              <label htmlFor="nextDue" className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Date *
              </label>
              <input
                type="date"
                id="nextDue"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional details..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBill.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createBill.isPending ? 'Adding...' : 'Add Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
