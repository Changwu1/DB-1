'use server'

import { redirect } from 'next/navigation'
import { loadEducationState, saveEducationState, acceptAllRules } from '@/lib/education-db'
import { saveTargetWakeupTime } from '@/lib/diary-db'
import { RULE_SECTIONS } from '@/lib/education'

export async function confirmSectionAction(
  _prev: { error?: string } | null,
  fd: FormData
): Promise<{ error?: string } | null> {
  const sectionId = parseInt(fd.get('section_id') as string, 10)
  const section = RULE_SECTIONS.find(s => s.id === sectionId)
  if (!section) return { error: 'ข้อมูลไม่ถูกต้อง' }

  // D6: rule 1 is in section 1 — save target wakeup time
  if ((section.ruleNumbers as readonly number[]).includes(1)) {
    const targetWakeupTime = (fd.get('target_wakeup_time') as string | null)?.trim() || null
    if (!targetWakeupTime) return { error: 'กรุณาเลือกเวลาตื่นเป้าหมาย' }
    await saveTargetWakeupTime(targetWakeupTime)
  }

  const current = await loadEducationState()
  const existing = current?.confirmed_rules ?? []
  const updated = [...new Set([...existing, ...section.ruleNumbers])]

  await saveEducationState({ confirmed_rules: updated })

  if (updated.length >= 6) {
    await acceptAllRules()
    redirect('/')
  }

  redirect('/education/rules')
}
