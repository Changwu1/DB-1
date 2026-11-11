import { describe, it, expect } from 'vitest'
import {
  calcWhyCards,
  pickMythOfDay,
  nextUnconfirmedRule,
  getRuleWhyLink,
  type WhyCardsInput,
  type MythState,
} from '@/lib/education'

// ─── calcWhyCards — spec §8 TC6–TC10 ─────────────────────────────────────────
// D1 decision: B5 ("Worry keeps the loop going") deleted — no assessment: สาเหตุเริ่มต้น
// D4 decision: B4 ("Going to bed too early") disabled — no sleep window in MVP

function makeWhyInput(overrides: Partial<WhyCardsInput> = {}): WhyCardsInput {
  return {
    nightsFilledIn: 7,
    daysNapped: 0,
    wakeTimeRangeMins: 10,
    avgEfficiency: 90,
    ...overrides,
  }
}

describe('spec TC6 — avg efficiency = 85.0% → no B3 card', () => {
  it('B3 not in result (85.0 is not strictly < 85)', () => {
    const result = calcWhyCards(makeWhyInput({ avgEfficiency: 85.0 }))
    expect(result).not.toContain('B3')
  })
})

describe('spec TC7 — avg efficiency = 84.9% → B3 card shown', () => {
  it('B3 in result', () => {
    const result = calcWhyCards(makeWhyInput({ avgEfficiency: 84.9 }))
    expect(result).toContain('B3')
  })
})

describe('spec TC8 — wake range = 60 min → no B2 card (threshold is strictly >)', () => {
  it('B2 not in result when range = 60', () => {
    const result = calcWhyCards(makeWhyInput({ wakeTimeRangeMins: 60 }))
    expect(result).not.toContain('B2')
  })
  it('B2 IS in result when range = 61', () => {
    const result = calcWhyCards(makeWhyInput({ wakeTimeRangeMins: 61 }))
    expect(result).toContain('B2')
  })
})

describe('spec TC9 — naps 4 days, range 90 min, avg 78% → B1 and B2 only (2-card cap)', () => {
  it('returns [B1, B2] — B3 is a candidate but cap applies', () => {
    const result = calcWhyCards(makeWhyInput({
      daysNapped: 4,
      wakeTimeRangeMins: 90,
      avgEfficiency: 78,
    }))
    expect(result).toEqual(['B1', 'B2'])
  })
  it('B3 NOT in result (capped)', () => {
    const result = calcWhyCards(makeWhyInput({
      daysNapped: 4,
      wakeTimeRangeMins: 90,
      avgEfficiency: 78,
    }))
    expect(result).not.toContain('B3')
  })
})

describe('spec TC10 — 4 nights filled in (< 5) → B6 fallback (D1: B5 deleted)', () => {
  it('returns [B6] when nightsFilledIn < MIN_DIARY_NIGHTS', () => {
    const result = calcWhyCards(makeWhyInput({ nightsFilledIn: 4 }))
    expect(result).toEqual(['B6'])
  })
})

describe('calcWhyCards — B6 fallback when no cards match', () => {
  it('returns [B6] when efficiency ≥ 85, range ≤ 60, naps < 3', () => {
    const result = calcWhyCards(makeWhyInput({
      nightsFilledIn: 7,
      daysNapped: 0,
      wakeTimeRangeMins: 30,
      avgEfficiency: 90,
    }))
    expect(result).toEqual(['B6'])
  })
})

describe('calcWhyCards — B1 exact threshold', () => {
  it('B1 fires when daysNapped = 3 (≥ 3)', () => {
    const result = calcWhyCards(makeWhyInput({ daysNapped: 3 }))
    expect(result).toContain('B1')
  })
  it('B1 does not fire when daysNapped = 2', () => {
    const result = calcWhyCards(makeWhyInput({ daysNapped: 2 }))
    expect(result).not.toContain('B1')
  })
})

// ─── pickMythOfDay — spec §8 TC11–TC14 ───────────────────────────────────────

const MYTH_STATE_11: MythState = {
  mythOrder: [9, 1, 7, 2, 8, 3, 6, 5], // 4 was already taken
  mythToday: 4,
  mythShownDate: '2026-11-05',
  mythHiddenToday: false,
  lastMythNumber: 4,
}

describe('spec TC11 — same day, home opened 3×, myth stays 4', () => {
  it('returns myth 4 on first open (same date = D1)', () => {
    const r = pickMythOfDay(MYTH_STATE_11, '2026-11-05')
    expect(r.mythNumber).toBe(4)
    expect(r.show).toBe(true)
  })
  it('returns myth 4 on second open (same date)', () => {
    const r2 = pickMythOfDay(MYTH_STATE_11, '2026-11-05')
    expect(r2.mythNumber).toBe(4)
  })
})

describe('spec TC12 — next day → myth advances to 9', () => {
  it('advances to myth 9 (next in order) on 2026-11-06', () => {
    const r = pickMythOfDay(MYTH_STATE_11, '2026-11-06')
    expect(r.mythNumber).toBe(9)
    expect(r.show).toBe(true)
  })
  it('new state has myth 9 as today and date = 2026-11-06', () => {
    const r = pickMythOfDay(MYTH_STATE_11, '2026-11-06')
    expect(r.newState.mythToday).toBe(9)
    expect(r.newState.mythShownDate).toBe('2026-11-06')
    expect(r.newState.mythHiddenToday).toBe(false)
  })
  it('new state mythOrder no longer starts with 9', () => {
    const r = pickMythOfDay(MYTH_STATE_11, '2026-11-06')
    expect(r.newState.mythOrder[0]).toBe(1)
  })
})

describe('spec TC13 — ✕ tapped, home reopened same day → no banner', () => {
  const hiddenState: MythState = { ...MYTH_STATE_11, mythHiddenToday: true }
  it('show = false', () => {
    const r = pickMythOfDay(hiddenState, '2026-11-05')
    expect(r.show).toBe(false)
  })
  it('mythNumber is still 4 (kept)', () => {
    const r = pickMythOfDay(hiddenState, '2026-11-05')
    expect(r.mythNumber).toBe(4)
  })
})

describe('spec TC14 — all 9 shown, last = 5, new day → first myth ≠ 5', () => {
  const allShownState: MythState = {
    mythOrder: [],         // all consumed
    mythToday: 5,
    mythShownDate: '2026-11-14',
    mythHiddenToday: false,
    lastMythNumber: 5,
  }

  it('new myth ≠ 5 (the last one shown)', () => {
    // deterministic shuffle that puts 5 first; the function must move it
    const shufflePuts5First = (arr: number[]) => [5, ...arr.filter(n => n !== 5)]
    const r = pickMythOfDay(allShownState, '2026-11-15', shufflePuts5First)
    expect(r.mythNumber).not.toBe(5)
  })

  it('reshuffles to full set of 9 (minus the one taken)', () => {
    const r = pickMythOfDay(allShownState, '2026-11-15')
    // After taking one myth, order should have 8 left
    expect(r.newState.mythOrder).toHaveLength(8)
  })
})

describe('pickMythOfDay — D3: phone date moved back', () => {
  it('keeps saved myth when today < mythShownDate', () => {
    const r = pickMythOfDay(MYTH_STATE_11, '2026-11-04') // earlier than 11-05
    expect(r.mythNumber).toBe(4)
    expect(r.show).toBe(true)
    // State should not change
    expect(r.newState.mythShownDate).toBe('2026-11-05')
  })
})

describe('pickMythOfDay — initial state (never used)', () => {
  it('creates initial myth from shuffled order', () => {
    const emptyState: MythState = {
      mythOrder: [],
      mythToday: null,
      mythShownDate: null,
      mythHiddenToday: false,
      lastMythNumber: null,
    }
    const r = pickMythOfDay(emptyState, '2026-11-01')
    expect(r.mythNumber).toBeGreaterThanOrEqual(1)
    expect(r.mythNumber).toBeLessThanOrEqual(9)
    expect(r.show).toBe(true)
    expect(r.newState.mythOrder).toHaveLength(8) // 9 total - 1 taken
  })
})

// ─── nextUnconfirmedRule — spec §8 TC2, TC3 ──────────────────────────────────

describe('nextUnconfirmedRule', () => {
  it('spec TC2 — 3 of 6 confirmed → next is 4', () => {
    expect(nextUnconfirmedRule([1, 2, 3])).toBe(4)
  })
  it('spec TC3 — all 6 confirmed → null', () => {
    expect(nextUnconfirmedRule([1, 2, 3, 4, 5, 6])).toBeNull()
  })
  it('none confirmed → next is 1', () => {
    expect(nextUnconfirmedRule([])).toBe(1)
  })
  it('only rule 3 confirmed → next is 1 (goes in order)', () => {
    expect(nextUnconfirmedRule([3])).toBe(1)
  })
})

// ─── getRuleWhyLink — spec §8 TC15 ───────────────────────────────────────────

describe('getRuleWhyLink', () => {
  it('spec TC15 — rule 3 → Tab 1, card 4', () => {
    expect(getRuleWhyLink(3)).toEqual({ tab: 1, card: 4 })
  })
  it('rule 1 → Tab 1, card 3 (body clock)', () => {
    expect(getRuleWhyLink(1)).toEqual({ tab: 1, card: 3 })
  })
  it('rule 5 → Tab 1, card 3', () => {
    expect(getRuleWhyLink(5)).toEqual({ tab: 1, card: 3 })
  })
  it('rule 2 → Tab 1, card 2 (sleep pressure)', () => {
    expect(getRuleWhyLink(2)).toEqual({ tab: 1, card: 2 })
  })
  it('rule 4 → Tab 1, card 2', () => {
    expect(getRuleWhyLink(4)).toEqual({ tab: 1, card: 2 })
  })
  it('rule 6 → Tab 1, card 2', () => {
    expect(getRuleWhyLink(6)).toEqual({ tab: 1, card: 2 })
  })
})
