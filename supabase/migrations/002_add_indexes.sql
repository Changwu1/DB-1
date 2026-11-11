-- Add indexes on user_id FK columns that have multiple rows per user.
-- profiles, assessment_responses, education_state, lesson_settings, programme_starts
-- all have UNIQUE(user_id), which already creates an index.
-- Only tables with non-unique user_id need explicit indexes.

create index if not exists idx_diary_entries_user_id
  on diary_entries (user_id);

create index if not exists idx_weekly_checklists_user_id
  on weekly_checklists (user_id);

create index if not exists idx_suggestion_selections_user_id
  on suggestion_selections (user_id);
