import { describe, it, expect } from 'vitest'
import {
  calcOutOfBedRange,
  calcHardNights,
  calcSuggestions,
  calcWeekComparison,
  type SuggestionChecklist,
  type SuggestionInput,
  type WeekStats,
} from '@/lib/suggestion'

function p(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const CLEAN_CHECKLIST: SuggestionChecklist = {
  caffeineNearBed: 0,
  naps: 0,
  exercise: 7,
  alcoholNearBed: 0,
  heavyMealOrExercise: 0,
  dimLights: 7,
  screenInBed: 0,
  clockCheck: 'never',
}

function makeInput(overrides: Partial<SuggestionInput> = {}): SuggestionInput {
  return {
    nightsValid: 7,
    outOfBedRange: 30,
    hardNights: 0,
    avgSleepOnsetMins: 10,
    weeklyEfficiency: 85,
    avgSleepTimeMins: 400,
    nightlyEfficiencies: Array(7).fill(85),
    zeroSleepNights: 0,
    checklist: CLEAN_CHECKLIST,
    taughtRecently: [],
    s3TaughtBefore: false,
    ...overrides,
  }
}

// ─── calcOutOfBedRange ────────────────────────────────────────────────────────

describe('calcOutOfBedRange', () => {
  it('TC1: Nunn times [07:10…08:45] → 525 − 420 = 105', () => {
    const times = [p('07:10'), p('07:00'), p('07:15'), p('07:05'), p('07:00'), p('08:45'), p('07:40')]
    expect(calcOutOfBedRange(times)).toBe(105)
  })

  it('single element → 0', () => {
    expect(calcOutOfBedRange([p('07:00')])).toBe(0)
  })

  it('all same times → 0', () => {
    expect(calcOutOfBedRange([420, 420, 420])).toBe(0)
  })
})

// ─── calcHardNights ───────────────────────────────────────────────────────────

describe('calcHardNights', () => {
  it('TC1: all onset [50,45,60,40,35,30,55] > 20 → 7', () => {
    const entries = [50, 45, 60, 40, 35, 30, 55].map(o => ({ sleepOnsetMin: o, wakeupDurationMin: 0 }))
    expect(calcHardNights(entries)).toBe(7)
  })

  it('onset exactly 20 is NOT a hard night (must be strictly > 20)', () => {
    const entries = [{ sleepOnsetMin: 20, wakeupDurationMin: 0 }]
    expect(calcHardNights(entries)).toBe(0)
  })

  it('onset 21 IS a hard night', () => {
    const entries = [{ sleepOnsetMin: 21, wakeupDurationMin: 0 }]
    expect(calcHardNights(entries)).toBe(1)
  })

  it('wakeup exactly 20 is NOT counted (strictly > 20)', () => {
    const entries = [{ sleepOnsetMin: 0, wakeupDurationMin: 20 }]
    expect(calcHardNights(entries)).toBe(0)
  })

  it('wakeup 21 IS counted', () => {
    const entries = [{ sleepOnsetMin: 0, wakeupDurationMin: 21 }]
    expect(calcHardNights(entries)).toBe(1)
  })

  it('night with both onset=20 and wakeup=20 → not hard (neither > 20)', () => {
    const entries = [{ sleepOnsetMin: 20, wakeupDurationMin: 20 }]
    expect(calcHardNights(entries)).toBe(0)
  })
})

// ─── calcSuggestions — spec TC1 (Nunn week 1) ────────────────────────────────

describe('spec TC1 — Nunn week 1', () => {
  const result = calcSuggestions({
    nightsValid: 7,
    outOfBedRange: 105,
    hardNights: 7,
    avgSleepOnsetMins: 45,
    weeklyEfficiency: 83.1,
    avgSleepTimeMins: 387,
    nightlyEfficiencies: Array(7).fill(83.33),
    zeroSleepNights: 0,
    checklist: {
      caffeineNearBed: 4,
      naps: 1,
      exercise: 2,
      alcoholNearBed: 0,
      heavyMealOrExercise: 1,
      dimLights: 1,
      screenInBed: 6,
      clockCheck: 'often',
    },
    taughtRecently: [],
    s3TaughtBefore: false,
  })

  it('status is suggestions', () => { expect(result.status).toBe('suggestions') })
  it('queue = S1,S2,S5,S10,S3,S8', () => { expect(result.queue).toEqual(['S1', 'S2', 'S5', 'S10', 'S3', 'S8']) })
  it('top 3 = S1,S2,S5', () => { expect(result.topThree).toEqual(['S1', 'S2', 'S5']) })
  it('no safety flags (83.1≥70, 387≥240, 0 zero nights, no trend drop)', () => { expect(result.safetyFlags).toEqual([]) })
  it('S2 screen sentence added (screenInBed=6 ≥ 3)', () => { expect(result.s2AddScreen).toBe(true) })
  it('S2 clock sentence added (clockCheck=often)', () => { expect(result.s2AddClock).toBe(true) })
})

// ─── spec TC2 — insufficient nights (4 < 5) → F1 ─────────────────────────────

describe('spec TC2 — nightsValid < 5 → F1', () => {
  const result = calcSuggestions(makeInput({ nightsValid: 4 }))

  it('status is F1', () => { expect(result.status).toBe('F1') })
  it('no suggestions returned', () => { expect(result.topThree).toEqual([]) })
  it('no safety flags', () => { expect(result.safetyFlags).toEqual([]) })
})

// ─── spec TC3 — no conditions met → F2 ───────────────────────────────────────

describe('spec TC3 — all conditions false → F2', () => {
  const result = calcSuggestions(makeInput({
    nightsValid: 5,
    outOfBedRange: 30,
    hardNights: 0,
    avgSleepOnsetMins: 10,
    weeklyEfficiency: 90,
    avgSleepTimeMins: 420,
    nightlyEfficiencies: Array(5).fill(90),
    zeroSleepNights: 0,
    checklist: {
      caffeineNearBed: 2,
      naps: 1,
      exercise: 5,
      alcoholNearBed: 0,
      heavyMealOrExercise: 0,
      dimLights: 5,
      screenInBed: 0,
      clockCheck: 'never',
    },
  }))

  it('status is F2', () => { expect(result.status).toBe('F2') })
  it('empty queue', () => { expect(result.topThree).toEqual([]) })
  it('no safety flags', () => { expect(result.safetyFlags).toEqual([]) })
})

// ─── spec TC4 — exact threshold boundaries ───────────────────────────────────

describe('spec TC4 — boundary values at thresholds', () => {
  const result = calcSuggestions({
    nightsValid: 7,
    outOfBedRange: 60,
    hardNights: 0,
    avgSleepOnsetMins: 20,
    weeklyEfficiency: 85,
    avgSleepTimeMins: 400,
    nightlyEfficiencies: Array(7).fill(85),
    zeroSleepNights: 0,
    checklist: {
      caffeineNearBed: 3,
      naps: 3,
      exercise: 3,
      alcoholNearBed: 3,
      heavyMealOrExercise: 3,
      dimLights: 3,
      screenInBed: 3,
      clockCheck: 'never',
    },
    taughtRecently: [],
    s3TaughtBefore: false,
  })

  it('S1 fires at exactly 60 min range (≥60)', () => { expect(result.queue).toContain('S1') })
  it('S2 does NOT fire when hardNights=0 (onset=20 is not > 20)', () => { expect(result.queue).not.toContain('S2') })
  it('S3 fires at exactly 20 min onset average (≥20)', () => { expect(result.queue).toContain('S3') })
  it('S5 fires at exactly 3 caffeine days (≥3)', () => { expect(result.queue).toContain('S5') })
  it('S6 fires at exactly 3 alcohol days (≥3)', () => { expect(result.queue).toContain('S6') })
  it('S10 fires at exactly 3 dim light days (≤3)', () => { expect(result.queue).toContain('S10') })
  it('S8 fires at exactly 3 exercise days (≤3)', () => { expect(result.queue).toContain('S8') })
  it('S7 fires at exactly 3 nap days (≥3)', () => { expect(result.queue).toContain('S7') })
  it('queue order = S1,S5,S6,S9,S10,S3,S8,S7', () => {
    expect(result.queue).toEqual(['S1', 'S5', 'S6', 'S9', 'S10', 'S3', 'S8', 'S7'])
  })
  it('top 3 = S1,S5,S6', () => { expect(result.topThree).toEqual(['S1', 'S5', 'S6']) })
  it('S2 no screen/clock (screenInBed=3 ≥ 3 → screen added, but S2 not in queue → irrelevant; check separately)', () => {
    // S2 enrichment is computed regardless; screenInBed=3 triggers it
    expect(result.s2AddScreen).toBe(true)
  })
})

// ─── spec TC5 — SF4: efficiency trend drops ≥10 points ───────────────────────

describe('spec TC5 — SF4 from efficiency decline', () => {
  // sleep per night: [400,400,400,380,380,300,300], bed=480
  // SE per night:  [83.33,83.33,83.33,79.17,79.17,62.50,62.50]
  // first3 avg = 83.33; last3 avg = (79.17+62.50+62.50)/3 = 68.06; diff = 15.27 ≥ 10
  const result = calcSuggestions(makeInput({
    nightsValid: 7,
    outOfBedRange: 30,
    hardNights: 0,
    avgSleepOnsetMins: 10,
    weeklyEfficiency: 76.2,
    avgSleepTimeMins: 365,
    nightlyEfficiencies: [83.33, 83.33, 83.33, 79.17, 79.17, 62.50, 62.50],
    zeroSleepNights: 0,
    checklist: CLEAN_CHECKLIST,
  }))

  it('SF4 fires', () => { expect(result.safetyFlags).toContain('SF4') })
  it('SF2 does not fire (365 ≥ 240)', () => { expect(result.safetyFlags).not.toContain('SF2') })
  it('SF3 does not fire (76.2 ≥ 70)', () => { expect(result.safetyFlags).not.toContain('SF3') })
  it('SF1 does not fire (0 zero nights)', () => { expect(result.safetyFlags).not.toContain('SF1') })
})

// ─── spec TC6 — SF1 (2 zero nights) + SF3 (SE < 70%) ────────────────────────

describe('spec TC6 — SF1 and SF3', () => {
  // zero nights at positions 0,1 so last3 stays high → SF4 does NOT fire
  const nightlyEfficiencies = [0, 0, 87.5, 87.5, 87.5, 87.5, 87.5]
  const result = calcSuggestions(makeInput({
    nightsValid: 7,
    zeroSleepNights: 2,
    weeklyEfficiency: 62.5,
    avgSleepTimeMins: 300,
    nightlyEfficiencies,
  }))

  it('SF1 fires (2 ≥ 2 zero-sleep nights)', () => { expect(result.safetyFlags).toContain('SF1') })
  it('SF3 fires (62.5% < 70%)', () => { expect(result.safetyFlags).toContain('SF3') })
  it('SF2 does not fire (300 ≥ 240)', () => { expect(result.safetyFlags).not.toContain('SF2') })
  it('SF4 does not fire (first3 avg is low, diff is negative)', () => { expect(result.safetyFlags).not.toContain('SF4') })
})

// ─── spec TC7 — no checklist (F3 mode: diary-only S1–S4) ─────────────────────

describe('spec TC7 — no checklist → F3 mode (S1–S4 only)', () => {
  const result = calcSuggestions({
    nightsValid: 6,
    outOfBedRange: 80,
    hardNights: 6,
    avgSleepOnsetMins: 30,
    weeklyEfficiency: 80,
    avgSleepTimeMins: 380,
    nightlyEfficiencies: Array(6).fill(80),
    zeroSleepNights: 0,
    checklist: undefined,
    taughtRecently: [],
    s3TaughtBefore: false,
  })

  it('status is suggestions', () => { expect(result.status).toBe('suggestions') })
  it('queue contains only diary-based S1, S2, S3 (S5–S10 not evaluated)', () => {
    expect(result.queue).toEqual(['S1', 'S2', 'S3'])
  })
  it('top 3 = S1, S2, S3', () => { expect(result.topThree).toEqual(['S1', 'S2', 'S3']) })
  it('no S2 screen sentence (no checklist)', () => { expect(result.s2AddScreen).toBe(false) })
  it('no S2 clock sentence (no checklist)', () => { expect(result.s2AddClock).toBe(false) })
})

// ─── spec TC8 — week 2, prior queue abandoned, S1 drops off ──────────────────

describe('spec TC8 — week 2 without prior selection, S1 not met', () => {
  const result = calcSuggestions({
    nightsValid: 7,
    outOfBedRange: 40,
    hardNights: 7,
    avgSleepOnsetMins: 45,
    weeklyEfficiency: 84,
    avgSleepTimeMins: 390,
    nightlyEfficiencies: Array(7).fill(84),
    zeroSleepNights: 0,
    checklist: {
      caffeineNearBed: 4,
      naps: 1,
      exercise: 2,
      alcoholNearBed: 0,
      heavyMealOrExercise: 1,
      dimLights: 1,
      screenInBed: 6,
      clockCheck: 'often',
    },
    taughtRecently: [],
    s3TaughtBefore: false,
  })

  it('S1 not in queue (40 < 60)', () => { expect(result.queue).not.toContain('S1') })
  it('queue = S2,S5,S10,S3,S8', () => { expect(result.queue).toEqual(['S2', 'S5', 'S10', 'S3', 'S8']) })
  it('top 3 = S2,S5,S10', () => { expect(result.topThree).toEqual(['S2', 'S5', 'S10']) })
})

// ─── spec TC9 — S1 and S5 taught within 14 days → excluded ──────────────────

describe('spec TC9 — taughtRecently excludes S1 and S5', () => {
  const result = calcSuggestions({
    nightsValid: 7,
    outOfBedRange: 105,
    hardNights: 7,
    avgSleepOnsetMins: 45,
    weeklyEfficiency: 83.1,
    avgSleepTimeMins: 387,
    nightlyEfficiencies: Array(7).fill(83.33),
    zeroSleepNights: 0,
    checklist: {
      caffeineNearBed: 4,
      naps: 1,
      exercise: 2,
      alcoholNearBed: 0,
      heavyMealOrExercise: 1,
      dimLights: 1,
      screenInBed: 6,
      clockCheck: 'often',
    },
    taughtRecently: ['S1', 'S5'],
    s3TaughtBefore: false,
  })

  it('S1 excluded from queue', () => { expect(result.queue).not.toContain('S1') })
  it('S5 excluded from queue', () => { expect(result.queue).not.toContain('S5') })
  it('queue = S2,S10,S3,S8', () => { expect(result.queue).toEqual(['S2', 'S10', 'S3', 'S8']) })
  it('top 3 = S2,S10,S3', () => { expect(result.topThree).toEqual(['S2', 'S10', 'S3']) })
})

// ─── S2 enrichment edge cases ─────────────────────────────────────────────────

describe('S2 enrichment', () => {
  it('no screen sentence when screenInBed < 3', () => {
    const r = calcSuggestions(makeInput({
      hardNights: 3,
      checklist: { ...CLEAN_CHECKLIST, screenInBed: 2, clockCheck: 'never' },
    }))
    expect(r.s2AddScreen).toBe(false)
  })

  it('screen sentence when screenInBed = 3 (≥3)', () => {
    const r = calcSuggestions(makeInput({
      hardNights: 3,
      checklist: { ...CLEAN_CHECKLIST, screenInBed: 3, clockCheck: 'never' },
    }))
    expect(r.s2AddScreen).toBe(true)
  })

  it('no clock sentence for clockCheck = sometimes', () => {
    const r = calcSuggestions(makeInput({
      hardNights: 3,
      checklist: { ...CLEAN_CHECKLIST, clockCheck: 'sometimes' },
    }))
    expect(r.s2AddClock).toBe(false)
  })

  it('clock sentence only for clockCheck = often', () => {
    const r = calcSuggestions(makeInput({
      hardNights: 3,
      checklist: { ...CLEAN_CHECKLIST, clockCheck: 'often' },
    }))
    expect(r.s2AddClock).toBe(true)
  })
})

// ─── S4: requires S3 taught before ───────────────────────────────────────────

describe('S4 condition', () => {
  it('S4 not in queue when s3TaughtBefore=false (even if onset ≥ 20)', () => {
    const r = calcSuggestions(makeInput({ avgSleepOnsetMins: 30, s3TaughtBefore: false }))
    expect(r.queue).not.toContain('S4')
  })

  it('S4 in queue when s3TaughtBefore=true and onset ≥ 20', () => {
    const r = calcSuggestions(makeInput({ avgSleepOnsetMins: 30, s3TaughtBefore: true }))
    expect(r.queue).toContain('S4')
  })

  it('S4 not in queue when s3TaughtBefore=true but onset < 20', () => {
    const r = calcSuggestions(makeInput({ avgSleepOnsetMins: 15, s3TaughtBefore: true }))
    expect(r.queue).not.toContain('S4')
  })
})

// ─── SF2: avg sleep time < 240 min ───────────────────────────────────────────

describe('SF2', () => {
  it('fires when avgSleepTimeMins < 240', () => {
    const r = calcSuggestions(makeInput({ avgSleepTimeMins: 239, nightsValid: 7 }))
    expect(r.safetyFlags).toContain('SF2')
  })

  it('does not fire when avgSleepTimeMins = 240 (not < 240)', () => {
    const r = calcSuggestions(makeInput({ avgSleepTimeMins: 240 }))
    expect(r.safetyFlags).not.toContain('SF2')
  })
})

// ─── SF3: weekly efficiency < 70% ────────────────────────────────────────────

describe('SF3', () => {
  it('fires when weeklyEfficiency < 70', () => {
    const r = calcSuggestions(makeInput({ weeklyEfficiency: 69.9 }))
    expect(r.safetyFlags).toContain('SF3')
  })

  it('does not fire when weeklyEfficiency = 70 (not < 70)', () => {
    const r = calcSuggestions(makeInput({ weeklyEfficiency: 70 }))
    expect(r.safetyFlags).not.toContain('SF3')
  })
})

// ─── SF4: insufficient nights for comparison ─────────────────────────────────

describe('SF4 with < 6 nights', () => {
  it('SF4 does not fire when nightsValid < 6', () => {
    // Even with a declining pattern, we can't compute first3/last3 reliably
    const r = calcSuggestions(makeInput({
      nightsValid: 5,
      nightlyEfficiencies: [90, 90, 90, 50, 50],
    }))
    // 5 nights: first3=[90,90,90]=90, last3=[90,50,50]=63.3, diff=26.7 ≥10
    // But spec says edge case is undefined for <6 nights; we do not fire SF4
    expect(r.safetyFlags).not.toContain('SF4')
  })
})

// ─── spec TC10 — week comparison (efficiency/onset/sleepTime deltas) ─────────

describe('spec TC10 — week comparison metrics', () => {
  const week1: WeekStats = { weeklyEfficiency: 83.1, avgSleepTimeMins: 387, avgSleepOnsetMins: 45.0, nightsValid: 7 }
  const week3: WeekStats = { weeklyEfficiency: 86.0, avgSleepTimeMins: 372, avgSleepOnsetMins: 38.0, nightsValid: 7 }
  const result = calcWeekComparison(week1, week3)

  it('returns non-null result', () => { expect(result).not.toBeNull() })
  it('efficiency diff +2.9 → unchanged (< ±3)', () => { expect(result!.efficiency.trend).toBe('unchanged') })
  it('onset diff −7.0 → improved (≤ −5)', () => { expect(result!.sleepOnset.trend).toBe('improved') })
  it('sleepTime diff −15 → worse (≤ −15, boundary counts as worse)', () => { expect(result!.sleepTime.trend).toBe('worse') })
  it('passes through raw values', () => {
    expect(result!.efficiency.week1).toBe(83.1)
    expect(result!.efficiency.current).toBe(86.0)
    expect(result!.sleepOnset.week1).toBe(45.0)
    expect(result!.sleepTime.current).toBe(372)
  })
})

// ─── spec TC11 — insufficient nights → comparison null ───────────────────────

describe('spec TC11 — comparison unavailable when current nightsValid < 5', () => {
  it('returns null', () => {
    const week1: WeekStats = { weeklyEfficiency: 83.1, avgSleepTimeMins: 387, avgSleepOnsetMins: 45, nightsValid: 7 }
    const week3: WeekStats = { weeklyEfficiency: 85, avgSleepTimeMins: 380, avgSleepOnsetMins: 42, nightsValid: 3 }
    expect(calcWeekComparison(week1, week3)).toBeNull()
  })

  it('returns null when week1 nightsValid < 5', () => {
    const week1: WeekStats = { weeklyEfficiency: 83.1, avgSleepTimeMins: 387, avgSleepOnsetMins: 45, nightsValid: 4 }
    const week2: WeekStats = { weeklyEfficiency: 85, avgSleepTimeMins: 380, avgSleepOnsetMins: 42, nightsValid: 7 }
    expect(calcWeekComparison(week1, week2)).toBeNull()
  })
})

// ─── comparison boundary conditions ──────────────────────────────────────────

describe('calcWeekComparison thresholds', () => {
  function compare(eff1: number, eff2: number, onset1: number, onset2: number, sleep1: number, sleep2: number) {
    return calcWeekComparison(
      { weeklyEfficiency: eff1, avgSleepOnsetMins: onset1, avgSleepTimeMins: sleep1, nightsValid: 7 },
      { weeklyEfficiency: eff2, avgSleepOnsetMins: onset2, avgSleepTimeMins: sleep2, nightsValid: 7 },
    )!
  }

  it('efficiency diff exactly +3.0 → improved', () => {
    expect(compare(80, 83, 20, 20, 400, 400).efficiency.trend).toBe('improved')
  })

  it('efficiency diff exactly −3.0 → worse', () => {
    expect(compare(83, 80, 20, 20, 400, 400).efficiency.trend).toBe('worse')
  })

  it('onset diff exactly −5.0 → improved', () => {
    expect(compare(80, 80, 25, 20, 400, 400).sleepOnset.trend).toBe('improved')
  })

  it('onset diff exactly +5.0 → worse', () => {
    expect(compare(80, 80, 20, 25, 400, 400).sleepOnset.trend).toBe('worse')
  })

  it('sleepTime diff exactly +15 → improved', () => {
    expect(compare(80, 80, 20, 20, 385, 400).sleepTime.trend).toBe('improved')
  })

  it('sleepTime diff exactly −15 → worse', () => {
    expect(compare(80, 80, 20, 20, 400, 385).sleepTime.trend).toBe('worse')
  })
})
