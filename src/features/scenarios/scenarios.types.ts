/**
 * scenarios.types.ts
 * 
 * TypeScript types for scenarios feature (FIRE planning scenarios).
 * Now using actual database schema column names.
 */

import type { Database } from '@/lib/database.types';

// Use the generated database types
export type Scenario = Database['public']['Tables']['scenarios']['Row'];
export type ScenarioInsert = Database['public']['Tables']['scenarios']['Insert'];
export type ScenarioUpdate = Database['public']['Tables']['scenarios']['Update'];

// Helper type for working with scenarios in the UI (display format)
export interface ScenarioDisplay {
  id: string;
  name: string;
  current_age: number;
  retirement_age: number;
  life_expectancy: number;
  current_savings: number;
  annual_contribution: number;
  annual_expenses: number;
  portfolio_stock_pct: number;
  expected_return_mean: number;
  expected_return_stdev: number;
  inflation_rate: number;
  withdrawal_strategy: 'fixed' | 'percentage' | 'guardrails';
  notes: string | null;
  created_at: string;
}

// Helper function to convert UI form data to database format
export function formDataToScenarioInsert(formData: {
  name: string;
  current_age: number;
  retirement_age: number;
  life_expectancy: number;
  current_savings: number;
  annual_contribution: number;
  annual_expenses: number;
  portfolio_stock_pct: number;
  expected_return_mean: number;
  expected_return_stdev: number;
  inflation_rate: number;
  withdrawal_strategy: 'fixed' | 'percentage' | 'guardrails';
  notes?: string | null;
}): ScenarioInsert {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - formData.current_age;
  const retirementYear = birthYear + formData.retirement_age;
  const deathYear = birthYear + formData.life_expectancy;

  return {
    name: formData.name,
    retirement_date: formData.retirement_age > formData.current_age 
      ? `${retirementYear}-01-01` 
      : null,
    death_date: `${deathYear}-01-01`,
    mean_return_real: formData.expected_return_mean,
    stdev_return_real: formData.expected_return_stdev,
    inflation: formData.inflation_rate,
    swr: 0.04, // Safe withdrawal rate - default 4%
    withdrawal_rule: formData.withdrawal_strategy,
    use_monte_carlo: true,
    use_historical: false,
    // created_by will be added by the mutation hook from auth.getUser()
    // Financial fields (added in migration 04)
    portfolio_value_now: formData.current_savings,
    savings: formData.annual_contribution,
    expenses: formData.annual_expenses,
    portfolio_stocks: formData.portfolio_stock_pct,
    notes: formData.notes || null,
  } as ScenarioInsert;
}

// Helper function to convert database format to UI display format
export function scenarioToDisplayFormat(scenario: Scenario): ScenarioDisplay {
  const currentYear = new Date().getFullYear();
  const deathYear = parseInt(scenario.death_date.split('-')[0]);
  const retirementYear = scenario.retirement_date 
    ? parseInt(scenario.retirement_date.split('-')[0]) 
    : null;
  
  // Calculate ages from dates
  const lifeExpectancy = deathYear - currentYear + (currentYear - new Date().getFullYear());
  const birthYear = deathYear - lifeExpectancy;
  const currentAge = currentYear - birthYear;
  const retirementAge = retirementYear ? retirementYear - birthYear : currentAge;

  // Ensure withdrawal_rule has a valid value (not null, undefined, or empty string)
  const withdrawalRule = scenario.withdrawal_rule?.trim() || 'fixed';
  
  // Validate it's one of the allowed values
  const validStrategies: Array<'fixed' | 'percentage' | 'guardrails'> = ['fixed', 'percentage', 'guardrails'];
  const withdrawalStrategy = validStrategies.includes(withdrawalRule as any) 
    ? withdrawalRule as 'fixed' | 'percentage' | 'guardrails'
    : 'fixed';

  return {
    id: scenario.id,
    name: scenario.name || 'Unnamed Scenario',
    current_age: currentAge,
    retirement_age: retirementAge,
    life_expectancy: lifeExpectancy,
    // Financial fields (now using real database columns from migration 04)
    current_savings: scenario.portfolio_value_now || 0,
    annual_contribution: scenario.savings || 0,
    annual_expenses: scenario.expenses || 0,
    portfolio_stock_pct: scenario.portfolio_stocks || 0.6,
    expected_return_mean: scenario.mean_return_real || 0.05,
    expected_return_stdev: scenario.stdev_return_real || 0.12,
    inflation_rate: scenario.inflation || 0.02,
    withdrawal_strategy: withdrawalStrategy,
    notes: scenario.notes || null,
    created_at: scenario.created_at || new Date().toISOString(),
  };
}
