import {
  ISI_NOT_FIT_MAX,
  ISI_REFER_MIN,
  Q9_REFER_MIN,
  Q9_FLAG_MIN,
  Q9_FLAG_MAX,
  STOP_BANG_REFER_MIN,
  STOP_BANG_FLAG_MIN,
  STOP_BANG_FLAG_MAX,
  STOP_BANG_BMI_THRESHOLD,
  STOP_BANG_NECK_CM_THRESHOLD,
  STOP_BANG_AGE_THRESHOLD,
} from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssessmentResult = 'STOP' | 'REFER' | 'NOT-FIT' | 'GO'

export type SleepProblemType = 'หลับยาก' | 'ตื่นกลางดึก' | 'ตื่นเช้าเกิน' | 'ไม่มีปัญหาเหล่านี้'
export type ProblemDuration = 'น้อยกว่า 3 เดือน' | '3–6 เดือน' | 'มากกว่า 6 เดือน'
export type SleepAidFrequency = 'ไม่เคย' | 'บางครั้ง' | '3คืน+'
export type PregnantStatus = 'ใช่' | 'ไม่ใช่' | 'ไม่เกี่ยวข้อง'
export type BiologicalSex = 'ชาย' | 'หญิง'
export type StopBangYesNoUnknown = 'yes' | 'no' | 'unknown'

// AssessmentStep — typed union for last_completed_step (D: docs/01-assessment.md flow)
export type AssessmentStep =
  | 'consent'
  | 'account'
  | 'sleep-type'
  | 'sleep-nights'
  | 'sleep-duration'
  | 'sleep-opportunity'
  | 'isi'
  | '2q'
  | '9q'
  | 'contraindications'
  | 'shift-work'
  | 'pregnant'
  | 'rls'
  | 'stop-bang'
  | 'sleep-aids'
  | 'complete'

export interface AssessmentAnswers {
  age: number
  sleepProblemTypes: SleepProblemType[]
  nightsPerWeek: number
  problemDuration: ProblemDuration
  adequateOpportunity: boolean

  // ISI (ข้อ 1–7, 0–4 each)
  isiQ1: number; isiQ2: number; isiQ3: number; isiQ4: number
  isiQ5: number; isiQ6: number; isiQ7: number

  // 2Q
  q2Q1: boolean; q2Q2: boolean

  // 9Q (null = skipped because 2Q both false)
  q9Q3_3: number | null; q9Q3_4: number | null; q9Q3_5: number | null
  q9Q3_6: number | null; q9Q3_7: number | null; q9Q3_8: number | null
  q9Q3_9: number | null; q9Q3_10: number | null; q9Q3_11: number | null

  // Contraindications
  contraBipolar: boolean; contraPsychosis: boolean; contraEpilepsy: boolean
  contraParasomnia: boolean; contraMachinery: boolean

  // Lifestyle
  shiftWork: boolean
  pregnantPostnatal: PregnantStatus

  // RLS (Q2–Q4 null when Q1=false)
  rlsQ1: boolean
  rlsQ2: boolean | null; rlsQ3: boolean | null; rlsQ4: boolean | null

  // STOP-Bang
  stopBangSnore: StopBangYesNoUnknown
  stopBangTired: 'yes' | 'no'
  stopBangObserved: StopBangYesNoUnknown
  hypertension: boolean
  heightCm: number
  weightKg: number
  neckCircumferenceIn: number | null  // null = "ไม่รู้"
  biologicalSex: BiologicalSex

  // Sleep aids
  sleepAidPrescription: SleepAidFrequency
  sleepAidOtc: SleepAidFrequency
  sleepAidAlcohol: SleepAidFrequency
  sleepAidSupplement: SleepAidFrequency
}

export interface AssessmentResultOutput {
  result: AssessmentResult
  flags: string[]
  isiScore: number
  q9Score: number
  bmi: number
  stopBangScore: number
}

// ─── Pure calculation functions ───────────────────────────────────────────────

/** ISI score: sum of 7 questions (0–4 each). Rule: docs/01-assessment.md section 5. */
export function calcISIScore(a: AssessmentAnswers): number {
  return a.isiQ1 + a.isiQ2 + a.isiQ3 + a.isiQ4 + a.isiQ5 + a.isiQ6 + a.isiQ7
}

/** 9Q score: sum of 9 questions (0–3 each). Returns 0 when 9Q was skipped (all null). */
export function calcQ9Score(a: AssessmentAnswers): number {
  if (a.q9Q3_3 === null) return 0
  return (
    (a.q9Q3_3 ?? 0) + (a.q9Q3_4 ?? 0) + (a.q9Q3_5 ?? 0) +
    (a.q9Q3_6 ?? 0) + (a.q9Q3_7 ?? 0) + (a.q9Q3_8 ?? 0) +
    (a.q9Q3_9 ?? 0) + (a.q9Q3_10 ?? 0) + (a.q9Q3_11 ?? 0)
  )
}

/** BMI: weight(kg) / (height(cm)/100)² rounded to 2 decimal places. */
export function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100
}

/**
 * STOP-Bang score (0–8). Rules from docs/01-assessment.md section 5.
 * Neck circumference: convert inches → cm (× 2.54), then compare > 40cm.
 * BMI comparison uses the pre-rounded bmi value passed in.
 * "ไม่รู้" / unknown → 0 points.
 */
export function calcStopBangScore(a: AssessmentAnswers, bmi: number): number {
  const neckCm = a.neckCircumferenceIn !== null ? a.neckCircumferenceIn * 2.54 : 0

  return (
    (a.stopBangSnore === 'yes' ? 1 : 0) +           // S: Snore
    (a.stopBangTired === 'yes' ? 1 : 0) +            // T: Tired
    (a.stopBangObserved === 'yes' ? 1 : 0) +         // O: Observed apnea
    (a.hypertension ? 1 : 0) +                       // P: Pressure
    (bmi > STOP_BANG_BMI_THRESHOLD ? 1 : 0) +        // B: BMI > 35
    (a.age > STOP_BANG_AGE_THRESHOLD ? 1 : 0) +      // A: Age > 50
    (neckCm > STOP_BANG_NECK_CM_THRESHOLD ? 1 : 0) + // N: Neck > 40cm
    (a.biologicalSex === 'ชาย' ? 1 : 0)              // G: Gender male
  )
}

// ─── Main result function ─────────────────────────────────────────────────────

/**
 * Compute assessment result with priority: STOP > REFER > NOT-FIT > GO.
 * Rules: docs/01-assessment.md section 4. Decisions: docs/05-decisions.md.
 */
export function getAssessmentResult(a: AssessmentAnswers): AssessmentResultOutput {
  const isiScore = calcISIScore(a)
  const bmi = calcBMI(a.weightKg, a.heightCm)
  const stopBangScore = calcStopBangScore(a, bmi)

  // STOP: 9Q ข้อ 3.11 > 0 → immediate, before any other check
  if (a.q9Q3_11 !== null && a.q9Q3_11 > 0) {
    return { result: 'STOP', flags: [], isiScore, q9Score: calcQ9Score(a), bmi, stopBangScore }
  }

  const q9Score = calcQ9Score(a)

  // Collect NOT-FIT conditions (all checked even if REFER also applies)
  const notFitReasons: string[] = []
  if (a.age < 18) notFitReasons.push('underage')
  if (!a.sleepProblemTypes.some(t => ['หลับยาก', 'ตื่นกลางดึก', 'ตื่นเช้าเกิน'].includes(t))) {
    notFitReasons.push('no-sleep-problem')
  }
  if (a.nightsPerWeek < 3) notFitReasons.push('low-nights')
  if (a.problemDuration === 'น้อยกว่า 3 เดือน') notFitReasons.push('short-duration')
  if (!a.adequateOpportunity) notFitReasons.push('no-opportunity')
  if (isiScore <= ISI_NOT_FIT_MAX) notFitReasons.push('low-isi')

  // Collect REFER conditions (ask-all-then-report pattern)
  const referReasons: string[] = []
  if (isiScore >= ISI_REFER_MIN) referReasons.push('ISI')
  if (q9Score >= Q9_REFER_MIN) referReasons.push('9Q')
  if (a.contraBipolar) referReasons.push('bipolar')
  if (a.contraPsychosis) referReasons.push('psychosis')
  if (a.contraEpilepsy) referReasons.push('epilepsy')
  if (a.contraParasomnia) referReasons.push('parasomnia')
  if (a.contraMachinery) referReasons.push('machinery')
  if (a.rlsQ1 && a.rlsQ2 && a.rlsQ3 && a.rlsQ4) referReasons.push('RLS')
  if (stopBangScore >= STOP_BANG_REFER_MIN) referReasons.push('STOP-Bang')

  // Priority: REFER > NOT-FIT (flags carries the refer reasons for the result page)
  if (referReasons.length > 0) {
    return { result: 'REFER', flags: referReasons, isiScore, q9Score, bmi, stopBangScore }
  }
  if (notFitReasons.length > 0) {
    return { result: 'NOT-FIT', flags: [], isiScore, q9Score, bmi, stopBangScore }
  }

  // GO — collect flags (แจ้งเตือนพิเศษ, only shown with GO)
  const flags: string[] = []

  if (q9Score >= Q9_FLAG_MIN && q9Score <= Q9_FLAG_MAX) {
    flags.push('อารมณ์เศร้าระดับเล็กน้อย')
  }

  if (stopBangScore >= STOP_BANG_FLAG_MIN && stopBangScore <= STOP_BANG_FLAG_MAX) {
    const hasUnknown = a.stopBangSnore === 'unknown' || a.stopBangObserved === 'unknown'
    flags.push(hasUnknown
      ? 'เสี่ยงหยุดหายใจขณะหลับ (มีบางข้อตอบว่าไม่รู้)'
      : 'เสี่ยงหยุดหายใจขณะหลับ')
  }

  if (a.shiftWork) flags.push('ทำงานเป็นกะ')
  if (a.pregnantPostnatal === 'ใช่') flags.push('ตั้งครรภ์/หลังคลอด')

  const sleepAids = [a.sleepAidPrescription, a.sleepAidOtc, a.sleepAidAlcohol, a.sleepAidSupplement]
  if (sleepAids.includes('3คืน+')) flags.push('สิ่งช่วยหลับ')

  return { result: 'GO', flags, isiScore, q9Score, bmi, stopBangScore }
}
