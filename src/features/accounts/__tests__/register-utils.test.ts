import { computeRunningBalances, sortChronologicalByDateCreatedAt } from '@/features/accounts/utils/register';

describe('register utils', () => {
  test('sortChronologicalByDateCreatedAt sorts by date then created_at', () => {
    const rows = [
      { id: 'b', date: '2025-10-10', created_at: '2025-10-10T12:00:00Z', amount: 0 },
      { id: 'a', date: '2025-10-10', created_at: '2025-10-10T08:00:00Z', amount: 0 },
      { id: 'c', date: '2025-10-09', created_at: '2025-10-09T08:00:00Z', amount: 0 },
    ];

    const sorted = sortChronologicalByDateCreatedAt(rows);
    expect(sorted.map(r => r.id)).toEqual(['c', 'a', 'b']);
  });

  test('computeRunningBalances for asset accounts', () => {
    const txs = [
      { date: '2025-10-01', created_at: '2025-10-01T01:00:00Z', amount: 100 },
      { date: '2025-10-02', created_at: '2025-10-02T01:00:00Z', amount: -50 },
    ];
    const result = computeRunningBalances(txs, 100, false);
    expect(result.map(r => r.runningBalance)).toEqual([200, 150]);
  });

  test('computeRunningBalances for liability accounts (charges increase balance)', () => {
    const txs = [
      { date: '2025-10-01', created_at: '2025-10-01T01:00:00Z', amount: -50 }, // charge
      { date: '2025-10-02', created_at: '2025-10-02T01:00:00Z', amount: 50 }, // payment
    ];
    const result = computeRunningBalances(txs, 0, true);
    expect(result.map(r => r.runningBalance)).toEqual([50, 0]);
  });
});
