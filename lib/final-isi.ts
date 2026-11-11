import {
  FINAL_ISI_SIGNIFICANT_CHANGE,
  ISI_SEVERITY_NONE_MAX,
  ISI_SEVERITY_SUBTHRESHOLD_MAX,
  ISI_SEVERITY_MODERATE_MAX,
} from '@/lib/constants'

export type ISISeverity = 'none' | 'subthreshold' | 'moderate' | 'severe'

export interface ISIChangeResult {
  initialScore: number
  finalScore: number
  diff: number
  initialSeverity: ISISeverity
  finalSeverity: ISISeverity
  clinicallySignificant: boolean
}

export function calcISIInterpretation(score: number): ISISeverity {
  if (score <= ISI_SEVERITY_NONE_MAX) return 'none'
  if (score <= ISI_SEVERITY_SUBTHRESHOLD_MAX) return 'subthreshold'
  if (score <= ISI_SEVERITY_MODERATE_MAX) return 'moderate'
  return 'severe'
}

export function calcISIChange(initialScore: number, finalScore: number): ISIChangeResult {
  const diff = finalScore - initialScore
  return {
    initialScore,
    finalScore,
    diff,
    initialSeverity: calcISIInterpretation(initialScore),
    finalSeverity: calcISIInterpretation(finalScore),
    clinicallySignificant: diff <= -FINAL_ISI_SIGNIFICANT_CHANGE,
  }
}
