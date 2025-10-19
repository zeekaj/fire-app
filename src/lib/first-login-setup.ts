/**
 * First Login Setup
 * 
 * Creates default account groups, accounts, and category hierarchy on first app login.
 * Also creates settings record if missing.
 */

import { supabase, requireAuth } from './supabase';
import { insertWithOwnership } from './data-utils';
import { logger, logSetup } from './logger';

/**
 * Default account groups to create on first login
 */
interface AccountGroupSeed {
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

const DEFAULT_ACCOUNT_GROUPS: AccountGroupSeed[] = [
  { name: 'Checking', icon: 'bank', color: '#2E86AB', sort_order: 1 },
  { name: 'Savings', icon: 'piggy-bank', color: '#10B981', sort_order: 2 },
  { name: 'Credit Card', icon: 'credit-card', color: '#F59E0B', sort_order: 3 },
  { name: 'Investment', icon: 'trending-up', color: '#8B5CF6', sort_order: 4 },
  { name: 'Retirement', icon: 'shield', color: '#14B8A6', sort_order: 5 },
  { name: 'HSA', icon: 'heart', color: '#06B6D4', sort_order: 6 },
  { name: 'Mortgage', icon: 'home', color: '#EF4444', sort_order: 7 },
  { name: 'Cash', icon: 'wallet', color: '#6B7280', sort_order: 8 },
  { name: 'Asset', icon: 'box', color: '#6366F1', sort_order: 9 },
];

/**
 * FIRE-tuned category hierarchy with envelope defaults
 */
interface CategorySeed {
  name: string;
  parent?: string; // parent category name
  is_envelope?: boolean;
  is_budgetable?: boolean;
  is_transfer?: boolean;
  is_debt_service?: boolean;
}

const DEFAULT_CATEGORIES: CategorySeed[] = [
  // Top-level categories
  { name: 'Income', is_budgetable: false },
  { name: 'Housing' },
  { name: 'Transportation' },
  { name: 'Food' },
  { name: 'Utilities' },
  { name: 'Healthcare' },
  { name: 'Insurance' },
  { name: 'Debt Payments', is_debt_service: true },
  { name: 'Savings & Investments', is_budgetable: false, is_transfer: true },
  { name: 'Personal' },
  { name: 'Entertainment' },
  { name: 'Giving' },
  { name: 'Travel', is_envelope: true },
  { name: 'Taxes', is_budgetable: false },
  { name: 'Uncategorized' },

  // Income subcategories
  { name: 'Salary', parent: 'Income' },
  { name: 'Bonus', parent: 'Income' },
  { name: 'Side Hustle', parent: 'Income' },
  { name: 'Investment Income', parent: 'Income' },

  // Housing subcategories
  { name: 'Rent/Mortgage', parent: 'Housing' },
  { name: 'Property Tax', parent: 'Housing', is_envelope: true },
  { name: 'Home Insurance', parent: 'Housing' },
  { name: 'HOA Fees', parent: 'Housing' },
  { name: 'Repairs', parent: 'Housing', is_envelope: true },
  { name: 'Furniture', parent: 'Housing' },

  // Transportation
  { name: 'Car Payment', parent: 'Transportation' },
  { name: 'Gas', parent: 'Transportation' },
  { name: 'Car Insurance', parent: 'Transportation' },
  { name: 'Car Maintenance', parent: 'Transportation', is_envelope: true },
  { name: 'Public Transit', parent: 'Transportation' },
  { name: 'Parking', parent: 'Transportation' },

  // Food
  { name: 'Groceries', parent: 'Food' },
  { name: 'Restaurants', parent: 'Food' },
  { name: 'Coffee Shops', parent: 'Food' },

  // Utilities
  { name: 'Electric', parent: 'Utilities' },
  { name: 'Water', parent: 'Utilities' },
  { name: 'Gas', parent: 'Utilities' },
  { name: 'Internet', parent: 'Utilities' },
  { name: 'Phone', parent: 'Utilities' },
  { name: 'Trash', parent: 'Utilities' },

  // Healthcare
  { name: 'Health Insurance', parent: 'Healthcare' },
  { name: 'Medical', parent: 'Healthcare', is_envelope: true },
  { name: 'Dental', parent: 'Healthcare' },
  { name: 'Vision', parent: 'Healthcare' },
  { name: 'Prescriptions', parent: 'Healthcare' },

  // Insurance (non-health, non-auto, non-home)
  { name: 'Life Insurance', parent: 'Insurance' },
  { name: 'Disability Insurance', parent: 'Insurance' },
  { name: 'Umbrella Policy', parent: 'Insurance' },

  // Debt Payments
  { name: 'Credit Card Payment', parent: 'Debt Payments' },
  { name: 'Student Loan', parent: 'Debt Payments' },
  { name: 'Personal Loan', parent: 'Debt Payments' },

  // Savings & Investments
  { name: 'Emergency Fund', parent: 'Savings & Investments' },
  { name: '401k Contribution', parent: 'Savings & Investments' },
  { name: 'IRA Contribution', parent: 'Savings & Investments' },
  { name: 'HSA Contribution', parent: 'Savings & Investments' },
  { name: 'Brokerage', parent: 'Savings & Investments' },

  // Personal
  { name: 'Clothing', parent: 'Personal' },
  { name: 'Gym', parent: 'Personal' },
  { name: 'Hobbies', parent: 'Personal' },
  { name: 'Gifts', parent: 'Personal', is_envelope: true },
  { name: 'Annual Subscriptions', parent: 'Personal', is_envelope: true },
  { name: 'Personal Care', parent: 'Personal' },

  // Entertainment
  { name: 'Streaming Services', parent: 'Entertainment' },
  { name: 'Movies', parent: 'Entertainment' },
  { name: 'Concerts', parent: 'Entertainment' },
  { name: 'Sports', parent: 'Entertainment' },

  // Giving
  { name: 'Charity', parent: 'Giving' },
  { name: 'Church', parent: 'Giving' },

  // Taxes
  { name: 'Federal Tax', parent: 'Taxes' },
  { name: 'State Tax', parent: 'Taxes' },
  { name: 'Estimated Tax', parent: 'Taxes' },
];

/**
 * Run first-time setup for new user
 */
export async function runFirstLoginSetup(): Promise<void> {
  const userId = await requireAuth();

  try {
    // Check if setup already completed (check for accounts)
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);

    if (checkError) {
      logger.error('Error checking existing accounts', checkError);
    }

    if (existingAccounts && existingAccounts.length > 0) {
      logSetup('Setup already completed');
      return;
    }

    logSetup('Running first-time setup...');

    // Use a flag to prevent concurrent runs
    const setupKey = `setup_running_${userId}`;
    const isRunning = sessionStorage.getItem(setupKey);
    
    if (isRunning) {
      logSetup('Setup already in progress, skipping...');
      return;
    }
    
    sessionStorage.setItem(setupKey, 'true');

    try {
      // 1. Create default account groups
      const groupMap = await createDefaultAccountGroups();

      // 2. Create default accounts linked to groups
      await createDefaultAccounts(groupMap);

      // 3. Create category hierarchy
      await createCategoryHierarchy();

      // 4. Create settings record
      await createSettings(userId);

      logSetup('First-time setup completed successfully');
    } finally {
      sessionStorage.removeItem(setupKey);
    }
  } catch (error) {
    logger.error('Error during first-time setup', error);
    throw error;
  }
}

/**
 * Create default account groups
 */
async function createDefaultAccountGroups(): Promise<Map<string, string>> {
  const groups = DEFAULT_ACCOUNT_GROUPS.map((group) => ({
    name: group.name,
    icon: group.icon,
    color: group.color,
    sort_order: group.sort_order,
    is_system: true,
  }));

  try {
    const createdGroups = await insertWithOwnership('account_groups', groups);
    
    // Create a map of group name -> id for account creation
    const groupMap = new Map<string, string>();
    createdGroups?.forEach((group: any) => {
      groupMap.set(group.name, group.id);
    });

    logSetup(`Created ${groups.length} default account groups`);
    return groupMap;
  } catch (error: any) {
    // Check if it's a unique constraint violation (expected if already exists)
    if (error?.code === '23505') {
      logSetup('Account groups already exist, fetching existing...');
      
      // Fetch existing groups
      const groupNames = DEFAULT_ACCOUNT_GROUPS.map(g => g.name);
      const { data: existingGroups } = await supabase
        .from('account_groups')
        .select('id, name')
        .in('name', groupNames as any);
      
      const groupMap = new Map<string, string>();
      existingGroups?.forEach((group: any) => {
        groupMap.set(group.name, group.id);
      });
      
      return groupMap;
    }
    throw error;
  }
}

/**
 * Create default accounts linked to account groups
 */
async function createDefaultAccounts(groupMap: Map<string, string>) {
  const accounts = DEFAULT_ACCOUNT_GROUPS.map((group) => ({
    name: group.name,
    type: group.name.toLowerCase().replace(/\s+/g, '_'), // DEPRECATED: Kept for backward compatibility. TODO(v2.0): Remove this field
    account_group_id: groupMap.get(group.name),
    opening_balance: 0,
    current_balance: 0,
  }));

  try {
    await insertWithOwnership('accounts', accounts);
    logSetup(`Created ${accounts.length} default accounts`);
  } catch (error: any) {
    // Check if it's a unique constraint violation (expected if already exists)
    if (error?.code === '23505') {
      logSetup('Accounts already exist, skipping creation');
      return;
    }
    throw error;
  }
}

/**
 * Create category hierarchy with paths
 */
async function createCategoryHierarchy() {
  try {
    // First, create all top-level categories (no parent)
    const topLevel = DEFAULT_CATEGORIES.filter((cat) => !cat.parent);
    const topLevelRecords = topLevel.map((cat) => ({
      name: cat.name,
      path: cat.name,
      is_envelope: cat.is_envelope ?? false,
      is_budgetable: cat.is_budgetable ?? true,
      is_transfer: cat.is_transfer ?? false,
      is_debt_service: cat.is_debt_service ?? false,
      parent_id: null,
    }));

    const createdTopLevel = await insertWithOwnership('categories', topLevelRecords);

    // Create a map of name -> id for parent lookup
    const categoryMap = new Map<string, string>();
    createdTopLevel?.forEach((cat: any) => {
      categoryMap.set(cat.name, cat.id);
    });

    // Now create subcategories with parent_id and path
    const subCategories = DEFAULT_CATEGORIES.filter((cat) => cat.parent);
    const subCategoryRecords = subCategories.map((cat) => {
      const parentId = categoryMap.get(cat.parent!);
      if (!parentId) {
        throw new Error(`Parent category not found: ${cat.parent}`);
      }
      return {
        name: cat.name,
        parent_id: parentId,
        path: `${cat.parent}>${cat.name}`,
        is_envelope: cat.is_envelope ?? false,
        is_budgetable: cat.is_budgetable ?? true,
        is_transfer: cat.is_transfer ?? false,
        is_debt_service: cat.is_debt_service ?? false,
      };
    });

    await insertWithOwnership('categories', subCategoryRecords);
    logSetup(
      `Created ${topLevel.length} top-level and ${subCategories.length} subcategories`
    );
  } catch (error: any) {
    // Check if it's a unique constraint violation (expected if already exists)
    if (error?.code === '23505') {
      logSetup('Categories already exist, skipping creation');
      return;
    }
    throw error;
  }
}

/**
 * Create settings record
 */
async function createSettings(userId: string) {
  const { error } = await supabase.from('settings').insert({
    created_by: userId,
    learning: {},
    feature_flags: {},
    export_prefs: {},
  } as any);

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }

  logSetup('Created settings record');
}
