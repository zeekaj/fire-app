-- 04_add_scenario_financial_fields.sql
-- Add financial input fields to scenarios table

-- Add columns for portfolio and financial data
ALTER TABLE scenarios 
  ADD COLUMN IF NOT EXISTS portfolio_value_now numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS savings numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expenses numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portfolio_stocks numeric(5,4) DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS notes text;

-- Add helpful comments
COMMENT ON COLUMN scenarios.portfolio_value_now IS 'Current portfolio/net worth value';
COMMENT ON COLUMN scenarios.savings IS 'Annual savings/contribution amount';
COMMENT ON COLUMN scenarios.expenses IS 'Annual expenses in retirement';
COMMENT ON COLUMN scenarios.portfolio_stocks IS 'Portfolio stock allocation (0-1, e.g., 0.6 = 60%)';
COMMENT ON COLUMN scenarios.notes IS 'User notes about this scenario';
