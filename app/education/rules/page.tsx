export const instant = false

import { loadEducationState } from '@/lib/education-db'
import { loadTargetWakeupTime } from '@/lib/diary-db'
import { nextUnconfirmedSection, RULE_SECTIONS } from '@/lib/education'
import { redirect } from 'next/navigation'
import RulesForm from './_components/RulesForm'

interface Props {
  searchParams: Promise<{ section?: string; readonly?: string }>
}

export default async function RulesPage({ searchParams }: Props) {
  const params = await searchParams
  const isReadOnly = params.readonly === '1'
  const totalSections = RULE_SECTIONS.length

  const eduState = await loadEducationState()
  const confirmedRules = eduState?.confirmed_rules ?? []

  if (isReadOnly) {
    const section = Math.max(1, Math.min(totalSections, parseInt(params.section ?? '1', 10)))
    return (
      <main className="min-h-screen bg-white">
        <RulesForm currentSection={section} isReadOnly />
      </main>
    )
  }

  if (eduState?.rules_accepted) {
    redirect('/')
  }

  const currentSection = nextUnconfirmedSection(confirmedRules) ?? 1
  const targetTime = await loadTargetWakeupTime()

  return (
    <main className="min-h-screen bg-white">
      <RulesForm
        currentSection={currentSection}
        existingTargetTime={targetTime}
      />
    </main>
  )
}
