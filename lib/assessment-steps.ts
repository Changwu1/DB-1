import type { AssessmentStep } from './assessment'

const STEPS: readonly AssessmentStep[] = [
  'consent', 'account', 'sleep-type', 'sleep-nights', 'sleep-duration',
  'sleep-opportunity', 'isi', '2q', '9q', 'contraindications',
  'shift-work', 'pregnant', 'rls', 'stop-bang', 'sleep-aids',
]

export function isValidStep(s: string): s is AssessmentStep {
  return (STEPS as readonly string[]).includes(s)
}

/** Next step after completing `step`. Pass q2 answers for the 2q→9q branch. */
export function getNextStep(
  step: AssessmentStep,
  opts?: { q2Q1?: boolean | null; q2Q2?: boolean | null }
): AssessmentStep | 'complete' {
  if (step === '2q') {
    return (opts?.q2Q1 || opts?.q2Q2) ? '9q' : 'contraindications'
  }
  if (step === 'sleep-aids') return 'complete'
  const idx = STEPS.indexOf(step)
  if (idx < 0 || idx >= STEPS.length - 1) return 'complete'
  return STEPS[idx + 1]
}

/** First step the user hasn't completed, based on `last_completed_step` from DB. */
export function resumeFromStep(
  lastCompleted: AssessmentStep | null | undefined,
  opts?: { q2Q1?: boolean | null; q2Q2?: boolean | null }
): AssessmentStep | 'complete' {
  if (!lastCompleted) return 'consent'
  return getNextStep(lastCompleted, opts)
}
