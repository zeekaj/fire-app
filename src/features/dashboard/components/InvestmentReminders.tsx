/**
 * InvestmentReminders Component
 * 
 * Displays investment-related reminders and alerts including portfolio
 * rebalancing, contribution reminders, and performance monitoring.
 */

import { useState } from 'react';
import { useInvestmentReminders } from '../hooks/useInvestmentReminders';
import { useDismissReminder } from '../hooks/useDismissReminder';

interface InvestmentRemindersProps {
  onNavigate?: (tab: string) => void;
}

export function InvestmentReminders({ onNavigate }: InvestmentRemindersProps = {}) {
  const { reminders, hasHighPriorityReminders, totalReminders } = useInvestmentReminders();
  const dismissReminder = useDismissReminder();
  const [isExpanded, setIsExpanded] = useState(hasHighPriorityReminders);

  const handleDismiss = async (reminderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await dismissReminder.mutateAsync(reminderId);
    } catch (error) {
      console.error('Failed to dismiss reminder:', error);
    }
  };

  const handleAction = (reminderId: string) => {
    // Navigate to appropriate page based on reminder type
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder || !onNavigate) return;

    switch (reminder.type) {
      case 'rebalancing':
      case 'allocation':
        onNavigate('accounts');
        break;
      case 'contribution':
        onNavigate('accounts');
        break;
      case 'performance':
        onNavigate('scenarios');
        break;
      default:
        onNavigate('accounts');
    }
  };

  if (totalReminders === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-green-500 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Investment Portfolio On Track
            </h3>
            <p className="text-sm text-green-700 mt-1">
              No immediate investment actions needed. Your portfolio is well-balanced and aligned with your strategy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`mr-3 ${hasHighPriorityReminders ? 'text-red-500' : 'text-yellow-500'}`}>
              {hasHighPriorityReminders ? '⚠️' : '💡'}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Investment Reminders
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  hasHighPriorityReminders 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {totalReminders}
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                {hasHighPriorityReminders 
                  ? 'Urgent portfolio actions needed'
                  : 'Portfolio optimization opportunities'
                }
              </p>
            </div>
          </div>
          <div className="text-gray-400">
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="divide-y divide-gray-100">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-lg">{reminder.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {reminder.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          reminder.priority === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : reminder.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {reminder.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {reminder.description}
                      </p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-3 mt-3">
                        {reminder.actionText && (
                          <button
                            onClick={() => handleAction(reminder.id)}
                            className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                              reminder.color === 'red' 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : reminder.color === 'yellow'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : reminder.color === 'blue'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {reminder.actionText}
                          </button>
                        )}
                        
                        {reminder.dismissible && (
                          <button
                            onClick={(e) => handleDismiss(reminder.id, e)}
                            disabled={dismissReminder.isPending}
                            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {dismissReminder.isPending ? 'Dismissing...' : 'Dismiss for 7 days'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for dashboard tiles
 */
export function InvestmentRemindersTile({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { reminders, hasHighPriorityReminders, totalReminders } = useInvestmentReminders();

  if (totalReminders === 0) {
    return (
      <div 
        className="p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
        onClick={() => onNavigate?.('accounts')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-500 mr-3">✅</div>
            <div>
              <p className="text-sm font-medium text-green-800">Portfolio Balanced</p>
              <p className="text-xs text-green-600">No actions needed</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priorityReminder = reminders.find(r => r.priority === 'high') || reminders[0];

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        hasHighPriorityReminders
          ? 'bg-red-50 border-red-200 hover:bg-red-100'
          : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
      }`}
      onClick={() => onNavigate?.('accounts')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-lg mr-3">{priorityReminder?.icon || '💡'}</div>
          <div>
            <p className={`text-sm font-medium ${
              hasHighPriorityReminders ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {totalReminders} Investment {totalReminders === 1 ? 'Reminder' : 'Reminders'}
            </p>
            <p className={`text-xs ${
              hasHighPriorityReminders ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {priorityReminder?.title || 'Portfolio optimization available'}
            </p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
          hasHighPriorityReminders
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {totalReminders}
        </div>
      </div>
    </div>
  );
}