# Analytics & Net Worth Update — November 3, 2025

This document summarizes today’s improvements to analytics and the Net Worth History experience.

## Debt Payments Analytics: Exclude Credit Card Payoffs

### What changed
Debt payments analytics now exclude credit card payoffs to avoid double-counting. Purchases charged to credit cards are already counted as expenses; counting the payoff again as a debt payment would inflate outflows.

### How it works (logic)
- We only consider the withdrawal side of debt payments (negative amount) with `transaction_type = 'debt_payment'`.
- We find the paired deposit transaction via `transfer_id`.
- If the paired deposit’s account type is a credit account (`credit` or `credit_card`), we exclude the payment from “Debt Payments”.
- Loan/mortgage payments continue to be included.

### Where it applies
- Financial Analytics
  - Type breakdown pie
  - Monthly trends (Income, Expenses & Debt Payments)
  - Debt Payment Progress card
  - Summary stats (totals and net savings)
- Transaction Analytics
  - Debt payment totals, counts, and monthly aggregation

### Rationale
- Prevents counting the same spending twice (purchase as expense, then payoff as debt payment).
- Keeps “Debt Payments” focused on true amortizing debts (loans, mortgages).

### Assumptions & caveats
- Transfers are created in linked pairs using `transfer_id`.
- Account types for liabilities are standardized to include credit accounts as `credit` or `credit_card`.
- Historical data that predates these conventions may need cleanup for perfect alignment.

### Developer notes
- Files touched:
  - `src/features/dashboard/components/FinancialAnalytics.tsx`
  - `src/features/transactions/components/TransactionAnalytics.tsx`
- Implementation details:
  - Built an `accountsById` map to resolve paired account type quickly.
  - Filtered the debt payment withdrawal set to exclude those where the paired deposit account type is credit.

### QA checklist
- [ ] Add an expense on a checking account, pay the credit card via transfer marked as debt payment → “Debt Payments” does not increase.
- [ ] Make a loan payment via transfer marked as debt payment → “Debt Payments” increases.
- [ ] Summary stats and charts reflect the above accurately across ranges.

---

## Net Worth History: Header polish & help

### What changed
- Backfill button added to the chart header (not just empty state).
- Snapshot and Backfill buttons now include labels (with accessible titles and ARIA labels).
- Contextual help on the chart title (topic: `net-worth`).
- “Last snapshot” date appears under the subtitle and auto-updates after actions.

### Developer notes
- Files touched:
  - `src/features/dashboard/components/NetWorthHistoryChart.tsx`
  - `src/components/ContextualHelp.tsx` (new `net-worth` topic)
  - `src/features/dashboard/hooks/useNetWorthHistory.ts` (latest snapshot hook + invalidations)

### Verify quickly
- [ ] Take Snapshot → Header "Last snapshot" updates to today.
- [ ] Backfill (3M/6M) → Chart populates; header shows most recent date.
- [ ] Toggle Breakdown → Switches between Net Worth and Assets/Liabilities.
- [ ] Hover/click title → Contextual help appears.

---

## Notes
- These changes are UI/data-layer only; no DB migrations required.
- If you add new account types for credit in the future, include them in the exclusion list.

