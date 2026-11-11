/**
 * All [?] values from the specs.
 * Every constant here has a [?] comment meaning it needs team/clinical confirmation
 * before the app goes to real users.
 * Source: docs/01-assessment.md, 02-education.md, 03-diary.md, 04-suggestion.md
 */

// ── Assessment ───────────────────────────────────────────────────────────────

/** ISI score threshold below which user is NOT-FIT (≤ this value → NOT-FIT) */
export const ISI_NOT_FIT_MAX = 7

/** ISI score threshold at or above which user is REFER */
export const ISI_REFER_MIN = 22

/** 9Q score threshold at or above which user is REFER */
export const Q9_REFER_MIN = 13

/** 9Q score range that triggers mild depression flag (flag shown to GO users) */
export const Q9_FLAG_MIN = 7
export const Q9_FLAG_MAX = 12

/** STOP-Bang score at or above which user is REFER */
export const STOP_BANG_REFER_MIN = 5

/** STOP-Bang score range that triggers sleep apnoea flag */
export const STOP_BANG_FLAG_MIN = 3
export const STOP_BANG_FLAG_MAX = 4

/** BMI threshold for STOP-Bang scoring (strictly greater than) */
export const STOP_BANG_BMI_THRESHOLD = 35

/** Neck circumference threshold for STOP-Bang in cm (strictly greater than) */
export const STOP_BANG_NECK_CM_THRESHOLD = 40

/** Age threshold for STOP-Bang scoring (strictly greater than) */
export const STOP_BANG_AGE_THRESHOLD = 50

// ── Education / Rules ────────────────────────────────────────────────────────

/** Minutes awake in bed before getting up (Stimulus Control rule 3) [?] clinical check */
export const MINUTES_AWAKE_BEFORE_RISING = 20 // ค่าคงที่: เวลาลุกจากเตียงเมื่อนอนไม่หลับ

/** Maximum nap duration in minutes [?] clinical check */
export const MAX_NAP_MINUTES = 30 // ค่าคงที่: เวลางีบสูงสุด

/** Latest nap time (24h, local) [?] clinical check */
export const LATEST_NAP_TIME = '15:00' // ค่าคงที่: เวลางีบช้าสุด

// ── Diary ────────────────────────────────────────────────────────────────────

/** Minimum diary nights in a week to be counted as a valid week */
export const MIN_DIARY_NIGHTS = 5 // [?] Washi + หมอ Surat

/** Maximum hours allowed between bedtime and lights-out (D4) */
export const MAX_HOURS_BEDTIME_TO_LIGHTS_OUT = 12 // [?]

/** Maximum hours allowed between last wakeup and out-of-bed (D6) */
export const MAX_HOURS_WAKEUP_TO_OUT_OF_BED = 12 // [?]

/** Hours within which user can backfill a diary entry */
export const BACKFILL_ALLOWED_HOURS = 48 // [?] Washi

/** Hours after which a backfilled entry gets a "late" label */
export const BACKFILL_LATE_LABEL_HOURS = 12 // [?] Washi

/** Noon reminder time (HH:MM local) for diary */
export const DIARY_REMINDER_TIME = '12:00' // [?]

/** Hours within which a diary entry can be edited */
export const DIARY_EDIT_ALLOWED_HOURS = 48 // [?] Washi

/** Minutes of time-in-bed that triggers a "are you sure?" confirmation (D16) */
export const TIME_IN_BED_CONFIRMATION_THRESHOLD_MIN = 960 // [?] Washi

/** Minutes tolerance for "on target wakeup" (ลุกตรงเวลาเป้าหมาย) */
export const TARGET_WAKEUP_TOLERANCE_MIN = 30 // [?] Washi + หมอ Surat

// ── Weekly checklist thresholds ──────────────────────────────────────────────
// W5/W6 defaults — [?] Lunn + หมอ Surat

export const CHECKLIST_DAYS_HIGH_THRESHOLD = 3  // ≥ 3 → triggers S5, S6, S7, S9
export const CHECKLIST_DAYS_LOW_THRESHOLD = 3   // ≤ 3 → triggers S8, S10

// ── Suggestion ───────────────────────────────────────────────────────────────

/** Minimum valid diary nights needed before suggestion can be computed */
export const SUGGESTION_MIN_NIGHTS = 5 // [?]

/** Wake-time range (minutes) threshold for S1 */
export const S1_WAKE_RANGE_THRESHOLD_MIN = 60 // [?]

/** Sleep onset / wakeup duration threshold (minutes) for "hard night" (S2) — strictly greater than */
export const S2_HARD_NIGHT_THRESHOLD_MIN = 20 // [?]

/** Minimum hard nights per week to trigger S2 */
export const S2_HARD_NIGHTS_MIN = 3 // [?]

/** Sleep onset average threshold for S3 / S4 (minutes) — ≥ this value */
export const S3_SLEEP_ONSET_THRESHOLD_MIN = 20 // [?]

/** Days after a suggestion is first taught before it can be shown again */
export const SUGGESTION_NO_REPEAT_DAYS = 14 // [?]

/** Days per suggestion teaching period */
export const SUGGESTION_TEACH_DAYS_MIN = 2 // [?]
export const SUGGESTION_TEACH_DAYS_MAX = 3 // [?]

// ── Safety thresholds (SF1–SF4) — NEVER use with real users until Dr Surat confirms ──

/** Confirmed-zero-sleep nights per week that triggers SF1 */
export const SF1_ZERO_SLEEP_NIGHTS = 2 // [?] Surat

/** Average weekly sleep time below which SF2 fires (minutes) */
export const SF2_SLEEP_TIME_MIN = 240 // [?] Surat

/** Weekly sleep efficiency below which SF3 fires (%) */
export const SF3_EFFICIENCY_THRESHOLD_PCT = 70 // [?] Surat

/** Drop in efficiency (percentage points) from first 3 to last 3 nights of a week to trigger SF4 */
export const SF4_EFFICIENCY_DROP_THRESHOLD = 10 // [?] Surat

// ── Education (B-card why-it-continues thresholds) ───────────────────────────

/** Average efficiency below which B3 card fires (strictly less than) */
export const EDUCATION_EFFICIENCY_THRESHOLD_PCT = 85 // [?] Must match Lunn's value

/** Days napped per week at or above which B1 card fires */
export const EDUCATION_NAP_DAYS_THRESHOLD = 3 // [?]

/** Wake-time range (minutes) above which B2 card fires (strictly greater than) */
export const EDUCATION_WAKE_RANGE_THRESHOLD_MIN = 60 // [?]

/** Total number of myths in the rotation */
export const TOTAL_MYTHS = 9

// ── Comparison thresholds (recap) ────────────────────────────────────────────

/** Sleep efficiency change (pct points) considered "improved" */
export const COMPARE_EFFICIENCY_IMPROVED_THRESHOLD = 3 // [?]

/** Sleep onset change (minutes, negative = improved) */
export const COMPARE_ONSET_IMPROVED_THRESHOLD = -5 // [?]

/** Sleep time change (minutes) considered "improved" */
export const COMPARE_SLEEP_TIME_IMPROVED_THRESHOLD = 15 // [?]

// ── Programme ────────────────────────────────────────────────────────────────

/** Days from programme start (เริ่มสัปดาห์ที่ 1) before final ISI is offered */
export const FINAL_ISI_OFFER_DAY = 28

/** Week boundaries (programme days) for each suggestion round */
export const SUGGESTION_DAYS = [8, 15, 22, 29] // [?] Lunn + Washi
