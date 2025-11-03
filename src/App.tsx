/**
 * App Component
 * 
 * Main application component with routing
 */

import { useEffect, useMemo, useState } from 'react';
import { runFirstLoginSetup } from './lib/first-login-setup';
import { useEnhancedNavigation } from './lib/useEnhancedNavigation';
import { logger } from './lib/logger';
import './lib/fix-account-type'; // Utility for fixing account types (available in console)
import { useAuth } from './app/providers/AuthProvider';
import { Dashboard } from './features/dashboard/components/Dashboard';
import { FinancialAnalytics } from './features/dashboard/components/FinancialAnalytics';
import { MonthlyBudgets } from './features/budgets/components/MonthlyBudgets';
import { AccountsWorkspace } from './features/accounts';
import { QuickAddTransaction } from './features/transactions/components/QuickAddTransaction';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { TransactionsList } from './features/transactions/components/TransactionsList';
import { BillsList } from './features/bills';
import { ScenariosPage } from './features/scenarios';
import { CategoriesPage } from './features/categories';
import { ProfilePage } from './features/profile/components/ProfilePage';
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
  const { data: allAccounts = [] } = useAccounts();

  // If the user is on the Accounts tab, lock global Quick Add to the selected account
  const accountsTabSelectedId = useMemo(() => {
    if (navigation.activeTab !== 'accounts') return undefined;
    try {
      const saved = localStorage.getItem('lastSelectedAccountId') || undefined;
      if (saved) return saved;
    } catch {}
    return allAccounts[0]?.id;
  }, [navigation.activeTab, allAccounts]);

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
        if (navigation.activeTab === 'accounts') {
          // Open the account-scoped add modal when on Accounts tab
          window.dispatchEvent(new CustomEvent('open-account-add-modal'));
        } else {
          setIsTransactionModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Never allow the global Quick Add modal to be open on the Accounts tab
  useEffect(() => {
    if (navigation.activeTab === 'accounts' && isTransactionModalOpen) {
      setIsTransactionModalOpen(false);
    }
  }, [navigation.activeTab, isTransactionModalOpen]);

  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       // Simulate data loading
  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //     } catch (error) {
  //       logger.error('Data loading error', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadData();
  // }, []);

  // if (isLoading) {
  //   return <div className="p-4">Loading...</div>;
  // }

  const renderContent = () => {
    switch (navigation.activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={navigation.navigateToTab} />;
      case 'analytics':
        return <FinancialAnalytics />;
      case 'accounts':
        return <AccountsWorkspace />;
      case 'transactions':
        return <TransactionsList />;
      case 'bills':
        return <BillsList />;
      case 'budgets':
        return <MonthlyBudgets />;
      case 'scenarios':
        return <ScenariosPage initialSelectedScenarioId={navigation.selectedScenarioId} />;
      case 'categories':
        return <CategoriesPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard onNavigate={navigation.navigateToTab} />;
    }
  };

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
                onClick={() => {
                  if (navigation.activeTab === 'accounts') {
                    window.dispatchEvent(new CustomEvent('open-account-add-modal'));
                  } else {
                    setIsTransactionModalOpen(true);
                  }
                }}
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
          {renderContent()}
        </main>
      </div>

      {navigation.activeTab !== 'accounts' && (
        <QuickAddTransaction
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          defaultAccountId={accountsTabSelectedId}
          lockAccountSelection={!!accountsTabSelectedId}
        />
      )}

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
