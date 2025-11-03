/**
 * ContextualHelp Component & System
 * 
 * Provides contextual help content and guidance for different
 * sections of the app, with smart tooltips and assistance.
 */

import { useState, useRef } from 'react';
import { useIssuesModal } from '@/hooks/useIssuesModal';

interface ContextualHelpProps {
  topic: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  relatedTopics?: string[];
  commonIssues?: Array<{
    issue: string;
    solution: string;
  }>;
}

// Help content database
const helpContent: Record<string, HelpContent> = {
  'net-worth': {
    title: 'Net Worth History & Snapshots',
    description: 'See how your net worth changes over time. Snapshots capture today’s assets and liabilities; Backfill generates historical points from your transaction history.',
    tips: [
      'Use Snapshot to save today’s net worth after updating account balances',
      'Backfill monthly to populate the chart from past transactions',
      'Switch between Net Worth and Assets/Liabilities breakdown',
    ],
    relatedTopics: ['accounts', 'transactions', 'dashboard'],
    commonIssues: [
      {
        issue: 'No data shown',
        solution: 'Take your first snapshot or use Backfill to generate history from transactions',
      },
      {
        issue: 'Totals look off',
        solution: 'Confirm account opening balances and recent transactions are accurate',
      },
    ],
  },
  'dashboard': {
    title: 'Dashboard Overview',
    description: 'Your financial independence dashboard shows key metrics and progress toward your FIRE goals.',
    tips: [
      'Green indicators show you\'re on track',
      'Use scenarios to compare different strategies',
      'Charts update automatically as you add data'
    ],
    relatedTopics: ['scenarios', 'accounts', 'fire-basics'],
    commonIssues: [
      {
        issue: 'Charts not updating',
        solution: 'Make sure you have recent transactions and account balances'
      }
    ]
  },
  'scenarios': {
    title: 'FIRE Scenarios',
    description: 'Scenarios let you model different retirement strategies and see which approach works best for your goals.',
    tips: [
      'Start with the "Conservative" scenario template',
      'Adjust withdrawal rates based on your risk tolerance',
      'Compare multiple scenarios to find your optimal path'
    ],
    relatedTopics: ['withdrawal-strategies', 'monte-carlo', 'fire-basics'],
    commonIssues: [
      {
        issue: 'Unrealistic projections',
        solution: 'Check your assumptions: growth rates, inflation, and withdrawal rates'
      }
    ]
  },
  'accounts': {
    title: 'Account Management',
    description: 'Track all your financial accounts in one place to get a complete picture of your net worth.',
    tips: [
      'Include all account types: checking, savings, investment, retirement',
      'Update balances regularly for accurate projections',
      'Use account groups to organize similar accounts'
    ],
    relatedTopics: ['transactions', 'net-worth', 'budgets'],
    commonIssues: [
      {
        issue: 'Missing account types',
        solution: 'Use "Other" category for specialty accounts, then contact support'
      }
    ]
  },
  'transactions': {
    title: 'Transaction Tracking',
    description: 'Record your income and expenses to track spending patterns and cash flow.',
    tips: [
      'Use the quick-add feature (press "N") for fast entry',
      'Categorize transactions for better insights',
      'Regular entry gives better projections'
    ],
    relatedTopics: ['budgets', 'accounts', 'categories'],
    commonIssues: [
      {
        issue: 'Duplicate transactions',
        solution: 'Check the date and amount before adding similar transactions'
      }
    ]
  },
  'budgets': {
    title: 'Budget Planning',
    description: 'Set spending targets and track your progress to stay on your FIRE path.',
    tips: [
      'Start with actual spending, then optimize',
      'Include both fixed and variable expenses',
      'Review and adjust monthly'
    ],
    relatedTopics: ['transactions', 'categories', 'fire-basics'],
    commonIssues: [
      {
        issue: 'Budget vs actual mismatch',
        solution: 'Review your transaction categories and ensure consistent tracking'
      }
    ]
  },
  'fire-basics': {
    title: 'FIRE Basics',
    description: 'Financial Independence, Retire Early (FIRE) is about saving and investing to achieve financial freedom.',
    tips: [
      'FIRE typically requires saving 25x your annual expenses',
      'The 4% withdrawal rule is a common starting point',
      'Higher savings rates dramatically reduce time to FIRE'
    ],
    relatedTopics: ['scenarios', 'withdrawal-strategies', 'investment-allocation'],
    commonIssues: [
      {
        issue: 'FIRE seems impossible',
        solution: 'Start small, increase savings gradually, and use scenarios to find your path'
      }
    ]
  },
  'withdrawal-strategies': {
    title: 'Withdrawal Strategies',
    description: 'Different approaches to withdrawing money in retirement, each with trade-offs.',
    tips: [
      '4% rule: Withdraw 4% of initial portfolio annually',
      'Dynamic withdrawal: Adjust based on market performance',
      'Bond tent: Reduce risk as you approach retirement'
    ],
    relatedTopics: ['scenarios', 'fire-basics', 'investment-allocation']
  },
  'monte-carlo': {
    title: 'Monte Carlo Simulation',
    description: 'A method that runs thousands of scenarios to estimate the probability of your plan succeeding.',
    tips: [
      'Higher success rates (80%+) indicate more robust plans',
      'Accounts for market volatility and sequence of returns risk',
      'Use multiple scenarios to stress-test your approach'
    ],
    relatedTopics: ['scenarios', 'withdrawal-strategies', 'investment-allocation']
  }
};

export function ContextualHelp({ 
  topic, 
  children, 
  position = 'bottom',
  size = 'md'
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullHelp, setShowFullHelp] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { getHelp } = useIssuesModal();

  const content = helpContent[topic];
  if (!content) return <>{children}</>;

  const handleGetMoreHelp = () => {
    getHelp(`Help with ${content.title}`, `I need help with: ${topic}\n\nSpecific question: `);
    setShowFullHelp(false);
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setShowFullHelp(true)}
        className="cursor-help"
      >
        {children}
      </div>

      {/* Quick Tooltip */}
      {isVisible && !showFullHelp && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} ${sizeClasses[size]} bg-gray-900 text-white text-sm rounded-lg px-3 py-2 pointer-events-none animate-in fade-in-0 duration-200`}
        >
          <div className="font-medium mb-1">{content.title}</div>
          <div className="text-gray-200">{content.description}</div>
          <div className="text-xs text-gray-300 mt-2">Click for detailed help</div>
        </div>
      )}

      {/* Detailed Help Modal */}
      {showFullHelp && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowFullHelp(false)}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
                <button
                  onClick={() => setShowFullHelp(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <p className="text-gray-700">{content.description}</p>
                </div>

                {/* Tips */}
                {content.tips && content.tips.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">💡 Tips & Best Practices</h3>
                    <ul className="space-y-2">
                      {content.tips.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Common Issues */}
                {content.commonIssues && content.commonIssues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🔧 Common Issues & Solutions</h3>
                    <div className="space-y-3">
                      {content.commonIssues.map((item, index) => (
                        <div key={index} className="bg-yellow-50 rounded-lg p-3">
                          <div className="font-medium text-yellow-800 mb-1">Issue: {item.issue}</div>
                          <div className="text-yellow-700">{item.solution}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Topics */}
                {content.relatedTopics && content.relatedTopics.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🔗 Related Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {content.relatedTopics.map((relatedTopic) => {
                        const relatedContent = helpContent[relatedTopic];
                        if (!relatedContent) return null;
                        
                        return (
                          <button
                            key={relatedTopic}
                            onClick={() => {
                              // Switch to related topic
                              setShowFullHelp(false);
                              setTimeout(() => {
                                // Open help for related topic
                                getHelp(`Help with ${relatedContent.title}`, `I need help with: ${relatedTopic}`);
                              }, 100);
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                          >
                            {relatedContent.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowFullHelp(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleGetMoreHelp}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Get More Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for section headers with contextual help
export function HelpSectionHeader({ 
  title, 
  topic, 
  children 
}: { 
  title: string; 
  topic: string; 
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <ContextualHelp topic={topic}>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>{title}</span>
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </h2>
      </ContextualHelp>
      {children}
    </div>
  );
}