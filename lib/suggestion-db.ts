import { createClient } from '@/lib/supabase/server'
import { parseTime } from '@/lib/diary'
import { calcOutOfBedRange, calcHardNights, type SuggestionInput, type SuggestionChecklist } from '@/lib/suggestion'
import { loadWeekEntries, loadChecklist } from '@/lib/diary-db'
import { SUGGESTION_NO_REPEAT_DAYS, SUGGESTION_MIN_NIGHTS } from '@/lib/constants'

// ─── Row types ────────────────────────────────────────────────────────────────

export interface SuggestionStateRow {
  id?: string
  user_id?: string
  eval_week_number?: number | null
  queue?: string[]
  top_three?: string[]
  safety_flags?: string[]
  s2_add_screen?: boolean
  s2_add_clock?: boolean
  selected?: string[] | null
  teach_started_at?: string | null  // ISO date
  status?: 'F1' | 'F2' | 'suggestions'
  // Stats stored for rendering message text without re-loading diary entries
  out_of_bed_range_mins?: number | null
  avg_sleep_onset_mins?: number | null
  caffeine_near_bed_days?: number | null
  alcohol_near_bed_days?: number | null
  dim_lights_days?: number | null
  exercise_days?: number | null
}

export interface SuggestionHistoryRow {
  id?: string
  user_id?: string
  suggestion_id?: string
  week_number?: number
  started_at?: string  // ISO date YYYY-MM-DD
}

// ─── Load / save state ────────────────────────────────────────────────────────

/** Load the current suggestion state for the authenticated user. */
export async function loadSuggestionState(): Promise<SuggestionStateRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('suggestion_state')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/** Upsert partial suggestion state fields. */
export async function saveSuggestionState(
  fields: Partial<Omit<SuggestionStateRow, 'id' | 'user_id'>>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('suggestion_state')
    .upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' })

  return { error: error?.message ?? null }
}

/** Save user's selection (R3) and record each item in suggestion_history. */
export async function saveSuggestionSelection(
  weekNumber: number,
  selected: string[],
  teachStartedAt: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  // Update state with selection
  const { error: stateErr } = await supabase
    .from('suggestion_state')
    .upsert(
      { user_id: user.id, selected, teach_started_at: teachStartedAt },
      { onConflict: 'user_id' }
    )
  if (stateErr) return { error: stateErr.message }

  // Record each selected item in history for no-repeat tracking
  const historyRows = selected.map(id => ({
    user_id: user.id,
    suggestion_id: id,
    week_number: weekNumber,
    started_at: teachStartedAt,
  }))

  const { error: histErr } = await supabase
    .from('suggestion_history')
    .insert(historyRows)

  return { error: histErr?.message ?? null }
}

/**
 * Load suggestion IDs taught within the last SUGGESTION_NO_REPEAT_DAYS.
 * cutoffDate: 'YYYY-MM-DD' — items taught on or after this date are excluded.
 */
export async function loadTaughtRecently(cutoffDate: string): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('suggestion_history')
    .select('suggestion_id')
    .eq('user_id', user.id)
    .gte('started_at', cutoffDate)

  return (data ?? []).map(r => r.suggestion_id).filter(Boolean) as string[]
}

/** Check whether S3 was ever taught (prerequisite for S4). */
export async function loadS3TaughtBefore(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('suggestion_history')
    .select('id')
    .eq('user_id', user.id)
    .eq('suggestion_id', 'S3')
    .limit(1)
    .maybeSingle()

  return data !== null
}

// ─── Assemble SuggestionInput from diary + checklist ─────────────────────────

export interface SuggestionRenderStats {
  outOfBedRangeMins: number
  avgSleepOnsetMins: number
  caffeineNearBedDays: number
  alcoholNearBedDays: number
  dimLightsDays: number
  exerciseDays: number
}

/**
 * Load and assemble all inputs needed to call calcSuggestions for a given week.
 * Returns null if data is insufficient to build the input object.
 */
export async function loadSuggestionInput(
  programmeStartDate: string,
  weekNumber: number,
  today: string
): Promise<(SuggestionInput & { renderStats: SuggestionRenderStats }) | null> {
  const [entries, checklistRow, taughtRecently, s3TaughtBefore] = await Promise.all([
    loadWeekEntries(programmeStartDate, weekNumber),
    loadChecklist(weekNumber),
    loadTaughtRecently(offsetDate(today, -SUGGESTION_NO_REPEAT_DAYS)),
    loadS3TaughtBefore(),
  ])

  const validEntries = entries.filter(e => e.sleep_time_min !== undefined)
  const nightsValid = validEntries.length

  // Compute outOfBedRange from out_of_bed times
  const outOfBedMins = validEntries
    .map(e => e.out_of_bed ? parseTime(e.out_of_bed) : null)
    .filter((m): m is number => m !== null)

  const outOfBedRange = calcOutOfBedRange(outOfBedMins)

  // Compute hardNights from sleep onset + wakeup duration
  const hardNightEntries = validEntries
    .filter(e => e.sleep_onset_min !== undefined && e.wakeup_duration_min !== undefined)
    .map(e => ({
      sleepOnsetMin: e.sleep_onset_min!,
      wakeupDurationMin: e.wakeup_duration_min!,
    }))

  const hardNights = calcHardNights(hardNightEntries)

  // Weekly stats (from stored computed columns)
  const totalSleepMins = validEntries.reduce((s, e) => s + (e.sleep_time_min ?? 0), 0)
  const totalBedMins = validEntries.reduce((s, e) => s + (e.time_in_bed_min ?? 0), 0)
  const weeklyEfficiency = totalBedMins > 0 ? (totalSleepMins / totalBedMins) * 100 : 0
  const avgSleepTimeMins = nightsValid > 0 ? totalSleepMins / nightsValid : 0
  const totalOnset = validEntries.reduce((s, e) => s + (e.sleep_onset_min ?? 0), 0)
  const avgSleepOnsetMins = nightsValid > 0 ? totalOnset / nightsValid : 0

  // Per-night efficiencies in chronological order (for SF4)
  const nightlyEfficiencies = validEntries.map(e => e.sleep_efficiency_pct ?? 0)

  // Zero sleep nights (D8 confirmed: sleep_time_min = 0 and was saved via D8 confirm)
  const zeroSleepNights = validEntries.filter(e => (e.sleep_time_min ?? -1) === 0).length

  // Checklist fields (R6/F3: absent when not submitted)
  let checklist: SuggestionChecklist | undefined = undefined
  if (checklistRow) {
    checklist = {
      caffeineNearBed: checklistRow.days_caffeine_near_bed ?? 0,
      naps: checklistRow.days_napped ?? 0,
      exercise: checklistRow.days_exercised ?? 0,
      alcoholNearBed: checklistRow.days_alcohol_near_bed ?? 0,
      heavyMealOrExercise: checklistRow.days_heavy_meal_or_exercise ?? 0,
      dimLights: checklistRow.days_dim_light ?? 0,
      screenInBed: checklistRow.days_screen_in_bed ?? 0,
      clockCheck: (checklistRow.clock_check_frequency as SuggestionChecklist['clockCheck']) ?? 'never',
    }
  }

  return {
    nightsValid,
    outOfBedRange,
    hardNights,
    avgSleepOnsetMins,
    weeklyEfficiency,
    avgSleepTimeMins,
    nightlyEfficiencies,
    zeroSleepNights,
    checklist,
    taughtRecently,
    s3TaughtBefore,
    renderStats: {
      outOfBedRangeMins: outOfBedRange,
      avgSleepOnsetMins,
      caffeineNearBedDays: checklist?.caffeineNearBed ?? 0,
      alcoholNearBedDays: checklist?.alcoholNearBed ?? 0,
      dimLightsDays: checklist?.dimLights ?? 0,
      exerciseDays: checklist?.exercise ?? 0,
    },
  }
}

/** Load week 1 stats for comparison (R7). Returns null if week 1 had < MIN nights. */
export async function loadWeek1Stats(programmeStartDate: string): Promise<{
  weeklyEfficiency: number
  avgSleepTimeMins: number
  avgSleepOnsetMins: number
  nightsValid: number
} | null> {
  const entries = await loadWeekEntries(programmeStartDate, 1)
  const valid = entries.filter(e => e.sleep_time_min !== undefined)
  if (valid.length < SUGGESTION_MIN_NIGHTS) return null

  const totalSleep = valid.reduce((s, e) => s + (e.sleep_time_min ?? 0), 0)
  const totalBed = valid.reduce((s, e) => s + (e.time_in_bed_min ?? 0), 0)
  const totalOnset = valid.reduce((s, e) => s + (e.sleep_onset_min ?? 0), 0)
  const n = valid.length

  return {
    weeklyEfficiency: totalBed > 0 ? (totalSleep / totalBed) * 100 : 0,
    avgSleepTimeMins: totalSleep / n,
    avgSleepOnsetMins: totalOnset / n,
    nightsValid: n,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Offset a 'YYYY-MM-DD' date string by `days` (negative = past). */
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
