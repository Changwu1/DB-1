export const instant = false

import Link from 'next/link'
import { loadProgrammeStart, loadChecklist } from '@/lib/diary-db'
import { getNowServer, daysBetween } from '@/lib/time'
import { notFound } from 'next/navigation'
import ChecklistForm from './_components/ChecklistForm'

export default async function ChecklistPage() {
  const programme = await loadProgrammeStart()
  if (!programme?.started_at) notFound()

  const now = await getNowServer()
  const start = new Date(programme.started_at)
  const dayOfProgramme = daysBetween(start, now) + 1 // 1-indexed
  const weekNumber = Math.ceil(dayOfProgramme / 7)

  // W1: only show on days 7, 14, 21, 28
  const isDue = dayOfProgramme > 0 && dayOfProgramme % 7 === 0
  if (!isDue) notFound()

  const prefill = await loadChecklist(weekNumber)

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto">
      <div className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500">
          ← กลับหน้าหลัก
        </Link>
      </div>
      <ChecklistForm weekNumber={weekNumber} prefill={prefill} />
    </main>
  )
}
