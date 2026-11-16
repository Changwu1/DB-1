export const instant = false

import { redirect } from 'next/navigation'
import { loadAssessment } from '@/lib/assessment-db'
import { resumeFromStep } from '@/lib/assessment-steps'
import ConsentForm from './_components/ConsentForm'
import ProgressBar from './_components/ProgressBar'

export default async function AssessmentPage() {
  const row = await loadAssessment()

  if (row?.completed_at) {
    redirect('/assessment/result')
  }

  if (row?.last_completed_step) {
    const next = resumeFromStep(row.last_completed_step, {
      q2Q1: row.q2_q1,
      q2Q2: row.q2_q2,
    })
    if (next === 'complete') redirect('/assessment/result')
    redirect(`/assessment/${next}`)
  }

  return (
    <>
      <ProgressBar step={0} total={14} />
      <ConsentForm />
    </>
  )
}
