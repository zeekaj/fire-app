/**
 * Data Utilities
 * 
 * Helpers for enforcing created_by and other data rules client-side.
 */

import { supabase, requireAuth } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

/**
 * Wraps insert operations to ensure created_by is set to auth.uid()
 */
export async function insertWithOwnership<T extends keyof Tables>(
  table: T,
  data: Omit<Tables[T]['Insert'], 'created_by'> | Omit<Tables[T]['Insert'], 'created_by'>[]
) {
  const userId = await requireAuth();

  const records = Array.isArray(data) ? data : [data];
  const recordsWithOwner = records.map((record) => ({
    ...record,
    created_by: userId,
  }));

  const { data: result, error } = await supabase
    .from(table)
    .insert(recordsWithOwner as any)
    .select();

  if (error) throw error;
  return result;
}

/**
 * Updates updated_at timestamp automatically
 */
export async function updateWithTimestamp<T extends keyof Tables>(
  table: T,
  id: string,
  data: Partial<Tables[T]['Update']>
) {
  const record = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // @ts-ignore - Generic type inference issue with Supabase client
  const { data: result, error } = await supabase
    .from(table)
    .update(record as any)
    .eq('id', id as any)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/**
 * Safely deletes a record (RLS will enforce ownership)
 */
export async function deleteRecord<T extends keyof Tables>(
  table: T,
  id: string
) {
  // @ts-ignore - Generic type inference issue with Supabase client
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id as any);

  if (error) throw error;
}

/**
 * Calculates age based on a date of birth string (YYYY-MM-DD).
 */
export function getAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validate transaction parameters client-side.
 * Returns a map of field errors (empty when valid).
 */
export function validateTransactionInput(params: {
  transactionType: 'expense' | 'income' | 'transfer' | 'payment';
  accountId?: string;
  accountType?: string;
  toAccountId?: string;
  toAccountType?: string;
  payeeName?: string;
  categoryId?: string;
  amount?: number | string;
  date?: string;
}) {
  const errors: Record<string, string> = {};

  const { transactionType, accountId, accountType, toAccountId, toAccountType, payeeName, categoryId, amount, date } = params;

  if (!accountId) errors.accountId = 'Account is required';

  const amt = typeof amount === 'string' ? parseFloat(amount || '') : (amount as number | undefined);
  if (amt === undefined || Number.isNaN(amt) || amt <= 0) {
    errors.amount = 'Valid positive amount is required';
  } else if (Math.abs(amt) > 1_000_000_000) {
    // Prevent accidental huge numbers
    errors.amount = 'Amount is unrealistically large';
  }

  if (!date) {
    errors.date = 'Date is required';
  } else {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      errors.date = 'Invalid date';
    } else {
      // Disallow dates more than 1 year in the future to catch accidental future entries
      const now = new Date();
      const oneYearFuture = new Date();
      oneYearFuture.setFullYear(now.getFullYear() + 1);
      if (parsed > oneYearFuture) {
        errors.date = 'Date is too far in the future';
      }
      // Disallow dates before 1900
      const minDate = new Date('1900-01-01');
      if (parsed < minDate) {
        errors.date = 'Date is too far in the past';
      }
    }
  }

  if (transactionType === 'transfer' || transactionType === 'payment') {
    if (!toAccountId) errors.toAccountId = 'Destination account is required';
    if (toAccountId && accountId && toAccountId === accountId) errors.toAccountId = 'Destination account must be different';
    // For transfers, ensure account types are compatible
    if (accountType && toAccountType) {
      const assetTypes = ['checking', 'savings', 'cash', 'asset', 'retirement', 'hsa', 'investment'];
      const liabilityTypes = ['credit', 'mortgage'];
      const isFromAsset = assetTypes.includes(accountType);
      const isToAsset = assetTypes.includes(toAccountType);
      const isFromLiability = liabilityTypes.includes(accountType);
      const isToLiability = liabilityTypes.includes(toAccountType);
      if ((isFromAsset && isToAsset) || (isFromLiability && isToLiability)) {
        // Asset to asset or liability to liability transfers are unusual but allowed
      } else if (isFromAsset && isToLiability) {
        // Paying down debt - allowed
      } else if (isFromLiability && isToAsset) {
        // Borrowing or charging - allowed
      }
    }
  } else {
    if (!payeeName || !payeeName.trim()) errors.payeeName = 'Payee is required';
    if (!categoryId) errors.categoryId = 'Category is required';
  }

  return errors;
}
