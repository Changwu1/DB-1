import { createClient } from '@/lib/supabase/server'
import type { MythState } from '@/lib/education'

// ─── Row type ─────────────────────────────────────────────────────────────────

export interface EducationStateRow {
  id?: string
  user_id?: string
  rules_accepted?: boolean
  confirmed_rules?: number[]   // e.g. [1, 2, 3]
  last_card_tab1?: number | null
  last_card_tab2?: number | null
  myth_order?: number[]
  myth_today?: number | null
  myth_shown_date?: string | null  // 'YYYY-MM-DD'
  myth_hidden_today?: boolean
  last_myth_number?: number | null
}

// ─── Load / save ──────────────────────────────────────────────────────────────

/** Load the current user's education state row (null if not started). */
export async function loadEducationState(): Promise<EducationStateRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('education_state')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/** Upsert partial education state fields. */
export async function saveEducationState(
  fields: Partial<Omit<EducationStateRow, 'id' | 'user_id'>>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('education_state')
    .upsert({ user_id: user.id, ...fields }, { onConflict: 'user_id' })

  return { error: error?.message ?? null }
}

// ─── Myth helpers ─────────────────────────────────────────────────────────────

/** Convert a DB row into the MythState shape used by pickMythOfDay. */
export function rowToMythState(row: EducationStateRow | null): MythState {
  return {
    mythOrder: row?.myth_order ?? [],
    mythToday: row?.myth_today ?? null,
    mythShownDate: row?.myth_shown_date ?? null,
    mythHiddenToday: row?.myth_hidden_today ?? false,
    lastMythNumber: row?.last_myth_number ?? null,
  }
}

/** Persist the myth state returned by pickMythOfDay. */
export async function saveMythState(
  state: MythState
): Promise<{ error: string | null }> {
  return saveEducationState({
    myth_order: state.mythOrder,
    myth_today: state.mythToday,
    myth_shown_date: state.mythShownDate,
    myth_hidden_today: state.mythHiddenToday,
    last_myth_number: state.lastMythNumber,
  })
}

/** Mark today's myth as dismissed (D4). */
export async function dismissMyth(): Promise<{ error: string | null }> {
  return saveEducationState({ myth_hidden_today: true })
}

// ─── Rules helpers ────────────────────────────────────────────────────────────

/** Add a rule to the confirmed list (C2). Does nothing if already confirmed. */
export async function confirmRule(
  ruleNumber: number,
  current: EducationStateRow | null
): Promise<{ error: string | null }> {
  const confirmed = current?.confirmed_rules ?? []
  if (confirmed.includes(ruleNumber)) return { error: null }
  return saveEducationState({ confirmed_rules: [...confirmed, ruleNumber] })
}

/** Mark all rules accepted (C2: after all 6 confirmed). */
export async function acceptAllRules(): Promise<{ error: string | null }> {
  return saveEducationState({ rules_accepted: true })
}

/** Save last-read card position per tab (A3). */
export async function saveLastCard(
  tab: 1 | 2,
  card: number
): Promise<{ error: string | null }> {
  return saveEducationState(tab === 1 ? { last_card_tab1: card } : { last_card_tab2: card })
}
