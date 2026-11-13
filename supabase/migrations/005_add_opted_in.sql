-- Allow NOT-FIT and REFER users to opt in to try the programme despite the recommendation
alter table assessment_responses add column if not exists opted_in boolean not null default false;
