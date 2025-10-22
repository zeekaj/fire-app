/**
 * projection.ts
 * 
 * A data-driven, year-by-year FIRE projection engine.
 * This engine simulates the user's financial journey to predict their time to FI
 * based on historical data and a set of configurable, realistic assumptions.
 */

export interface GlidePathConfig {
  startAge: number;
  endAge: number;
  startStockAllocation: number; // e.g., 0.90 for 90%
  endStockAllocation: number; // e.g., 0.50 for 50%
}

export interface FIProjectionInputs {
  currentAge: number;
  currentNetWorth: number;
  initialAnnualSavings: number;
  initialAnnualExpenses: number;
  
  // Assumptions
  stockGrowthRate: number; // e.g., 0.10 for 10%
  bondGrowthRate: number; // e.g., 0.03 for 3%
  inflationRate: number; // e.g., 0.03 for 3%
  incomeGrowthRate: number; // e.g., 0.03 for 3%
  withdrawalRate: number; // e.g., 0.04 for 4%
  glidePath: GlidePathConfig;
}

export interface FIProjectionYear {
  year: number;
  age: number;
  netWorth: number;
  expenses: number;
  savings: number;
  investmentReturn: number; // The blended return for this year
}

export interface FIProjectionResult {
  yearsToFI: number;
  projectedFIDate: Date;
  fiNumber: number;
  projection: FIProjectionYear[];
}

/**
 * Calculates the stock allocation for a given age based on a linear glide path.
 */
function getStockAllocation(age: number, glidePath: GlidePathConfig): number {
  const { startAge, endAge, startStockAllocation, endStockAllocation } = glidePath;

  if (age <= startAge) {
    return startStockAllocation;
  }
  if (age >= endAge) {
    return endStockAllocation;
  }

  const progress = (age - startAge) / (endAge - startAge);
  return startStockAllocation - progress * (startStockAllocation - endStockAllocation);
}

/**
 * Calculates a year-by-year projection for Financial Independence.
 */
export function calculateFIProjection(inputs: FIProjectionInputs): FIProjectionResult {
  const {
    currentAge,
    currentNetWorth,
    initialAnnualSavings,
    initialAnnualExpenses,
    stockGrowthRate,
    bondGrowthRate,
    inflationRate,
    incomeGrowthRate,
    withdrawalRate,
    glidePath,
  } = inputs;

  let year = 0;
  let age = currentAge;
  let netWorth = currentNetWorth;
  let annualSavings = initialAnnualSavings;
  let annualExpenses = initialAnnualExpenses;

  const initialStockAllocation = getStockAllocation(age, glidePath);
  const initialReturn = initialStockAllocation * stockGrowthRate + (1 - initialStockAllocation) * bondGrowthRate;

  const projection: FIProjectionYear[] = [{
    year,
    age,
    netWorth,
    expenses: annualExpenses,
    savings: annualSavings,
    investmentReturn: initialReturn,
  }];

  const MAX_YEARS = 100; // Safety break for the loop

  while (year < MAX_YEARS) {
    year++;
    age++;

    // 1. Calculate this year's blended investment return based on the glide path
    const stockAllocation = getStockAllocation(age, glidePath);
    const blendedReturn = stockAllocation * stockGrowthRate + (1 - stockAllocation) * bondGrowthRate;

    // 2. Grow net worth from investments
    netWorth *= (1 + blendedReturn);

    // 3. Add this year's savings
    netWorth += annualSavings;

    // 4. Update expenses and savings for next year based on inflation/income growth
    annualExpenses *= (1 + inflationRate);
    annualSavings *= (1 + incomeGrowthRate);
    
    // 5. Store this year's data
    projection.push({
      year,
      age,
      netWorth,
      expenses: annualExpenses,
      savings: annualSavings,
      investmentReturn: blendedReturn,
    });

    // 6. Check for FI condition
    const fiNumber = annualExpenses / withdrawalRate;
    if (netWorth >= fiNumber) {
      const projectedFIDate = new Date();
      projectedFIDate.setFullYear(projectedFIDate.getFullYear() + year);
      
      return {
        yearsToFI: year,
        projectedFIDate,
        fiNumber,
        projection,
      };
    }
  }

  // If FI is not reached within MAX_YEARS
  return {
    yearsToFI: Infinity,
    projectedFIDate: new Date(9999, 11, 31),
    fiNumber: annualExpenses / withdrawalRate,
    projection,
  };
}