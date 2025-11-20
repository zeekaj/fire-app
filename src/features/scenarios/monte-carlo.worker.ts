/**
 * monte-carlo.worker.ts
 *
 * Web Worker for Monte Carlo FIRE scenario simulations.
 * Runs stochastic projections to estimate probability of success.
 */

interface ScenarioParams {
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
}

interface SimulationResult {
  success: boolean;
  final_balance: number;
  years_to_depletion?: number;
}

interface MonteCarloResult {
  success_rate: number;
  median_balance: number;
  percentile_10: number;
  percentile_90: number;
  results: SimulationResult[];
}

// Random number generator (Box-Muller transform for normal distribution)
function randomNormal(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * std + mean;
}

// Simulate one scenario run
function simulateScenario(params: ScenarioParams): SimulationResult {
  const {
    current_age,
    retirement_age,
    life_expectancy,
    current_savings,
    annual_contribution,
    annual_expenses,
    portfolio_stock_pct,
    expected_return_mean,
    expected_return_stdev,
    inflation_rate,
    withdrawal_strategy,
  } = params;

  let balance = current_savings;
  let age = current_age;
  let expenses = annual_expenses;

  // Accumulation phase
  while (age < retirement_age) {
    // Annual return (stochastic)
    const stock_return = randomNormal(expected_return_mean, expected_return_stdev);
    const bond_return = randomNormal(0.03, 0.05); // Simplified bond return
    const portfolio_return = portfolio_stock_pct * stock_return + (1 - portfolio_stock_pct) * bond_return;

    // Adjust for inflation
    expenses *= (1 + inflation_rate);

    // Grow balance
    balance = balance * (1 + portfolio_return) + annual_contribution;

    age++;
  }

  // Retirement phase
  let years_in_retirement = 0;
  while (age < life_expectancy && balance > 0) {
    // Annual return (stochastic)
    const stock_return = randomNormal(expected_return_mean, expected_return_stdev);
    const bond_return = randomNormal(0.03, 0.05);
    const portfolio_return = portfolio_stock_pct * stock_return + (1 - portfolio_stock_pct) * bond_return;

    // Withdrawal
    let withdrawal = 0;
    if (withdrawal_strategy === 'fixed') {
      withdrawal = expenses;
    } else if (withdrawal_strategy === 'percentage') {
      withdrawal = balance * 0.04; // 4% rule
    } else { // guardrails
      withdrawal = Math.min(expenses, balance * 0.04);
    }

    // Adjust for inflation
    expenses *= (1 + inflation_rate);

    // Update balance
    balance = balance * (1 + portfolio_return) - withdrawal;

    age++;
    years_in_retirement++;

    if (balance <= 0) {
      return { success: false, final_balance: 0, years_to_depletion: years_in_retirement };
    }
  }

  return { success: true, final_balance: balance };
}

// Main worker logic
self.onmessage = (e: MessageEvent<{ params: ScenarioParams; numSimulations: number }>) => {
  const { params, numSimulations } = e.data;

  const results: SimulationResult[] = [];

  for (let i = 0; i < numSimulations; i++) {
    results.push(simulateScenario(params));
  }

  // Calculate statistics
  const allBalances = results.map(r => r.final_balance).sort((a, b) => a - b);

  const success_rate = results.filter(r => r.success).length / numSimulations;

  const median_balance = allBalances[Math.floor(allBalances.length / 2)] || 0;
  const percentile_10 = allBalances[Math.floor(allBalances.length * 0.1)] || 0;
  const percentile_90 = allBalances[Math.floor(allBalances.length * 0.9)] || 0;

  const result: MonteCarloResult = {
    success_rate,
    median_balance,
    percentile_10,
    percentile_90,
    results,
  };

  self.postMessage(result);
};