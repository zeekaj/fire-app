/**
 * UpcomingBillsWidget Component
 * 
 * Shows upcoming bills in the next 30 days on the dashboard.
 */

import { useMemo } from 'react';
import { useActiveBills } from '@/features/bills';
import { formatCurrency } from '@/lib/format';

export function UpcomingBillsWidget() {
  const { data: bills = [] } = useActiveBills();

  const upcomingBills = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return bills
      .filter(bill => {
        if (!bill.next_due) return false;
        const dueDate = new Date(bill.next_due);
        return dueDate >= now && dueDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.next_due!);
        const dateB = new Date(b.next_due!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Show next 5 bills
  }, [bills]);

  const getDaysUntil = (date: string) => {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days <= 3) return 'text-orange-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (upcomingBills.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bills</h3>
        <div className="text-center py-8 text-gray-400">
          <p>No bills due in the next 30 days</p>
          <p className="text-sm mt-1">You're all caught up! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Bills</h3>
        <span className="text-sm text-gray-500">Next 30 days</span>
      </div>
      
      <div className="space-y-3">
        {upcomingBills.map((bill) => {
          const daysUntil = getDaysUntil(bill.next_due!);
          const dueDateColor = getDueDateColor(daysUntil);

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{bill.name}</div>
                {bill.payee && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {bill.payee.name}
                  </div>
                )}
              </div>
              
              <div className="text-right ml-4">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(bill.amount)}
                </div>
                <div className={`text-xs font-medium ${dueDateColor}`}>
                  {daysUntil === 0 && 'Today'}
                  {daysUntil === 1 && 'Tomorrow'}
                  {daysUntil > 1 && `in ${daysUntil} days`}
                  {daysUntil < 0 && 'OVERDUE'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total upcoming</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(upcomingBills.reduce((sum, b) => sum + b.amount, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
