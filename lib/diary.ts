import {
  TARGET_WAKEUP_TOLERANCE_MIN,
  MIN_DIARY_NIGHTS,
  MAX_HOURS_WAKEUP_TO_OUT_OF_BED,
  TIME_IN_BED_CONFIRMATION_THRESHOLD_MIN,
  CHECKLIST_DAYS_HIGH_THRESHOLD,
  CHECKLIST_DAYS_LOW_THRESHOLD,
} from './constants'

// ─── Time helpers ────────────────────────────────────────────────────────────

/** Parse "HH:MM" → minutes since midnight (0–1439). */
export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Format minutes since midnight → "HH:MM". */
export function formatTime(mins: number): string {
  const h = Math.floor(((mins % 1440) + 1440) % 1440 / 60)
  const m = ((mins % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Minutes going forward from `from` to `to`.
 * Always returns 0–1439 (midnight-wrapping).
 * D4 / D6 rules rely on this: lights-out "goes forward" from bedtime.
 */
export function minutesDiff(fromMins: number, toMins: number): number {
  if (toMins >= fromMins) return toMins - fromMins
  return 1440 - fromMins + toMins
}

// ─── Per-night calculations ───────────────────────────────────────────────────

/** คำนวณ: เวลาบนเตียง (D formula from docs/03-diary.md §5.1). */
export function calcTimeInBed(bedtimeMins: number, outOfBedMins: number): number {
  return minutesDiff(bedtimeMins, outOfBedMins)
}

/** Interval from lights-out to final wakeup (minutes, midnight-wrapping). */
export function calcSleepWindow(lightsOutMins: number, finalWakeupMins: number): number {
  return minutesDiff(lightsOutMins, finalWakeupMins)
}

/** คำนวณ: เวลาหลับจริง = sleepWindow − sleepOnset − wakeupDuration. */
export function calcSleepTime(
  lightsOutMins: number,
  finalWakeupMins: number,
  sleepOnsetMin: number,
  wakeupDurationMin: number
): number {
  return calcSleepWindow(lightsOutMins, finalWakeupMins) - sleepOnsetMin - wakeupDurationMin
}

/** คำนวณ: ประสิทธิภาพการนอน — stored 2dp; display 1dp. */
export function calcSleepEfficiency(sleepTimeMin: number, timeInBedMin: number): number {
  if (timeInBedMin === 0) return 0
  return Math.round((sleepTimeMin / timeInBedMin) * 10000) / 100
}

/** คำนวณ: ลุกตรงเวลาเป้าหมาย. */
export function calcOnTargetWakeup(
  outOfBedMins: number,
  targetWakeupMins: number | null,
  toleranceMin: number = TARGET_WAKEUP_TOLERANCE_MIN
): 'yes' | 'no' | 'not_counted' {
  if (targetWakeupMins === null) return 'not_counted'
  const raw = Math.abs(outOfBedMins - targetWakeupMins)
  const diff = Math.min(raw, 1440 - raw)
  return diff <= toleranceMin ? 'yes' : 'no'
}

// ─── Validation (D3–D8, D15, D16) ────────────────────────────────────────────

export interface DiaryInput {
  bedtimeMins: number
  lightsOutMins: number
  sleepOnsetMin: number
  wakeupCount: number
  wakeupDurationMin: number
  finalWakeupMins: number
  outOfBedMins: number
  sleepQuality: number
}

export type DiaryValidationError = { ok: false; rule: string; error: string; fields?: string[] }
export type DiaryValidationConfirm = {
  ok: 'confirm'; type: 'D8' | 'D16'; message: string
  computed: { timeInBed: number }
}
export type DiaryValidationOk = {
  ok: true
  computed: { timeInBed: number; sleepTime: number; efficiency: number }
}
export type DiaryValidationResult = DiaryValidationError | DiaryValidationConfirm | DiaryValidationOk

/**
 * Validate a diary entry (D3–D8, D15, D16).
 * Pass nowMins (current time, minutes-since-midnight) for D15.
 * Returns ok:true with computed values, ok:'confirm' when user confirmation is needed,
 * or ok:false with error details.
 */
export function validateDiary(input: DiaryInput, nowMins?: number): DiaryValidationResult {
  const { bedtimeMins, lightsOutMins, sleepOnsetMin, wakeupCount, wakeupDurationMin, finalWakeupMins, outOfBedMins, sleepQuality } = input

  // D3: required fields
  if (sleepQuality < 1 || sleepQuality > 5) {
    return { ok: false, rule: 'D3', error: 'ยังขาดอีกนิด ช่วยกรอกช่องที่ไฮไลต์ไว้นะ', fields: ['sleep_quality'] }
  }

  // D5: final_wakeup cannot equal lights_out
  if (finalWakeupMins === lightsOutMins) {
    return { ok: false, rule: 'D5', error: 'เวลาตื่นตรงกับเวลาตั้งใจนอนพอดี ลองเช็กอีกครั้ง', fields: ['final_wakeup'] }
  }

  // D6: out_of_bed within 12h forward from final_wakeup
  if (minutesDiff(finalWakeupMins, outOfBedMins) > MAX_HOURS_WAKEUP_TO_OUT_OF_BED * 60) {
    return { ok: false, rule: 'D6', error: 'เวลาลุกจากเตียงอยู่ก่อนเวลาตื่น ลองเช็กอีกครั้ง', fields: ['out_of_bed'] }
  }

  // D7: sleepOnset + wakeupDuration must not exceed sleep window
  const sleepWindow = calcSleepWindow(lightsOutMins, finalWakeupMins)
  const totalAwake = sleepOnsetMin + wakeupDurationMin
  if (totalAwake > sleepWindow) {
    return {
      ok: false, rule: 'D7',
      error: `กว่าจะหลับรวมกับตื่นกลางดึก (${totalAwake} นาที) มากกว่าช่วงตั้งแต่ตั้งใจนอนถึงตื่น (${sleepWindow} นาที) ลองแก้สองช่องที่ไฮไลต์`,
      fields: ['sleep_onset_min', 'wakeup_duration_min'],
    }
  }

  const sleepTime = sleepWindow - totalAwake
  const timeInBed = calcTimeInBed(bedtimeMins, outOfBedMins)

  // D8: zero sleep → confirm
  if (sleepTime === 0) {
    return { ok: 'confirm', type: 'D8', message: 'เมื่อคืนไม่ได้หลับเลยใช่ไหม?', computed: { timeInBed } }
  }

  // D15: out_of_bed must not be in the future
  if (nowMins !== undefined) {
    const diff = outOfBedMins - nowMins
    if (diff > 0 && diff < 720) {
      return { ok: false, rule: 'D15', error: 'เวลานี้ยังมาไม่ถึง ไว้กลับมาบันทึกตอนเช้านะ', fields: ['out_of_bed', 'final_wakeup'] }
    }
  }

  // D16: time in bed > threshold → confirm
  if (timeInBed > TIME_IN_BED_CONFIRMATION_THRESHOLD_MIN) {
    const h = Math.floor(timeInBed / 60)
    const m = timeInBed % 60
    return {
      ok: 'confirm', type: 'D16',
      message: `อยู่บนเตียงรวม ${h} ชม. ${m} นาที ถูกไหม? ลองเช็กว่าเลือกเวลาเช้า-ค่ำถูกหรือเปล่า`,
      computed: { timeInBed },
    }
  }

  return { ok: true, computed: { timeInBed, sleepTime, efficiency: calcSleepEfficiency(sleepTime, timeInBed) } }
}

// ─── Weekly stats (D14 and §5.3) ─────────────────────────────────────────────

export interface DiaryEntryStats {
  timeInBed: number
  sleepTime: number
  sleepEfficiency: number
  sleepOnset: number
  onTargetWakeup: 'yes' | 'no' | 'not_counted'
}

export interface WeeklyStats {
  nightsUsed: number
  avgSleepTime: number      // rounded to nearest minute
  avgTimeInBed: number      // rounded to nearest minute
  weeklyEfficiency: number  // total sleep / total bed * 100, 2dp stored
  avgSleepOnset: number     // rounded to nearest minute
  onTargetCount: number
  onTargetDenominator: number
}

/** Returns null when fewer than MIN_DIARY_NIGHTS entries (D14). */
export function calcWeeklyStats(entries: DiaryEntryStats[]): WeeklyStats | null {
  if (entries.length < MIN_DIARY_NIGHTS) return null
  const n = entries.length
  const totalSleep = entries.reduce((s, e) => s + e.sleepTime, 0)
  const totalBed = entries.reduce((s, e) => s + e.timeInBed, 0)
  const totalOnset = entries.reduce((s, e) => s + e.sleepOnset, 0)
  const counted = entries.filter(e => e.onTargetWakeup !== 'not_counted')
  return {
    nightsUsed: n,
    avgSleepTime: Math.round(totalSleep / n),
    avgTimeInBed: Math.round(totalBed / n),
    weeklyEfficiency: Math.round((totalSleep / totalBed) * 10000) / 100,
    avgSleepOnset: Math.round(totalOnset / n),
    onTargetCount: counted.filter(e => e.onTargetWakeup === 'yes').length,
    onTargetDenominator: counted.length,
  }
}

// ─── Checklist signals (W5–W7) ───────────────────────────────────────────────

export interface ChecklistInput {
  daysMorningLight: number
  daysCaffeine: number
  daysNapped: number
  daysExercised: number
  daysAlcohol: number
  daysHeavyMeal: number
  daysDimLight: number
  daysScreenInBed: number
  clockCheckFrequency: 'never' | 'sometimes' | 'often'
}

/**
 * Returns the signal keys to send to suggestion (Lunn).
 * W5: harmful behaviors ≥ threshold; W6: helpful behaviors ≤ threshold; W7: clock check = often.
 */
export function calcChecklistSignals(cl: ChecklistInput): string[] {
  const signals: string[] = []
  // W5 — harmful (too many)
  if (cl.daysCaffeine >= CHECKLIST_DAYS_HIGH_THRESHOLD) signals.push('caffeine')
  if (cl.daysNapped >= CHECKLIST_DAYS_HIGH_THRESHOLD) signals.push('nap')
  if (cl.daysAlcohol >= CHECKLIST_DAYS_HIGH_THRESHOLD) signals.push('alcohol')
  if (cl.daysHeavyMeal >= CHECKLIST_DAYS_HIGH_THRESHOLD) signals.push('heavy_meal')
  if (cl.daysScreenInBed >= CHECKLIST_DAYS_HIGH_THRESHOLD) signals.push('screen_in_bed')
  // W6 — helpful (too few)
  if (cl.daysMorningLight <= CHECKLIST_DAYS_LOW_THRESHOLD) signals.push('morning_light')
  if (cl.daysExercised <= CHECKLIST_DAYS_LOW_THRESHOLD) signals.push('exercise')
  if (cl.daysDimLight <= CHECKLIST_DAYS_LOW_THRESHOLD) signals.push('dim_light')
  // W7 — clock checking
  if (cl.clockCheckFrequency === 'often') signals.push('clock_check')
  return signals
}
