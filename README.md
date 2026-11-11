# CBT-I MVP — Build Plan

What we're building: A Thai-language CBT-I sleep therapy web app. Users take a screening assessment, keep a daily sleep diary, read education content, get weekly behaviour suggestions, and see a final ISI score comparison at week 4.

---

## Stack

| Layer           | Choice                                        |
|-----------------|-----------------------------------------------|
| Framework       | Next.js 15 (App Router, TypeScript)           |
| Database / Auth | Supabase (Postgres + magic-link email)        |
| Styling         | Tailwind CSS — mobile-first, 380px max-width  |
| Testing         | Vitest                                        |
| Deploy          | Vercel                                        |

---

## Build Order

| Step                     | What gets built                                                          | Status                              |
|--------------------------|--------------------------------------------------------------------------|-------------------------------------|
| Step 1 — Foundations     | docs/00-dictionary.md, docs/05-decisions.md, CLAUDE.md                   | ✅ Done                             |
| Step 2 — Plan            | Approved architecture plan                                               | ✅ Done                             |
| Step 3 — Scaffold        | Next.js project, Supabase client, DB migration, magic-link auth, getNow() + DevPanel, constants.ts, Vitest | ✅ Done (commit d504ae4 + scaffold-fixes) |
| Step 4 — Assessment      | lib/assessment.ts pure functions + 19 tests → assessment screens         | 🔄 Next                             |
| Step 5 — Diary+Checklist | lib/diary.ts pure functions + tests → diary screens                      | Pending                             |
| Step 6 — Education       | lib/education.ts pure functions + tests → education screens              | Pending                             |
| Step 7 — Suggestion      | lib/suggestion.ts pure functions + tests → suggestion screens            | Pending                             |
| Step 8 — Recap+Final ISI | Recap screens + final ISI trigger at day 28                              | Pending                             |
| Step 9 — Full check+deploy | Full test suite + 6 user journeys + Vercel deploy                      | Pending                             |

---

## Key Architecture Decisions

- **Pure functions first**: every rule table lives in `lib/`, tested before any UI is built
- **getNow() / getNowServer()**: the only sources of "now" for all date logic; DevPanel simulates dates in dev (browser writes `__dev_date__` cookie; server reads it via `getNowServer()`)
- **Priority rule**: STOP > REFER > NOT-FIT > GO (from `assessment: ผลลัพธ์`)
- **Safety locks**: STOP screen is permanent (no back path); REFER/STOP users cannot reach diary/suggestion/recap
- **1 account = 1 assessment** — no retakes; resume from `last_completed_step` if closed mid-way
- **RLS on every table** — each user sees only their own rows
- **UI copy in Thai** — word for word from spec section 7, never invented

---

## Database (8 tables)

`profiles` · `assessment_responses` · `programme_starts` · `diary_entries` · `weekly_checklists` · `education_state` · `lesson_settings` · `suggestion_selections`

---

## What Still Needs You (Supabase Setup)

Before the app can connect:
1. Create a Supabase project (Singapore region ap-southeast-1 — recommended for PDPA)
2. Run `supabase/migrations/001_initial_schema.sql`, then `002_add_indexes.sql`
3. Enable magic-link email auth in Supabase dashboard
4. Create `.env.local` from `.env.local.example`

---

## Open Questions

| # | Question                                                                                                              | Owner | Blocks |
|---|-----------------------------------------------------------------------------------------------------------------------|-------|--------|
| 1 | `CHECKLIST_DAYS_HIGH_THRESHOLD` and `CHECKLIST_DAYS_LOW_THRESHOLD` are both 3. Does a score of exactly 3 fire both S5–S7/S9 (high) and S8/S10 (low) simultaneously? | Lunn  | Step 7 |
| 2 | SF1–SF4 safety thresholds need Dr Surat to confirm values in `lib/constants.ts` before use with real patients.         | Surat | Step 7 |
| 3 | Clinical constants: `MINUTES_AWAKE_BEFORE_RISING`, `MAX_NAP_MINUTES`, `LATEST_NAP_TIME`, `TARGET_WAKEUP_TOLERANCE_MIN` | Surat | Step 5 |
| 4 | Supabase region confirmation                                                                                           | Yue   | Setup  |

---

## Notes for Each Step

### Step 4 — Assessment

Before writing any screens:

1. Lock `last_completed_step` as a typed union (e.g. `type AssessmentStep = 'consent' | 'account' | 'isi' | '9q' | ...`) in `lib/assessment.ts` before building step routing.
2. In `lib/assessment.ts`, distinguish "user took 9Q and scored 0" from "2Q negative, 9Q not asked" by checking `q9_q3_3 === null`, not `q9_total === 0`. The DB default is 0 in both cases.
3. `pregnant_postnatal` stores Thai values (`'ใช่'` / `'ไม่ใช่'` / `'ไม่เกี่ยวข้อง'`). Form-to-DB code must use these Thai strings.

### Step 5 — Diary + Checklist

Use the updated test case 8.1 from `docs/05-decisions.md` (D6): night 2 = ใช่, weekly result = 4/6.

### Step 7 — Suggestion

Resolve open question #1 with Lunn before writing suggestion logic.

---

## Tips While Building

- Before Steps 4–8, brief the PIC for that piece.
- If Claude Code stops to ask about a `[?]` value, forward to the right person — don't answer it yourself.
- If Claude Code starts building screens before logic tests pass, stop it and point it back to `CLAUDE.md`.
- Keep the Vercel link within the team until clinical review and IRB questions are settled.

---

## Step 4 Prompt

Build the assessment from `docs/01-assessment.md` and the access rules in `docs/05-decisions.md`.

First write `lib/assessment.ts` as pure functions (ISI, 9Q, BMI, STOP-Bang, the result with priority STOP > REFER > NOT-FIT > GO, and flags), plus unit tests for all 19 test cases in section 8. Run the tests and show the results.

Only after they pass, build the screens: consent + PDPA details page, account creation, questions in order, saving after every page, resuming, locking after STOP, the 4 result pages, and "already completed" behaviour. Copy comes word for word from section 7.

## Step 5 Prompt

Build the diary from `docs/03-diary.md` plus overrides in `docs/05-decisions.md`.

First write `lib/diary.ts` (rules D1–D18 and W1–W7, formulas in section 5, midnight handling in 5.2, programme weeks, 5-night minimum), plus unit tests for every test case in section 8, using the updated 8.1 from D6 in `docs/05-decisions.md`. Run them and show the results.

Then build: morning diary form (8 questions), all error and confirmation messages, edit and backfill limits, noon reminder banner, weekly checklist, weekly summary empty states, and the reminder line on the "บันทึกแล้ว" screen. Only GO users can open the diary.

## Step 6 Prompt

Build education from `docs/02-education.md`.

First write `lib/education.ts` (rules E1–E3, A1–A4, B1, C1–C8, D1–D4, and myth rotation using `getNow()`/`getNowServer()`), plus unit tests for all section 8 cases, including myth rotation across 10 simulated days. Run them and show the results.

Then build: "How sleep works" pop-up with 2 tabs and resume; rules screen (opens after first diary save, requires target wake time at rule 1, saves `lesson: เวลาเป้าหมายที่จะตื่น`, reopens until all 6 confirmed); "My rules" in all 3 places with Updated dot; read-only rules for NOT-FIT; Myth of the day banner.

## Step 7 Prompt

Build suggestions from `docs/04-suggestion.md` plus `docs/05-decisions.md`.

First write `lib/suggestion.ts` (R1–R7 with rules-accepted lock added to R1, S1–S10, SF1–SF4, F1–F4, and comparison with week 1), plus unit tests for all 11 section 8 test cases. Run them and show the results.

Then build: weekly "choose what to try" screen (pick 1–2 of 3), safety messages shown even while locked, and the "ทำไม?" button on S1, S2, S3, S4, S7 that opens the matching education card.

## Step 8 Prompt

Build the weekly recap and end-of-program flow: week-vs-week-1 comparison from suggestion section 7.4; final ISI (7 ISI questions only) offered at 4 weeks from the day the user tapped "เริ่มสัปดาห์ที่ 1", using `getNowServer()`; and before/after ISI on recap. Where specs leave the recap layout undecided, show the minimum and list open questions.

## Step 9 Prompt

Run the whole test suite and report pass/fail by spec and test number. Then walk through these journeys with the simulated date and report anything that breaks:
1. GO user from day 1 to day 30
2. NOT-FIT user
3. REFER user
4. STOP user
5. GO user who never accepts the rules
6. GO user who skips 3 diary nights in week 2

Then prepare for Vercel deploy and list the environment variables needed.
