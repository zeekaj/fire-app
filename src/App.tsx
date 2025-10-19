/**
 * App Component
 * 
 * Main application component with routing
 */

import { useEffect, useState } from 'react';
import { runFirstLoginSetup } from './lib/first-login-setup';
import { logger } from './lib/logger';
import { useAuth } from './app/providers/AuthProvider';
import { Dashboard } from './features/dashboard/components/Dashboard';
import { MonthlyBudgets } from './features/budgets/components/MonthlyBudgets';
import { AccountsList } from './features/accounts';
import { QuickAddTransaction } from './features/transactions/components/QuickAddTransaction';
import { TransactionsList } from './features/transactions/components/TransactionsList';
import { BillsList } from './features/bills';
import { ScenariosPage } from './features/scenarios';

function App() {
  const { user } = useAuth();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenarios' | 'budgets' | 'accounts' | 'bills' | 'transactions'>('dashboard');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

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

          {/* Navigation Tabs */}
          <nav className="mt-6 border-b border-gray-200">
            <div className="-mb-px flex gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab('scenarios');
                  setSelectedScenarioId(null); // Reset to list view
                }}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'scenarios'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scenarios
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'budgets'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Budgets
              </button>
              <button
                onClick={() => setActiveTab('bills')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bills'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bills
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'accounts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Accounts
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transactions
              </button>
            </div>
          </nav>
        </header>

        <main>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard onNavigateToScenarios={(scenarioId) => {
              setActiveTab('scenarios');
              setSelectedScenarioId(scenarioId || null);
            }} />
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <ScenariosPage initialSelectedScenarioId={selectedScenarioId} />
          )}

          {/* Budgets Tab */}
          {activeTab === 'budgets' && (
            <MonthlyBudgets />
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <BillsList />
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <AccountsList />
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <TransactionsList />
          )}
        </main>
      </div>

      <QuickAddTransaction
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  );
}

export default App;
