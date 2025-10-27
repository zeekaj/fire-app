import { useMemo } from 'react';
import type { Database } from '../../../lib/database.types';
import { formatCurrency, formatDate } from '../../../lib/format';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Payee = Database['public']['Tables']['payees']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface SmartFeaturesProps {
  transactions: Transaction[];
  payees: Payee[];
  categories: Category[];
}

interface DuplicateGroup {
  transactions: Transaction[];
  amount: number;
  date: string;
  payeeId: string | null;
}

interface RecurringPattern {
  payeeId: string;
  payeeName: string;
  amount: number;
  categoryId: string | null;
  categoryName: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  count: number;
  confidence: number;
}

interface AutoCategorizeRule {
  payeeId: string;
  payeeName: string;
  categoryId: string;
  categoryName: string;
  confidence: number;
  transactionCount: number;
}

export function SmartFeatures({ transactions, payees, categories }: SmartFeaturesProps) {
  // Helper to get leaf category name from path
  const getCategoryLeafName = (category: Category) => {
    if (category.path) {
      const parts = category.path.split('>');
      return parts[parts.length - 1];
    }
    return category.name;
  };

  const payeeMap = useMemo(() => new Map(payees.map(p => [p.id, p.name])), [payees]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, getCategoryLeafName(c)])), [categories]);

  // Detect duplicate transactions (same amount, date, payee within 24 hours, excluding transfers)
  const duplicates = useMemo(() => {
    const groups: DuplicateGroup[] = [];
    // Filter out transfers
    const nonTransferTx = transactions.filter(tx => !tx.transfer_id);
    const sortedTx = [...nonTransferTx].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sortedTx.length - 1; i++) {
      const tx1 = sortedTx[i];
      const tx2 = sortedTx[i + 1];

      // Check if duplicate
      if (
        Math.abs(tx1.amount) === Math.abs(tx2.amount) &&
        tx1.payee_id === tx2.payee_id &&
        tx1.payee_id !== null
      ) {
        const date1 = new Date(tx1.date);
        const date2 = new Date(tx2.date);
        const hoursDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);

        if (hoursDiff <= 24) {
          // Check if already in a group
          const existingGroup = groups.find(g => 
            g.transactions.some(t => t.id === tx1.id || t.id === tx2.id)
          );

          if (existingGroup) {
            if (!existingGroup.transactions.find(t => t.id === tx2.id)) {
              existingGroup.transactions.push(tx2);
            }
          } else {
            groups.push({
              transactions: [tx1, tx2],
              amount: tx1.amount,
              date: tx1.date,
              payeeId: tx1.payee_id
            });
          }
        }
      }
    }

    return groups;
  }, [transactions]);

  // Detect recurring transaction patterns (excluding transfers)
  const recurringPatterns = useMemo(() => {
    const payeeTransactions = new Map<string, Transaction[]>();

    // Group by payee, filter out transfers
    transactions.forEach(tx => {
      if (tx.payee_id && !tx.transfer_id) {
        const existing = payeeTransactions.get(tx.payee_id) || [];
        existing.push(tx);
        payeeTransactions.set(tx.payee_id, existing);
      }
    });

    const patterns: RecurringPattern[] = [];

    payeeTransactions.forEach((txs, payeeId) => {
      if (txs.length < 3) return; // Need at least 3 transactions to detect pattern

      // Sort by date
      const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

      // Calculate intervals between transactions
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const days = Math.abs(
          new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()
        ) / (1000 * 60 * 60 * 24);
        intervals.push(days);
      }

      // Check for weekly pattern (7 days ± 2)
      const weeklyCount = intervals.filter(d => d >= 5 && d <= 9).length;
      const monthlyCount = intervals.filter(d => d >= 28 && d <= 32).length;
      const yearlyCount = intervals.filter(d => d >= 360 && d <= 370).length;

      let frequency: 'weekly' | 'monthly' | 'yearly' | null = null;
      let count = 0;

      if (weeklyCount >= 2) {
        frequency = 'weekly';
        count = weeklyCount;
      } else if (monthlyCount >= 2) {
        frequency = 'monthly';
        count = monthlyCount;
      } else if (yearlyCount >= 1) {
        frequency = 'yearly';
        count = yearlyCount;
      }

      if (frequency) {
        // Find most common amount
        const amounts = sorted.map(t => Math.abs(t.amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        // Find most common category
        const categories = sorted.map(t => t.category_id).filter(c => c);
        const categoryCount = new Map<string, number>();
        categories.forEach(c => {
          if (c) categoryCount.set(c, (categoryCount.get(c) || 0) + 1);
          });
        const mostCommonCategory = Array.from(categoryCount.entries())
          .sort((a, b) => b[1] - a[1])[0];

        const confidence = count / intervals.length;

        patterns.push({
          payeeId,
          payeeName: payeeMap.get(payeeId) || 'Unknown',
          amount: avgAmount,
          categoryId: mostCommonCategory?.[0] || null,
          categoryName: mostCommonCategory?.[0] 
            ? categoryMap.get(mostCommonCategory[0]) || 'Uncategorized'
            : 'Uncategorized',
          frequency,
          count: count + 1, // +1 because intervals are between transactions
          confidence
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }, [transactions, payeeMap, categoryMap]);

  // Suggest auto-categorization rules based on payee history (excluding transfers)
  const autoCategorizeRules = useMemo(() => {
    const payeeCategories = new Map<string, Map<string, number>>();

    // Count category usage per payee, filter out transfers
    transactions.forEach(tx => {
      if (tx.payee_id && tx.category_id && !tx.transfer_id) {
        if (!payeeCategories.has(tx.payee_id)) {
          payeeCategories.set(tx.payee_id, new Map());
        }
        const categories = payeeCategories.get(tx.payee_id)!;
        categories.set(tx.category_id, (categories.get(tx.category_id) || 0) + 1);
      }
    });

    const rules: AutoCategorizeRule[] = [];

    payeeCategories.forEach((categories, payeeId) => {
      const total = Array.from(categories.values()).reduce((a, b) => a + b, 0);
      
      // Find most common category
      const entries = Array.from(categories.entries());
      const [categoryId, count] = entries.sort((a, b) => b[1] - a[1])[0];
      
      const confidence = count / total;

      // Only suggest if confidence >= 70% and at least 3 transactions
      if (confidence >= 0.7 && count >= 3) {
        rules.push({
          payeeId,
          payeeName: payeeMap.get(payeeId) || 'Unknown',
          categoryId,
          categoryName: categoryMap.get(categoryId) || 'Uncategorized',
          confidence,
          transactionCount: count
        });
      }
    });

    return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }, [transactions, payeeMap, categoryMap]);

  return (
    <div className="space-y-6">
      {/* Duplicate Detection */}
      {duplicates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Possible Duplicate Transactions
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                Found {duplicates.length} group{duplicates.length !== 1 ? 's' : ''} of transactions that might be duplicates
              </p>
              <div className="space-y-3">
                {duplicates.slice(0, 5).map((group, idx) => (
                  <div key={idx} className="bg-white rounded-md p-3 border border-yellow-300">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {payeeMap.get(group.payeeId || '') || 'Unknown'} - {formatCurrency(group.amount)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {group.transactions.length} transactions on {formatDate(group.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Patterns */}
      {recurringPatterns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔄</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Recurring Transaction Patterns
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Detected {recurringPatterns.length} recurring pattern{recurringPatterns.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {recurringPatterns.map((pattern, idx) => (
                  <div key={idx} className="bg-white rounded-md p-3 border border-blue-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pattern.payeeName}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formatCurrency(pattern.amount)} · {pattern.frequency} · {pattern.categoryName}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {pattern.count} occurrences · {(pattern.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Categorization Suggestions */}
      {autoCategorizeRules.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Auto-Categorization Rules
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Based on your transaction history, these payees consistently use specific categories
              </p>
              <div className="space-y-3">
                {autoCategorizeRules.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-md p-3 border border-green-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {rule.payeeName} → {rule.categoryName}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {rule.transactionCount} transactions · {(rule.confidence * 100).toFixed(0)}% consistency
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => alert('Auto-categorization rule creation coming soon!')}
                      >
                        Create Rule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Insights */}
      {duplicates.length === 0 && recurringPatterns.length === 0 && autoCategorizeRules.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Insights Available Yet
          </h3>
          <p className="text-sm text-gray-600">
            Add more transactions to see smart suggestions and patterns
          </p>
        </div>
      )}
    </div>
  );
}
