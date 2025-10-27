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
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  transferAccountName?: string; // Name of the linked transfer account
}

export function TransactionRow({
  transaction,
  accountName,
  payeeName,
  categoryName,
  isSelected = false,
  onSelect,
  onClick,
  transferAccountName,
}: TransactionRowProps) {
  const { date, amount, notes, is_pending, transfer_id, transaction_type } = transaction;

  const isNegative = amount < 0;
  const isTransfer = !!transfer_id;
  const isDebtPayment = transaction_type === 'debt_payment';

  return (
    <tr 
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        is_pending ? 'opacity-60' : ''
      } ${isSelected ? 'bg-blue-50' : ''}`}
    >
      {/* Checkbox */}
      {onSelect && (
        <td className="py-3 px-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
        </td>
      )}
      {/* Date */}
      <td className="py-3 px-4 text-sm text-gray-900 cursor-pointer" onClick={onClick}>
        {formatDate(date)}
        {is_pending && (
          <span className="ml-2 text-xs text-orange-600 font-medium">Pending</span>
        )}
      </td>

      {/* Account */}
      <td className="py-3 px-4 text-sm text-gray-600 cursor-pointer" onClick={onClick}>
        {accountName || '—'}
      </td>

      {/* Payee */}
      <td className="py-3 px-4 text-sm text-gray-900 font-medium cursor-pointer" onClick={onClick}>
        {isTransfer ? (
          <div className="flex items-center gap-2">
            <span className={isDebtPayment ? "text-green-600" : "text-blue-600"} title={isDebtPayment ? "Debt Payment" : "Transfer"}>
              {isDebtPayment ? '💳' : '↔️'}
            </span>
            <span className={isDebtPayment ? "text-green-700" : "text-blue-700"}>
              {isNegative ? `To ${transferAccountName || 'Unknown'}` : `From ${transferAccountName || 'Unknown'}`}
            </span>
          </div>
        ) : (
          payeeName || 'Unknown'
        )}
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-sm text-gray-600 cursor-pointer" onClick={onClick}>
        {isTransfer ? (
          <span className={`${isDebtPayment ? 'text-green-600' : 'text-blue-600'} italic`}>
            {isDebtPayment ? 'Debt Payment' : 'Transfer'}
          </span>
        ) : (
          categoryName || 'Uncategorized'
        )}
      </td>

      {/* Notes */}
      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate cursor-pointer" onClick={onClick}>
        {notes || '—'}
      </td>

      {/* Amount */}
      <td className={`py-3 px-4 text-sm font-semibold text-right cursor-pointer ${
        isNegative ? 'text-danger' : 'text-success'
      }`} onClick={onClick}>
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}
