-- ============================================================================
-- PHASE D DATABASE MIGRATION - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Copy this entire file and paste into Supabase SQL Editor, then click Run
-- URL: https://supabase.com/dashboard/project/slgmjbbwqhcqtguudglc
-- ============================================================================

-- Migration 08: Add dedicated age columns to scenarios table
-- This replaces the temporary JSON storage solution in the notes field

-- Add the new age columns
ALTER TABLE public.scenarios 
  ADD COLUMN IF NOT EXISTS current_age integer,
  ADD COLUMN IF NOT EXISTS retirement_age integer,
  ADD COLUMN IF NOT EXISTS life_expectancy integer;

-- Add helpful comments
COMMENT ON COLUMN public.scenarios.current_age IS 'User''s current age in years';
COMMENT ON COLUMN public.scenarios.retirement_age IS 'Planned retirement age in years';
COMMENT ON COLUMN public.scenarios.life_expectancy IS 'Expected life expectancy in years';

-- Migrate existing data from notes JSON field to dedicated columns
-- This handles both the JSON format and plain text notes
DO $$
DECLARE
    scenario_record RECORD;
    notes_data JSONB;
    original_note TEXT;
    migration_count INTEGER := 0;
BEGIN
    -- Loop through all scenarios with notes
    FOR scenario_record IN 
        SELECT id, notes, retirement_date, death_date, created_at 
        FROM public.scenarios 
        WHERE notes IS NOT NULL AND notes != ''
    LOOP
        BEGIN
            -- Try to parse notes as JSON
            notes_data := scenario_record.notes::JSONB;
            
            -- Check if it has the ages structure
            IF notes_data ? 'ages' THEN
                -- Extract ages and original note
                UPDATE public.scenarios 
                SET 
                    current_age = COALESCE((notes_data->'ages'->>'current_age')::integer, 35),
                    retirement_age = COALESCE((notes_data->'ages'->>'retirement_age')::integer, 65),
                    life_expectancy = COALESCE((notes_data->'ages'->>'life_expectancy')::integer, 95),
                    -- Restore original note (or null if empty)
                    notes = CASE 
                        WHEN notes_data->'originalNote' IS NOT NULL AND notes_data->'originalNote' != 'null'::jsonb
                        THEN notes_data->>'originalNote'
                        ELSE NULL
                    END
                WHERE id = scenario_record.id;
                
                migration_count := migration_count + 1;
                RAISE NOTICE 'Migrated scenario % with JSON ages data', scenario_record.id;
            ELSE
                -- It's JSON but not our format, treat as regular note and use defaults
                UPDATE public.scenarios 
                SET 
                    current_age = 35,
                    retirement_age = 65,
                    life_expectancy = 95
                    -- Leave notes unchanged
                WHERE id = scenario_record.id;
                
                RAISE NOTICE 'Scenario % had JSON notes but no ages data, used defaults', scenario_record.id;
            END IF;
            
        EXCEPTION WHEN invalid_text_representation THEN
            -- Not valid JSON, treat as plain text note and use defaults based on dates
            DECLARE
                calculated_current_age INTEGER;
                calculated_retirement_age INTEGER;
                calculated_life_expectancy INTEGER;
                current_year INTEGER;
                birth_year INTEGER;
                retirement_year INTEGER;
                death_year INTEGER;
            BEGIN
                current_year := EXTRACT(YEAR FROM NOW());
                
                -- Try to calculate ages from existing date fields if they exist
                IF scenario_record.retirement_date IS NOT NULL AND scenario_record.death_date IS NOT NULL THEN
                    retirement_year := EXTRACT(YEAR FROM scenario_record.retirement_date::date);
                    death_year := EXTRACT(YEAR FROM scenario_record.death_date::date);
                    
                    -- Estimate birth year from retirement date (assume retirement at 65)
                    birth_year := retirement_year - 65;
                    calculated_current_age := current_year - birth_year;
                    calculated_retirement_age := retirement_year - birth_year;
                    calculated_life_expectancy := death_year - birth_year;
                    
                    -- Sanity check the calculated values
                    IF calculated_current_age BETWEEN 18 AND 100 AND 
                       calculated_retirement_age BETWEEN calculated_current_age AND 100 AND
                       calculated_life_expectancy BETWEEN calculated_retirement_age AND 120 THEN
                        -- Use calculated values
                        UPDATE public.scenarios 
                        SET 
                            current_age = calculated_current_age,
                            retirement_age = calculated_retirement_age,
                            life_expectancy = calculated_life_expectancy
                            -- Leave notes unchanged (it's a real user note)
                        WHERE id = scenario_record.id;
                        
                        RAISE NOTICE 'Calculated ages for scenario % from dates: current=%, retirement=%, life_expectancy=%', 
                            scenario_record.id, calculated_current_age, calculated_retirement_age, calculated_life_expectancy;
                    ELSE
                        -- Use defaults if calculations seem wrong
                        UPDATE public.scenarios 
                        SET 
                            current_age = 35,
                            retirement_age = 65,
                            life_expectancy = 95
                        WHERE id = scenario_record.id;
                        
                        RAISE NOTICE 'Used default ages for scenario % (calculated values seemed invalid)', scenario_record.id;
                    END IF;
                ELSE
                    -- No retirement/death date, use defaults
                    UPDATE public.scenarios 
                    SET 
                        current_age = 35,
                        retirement_age = 65,
                        life_expectancy = 95
                    WHERE id = scenario_record.id;
                    
                    RAISE NOTICE 'Used default ages for scenario % (no dates available)', scenario_record.id;
                END IF;
            END;
        END;
    END LOOP;
    
    -- Handle scenarios with no notes at all
    UPDATE public.scenarios 
    SET 
        current_age = 35,
        retirement_age = 65,
        life_expectancy = 95
    WHERE (notes IS NULL OR notes = '') AND current_age IS NULL;
    
    RAISE NOTICE 'Migration complete. Migrated % scenarios from JSON notes format.', migration_count;
    RAISE NOTICE 'Set default ages for scenarios with no notes or invalid data.';
END $$;

-- Add NOT NULL constraints after migration (with defaults for safety)
ALTER TABLE public.scenarios 
  ALTER COLUMN current_age SET DEFAULT 35,
  ALTER COLUMN current_age SET NOT NULL,
  ALTER COLUMN retirement_age SET DEFAULT 65,
  ALTER COLUMN retirement_age SET NOT NULL,
  ALTER COLUMN life_expectancy SET DEFAULT 95,
  ALTER COLUMN life_expectancy SET NOT NULL;

-- Add reasonable constraints
-- Drop constraint if it exists, then add it (PostgreSQL doesn't support IF NOT EXISTS for constraints)
ALTER TABLE public.scenarios 
  DROP CONSTRAINT IF EXISTS scenarios_ages_valid;

ALTER TABLE public.scenarios 
  ADD CONSTRAINT scenarios_ages_valid CHECK (
    current_age >= 18 AND 
    current_age <= 100 AND
    retirement_age >= current_age AND 
    retirement_age <= 100 AND
    life_expectancy >= retirement_age AND 
    life_expectancy <= 120
  );

-- Add helpful indexes for age-based queries
CREATE INDEX IF NOT EXISTS idx_scenarios_current_age ON public.scenarios(current_age);
CREATE INDEX IF NOT EXISTS idx_scenarios_retirement_age ON public.scenarios(retirement_age);

-- ============================================================================
-- VERIFICATION QUERIES (run these after to confirm)
-- ============================================================================

-- Should show the new age columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'scenarios'
AND table_schema = 'public'
AND column_name IN ('current_age', 'retirement_age', 'life_expectancy')
ORDER BY column_name;

-- Should show all scenarios with age data populated (no NULLs)
SELECT id, name, current_age, retirement_age, life_expectancy, 
       CASE 
         WHEN notes LIKE '{%}' THEN 'JSON format (migrated)'
         WHEN notes IS NOT NULL THEN 'Plain text note'
         ELSE 'No notes'
       END as notes_type
FROM public.scenarios
ORDER BY created_at DESC
LIMIT 10;

-- Show age distribution
SELECT 
  COUNT(*) as scenario_count,
  AVG(current_age) as avg_current_age,
  AVG(retirement_age) as avg_retirement_age,
  AVG(life_expectancy) as avg_life_expectancy,
  MIN(current_age) as min_current_age,
  MAX(life_expectancy) as max_life_expectancy
FROM public.scenarios;