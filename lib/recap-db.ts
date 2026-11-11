import { loadWeekEntries } from '@/lib/diary-db'
import { loadWeek1Stats } from '@/lib/suggestion-db'
import { calcWeekComparison, type WeekStats, type WeekComparison } from '@/lib/suggestion'
import { SUGGESTION_MIN_NIGHTS } from '@/lib/constants'

export interface RecapStats {
  currentWeek: number
  nightsValid: number
  currentWeekStats: WeekStats | null       // null when < 5 nights
  week1Stats: WeekStats | null             // null when week1 < 5 nights
  comparison: WeekComparison | null        // null when either < 5 nights or week = 1
}

/** Load stats for the current programme week and compare with week 1. */
export async function loadRecapStats(
  programmeStartDate: string,
  currentWeek: number
): Promise<RecapStats> {
  const entries = await loadWeekEntries(programmeStartDate, currentWeek)
  const valid = entries.filter(e => e.sleep_time_min !== undefined && e.sleep_time_min !== null)
  const nightsValid = valid.length

  let currentWeekStats: WeekStats | null = null
  if (nightsValid >= SUGGESTION_MIN_NIGHTS) {
    const n = nightsValid
    const totalSleep = valid.reduce((s, e) => s + (e.sleep_time_min ?? 0), 0)
    const totalBed = valid.reduce((s, e) => s + (e.time_in_bed_min ?? 0), 0)
    const totalOnset = valid.reduce((s, e) => s + (e.sleep_onset_min ?? 0), 0)
    currentWeekStats = {
      weeklyEfficiency: totalBed > 0 ? (totalSleep / totalBed) * 100 : 0,
      avgSleepTimeMins: totalSleep / n,
      avgSleepOnsetMins: totalOnset / n,
      nightsValid: n,
    }
  }

  // Week 1 comparison: only relevant from week 2 onwards
  let week1Stats: WeekStats | null = null
  let comparison: WeekComparison | null = null
  if (currentWeek > 1) {
    week1Stats = await loadWeek1Stats(programmeStartDate)
    if (week1Stats && currentWeekStats) {
      comparison = calcWeekComparison(week1Stats, currentWeekStats)
    }
  }

  return { currentWeek, nightsValid, currentWeekStats, week1Stats, comparison }
}
