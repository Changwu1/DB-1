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

  switch (s) {
    case 'account':
      return <AccountForm />
    case 'sleep-type':
      return <SleepTypeForm saved={{ age: row?.age, types: row?.sleep_problem_types }} />
    case 'sleep-nights':
      return <SleepNightsForm saved={row?.nights_per_week} />
    case 'sleep-duration':
      return <SleepDurationForm saved={row?.problem_duration} />
    case 'sleep-opportunity':
      return <SleepOpportunityForm saved={row?.adequate_opportunity} />
    case 'isi':
      return <ISIForm saved={row ? {
        q1: row.isi_q1, q2: row.isi_q2, q3: row.isi_q3, q4: row.isi_q4,
        q5: row.isi_q5, q6: row.isi_q6, q7: row.isi_q7,
      } : undefined} />
    case '2q':
      return <TwoQForm saved={{ q1: row?.q2_q1, q2: row?.q2_q2 }} />
    case '9q':
      return <NineQForm saved={row ? {
        q3: row.q9_q3_3, q4: row.q9_q3_4, q5: row.q9_q3_5,
        q6: row.q9_q3_6, q7: row.q9_q3_7, q8: row.q9_q3_8,
        q9: row.q9_q3_9, q10: row.q9_q3_10, q11: row.q9_q3_11,
      } : undefined} />
    case 'contraindications':
      return <ContraindicationsForm saved={row ? {
        bipolar: row.contraindication_bipolar,
        psychosis: row.contraindication_psychosis,
        epilepsy: row.contraindication_epilepsy,
        parasomnia: row.contraindication_parasomnia,
        machinery: row.contraindication_machinery,
      } : undefined} />
    case 'shift-work':
      return <ShiftWorkForm saved={row?.shift_work} />
    case 'pregnant':
      return <PregnantForm saved={row?.pregnant_postnatal} />
    case 'rls':
      return <RLSForm saved={row ? {
        q1: row.rls_q1, q2: row.rls_q2, q3: row.rls_q3, q4: row.rls_q4,
      } : undefined} />
    case 'stop-bang':
      return <StopBangForm saved={row ? {
        snore: row.stop_bang_snore, tired: row.stop_bang_tired,
        observed: row.stop_bang_observed, hypertension: row.hypertension,
        heightCm: row.height_cm, weightKg: row.weight_kg,
        neckIn: row.neck_circumference_in, sex: row.biological_sex,
        age: row.age,
      } : undefined} />
    case 'sleep-aids':
      return <SleepAidsForm saved={row ? {
        prescription: row.sleep_aid_prescription,
        otc: row.sleep_aid_otc,
        alcohol: row.sleep_aid_alcohol,
        supplement: row.sleep_aid_supplement,
      } : undefined} />
    default:
      notFound()
  }
}
