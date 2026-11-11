import { describe, it, expect } from 'vitest'
import { getNextStep, resumeFromStep, isValidStep } from '@/lib/assessment-steps'

describe('isValidStep', () => {
  it('returns true for every valid step', () => {
    const steps = ['consent', 'account', 'sleep-type', 'sleep-nights', 'sleep-duration',
      'sleep-opportunity', 'isi', '2q', '9q', 'contraindications',
      'shift-work', 'pregnant', 'rls', 'stop-bang', 'sleep-aids']
    steps.forEach(s => expect(isValidStep(s)).toBe(true))
  })

  it('returns false for unknown strings', () => {
    expect(isValidStep('complete')).toBe(false)
    expect(isValidStep('result')).toBe(false)
    expect(isValidStep('')).toBe(false)
  })
})

describe('getNextStep', () => {
  it('advances linearly for most steps', () => {
    expect(getNextStep('consent')).toBe('account')
    expect(getNextStep('account')).toBe('sleep-type')
    expect(getNextStep('sleep-type')).toBe('sleep-nights')
    expect(getNextStep('sleep-nights')).toBe('sleep-duration')
    expect(getNextStep('sleep-duration')).toBe('sleep-opportunity')
    expect(getNextStep('sleep-opportunity')).toBe('isi')
    expect(getNextStep('isi')).toBe('2q')
    expect(getNextStep('contraindications')).toBe('shift-work')
    expect(getNextStep('shift-work')).toBe('pregnant')
    expect(getNextStep('pregnant')).toBe('rls')
    expect(getNextStep('rls')).toBe('stop-bang')
    expect(getNextStep('stop-bang')).toBe('sleep-aids')
  })

  it('sleep-aids leads to complete', () => {
    expect(getNextStep('sleep-aids')).toBe('complete')
  })

  it('2q branches to 9q when either q2 answer is true', () => {
    expect(getNextStep('2q', { q2Q1: true, q2Q2: false })).toBe('9q')
    expect(getNextStep('2q', { q2Q1: false, q2Q2: true })).toBe('9q')
    expect(getNextStep('2q', { q2Q1: true, q2Q2: true })).toBe('9q')
  })

  it('2q skips to contraindications when both q2 answers are false', () => {
    expect(getNextStep('2q', { q2Q1: false, q2Q2: false })).toBe('contraindications')
    expect(getNextStep('2q', { q2Q1: null, q2Q2: null })).toBe('contraindications')
    expect(getNextStep('2q')).toBe('contraindications')
  })
})

describe('resumeFromStep', () => {
  it('starts at consent when no last_completed_step', () => {
    expect(resumeFromStep(null)).toBe('consent')
    expect(resumeFromStep(undefined)).toBe('consent')
  })

  it('resumes after the last completed step', () => {
    expect(resumeFromStep('consent')).toBe('account')
    expect(resumeFromStep('account')).toBe('sleep-type')
    expect(resumeFromStep('stop-bang')).toBe('sleep-aids')
  })

  it('returns complete after sleep-aids', () => {
    expect(resumeFromStep('sleep-aids')).toBe('complete')
  })

  it('handles 2q branch on resume', () => {
    expect(resumeFromStep('2q', { q2Q1: false, q2Q2: false })).toBe('contraindications')
    expect(resumeFromStep('2q', { q2Q1: true, q2Q2: false })).toBe('9q')
  })
})
