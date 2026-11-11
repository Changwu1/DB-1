-- CBT-I MVP — initial schema
-- Column names follow lib/dict-transliteration.ts
-- RLS: every table is locked to auth.uid()

-- ── profiles ──────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  -- account_name is set during assessment account step, not at signup
  account_name text check (char_length(account_name) between 1 and 30),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "users see own profile" on profiles
  for all using (id = auth.uid());

-- Auto-create profile row on new user sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── assessment_responses ──────────────────────────────────────────────────────
create table assessment_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,

  -- Consent & account
  consent boolean,

  -- Sleep problem screening
  age integer check (age between 0 and 100),
  sleep_problem_types text[],
  nights_per_week integer check (nights_per_week between 0 and 7),
  problem_duration text check (problem_duration in ('น้อยกว่า 3 เดือน', '3–6 เดือน', 'มากกว่า 6 เดือน')),
  adequate_opportunity boolean,

  -- ISI (ข้อ 1–7, 0–4 each)
  isi_q1 integer check (isi_q1 between 0 and 4),
  isi_q2 integer check (isi_q2 between 0 and 4),
  isi_q3 integer check (isi_q3 between 0 and 4),
  isi_q4 integer check (isi_q4 between 0 and 4),
  isi_q5 integer check (isi_q5 between 0 and 4),
  isi_q6 integer check (isi_q6 between 0 and 4),
  isi_q7 integer check (isi_q7 between 0 and 4),
  isi_score_start integer,
  isi_score_end integer,          -- filled at day 28

  -- 2Q
  q2_q1 boolean,
  q2_q2 boolean,

  -- 9Q (ข้อ 3.3–3.11, 0–3 each; null if 2Q skipped)
  q9_q3_3 integer check (q9_q3_3 between 0 and 3),
  q9_q3_4 integer check (q9_q3_4 between 0 and 3),
  q9_q3_5 integer check (q9_q3_5 between 0 and 3),
  q9_q3_6 integer check (q9_q3_6 between 0 and 3),
  q9_q3_7 integer check (q9_q3_7 between 0 and 3),
  q9_q3_8 integer check (q9_q3_8 between 0 and 3),
  q9_q3_9 integer check (q9_q3_9 between 0 and 3),
  q9_q3_10 integer check (q9_q3_10 between 0 and 3),
  q9_q3_11 integer check (q9_q3_11 between 0 and 3),
  q9_total integer not null default 0,

  -- Contraindications
  contraindication_bipolar boolean,
  contraindication_psychosis boolean,
  contraindication_epilepsy boolean,
  contraindication_parasomnia boolean,
  contraindication_machinery boolean,

  -- Lifestyle flags
  shift_work boolean,
  pregnant_postnatal text check (pregnant_postnatal in ('ใช่', 'ไม่ใช่', 'ไม่เกี่ยวข้อง')),

  -- RLS (ข้อ 1–4; 2–4 null if ข้อ 1 = no)
  rls_q1 boolean,
  rls_q2 boolean,
  rls_q3 boolean,
  rls_q4 boolean,

  -- STOP-Bang
  stop_bang_snore text check (stop_bang_snore in ('yes', 'no', 'unknown')),
  stop_bang_tired text check (stop_bang_tired in ('yes', 'no')),
  stop_bang_observed text check (stop_bang_observed in ('yes', 'no', 'unknown')),
  hypertension boolean,
  height_cm numeric(5,1) check (height_cm between 100 and 200),
  weight_kg numeric(5,1) check (weight_kg between 30 and 250),
  bmi numeric(5,2),
  neck_circumference_in numeric(4,2) check (neck_circumference_in between 8 and 30),
  biological_sex text check (biological_sex in ('ชาย', 'หญิง')),
  stop_bang_score integer,

  -- Sleep aids (each: ไม่เคย / บางครั้ง / 3คืน+)
  sleep_aid_prescription text check (sleep_aid_prescription in ('ไม่เคย', 'บางครั้ง', '3คืน+')),
  sleep_aid_otc text check (sleep_aid_otc in ('ไม่เคย', 'บางครั้ง', '3คืน+')),
  sleep_aid_alcohol text check (sleep_aid_alcohol in ('ไม่เคย', 'บางครั้ง', '3คืน+')),
  sleep_aid_supplement text check (sleep_aid_supplement in ('ไม่เคย', 'บางครั้ง', '3คืน+')),

  -- Result
  result text check (result in ('STOP', 'REFER', 'NOT-FIT', 'GO')),
  flags text[] not null default '{}',

  -- Resume
  last_completed_step text,
  completed_at timestamptz
);

alter table assessment_responses enable row level security;
create policy "users see own assessment" on assessment_responses
  for all using (user_id = auth.uid());

-- ── programme_starts ──────────────────────────────────────────────────────────
create table programme_starts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  started_at timestamptz not null,
  final_isi_offered_at timestamptz,
  final_isi_completed_at timestamptz
);

alter table programme_starts enable row level security;
create policy "users see own programme" on programme_starts
  for all using (user_id = auth.uid());

-- ── diary_entries ─────────────────────────────────────────────────────────────
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  night_date date not null,
  unique (user_id, night_date),

  -- Daily input fields (ตาราง Daily Input ใน spec)
  bedtime time,                           -- เวลาขึ้นเตียง
  lights_out time,                        -- เวลาปิดไฟ
  sleep_onset_min integer check (sleep_onset_min between 0 and 120),  -- เวลากว่าจะหลับ
  wakeup_count integer check (wakeup_count between 0 and 3),          -- จำนวนครั้งที่ตื่นกลางดึก (3 = "3+")
  wakeup_duration_min integer check (wakeup_duration_min >= 0),       -- เวลาตื่นกลางดึกรวม
  final_wakeup time,                      -- เวลาตื่นครั้งสุดท้าย
  out_of_bed time,                        -- เวลาลุกจากเตียง
  sleep_quality integer check (sleep_quality between 1 and 5),        -- คุณภาพการนอน

  -- Meta
  submitted_at timestamptz,
  is_backfill boolean not null default false,

  -- Computed fields stored at save time (formulas from docs/03-diary.md section 5)
  time_in_bed_min integer,
  sleep_time_min integer,
  sleep_efficiency_pct numeric(5,2),
  on_target_wakeup text check (on_target_wakeup in ('yes', 'no', 'not_counted'))
);

alter table diary_entries enable row level security;
create policy "users see own diary" on diary_entries
  for all using (user_id = auth.uid());

-- ── weekly_checklists ─────────────────────────────────────────────────────────
create table weekly_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_number integer not null,
  week_start_date date not null,
  unique (user_id, week_number),

  -- 9 checklist items (0–7 days each)
  days_morning_light integer check (days_morning_light between 0 and 7),
  days_caffeine_near_bed integer check (days_caffeine_near_bed between 0 and 7),
  days_napped integer check (days_napped between 0 and 7),
  days_exercised integer check (days_exercised between 0 and 7),
  days_alcohol_near_bed integer check (days_alcohol_near_bed between 0 and 7),
  days_heavy_meal_or_exercise integer check (days_heavy_meal_or_exercise between 0 and 7),
  days_dim_light integer check (days_dim_light between 0 and 7),
  days_screen_in_bed integer check (days_screen_in_bed between 0 and 7),
  clock_check_frequency text check (clock_check_frequency in ('never', 'sometimes', 'often')),

  submitted_at timestamptz
);

alter table weekly_checklists enable row level security;
create policy "users see own checklist" on weekly_checklists
  for all using (user_id = auth.uid());

-- ── education_state ───────────────────────────────────────────────────────────
create table education_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,

  rules_accepted boolean not null default false,
  confirmed_rules integer[] not null default '{}',
  last_card_tab1 integer not null default 1,
  last_card_tab2 integer not null default 1,
  myth_order integer[],                    -- shuffled 1–9
  myth_today integer,
  myth_shown_date date,
  myth_hidden_today boolean not null default false,
  rules_updated_at timestamptz,
  rules_last_viewed_at timestamptz
);

alter table education_state enable row level security;
create policy "users see own education" on education_state
  for all using (user_id = auth.uid());

-- ── lesson_settings ───────────────────────────────────────────────────────────
create table lesson_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  target_wakeup_time time            -- lesson: เวลาเป้าหมายที่จะตื่น; set at rule 1 confirmation
);

alter table lesson_settings enable row level security;
create policy "users see own lesson" on lesson_settings
  for all using (user_id = auth.uid());

-- ── suggestion_selections ─────────────────────────────────────────────────────
create table suggestion_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_number integer not null,
  unique (user_id, week_number),

  queue jsonb not null default '[]',
  shown text[] not null default '{}',
  selected text[],
  selected_at timestamptz,
  taught_until jsonb not null default '{}'   -- {S1: "2026-11-25", …}
);

alter table suggestion_selections enable row level security;
create policy "users see own suggestions" on suggestion_selections
  for all using (user_id = auth.uid());
