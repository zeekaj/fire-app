/**
 * MonthlyBudgets Component
 * 
 * Display and manage monthly budgets by category.
 */

import { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget, getCurrentMonth } from '../hooks/useBudgets';
import { useCategorySpending } from '../hooks/useCategorySpending';
import { useBudgetableCategories } from '@/features/transactions/hooks/useCategories';
import { BudgetCategoryRow } from './BudgetCategoryRow';
import { BudgetOverviewChart } from './BudgetOverviewChart';
import { formatCurrency } from '@/lib/format';
import { logger } from '@/lib/logger';

export function MonthlyBudgets() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const { data: budgets = [], isLoading } = useBudgets(month);
  const { data: categories = [] } = useBudgetableCategories();
  const spendingByCategory = useCategorySpending(month);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  // Create category lookup map
  const categoryMap = new Map(categories.map((c) => [c.id, c.path || c.name]));

  // Get categories that don't have budgets yet
  const availableCategories = categories.filter(
    (cat) => !budgets.find((b) => b.category_id === cat.id)
  );

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.target, 0);
  const totalSpent = budgets.reduce((sum, b) => {
    const spent = spendingByCategory.get(b.category_id) || 0;
    return sum + spent;
  }, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId || !targetAmount) {
      alert('Please select a category and enter a target amount');
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    try {
      await createBudget.mutateAsync({
        month,
        category_id: selectedCategoryId,
        target,
        model: 'monthlyTarget',
        carry: 0,
      });

      // Reset form
      setSelectedCategoryId('');
      setTargetAmount('');
      setShowAddBudget(false);
    } catch (error) {
      logger.error('Failed to create budget', error);
      alert('Failed to create budget');
    }
  };

  const handleUpdateTarget = async (budgetId: string, newTarget: number) => {
    try {
      await updateBudget.mutateAsync({ id: budgetId, target: newTarget });
    } catch (error) {
      logger.error('Failed to update budget', error);
      alert('Failed to update budget');
    }
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
  };

  const getMonthName = (monthStr: string) => {
    const [year, monthNum] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monthly Budgets</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track spending against your budget targets
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
              title="Previous month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
              {getMonthName(month)}
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
              title="Next month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Add Budget Button */}
          {availableCategories.length > 0 && (
            <button
              onClick={() => setShowAddBudget(!showAddBudget)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm"
            >
              {showAddBudget ? 'Cancel' : '+ Add Budget'}
            </button>
          )}
        </div>
      </div>

      {/* Add Budget Form */}
      {showAddBudget && (
        <form onSubmit={handleAddBudget} className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select category...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.path || cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Target
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={createBudget.isPending}
                className="w-full px-4 py-2 bg-success text-white rounded-md hover:bg-success/90 disabled:opacity-50"
              >
                {createBudget.isPending ? 'Adding...' : 'Add Budget'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Budgeted</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-danger">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Budget Overview Chart */}
      {budgets.length > 0 && (
        <BudgetOverviewChart
          budgets={budgets.map(b => ({
            category: categoryMap.get(b.category_id) || 'Unknown',
            budgeted: b.target,
            spent: spendingByCategory.get(b.category_id) || 0,
            remaining: b.target - (spendingByCategory.get(b.category_id) || 0),
          }))}
        />
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No budgets set for this month.</p>
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Budget" to set spending targets for your categories.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {budgets.map((budget) => (
            <BudgetCategoryRow
              key={budget.id}
              budget={budget}
              categoryName={categoryMap.get(budget.category_id) || 'Unknown'}
              spent={spendingByCategory.get(budget.category_id) || 0}
              onUpdateTarget={handleUpdateTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
