# FIRE Finance App - User Guide

Welcome to your enhanced FIRE Finance app! Here's what's new and how to use each feature.

---

## 🏠 Dashboard Tab

Your financial overview at a glance.

### Top Metrics (4 Tiles)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Net Worth    │ │ This Month's │ │ Savings Rate │ │ FIRE Progress│
│ $45,000      │ │ Spending     │ │ 55.0%        │ │ 15.2%        │
│ Across 5     │ │ $2,500       │ │ This month   │ │ ~25.3 years  │
│ accounts     │ │ Income:$5,500│ │              │ │ to FI        │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### FIRE Number Details
Shows your FIRE goal calculation based on the 4% rule:
- Annual expenses
- FIRE number (25x annual expenses)
- Current net worth
- Remaining to reach FI
- Circular progress indicator

### Quick Stats (4 Cards)
- Accounts count
- Transactions count
- Monthly income
- Monthly savings

### 📊 Spending Trends Chart
Line chart showing the last 6 months:
- **Green line:** Monthly income
- **Red line:** Monthly spending
- **Blue line:** Monthly savings

**How to use:**
- Hover over any point to see exact amounts
- Look for trends (increasing/decreasing)
- Compare income vs spending gaps

### 🥧 Category Breakdown Chart
Pie chart of this month's spending by category:
- Shows top 8 categories
- Percentage labels on each slice
- Total spending at top

**How to use:**
- Identify your biggest spending categories
- Look for surprises or areas to optimize
- Click legend items to highlight slices

### 📅 Upcoming Bills
Shows next 5 bills due in 30 days:
- Bill name and payee
- Amount due
- Days until due (color-coded)
- Total upcoming amount

**Color coding:**
- Gray: More than 7 days away
- Yellow: 4-7 days away
- Orange: 1-3 days away
- Red: Overdue

---

## 💵 Budgets Tab

Manage your monthly spending targets.

### Month Navigation
Use `◀ ▶` arrows to navigate between months.

### Summary Cards
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total        │ │ Total Spent  │ │ Remaining    │
│ Budgeted     │ │              │ │              │
│ $3,000       │ │ $2,400       │ │ $600         │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 📊 Budget Overview Chart
Horizontal bar chart showing all budgets:
- Bars sorted by percent used (highest first)
- Color-coded by status:
  - 🟢 Green: On track (<75%)
  - 🟠 Amber: Caution (75-90%)
  - 🟡 Yellow: Warning (90-100%)
  - 🔴 Red: Over budget (≥100%)

**How to use:**
- Quickly spot over-budget categories
- See which budgets are doing well
- Hover for detailed spent/budgeted info

### Budget List
Detailed view of each budget:
- Category name
- Spent amount
- Budget target (click to edit)
- Remaining amount
- Progress bar with percentage

**How to edit a budget:**
1. Click on the budget amount
2. Enter new amount
3. Click ✓ to save or ✕ to cancel
4. Or press Enter/Escape

**How to add a budget:**
1. Click "+ Add Budget"
2. Select category
3. Enter monthly target
4. Click "Add Budget"

---

## 📝 Bills Tab

Manage your recurring bills.

### Header
- Shows total count
- **"Groups View"** button to switch organization
- **"+ Add Bill"** button

### Active Bills Section
All currently active recurring bills showing:
- Bill name
- Payee (if set)
- Category and account
- Amount
- Next due date
- Days until due
- Notes (if any)

**Actions for each bill:**
- **Pay Now** - Record payment (creates transaction)
- **Edit** - Modify bill details
- **Pause** - Temporarily stop reminders
- **Delete** - Remove permanently

### Paused Bills Section
Bills you've paused (shown with reduced opacity):
- Same information as active bills
- **Resume** button to reactivate

### How to Add a Bill
1. Click "+ Add Bill"
2. Fill in required fields:
   - Bill name (e.g., "Electric Bill")
   - Amount
   - Account to pay from
   - Category
   - Frequency (Weekly/Monthly/Quarterly/Yearly)
   - Next due date
3. Optional: Add payee and notes
4. Click "Add Bill"

### How to Pay a Bill
1. Click "Pay Now" on any bill
2. Confirm or adjust amount
3. Set payment date (defaults to today)
4. Click "Mark as Paid"

**What happens:**
- Transaction is created in your account
- Next due date is updated automatically
- Bill shows new due date

---

## 🏦 Accounts Tab

View all your financial accounts.

### Toggle Views
Switch between:
- **Equity View** (default) - Assets vs Liabilities
- **Groups View** - Organized by account groups

### Equity View (Default)

#### Net Worth Summary
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Assets       │ │ Liabilities  │ │ Net Worth    │
│ $50,000      │ │ $10,000      │ │ $40,000      │
│ 4 accounts   │ │ 1 account    │ │ Total equity │
└──────────────┘ └──────────────┘ └──────────────┘
```

#### Assets Section
All accounts with positive balances:
- Checking accounts
- Savings accounts
- Investment accounts
- Cash accounts

#### Liabilities Section  
All accounts with negative balances:
- Credit cards
- Loans
- Mortgages

**Account cards show:**
- Account name
- Account group badge (colored)
- Current balance
- Edit button (hover to see)

### Groups View
Shows accounts organized by their account groups:
- Each group shows total balance
- Accounts listed under their group
- Groups with no accounts are hidden

### How to Add an Account
1. Click "+ Add Account"
2. Enter account name
3. Select account group
4. Enter opening balance
5. Click "Add Account"

### How to Edit an Account
1. Hover over account card
2. Click edit icon (appears in top-right)
3. Modify details
4. Click "Save Changes"

---

## 💳 Transactions Tab

View and manage all transactions.

### Quick Add Transaction (Keyboard Shortcut: N)
Fast entry for daily transactions:
- Date
- Account
- Amount (positive for income, negative for expense)
- Category
- Payee (optional)
- Notes (optional)

### Transaction List
All recent transactions showing:
- Date
- Account name
- Payee
- Category
- Amount (color-coded: green for income, red for expenses)
- Notes

**Actions:**
- Edit transaction (click on it)
- Delete transaction

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Open quick add transaction modal |
| `Escape` | Close any modal |
| `Enter` | Submit form / Save edit |

---

## 🎨 Color Guide

### Status Colors
- 🟢 **Green** - Positive, success, on track, income
- 🔴 **Red** - Negative, danger, over budget, expenses
- 🟡 **Yellow** - Warning, caution
- 🟠 **Orange** - Attention needed
- 🔵 **Blue** - Informational, neutral, savings

### Chart Colors
- **Income:** Green (#2BB673)
- **Spending:** Red (#D64550)
- **Savings:** Blue (#2E86AB)
- **Primary:** Orange (#E4572E)

---

## 💡 Tips & Best Practices

### Getting Started
1. **Add your accounts first** - Start with checking, savings, credit cards
2. **Set up categories** - Use the defaults or create your own
3. **Enter some transactions** - Last month's spending is enough
4. **Create budgets** - Set targets for key categories
5. **Add recurring bills** - Never miss a payment

### Daily Use
1. **Use keyboard shortcut "N"** to quickly add transactions
2. **Check dashboard** to see spending trends
3. **Review upcoming bills** to plan cash flow
4. **Update budgets monthly** based on actual spending

### Monthly Review
1. Navigate to **Budgets** tab
2. Review actual vs budgeted spending
3. Look at **Category Breakdown** on dashboard
4. Check **Spending Trends** for patterns
5. Adjust next month's budgets accordingly

### FIRE Progress Tracking
1. Update account balances regularly
2. Track net worth changes on **Accounts** tab
3. Monitor **FIRE Progress** tile on dashboard
4. Review **Savings Rate** monthly
5. Celebrate milestones!

---

## 📱 Mobile Tips

The app is responsive and works on mobile:
- Charts stack vertically
- Touch-friendly buttons
- Scrollable lists
- Swipe-friendly navigation

Best mobile experience:
- Use in landscape for charts
- Dashboard is your home base
- Quick add transaction works great on mobile

---

## 🔒 Data Privacy

Your financial data is:
- ✅ **Private** - Only you can see it
- ✅ **Secure** - Protected by Supabase Row Level Security
- ✅ **Isolated** - Each user's data is completely separate
- ✅ **Backed up** - Supabase handles backups automatically

---

## ❓ Common Questions

**Q: How do I track net worth over time?**  
A: Currently, net worth is calculated live. Historical tracking coming soon!

**Q: Can I import transactions from my bank?**  
A: Not yet - this is a manual-entry app. Keeps you mindful of spending!

**Q: What's the 4% rule for FIRE?**  
A: Withdraw 4% of your portfolio annually in retirement. Your FIRE number is 25x your annual expenses.

**Q: How often should I update account balances?**  
A: Weekly or bi-weekly is ideal. Monthly at minimum.

**Q: Can I delete a category that has transactions?**  
A: Currently no - this prevents data loss. Rename it instead!

**Q: What happens if I miss a bill payment?**  
A: The bill shows as "OVERDUE" in red. You can still pay it anytime.

**Q: Can I have multiple budgets for the same category?**  
A: No - one budget per category per month. Edit the existing budget instead.

---

## 🚀 What's Next?

Planned features:
- Net worth history and trending
- Budget vs actual charts
- Transaction search and filters
- Bulk transaction import
- Mobile app
- Dark mode

---

**Happy tracking! You're on your way to FIRE! 🔥**
