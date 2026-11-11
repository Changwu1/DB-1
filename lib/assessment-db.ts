import { createClient } from '@/lib/supabase/server'
import type { AssessmentStep } from '@/lib/assessment'

/** Raw DB row from assessment_responses (snake_case column names). */
export interface AssessmentRow {
  id?: string
  user_id?: string
  consent?: boolean | null
  age?: number | null
  sleep_problem_types?: string[] | null
  nights_per_week?: number | null
  problem_duration?: string | null
  adequate_opportunity?: boolean | null
  isi_q1?: number | null; isi_q2?: number | null; isi_q3?: number | null; isi_q4?: number | null
  isi_q5?: number | null; isi_q6?: number | null; isi_q7?: number | null
  isi_score_start?: number | null; isi_score_end?: number | null
  q2_q1?: boolean | null; q2_q2?: boolean | null
  q9_q3_3?: number | null; q9_q3_4?: number | null; q9_q3_5?: number | null
  q9_q3_6?: number | null; q9_q3_7?: number | null; q9_q3_8?: number | null
  q9_q3_9?: number | null; q9_q3_10?: number | null; q9_q3_11?: number | null
  q9_total?: number | null
  contraindication_bipolar?: boolean | null
  contraindication_psychosis?: boolean | null
  contraindication_epilepsy?: boolean | null
  contraindication_parasomnia?: boolean | null
  contraindication_machinery?: boolean | null
  shift_work?: boolean | null
  pregnant_postnatal?: string | null
  rls_q1?: boolean | null; rls_q2?: boolean | null; rls_q3?: boolean | null; rls_q4?: boolean | null
  stop_bang_snore?: string | null; stop_bang_tired?: string | null; stop_bang_observed?: string | null
  hypertension?: boolean | null
  height_cm?: number | null; weight_kg?: number | null; bmi?: number | null
  neck_circumference_in?: number | null
  biological_sex?: string | null
  stop_bang_score?: number | null
  sleep_aid_prescription?: string | null; sleep_aid_otc?: string | null
  sleep_aid_alcohol?: string | null; sleep_aid_supplement?: string | null
  result?: string | null
  flags?: string[] | null
  last_completed_step?: AssessmentStep | null
  completed_at?: string | null
}

/** Load the current user's assessment row (null if not started). */
export async function loadAssessment(): Promise<AssessmentRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/** Upsert partial assessment fields and advance last_completed_step. */
export async function saveAssessmentStep(
  fields: Record<string, unknown>,
  step: AssessmentStep
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('assessment_responses')
    .upsert(
      { user_id: user.id, ...fields, last_completed_step: step },
      { onConflict: 'user_id' }
    )

  return { error: error?.message ?? null }
}

/** Save the final ISI score (isi_score_end) collected at programme end. */
export async function saveFinalISI(score: number): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('assessment_responses')
    .update({ isi_score_end: score })
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

/** Load initial and final ISI scores for comparison screen. */
export async function loadISIScores(): Promise<{ initial: number | null; final: number | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { initial: null, final: null }

  const { data } = await supabase
    .from('assessment_responses')
    .select('isi_score_start, isi_score_end')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    initial: data?.isi_score_start ?? null,
    final: data?.isi_score_end ?? null,
  }
}

/** Mark assessment complete with final result + scores. */
export async function completeAssessment(
  fields: Record<string, unknown>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('assessment_responses')
    .upsert(
      { user_id: user.id, ...fields, completed_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  return { error: error?.message ?? null }
}
