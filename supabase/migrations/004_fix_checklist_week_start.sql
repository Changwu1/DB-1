-- week_start_date was declared NOT NULL in migration 001 but is never populated
-- by the app (saveChecklist does not include it). Make it nullable.
alter table weekly_checklists alter column week_start_date drop not null;
