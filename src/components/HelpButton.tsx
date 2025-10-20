/**
 * HelpButton Component
 * 
 * Contextual help button that can be placed anywhere in the app
 * to provide quick access to help and feedback options.
 */

import { useState, useRef, useEffect } from 'react';
import { useIssuesModal } from '@/hooks/useIssuesModal';
import type { IssueType } from '@/components/IssuesModal';

interface HelpButtonProps {
  variant?: 'floating' | 'inline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  context?: string; // For contextual help
  className?: string;
}

interface QuickAction {
  type: IssueType;
  label: string;
  icon: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    type: 'help',
    label: 'Get Help',
    icon: '❓',
    description: 'How to use features'
  },
  {
    type: 'bug',
    label: 'Report Bug',
    icon: '🐛',
    description: 'Something not working'
  },
  {
    type: 'feature',
    label: 'Request Feature',
    icon: '💡',
    description: 'Suggest improvements'
  },
  {
    type: 'feedback',
    label: 'Give Feedback',
    icon: '💬',
    description: 'Share your thoughts'
  },
];

export function HelpButton({ 
  variant = 'inline', 
  size = 'md',
  context,
  className = ''
}: HelpButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { openModal } = useIssuesModal();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    const contextualTitle = context ? `${context}: ` : '';
    openModal(action.type, contextualTitle);
    setIsDropdownOpen(false);
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-6 right-6 z-40 ${className}`} ref={dropdownRef}>
        {/* Floating Help Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          title="Help & Feedback"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Floating Dropdown */}
        {isDropdownOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 animate-in slide-in-from-bottom-2">
            {quickActions.map((action) => (
              <button
                key={action.type}
                onClick={() => handleQuickAction(action)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <span className="text-lg">{action.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{action.label}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Help & Feedback"
        >
          <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50">
            {quickActions.map((action) => (
              <button
                key={action.type}
                onClick={() => handleQuickAction(action)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <span>{action.icon}</span>
                <span className="text-sm text-gray-900">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`${buttonSizeClasses[size]} border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center space-x-2`}
      >
        <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Help</span>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56 z-50">
          {quickActions.map((action) => (
            <button
              key={action.type}
              onClick={() => handleQuickAction(action)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <span className="text-lg">{action.icon}</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Keyboard shortcut component for help access
export function HelpKeyboardShortcut() {
  const { getHelp } = useIssuesModal();

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Shift + ? (question mark) opens help
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        getHelp();
      }
    }

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [getHelp]);

  return null; // This component only handles keyboard events
}