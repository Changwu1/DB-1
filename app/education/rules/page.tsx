export const instant = false

import Link from 'next/link'
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

  const backLink = (
    <div className="px-4 pt-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500">
        ← กลับหน้าหลัก
      </Link>
    </div>
  )

  if (isReadOnly) {
    const section = Math.max(1, Math.min(totalSections, parseInt(params.section ?? '1', 10)))
    return (
      <main className="min-h-screen bg-white">
        {backLink}
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
      {backLink}
      <RulesForm
        currentSection={currentSection}
        existingTargetTime={targetTime}
      />
    </main>
  )
}
