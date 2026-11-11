import { describe, it, expect, afterEach } from 'vitest'
import { getNow, getNowWithOverride, toDateString, addDays, daysBetween } from '@/lib/time'

describe('getNow()', () => {
  afterEach(() => {
    delete globalThis.__DEV_DATE__
  })

  it('returns current time when no override is set', () => {
    const before = Date.now()
    const result = getNow().getTime()
    const after = Date.now()
    expect(result).toBeGreaterThanOrEqual(before)
    expect(result).toBeLessThanOrEqual(after)
  })

  it('returns overridden date in development mode', () => {
    globalThis.__DEV_DATE__ = '2026-11-11T08:00:00'
    const result = getNow()
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(10) // 0-indexed
    expect(result.getDate()).toBe(11)
  })
})

describe('toDateString()', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toDateString(new Date('2026-01-05T12:00:00'))).toBe('2026-01-05')
  })
})

describe('addDays()', () => {
  it('adds days correctly', () => {
    const d = new Date('2026-11-11T00:00:00')
    expect(toDateString(addDays(d, 7))).toBe('2026-11-18')
    expect(toDateString(addDays(d, 28))).toBe('2026-12-09')
  })

  it('does not mutate the original date', () => {
    const d = new Date('2026-11-11T00:00:00')
    addDays(d, 5)
    expect(toDateString(d)).toBe('2026-11-11')
  })
})

describe('daysBetween()', () => {
  it('calculates whole days elapsed', () => {
    const from = new Date('2026-11-01T00:00:00')
    const to = new Date('2026-11-29T00:00:00')
    expect(daysBetween(from, to)).toBe(28)
  })
})

describe('getNowWithOverride()', () => {
  it('returns current time when no override provided', () => {
    const before = Date.now()
    const result = getNowWithOverride()
    const after = Date.now()
    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })

  it('returns the override date regardless of environment', () => {
    // Uses a date clearly distinct from today (2026-11-11) to prove the override works
    const result = getNowWithOverride('2024-01-15T10:00:00')
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(0) // January, 0-indexed
    expect(result.getDate()).toBe(15)
  })

  it('returns current time when override is empty string', () => {
    const before = Date.now()
    const result = getNowWithOverride('')
    const after = Date.now()
    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })

  it('returns current time when override is an invalid date string', () => {
    const before = Date.now()
    const result = getNowWithOverride('not-a-date')
    const after = Date.now()
    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })
})
