/**
 * Breadcrumb Component
 * 
 * Displays hierarchical navigation breadcrumbs with mobile-optimized design.
 * Shows current location and provides quick navigation to parent levels.
 */

import { BreadcrumbItem } from '@/lib/useEnhancedNavigation';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length <= 1) {
    return null; // Don't show breadcrumbs for single-level navigation
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            
            {item.onClick && !item.isActive ? (
              <button
                onClick={item.onClick}
                className="text-gray-500 hover:text-gray-700 transition-colors font-medium truncate max-w-[120px] sm:max-w-none"
                title={item.label}
              >
                {item.label}
              </button>
            ) : (
              <span
                className={`truncate max-w-[120px] sm:max-w-none ${
                  item.isActive
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}