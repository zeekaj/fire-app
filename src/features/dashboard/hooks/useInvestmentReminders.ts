/**
 * useInvestmentReminders Hook
 * 
 * Provides investment-related reminders and alerts including:
 * - Portfolio rebalancing recommendations
 * - Account allocation drift detection
 * - Investment contribution reminders
 * - Performance monitoring alerts
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useSelectedScenario } from './useSelectedScenario';
// Note: useSettings hook doesn't exist yet, so we'll create a simple fallback
const useSettings = () => ({ data: null as any });

export interface InvestmentReminder {
  id: string;
  type: 'rebalancing' | 'contribution' | 'performance' | 'allocation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionText?: string;
  value: number; // Numerical value (percentage, dollar amount, etc.)
  threshold: number; // The threshold that triggered this reminder
  icon: string;
  color: 'red' | 'yellow' | 'blue' | 'green';
  dismissible: boolean;
  lastDismissed?: string | null;
}

interface InvestmentAccountSummary {
  totalValue: number;
  stockValue: number;
  bondValue: number;
  cashValue: number;
  currentStockAllocation: number;
  currentBondAllocation: number;
  currentCashAllocation: number;
  targetStockAllocation: number;
  targetBondAllocation: number;
  targetCashAllocation: number;
  allocationDrift: {
    stock: number;
    bond: number;
    cash: number;
  };
}

/**
 * Calculate investment account summary and allocation drift
 */
function calculateInvestmentSummary(
  accounts: any[],
  targetStockAllocation: number
): InvestmentAccountSummary {
  // Filter investment and retirement accounts
  const investmentAccounts = accounts.filter(account => 
    account.account_group?.name === 'Investment' || 
    account.account_group?.name === 'Retirement' ||
    account.type === 'investment' ||
    account.type === 'retirement'
  );

  const totalValue = investmentAccounts.reduce((sum, account) => 
    sum + (account.current_balance || 0), 0
  );

  // For now, we'll use simplified assumptions since we don't have detailed 
  // asset allocation data per account. In a real implementation, you'd want
  // to track holdings within each account.
  
  // Assume retirement accounts are more conservative (lower stock allocation)
  // and investment accounts follow target allocation more closely
  const retirementAccounts = investmentAccounts.filter(acc => 
    acc.account_group?.name === 'Retirement' || acc.type === 'retirement'
  );
  const regularInvestmentAccounts = investmentAccounts.filter(acc =>
    acc.account_group?.name === 'Investment' || acc.type === 'investment'
  );

  const retirementValue = retirementAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const investmentValue = regularInvestmentAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  // Estimate current allocation based on account types
  // Retirement accounts: assume 80% of target stock allocation (more conservative)
  // Investment accounts: assume close to target allocation
  const estimatedStockAllocation = totalValue > 0 
    ? ((retirementValue * targetStockAllocation * 0.8) + (investmentValue * targetStockAllocation)) / totalValue
    : targetStockAllocation;

  const targetBondAllocation = 1 - targetStockAllocation;
  const estimatedBondAllocation = 1 - estimatedStockAllocation;
  const targetCashAllocation = 0.05; // Assume 5% cash target
  const estimatedCashAllocation = Math.max(0, 1 - estimatedStockAllocation - estimatedBondAllocation);

  return {
    totalValue,
    stockValue: totalValue * estimatedStockAllocation,
    bondValue: totalValue * estimatedBondAllocation,
    cashValue: totalValue * estimatedCashAllocation,
    currentStockAllocation: estimatedStockAllocation,
    currentBondAllocation: estimatedBondAllocation,
    currentCashAllocation: estimatedCashAllocation,
    targetStockAllocation,
    targetBondAllocation,
    targetCashAllocation,
    allocationDrift: {
      stock: estimatedStockAllocation - targetStockAllocation,
      bond: estimatedBondAllocation - targetBondAllocation,
      cash: estimatedCashAllocation - targetCashAllocation,
    },
  };
}

/**
 * Calculate time since last contribution to investment accounts
 */
function useLastContributionDate() {
  return useQuery({
    queryKey: ['last-investment-contribution'],
    queryFn: async () => {
      // This would query transactions for the most recent contribution
      // to investment/retirement accounts. For now, we'll simulate it.
      
      // In a real implementation, you'd query:
      // SELECT MAX(date) FROM transactions 
      // WHERE account_id IN (investment_account_ids) 
      // AND amount > 0 
      // AND category = 'Investment Contribution'
      
      // For demo purposes, simulate last contribution was 45 days ago
      const daysAgo = 45;
      const lastContribution = new Date();
      lastContribution.setDate(lastContribution.getDate() - daysAgo);
      
      return lastContribution.toISOString();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Hook to get dismissed reminders from settings
 */
function useDismissedReminders() {
  const { data: settings } = useSettings();
  
  return useMemo(() => {
    try {
      const featureFlags = settings?.feature_flags as any || {};
      return featureFlags.dismissed_reminders || {};
    } catch {
      return {};
    }
  }, [settings?.feature_flags]);
}

/**
 * Main hook for investment reminders
 */
export function useInvestmentReminders() {
  const { data: accounts = [] } = useAccounts();
  const { selectedScenario } = useSelectedScenario();
  const { data: lastContributionDate } = useLastContributionDate();
  const dismissedReminders = useDismissedReminders();

  const reminders = useMemo((): InvestmentReminder[] => {
    if (!selectedScenario || accounts.length === 0) return [];

    const targetStockAllocation = selectedScenario.portfolio_stock_pct;
    const investmentSummary = calculateInvestmentSummary(accounts, targetStockAllocation);
    const reminders: InvestmentReminder[] = [];

    // 1. PORTFOLIO REBALANCING REMINDERS
    const stockDrift = Math.abs(investmentSummary.allocationDrift.stock);
    const rebalancingThreshold = 0.05; // 5% drift threshold

    if (stockDrift > rebalancingThreshold && investmentSummary.totalValue > 1000) {
      const driftDirection = investmentSummary.allocationDrift.stock > 0 ? 'overweight' : 'underweight';
      const targetStockPct = (targetStockAllocation * 100).toFixed(0);
      const currentStockPct = (investmentSummary.currentStockAllocation * 100).toFixed(0);
      
      reminders.push({
        id: 'portfolio-rebalancing',
        type: 'rebalancing',
        priority: stockDrift > 0.10 ? 'high' : 'medium',
        title: 'Portfolio Needs Rebalancing',
        description: `Your stock allocation is ${currentStockPct}% (target: ${targetStockPct}%). You're ${driftDirection} in stocks by ${(stockDrift * 100).toFixed(1)}%.`,
        actionText: 'Review Allocation',
        value: stockDrift * 100,
        threshold: rebalancingThreshold * 100,
        icon: '⚖️',
        color: stockDrift > 0.10 ? 'red' : 'yellow',
        dismissible: true,
        lastDismissed: dismissedReminders['portfolio-rebalancing'],
      });
    }

    // 2. CONTRIBUTION REMINDERS
    if (lastContributionDate) {
      const daysSinceContribution = Math.floor(
        (new Date().getTime() - new Date(lastContributionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const contributionThreshold = 60; // 60 days

      if (daysSinceContribution > contributionThreshold) {
        reminders.push({
          id: 'contribution-reminder',
          type: 'contribution',
          priority: daysSinceContribution > 90 ? 'high' : 'medium',
          title: 'Consider Making Investment Contribution',
          description: `It's been ${daysSinceContribution} days since your last investment contribution. Regular contributions help maintain your FIRE timeline.`,
          actionText: 'Add Transaction',
          value: daysSinceContribution,
          threshold: contributionThreshold,
          icon: '💰',
          color: daysSinceContribution > 90 ? 'red' : 'blue',
          dismissible: true,
          lastDismissed: dismissedReminders['contribution-reminder'],
        });
      }
    }

    // 3. LOW INVESTMENT ALLOCATION WARNING
    if (investmentSummary.totalValue < selectedScenario.current_savings * 0.8) {
      const investmentRatio = selectedScenario.current_savings > 0 
        ? (investmentSummary.totalValue / selectedScenario.current_savings)
        : 0;
      
      reminders.push({
        id: 'low-investment-allocation',
        type: 'allocation',
        priority: 'medium',
        title: 'Low Investment Account Balance',
        description: `Only ${(investmentRatio * 100).toFixed(0)}% of your portfolio is in investment accounts. Consider moving cash to investments for better growth potential.`,
        actionText: 'Review Accounts',
        value: investmentRatio * 100,
        threshold: 80,
        icon: '📈',
        color: 'yellow',
        dismissible: true,
        lastDismissed: dismissedReminders['low-investment-allocation'],
      });
    }

    // 4. AGGRESSIVE ALLOCATION FOR AGE WARNING
    const currentAge = selectedScenario.current_age || 30;
    const ageBasedStockAllocation = Math.max(0.2, (100 - currentAge) / 100); // Rule of thumb
    const ageDrift = targetStockAllocation - ageBasedStockAllocation;

    if (ageDrift > 0.15 && currentAge > 50) { // More than 15% above age-appropriate allocation
      reminders.push({
        id: 'aggressive-allocation-warning',
        type: 'allocation',
        priority: 'low',
        title: 'Consider Age-Appropriate Allocation',
        description: `At age ${currentAge}, a ${(targetStockAllocation * 100).toFixed(0)}% stock allocation may be aggressive. Consider gradually reducing to ${(ageBasedStockAllocation * 100).toFixed(0)}%.`,
        actionText: 'Review Strategy',
        value: targetStockAllocation * 100,
        threshold: ageBasedStockAllocation * 100,
        icon: '👴',
        color: 'blue',
        dismissible: true,
        lastDismissed: dismissedReminders['aggressive-allocation-warning'],
      });
    }

    // 5. PERFORMANCE MONITORING (Placeholder - would need historical data)
    // This would compare actual portfolio performance vs expected returns
    const expectedAnnualReturn = selectedScenario.expected_return_mean || 0.07;
    if (expectedAnnualReturn > 0.10) { // Very optimistic return assumption
      reminders.push({
        id: 'optimistic-returns-warning',
        type: 'performance',
        priority: 'low',
        title: 'Review Return Expectations',
        description: `Your scenario assumes ${(expectedAnnualReturn * 100).toFixed(1)}% annual returns. Market historical averages suggest 7-9% may be more realistic.`,
        actionText: 'Edit Scenario',
        value: expectedAnnualReturn * 100,
        threshold: 10,
        icon: '📊',
        color: 'blue',
        dismissible: true,
        lastDismissed: dismissedReminders['optimistic-returns-warning'],
      });
    }

    // Filter out recently dismissed reminders (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return reminders.filter(reminder => {
      if (!reminder.dismissible || !reminder.lastDismissed) return true;
      
      const dismissedDate = new Date(reminder.lastDismissed);
      return dismissedDate < sevenDaysAgo;
    });
  }, [accounts, selectedScenario, lastContributionDate, dismissedReminders]);

  return {
    reminders,
    hasHighPriorityReminders: reminders.some(r => r.priority === 'high'),
    hasMediumPriorityReminders: reminders.some(r => r.priority === 'medium'),
    totalReminders: reminders.length,
  };
}