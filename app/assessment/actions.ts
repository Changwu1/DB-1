'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveAssessmentStep, completeAssessment } from '@/lib/assessment-db'
import { getNextStep } from '@/lib/assessment-steps'
import { getAssessmentResult, calcISIScore, calcBMI, calcStopBangScore } from '@/lib/assessment'
import type { AssessmentAnswers, AssessmentStep } from '@/lib/assessment'

type ActionResult = { error: string } | never

function numField(fd: FormData, name: string): number | null {
  const v = fd.get(name)
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function boolField(fd: FormData, name: string): boolean {
  return fd.get(name) === 'yes'
}

/** Save consent step. No consent → show message, do not advance. */
export async function submitConsent(_: unknown, fd: FormData): Promise<ActionResult> {
  const consent = fd.get('consent') === 'on'
  if (!consent) {
    return { error: 'ถ้าไม่ยินยอม เราขอหยุดแบบประเมินไว้ตรงนี้ ขอบคุณที่สนใจนะ' }
  }
  const { error } = await saveAssessmentStep({ consent: true }, 'consent')
  if (error) return { error }
  redirect('/assessment/account')
}

/** Save account name to profiles, mark account step done. */
export async function submitAccount(_: unknown, fd: FormData): Promise<ActionResult> {
  const name = (fd.get('account_name') as string | null)?.trim() ?? ''
  if (name.length < 1 || name.length > 30) {
    return { error: 'กรอกชื่อบัญชี 1–30 ตัวอักษร' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }
  await supabase.from('profiles').update({ account_name: name }).eq('id', user.id)
  const { error } = await saveAssessmentStep({}, 'account')
  if (error) return { error }
  redirect('/assessment/sleep-type')
}

/** Save age + sleep problem types. Age < 18 → return error (do not advance). */
export async function submitSleepType(_: unknown, fd: FormData): Promise<ActionResult> {
  const age = numField(fd, 'age')
  if (age === null || !Number.isInteger(age) || age < 0 || age > 100) {
    return { error: 'กรอกอายุเป็นตัวเลข 0–100' }
  }
  if (age < 18) {
    return { error: 'underage' }
  }
  const types = fd.getAll('sleep_problem_types') as string[]
  if (types.length === 0) {
    return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }
  const { error } = await saveAssessmentStep(
    { age, sleep_problem_types: types },
    'sleep-type'
  )
  if (error) return { error }
  redirect('/assessment/sleep-nights')
}

/** Save nights per week (0–7). */
export async function submitSleepNights(_: unknown, fd: FormData): Promise<ActionResult> {
  const nights = numField(fd, 'nights_per_week')
  if (nights === null || !Number.isInteger(nights) || nights < 0 || nights > 7) {
    return { error: 'ค่านี้ดูไม่ถูกต้อง ลองกรอกใหม่อีกครั้ง' }
  }
  const { error } = await saveAssessmentStep({ nights_per_week: nights }, 'sleep-nights')
  if (error) return { error }
  redirect('/assessment/sleep-duration')
}

/** Save problem duration. */
export async function submitSleepDuration(_: unknown, fd: FormData): Promise<ActionResult> {
  const dur = fd.get('problem_duration') as string | null
  const valid = ['น้อยกว่า 3 เดือน', '3–6 เดือน', 'มากกว่า 6 เดือน']
  if (!dur || !valid.includes(dur)) {
    return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }
  const { error } = await saveAssessmentStep({ problem_duration: dur }, 'sleep-duration')
  if (error) return { error }
  redirect('/assessment/sleep-opportunity')
}

/** Save adequate opportunity (yes/no). */
export async function submitSleepOpportunity(_: unknown, fd: FormData): Promise<ActionResult> {
  const val = fd.get('adequate_opportunity')
  if (val !== 'yes' && val !== 'no') {
    return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }
  const { error } = await saveAssessmentStep(
    { adequate_opportunity: val === 'yes' },
    'sleep-opportunity'
  )
  if (error) return { error }
  redirect('/assessment/isi')
}

/** Save ISI 7 questions + computed score. */
export async function submitISI(_: unknown, fd: FormData): Promise<ActionResult> {
  const qs = [1, 2, 3, 4, 5, 6, 7].map(i => numField(fd, `isi_q${i}`))
  if (qs.some(v => v === null || v < 0 || v > 4)) {
    return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }
  const [isi_q1, isi_q2, isi_q3, isi_q4, isi_q5, isi_q6, isi_q7] = qs as number[]
  const isi_score_start = isi_q1 + isi_q2 + isi_q3 + isi_q4 + isi_q5 + isi_q6 + isi_q7
  const { error } = await saveAssessmentStep(
    { isi_q1, isi_q2, isi_q3, isi_q4, isi_q5, isi_q6, isi_q7, isi_score_start },
    'isi'
  )
  if (error) return { error }
  redirect('/assessment/2q')
}

/** Save 2Q answers and branch to 9q or contraindications. */
export async function submit2Q(_: unknown, fd: FormData): Promise<ActionResult> {
  const q2_q1 = fd.get('q2_q1')
  const q2_q2 = fd.get('q2_q2')
  if (!q2_q1 || !q2_q2) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  const q1 = q2_q1 === 'yes'
  const q2 = q2_q2 === 'yes'
  const { error } = await saveAssessmentStep({ q2_q1: q1, q2_q2: q2 }, '2q')
  if (error) return { error }
  const next = getNextStep('2q', { q2Q1: q1, q2Q2: q2 })
  redirect(`/assessment/${next}`)
}

/** Save 9Q answers. If q3_11 > 0 → STOP immediately. */
export async function submit9Q(_: unknown, fd: FormData): Promise<ActionResult> {
  const items = [3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => numField(fd, `q9_q3_${i}`))
  if (items.some(v => v === null || v < 0 || v > 3)) {
    return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }
  const [q9_q3_3, q9_q3_4, q9_q3_5, q9_q3_6, q9_q3_7, q9_q3_8, q9_q3_9, q9_q3_10, q9_q3_11] =
    items as number[]
  const q9_total = q9_q3_3 + q9_q3_4 + q9_q3_5 + q9_q3_6 + q9_q3_7 + q9_q3_8 + q9_q3_9 + q9_q3_10 + q9_q3_11

  // STOP: q3.11 > 0 — save and complete immediately
  if (q9_q3_11 > 0) {
    await completeAssessment({
      q9_q3_3, q9_q3_4, q9_q3_5, q9_q3_6, q9_q3_7, q9_q3_8, q9_q3_9, q9_q3_10, q9_q3_11,
      q9_total,
      result: 'STOP',
      flags: [],
      last_completed_step: 'complete',
    })
    redirect('/assessment/result')
  }

  const { error } = await saveAssessmentStep(
    { q9_q3_3, q9_q3_4, q9_q3_5, q9_q3_6, q9_q3_7, q9_q3_8, q9_q3_9, q9_q3_10, q9_q3_11, q9_total },
    '9q'
  )
  if (error) return { error }
  redirect('/assessment/contraindications')
}

/** Save 5 contraindications. */
export async function submitContraindications(_: unknown, fd: FormData): Promise<ActionResult> {
  const { error } = await saveAssessmentStep({
    contraindication_bipolar: boolField(fd, 'bipolar'),
    contraindication_psychosis: boolField(fd, 'psychosis'),
    contraindication_epilepsy: boolField(fd, 'epilepsy'),
    contraindication_parasomnia: boolField(fd, 'parasomnia'),
    contraindication_machinery: boolField(fd, 'machinery'),
  }, 'contraindications')
  if (error) return { error }
  redirect('/assessment/shift-work')
}

/** Save shift work. */
export async function submitShiftWork(_: unknown, fd: FormData): Promise<ActionResult> {
  const val = fd.get('shift_work')
  if (val !== 'yes' && val !== 'no') return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  const { error } = await saveAssessmentStep({ shift_work: val === 'yes' }, 'shift-work')
  if (error) return { error }
  redirect('/assessment/pregnant')
}

/** Save pregnant/postnatal status. */
export async function submitPregnant(_: unknown, fd: FormData): Promise<ActionResult> {
  const val = fd.get('pregnant_postnatal') as string | null
  const valid = ['ใช่', 'ไม่ใช่', 'ไม่เกี่ยวข้อง']
  if (!val || !valid.includes(val)) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  const { error } = await saveAssessmentStep({ pregnant_postnatal: val }, 'pregnant')
  if (error) return { error }
  redirect('/assessment/rls')
}

/** Save RLS answers (q2–q4 only if q1=true). */
export async function submitRLS(_: unknown, fd: FormData): Promise<ActionResult> {
  const rls_q1 = fd.get('rls_q1') === 'yes'
  const fields: Record<string, unknown> = { rls_q1 }
  if (rls_q1) {
    const q2 = fd.get('rls_q2')
    const q3 = fd.get('rls_q3')
    const q4 = fd.get('rls_q4')
    if (!q2 || !q3 || !q4) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
    fields.rls_q2 = q2 === 'yes'
    fields.rls_q3 = q3 === 'yes'
    fields.rls_q4 = q4 === 'yes'
  } else {
    fields.rls_q2 = null
    fields.rls_q3 = null
    fields.rls_q4 = null
  }
  const { error } = await saveAssessmentStep(fields, 'rls')
  if (error) return { error }
  redirect('/assessment/stop-bang')
}

/** Save STOP-Bang questionnaire + compute BMI and score. */
export async function submitStopBang(_: unknown, fd: FormData): Promise<ActionResult> {
  const height = numField(fd, 'height_cm')
  const weight = numField(fd, 'weight_kg')
  const neckUnknown = fd.get('neck_unknown') === '1'
  const neck = neckUnknown ? null : numField(fd, 'neck_circumference_in')

  if (!height || height < 100 || height > 200) return { error: 'ค่านี้ดูไม่ถูกต้อง ลองกรอกใหม่อีกครั้ง (ส่วนสูง 100–200 ซม.)' }
  if (!weight || weight < 30 || weight > 250) return { error: 'ค่านี้ดูไม่ถูกต้อง ลองกรอกใหม่อีกครั้ง (น้ำหนัก 30–250 กก.)' }
  if (neck !== null && (neck < 8 || neck > 30)) return { error: 'ค่านี้ดูไม่ถูกต้อง ลองกรอกใหม่อีกครั้ง (รอบคอ 8–30 นิ้ว)' }

  const snore = fd.get('stop_bang_snore') as string | null
  const tired = fd.get('stop_bang_tired') as string | null
  const observed = fd.get('stop_bang_observed') as string | null
  const hypertension = fd.get('hypertension') === 'yes'
  const sex = fd.get('biological_sex') as string | null

  if (!['yes', 'no', 'unknown'].includes(snore ?? '')) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  if (!['yes', 'no'].includes(tired ?? '')) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  if (!['yes', 'no', 'unknown'].includes(observed ?? '')) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  if (!['ชาย', 'หญิง'].includes(sex ?? '')) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }

  const bmi = calcBMI(weight!, height!)
  const fakeAnswers = {
    stopBangSnore: snore as 'yes' | 'no' | 'unknown',
    stopBangTired: tired as 'yes' | 'no',
    stopBangObserved: observed as 'yes' | 'no' | 'unknown',
    hypertension,
    heightCm: height!,
    weightKg: weight!,
    neckCircumferenceIn: neck,
    biologicalSex: sex as 'ชาย' | 'หญิง',
    // age needed for stop-bang; load from DB or pass via form
    age: numField(fd, 'age') ?? 0,
  } as Pick<AssessmentAnswers, 'stopBangSnore' | 'stopBangTired' | 'stopBangObserved' | 'hypertension' | 'heightCm' | 'weightKg' | 'neckCircumferenceIn' | 'biologicalSex' | 'age'>
  const stop_bang_score = calcStopBangScore(fakeAnswers as AssessmentAnswers, bmi)

  const { error } = await saveAssessmentStep({
    stop_bang_snore: snore,
    stop_bang_tired: tired,
    stop_bang_observed: observed,
    hypertension,
    height_cm: height,
    weight_kg: weight,
    bmi,
    neck_circumference_in: neck,
    biological_sex: sex,
    stop_bang_score,
  }, 'stop-bang')
  if (error) return { error }
  redirect('/assessment/sleep-aids')
}

/** Save sleep aids and run final result computation. */
export async function submitSleepAids(_: unknown, fd: FormData): Promise<ActionResult> {
  const aids = {
    sleep_aid_prescription: fd.get('sleep_aid_prescription') as string,
    sleep_aid_otc: fd.get('sleep_aid_otc') as string,
    sleep_aid_alcohol: fd.get('sleep_aid_alcohol') as string,
    sleep_aid_supplement: fd.get('sleep_aid_supplement') as string,
  }
  const validAid = ['ไม่เคย', 'บางครั้ง', '3คืน+']
  for (const v of Object.values(aids)) {
    if (!validAid.includes(v)) return { error: 'เลือกคำตอบก่อนไปต่อนะ' }
  }

  // Load full row to compute final result
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'กรุณาเข้าสู่ระบบก่อน' }

  const { data: row } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row) return { error: 'ไม่พบข้อมูล กรุณาลองใหม่' }

  // Build AssessmentAnswers from DB row + current form data
  const answers: AssessmentAnswers = {
    age: row.age,
    sleepProblemTypes: row.sleep_problem_types ?? [],
    nightsPerWeek: row.nights_per_week,
    problemDuration: row.problem_duration,
    adequateOpportunity: row.adequate_opportunity,
    isiQ1: row.isi_q1, isiQ2: row.isi_q2, isiQ3: row.isi_q3, isiQ4: row.isi_q4,
    isiQ5: row.isi_q5, isiQ6: row.isi_q6, isiQ7: row.isi_q7,
    q2Q1: row.q2_q1, q2Q2: row.q2_q2,
    q9Q3_3: row.q9_q3_3, q9Q3_4: row.q9_q3_4, q9Q3_5: row.q9_q3_5,
    q9Q3_6: row.q9_q3_6, q9Q3_7: row.q9_q3_7, q9Q3_8: row.q9_q3_8,
    q9Q3_9: row.q9_q3_9, q9Q3_10: row.q9_q3_10, q9Q3_11: row.q9_q3_11,
    contraBipolar: row.contraindication_bipolar,
    contraPsychosis: row.contraindication_psychosis,
    contraEpilepsy: row.contraindication_epilepsy,
    contraParasomnia: row.contraindication_parasomnia,
    contraMachinery: row.contraindication_machinery,
    shiftWork: row.shift_work,
    pregnantPostnatal: row.pregnant_postnatal,
    rlsQ1: row.rls_q1, rlsQ2: row.rls_q2, rlsQ3: row.rls_q3, rlsQ4: row.rls_q4,
    stopBangSnore: row.stop_bang_snore,
    stopBangTired: row.stop_bang_tired,
    stopBangObserved: row.stop_bang_observed,
    hypertension: row.hypertension,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    neckCircumferenceIn: row.neck_circumference_in,
    biologicalSex: row.biological_sex,
    sleepAidPrescription: aids.sleep_aid_prescription as never,
    sleepAidOtc: aids.sleep_aid_otc as never,
    sleepAidAlcohol: aids.sleep_aid_alcohol as never,
    sleepAidSupplement: aids.sleep_aid_supplement as never,
  }

  const output = getAssessmentResult(answers)

  const { error } = await completeAssessment({
    ...aids,
    result: output.result,
    flags: output.flags,
    isi_score_start: output.isiScore,
    last_completed_step: 'complete',
  })
  if (error) return { error }
  redirect('/assessment/result')
}
