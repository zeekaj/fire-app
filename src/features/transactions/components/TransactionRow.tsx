/**
 * TransactionRow Component
 * 
 * Displays a single transaction in a table row.
 */

import type { Database } from '@/lib/database.types';
import { formatCurrency, formatDate } from '@/lib/format';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface TransactionRowProps {
  transaction: Transaction;
  accountName?: string;
  payeeName?: string;
  categoryName?: string;
}

export function TransactionRow({
  transaction,
  accountName,
  payeeName,
  categoryName,
}: TransactionRowProps) {
  const { date, amount, notes, is_pending } = transaction;

  const isNegative = amount < 0;

  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 ${is_pending ? 'opacity-60' : ''}`}>
      {/* Date */}
      <td className="py-3 px-4 text-sm text-gray-900">
        {formatDate(date)}
        {is_pending && (
          <span className="ml-2 text-xs text-orange-600 font-medium">Pending</span>
        )}
      </td>

      {/* Account */}
      <td className="py-3 px-4 text-sm text-gray-600">
        {accountName || '—'}
      </td>

      {/* Payee */}
      <td className="py-3 px-4 text-sm text-gray-900 font-medium">
        {payeeName || 'Unknown'}
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-sm text-gray-600">
        {categoryName || 'Uncategorized'}
      </td>

      {/* Notes */}
      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
        {notes || '—'}
      </td>

      {/* Amount */}
      <td className={`py-3 px-4 text-sm font-semibold text-right ${
        isNegative ? 'text-danger' : 'text-success'
      }`}>
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}
