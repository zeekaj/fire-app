/**
 * useFIProjection.ts
 * 
 * This hook is responsible for gathering all necessary data, running the 
 * data-driven FI projection, and returning the results for display.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { calculateFIProjection, FIProjectionInputs, FIProjectionResult, GlidePathConfig } from '@/lib/sim/projection';
import { getAge } from '@/lib/data-utils';

// --- Hardcoded Assumptions ---
// In a real app, these could be user-configurable settings.
const PROJECTION_ASSUMPTIONS = {
  stockGrowthRate: 0.10, // 10% average annual stock market return
  bondGrowthRate: 0.03,  // 3% average annual bond return
  inflationRate: 0.03,   // 3% average annual inflation
  incomeGrowthRate: 0.03, // 3% average annual income/savings growth
  withdrawalRate: 0.04,  // 4% safe withdrawal rate
};

const GLIDE_PATH_CONFIG: GlidePathConfig = {
  startAge: 30,
  endAge: 60,
  startStockAllocation: 0.95, // 95% stocks at age 30 or younger
  endStockAllocation: 0.60,   // 60% stocks at age 60 or older
};
// ---------------------------

/**
 * Fetches all necessary data and runs the FI projection simulation.
 */
async function fetchAndRunProjection(userId: string, userDob: string): Promise<FIProjectionResult> {
  // 1. Get current net worth (sum of all account balances)
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('current_balance, type')
    .eq('user_id', userId);
  
  if (accountsError) throw new Error(accountsError.message);
  const currentNetWorth = Array.isArray(accounts) ? accounts.reduce((sum, acc) => {
    const balance = acc.current_balance ?? 0;
    
    // Credit cards and mortgages are always liabilities
    const liabilityTypes = ['credit', 'mortgage'];
    if (liabilityTypes.includes(acc.type)) {
      return sum - Math.abs(balance); // Subtract liabilities
    }
    
    // For other accounts, use balance sign to determine asset/liability
    return sum + balance;
  }, 0) : 0;

  // 2. Calculate historical income and expenses (from last 12 months)
  // This is a simplified example. A real implementation would be more robust.
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', oneYearAgo.toISOString());

  if (txError) throw new Error(txError.message);

  const transactionsData = Array.isArray(transactions) ? transactions : [];
  const annualIncome = transactionsData.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const annualExpenses = transactionsData.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const annualSavings = annualIncome - annualExpenses;

  // 3. Get current age
  const currentAge = getAge(userDob);

  // 4. Assemble inputs for the projection engine
  const inputs: FIProjectionInputs = {
    currentAge,
    currentNetWorth,
    initialAnnualSavings: annualSavings,
    initialAnnualExpenses: annualExpenses,
    ...PROJECTION_ASSUMPTIONS,
    glidePath: GLIDE_PATH_CONFIG,
  };

  // 5. Run the simulation
  const result = calculateFIProjection(inputs);
  return result;
}

/**
 * A React Query hook to get the data-driven FI projection.
 */
export function useFIProjection() {
  const { user } = useAuth();

  // We need the user's date of birth, which we assume is on the user's metadata.
  // In a real app, this would be fetched from a 'profiles' table.
  const userDob = user?.user_metadata?.date_of_birth;

  return useQuery<FIProjectionResult, Error>({
    queryKey: ['fi-projection', user?.id],
    queryFn: async () => {
      if (!user?.id || !userDob) {
        throw new Error("User not logged in or date of birth not set.");
      }
      return fetchAndRunProjection(user.id, userDob);
    },
    enabled: !!user && !!userDob, // Only run the query if we have a user and their DOB
  });
}
