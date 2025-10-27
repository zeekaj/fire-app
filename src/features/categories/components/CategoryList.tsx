/**
 * CategoryList Component
 * 
 * Displays categories in a hierarchical tree view
 */

import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryListProps {
  parentCategories: Category[];
  childCategories: Map<string, Category[]>;
  onEdit: (category: Category) => void;
}

export function CategoryList({ parentCategories, childCategories, onEdit }: CategoryListProps) {
  if (parentCategories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-3">📂</div>
        <p>No categories yet</p>
        <p className="text-sm mt-1">Click "Add Category" to create your first one</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {parentCategories.map(parent => {
        const children = childCategories.get(parent.id) || [];
        
        return (
          <div key={parent.id} className="p-4">
            {/* Parent Category */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-lg">📁</div>
                <div>
                  <div className="font-semibold text-gray-900">{parent.name}</div>
                  <div className="text-xs text-gray-500">
                    {children.length} {children.length === 1 ? 'subcategory' : 'subcategories'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!parent.is_budgetable && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    Group Only
                  </span>
                )}
                <button
                  onClick={() => onEdit(parent)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Child Categories */}
            {children.length > 0 && (
              <div className="ml-8 mt-2 space-y-2">
                {children.map(child => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm">📄</div>
                      <span className="text-sm text-gray-700">{child.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {child.is_budgetable && (
                        <span className="text-xs text-green-600">✓ Budgetable</span>
                      )}
                      {child.is_envelope && (
                        <span className="text-xs">💰</span>
                      )}
                      <button
                        onClick={() => onEdit(child)}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
