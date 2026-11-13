'use server'

import { redirect } from 'next/navigation'
import { getNowServer } from '@/lib/time'
import { loadProgrammeStart, startProgramme } from '@/lib/diary-db'
import { createClient } from '@/lib/supabase/server'

/** Called when user clicks "เริ่มสัปดาห์ที่ 1" on GO result page. */
export async function beginProgramme(): Promise<void> {
  const existing = await loadProgrammeStart()
  if (!existing) {
    const now = await getNowServer()
    await startProgramme(now.toISOString())
  }
  redirect('/diary')
}

/** Called when a NOT-FIT or REFER user chooses to try the programme anyway. */
export async function optInAndBegin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('assessment_responses')
    .update({ opted_in: true })
    .eq('user_id', user.id)

  const existing = await loadProgrammeStart()
  if (!existing) {
    const now = await getNowServer()
    await startProgramme(now.toISOString())
  }
  redirect('/')
}
