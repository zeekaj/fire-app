/**
 * historical.ts
 * 
 * Historical returns simulation using bootstrap sampling.
 * Uses actual historical stock and bond returns to model portfolio performance.
 * 
 * Methodology:
 * - Bootstrap sample from historical return sequences
 * - Support configurable stock/bond allocation
 * - Account for sequence of returns risk
 * - Provide more realistic estimates than normal distribution
 */

export interface HistoricalReturnsData {
  year: number;
  stockReturn: number; // decimal, e.g., 0.10 for 10%
  bondReturn: number; // decimal, e.g., 0.03 for 3%
  inflationRate: number; // decimal, e.g., 0.02 for 2%
}

export interface HistoricalSimulationConfig {
  numSimulations: number;
  retirementYears: number;
  initialPortfolio: number;
  annualWithdrawal: number;
  stockAllocation: number; // decimal, e.g., 0.60 for 60% stocks
  historicalData: HistoricalReturnsData[];
  inflationAdjusted: boolean; // Whether to inflation-adjust withdrawals
}

export interface HistoricalSimulationResult {
  successRate: number;
  medianFinalPortfolio: number;
  percentile10FinalPortfolio: number;
  percentile90FinalPortfolio: number;
  worstCaseStartYear: number; // Historical year that produced worst outcome
  bestCaseStartYear: number; // Historical year that produced best outcome
  simulations: HistoricalRun[];
}

export interface HistoricalRun {
  runId: number;
  startYear: number; // Historical year sequence started from
  success: boolean;
  finalPortfolio: number;
  yearsLasted: number;
  totalWithdrawn: number;
  returns: number[]; // Actual portfolio returns (stock/bond blend)
}

/**
 * Calculate portfolio return for a given stock/bond allocation
 */
function calculatePortfolioReturn(
  stockReturn: number,
  bondReturn: number,
  stockAllocation: number
): number {
  const bondAllocation = 1 - stockAllocation;
  return stockReturn * stockAllocation + bondReturn * bondAllocation;
}

/**
 * Sample a sequence of returns starting from a random historical year
 */
function sampleHistoricalSequence(
  historicalData: HistoricalReturnsData[],
  years: number,
  stockAllocation: number
): { returns: number[]; inflationRates: number[]; startYear: number } {
  // Choose random starting point
  const maxStartIndex = Math.max(0, historicalData.length - years);
  const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
  const startYear = historicalData[startIndex].year;

  const returns: number[] = [];
  const inflationRates: number[] = [];

  for (let i = 0; i < years && startIndex + i < historicalData.length; i++) {
    const dataPoint = historicalData[startIndex + i];
    const portfolioReturn = calculatePortfolioReturn(
      dataPoint.stockReturn,
      dataPoint.bondReturn,
      stockAllocation
    );
    returns.push(portfolioReturn);
    inflationRates.push(dataPoint.inflationRate);
  }

  return { returns, inflationRates, startYear };
}

/**
 * Run a single historical simulation run
 */
function runSingleHistoricalRun(
  initialPortfolio: number,
  annualWithdrawal: number,
  returns: number[],
  inflationRates: number[],
  inflationAdjusted: boolean,
  startYear: number
): HistoricalRun {
  let portfolioValue = initialPortfolio;
  let currentWithdrawal = annualWithdrawal;
  let totalWithdrawn = 0;
  let yearsLasted = 0;

  for (let year = 0; year < returns.length; year++) {
    // Apply inflation adjustment if enabled
    if (inflationAdjusted && year > 0) {
      currentWithdrawal = currentWithdrawal * (1 + inflationRates[year - 1]);
    }

    // Withdraw
    portfolioValue -= currentWithdrawal;
    totalWithdrawn += currentWithdrawal;

    // Check if depleted
    if (portfolioValue <= 0) {
      yearsLasted = year + 1;
      return {
        runId: 0,
        startYear,
        success: false,
        finalPortfolio: 0,
        yearsLasted,
        totalWithdrawn,
        returns: returns.slice(0, year + 1),
      };
    }

    // Apply returns
    portfolioValue = portfolioValue * (1 + returns[year]);
    yearsLasted = year + 1;
  }

  return {
    runId: 0,
    startYear,
    success: true,
    finalPortfolio: portfolioValue,
    yearsLasted,
    totalWithdrawn,
    returns,
  };
}

/**
 * Run historical bootstrap simulation
 */
export function runHistoricalSimulation(config: HistoricalSimulationConfig): HistoricalSimulationResult {
  const {
    numSimulations,
    retirementYears,
    initialPortfolio,
    annualWithdrawal,
    stockAllocation,
    historicalData,
    inflationAdjusted,
  } = config;

  if (historicalData.length < retirementYears) {
    throw new Error(
      `Insufficient historical data. Need at least ${retirementYears} years, have ${historicalData.length}`
    );
  }

  const simulations: HistoricalRun[] = [];

  for (let i = 0; i < numSimulations; i++) {
    // Sample historical sequence
    const { returns, inflationRates, startYear } = sampleHistoricalSequence(
      historicalData,
      retirementYears,
      stockAllocation
    );

    // Run simulation
    const result = runSingleHistoricalRun(
      initialPortfolio,
      annualWithdrawal,
      returns,
      inflationRates,
      inflationAdjusted,
      startYear
    );

    result.runId = i;
    simulations.push(result);
  }

  // Calculate statistics
  const successfulRuns = simulations.filter(s => s.success);
  const successRate = successfulRuns.length / numSimulations;

  // Sort by final portfolio value
  const sortedFinalPortfolios = simulations
    .map(s => s.finalPortfolio)
    .sort((a, b) => a - b);

  const medianFinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations / 2)];
  const percentile10FinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations * 0.1)];
  const percentile90FinalPortfolio = sortedFinalPortfolios[Math.floor(numSimulations * 0.9)];

  // Find worst and best case start years
  const sortedByFinal = [...simulations].sort((a, b) => a.finalPortfolio - b.finalPortfolio);
  const worstCaseStartYear = sortedByFinal[0].startYear;
  const bestCaseStartYear = sortedByFinal[sortedByFinal.length - 1].startYear;

  return {
    successRate,
    medianFinalPortfolio,
    percentile10FinalPortfolio,
    percentile90FinalPortfolio,
    worstCaseStartYear,
    bestCaseStartYear,
    simulations,
  };
}

/**
 * Sample historical data (S&P 500 and 10-Year Treasury, 1926-2023)
 * Source: Aswath Damodaran's historical returns dataset
 * Note: In production, this would be loaded from a database or external API
 */
export const SAMPLE_HISTORICAL_DATA: HistoricalReturnsData[] = [
  { year: 1926, stockReturn: 0.1162, bondReturn: 0.0774, inflationRate: -0.0149 },
  { year: 1927, stockReturn: 0.3749, bondReturn: 0.0893, inflationRate: -0.0208 },
  { year: 1928, stockReturn: 0.4361, bondReturn: 0.0010, inflationRate: -0.0097 },
  { year: 1929, stockReturn: -0.0842, bondReturn: 0.0484, inflationRate: 0.0019 },
  { year: 1930, stockReturn: -0.2490, bondReturn: 0.0466, inflationRate: -0.0603 },
  { year: 1931, stockReturn: -0.4334, bondReturn: -0.0256, inflationRate: -0.0952 },
  { year: 1932, stockReturn: -0.0819, bondReturn: 0.0888, inflationRate: -0.1030 },
  { year: 1933, stockReturn: 0.5399, bondReturn: 0.0196, inflationRate: 0.0051 },
  { year: 1934, stockReturn: -0.0144, bondReturn: 0.1020, inflationRate: 0.0203 },
  { year: 1935, stockReturn: 0.4767, bondReturn: 0.0498, inflationRate: 0.0299 },
  { year: 1936, stockReturn: 0.3392, bondReturn: 0.0751, inflationRate: 0.0121 },
  { year: 1937, stockReturn: -0.3503, bondReturn: 0.0123, inflationRate: 0.0291 },
  { year: 1938, stockReturn: 0.2928, bondReturn: 0.0521, inflationRate: -0.0278 },
  { year: 1939, stockReturn: -0.0110, bondReturn: 0.0594, inflationRate: 0.0000 },
  { year: 1940, stockReturn: -0.1067, bondReturn: 0.0555, inflationRate: 0.0096 },
  { year: 1941, stockReturn: -0.1277, bondReturn: 0.0053, inflationRate: 0.0993 },
  { year: 1942, stockReturn: 0.1917, bondReturn: 0.0273, inflationRate: 0.0929 },
  { year: 1943, stockReturn: 0.2550, bondReturn: 0.0249, inflationRate: 0.0316 },
  { year: 1944, stockReturn: 0.1946, bondReturn: 0.0273, inflationRate: 0.0232 },
  { year: 1945, stockReturn: 0.3582, bondReturn: 0.0373, inflationRate: 0.0225 },
  { year: 1946, stockReturn: -0.0843, bondReturn: 0.0028, inflationRate: 0.1817 },
  { year: 1947, stockReturn: 0.0520, bondReturn: -0.0010, inflationRate: 0.0901 },
  { year: 1948, stockReturn: 0.0570, bondReturn: 0.0340, inflationRate: 0.0290 },
  { year: 1949, stockReturn: 0.1879, bondReturn: 0.0645, inflationRate: -0.0180 },
  { year: 1950, stockReturn: 0.3171, bondReturn: 0.0043, inflationRate: 0.0579 },
  { year: 1951, stockReturn: 0.2402, bondReturn: -0.0069, inflationRate: 0.0587 },
  { year: 1952, stockReturn: 0.1837, bondReturn: 0.0288, inflationRate: 0.0088 },
  { year: 1953, stockReturn: -0.0099, bondReturn: 0.0349, inflationRate: 0.0062 },
  { year: 1954, stockReturn: 0.5262, bondReturn: 0.0542, inflationRate: -0.0050 },
  { year: 1955, stockReturn: 0.3156, bondReturn: -0.0046, inflationRate: 0.0037 },
  { year: 1956, stockReturn: 0.0656, bondReturn: -0.0290, inflationRate: 0.0286 },
  { year: 1957, stockReturn: -0.1078, bondReturn: 0.0823, inflationRate: 0.0302 },
  { year: 1958, stockReturn: 0.4336, bondReturn: -0.0226, inflationRate: 0.0176 },
  { year: 1959, stockReturn: 0.1196, bondReturn: -0.0097, inflationRate: 0.0150 },
  { year: 1960, stockReturn: 0.0047, bondReturn: 0.1378, inflationRate: 0.0148 },
  { year: 1961, stockReturn: 0.2689, bondReturn: 0.0251, inflationRate: 0.0067 },
  { year: 1962, stockReturn: -0.0873, bondReturn: 0.0730, inflationRate: 0.0122 },
  { year: 1963, stockReturn: 0.2280, bondReturn: 0.0206, inflationRate: 0.0165 },
  { year: 1964, stockReturn: 0.1648, bondReturn: 0.0435, inflationRate: 0.0119 },
  { year: 1965, stockReturn: 0.1245, bondReturn: 0.0046, inflationRate: 0.0192 },
  { year: 1966, stockReturn: -0.1006, bondReturn: 0.0362, inflationRate: 0.0335 },
  { year: 1967, stockReturn: 0.2398, bondReturn: -0.0119, inflationRate: 0.0304 },
  { year: 1968, stockReturn: 0.1106, bondReturn: 0.0051, inflationRate: 0.0472 },
  { year: 1969, stockReturn: -0.0850, bondReturn: -0.0507, inflationRate: 0.0611 },
  { year: 1970, stockReturn: 0.0401, bondReturn: 0.1653, inflationRate: 0.0549 },
  { year: 1971, stockReturn: 0.1431, bondReturn: 0.1323, inflationRate: 0.0336 },
  { year: 1972, stockReturn: 0.1898, bondReturn: 0.0568, inflationRate: 0.0341 },
  { year: 1973, stockReturn: -0.1466, bondReturn: 0.0129, inflationRate: 0.0880 },
  { year: 1974, stockReturn: -0.2647, bondReturn: 0.0535, inflationRate: 0.1220 },
  { year: 1975, stockReturn: 0.3723, bondReturn: 0.0919, inflationRate: 0.0694 },
  { year: 1976, stockReturn: 0.2384, bondReturn: 0.1675, inflationRate: 0.0486 },
  { year: 1977, stockReturn: -0.0718, bondReturn: 0.0077, inflationRate: 0.0670 },
  { year: 1978, stockReturn: 0.0656, bondReturn: 0.0012, inflationRate: 0.0903 },
  { year: 1979, stockReturn: 0.1844, bondReturn: 0.0067, inflationRate: 0.1329 },
  { year: 1980, stockReturn: 0.3242, bondReturn: -0.0395, inflationRate: 0.1252 },
  { year: 1981, stockReturn: -0.0491, bondReturn: 0.0185, inflationRate: 0.0894 },
  { year: 1982, stockReturn: 0.2155, bondReturn: 0.3297, inflationRate: 0.0387 },
  { year: 1983, stockReturn: 0.2256, bondReturn: 0.0041, inflationRate: 0.0380 },
  { year: 1984, stockReturn: 0.0627, bondReturn: 0.1543, inflationRate: 0.0395 },
  { year: 1985, stockReturn: 0.3216, bondReturn: 0.3090, inflationRate: 0.0328 },
  { year: 1986, stockReturn: 0.1847, bondReturn: 0.2446, inflationRate: 0.0113 },
  { year: 1987, stockReturn: 0.0525, bondReturn: -0.0046, inflationRate: 0.0441 },
  { year: 1988, stockReturn: 0.1661, bondReturn: 0.0867, inflationRate: 0.0442 },
  { year: 1989, stockReturn: 0.3169, bondReturn: 0.1811, inflationRate: 0.0465 },
  { year: 1990, stockReturn: -0.0310, bondReturn: 0.0618, inflationRate: 0.0661 },
  { year: 1991, stockReturn: 0.3055, bondReturn: 0.1930, inflationRate: 0.0306 },
  { year: 1992, stockReturn: 0.0762, bondReturn: 0.0846, inflationRate: 0.0290 },
  { year: 1993, stockReturn: 0.1008, bondReturn: 0.1445, inflationRate: 0.0275 },
  { year: 1994, stockReturn: 0.0132, bondReturn: -0.0777, inflationRate: 0.0267 },
  { year: 1995, stockReturn: 0.3758, bondReturn: 0.2337, inflationRate: 0.0254 },
  { year: 1996, stockReturn: 0.2296, bondReturn: 0.0013, inflationRate: 0.0333 },
  { year: 1997, stockReturn: 0.3336, bondReturn: 0.0970, inflationRate: 0.0170 },
  { year: 1998, stockReturn: 0.2858, bondReturn: 0.1449, inflationRate: 0.0155 },
  { year: 1999, stockReturn: 0.2104, bondReturn: -0.0751, inflationRate: 0.0268 },
  { year: 2000, stockReturn: -0.0910, bondReturn: 0.1722, inflationRate: 0.0339 },
  { year: 2001, stockReturn: -0.1189, bondReturn: 0.0551, inflationRate: 0.0155 },
  { year: 2002, stockReturn: -0.2210, bondReturn: 0.1515, inflationRate: 0.0240 },
  { year: 2003, stockReturn: 0.2869, bondReturn: 0.0201, inflationRate: 0.0188 },
  { year: 2004, stockReturn: 0.1088, bondReturn: 0.0481, inflationRate: 0.0327 },
  { year: 2005, stockReturn: 0.0491, bondReturn: 0.0343, inflationRate: 0.0336 },
  { year: 2006, stockReturn: 0.1579, bondReturn: 0.0197, inflationRate: 0.0254 },
  { year: 2007, stockReturn: 0.0549, bondReturn: 0.0984, inflationRate: 0.0407 },
  { year: 2008, stockReturn: -0.3700, bondReturn: 0.2034, inflationRate: 0.0009 },
  { year: 2009, stockReturn: 0.2646, bondReturn: -0.0826, inflationRate: 0.0272 },
  { year: 2010, stockReturn: 0.1506, bondReturn: 0.0854, inflationRate: 0.0164 },
  { year: 2011, stockReturn: 0.0211, bondReturn: 0.1675, inflationRate: 0.0300 },
  { year: 2012, stockReturn: 0.1600, bondReturn: 0.0297, inflationRate: 0.0177 },
  { year: 2013, stockReturn: 0.3239, bondReturn: -0.0901, inflationRate: 0.0150 },
  { year: 2014, stockReturn: 0.1369, bondReturn: 0.1086, inflationRate: 0.0080 },
  { year: 2015, stockReturn: 0.0138, bondReturn: 0.0087, inflationRate: 0.0073 },
  { year: 2016, stockReturn: 0.1196, bondReturn: 0.0069, inflationRate: 0.0224 },
  { year: 2017, stockReturn: 0.2183, bondReturn: 0.0241, inflationRate: 0.0221 },
  { year: 2018, stockReturn: -0.0438, bondReturn: 0.0002, inflationRate: 0.0181 },
  { year: 2019, stockReturn: 0.3149, bondReturn: 0.0867, inflationRate: 0.0228 },
  { year: 2020, stockReturn: 0.1840, bondReturn: 0.1104, inflationRate: 0.0123 },
  { year: 2021, stockReturn: 0.2871, bondReturn: -0.0254, inflationRate: 0.0700 },
  { year: 2022, stockReturn: -0.1811, bondReturn: -0.1731, inflationRate: 0.0652 },
  { year: 2023, stockReturn: 0.2638, bondReturn: 0.0463, inflationRate: 0.0324 },
];

/**
 * Get subset of historical data by year range
 */
export function getHistoricalDataByYearRange(
  startYear: number,
  endYear: number,
  data: HistoricalReturnsData[] = SAMPLE_HISTORICAL_DATA
): HistoricalReturnsData[] {
  return data.filter(d => d.year >= startYear && d.year <= endYear);
}
