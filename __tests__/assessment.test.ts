import { describe, it, expect } from 'vitest'
import {
  calcISIScore,
  calcQ9Score,
  calcBMI,
  calcStopBangScore,
  getAssessmentResult,
  type AssessmentAnswers,
} from '@/lib/assessment'

// ─── Base case "ก" (spec section 8) ──────────────────────────────────────────
// age 30, female, 170cm/64.5kg, neck 14in, หลับยาก, 5 nights/week,
// >6 months, adequate opportunity, ISI all 2, 2Q both no,
// no contraindications, no shift/pregnant/RLS, snore=no, tired=yes,
// observed=no, hypertension=no, all sleep aids=never
// Expected: ISI=14, BMI=22.32, STOP-Bang=1, GO no flags
const BASE: AssessmentAnswers = {
  age: 30,
  sleepProblemTypes: ['หลับยาก'],
  nightsPerWeek: 5,
  problemDuration: 'มากกว่า 6 เดือน',
  adequateOpportunity: true,
  isiQ1: 2, isiQ2: 2, isiQ3: 2, isiQ4: 2, isiQ5: 2, isiQ6: 2, isiQ7: 2,
  q2Q1: false, q2Q2: false,
  q9Q3_3: null, q9Q3_4: null, q9Q3_5: null, q9Q3_6: null,
  q9Q3_7: null, q9Q3_8: null, q9Q3_9: null, q9Q3_10: null, q9Q3_11: null,
  contraBipolar: false, contraPsychosis: false, contraEpilepsy: false,
  contraParasomnia: false, contraMachinery: false,
  shiftWork: false,
  pregnantPostnatal: 'ไม่เกี่ยวข้อง',
  rlsQ1: false, rlsQ2: null, rlsQ3: null, rlsQ4: null,
  stopBangSnore: 'no',
  stopBangTired: 'yes',
  stopBangObserved: 'no',
  hypertension: false,
  heightCm: 170,
  weightKg: 64.5,
  neckCircumferenceIn: 14,
  biologicalSex: 'หญิง',
  sleepAidPrescription: 'ไม่เคย',
  sleepAidOtc: 'ไม่เคย',
  sleepAidAlcohol: 'ไม่เคย',
  sleepAidSupplement: 'ไม่เคย',
}

function a(overrides: Partial<AssessmentAnswers>): AssessmentAnswers {
  return { ...BASE, ...overrides }
}

// ─── Calculation functions ────────────────────────────────────────────────────

describe('calcISIScore()', () => {
  it('sums 7 ISI questions', () => {
    expect(calcISIScore(BASE)).toBe(14)
  })
  it('returns 0 when all questions are 0', () => {
    expect(calcISIScore(a({ isiQ1:0, isiQ2:0, isiQ3:0, isiQ4:0, isiQ5:0, isiQ6:0, isiQ7:0 }))).toBe(0)
  })
  it('returns 28 for maximum answers', () => {
    expect(calcISIScore(a({ isiQ1:4, isiQ2:4, isiQ3:4, isiQ4:4, isiQ5:4, isiQ6:4, isiQ7:4 }))).toBe(28)
  })
})

describe('calcQ9Score()', () => {
  it('returns 0 when 9Q was skipped (all null)', () => {
    expect(calcQ9Score(BASE)).toBe(0)
  })
  it('sums 9Q questions when present', () => {
    // TC7 input: 3.3–3.8 = 2 each, 3.9 = 1, 3.10 = 0, 3.11 = 0 → 13
    expect(calcQ9Score(a({
      q2Q1: true,
      q9Q3_3: 2, q9Q3_4: 2, q9Q3_5: 2, q9Q3_6: 2, q9Q3_7: 2, q9Q3_8: 2,
      q9Q3_9: 1, q9Q3_10: 0, q9Q3_11: 0,
    }))).toBe(13)
  })
})

describe('calcBMI()', () => {
  it('returns BMI rounded to 2 decimal places', () => {
    expect(calcBMI(64.5, 170)).toBe(22.32)
  })
  it('TC18 — 92kg / 160cm = 35.94', () => {
    expect(calcBMI(92, 160)).toBe(35.94)
  })
})

describe('calcStopBangScore()', () => {
  it('TC1 base ก → 1 (only tired=yes)', () => {
    expect(calcStopBangScore(BASE, calcBMI(BASE.weightKg, BASE.heightCm))).toBe(1)
  })
  it('TC9 male age 55 neck 17in snore → 5', () => {
    const answers = a({ biologicalSex: 'ชาย', age: 55, neckCircumferenceIn: 17, stopBangSnore: 'yes' })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(5)
  })
  it('TC10 male age 55 → 3', () => {
    const answers = a({ biologicalSex: 'ชาย', age: 55 })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(3)
  })
  it('TC18 male age 55 BMI 35.94 → 4', () => {
    const answers = a({ biologicalSex: 'ชาย', age: 55, weightKg: 92, heightCm: 160 })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(4)
  })
  it('BMI exactly 35.00 scores 0 (must be strictly greater)', () => {
    // weight/height where BMI rounds to exactly 35.00
    const answers = a({ biologicalSex: 'ชาย', age: 55 })
    expect(calcStopBangScore(answers, 35.00)).toBe(3) // tired+age+male; BMI not counted
  })
  it('neck circumference unknown = 0 score', () => {
    const answers = a({ biologicalSex: 'ชาย', age: 55, neckCircumferenceIn: null })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(3)
  })
  it('neck 15.75 inches (40.005cm) scores 1', () => {
    const answers = a({ biologicalSex: 'ชาย', age: 55, neckCircumferenceIn: 15.75 })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(4)
  })
  it('unknown answers score 0', () => {
    const answers = a({ stopBangSnore: 'unknown', stopBangObserved: 'unknown' })
    expect(calcStopBangScore(answers, calcBMI(answers.weightKg, answers.heightCm))).toBe(1)
  })
})

// ─── getAssessmentResult — 19 section-8 test cases ───────────────────────────

describe('getAssessmentResult() — section 8 test cases', () => {

  // TC1: Base ก → GO, no flags, ISI=14, STOP-Bang=1
  it('TC1 ก (ฐาน) → GO ไม่มีแจ้งเตือน', () => {
    const r = getAssessmentResult(BASE)
    expect(r.result).toBe('GO')
    expect(r.flags).toHaveLength(0)
    expect(r.isiScore).toBe(14)
    expect(r.stopBangScore).toBe(1)
    expect(r.bmi).toBe(22.32)
  })

  // TC2: Age 17 → NOT-FIT (early exit, underage)
  it('TC2 อายุ 17 → NOT-FIT', () => {
    expect(getAssessmentResult(a({ age: 17 })).result).toBe('NOT-FIT')
  })

  // TC3: nights/week = 2 → NOT-FIT
  it('TC3 คืนที่นอนไม่หลับต่อสัปดาห์ 2 → NOT-FIT', () => {
    expect(getAssessmentResult(a({ nightsPerWeek: 2 })).result).toBe('NOT-FIT')
  })

  // TC4: ISI = 1,1,1,1,1,1,0 (sum 6) → NOT-FIT
  it('TC4 ISI รวม 6 → NOT-FIT', () => {
    const r = getAssessmentResult(a({ isiQ1:1, isiQ2:1, isiQ3:1, isiQ4:1, isiQ5:1, isiQ6:1, isiQ7:0 }))
    expect(r.result).toBe('NOT-FIT')
    expect(r.isiScore).toBe(6)
  })

  // TC5: ISI = 4,3,3,3,3,3,3 (sum 22) → REFER (ISI)
  it('TC5 ISI รวม 22 → REFER เหตุผล ISI', () => {
    const r = getAssessmentResult(a({ isiQ1:4, isiQ2:3, isiQ3:3, isiQ4:3, isiQ5:3, isiQ6:3, isiQ7:3 }))
    expect(r.result).toBe('REFER')
    expect(r.isiScore).toBe(22)
  })

  // TC6: 2Q q1=yes, 9Q 3.3-3.10=0, 3.11=1 → STOP
  it('TC6 9Q ข้อ 3.11 = 1 → STOP ทันที', () => {
    const r = getAssessmentResult(a({
      q2Q1: true,
      q9Q3_3: 0, q9Q3_4: 0, q9Q3_5: 0, q9Q3_6: 0,
      q9Q3_7: 0, q9Q3_8: 0, q9Q3_9: 0, q9Q3_10: 0, q9Q3_11: 1,
    }))
    expect(r.result).toBe('STOP')
  })

  // TC7: 2Q q1=yes, 9Q 3.3-3.8=2, 3.9=1, 3.10=0, 3.11=0 (sum 13) → REFER (9Q)
  it('TC7 9Q รวม 13 → REFER เหตุผล 9Q', () => {
    const r = getAssessmentResult(a({
      q2Q1: true,
      q9Q3_3: 2, q9Q3_4: 2, q9Q3_5: 2, q9Q3_6: 2, q9Q3_7: 2, q9Q3_8: 2,
      q9Q3_9: 1, q9Q3_10: 0, q9Q3_11: 0,
    }))
    expect(r.result).toBe('REFER')
    expect(r.q9Score).toBe(13)
  })

  // TC8: same as TC7 but 3.9=0 (sum 12) → GO + depression flag
  it('TC8 9Q รวม 12 → GO + แจ้งเตือนอารมณ์เศร้า', () => {
    const r = getAssessmentResult(a({
      q2Q1: true,
      q9Q3_3: 2, q9Q3_4: 2, q9Q3_5: 2, q9Q3_6: 2, q9Q3_7: 2, q9Q3_8: 2,
      q9Q3_9: 0, q9Q3_10: 0, q9Q3_11: 0,
    }))
    expect(r.result).toBe('GO')
    expect(r.flags.some(f => f.includes('อารมณ์เศร้า'))).toBe(true)
  })

  // TC9: male age 55 neck 17in snore → STOP-Bang=5 → REFER
  it('TC9 STOP-Bang 5 → REFER', () => {
    const r = getAssessmentResult(a({
      biologicalSex: 'ชาย', age: 55,
      neckCircumferenceIn: 17, stopBangSnore: 'yes',
    }))
    expect(r.result).toBe('REFER')
    expect(r.stopBangScore).toBe(5)
  })

  // TC10: male age 55 → STOP-Bang=3 → GO + sleep apnea flag
  it('TC10 STOP-Bang 3 → GO + แจ้งเตือนหยุดหายใจ', () => {
    const r = getAssessmentResult(a({ biologicalSex: 'ชาย', age: 55 }))
    expect(r.result).toBe('GO')
    expect(r.stopBangScore).toBe(3)
    expect(r.flags.some(f => f.includes('หยุดหายใจ'))).toBe(true)
  })

  // TC11: prescription sleep aid ≥ 3 nights → GO + sleep aid flag
  it('TC11 ยาแพทย์สั่ง 3คืน+ → GO + แจ้งเตือนสิ่งช่วยหลับ', () => {
    const r = getAssessmentResult(a({ sleepAidPrescription: '3คืน+' }))
    expect(r.result).toBe('GO')
    expect(r.flags.some(f => f.includes('สิ่งช่วยหลับ'))).toBe(true)
  })

  // TC12: epilepsy=true → REFER
  it('TC12 ลมชัก → REFER', () => {
    expect(getAssessmentResult(a({ contraEpilepsy: true })).result).toBe('REFER')
  })

  // TC13: ISI sum 6 (NOT-FIT) AND epilepsy=true → REFER wins
  it('TC13 ISI รวม 6 + ลมชัก → REFER ชนะ NOT-FIT', () => {
    const r = getAssessmentResult(a({
      isiQ1:1, isiQ2:1, isiQ3:1, isiQ4:1, isiQ5:1, isiQ6:1, isiQ7:0,
      contraEpilepsy: true,
    }))
    expect(r.result).toBe('REFER')
  })

  // TC14: shift work + pregnant + supplement ≥ 3 → GO + 3 flags
  it('TC14 กะ + ตั้งครรภ์ + อาหารเสริม → GO + 3 แจ้งเตือน', () => {
    const r = getAssessmentResult(a({
      shiftWork: true,
      pregnantPostnatal: 'ใช่',
      sleepAidSupplement: '3คืน+',
    }))
    expect(r.result).toBe('GO')
    expect(r.flags.some(f => f.includes('กะ'))).toBe(true)
    expect(r.flags.some(f => f.includes('ตั้งครรภ์'))).toBe(true)
    expect(r.flags.some(f => f.includes('สิ่งช่วยหลับ'))).toBe(true)
    expect(r.flags).toHaveLength(3)
  })

  // TC15: ISI 22 + 2Q q1=yes + 9Q 3.11=1 → STOP wins over REFER
  it('TC15 STOP ชนะ REFER เมื่อ 9Q 3.11 > 0', () => {
    const r = getAssessmentResult(a({
      isiQ1:4, isiQ2:3, isiQ3:3, isiQ4:3, isiQ5:3, isiQ6:3, isiQ7:3,
      q2Q1: true,
      q9Q3_3: 0, q9Q3_4: 0, q9Q3_5: 0, q9Q3_6: 0,
      q9Q3_7: 0, q9Q3_8: 0, q9Q3_9: 0, q9Q3_10: 0, q9Q3_11: 1,
    }))
    expect(r.result).toBe('STOP')
  })

  // TC16 and TC17: resume/STOP-lock are screen behaviors — not pure function tests
  // TC19: height 95cm → input validation error (UI layer, not pure function)

  // TC18: 92kg/160cm (BMI 35.94) male age 55 → STOP-Bang=4 → GO + sleep apnea flag
  it('TC18 BMI 35.94 male age 55 → GO + แจ้งเตือนหยุดหายใจ', () => {
    const r = getAssessmentResult(a({
      weightKg: 92, heightCm: 160,
      biologicalSex: 'ชาย', age: 55,
    }))
    expect(r.result).toBe('GO')
    expect(r.stopBangScore).toBe(4)
    expect(r.flags.some(f => f.includes('หยุดหายใจ'))).toBe(true)
  })
})

// ─── Edge cases (spec section 6) ─────────────────────────────────────────────

describe('edge cases (spec section 6)', () => {
  it('nights = 3 → passes (< 3 is NOT-FIT, 3 is fine)', () => {
    expect(getAssessmentResult(a({ nightsPerWeek: 3 })).result).toBe('GO')
  })

  it('ISI = 7 → NOT-FIT', () => {
    expect(getAssessmentResult(a({ isiQ1:1, isiQ2:1, isiQ3:1, isiQ4:1, isiQ5:1, isiQ6:1, isiQ7:1 })).result).toBe('NOT-FIT')
  })

  it('ISI = 8 → passes through (GO with no other triggers)', () => {
    expect(getAssessmentResult(a({ isiQ1:2, isiQ2:1, isiQ3:1, isiQ4:1, isiQ5:1, isiQ6:1, isiQ7:1 })).result).toBe('GO')
  })

  it('ISI = 21 → passes through (GO with no other triggers)', () => {
    expect(getAssessmentResult(a({ isiQ1:4, isiQ2:3, isiQ3:3, isiQ4:3, isiQ5:3, isiQ6:3, isiQ7:2 })).result).toBe('GO')
  })

  it('9Q = 12 → GO + depression flag (not REFER)', () => {
    const r = getAssessmentResult(a({
      q2Q1: true,
      q9Q3_3: 2, q9Q3_4: 2, q9Q3_5: 2, q9Q3_6: 2, q9Q3_7: 2, q9Q3_8: 2,
      q9Q3_9: 0, q9Q3_10: 0, q9Q3_11: 0,
    }))
    expect(r.result).toBe('GO')
  })

  it('age = 18 → passes', () => {
    expect(getAssessmentResult(a({ age: 18 })).result).toBe('GO')
  })

  it('age = 50 → no STOP-Bang age point', () => {
    const r = getAssessmentResult(a({ age: 50 }))
    expect(r.stopBangScore).toBe(1) // only tired=yes from base
  })

  it('age = 51 → gains STOP-Bang age point', () => {
    const r = getAssessmentResult(a({ age: 51 }))
    expect(r.stopBangScore).toBe(2) // tired + age
  })

  it('BMI exactly 35.00 → no STOP-Bang BMI point', () => {
    const r = getAssessmentResult(a({ biologicalSex: 'ชาย', age: 55, weightKg: 92, heightCm: 160 }))
    // BMI = 35.94 → scores, so test a case where BMI is exactly 35.00
    expect(calcBMI(89.6, 160)).toBe(35.00)
    const rExact = getAssessmentResult(a({ biologicalSex: 'ชาย', age: 55, weightKg: 89.6, heightCm: 160 }))
    expect(rExact.stopBangScore).toBe(3) // tired+age+male; BMI=35.00 not counted (must be strictly >35)
  })

  it('neck 15.75in = 40.005cm → scores (> 40)', () => {
    const ans = a({ biologicalSex: 'ชาย', age: 55, neckCircumferenceIn: 15.75 })
    expect(calcStopBangScore(ans, calcBMI(ans.weightKg, ans.heightCm))).toBe(4)
  })

  it('problem duration 3–6 เดือน → passes', () => {
    expect(getAssessmentResult(a({ problemDuration: '3–6 เดือน' })).result).toBe('GO')
  })

  it('flags accumulate — shift + pregnant + sleep aid = 3 flags on GO', () => {
    const r = getAssessmentResult(a({
      shiftWork: true, pregnantPostnatal: 'ใช่', sleepAidPrescription: '3คืน+',
    }))
    expect(r.result).toBe('GO')
    expect(r.flags).toHaveLength(3)
  })

  it('sleep problem type ไม่มีปัญหาเหล่านี้ → NOT-FIT', () => {
    expect(getAssessmentResult(a({ sleepProblemTypes: ['ไม่มีปัญหาเหล่านี้'] })).result).toBe('NOT-FIT')
  })

  it('adequate opportunity = false → NOT-FIT', () => {
    expect(getAssessmentResult(a({ adequateOpportunity: false })).result).toBe('NOT-FIT')
  })

  // REFER reasons included in flags (for result page display)
  it('REFER result includes reasons in flags — ISI', () => {
    const r = getAssessmentResult(a({ isiQ1:4, isiQ2:3, isiQ3:3, isiQ4:3, isiQ5:3, isiQ6:3, isiQ7:3 }))
    expect(r.result).toBe('REFER')
    expect(r.flags).toContain('ISI')
  })

  it('REFER result includes reasons in flags — 9Q', () => {
    const r = getAssessmentResult(a({
      q2Q1: true,
      q9Q3_3: 2, q9Q3_4: 2, q9Q3_5: 2, q9Q3_6: 2, q9Q3_7: 2, q9Q3_8: 2,
      q9Q3_9: 1, q9Q3_10: 0, q9Q3_11: 0,
    }))
    expect(r.result).toBe('REFER')
    expect(r.flags).toContain('9Q')
  })

  it('REFER result includes reasons in flags — contraindication', () => {
    const r = getAssessmentResult(a({ contraEpilepsy: true }))
    expect(r.result).toBe('REFER')
    expect(r.flags).toContain('epilepsy')
  })
})
