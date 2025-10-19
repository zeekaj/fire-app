/**
 * BudgetCategoryRow Component
 * 
 * Displays budget progress for a single category.
 */

import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import type { Database } from '@/lib/database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];

interface BudgetCategoryRowProps {
  budget: Budget;
  categoryName: string;
  spent: number;
  onUpdateTarget?: (budgetId: string, newTarget: number) => void;
}

export function BudgetCategoryRow({
  budget,
  categoryName,
  spent,
  onUpdateTarget,
}: BudgetCategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(budget.target.toString());

  const { target } = budget;
  const remaining = target - spent;
  const percentUsed = target > 0 ? (spent / target) * 100 : 0;

  // Color based on percentage used
  const getProgressColor = () => {
    if (percentUsed >= 100) return 'bg-danger';
    if (percentUsed >= 90) return 'bg-warning';
    if (percentUsed >= 75) return 'bg-yellow-500';
    return 'bg-success';
  };

  const handleSave = () => {
    const newTarget = parseFloat(editValue);
    if (!isNaN(newTarget) && newTarget > 0 && onUpdateTarget) {
      onUpdateTarget(budget.id, newTarget);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(budget.target.toString());
    setIsEditing(false);
  };

  return (
    <div className="py-4 border-b border-gray-200 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{categoryName}</h4>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Spent */}
          <div className="text-right">
            <div className="text-xs text-gray-500">Spent</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(spent)}
            </div>
          </div>

          {/* Target */}
          <div className="text-right min-w-[100px]">
            <div className="text-xs text-gray-500">Budget</div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="w-20 px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="text-success hover:text-success/80"
                  title="Save"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-gray-900 hover:text-primary"
              >
                {formatCurrency(target)}
              </button>
            )}
          </div>

          {/* Remaining */}
          <div className="text-right min-w-[100px]">
            <div className="text-xs text-gray-500">Remaining</div>
            <div
              className={`text-sm font-semibold ${
                remaining >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{Math.min(percentUsed, 100).toFixed(0)}% used</span>
          {percentUsed > 100 && (
            <span className="text-danger font-medium">
              {formatCurrency(spent - target)} over budget
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
