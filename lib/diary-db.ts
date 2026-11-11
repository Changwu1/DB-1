import { createClient } from '@/lib/supabase/server'

// ─── Row types (snake_case = DB column names per dict-transliteration.ts) ─────

export interface DiaryRow {
  id?: string
  user_id?: string
  night_date?: string        // 'YYYY-MM-DD' — วันที่ของคืน
  bedtime?: string           // 'HH:MM' — เวลาขึ้นเตียง
  lights_out?: string        // 'HH:MM' — เวลาปิดไฟ
  sleep_onset_min?: number   // เวลากว่าจะหลับ
  wakeup_count?: number      // จำนวนครั้งที่ตื่นกลางดึก
  wakeup_duration_min?: number // เวลาตื่นกลางดึกรวม
  final_wakeup?: string      // 'HH:MM' — เวลาตื่นครั้งสุดท้าย
  out_of_bed?: string        // 'HH:MM' — เวลาลุกจากเตียง
  sleep_quality?: number     // คุณภาพการนอน 1–5
  submitted_at?: string      // ISO timestamp — เวลาที่ส่งบันทึก
  is_backfill?: boolean      // กรอกย้อนหลัง
  time_in_bed_min?: number   // คำนวณ: เวลาบนเตียง
  sleep_time_min?: number    // คำนวณ: เวลาหลับจริง
  sleep_efficiency_pct?: number // คำนวณ: ประสิทธิภาพการนอน
  on_target_wakeup?: 'yes' | 'no' | 'not_counted' // คำนวณ: ลุกตรงเวลาเป้าหมาย
}

export interface ChecklistRow {
  id?: string
  user_id?: string
  week_number?: number
  days_morning_light?: number
  days_caffeine_near_bed?: number
  days_napped?: number
  days_exercised?: number
  days_alcohol_near_bed?: number
  days_heavy_meal_or_exercise?: number
  days_dim_light?: number
  days_screen_in_bed?: number
  clock_check_frequency?: 'never' | 'sometimes' | 'often'
  submitted_at?: string
}

export interface ProgrammeStartRow {
  id?: string
  user_id?: string
  started_at?: string // ISO timestamp — วันที่กดเริ่มสัปดาห์ที่ 1
}

// ─── Diary entries ────────────────────────────────────────────────────────────

/** Load the diary entry for a specific night date (D11). */
export async function loadDiaryEntry(nightDate: string): Promise<DiaryRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('night_date', nightDate)
    .maybeSingle()

  return data
}

/** Upsert a diary entry (D11: one entry per night_date per user). */
export async function saveDiaryEntry(
  row: Omit<DiaryRow, 'id' | 'user_id'>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('diary_entries')
    .upsert(
      { user_id: user.id, ...row },
      { onConflict: 'user_id,night_date' }
    )

  return { error: error?.message ?? null }
}

/**
 * Load diary entries for a programme week (1-indexed).
 * Week 1 = programme days 1–7, Week 2 = days 8–14, etc.
 * Entries are keyed by night_date per §5.3.
 */
export async function loadWeekEntries(
  programmeStartDate: string,
  weekNumber: number
): Promise<DiaryRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const start = new Date(programmeStartDate)
  const weekStart = new Date(start)
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('night_date', fmt(weekStart))
    .lte('night_date', fmt(weekEnd))
    .order('night_date')

  return data ?? []
}

// ─── Weekly checklist ─────────────────────────────────────────────────────────

/** Load the checklist for a specific programme week (1-indexed). */
export async function loadChecklist(weekNumber: number): Promise<ChecklistRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('weekly_checklists')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_number', weekNumber)
    .maybeSingle()

  return data
}

/** Upsert the weekly checklist (W2: one record per week, no overwrite of prev weeks). */
export async function saveChecklist(
  weekNumber: number,
  fields: Omit<ChecklistRow, 'id' | 'user_id' | 'week_number'>
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('weekly_checklists')
    .upsert(
      { user_id: user.id, week_number: weekNumber, ...fields },
      { onConflict: 'user_id,week_number' }
    )

  return { error: error?.message ?? null }
}

// ─── Programme start ──────────────────────────────────────────────────────────

/** Load the programme start record (null if user hasn't started yet). */
export async function loadProgrammeStart(): Promise<ProgrammeStartRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('programme_starts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/** Record programme start (called when user clicks "เริ่มสัปดาห์ที่ 1"). */
export async function startProgramme(
  startedAt: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('programme_starts')
    .insert({ user_id: user.id, started_at: startedAt })

  return { error: error?.message ?? null }
}

// ─── Lesson settings ──────────────────────────────────────────────────────────

/** Save the target wakeup time (HH:MM) chosen during rules confirmation (D6). */
export async function saveTargetWakeupTime(
  targetWakeupTime: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not-authenticated' }

  const { error } = await supabase
    .from('lesson_settings')
    .upsert({ user_id: user.id, target_wakeup_time: targetWakeupTime }, { onConflict: 'user_id' })

  return { error: error?.message ?? null }
}

/** Load the target wakeup time (HH:MM) or null if not yet set (D6). */
export async function loadTargetWakeupTime(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('lesson_settings')
    .select('target_wakeup_time')
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.target_wakeup_time ?? null
}
