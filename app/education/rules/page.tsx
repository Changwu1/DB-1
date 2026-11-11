import { loadEducationState } from '@/lib/education-db'
import { loadTargetWakeupTime } from '@/lib/diary-db'
import { nextUnconfirmedRule } from '@/lib/education'
import { redirect } from 'next/navigation'
import RulesForm from './_components/RulesForm'

interface Props {
  searchParams: Promise<{ rule?: string; readonly?: string }>
}

export default async function RulesPage({ searchParams }: Props) {
  const params = await searchParams
  const isReadOnly = params.readonly === '1'

  const eduState = await loadEducationState()
  const confirmedRules = eduState?.confirmed_rules ?? []

  if (isReadOnly) {
    // C4: read-only view — show the requested rule (default 1)
    const rule = Math.max(1, Math.min(6, parseInt(params.rule ?? '1', 10)))
    return (
      <main className="min-h-screen bg-white">
        <RulesForm
          currentRule={rule}
          confirmedCount={6}
          isReadOnly
        />
      </main>
    )
  }

  // C2/C3: confirmation flow
  if (eduState?.rules_accepted) {
    // All rules already confirmed — redirect to home (or read-only view)
    redirect('/')
  }

  const currentRule = nextUnconfirmedRule(confirmedRules) ?? 1
  const targetTime = await loadTargetWakeupTime()

  return (
    <main className="min-h-screen bg-white">
      <RulesForm
        currentRule={currentRule}
        confirmedCount={confirmedRules.length}
        existingTargetTime={targetTime}
      />
    </main>
  )
}
