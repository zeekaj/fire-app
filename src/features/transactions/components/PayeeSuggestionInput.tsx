/**
 * PayeeSuggestionInput Component
 * 
 * Enhanced payee input with smart suggestions, autocomplete, and quick access to top payees.
 * Features:
 * - Smart suggestions based on usage frequency and recency
 * - Fuzzy search matching
 * - Quick access buttons for top payees
 * - Visual indicators for usage statistics
 * - Auto-fill category when payee is selected
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSmartPayeeSuggestions, useTopPayees } from '../hooks/useSmartPayeeSuggestions';

interface PayeeSuggestionInputProps {
  value: string;
  onChange: (value: string, suggestion?: {
    id: string;
    name: string;
    default_category_id: string | null;
    default_account_id: string | null;
  }) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PayeeSuggestionInput({
  value,
  onChange,
  placeholder = "Enter or select payee...",
  required = false,
  autoFocus = false,
  disabled = false,
  className = "",
}: PayeeSuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions } = useSmartPayeeSuggestions(searchTerm, 8);
  const { topPayees } = useTopPayees(5);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync searchTerm with value prop
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchTerm(suggestion.name);
    onChange(suggestion.name, suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      setHighlightedIndex(-1);
    }

    if (e.key === 'ArrowDown' || e.key === 'Down') {
      if (!isOpen) setIsOpen(true);
      e.preventDefault();
      const next = Math.min(highlightedIndex + 1, displaySuggestions.length - 1);
      setHighlightedIndex(next < 0 ? 0 : next);
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'Up') {
      if (!isOpen) setIsOpen(true);
      e.preventDefault();
      const prev = Math.max(highlightedIndex - 1, 0);
      setHighlightedIndex(prev);
      return;
    }

    if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < displaySuggestions.length) {
        e.preventDefault();
        handleSuggestionSelect(displaySuggestions[highlightedIndex]);
        return;
      }
      if (displaySuggestions.length === 1) {
        e.preventDefault();
        handleSuggestionSelect(displaySuggestions[0]);
      }
    }
  };

  const displaySuggestions = useMemo(() => (searchTerm ? suggestions : topPayees), [searchTerm, suggestions, topPayees]);
  const activeDescendantId = highlightedIndex >= 0 && highlightedIndex < displaySuggestions.length
    ? `payee-option-${displaySuggestions[highlightedIndex].id}`
    : undefined;
  const showQuickAccess = !searchTerm && topPayees.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Main Input */}
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="payee-suggestions-list"
        aria-activedescendant={activeDescendantId}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
      />

      {/* Quick Access Buttons (shown when no search term) */}
      {showQuickAccess && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Access</div>
            <div className="flex flex-wrap gap-1">
              {topPayees.slice(0, 3).map((payee) => (
                <button
                  key={payee.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(payee)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <span>{payee.name}</span>
                  {payee.usage_count > 0 && (
                    <span className="ml-1 text-gray-500">({payee.usage_count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* All Top Payees */}
          <div className="max-h-48 overflow-y-auto">
            {topPayees.map((payee) => (
              <button
                key={payee.id}
                type="button"
                onClick={() => handleSuggestionSelect(payee)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-gray-900">{payee.name}</div>
                  {payee.last_used && (
                    <div className="text-xs text-gray-500">
                      Last used: {new Date(payee.last_used).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  {payee.usage_count > 0 && (
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {payee.usage_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {isOpen && displaySuggestions.length > 0 && (
        <div id="payee-suggestions-list" role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {displaySuggestions.map((suggestion, idx) => {
            const isActive = idx === highlightedIndex;
            return (
              <button
                id={`payee-option-${suggestion.id}`}
                role="option"
                aria-selected={isActive}
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {highlightMatch(suggestion.name, searchTerm)}
                  </div>
                  {suggestion.last_used && (
                    <div className="text-xs text-gray-500">
                      Used {suggestion.usage_count} times • Last: {new Date(suggestion.last_used).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {suggestion.usage_count > 0 && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {suggestion.usage_count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* New Payee Indicator */}
      {searchTerm && !suggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          ✨ New payee "{searchTerm}" will be created
        </div>
      )}

      {/* No Results */}
      {searchTerm && isOpen && displaySuggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
          No matching payees found
        </div>
      )}
    </div>
  );
}

/**
 * Highlight matching parts of the payee name
 */
function highlightMatch(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;

  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase();
  const index = normalizedText.indexOf(normalizedSearch);

  if (index === -1) return text;

  return (
    <>
      {text.substring(0, index)}
      <mark className="bg-yellow-200 px-0.5 rounded">
        {text.substring(index, index + searchTerm.length)}
      </mark>
      {text.substring(index + searchTerm.length)}
    </>
  );
}