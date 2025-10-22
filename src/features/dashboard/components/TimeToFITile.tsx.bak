/**
 * TimeToFITile.tsx
 * 
 * Dashboard widget showing years to Financial Independence.
 * Enhanced with selected scenario integration showing mini projection chart,
 * success probability, and on-track status.
 */

import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { calculateYearsToFI, runMonteCarloSimulation, type NetworthifyInputs, type MonteCarloConfig } from '@/lib/sim';
import { useSelectedScenario } from '../hooks/useSelectedScenario';

interface TimeToFITileProps {
  currentNetWorth: number;
  annualExpenses: number;
  annualSavings: number;
  expectedReturn?: number;
  withdrawalRate?: number;
}

export function TimeToFITile({
  currentNetWorth,
  annualExpenses,
  annualSavings,
  expectedReturn = 0.05,
  withdrawalRate = 0.04,
}: TimeToFITileProps) {
  const { selectedScenario } = useSelectedScenario();

  // Calculate years to FI using deterministic method
  const inputs: NetworthifyInputs = {
    currentNetWorth,
    annualExpenses: selectedScenario?.annual_expenses || annualExpenses,
    annualSavings: selectedScenario?.annual_contribution || annualSavings,
    expectedReturn: selectedScenario?.expected_return_mean || expectedReturn,
    withdrawalRate,
  };

  const result = calculateYearsToFI(inputs);

  // Generate mini projection chart data
  const projectionData = useMemo(() => {
    if (!selectedScenario) return [];
    
    const years = Math.min(Math.ceil(result.yearsToFI), 30); // Cap at 30 years for visualization
    const data = [];
    let portfolio = currentNetWorth;
    
    for (let i = 0; i <= years; i++) {
      data.push({
        year: i,
        value: portfolio,
      });
      portfolio = (portfolio + (selectedScenario.annual_contribution || 0)) * (1 + (selectedScenario.expected_return_mean || 0.05));
    }
    
    return data;
  }, [selectedScenario, currentNetWorth, result.yearsToFI]);

  // Run quick Monte Carlo for success probability
  const successProbability = useMemo(() => {
    if (!selectedScenario) return null;
    
    const yearsToRetirement = Math.max(0, selectedScenario.retirement_age - selectedScenario.current_age);
    let projectedNetWorth = currentNetWorth;
    for (let i = 0; i < yearsToRetirement; i++) {
      projectedNetWorth = (projectedNetWorth + selectedScenario.annual_contribution) * (1 + selectedScenario.expected_return_mean);
    }

    const retirementYears = selectedScenario.life_expectancy - selectedScenario.retirement_age;
    const withdrawalRate = selectedScenario.annual_expenses / projectedNetWorth || 0.04;

    const mcConfig: MonteCarloConfig = {
      numSimulations: 100, // Quick simulation for dashboard
      retirementYears,
      initialPortfolio: projectedNetWorth,
      annualWithdrawal: selectedScenario.withdrawal_strategy === 'percentage' ? undefined : selectedScenario.annual_expenses,
      withdrawalRate: selectedScenario.withdrawal_strategy === 'percentage' ? withdrawalRate : undefined,
      withdrawalStrategy: selectedScenario.withdrawal_strategy,
      expectedReturnMean: selectedScenario.expected_return_mean,
      expectedReturnStdev: selectedScenario.expected_return_stdev,
      inflationRate: selectedScenario.inflation_rate,
    };

    const mcResult = runMonteCarloSimulation(mcConfig);
    return mcResult.successRate * 100;
  }, [selectedScenario, currentNetWorth]);

  // Calculate on-track status
  const onTrackStatus = useMemo(() => {
    if (!selectedScenario) return null;
    
    // Compare current net worth vs scenario's starting net worth
    const expectedNetWorth = selectedScenario.current_savings;
    const variance = currentNetWorth - expectedNetWorth;
    const percentVariance = expectedNetWorth > 0 ? (variance / expectedNetWorth) * 100 : 0;
    
    if (percentVariance > 10) return { status: 'ahead', variance, percentVariance };
    if (percentVariance < -10) return { status: 'behind', variance, percentVariance };
    return { status: 'on-track', variance, percentVariance };
  }, [selectedScenario, currentNetWorth]);

  // Format date
  const fiDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(result.projectedFIDate);

  // Determine color based on years to FI
  const getYearsColor = (years: number) => {
    if (years <= 0) return 'text-green-600';
    if (years <= 10) return 'text-green-500';
    if (years <= 20) return 'text-yellow-500';
    if (years <= 30) return 'text-orange-500';
    return 'text-gray-500';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getSuccessProbabilityColor = (probability: number) => {
    if (probability >= 80) return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    if (probability >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  };

  const getOnTrackStatusDisplay = (status: string) => {
    switch (status) {
      case 'ahead':
        return { icon: '📈', text: 'Ahead of Plan', color: 'text-green-600' };
      case 'behind':
        return { icon: '📉', text: 'Behind Plan', color: 'text-red-600' };
      default:
        return { icon: '🎯', text: 'On Track', color: 'text-blue-600' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Time to Financial Independence
        </h3>
        {successProbability !== null && (
          <div className={`px-2 py-1 rounded text-xs font-semibold border ${getSuccessProbabilityColor(successProbability).bg} ${getSuccessProbabilityColor(successProbability).text} ${getSuccessProbabilityColor(successProbability).border}`}>
            {successProbability.toFixed(0)}% Success
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Years to FI with mini chart */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Years to FI</p>
          <div className="flex items-end gap-4">
            <p className={`text-4xl font-bold ${getYearsColor(result.yearsToFI)}`}>
              {result.yearsToFI === Infinity
                ? '∞'
                : result.yearsToFI <= 0
                ? 'FI!'
                : result.yearsToFI.toFixed(1)}
            </p>
            {projectionData.length > 0 && (
              <div className="flex-1" style={{ height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {result.yearsToFI > 0 && result.yearsToFI < Infinity && (
            <p className="text-sm text-gray-600 mt-1">Expected: {fiDate}</p>
          )}
        </div>

        {/* On-Track Status */}
        {onTrackStatus && selectedScenario && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">{getOnTrackStatusDisplay(onTrackStatus.status).icon}</span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${getOnTrackStatusDisplay(onTrackStatus.status).color}`}>
                {getOnTrackStatusDisplay(onTrackStatus.status).text}
              </p>
              <p className="text-xs text-gray-600">
                {onTrackStatus.variance >= 0 ? '+' : ''}
                ${Math.abs(onTrackStatus.variance).toLocaleString('en-US', { maximumFractionDigits: 0 })} vs scenario
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{result.currentProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getProgressColor(result.currentProgress)} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(result.currentProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-600">FI Number</p>
            <p className="text-lg font-semibold text-gray-900">
              ${result.fiNumber.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Remaining Needed</p>
            <p className="text-lg font-semibold text-gray-900">
              ${result.remainingNeeded.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Warning if not saving */}
        {annualSavings <= 0 && result.currentProgress < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You need to save money to reach FI. Current savings: ${annualSavings.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
