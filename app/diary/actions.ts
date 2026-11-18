'use server'

import { redirect } from 'next/navigation'
import { getNowServer, toDateString, addDays } from '@/lib/time'
import { parseTime, formatTime, validateDiary } from '@/lib/diary'
import { saveDiaryEntry, loadDiaryEntry, loadTargetWakeupTime, skipDiaryEntry } from '@/lib/diary-db'
import { loadEducationState } from '@/lib/education-db'
import { BACKFILL_ALLOWED_HOURS, BACKFILL_LATE_LABEL_HOURS } from '@/lib/constants'
import type { DiaryInput } from '@/lib/diary'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeField(fd: FormData, name: string): string | null {
  const v = (fd.get(name) as string | null)?.trim()
  return v || null
}

function intField(fd: FormData, name: string): number | null {
  const v = fd.get(name)
  if (v === null || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

// ─── Save diary action ────────────────────────────────────────────────────────

export type DiaryActionState =
  | null
  | { status: 'error'; rule: string; message: string; fields?: string[] }
  | { status: 'confirm'; type: 'D8' | 'D16'; message: string; timeInBed: number }
  | { status: 'save_error'; message: string }

export async function saveDiary(
  _prev: DiaryActionState,
  fd: FormData
): Promise<DiaryActionState> {
  const nightDate = (fd.get('night_date') as string | null)?.trim()
  if (!nightDate) {
    return { status: 'error', rule: 'D3', message: 'ยังขาดอีกนิด ช่วยกรอกช่องที่ไฮไลต์ไว้นะ' }
  }

  const bedtimeStr = timeField(fd, 'bedtime')
  const lightsOutStr = timeField(fd, 'lights_out')
  const finalWakeupStr = timeField(fd, 'final_wakeup')
  const outOfBedStr = timeField(fd, 'out_of_bed')
  const sleepQuality = intField(fd, 'sleep_quality')
  const sleepOnsetMin = intField(fd, 'sleep_onset_min') ?? 0
  const wakeupCountRaw = intField(fd, 'wakeup_count')
  const wakeupCount = wakeupCountRaw ?? 0
  // D1: if wakeup_count = 0, force wakeup_duration = 0
  const wakeupDurationMin = wakeupCount === 0 ? 0 : (intField(fd, 'wakeup_duration_min') ?? 0)

  if (!bedtimeStr || !lightsOutStr || !finalWakeupStr || !outOfBedStr || sleepQuality === null) {
    const missingFields: string[] = []
    if (!bedtimeStr) missingFields.push('bedtime')
    if (!lightsOutStr) missingFields.push('lights_out')
    if (!finalWakeupStr) missingFields.push('final_wakeup')
    if (!outOfBedStr) missingFields.push('out_of_bed')
    if (sleepQuality === null) missingFields.push('sleep_quality')
    return { status: 'error', rule: 'D3', message: 'ยังขาดอีกนิด ช่วยกรอกช่องที่ไฮไลต์ไว้นะ', fields: missingFields }
  }

  const now = await getNowServer()
  // D15 needs the user's local wall-clock time, not the server's UTC time.
  // The client passes now_mins (minutes since midnight, local time) for this purpose.
  const clientNowMins = intField(fd, 'now_mins')
  const nowMins = clientNowMins ?? (now.getHours() * 60 + now.getMinutes())

  // Calculate this early — D15 must be skipped for explicit backfills because
  // those out_of_bed times are always in the past; the minutes-only check has no date context.
  const yesterdayStr = toDateString(addDays(now, -1))
  const isExplicitBackfill = nightDate < yesterdayStr

  const input: DiaryInput = {
    bedtimeMins: parseTime(bedtimeStr),
    lightsOutMins: parseTime(lightsOutStr),
    sleepOnsetMin,
    wakeupCount,
    wakeupDurationMin,
    finalWakeupMins: parseTime(finalWakeupStr),
    outOfBedMins: parseTime(outOfBedStr),
    sleepQuality,
  }

  const confirmed = fd.get('confirmed') as 'D8' | 'D16' | null

  const validation = validateDiary(input, isExplicitBackfill ? undefined : nowMins)

  if (validation.ok === false) {
    return { status: 'error', rule: validation.rule, message: validation.error, fields: validation.fields }
  }

  if (validation.ok === 'confirm') {
    if (confirmed !== validation.type) {
      return {
        status: 'confirm',
        type: validation.type,
        message: validation.message,
        timeInBed: validation.computed.timeInBed,
      }
    }
    // D8 confirmed: save with sleepTime=0
  }

  const { timeInBed, sleepTime, efficiency } = validation.ok === true
    ? validation.computed
    : { timeInBed: validation.computed.timeInBed, sleepTime: 0, efficiency: 0 }

  // D12: check submission timing (backfill rules)
  // Explicit past-date backfill (date < yesterday) skips the time-window check —
  // user deliberately chose to fill an old night from the unfilled-days list.
  const submittedAt = now.toISOString()

  let isBackfill = isExplicitBackfill
  if (!isExplicitBackfill) {
    const outOfBedDate = new Date(`${nightDate}T${outOfBedStr}:00`)
    if (parseTime(outOfBedStr) < 12 * 60) {
      const nextDay = new Date(nightDate)
      nextDay.setDate(nextDay.getDate() + 1)
      outOfBedDate.setFullYear(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate())
    }
    const diffHours = (now.getTime() - outOfBedDate.getTime()) / (1000 * 60 * 60)
    if (diffHours > BACKFILL_ALLOWED_HOURS) {
      return {
        status: 'error',
        rule: 'D12',
        message: 'คืนนั้นผ่านมานานแล้ว ไม่เป็นไร มาบันทึกคืนล่าสุดกันดีกว่า',
      }
    }
    isBackfill = diffHours > BACKFILL_LATE_LABEL_HOURS
  }

  // Load target wakeup time for on_target_wakeup calculation
  const targetTimeStr = await loadTargetWakeupTime()
  const targetMins = targetTimeStr ? parseTime(targetTimeStr) : null
  const { calcOnTargetWakeup } = await import('@/lib/diary')
  const onTargetWakeup = calcOnTargetWakeup(parseTime(outOfBedStr), targetMins)

  const { error } = await saveDiaryEntry({
    night_date: nightDate,
    bedtime: bedtimeStr,
    lights_out: lightsOutStr,
    sleep_onset_min: sleepOnsetMin,
    wakeup_count: wakeupCount,
    wakeup_duration_min: wakeupDurationMin,
    final_wakeup: finalWakeupStr,
    out_of_bed: outOfBedStr,
    sleep_quality: sleepQuality,
    submitted_at: submittedAt,
    is_backfill: isBackfill,
    time_in_bed_min: timeInBed,
    sleep_time_min: sleepTime,
    sleep_efficiency_pct: efficiency,
    on_target_wakeup: onTargetWakeup,
  })

  if (error) {
    return { status: 'save_error', message: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้งนะ' }
  }

  // C1: after first diary save, if rules not yet confirmed → open rules screen
  const eduState = await loadEducationState()
  if (!eduState?.rules_accepted) {
    redirect('/education/rules')
  }

  // Always return to diary page — user taps "เสร็จแล้ว" when ready to leave
  redirect('/diary')
}

// ─── Skip action ──────────────────────────────────────────────────────────────

export async function skipDiaryDay(fd: FormData) {
  const nightDate = (fd.get('night_date') as string | null)?.trim()
  if (nightDate) {
    await skipDiaryEntry(nightDate)
  }
  redirect('/diary')
}
