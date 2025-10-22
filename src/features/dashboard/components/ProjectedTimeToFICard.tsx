/**
 * ProjectedTimeToFICard.tsx
 * 
 * A "smart" component that uses the data-driven projection hook
 * and renders the TimeToFICard with the results.
 */
import { useFIProjection } from '../hooks/useFIProjection';
import { TimeToFICard } from './TimeToFICard';

export function ProjectedTimeToFICard() {
  const { data, isLoading, error } = useFIProjection();

  // Transform the projection data for the chart
  const projectionData = data?.projection.map(p => ({
    year: p.year,
    value: p.netWorth,
  })) ?? [];

  // Calculate derived values, providing defaults for the loading state
  const fiNumber = data?.fiNumber ?? 0;
  const currentNetWorth = data?.projection?.[0]?.netWorth ?? 0;
  const remainingNeeded = Math.max(0, fiNumber - currentNetWorth);
  const currentProgress = fiNumber > 0 ? (currentNetWorth / fiNumber) * 100 : 0;
  const annualSavings = data?.projection?.[0]?.savings ?? 0;

  return (
    <TimeToFICard
      title="Data-Driven FI Projection"
      yearsToFI={data?.yearsToFI ?? 0}
      fiNumber={fiNumber}
      remainingNeeded={remainingNeeded}
      currentProgress={currentProgress}
      projectionData={projectionData}
      annualSavings={annualSavings}
      successProbability={null} // Not calculated in this deterministic projection
      onTrackStatus={null}      // Not calculated in this projection
      isLoading={isLoading}
      error={error}
    />
  );
}
