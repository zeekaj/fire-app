-- 03_scenarios.sql
-- Scenarios table for FIRE projections and "what-if" planning
-- This table already exists in 01_init.sql, but we're adding indices and policies

-- Add helpful indices for scenarios queries
CREATE INDEX IF NOT EXISTS idx_scenarios_user ON scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_name ON scenarios(created_by, name);

-- Ensure RLS is enabled
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;

-- RLS Policies for scenarios
CREATE POLICY "Users can view own scenarios"
  ON scenarios FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own scenarios"
  ON scenarios FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own scenarios"
  ON scenarios FOR DELETE
  USING (auth.uid() = created_by);

-- Add helpful comment
COMMENT ON TABLE scenarios IS 'FIRE projection scenarios with user-defined assumptions for Monte Carlo and historical simulations';
