// Mock the supabase import which references `import.meta.env` and would
// break Jest's CommonJS runtime. We only need to ensure the module exists
// for imports in `data-utils`.
jest.mock('../supabase', () => ({
  supabase: {},
  requireAuth: async () => 'test-user',
}));

import { validateTransactionInput } from '../data-utils';

describe('validateTransactionInput', () => {
  it('returns no errors for a valid expense', () => {
    const errors = validateTransactionInput({
      transactionType: 'expense',
      accountId: 'acc_1',
      payeeName: 'Grocery',
      categoryId: 'cat_food',
      amount: 25.5,
      date: new Date().toISOString().split('T')[0],
    });

    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('returns errors when account is missing', () => {
    const errors = validateTransactionInput({
      transactionType: 'expense',
      accountId: '',
      payeeName: 'Grocery',
      categoryId: 'cat_food',
      amount: 25.5,
      date: new Date().toISOString().split('T')[0],
    });

    expect(errors.accountId).toBeDefined();
  });

  it('returns error for transfer to same account', () => {
    const errors = validateTransactionInput({
      transactionType: 'transfer',
      accountId: 'acc_1',
      toAccountId: 'acc_1',
      amount: 100,
      date: new Date().toISOString().split('T')[0],
    });

    expect(errors.toAccountId).toBe('Destination account must be different');
  });

  it('rejects dates too far in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    const errors = validateTransactionInput({
      transactionType: 'expense',
      accountId: 'acc_1',
      payeeName: 'Grocery',
      categoryId: 'cat_food',
      amount: 10,
      date: futureDate.toISOString().split('T')[0],
    });

    expect(errors.date).toBeDefined();
  });

  it('rejects unrealistically large amounts', () => {
    const errors = validateTransactionInput({
      transactionType: 'income',
      accountId: 'acc_1',
      payeeName: 'Employer',
      categoryId: 'cat_income',
      amount: 2_000_000_000,
      date: new Date().toISOString().split('T')[0],
    });

    expect(errors.amount).toBe('Amount is unrealistically large');
  });

  it('rejects dates too far in the past', () => {
    const errors = validateTransactionInput({
      transactionType: 'expense',
      accountId: 'acc_1',
      payeeName: 'Grocery',
      categoryId: 'cat_food',
      amount: 10,
      date: '1899-12-31',
    });

    expect(errors.date).toBe('Date is too far in the past');
  });

  it('requires positive amount', () => {
    const errors = validateTransactionInput({
      transactionType: 'expense',
      accountId: 'acc_1',
      payeeName: 'Grocery',
      categoryId: 'cat_food',
      amount: -10,
      date: new Date().toISOString().split('T')[0],
    });

    expect(errors.amount).toBe('Valid positive amount is required');
  });

  it('validates transfer between different account types', () => {
    const errors = validateTransactionInput({
      transactionType: 'transfer',
      accountId: 'acc_checking',
      accountType: 'checking',
      toAccountId: 'acc_credit',
      toAccountType: 'credit',
      amount: 100,
      date: new Date().toISOString().split('T')[0],
    });

    expect(Object.keys(errors)).toHaveLength(0);
  });
});
