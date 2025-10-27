/**
 * Utility to add missing categories to existing user accounts
 * Run this if you need to add new categories after initial setup
 */

import { supabase, requireAuth } from './supabase';
import { insertWithOwnership } from './data-utils';

export async function addMissingCategories() {
  try {
    const userId = await requireAuth();

    console.log('🔍 Checking for missing categories...');

    // Get existing categories
    const { data: existing, error } = await supabase
      .from('categories')
      .select('id, name, path, parent_id')
      .eq('created_by', userId as any);

    if (error) throw error;

    const existingPaths = new Set(existing.map((c: any) => c.path));

    console.log(`Found ${existing.length} existing categories`);

    // Categories we want to ensure exist
    const desiredCategories = [
      { name: 'Phone', parent: 'Utilities' },
      { name: 'Cell Phone', parent: 'Utilities' },
    ];

    const toAdd = [];

    // Check what's missing
    for (const cat of desiredCategories) {
      const path = `${cat.parent}>${cat.name}`;
      if (!existingPaths.has(path)) {
        console.log(`  ➕ Missing: ${path}`);
        
        // Get parent ID
        const parent = existing.find((c: any) => c.name === cat.parent && !c.parent_id);
        if (!parent) {
          console.log(`  ⚠️  Parent "${cat.parent}" not found, skipping...`);
          continue;
        }

        toAdd.push({
          name: cat.name,
          parent_id: parent.id,
          path: path,
          is_envelope: false,
          is_budgetable: true,
          is_transfer: false,
          is_debt_service: false,
        });
      }
    }

    if (toAdd.length === 0) {
      console.log('✅ All categories exist!');
      return { added: 0 };
    }

    // Add missing categories
    console.log(`\n📝 Adding ${toAdd.length} missing categories...`);
    await insertWithOwnership('categories', toAdd);
    
    console.log('✅ Categories added successfully!');
    return { added: toAdd.length };

  } catch (error) {
    console.error('❌ Error adding categories:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).addMissingCategories = addMissingCategories;
  console.log('💡 Tip: Run addMissingCategories() in console to add missing categories');
}
