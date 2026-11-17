-- Add skipped flag to diary_entries so users can explicitly mark a past night
-- as "I don't remember / not sure" without submitting data for that night.
-- Skipped entries are excluded from analytics and the unfilled-days list.
ALTER TABLE diary_entries ADD COLUMN skipped boolean NOT NULL DEFAULT false;
