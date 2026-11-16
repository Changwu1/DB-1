export const instant = false

import { notFound, redirect } from 'next/navigation'
import { loadAssessment } from '@/lib/assessment-db'
import { isValidStep, resumeFromStep } from '@/lib/assessment-steps'
import AccountForm from '../_components/AccountForm'
import SleepTypeForm from '../_components/SleepTypeForm'
import SleepNightsForm from '../_components/SleepNightsForm'
import SleepDurationForm from '../_components/SleepDurationForm'
import SleepOpportunityForm from '../_components/SleepOpportunityForm'
import ISIForm from '../_components/ISIForm'
import TwoQForm from '../_components/TwoQForm'
import NineQForm from '../_components/NineQForm'
import ContraindicationsForm from '../_components/ContraindicationsForm'
import ShiftWorkForm from '../_components/ShiftWorkForm'
import PregnantForm from '../_components/PregnantForm'
import RLSForm from '../_components/RLSForm'
import StopBangForm from '../_components/StopBangForm'
import SleepAidsForm from '../_components/SleepAidsForm'
import type { AssessmentStep } from '@/lib/assessment'
import ProgressBar from '../_components/ProgressBar'

const STEP_INDEX: Partial<Record<AssessmentStep, number>> = {
  consent: 0, account: 1, 'sleep-type': 2, 'sleep-nights': 3,
  'sleep-duration': 4, 'sleep-opportunity': 5, isi: 6, '2q': 7,
  '9q': 8, contraindications: 9, 'shift-work': 10, pregnant: 11,
  rls: 12, 'stop-bang': 13, 'sleep-aids': 14,
}

type Props = { params: Promise<{ step: string }> }

export default async function AssessmentStepPage({ params }: Props) {
  const { step } = await params
  if (!isValidStep(step) || step === 'consent') notFound()

  const row = await loadAssessment()

  // Already complete → show result
  if (row?.completed_at) redirect('/assessment/result')

  // Guard: if user hasn't reached this step yet, send them to the right step
  if (row?.last_completed_step) {
    const correctNext = resumeFromStep(row.last_completed_step, {
      q2Q1: row.q2_q1,
      q2Q2: row.q2_q2,
    })
    if (correctNext === 'complete') redirect('/assessment/result')
    if (correctNext !== step) redirect(`/assessment/${correctNext}`)
  } else if (step !== 'account') {
    // No progress yet, must start from consent
    redirect('/assessment')
  }

  const s = step as AssessmentStep
  const bar = <ProgressBar step={STEP_INDEX[s] ?? 0} total={14} />

  switch (s) {
    case 'account':
      return <>{bar}<AccountForm /></>
    case 'sleep-type':
      return <>{bar}<SleepTypeForm saved={{ age: row?.age, types: row?.sleep_problem_types }} /></>
    case 'sleep-nights':
      return <>{bar}<SleepNightsForm saved={row?.nights_per_week} /></>
    case 'sleep-duration':
      return <>{bar}<SleepDurationForm saved={row?.problem_duration} /></>
    case 'sleep-opportunity':
      return <>{bar}<SleepOpportunityForm saved={row?.adequate_opportunity} /></>
    case 'isi':
      return <>{bar}<ISIForm saved={row ? {
        q1: row.isi_q1, q2: row.isi_q2, q3: row.isi_q3, q4: row.isi_q4,
        q5: row.isi_q5, q6: row.isi_q6, q7: row.isi_q7,
      } : undefined} /></>
    case '2q':
      return <>{bar}<TwoQForm saved={{ q1: row?.q2_q1, q2: row?.q2_q2 }} /></>
    case '9q':
      return <>{bar}<NineQForm saved={row ? {
        q3: row.q9_q3_3, q4: row.q9_q3_4, q5: row.q9_q3_5,
        q6: row.q9_q3_6, q7: row.q9_q3_7, q8: row.q9_q3_8,
        q9: row.q9_q3_9, q10: row.q9_q3_10, q11: row.q9_q3_11,
      } : undefined} /></>
    case 'contraindications':
      return <>{bar}<ContraindicationsForm saved={row ? {
        bipolar: row.contraindication_bipolar,
        psychosis: row.contraindication_psychosis,
        epilepsy: row.contraindication_epilepsy,
        parasomnia: row.contraindication_parasomnia,
        machinery: row.contraindication_machinery,
      } : undefined} /></>
    case 'shift-work':
      return <>{bar}<ShiftWorkForm saved={row?.shift_work} /></>
    case 'pregnant':
      return <>{bar}<PregnantForm saved={row?.pregnant_postnatal} /></>
    case 'rls':
      return <>{bar}<RLSForm saved={row ? {
        q1: row.rls_q1, q2: row.rls_q2, q3: row.rls_q3, q4: row.rls_q4,
      } : undefined} /></>
    case 'stop-bang':
      return <>{bar}<StopBangForm saved={row ? {
        snore: row.stop_bang_snore, tired: row.stop_bang_tired,
        observed: row.stop_bang_observed, hypertension: row.hypertension,
        heightCm: row.height_cm, weightKg: row.weight_kg,
        neckIn: row.neck_circumference_in, sex: row.biological_sex,
        age: row.age,
      } : undefined} /></>
    case 'sleep-aids':
      return <>{bar}<SleepAidsForm saved={row ? {
        prescription: row.sleep_aid_prescription,
        otc: row.sleep_aid_otc,
        alcohol: row.sleep_aid_alcohol,
        supplement: row.sleep_aid_supplement,
      } : undefined} /></>
    default:
      notFound()
  }
}
