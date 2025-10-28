/**
 * Utility to fix account types
 * Run this in the browser console to fix misclassified accounts
 * 
 * Usage:
 * import('./lib/fix-account-type').then(m => m.fixAccountType('Ally Emergency Fund', 'savings'))
 */

import { supabase, requireAuth } from './supabase';

export async function fixAccountType(accountName: string, newType: string) {
  try {
    const userId = await requireAuth();

    console.log(`🔍 Looking for account: "${accountName}"...`);

    // Find the account
    const { data: accounts, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('created_by', userId as any)
      .ilike('name', `%${accountName}%`);

    if (fetchError) throw fetchError;

    if (!accounts || accounts.length === 0) {
      console.error(`❌ No account found matching: "${accountName}"`);
      return;
    }

    if (accounts.length > 1) {
      console.log(`⚠️  Found ${accounts.length} matching accounts:`);
      accounts.forEach((acc: any) => {
        console.log(`  - ${acc.name} (type: ${acc.type})`);
      });
      console.log(`Please be more specific or update the first one manually.`);
      return;
    }

    const account = accounts[0];
    console.log(`✓ Found account: "${account.name}" (current type: ${account.type})`);

    // Update the account type
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ type: newType })
      .eq('id', account.id);

    if (updateError) throw updateError;

    console.log(`✅ Successfully updated "${account.name}" to type: ${newType}`);
    console.log(`🔄 Refreshing page to see changes...`);
    
    // Reload the page to see changes
    setTimeout(() => window.location.reload(), 1000);

  } catch (error) {
    console.error('❌ Error updating account:', error);
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).fixAccountType = fixAccountType;
  console.log('💡 Tip: Run fixAccountType("Ally Emergency Fund", "savings") in console to fix the account type');
}
