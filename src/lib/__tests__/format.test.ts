import { formatCurrency, formatDate, formatMonth, formatPercent, formatCompact, isNegativeAmount } from '@/lib/format';

describe('format utils (smoke)', () => {
  test('formatCurrency formats positive and negative amounts', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(-145.23)).toBe('- $145.23');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('formatDate handles YYYY-MM-DD strings', () => {
    expect(formatDate('2025-10-05')).toBe('10/05/2025');
  });

  test('formatMonth and formatPercent', () => {
    expect(formatMonth('2025-11-01')).toBe('2025-11');
    expect(formatPercent(12.345, 1)).toBe('12.3%');
  });

  test('formatCompact adds suffix for thousands and millions', () => {
    expect(formatCompact(950)).toBe('$950.00');
    expect(formatCompact(12_300)).toBe('$12.3K');
    expect(formatCompact(5_200_000)).toBe('$5.2M');
  });

  test('isNegativeAmount', () => {
    expect(isNegativeAmount(-1)).toBe(true);
    expect(isNegativeAmount(0)).toBe(false);
    expect(isNegativeAmount(1)).toBe(false);
  });
});
