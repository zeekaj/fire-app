/**
 * Utility to clean up duplicate categories in the database
 * Run this once to remove duplicate entries
 * 
 * To use: Open browser console and run:
 * import('./lib/cleanup-duplicate-categories').then(m => m.cleanupDuplicateCategories())
 */

import { supabase, requireAuth } from './supabase';
import type { Database } from './database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export async function cleanupDuplicateCategories() {
  try {
    const userId = await requireAuth();

    console.log('🧹 Starting duplicate category cleanup...');

    // Get all categories for the user
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('created_by', userId as any)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const cats = categories as unknown as Category[];
    console.log(`📊 Found ${cats.length} total categories`);

    // Group by path (or name+parent_id for categories without paths)
    const groupedByKey = new Map<string, Category[]>();
    
    cats.forEach(cat => {
      const key = cat.path || `${cat.name}_${cat.parent_id || 'root'}`;
      if (!groupedByKey.has(key)) {
        groupedByKey.set(key, []);
      }
      groupedByKey.get(key)!.push(cat);
    });

    // Find duplicates
    const duplicates: Category[][] = [];
    groupedByKey.forEach((group, key) => {
      if (group.length > 1) {
        console.log(`🔍 Found ${group.length} duplicates for: ${key}`);
        duplicates.push(group);
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return { cleaned: 0, total: cats.length };
    }

    console.log(`⚠️  Found ${duplicates.length} groups of duplicates`);

    // For each duplicate group, keep the oldest (first created) and delete the rest
    let deletedCount = 0;
    for (const group of duplicates) {
      // Sort by created_at to keep the oldest
      const sorted = [...group].sort((a, b) => 
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
      
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`  ✓ Keeping "${toKeep.path || toKeep.name}", deleting ${toDelete.length} duplicates`);

      // Delete duplicates
      for (const cat of toDelete) {
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', cat.id);

        if (deleteError) {
          console.error(`  ❌ Failed to delete category ${cat.id}:`, deleteError);
        } else {
          deletedCount++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate categories`);
    console.log(`📊 Remaining categories: ${cats.length - deletedCount}`);
    
    return { 
      cleaned: deletedCount, 
      total: cats.length,
      remaining: cats.length - deletedCount 
    };

  } catch (error) {
    console.error('❌ Error cleaning up categories:', error);
    throw error;
  }
}

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).cleanupDuplicateCategories = cleanupDuplicateCategories;
  console.log('💡 Tip: Run cleanupDuplicateCategories() in console to clean up duplicate categories');
}
