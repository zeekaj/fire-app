# 🚀 Complete the Migration - Simple Steps

## You Need to Do 2 Things:

### 1️⃣ Run SQL in Supabase Dashboard (2 minutes)

**Open this link:** https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc/sql/new

**Copy and paste this SQL:**

```sql
-- Add financial columns to scenarios table
ALTER TABLE scenarios 
  ADD COLUMN IF NOT EXISTS portfolio_value_now numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS savings numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portfolio_stocks numeric(5,4) DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS notes text;

-- Add comments
COMMENT ON COLUMN scenarios.portfolio_value_now IS 'Current portfolio/net worth value';
COMMENT ON COLUMN scenarios.savings IS 'Annual savings/contribution amount';
COMMENT ON COLUMN scenarios.expenses IS 'Annual expenses in retirement';
COMMENT ON COLUMN scenarios.portfolio_stocks IS 'Portfolio stock allocation (0-1, e.g., 0.6 = 60%)';
COMMENT ON COLUMN scenarios.notes IS 'User notes about this scenario';
```

**Click "Run"** (or press Cmd+Enter)

You should see: "Success. No rows returned"

---

### 2️⃣ Update the Adapter Code (3 minutes)

After running the SQL, I'll update the code for you automatically.

Just type: **"migration applied"** when done.

---

## That's It!

Once you tell me the migration is applied, I'll:
1. ✅ Update the adapter to use real database columns
2. ✅ Regenerate TypeScript types
3. ✅ Verify everything compiles
4. ✅ Mark Phase A as complete

Then you can test it by creating a scenario!

---

## 👉 Action Required:

1. Click: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc/sql/new
2. Paste the SQL above
3. Click "Run"
4. Come back and type: **"migration applied"**

That's all! 🎉
