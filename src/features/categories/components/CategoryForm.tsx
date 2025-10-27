/**
 * CategoryForm Component
 * 
 * Form for creating/editing categories
 */

import { useState, useEffect } from 'react';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryFormProps {
  mode: 'create' | 'edit';
  category?: Category;
  parentCategories: Category[];
  onSubmit: (data: { name: string; parentId: string | null; isBudgetable: boolean }) => void;
  onCancel: () => void;
}

export function CategoryForm({ mode, category, parentCategories, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [parentId, setParentId] = useState<string>(category?.parent_id || '');
  const [isBudgetable, setIsBudgetable] = useState(category?.is_budgetable ?? true);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parent_id || '');
      setIsBudgetable(category.is_budgetable ?? true);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      parentId: parentId || null,
      isBudgetable
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Electric, Groceries"
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">None (Top-level category)</option>
              {parentCategories.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Optional: Select a parent to create a subcategory
            </p>
          </div>

          {/* Budgetable Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="isBudgetable"
              checked={isBudgetable}
              onChange={(e) => setIsBudgetable(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isBudgetable" className="ml-2">
              <div className="text-sm font-medium text-gray-700">
                Budgetable Category
              </div>
              <div className="text-xs text-gray-500">
                Can be used for transactions and budgets
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
            >
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
