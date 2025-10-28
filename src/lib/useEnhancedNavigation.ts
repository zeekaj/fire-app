/**
 * Enhanced Navigation Hook
 * 
 * Manages navigation state, breadcrumbs, and mobile-friendly navigation.
 * Tracks navigation history and provides contextual breadcrumb information.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';

export type AppTab = 'dashboard' | 'analytics' | 'scenarios' | 'budgets' | 'bills' | 'accounts' | 'transactions' | 'categories' | 'profile';

export interface NavigationState {
  activeTab: AppTab;
  selectedScenarioId: string | null;
  navigationHistory: AppTab[];
}

export interface BreadcrumbItem {
  label: string;
  tab?: AppTab;
  onClick?: () => void;
  isActive?: boolean;
}

const STORAGE_KEY = 'fire-app-active-tab';

/**
 * Enhanced navigation hook with breadcrumbs and history
 */
export function useEnhancedNavigation() {
  // Restore active tab from localStorage, fallback to dashboard
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved as AppTab) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<AppTab[]>([activeTab]);

  // Persist active tab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTab);
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing)
    }
  }, [activeTab]);

  const navigateToTab = useCallback((tab: AppTab, options?: { 
    resetScenario?: boolean;
    addToHistory?: boolean;
  }) => {
    const { resetScenario = false, addToHistory = true } = options || {};
    
    setActiveTab(tab);
    
    if (resetScenario) {
      setSelectedScenarioId(null);
    }
    
    if (addToHistory && navigationHistory[navigationHistory.length - 1] !== tab) {
      setNavigationHistory(prev => [...prev.slice(-4), tab]); // Keep last 5 items
    }
  }, [navigationHistory]);

  const navigateBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const previousTab = navigationHistory[navigationHistory.length - 2];
      setActiveTab(previousTab);
      setNavigationHistory(prev => prev.slice(0, -1));
    }
  }, [navigationHistory]);

  const setScenario = useCallback((scenarioId: string | null) => {
    setSelectedScenarioId(scenarioId);
  }, []);

  // Generate breadcrumbs based on current state
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Add Home/Dashboard as first item
    items.push({
      label: 'Dashboard',
      tab: 'dashboard',
      onClick: () => navigateToTab('dashboard'),
      isActive: activeTab === 'dashboard' && !selectedScenarioId,
    });

    // Add current tab if not dashboard
    if (activeTab !== 'dashboard') {
      const tabLabels: Record<AppTab, string> = {
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        scenarios: 'Scenarios',
        budgets: 'Budgets',
        bills: 'Bills',
        accounts: 'Accounts',
        transactions: 'Transactions',
        categories: 'Categories',
        profile: 'Profile',
      };

      items.push({
        label: tabLabels[activeTab],
        tab: activeTab,
        onClick: () => navigateToTab(activeTab, { resetScenario: true }),
        isActive: !selectedScenarioId,
      });
    }

    // Add scenario detail if viewing a specific scenario
    if (selectedScenarioId && activeTab === 'scenarios') {
      items.push({
        label: 'Scenario Details',
        isActive: true,
      });
    }

    return items;
  }, [activeTab, selectedScenarioId, navigateToTab]);

  const canGoBack = navigationHistory.length > 1;

  return {
    // State
    activeTab,
    selectedScenarioId,
    navigationHistory,
    breadcrumbs,
    canGoBack,
    
    // Actions
    navigateToTab,
    navigateBack,
    setScenario,
  };
}