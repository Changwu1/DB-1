import { describe, it, expect } from 'vitest'
import {
  parseTime,
  formatTime,
  minutesDiff,
  calcTimeInBed,
  calcSleepWindow,
  calcSleepTime,
  calcSleepEfficiency,
  calcOnTargetWakeup,
  validateDiary,
  calcWeeklyStats,
  calcChecklistSignals,
  type DiaryInput,
  type DiaryEntryStats,
  type ChecklistInput,
} from '@/lib/diary'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const p = parseTime

// ─── parseTime / formatTime ───────────────────────────────────────────────────

describe('parseTime', () => {
  it('parses HH:MM to minutes-since-midnight', () => {
    expect(p('00:00')).toBe(0)
    expect(p('23:30')).toBe(1410)
    expect(p('07:00')).toBe(420)
    expect(p('00:10')).toBe(10)
  })
})

describe('formatTime', () => {
  it('formats minutes-since-midnight to HH:MM', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(1410)).toBe('23:30')
    expect(formatTime(420)).toBe('07:00')
  })

  it('handles negative and over-1440 by wrapping', () => {
    expect(formatTime(-30)).toBe('23:30')
    expect(formatTime(1440)).toBe('00:00')
  })
})

// ─── minutesDiff — midnight-crossing ─────────────────────────────────────────

describe('minutesDiff', () => {
  it('same-day forward', () => {
    expect(minutesDiff(p('23:30'), p('23:45'))).toBe(15)
  })

  it('midnight-crossing: 23:45 → 00:10 = 25 min (spec §6 bedtime 23:45, lights-out 00:10)', () => {
    expect(minutesDiff(p('23:45'), p('00:10'))).toBe(25)
  })

  it('midnight-crossing: 23:30 → 07:10 = 460 min (spec TC1 time-in-bed)', () => {
    expect(minutesDiff(p('23:30'), p('07:10'))).toBe(460)
  })

  it('equal times → 0', () => {
    expect(minutesDiff(420, 420)).toBe(0)
  })
})

// ─── Per-night calculations — spec §8.1 TC1–7 ────────────────────────────────

describe('spec TC1 — 23:30 / 23:45 / 50 / 1×10 / 07:00 / 07:10 / quality 2', () => {
  const bed = p('23:30'), lo = p('23:45'), fw = p('07:00'), oob = p('07:10')
  it('timeInBed = 460', () => expect(calcTimeInBed(bed, oob)).toBe(460))
  it('sleepWindow = 435', () => expect(calcSleepWindow(lo, fw)).toBe(435))
  it('sleepTime = 375', () => expect(calcSleepTime(lo, fw, 50, 10)).toBe(375))
  it('efficiency stored as 2dp = 81.52', () => expect(calcSleepEfficiency(375, 460)).toBe(81.52))
  it('onTarget = not_counted (no target)', () => expect(calcOnTargetWakeup(oob, null)).toBe('not_counted'))
})

describe('spec TC2 — 23:30 / 23:40 / 45 / 2×20 / 06:50 / 07:00 / quality 2 (target 07:00 set via D6)', () => {
  const bed = p('23:30'), lo = p('23:40'), fw = p('06:50'), oob = p('07:00'), target = p('07:00')
  it('timeInBed = 450', () => expect(calcTimeInBed(bed, oob)).toBe(450))
  it('sleepWindow = 430', () => expect(calcSleepWindow(lo, fw)).toBe(430))
  it('sleepTime = 365', () => expect(calcSleepTime(lo, fw, 45, 20)).toBe(365))
  it('efficiency = 81.11', () => expect(calcSleepEfficiency(365, 450)).toBe(81.11))
  // D6 decision: target is set from day 1 → TC2 is 'yes' (changed from 'not_counted' in spec)
  it('onTarget = yes (D6 override — target set before night 2)', () => {
    expect(calcOnTargetWakeup(oob, target)).toBe('yes')
  })
})

describe('spec TC3 — 23:45 / 00:10 / 60 / 1×10 / 07:00 / 07:15 (midnight cross)', () => {
  const bed = p('23:45'), lo = p('00:10'), fw = p('07:00'), oob = p('07:15'), target = p('07:00')
  it('timeInBed = 450', () => expect(calcTimeInBed(bed, oob)).toBe(450))
  it('sleepWindow = 410', () => expect(calcSleepWindow(lo, fw)).toBe(410))
  it('sleepTime = 340', () => expect(calcSleepTime(lo, fw, 60, 10)).toBe(340))
  it('efficiency = 75.56', () => expect(calcSleepEfficiency(340, 450)).toBe(75.56))
  it('onTarget = yes (ห่าง 15 ≤ 30)', () => expect(calcOnTargetWakeup(oob, target)).toBe('yes'))
})

describe('spec TC4 — 23:20 / 23:30 / 40 / 1×15 / 07:00 / 07:05', () => {
  const bed = p('23:20'), lo = p('23:30'), fw = p('07:00'), oob = p('07:05'), target = p('07:00')
  it('timeInBed = 465', () => expect(calcTimeInBed(bed, oob)).toBe(465))
  it('sleepWindow = 450', () => expect(calcSleepWindow(lo, fw)).toBe(450))
  it('sleepTime = 395', () => expect(calcSleepTime(lo, fw, 40, 15)).toBe(395))
  it('efficiency = 84.95', () => expect(calcSleepEfficiency(395, 465)).toBe(84.95))
  it('onTarget = yes (ห่าง 5)', () => expect(calcOnTargetWakeup(oob, target)).toBe('yes'))
})

describe('spec TC5 — 23:30 / 23:30 / 35 / 0×0 / 07:00 / 07:00 (lights-out = bedtime, no wakeups)', () => {
  const bed = p('23:30'), lo = p('23:30'), fw = p('07:00'), oob = p('07:00'), target = p('07:00')
  it('timeInBed = 450', () => expect(calcTimeInBed(bed, oob)).toBe(450))
  it('sleepWindow = 450', () => expect(calcSleepWindow(lo, fw)).toBe(450))
  it('sleepTime = 415', () => expect(calcSleepTime(lo, fw, 35, 0)).toBe(415))
  it('efficiency = 92.22', () => expect(calcSleepEfficiency(415, 450)).toBe(92.22))
  it('onTarget = yes (ห่าง 0)', () => expect(calcOnTargetWakeup(oob, target)).toBe('yes'))
})

describe('spec TC6 — 00:15 / 00:20 / 30 / 1×10 / 08:30 / 08:45 (after-midnight bedtime)', () => {
  const bed = p('00:15'), lo = p('00:20'), fw = p('08:30'), oob = p('08:45'), target = p('07:00')
  it('timeInBed = 510', () => expect(calcTimeInBed(bed, oob)).toBe(510))
  it('sleepWindow = 490', () => expect(calcSleepWindow(lo, fw)).toBe(490))
  it('sleepTime = 450', () => expect(calcSleepTime(lo, fw, 30, 10)).toBe(450))
  it('efficiency = 88.24', () => expect(calcSleepEfficiency(450, 510)).toBe(88.24))
  it('onTarget = no (ห่าง 105 > 30)', () => expect(calcOnTargetWakeup(oob, target)).toBe('no'))
})

describe('spec TC7 — 23:45 / 00:00 / 55 / 2×25 / 07:30 / 07:40 (lights-out exactly midnight)', () => {
  const bed = p('23:45'), lo = p('00:00'), fw = p('07:30'), oob = p('07:40'), target = p('07:00')
  it('timeInBed = 475', () => expect(calcTimeInBed(bed, oob)).toBe(475))
  it('sleepWindow = 450', () => expect(calcSleepWindow(lo, fw)).toBe(450))
  it('sleepTime = 370', () => expect(calcSleepTime(lo, fw, 55, 25)).toBe(370))
  it('efficiency = 77.89', () => expect(calcSleepEfficiency(370, 475)).toBe(77.89))
  it('onTarget = no (ห่าง 40 > 30)', () => expect(calcOnTargetWakeup(oob, target)).toBe('no'))
})

// ─── calcOnTargetWakeup edge cases ───────────────────────────────────────────

describe('calcOnTargetWakeup', () => {
  it('no target → not_counted', () => {
    expect(calcOnTargetWakeup(p('07:00'), null)).toBe('not_counted')
  })
  it('exactly at tolerance boundary → yes', () => {
    // 30 min apart — spec §5.1: "≤ 30 นาที → ใช่"
    expect(calcOnTargetWakeup(p('07:30'), p('07:00'))).toBe('yes')
  })
  it('one minute over tolerance → no', () => {
    expect(calcOnTargetWakeup(p('07:31'), p('07:00'))).toBe('no')
  })
})

// ─── spec §8.2 TC8 — weekly stats from 7 nights ──────────────────────────────

// D6 decision: target is set from day 1; TC2 on_target = yes (not not_counted)
const WEEK1_ENTRIES: DiaryEntryStats[] = [
  { timeInBed: 460, sleepTime: 375, sleepEfficiency: 81.52, sleepOnset: 50, onTargetWakeup: 'not_counted' }, // TC1
  { timeInBed: 450, sleepTime: 365, sleepEfficiency: 81.11, sleepOnset: 45, onTargetWakeup: 'yes' },        // TC2 (D6)
  { timeInBed: 450, sleepTime: 340, sleepEfficiency: 75.56, sleepOnset: 60, onTargetWakeup: 'yes' },        // TC3
  { timeInBed: 465, sleepTime: 395, sleepEfficiency: 84.95, sleepOnset: 40, onTargetWakeup: 'yes' },        // TC4
  { timeInBed: 450, sleepTime: 415, sleepEfficiency: 92.22, sleepOnset: 35, onTargetWakeup: 'yes' },        // TC5
  { timeInBed: 510, sleepTime: 450, sleepEfficiency: 88.24, sleepOnset: 30, onTargetWakeup: 'no' },         // TC6
  { timeInBed: 475, sleepTime: 370, sleepEfficiency: 77.89, sleepOnset: 55, onTargetWakeup: 'no' },         // TC7
]

describe('spec TC8 — weekly stats from 7 nights', () => {
  const stats = calcWeeklyStats(WEEK1_ENTRIES)!
  it('nightsUsed = 7', () => expect(stats.nightsUsed).toBe(7))
  it('avgSleepTime = 387', () => expect(stats.avgSleepTime).toBe(387))
  it('avgTimeInBed = 466', () => expect(stats.avgTimeInBed).toBe(466))
  it('weeklyEfficiency = 83.13 (stored 2dp; displayed 83.1%)', () => expect(stats.weeklyEfficiency).toBe(83.13))
  it('avgSleepOnset = 45', () => expect(stats.avgSleepOnset).toBe(45))
  // D6: night 2 is 'yes'; counted = nights 2–7 = 6; on_target yes = nights 2,3,4,5 = 4
  it('onTargetCount = 4 (D6: target set from day 1, TC2 becomes yes)', () => expect(stats.onTargetCount).toBe(4))
  it('onTargetDenominator = 6 (TC1 is not_counted)', () => expect(stats.onTargetDenominator).toBe(6))
})

// ─── spec §8.2 TC9 — fewer than 5 nights → null ──────────────────────────────

describe('spec TC9 — 4 nights returns null (D14)', () => {
  it('calcWeeklyStats returns null when < 5 entries', () => {
    expect(calcWeeklyStats(WEEK1_ENTRIES.slice(0, 4))).toBeNull()
  })
  it('calcWeeklyStats returns stats when exactly 5 entries', () => {
    expect(calcWeeklyStats(WEEK1_ENTRIES.slice(0, 5))).not.toBeNull()
  })
})

// ─── validateDiary — edge cases §8.3 ─────────────────────────────────────────

function makeInput(overrides: Partial<DiaryInput> = {}): DiaryInput {
  return {
    bedtimeMins: p('23:30'),
    lightsOutMins: p('23:45'),
    sleepOnsetMin: 50,
    wakeupCount: 1,
    wakeupDurationMin: 10,
    finalWakeupMins: p('07:00'),
    outOfBedMins: p('07:10'),
    sleepQuality: 3,
    ...overrides,
  }
}

describe('validateDiary — valid TC1 input', () => {
  it('returns ok:true with computed values', () => {
    const result = validateDiary(makeInput())
    expect(result.ok).toBe(true)
    if (result.ok === true) {
      expect(result.computed.timeInBed).toBe(460)
      expect(result.computed.sleepTime).toBe(375)
      expect(result.computed.efficiency).toBe(81.52)
    }
  })
})

describe('spec TC10 — D4: lights-out before bedtime (23:30 bedtime, 23:20 lights-out)', () => {
  it('returns D4 error', () => {
    const result = validateDiary(makeInput({
      bedtimeMins: p('23:30'),
      lightsOutMins: p('23:20'),
    }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D4')
  })
})

describe('spec TC11 — D7: onset(90) + wakeup(40) = 130 > sleepWindow(120)', () => {
  it('returns D7 error', () => {
    // bedtime 22:30, lights-out 23:00, final-wakeup 01:00 → sleepWindow = 120; onset+wakeup = 130 > 120
    const result = validateDiary(makeInput({
      bedtimeMins: p('22:30'),
      lightsOutMins: p('23:00'),
      sleepOnsetMin: 90,
      wakeupDurationMin: 40,
      finalWakeupMins: p('01:00'),
      outOfBedMins: p('01:30'),
    }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D7')
  })
})

describe('spec TC12 — D8: sleep time = 0 → confirm', () => {
  it('returns ok:confirm type D8', () => {
    // lights-out 23:00, final-wakeup 01:00, onset 90, wakeup 30 → sleepTime=0
    const result = validateDiary(makeInput({
      bedtimeMins: p('23:00'),
      lightsOutMins: p('23:00'),
      sleepOnsetMin: 90,
      wakeupDurationMin: 30,
      finalWakeupMins: p('01:00'),
      outOfBedMins: p('01:00'),
    }))
    expect(result.ok).toBe('confirm')
    if (result.ok === 'confirm') {
      expect(result.type).toBe('D8')
      expect(result.computed.timeInBed).toBe(120)
    }
  })
})

describe('spec TC13 — D16: bedtime 11:30 → timeInBed 1180 > 960 → confirm', () => {
  it('returns ok:confirm type D16 with timeInBed 1180', () => {
    // 11:30 bedtime is AM, treated as 690 min; sleep window won't hit D8
    const result = validateDiary(makeInput({
      bedtimeMins: p('11:30'),
      lightsOutMins: p('11:45'),
      sleepOnsetMin: 10,
      wakeupDurationMin: 0,
      finalWakeupMins: p('07:00'),
      outOfBedMins: p('07:10'),
    }))
    expect(result.ok).toBe('confirm')
    if (result.ok === 'confirm') {
      expect(result.type).toBe('D16')
      expect(result.computed.timeInBed).toBe(1180)
    }
  })
})

describe('spec TC15 — D15: out-of-bed in the future', () => {
  it('returns D15 error when out_of_bed is 40 min ahead of now', () => {
    const nowMins = p('06:30') // 390
    const result = validateDiary(makeInput({
      finalWakeupMins: p('07:10'),
      outOfBedMins: p('07:10'), // 430 — 40 min ahead of now
    }), nowMins)
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D15')
  })

  it('does NOT trigger D15 when out_of_bed is in the past', () => {
    const nowMins = p('08:00') // 480
    const result = validateDiary(makeInput(), nowMins)
    expect(result.ok).toBe(true)
  })
})

describe('validateDiary — D3: sleep quality out of range', () => {
  it('returns D3 error when sleepQuality = 0', () => {
    const result = validateDiary(makeInput({ sleepQuality: 0 }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D3')
  })
  it('returns D3 error when sleepQuality = 6', () => {
    const result = validateDiary(makeInput({ sleepQuality: 6 }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D3')
  })
})

describe('validateDiary — D5: final wakeup = lights-out', () => {
  it('returns D5 error', () => {
    const result = validateDiary(makeInput({
      lightsOutMins: p('07:00'),
      finalWakeupMins: p('07:00'),
      outOfBedMins: p('07:10'),
      sleepOnsetMin: 0,
      wakeupDurationMin: 0,
    }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D5')
  })
})

describe('validateDiary — D6: out-of-bed before final wakeup', () => {
  it('returns D6 error when out-of-bed 13 hours before final wakeup', () => {
    const result = validateDiary(makeInput({
      finalWakeupMins: p('07:00'),
      outOfBedMins: p('06:50'),
    }))
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.rule).toBe('D6')
  })
})

// ─── spec §8.4 — Weekly checklist signals TC20–21 ────────────────────────────

describe('spec TC20 — 6 signals out of 9 checklist items', () => {
  const cl: ChecklistInput = {
    daysMorningLight: 2,
    daysCaffeine: 4,
    daysNapped: 1,
    daysExercised: 2,
    daysAlcohol: 0,
    daysHeavyMeal: 1,
    daysDimLight: 1,
    daysScreenInBed: 6,
    clockCheckFrequency: 'often',
  }
  const signals = calcChecklistSignals(cl)

  it('caffeine flagged (W5: 4 ≥ 3)', () => expect(signals).toContain('caffeine'))
  it('screen_in_bed flagged (W5: 6 ≥ 3)', () => expect(signals).toContain('screen_in_bed'))
  it('morning_light flagged (W6: 2 ≤ 3)', () => expect(signals).toContain('morning_light'))
  it('exercise flagged (W6: 2 ≤ 3)', () => expect(signals).toContain('exercise'))
  it('dim_light flagged (W6: 1 ≤ 3)', () => expect(signals).toContain('dim_light'))
  it('clock_check flagged (W7: often)', () => expect(signals).toContain('clock_check'))

  it('nap NOT flagged (1 < 3)', () => expect(signals).not.toContain('nap'))
  it('alcohol NOT flagged (0 < 3)', () => expect(signals).not.toContain('alcohol'))
  it('heavy_meal NOT flagged (1 < 3)', () => expect(signals).not.toContain('heavy_meal'))

  it('total 6 signals', () => expect(signals).toHaveLength(6))
})

describe('spec TC21 — caffeine = 3 (exactly at threshold)', () => {
  it('caffeine is flagged (≥ 3 → W5)', () => {
    const signals = calcChecklistSignals({
      daysMorningLight: 7, daysCaffeine: 3, daysNapped: 0,
      daysExercised: 7, daysAlcohol: 0, daysHeavyMeal: 0,
      daysDimLight: 7, daysScreenInBed: 0, clockCheckFrequency: 'never',
    })
    expect(signals).toContain('caffeine')
  })
})

describe('calcChecklistSignals — W6 exact boundary', () => {
  it('morning_light = 3 IS flagged (≤ 3)', () => {
    const signals = calcChecklistSignals({
      daysMorningLight: 3, daysCaffeine: 0, daysNapped: 0,
      daysExercised: 7, daysAlcohol: 0, daysHeavyMeal: 0,
      daysDimLight: 7, daysScreenInBed: 0, clockCheckFrequency: 'never',
    })
    expect(signals).toContain('morning_light')
  })
  it('morning_light = 4 is NOT flagged (> 3)', () => {
    const signals = calcChecklistSignals({
      daysMorningLight: 4, daysCaffeine: 0, daysNapped: 0,
      daysExercised: 7, daysAlcohol: 0, daysHeavyMeal: 0,
      daysDimLight: 7, daysScreenInBed: 0, clockCheckFrequency: 'never',
    })
    expect(signals).not.toContain('morning_light')
  })
})
