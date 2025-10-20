-- 08_add_scenario_age_columns.sql
-- Add dedicated age columns to scenarios table and migrate data from notes JSON field
-- This replaces the temporary JSON storage solution in the notes field

-- Add the new age columns
ALTER TABLE scenarios 
  ADD COLUMN IF NOT EXISTS current_age integer,
  ADD COLUMN IF NOT EXISTS retirement_age integer,
  ADD COLUMN IF NOT EXISTS life_expectancy integer;

-- Add helpful comments
COMMENT ON COLUMN scenarios.current_age IS 'User''s current age in years';
COMMENT ON COLUMN scenarios.retirement_age IS 'Planned retirement age in years';
COMMENT ON COLUMN scenarios.life_expectancy IS 'Expected life expectancy in years';

-- Migrate existing data from notes JSON field to dedicated columns
-- This handles both the JSON format and plain text notes
DO $$
DECLARE
    scenario_record RECORD;
    notes_data JSONB;
    original_note TEXT;
BEGIN
    -- Loop through all scenarios with notes
    FOR scenario_record IN 
        SELECT id, notes, created_at 
        FROM scenarios 
        WHERE notes IS NOT NULL AND notes != ''
    LOOP
        BEGIN
            -- Try to parse notes as JSON
            notes_data := scenario_record.notes::JSONB;
            
            -- Check if it has the ages structure
            IF notes_data ? 'ages' THEN
                -- Extract ages and original note
                UPDATE scenarios 
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
                
                RAISE NOTICE 'Migrated scenario % with JSON ages data', scenario_record.id;
            ELSE
                -- It's JSON but not our format, treat as regular note and use defaults
                UPDATE scenarios 
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
                IF scenario_record.retirement_date IS NOT NULL THEN
                    retirement_year := EXTRACT(YEAR FROM scenario_record.retirement_date::date);
                    death_year := EXTRACT(YEAR FROM (SELECT death_date FROM scenarios WHERE id = scenario_record.id));
                    
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
                        UPDATE scenarios 
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
                        UPDATE scenarios 
                        SET 
                            current_age = 35,
                            retirement_age = 65,
                            life_expectancy = 95
                        WHERE id = scenario_record.id;
                        
                        RAISE NOTICE 'Used default ages for scenario % (calculated values seemed invalid)', scenario_record.id;
                    END IF;
                ELSE
                    -- No retirement date, use defaults
                    UPDATE scenarios 
                    SET 
                        current_age = 35,
                        retirement_age = 65,
                        life_expectancy = 95
                    WHERE id = scenario_record.id;
                    
                    RAISE NOTICE 'Used default ages for scenario % (no retirement date available)', scenario_record.id;
                END IF;
            END;
        END;
    END LOOP;
    
    -- Handle scenarios with no notes at all
    UPDATE scenarios 
    SET 
        current_age = 35,
        retirement_age = 65,
        life_expectancy = 95
    WHERE notes IS NULL OR notes = '' OR current_age IS NULL;
    
    RAISE NOTICE 'Migration complete. Set default ages for scenarios with no notes.';
END $$;

-- Add NOT NULL constraints after migration (with defaults for safety)
ALTER TABLE scenarios 
  ALTER COLUMN current_age SET DEFAULT 35,
  ALTER COLUMN current_age SET NOT NULL,
  ALTER COLUMN retirement_age SET DEFAULT 65,
  ALTER COLUMN retirement_age SET NOT NULL,
  ALTER COLUMN life_expectancy SET DEFAULT 95,
  ALTER COLUMN life_expectancy SET NOT NULL;

-- Add reasonable constraints
ALTER TABLE scenarios 
  ADD CONSTRAINT scenarios_ages_valid CHECK (
    current_age >= 18 AND 
    current_age <= 100 AND
    retirement_age >= current_age AND 
    retirement_age <= 100 AND
    life_expectancy >= retirement_age AND 
    life_expectancy <= 120
  );

-- Add helpful indexes for age-based queries
CREATE INDEX IF NOT EXISTS idx_scenarios_current_age ON scenarios(current_age);
CREATE INDEX IF NOT EXISTS idx_scenarios_retirement_age ON scenarios(retirement_age);

-- Log the migration
INSERT INTO migrations_log (created_by, kind, mapping, run_at)
SELECT 
    id as created_by,
    'scenario-age-migration' as kind,
    jsonb_build_object(
        'description', 'Added dedicated age columns to scenarios table',
        'migrated_from', 'notes JSON field',
        'added_columns', ARRAY['current_age', 'retirement_age', 'life_expectancy']
    ) as mapping,
    NOW() as run_at
FROM users
LIMIT 1;