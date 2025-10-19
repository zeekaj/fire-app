-- Add selected_scenario_id to settings table for dashboard integration

alter table public.settings
add column if not exists selected_scenario_id uuid references public.scenarios(id) on delete set null;

comment on column public.settings.selected_scenario_id is 'Primary FIRE scenario used for dashboard calculations and projections';
