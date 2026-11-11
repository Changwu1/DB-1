'use server'

import { redirect } from 'next/navigation'
import { getNowServer } from '@/lib/time'
import { loadProgrammeStart, startProgramme } from '@/lib/diary-db'

/** Called when user clicks "เริ่มสัปดาห์ที่ 1" on GO result page. */
export async function beginProgramme(): Promise<void> {
  const existing = await loadProgrammeStart()
  if (!existing) {
    const now = await getNowServer()
    await startProgramme(now.toISOString())
  }
  redirect('/diary')
}
