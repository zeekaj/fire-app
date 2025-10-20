/**
 * App Component
 * 
 * Main application component with routing
 */

import { useEffect, useState } from 'react';
import { runFirstLoginSetup } from './lib/first-login-setup';
import { useEnhancedNavigation } from './lib/useEnhancedNavigation';
import { logger } from './lib/logger';
import { useAuth } from './app/providers/AuthProvider';
import { Dashboard } from './features/dashboard/components/Dashboard';
import { MonthlyBudgets } from './features/budgets/components/MonthlyBudgets';
import { AccountsList } from './features/accounts';
import { QuickAddTransaction } from './features/transactions/components/QuickAddTransaction';
import { TransactionsList } from './features/transactions/components/TransactionsList';
import { BillsList } from './features/bills';
import { ScenariosPage } from './features/scenarios';
import { Breadcrumb } from './components/Breadcrumb';
import { MobileNavigation } from './components/MobileNavigation';
import { TabNavigation } from './components/TabNavigation';
import { IssuesModal } from './components/IssuesModal';
import { HelpButton, HelpKeyboardShortcut } from './components/HelpButton';
import { useIssuesModal } from './hooks/useIssuesModal';

function App() {
  const { user } = useAuth();
  const navigation = useEnhancedNavigation();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const issuesModal = useIssuesModal();

  useEffect(() => {
    if (user) {
      // Run first-time setup (idempotent - safe to call multiple times)
      runFirstLoginSetup().catch((err) => {
        logger.error('Setup error', err);
      });
    }
  }, [user]);

  // Global keyboard shortcut: N = New transaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsTransactionModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FIRE Finance</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track your path to Financial Independence
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <HelpButton variant="inline" size="sm" />
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <span className="flex items-center gap-2">
                  <span>Add Transaction</span>
                  <kbd className="px-2 py-0.5 text-xs bg-white/20 rounded">N</kbd>
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation
            activeTab={navigation.activeTab}
            onNavigate={(tab) => navigation.navigateToTab(tab, { resetScenario: tab === 'scenarios' })}
            onBack={navigation.canGoBack ? navigation.navigateBack : undefined}
            canGoBack={navigation.canGoBack}
          />

          {/* Desktop Navigation */}
          <TabNavigation
            activeTab={navigation.activeTab}
            onNavigate={(tab) => navigation.navigateToTab(tab, { resetScenario: tab === 'scenarios' })}
            className="mt-6"
          />

          {/* Breadcrumbs */}
          {navigation.breadcrumbs.length > 1 && (
            <div className="mt-4 px-4 lg:px-0">
              <Breadcrumb items={navigation.breadcrumbs} />
            </div>
          )}
        </header>

        <main className="pb-20 lg:pb-0">
          {/* Dashboard Tab */}
          {navigation.activeTab === 'dashboard' && (
            <Dashboard 
              onNavigateToScenarios={(scenarioId) => {
                navigation.navigateToTab('scenarios');
                navigation.setScenario(scenarioId || null);
              }}
              onNavigate={(tab) => navigation.navigateToTab(tab as any)}
            />
          )}

          {/* Scenarios Tab */}
          {navigation.activeTab === 'scenarios' && (
            <ScenariosPage initialSelectedScenarioId={navigation.selectedScenarioId} />
          )}

          {/* Budgets Tab */}
          {navigation.activeTab === 'budgets' && (
            <MonthlyBudgets />
          )}

          {/* Bills Tab */}
          {navigation.activeTab === 'bills' && (
            <BillsList />
          )}

          {/* Accounts Tab */}
          {navigation.activeTab === 'accounts' && (
            <AccountsList />
          )}

          {/* Transactions Tab */}
          {navigation.activeTab === 'transactions' && (
            <TransactionsList />
          )}
        </main>
      </div>

      <QuickAddTransaction
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />

      {/* Issues/Help Modal */}
      <IssuesModal
        isOpen={issuesModal.modalState.isOpen}
        onClose={issuesModal.closeModal}
        initialType={issuesModal.modalState.initialType}
        initialTitle={issuesModal.modalState.initialTitle}
        initialDescription={issuesModal.modalState.initialDescription}
      />

      {/* Floating Help Button */}
      <HelpButton variant="floating" />

      {/* Keyboard Shortcuts */}
      <HelpKeyboardShortcut />
    </div>
  );
}

export default App;
