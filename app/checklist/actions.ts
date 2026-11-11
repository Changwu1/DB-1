'use server'

import { redirect } from 'next/navigation'
import { getNowServer } from '@/lib/time'
import { saveChecklist } from '@/lib/diary-db'

function intField(fd: FormData, name: string): number | null {
  const v = fd.get(name)
  if (v === null || v === '') return null
  const n = parseInt(String(v), 10)
  return isNaN(n) ? null : n
}

export type ChecklistActionState =
  | null
  | { status: 'missing'; missingCount: number }
  | { status: 'save_error'; message: string }

export async function submitChecklist(
  _prev: ChecklistActionState,
  fd: FormData
): Promise<ChecklistActionState> {
  const weekNumber = intField(fd, 'week_number')
  if (!weekNumber) return { status: 'save_error', message: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้งนะ' }

  const dayFields = [
    'days_morning_light', 'days_caffeine_near_bed', 'days_napped', 'days_exercised',
    'days_alcohol_near_bed', 'days_heavy_meal_or_exercise', 'days_dim_light', 'days_screen_in_bed',
  ]

  const dayValues: Record<string, number | null> = {}
  for (const f of dayFields) {
    dayValues[f] = intField(fd, f)
  }

  const clockCheck = fd.get('clock_check_frequency') as 'never' | 'sometimes' | 'often' | null

  // W2: all 9 fields required
  const missingCount = dayFields.filter(f => dayValues[f] === null).length + (clockCheck ? 0 : 1)
  if (missingCount > 0) {
    return { status: 'missing', missingCount }
  }

  const now = await getNowServer()

  const { error } = await saveChecklist(weekNumber, {
    days_morning_light: dayValues.days_morning_light!,
    days_caffeine_near_bed: dayValues.days_caffeine_near_bed!,
    days_napped: dayValues.days_napped!,
    days_exercised: dayValues.days_exercised!,
    days_alcohol_near_bed: dayValues.days_alcohol_near_bed!,
    days_heavy_meal_or_exercise: dayValues.days_heavy_meal_or_exercise!,
    days_dim_light: dayValues.days_dim_light!,
    days_screen_in_bed: dayValues.days_screen_in_bed!,
    clock_check_frequency: clockCheck!,
    submitted_at: now.toISOString(),
  })

  if (error) {
    return { status: 'save_error', message: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้งนะ' }
  }

  redirect('/checklist/done')
}
