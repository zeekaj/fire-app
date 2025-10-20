/**
 * IssuesModal Component
 * 
 * Comprehensive help and feedback system with multiple issue types,
 * smart error reporting, and user support features.
 */

import { useState, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';

export type IssueType = 'bug' | 'feature' | 'help' | 'feedback' | 'data';

interface IssueFormData {
  type: IssueType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  userEmail: string;
  browserInfo: string;
  currentPage: string;
  userAgent: string;
  timestamp: string;
}

interface IssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: IssueType;
  initialTitle?: string;
  initialDescription?: string;
}

const issueTypeConfig: Record<IssueType, {
  label: string;
  icon: string;
  description: string;
  color: string;
  categories: string[];
}> = {
  bug: {
    label: 'Bug Report',
    icon: '🐛',
    description: 'Something is broken or not working as expected',
    color: 'red',
    categories: ['UI/Display Issue', 'Calculation Error', 'Navigation Problem', 'Data Not Saving', 'Performance Issue', 'Other'],
  },
  feature: {
    label: 'Feature Request',
    icon: '💡',
    description: 'Suggest a new feature or improvement',
    color: 'blue',
    categories: ['New Chart/Visualization', 'Better Mobile Experience', 'Export/Import', 'Automation', 'Integration', 'Other'],
  },
  help: {
    label: 'Need Help',
    icon: '❓',
    description: 'Get help with using the app',
    color: 'green',
    categories: ['How to Use Feature', 'Understanding Results', 'FIRE Strategy Questions', 'Account Setup', 'Troubleshooting', 'Other'],
  },
  feedback: {
    label: 'General Feedback',
    icon: '💬',
    description: 'Share your thoughts and suggestions',
    color: 'purple',
    categories: ['User Experience', 'Design Feedback', 'Feature Usefulness', 'Performance', 'Overall Satisfaction', 'Other'],
  },
  data: {
    label: 'Data Issue',
    icon: '📊',
    description: 'Problem with your financial data or calculations',
    color: 'orange',
    categories: ['Incorrect Calculations', 'Missing Data', 'Sync Issues', 'Import Problems', 'Data Export', 'Other'],
  },
};

export function IssuesModal({ 
  isOpen, 
  onClose, 
  initialType = 'help',
  initialTitle = '',
  initialDescription = ''
}: IssuesModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<IssueFormData>({
    type: initialType,
    title: initialTitle,
    description: initialDescription,
    priority: 'medium',
    category: issueTypeConfig[initialType].categories[0],
    userEmail: user?.email || '',
    browserInfo: getBrowserInfo(),
    currentPage: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTypeChange = (type: IssueType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: issueTypeConfig[type].categories[0],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would submit to a backend service
      // For now, we'll simulate the submission and provide helpful info
      await simulateSubmission(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit issue:', error);
      alert('Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setFormData({
      type: 'help',
      title: '',
      description: '',
      priority: 'medium',
      category: issueTypeConfig.help.categories[0],
      userEmail: user?.email || '',
      browserInfo: getBrowserInfo(),
      currentPage: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {isSubmitted ? (
            // Success State
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Thank You for Your {issueTypeConfig[formData.type].label}!
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {formData.type === 'bug' && "We'll investigate this issue and work on a fix. You can continue using the app."}
                  {formData.type === 'feature' && "Your suggestion has been noted and we'll consider it for future updates."}
                  {formData.type === 'help' && "Here are some quick resources while we prepare a detailed response:"}
                  {formData.type === 'feedback' && "Your feedback helps us improve the app. Thank you for taking the time to share!"}
                  {formData.type === 'data' && "We'll review this data issue. In the meantime, you can check your inputs in the relevant section."}
                </p>

                {/* Quick Help Resources for Help Requests */}
                {formData.type === 'help' && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-medium text-blue-900 mb-3">Quick Resources:</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• <strong>FIRE Basics:</strong> Start with Dashboard → Add a Scenario</li>
                      <li>• <strong>Calculations:</strong> All projections use Monte Carlo simulation</li>
                      <li>• <strong>Data Entry:</strong> Press 'N' for quick transaction entry</li>
                      <li>• <strong>Strategy:</strong> Try different scenarios to compare approaches</li>
                    </ul>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Form State
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Help & Feedback</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Issue Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What can we help you with?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(issueTypeConfig).map(([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type as IssueType)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.type === type
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{config.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{config.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    {issueTypeConfig[formData.type].categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Low - Minor issue or suggestion</option>
                    <option value="medium">Medium - Affects my workflow</option>
                    <option value="high">High - Blocks me from using the app</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={
                      formData.type === 'bug' ? 'Brief description of the problem' :
                      formData.type === 'feature' ? 'Feature you\'d like to see' :
                      formData.type === 'help' ? 'What do you need help with?' :
                      formData.type === 'feedback' ? 'Your feedback topic' :
                      'Data issue description'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={getDescriptionPlaceholder(formData.type)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide as much detail as possible to help us assist you better.
                  </p>
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll only use this to follow up on your {issueTypeConfig[formData.type].label.toLowerCase()}.
                  </p>
                </div>

                {/* System Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <details className="cursor-pointer">
                    <summary className="text-sm font-medium text-gray-700 mb-2">
                      System Information (automatically included)
                    </summary>
                    <div className="text-xs text-gray-600 space-y-1 mt-2">
                      <div><strong>Page:</strong> {formData.currentPage}</div>
                      <div><strong>Browser:</strong> {formData.browserInfo}</div>
                      <div><strong>Timestamp:</strong> {new Date(formData.timestamp).toLocaleString()}</div>
                    </div>
                  </details>
                </div>

                {/* Submit */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${issueTypeConfig[formData.type].label}`}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getDescriptionPlaceholder(type: IssueType): string {
  switch (type) {
    case 'bug':
      return 'Please describe:\n• What you were trying to do\n• What happened instead\n• Steps to reproduce the issue';
    case 'feature':
      return 'Please describe:\n• What feature you\'d like to see\n• How it would help you\n• Any specific requirements';
    case 'help':
      return 'Please describe:\n• What you\'re trying to accomplish\n• Where you\'re getting stuck\n• What you\'ve already tried';
    case 'feedback':
      return 'Please share:\n• What you like or dislike\n• Suggestions for improvement\n• Your overall experience';
    case 'data':
      return 'Please describe:\n• What data seems incorrect\n• Expected vs actual results\n• Which section/calculation is affected';
    default:
      return 'Please provide as much detail as possible...';
  }
}

async function simulateSubmission(formData: IssueFormData): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real app, this would submit to a backend service like:
  // - GitHub Issues API
  // - Customer support system (Intercom, Zendesk)
  // - Custom backend endpoint
  // - Email service
  
  console.log('Issue submitted:', formData);
}