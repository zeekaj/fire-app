/**
 * useSmartPayeeSuggestions Hook
 * 
 * Provides intelligent payee suggestions based on:
 * - Usage frequency (most used first)
 * - Recent usage (recent payees get priority boost)
 * - Fuzzy search matching
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePayees } from './usePayees';
import { supabase, requireAuth } from '@/lib/supabase';

interface PayeeSuggestion {
  id: string;
  name: string;
  default_category_id: string | null;
  default_account_id: string | null;
  usage_count: number;
  last_used: string | null;
  score: number; // Calculated relevance score
}

interface PayeeUsageStats {
  payee_id: string;
  usage_count: number;
  last_used: string;
}

/**
 * Fetch payee usage statistics from transactions
 */
function usePayeeUsageStats() {
  return useQuery({
    queryKey: ['payee-usage-stats'],
    queryFn: async () => {
      const userId = await requireAuth();

      // Get payee usage stats from transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('payee_id, date')
        .eq('created_by', userId as any)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate usage stats
      const stats = new Map<string, PayeeUsageStats>();
      
      data.forEach((transaction) => {
        if (!transaction.payee_id) return;
        
        const existing = stats.get(transaction.payee_id);
        if (existing) {
          existing.usage_count++;
          // Keep the most recent date
          if (transaction.date > existing.last_used) {
            existing.last_used = transaction.date;
          }
        } else {
          stats.set(transaction.payee_id, {
            payee_id: transaction.payee_id,
            usage_count: 1,
            last_used: transaction.date,
          });
        }
      });

      return Array.from(stats.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Calculate relevance score for a payee suggestion
 */
function calculateRelevanceScore(
  usageCount: number,
  lastUsed: string | null,
  searchTerm: string,
  payeeName: string
): number {
  let score = 0;

  // Usage frequency score (0-50 points)
  score += Math.min(usageCount * 5, 50);

  // Recency score (0-30 points)
  if (lastUsed) {
    const daysSinceLastUse = (Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUse <= 7) score += 30; // Used within a week
    else if (daysSinceLastUse <= 30) score += 20; // Used within a month
    else if (daysSinceLastUse <= 90) score += 10; // Used within 3 months
  }

  // Name match score (0-20 points)
  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    const normalizedName = payeeName.toLowerCase();
    
    if (normalizedName.startsWith(normalizedSearch)) {
      score += 20; // Exact prefix match
    } else if (normalizedName.includes(normalizedSearch)) {
      score += 15; // Contains search term
    } else {
      // Check for fuzzy match (simple implementation)
      const words = normalizedName.split(' ');
      const matchingWords = words.filter(word => word.includes(normalizedSearch));
      if (matchingWords.length > 0) {
        score += 10; // Partial word match
      }
    }
  } else {
    // No search term - boost frequently used payees
    score += usageCount > 10 ? 15 : usageCount > 5 ? 10 : 5;
  }

  return score;
}

/**
 * Hook that provides smart payee suggestions with search filtering
 */
export function useSmartPayeeSuggestions(searchTerm = '', limit = 10) {
  const { data: payees = [] } = usePayees();
  const { data: usageStats = [] } = usePayeeUsageStats();

  const suggestions = useMemo(() => {
    // Create usage stats map for quick lookup
    const statsMap = new Map<string, PayeeUsageStats>();
    usageStats.forEach(stat => statsMap.set(stat.payee_id, stat));

    // Create suggestions with scores
    const suggestions: PayeeSuggestion[] = payees.map(payee => {
      const stats = statsMap.get(payee.id);
      const usageCount = stats?.usage_count || 0;
      const lastUsed = stats?.last_used || null;
      
      const score = calculateRelevanceScore(
        usageCount,
        lastUsed,
        searchTerm,
        payee.name
      );

      return {
        id: payee.id,
        name: payee.name,
        default_category_id: payee.default_category_id,
        default_account_id: payee.default_account_id,
        usage_count: usageCount,
        last_used: lastUsed,
        score,
      };
    });

    // Filter by search term if provided
    const filtered = searchTerm
      ? suggestions.filter(suggestion => {
          const normalizedSearch = searchTerm.toLowerCase();
          const normalizedName = suggestion.name.toLowerCase();
          
          // Include exact matches, prefix matches, and contains matches
          return normalizedName.includes(normalizedSearch) ||
                 normalizedName.startsWith(normalizedSearch) ||
                 normalizedName.split(' ').some(word => word.includes(normalizedSearch));
        })
      : suggestions;

    // Sort by score (highest first) and limit results
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [payees, usageStats, searchTerm, limit]);

  return {
    suggestions,
    isLoading: false, // Both queries handle their own loading states
    hasUsageData: usageStats.length > 0,
  };
}

/**
 * Hook to get the most frequently used payees (for quick access)
 */
export function useTopPayees(limit = 5) {
  const { suggestions } = useSmartPayeeSuggestions('', limit);
  
  return {
    topPayees: suggestions.filter(s => s.usage_count > 0),
    isLoading: false,
  };
}