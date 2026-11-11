import {
  SUGGESTION_MIN_NIGHTS,
  S1_WAKE_RANGE_THRESHOLD_MIN,
  S2_HARD_NIGHT_THRESHOLD_MIN,
  S2_HARD_NIGHTS_MIN,
  S3_SLEEP_ONSET_THRESHOLD_MIN,
  CHECKLIST_DAYS_HIGH_THRESHOLD,
  CHECKLIST_DAYS_LOW_THRESHOLD,
  SF1_ZERO_SLEEP_NIGHTS,
  SF2_SLEEP_TIME_MIN,
  SF3_EFFICIENCY_THRESHOLD_PCT,
  SF4_EFFICIENCY_DROP_THRESHOLD,
  COMPARE_EFFICIENCY_IMPROVED_THRESHOLD,
  COMPARE_ONSET_IMPROVED_THRESHOLD,
  COMPARE_SLEEP_TIME_IMPROVED_THRESHOLD,
} from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClockCheck = 'never' | 'sometimes' | 'often'

export interface SuggestionChecklist {
  caffeineNearBed: number
  naps: number
  exercise: number
  alcoholNearBed: number
  heavyMealOrExercise: number
  dimLights: number
  screenInBed: number
  clockCheck: ClockCheck
}

export interface SuggestionInput {
  /** Number of valid diary nights this week (0–7) */
  nightsValid: number
  /** max − min of out_of_bed_mins for valid nights (minutes) */
  outOfBedRange: number
  /** Count of valid nights where sleepOnset > 20 OR wakeupDuration > 20 */
  hardNights: number
  /** Average sleep onset (minutes) across valid nights */
  avgSleepOnsetMins: number
  /** Weekly sleep efficiency (percent, e.g. 83.1) */
  weeklyEfficiency: number
  /** Average sleep time (minutes) across valid nights */
  avgSleepTimeMins: number
  /** Per-night sleep efficiency in chronological order (valid nights only) — for SF4 */
  nightlyEfficiencies: number[]
  /** Count of nights with confirmed zero sleep (D8) — for SF1 */
  zeroSleepNights: number
  /** Weekly checklist; absent → F3 mode (diary-only S1–S4) */
  checklist?: SuggestionChecklist
  /** Suggestion IDs taught within the last SUGGESTION_NO_REPEAT_DAYS days */
  taughtRecently: string[]
  /** Whether S3 was ever taught to this user (prerequisite for S4) */
  s3TaughtBefore: boolean
}

export interface SuggestionResult {
  status: 'F1' | 'F2' | 'suggestions'
  queue: string[]
  topThree: string[]
  safetyFlags: string[]
  s2AddScreen: boolean
  s2AddClock: boolean
}

export interface WeekStats {
  weeklyEfficiency: number
  avgSleepTimeMins: number
  avgSleepOnsetMins: number
  nightsValid: number
}

export type Trend = 'improved' | 'unchanged' | 'worse'

export interface WeekComparison {
  efficiency: { week1: number; current: number; trend: Trend }
  sleepOnset: { week1: number; current: number; trend: Trend }
  sleepTime: { week1: number; current: number; trend: Trend }
}

// ─── Helper calculations ──────────────────────────────────────────────────────

/**
 * Range of out-of-bed times in minutes (max − min).
 * S1: range ≥ S1_WAKE_RANGE_THRESHOLD_MIN.
 */
export function calcOutOfBedRange(outOfBedMins: number[]): number {
  if (outOfBedMins.length < 2) return 0
  const max = Math.max(...outOfBedMins)
  const min = Math.min(...outOfBedMins)
  return max - min
}

/**
 * Count of valid nights where sleep onset > S2_HARD_NIGHT_THRESHOLD_MIN
 * OR wakeup duration > S2_HARD_NIGHT_THRESHOLD_MIN (strictly greater, not ≥).
 */
export function calcHardNights(
  entries: { sleepOnsetMin: number; wakeupDurationMin: number }[],
): number {
  return entries.filter(
    e =>
      e.sleepOnsetMin > S2_HARD_NIGHT_THRESHOLD_MIN ||
      e.wakeupDurationMin > S2_HARD_NIGHT_THRESHOLD_MIN,
  ).length
}

// ─── Safety flags ─────────────────────────────────────────────────────────────

function calcSafetyFlags(input: SuggestionInput): string[] {
  const flags: string[] = []

  // SF1: ≥ 2 confirmed zero-sleep nights
  if (input.zeroSleepNights >= SF1_ZERO_SLEEP_NIGHTS) flags.push('SF1')

  // SF2: avg sleep time < 240 min
  if (input.avgSleepTimeMins < SF2_SLEEP_TIME_MIN) flags.push('SF2')

  // SF3: weekly efficiency < 70%
  if (input.weeklyEfficiency < SF3_EFFICIENCY_THRESHOLD_PCT) flags.push('SF3')

  // SF4: avg of first 3 nights' efficiency − avg of last 3 nights' efficiency ≥ 10 points
  // Only computed when nightsValid ≥ 6
  if (input.nightsValid >= 6 && input.nightlyEfficiencies.length >= 6) {
    const eff = input.nightlyEfficiencies
    const first3 = eff.slice(0, 3)
    const last3 = eff.slice(-3)
    const avgFirst = first3.reduce((a, b) => a + b, 0) / 3
    const avgLast = last3.reduce((a, b) => a + b, 0) / 3
    if (avgFirst - avgLast >= SF4_EFFICIENCY_DROP_THRESHOLD) flags.push('SF4')
  }

  return flags
}

// ─── Suggestion queue ─────────────────────────────────────────────────────────

function buildQueue(input: SuggestionInput): string[] {
  const { checklist, taughtRecently, s3TaughtBefore, avgSleepOnsetMins, outOfBedRange, hardNights } = input
  const hasChecklist = checklist !== undefined
  const queue: string[] = []

  // Priority 1 — S1: wake range ≥ threshold
  if (outOfBedRange >= S1_WAKE_RANGE_THRESHOLD_MIN) queue.push('S1')

  // Priority 2 — S2: hard nights ≥ threshold
  if (hardNights >= S2_HARD_NIGHTS_MIN) queue.push('S2')

  // Checklist-based S5–S10 only evaluated when checklist present (R6/F3)
  if (hasChecklist) {
    // Priority 3 — S5: caffeine days ≥ threshold
    if (checklist!.caffeineNearBed >= CHECKLIST_DAYS_HIGH_THRESHOLD) queue.push('S5')

    // Priority 4 — S6: alcohol days ≥ threshold
    if (checklist!.alcoholNearBed >= CHECKLIST_DAYS_HIGH_THRESHOLD) queue.push('S6')

    // Priority 5 — S9: heavy meal/exercise days ≥ threshold
    if (checklist!.heavyMealOrExercise >= CHECKLIST_DAYS_HIGH_THRESHOLD) queue.push('S9')

    // Priority 6 — S10: dim lights days ≤ threshold
    if (checklist!.dimLights <= CHECKLIST_DAYS_LOW_THRESHOLD) queue.push('S10')
  }

  // Priority 7 — S3: avg sleep onset ≥ threshold
  if (avgSleepOnsetMins >= S3_SLEEP_ONSET_THRESHOLD_MIN) queue.push('S3')

  if (hasChecklist) {
    // Priority 8 — S8: exercise days ≤ threshold
    if (checklist!.exercise <= CHECKLIST_DAYS_LOW_THRESHOLD) queue.push('S8')

    // Priority 9 — S7: nap days ≥ threshold
    if (checklist!.naps >= CHECKLIST_DAYS_HIGH_THRESHOLD) queue.push('S7')
  }

  // Priority 10 — S4: S3 taught before AND onset ≥ threshold
  if (s3TaughtBefore && avgSleepOnsetMins >= S3_SLEEP_ONSET_THRESHOLD_MIN) queue.push('S4')

  // Remove items taught within the no-repeat window
  return queue.filter(s => !taughtRecently.includes(s))
}

// ─── Main function ────────────────────────────────────────────────────────────

export function calcSuggestions(input: SuggestionInput): SuggestionResult {
  const noResult: SuggestionResult = {
    status: 'F1',
    queue: [],
    topThree: [],
    safetyFlags: [],
    s2AddScreen: false,
    s2AddClock: false,
  }

  // R1/F1: insufficient nights
  if (input.nightsValid < SUGGESTION_MIN_NIGHTS) return noResult

  const safetyFlags = calcSafetyFlags(input)
  const queue = buildQueue(input)
  const topThree = queue.slice(0, 3)

  // S2 enrichment sentences (only when checklist present)
  const s2AddScreen =
    input.checklist !== undefined &&
    input.checklist.screenInBed >= CHECKLIST_DAYS_HIGH_THRESHOLD

  const s2AddClock =
    input.checklist !== undefined && input.checklist.clockCheck === 'often'

  // R2/F2: no conditions met and no safety flags needing attention
  if (queue.length === 0) {
    return {
      status: 'F2',
      queue: [],
      topThree: [],
      safetyFlags,
      s2AddScreen: false,
      s2AddClock: false,
    }
  }

  return {
    status: 'suggestions',
    queue,
    topThree,
    safetyFlags,
    s2AddScreen,
    s2AddClock,
  }
}

// ─── Week comparison ──────────────────────────────────────────────────────────

/**
 * Compare current week stats against week 1.
 * Returns null when either week lacks enough nights (< MIN_SUGGESTION_NIGHTS).
 * R7: only weeks where nightsValid ≥ SUGGESTION_MIN_NIGHTS are comparable.
 */
export function calcWeekComparison(
  week1: WeekStats,
  current: WeekStats,
): WeekComparison | null {
  if (week1.nightsValid < SUGGESTION_MIN_NIGHTS || current.nightsValid < SUGGESTION_MIN_NIGHTS) {
    return null
  }

  function effTrend(diff: number): Trend {
    if (diff >= COMPARE_EFFICIENCY_IMPROVED_THRESHOLD) return 'improved'
    if (diff <= -COMPARE_EFFICIENCY_IMPROVED_THRESHOLD) return 'worse'
    return 'unchanged'
  }

  function onsetTrend(diff: number): Trend {
    // Lower onset is better
    if (diff <= COMPARE_ONSET_IMPROVED_THRESHOLD) return 'improved'
    if (diff >= -COMPARE_ONSET_IMPROVED_THRESHOLD) return 'worse'
    return 'unchanged'
  }

  function sleepTimeTrend(diff: number): Trend {
    if (diff >= COMPARE_SLEEP_TIME_IMPROVED_THRESHOLD) return 'improved'
    if (diff <= -COMPARE_SLEEP_TIME_IMPROVED_THRESHOLD) return 'worse'
    return 'unchanged'
  }

  return {
    efficiency: {
      week1: week1.weeklyEfficiency,
      current: current.weeklyEfficiency,
      trend: effTrend(current.weeklyEfficiency - week1.weeklyEfficiency),
    },
    sleepOnset: {
      week1: week1.avgSleepOnsetMins,
      current: current.avgSleepOnsetMins,
      trend: onsetTrend(current.avgSleepOnsetMins - week1.avgSleepOnsetMins),
    },
    sleepTime: {
      week1: week1.avgSleepTimeMins,
      current: current.avgSleepTimeMins,
      trend: sleepTimeTrend(current.avgSleepTimeMins - week1.avgSleepTimeMins),
    },
  }
}
