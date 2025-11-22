/**
 * CategoriesPage Component
 * 
 * Manage categories: view, create, edit, delete, and organize hierarchy
 */

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, useCascadeDeleteCategory, useUpdateCategory } from '@/features/transactions/hooks/useCategories';
import { useToast } from '@/app/providers/ToastProvider';
import { CategoryList } from './CategoryList';
import { CategoryForm } from './CategoryForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const cascadeDelete = useCascadeDeleteCategory();
  const updateCategory = useUpdateCategory();
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    category: Category;
    hasChildren: boolean;
  } | null>(null);

  // Organize categories into tree structure
  const parentCategories = categories.filter(c => c.parent_id === null);
  const childCategories = new Map<string, Category[]>();
  
  categories.forEach(cat => {
    if (cat.parent_id) {
      const existing = childCategories.get(cat.parent_id) || [];
      existing.push(cat);
      childCategories.set(cat.parent_id, existing);
    }
  });

  const handleCreateCategory = async (data: {
    name: string;
    parentId: string | null;
    isBudgetable: boolean;
  }) => {
    try {
      const path = data.parentId
        ? `${categories.find(c => c.id === data.parentId)?.name}>${data.name}`
        : data.name;

      await createCategory.mutateAsync({
        name: data.name,
        path,
        parent_id: data.parentId,
        is_budgetable: data.isBudgetable
      });
      toast.push('Category created', 'success');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.push('Failed to create category', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your transaction categories and subcategories
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span className="text-lg">➕</span>
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Categories</div>
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Parent Categories</div>
          <div className="text-2xl font-bold text-gray-900">{parentCategories.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Budgetable</div>
          <div className="text-2xl font-bold text-gray-900">
            {categories.filter(c => c.is_budgetable).length}
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <CategoryList
          parentCategories={parentCategories}
          childCategories={childCategories}
          onEdit={setEditingCategory}
          onDelete={(category) => {
            // Show confirm dialog
            const hasChildren = (childCategories.get(category.id)?.length || 0) > 0;
            setConfirmDelete({ category, hasChildren });
          }}
          deletingId={
            (deleteCategory.isPending && (deleteCategory.variables as string)) ||
            (cascadeDelete.isPending && (cascadeDelete.variables as string)) ||
            null
          }
        />
      </div>

      {/* Add Category Modal */}
      {showAddForm && (
        <CategoryForm
          mode="create"
          parentCategories={parentCategories}
          onSubmit={handleCreateCategory}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryForm
          mode="edit"
          category={editingCategory}
          parentCategories={parentCategories}
          onSubmit={async (data: { name: string; parentId: string | null; isBudgetable: boolean }) => {
            try {
              await updateCategory.mutateAsync({
                id: editingCategory.id,
                name: data.name,
                parentId: data.parentId,
                isBudgetable: data.isBudgetable,
              });
              toast.push('Category updated', 'success');
              setEditingCategory(null);
            } catch (err: any) {
              toast.push(err.message || 'Failed to update category', 'error');
            }
          }}
          onCancel={() => setEditingCategory(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Category"
        message={
          confirmDelete?.hasChildren
            ? `Delete "${confirmDelete.category.name}" AND all its subcategories? Budgets & bills linked will be removed.`
            : `Delete "${confirmDelete?.category.name}"? Related transactions will become Uncategorized.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (!confirmDelete) return;
          
          if (confirmDelete.hasChildren) {
            cascadeDelete.mutate(confirmDelete.category.id, {
              onSuccess: () => toast.push('Category + descendants deleted', 'success'),
              onError: (err: any) => toast.push(err.message || 'Failed cascade delete', 'error')
            });
          } else {
            deleteCategory.mutate(confirmDelete.category.id, {
              onSuccess: () => toast.push('Category deleted', 'success'),
              onError: (err: any) => toast.push(err.message || 'Failed to delete category', 'error')
            });
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
