/**
 * PayBillModal Component
 * 
 * Modal for marking a bill as paid (creates a transaction and updates next_due).
 */

import { useState } from 'react';
import { usePayBill } from '../hooks/useBillMutations';
import { logger } from '@/lib/logger';
import type { Bill } from '../hooks/useBills';

interface PayBillModalProps {
  bill: Bill;
  onClose: () => void;
}

export function PayBillModal({ bill, onClose }: PayBillModalProps) {
  const [amount, setAmount] = useState(bill.amount.toString());
  const [date, setDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const payBill = usePayBill();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!date) {
      alert('Please enter a payment date');
      return;
    }

    try {
      await payBill.mutateAsync({
        billId: bill.id,
        amount: paymentAmount,
        date,
        accountId: bill.account_id,
        categoryId: bill.category_id,
        payeeId: bill.payee_id,
      });

      logger.info('Bill paid', { 
        billId: bill.id, 
        billName: bill.name,
        amount: paymentAmount,
        date,
      });

      onClose();
    } catch (err) {
      logger.error('Failed to pay bill', { error: err });
      alert('Failed to record payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pay Bill</h2>

          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">Bill</div>
            <div className="font-semibold text-gray-900">{bill.name}</div>
            {bill.payee && (
              <div className="text-sm text-gray-600 mt-1">
                Payee: {bill.payee.name}
              </div>
            )}
            {bill.account && (
              <div className="text-sm text-gray-600">
                From: {bill.account.name}
              </div>
            )}
            {bill.category && (
              <div className="text-sm text-gray-600">
                Category: {bill.category.name}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
              <div className="text-xs text-gray-500 mt-1">
                Default: ${bill.amount.toFixed(2)}
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
              <strong>Note:</strong> This will create a transaction and update the next due date.
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
                disabled={payBill.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {payBill.isPending ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
