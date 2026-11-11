-- Step 7 landed using suggestion_state + suggestion_history tables,
-- not the suggestion_selections table that was drafted in migration 001.
-- Drop the unused draft table and create the actual tables.

drop table if exists suggestion_selections;

-- ── suggestion_state ──────────────────────────────────────────────────────────
-- One row per user; upserted each evaluation week.
create table suggestion_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,

  eval_week_number integer,
  status text check (status in ('F1', 'F2', 'suggestions')),
  queue text[] not null default '{}',
  top_three text[] not null default '{}',
  safety_flags text[] not null default '{}',
  s2_add_screen boolean not null default false,
  s2_add_clock boolean not null default false,
  selected text[],
  teach_started_at date,

  -- Stats stored to render suggestion body text without re-loading diary
  out_of_bed_range_mins integer,
  avg_sleep_onset_mins numeric,
  caffeine_near_bed_days integer,
  alcohol_near_bed_days integer,
  dim_lights_days integer,
  exercise_days integer
);

alter table suggestion_state enable row level security;
create policy "users see own suggestion state" on suggestion_state
  for all using (user_id = auth.uid());

-- ── suggestion_history ────────────────────────────────────────────────────────
-- One row per taught suggestion item (for the 14-day no-repeat filter).
create table suggestion_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  suggestion_id text not null,   -- e.g. 'S1', 'S2', …
  week_number integer not null,
  started_at date not null
);

alter table suggestion_history enable row level security;
create policy "users see own suggestion history" on suggestion_history
  for all using (user_id = auth.uid());

create index idx_suggestion_history_user_id on suggestion_history (user_id);
