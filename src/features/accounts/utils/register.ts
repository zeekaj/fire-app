/**
 * Register utilities
 * - Chronological sort by date then created_at
 * - Running balance computation with asset/liability semantics
 */

export type WithDateCreatedAmount = {
  date: string; // YYYY-MM-DD
  created_at?: string | null; // ISO string
  amount: number;
};

/**
 * Sort ascending by date, then by created_at for stable same-day ordering.
 */
export function sortChronologicalByDateCreatedAt<T extends WithDateCreatedAmount>(txs: T[]): T[] {
  return [...txs].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const aCreated = a.created_at || '';
    const bCreated = b.created_at || '';
    return aCreated < bCreated ? -1 : (aCreated > bCreated ? 1 : 0);
  });
}

/**
 * Compute running balances from an opening balance.
 *
 * Rules:
 * - For asset accounts: positive amounts increase balance, negative decrease.
 * - For liability accounts: negative amounts (charges) increase balance, positive amounts (payments) decrease.
 */
export function computeRunningBalances<T extends WithDateCreatedAmount, R extends T & { runningBalance: number }>(
  txsChronological: T[],
  openingBalance: number,
  isLiability: boolean
): R[] {
  let running = openingBalance || 0;
  return txsChronological.map((tx) => {
    running += isLiability ? -tx.amount : tx.amount;
    return { ...(tx as any), runningBalance: running } as R;
  });
}
