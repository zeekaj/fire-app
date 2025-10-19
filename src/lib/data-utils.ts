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
