import { describe, it, expect } from 'vitest'
import { calcISIInterpretation, calcISIChange } from '@/lib/final-isi'

// ─── calcISIInterpretation ────────────────────────────────────────────────────

describe('calcISIInterpretation — severity categories', () => {
  it('score 0 → none', () => expect(calcISIInterpretation(0)).toBe('none'))
  it('score 7 → none (boundary)', () => expect(calcISIInterpretation(7)).toBe('none'))
  it('score 8 → subthreshold (boundary)', () => expect(calcISIInterpretation(8)).toBe('subthreshold'))
  it('score 14 → subthreshold (boundary)', () => expect(calcISIInterpretation(14)).toBe('subthreshold'))
  it('score 15 → moderate (boundary)', () => expect(calcISIInterpretation(15)).toBe('moderate'))
  it('score 21 → moderate (boundary)', () => expect(calcISIInterpretation(21)).toBe('moderate'))
  it('score 22 → severe (boundary)', () => expect(calcISIInterpretation(22)).toBe('severe'))
  it('score 28 → severe (max)', () => expect(calcISIInterpretation(28)).toBe('severe'))
  it('score 12 → subthreshold', () => expect(calcISIInterpretation(12)).toBe('subthreshold'))
  it('score 18 → moderate', () => expect(calcISIInterpretation(18)).toBe('moderate'))
})

// ─── calcISIChange ────────────────────────────────────────────────────────────

describe('calcISIChange — comparison', () => {
  it('passes through both scores', () => {
    const r = calcISIChange(18, 10)
    expect(r.initialScore).toBe(18)
    expect(r.finalScore).toBe(10)
  })

  it('calculates diff correctly', () => {
    expect(calcISIChange(18, 10).diff).toBe(-8)
    expect(calcISIChange(14, 18).diff).toBe(4)
    expect(calcISIChange(15, 15).diff).toBe(0)
  })

  it('resolved severity for each score', () => {
    const r = calcISIChange(18, 10)
    expect(r.initialSeverity).toBe('moderate')
    expect(r.finalSeverity).toBe('subthreshold')
  })

  it('clinically significant when diff ≤ −6', () => {
    expect(calcISIChange(18, 12).clinicallySignificant).toBe(true)   // diff = −6, at boundary
    expect(calcISIChange(18, 10).clinicallySignificant).toBe(true)   // diff = −8
    expect(calcISIChange(28, 14).clinicallySignificant).toBe(true)   // diff = −14
  })

  it('NOT clinically significant when diff > −6', () => {
    expect(calcISIChange(18, 13).clinicallySignificant).toBe(false)  // diff = −5
    expect(calcISIChange(14, 14).clinicallySignificant).toBe(false)  // diff = 0
    expect(calcISIChange(14, 18).clinicallySignificant).toBe(false)  // worsened
  })
})
