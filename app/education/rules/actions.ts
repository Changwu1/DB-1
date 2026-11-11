'use server'

import { redirect } from 'next/navigation'
import { loadEducationState, confirmRule, acceptAllRules } from '@/lib/education-db'
import { saveTargetWakeupTime } from '@/lib/diary-db'
import { nextUnconfirmedRule } from '@/lib/education'

export async function confirmRuleAction(
  _prev: { error?: string } | null,
  fd: FormData
): Promise<{ error?: string } | null> {
  const ruleNumber = parseInt(fd.get('rule_number') as string, 10)
  const targetWakeupTime = (fd.get('target_wakeup_time') as string | null)?.trim() || null

  if (!ruleNumber || ruleNumber < 1 || ruleNumber > 6) {
    return { error: 'ข้อมูลไม่ถูกต้อง' }
  }

  // D6: rule 1 confirmation saves the target wakeup time
  if (ruleNumber === 1) {
    if (!targetWakeupTime) return { error: 'กรุณาเลือกเวลาตื่นเป้าหมาย' }
    await saveTargetWakeupTime(targetWakeupTime)
  }

  const current = await loadEducationState()
  await confirmRule(ruleNumber, current)

  const updatedConfirmed = [...(current?.confirmed_rules ?? []), ruleNumber]
  const next = nextUnconfirmedRule(updatedConfirmed)

  if (next === null) {
    // All 6 confirmed → C2: set rules_accepted = yes
    await acceptAllRules()
    redirect('/')
  }

  // Stay on rules page — it will re-render with the next rule
  redirect('/education/rules')
}
