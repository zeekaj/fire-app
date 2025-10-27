/**
 * CategorySuggestionInput Component
 * 
 * Smart category selection with search, grouping, and popular categories.
 * Supports creating new categories on-the-fly by typing "Parent>Child" format.
 */

import { useState, useRef, useEffect } from 'react';
import { useBudgetableCategories, useCreateCategory, useCategories } from '../hooks/useCategories';
import type { Database } from '@/lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategorySuggestionInputProps {
  value: string;
  onChange: (categoryId: string, category?: Category) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export function CategorySuggestionInput({
  value,
  onChange,
  placeholder = 'Search categories...',
  required = false,
  className = '',
  error,
}: CategorySuggestionInputProps) {
  const { data: categories = [] } = useBudgetableCategories();
  const { data: allCategories = [] } = useCategories(); // For finding parent IDs
  const createCategory = useCreateCategory();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected category name for display
  const selectedCategory = categories.find(c => c.id === value);
  const displayValue = selectedCategory?.path || '';

  // Filter and group categories
  const filteredCategories = categories.filter(cat => 
    cat.path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by parent category
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const parts = cat.path?.split('>') || [];
    const parent = parts.length > 1 ? parts[0] : 'Other';
    
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const groupNames = Object.keys(groupedCategories).sort();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          Math.min(prev + 1, filteredCategories.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCategories[highlightedIndex]) {
          selectCategory(filteredCategories[highlightedIndex]);
        } else if (searchTerm.trim()) {
          // Create new category if no matches and user has typed something
          handleCreateCategory();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const selectCategory = (category: Category) => {
    onChange(category.id, category);
    setSearchTerm('');
    setShowDropdown(false);
    setHighlightedIndex(0);
  };

  const handleCreateCategory = async () => {
    if (!searchTerm.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const input = searchTerm.trim();
      const parts = input.split('>').map(p => p.trim());
      
      let parentId: string | null = null;
      let categoryName: string;
      let categoryPath: string;

      if (parts.length > 1) {
        // Format: "Parent>Child" - find or create parent
        const parentName = parts[0];
        const childName = parts[1];
        
        // Look for existing parent
        const existingParent = allCategories.find(c => 
          c.name.toLowerCase() === parentName.toLowerCase() && c.parent_id === null
        );

        if (existingParent) {
          parentId = existingParent.id;
        } else {
          // Create parent category first
          const newParent = await createCategory.mutateAsync({
            name: parentName,
            path: parentName,
            parent_id: null,
            is_budgetable: false
          });
          parentId = newParent.id;
        }

        categoryName = childName;
        categoryPath = `${parentName}>${childName}`;
      } else {
        // Simple category name without parent
        categoryName = input;
        categoryPath = input;
      }

      // Create the category
      const newCategory = await createCategory.mutateAsync({
        name: categoryName,
        path: categoryPath,
        parent_id: parentId,
        is_budgetable: true
      });

      // Select the newly created category
      onChange(newCategory.id, newCategory);
      setSearchTerm('');
      setShowDropdown(false);
      setHighlightedIndex(0);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={showDropdown ? searchTerm : displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto"
        >
          {groupNames.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No categories found
            </div>
          ) : (
            <div>
              {groupNames.map(groupName => {
                const groupCategories = groupedCategories[groupName];
                return (
                  <div key={groupName}>
                    {/* Group Header */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {groupName}
                      </div>
                    </div>
                    
                    {/* Group Items */}
                    {groupCategories.map((category) => {
                      const globalIndex = filteredCategories.indexOf(category);
                      const isHighlighted = globalIndex === highlightedIndex;
                      const parts = category.path?.split('>') || [];
                      const subcategoryName = parts[parts.length - 1];
                      
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => selectCategory(category)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            isHighlighted
                              ? 'bg-primary text-white'
                              : 'text-gray-900 hover:bg-gray-100'
                          } ${value === category.id ? 'bg-blue-50 font-medium' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{subcategoryName}</span>
                            {category.is_envelope && (
                              <span className={`text-xs ${isHighlighted ? 'text-white' : 'text-gray-500'}`}>
                                💰
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create New Category Option */}
          {searchTerm.trim() && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCreating}
                className="w-full text-left px-4 py-3 text-sm text-primary hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">➕</span>
                <div>
                  <div className="font-medium">
                    {isCreating ? 'Creating...' : `Create "${searchTerm}"`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {searchTerm.includes('>') 
                      ? 'Creates parent and child category' 
                      : 'Tip: Use "Parent>Child" format for subcategories'}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
