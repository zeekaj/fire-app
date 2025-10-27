/**
 * Formatting Utilities
 * 
 * Currency, date, and number formatting helpers for the FIRE app.
 */

/**
 * Format currency with USD symbol
 * Negatives display with leading minus in red (handled by CSS)
 * 
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(-145.23) // "- $145.23"
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return isNegative ? `- ${formatted}` : formatted;
}

/**
 * Format date as MM/DD/YYYY
 * Handles date strings without timezone conversion issues
 */
export function formatDate(date: string | Date): string {
  // If it's a string in YYYY-MM-DD format, parse it directly without timezone conversion
  if (typeof date === 'string') {
    const parts = date.split('T')[0].split('-'); // Handle both "YYYY-MM-DD" and ISO strings
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${month}/${day}/${year}`;
    }
  }
  
  // Fallback for Date objects
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 * Ensures no timezone conversion
 */
export function formatDateForInput(date: string | Date): string {
  // If already a string in correct format, return as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.split('T')[0];
  }
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format month as YYYY-MM
 */
export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse month string (YYYY-MM) to date
 */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 months")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 0 && diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
  if (diffDays < 0 && diffDays > -30) return `${Math.round(Math.abs(diffDays) / 7)} weeks ago`;
  if (diffDays > 0) return `In ${Math.round(diffDays / 30)} months`;
  return `${Math.round(Math.abs(diffDays) / 30)} months ago`;
}

/**
 * Determine if amount should be displayed as negative (red)
 */
export function isNegativeAmount(amount: number): boolean {
  return amount < 0;
}
