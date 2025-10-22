/**
 * ScenarioTimeToFICard.tsx
 *
 * A "smart" component that takes a scenario and calculates the Time to FI
 * using the simple networthify calculator. It then renders the "dumb"
 * TimeToFICard component with the results.
 */
import { TimeToFICard } from '@/features/dashboard/components/TimeToFICard';
import { calculateYearsToFI, NetworthifyResult } from '@/lib/sim/networthify';
import type { ScenarioDisplay as Scenario } from '../scenarios.types';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';

interface ScenarioTimeToFICardProps {
  scenario: Scenario;
}

export function ScenarioTimeToFICard({ scenario }: ScenarioTimeToFICardProps) {
  const metrics = useDashboardMetrics();

  const fiMetrics: NetworthifyResult = calculateYearsToFI({
    currentNetWorth: metrics.netWorth,
    annualSavings: scenario.annual_contribution,
    annualExpenses: scenario.annual_expenses,
    expectedReturn: scenario.expected_return_mean,
    withdrawalRate: 0.04, // Standard 4% rule for scenarios
  });

  const { yearsToFI, fiNumber, currentProgress, remainingNeeded } = fiMetrics;

  // The simple calculator doesn't produce a year-by-year projection array.
  // We can create a simplified one for the chart.
  const generateProjections = () => {
    const projections = [];
    let currentWorth = metrics.netWorth;
    const years = Math.min(Math.ceil(yearsToFI), 50); // Cap at 50 years
    for (let i = 0; i <= years; i++) {
      projections.push({ year: new Date().getFullYear() + i, value: currentWorth });
      currentWorth = (currentWorth + scenario.annual_contribution) * (1 + scenario.expected_return_mean);
    }
    return projections;
  };

  return (
    <TimeToFICard
      title={`Scenario: ${scenario.name}`}
      yearsToFI={yearsToFI}
      fiNumber={fiNumber}
      remainingNeeded={remainingNeeded}
      currentProgress={currentProgress}
      projectionData={generateProjections()}
      annualSavings={scenario.annual_contribution}
      isLoading={false}
    />
  );
}
