/**
 * BillsList Component
 * 
 * Displays all recurring bills with status, next due date, and actions.
 */

import { useState } from 'react';
import { useBills } from '../hooks/useBills';
import { useToggleBillStatus, useDeleteBill } from '../hooks/useBillMutations';
import { logger } from '@/lib/logger';
import { AddBillModal } from './AddBillModal';
import { EditBillModal } from './EditBillModal';
import { PayBillModal } from './PayBillModal';
import type { Bill } from '../hooks/useBills';

export function BillsList() {
  const { data: bills, isLoading, error } = useBills();
  const toggleStatus = useToggleBillStatus();
  const deleteBill = useDeleteBill();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bills...</div>
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load bills', { error });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load bills. Please try again.</div>
      </div>
    );
  }

  const activeBills = bills?.filter(b => b.status === 'active') || [];
  const pausedBills = bills?.filter(b => b.status === 'paused') || [];

  const handleToggleStatus = async (bill: Bill) => {
    try {
      const newStatus = bill.status === 'active' ? 'paused' : 'active';
      await toggleStatus.mutateAsync({ id: bill.id, status: newStatus });
      logger.info(`Bill ${newStatus}`, { billId: bill.id, billName: bill.name });
    } catch (err) {
      logger.error('Failed to toggle bill status', { error: err });
    }
  };

  const handleDelete = async (bill: Bill) => {
    if (!confirm(`Are you sure you want to delete "${bill.name}"?`)) return;
    
    try {
      await deleteBill.mutateAsync(bill.id);
      logger.info('Bill deleted', { billId: bill.id, billName: bill.name });
    } catch (err) {
      logger.error('Failed to delete bill', { error: err });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: string | null) => {
    if (!date) return null;
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (days: number | null) => {
    if (days === null) return 'text-gray-500';
    if (days < 0) return 'text-red-600';
    if (days <= 3) return 'text-orange-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const renderBillCard = (bill: Bill) => {
    const daysUntil = getDaysUntil(bill.next_due);
    const dueDateColor = getDueDateColor(daysUntil);

    return (
      <div
        key={bill.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{bill.name}</h3>
            <div className="mt-1 space-y-1 text-sm text-gray-600">
              {bill.payee && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">To:</span>
                  <span>{bill.payee.name}</span>
                </div>
              )}
              {bill.category && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Category:</span>
                  <span>{bill.category.name}</span>
                </div>
              )}
              {bill.account && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">From:</span>
                  <span>{bill.account.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(bill.amount)}
            </div>
            <div className={`text-sm ${dueDateColor}`}>
              {bill.next_due ? (
                <>
                  {formatDate(bill.next_due)}
                  {daysUntil !== null && daysUntil >= 0 && (
                    <div className="text-xs">in {daysUntil} days</div>
                  )}
                  {daysUntil !== null && daysUntil < 0 && (
                    <div className="text-xs font-semibold">OVERDUE</div>
                  )}
                </>
              ) : (
                'Not scheduled'
              )}
            </div>
          </div>
        </div>

        {bill.notes && (
          <div className="mt-2 text-sm text-gray-500 italic">
            {bill.notes}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setPayingBill(bill)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Pay Now
          </button>
          <button
            onClick={() => setEditingBill(bill)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggleStatus(bill)}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {bill.status === 'active' ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => handleDelete(bill)}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Bill
        </button>
      </div>

      {/* Empty State */}
      {bills?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No bills yet</div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Bill
          </button>
        </div>
      )}

      {/* Active Bills */}
      {activeBills.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Active Bills ({activeBills.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeBills.map(renderBillCard)}
          </div>
        </div>
      )}

      {/* Paused Bills */}
      {pausedBills.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">
            Paused Bills ({pausedBills.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {pausedBills.map(renderBillCard)}
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <AddBillModal onClose={() => setIsAddModalOpen(false)} />
      )}

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
        />
      )}

      {payingBill && (
        <PayBillModal
          bill={payingBill}
          onClose={() => setPayingBill(null)}
        />
      )}
    </div>
  );
}
