export const instant = false

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNowServer, toDateString, daysBetween } from '@/lib/time'
import { loadProgrammeStart } from '@/lib/diary-db'
import { loadISIScores } from '@/lib/assessment-db'
import { FINAL_ISI_OFFER_DAY } from '@/lib/constants'
import FinalISIForm from './_components/FinalISIForm'

export default async function FinalISIPage() {
  const programme = await loadProgrammeStart()
  if (!programme?.started_at) redirect('/')

  const now = await getNowServer()
  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1

  // D9: offer only from day 28 onwards
  if (dayOfProgramme < FINAL_ISI_OFFER_DAY) {
    return (
      <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-lg font-semibold text-gray-900">ประเมินผล</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          การประเมินผลจะพร้อมหลังจากเข้าร่วมโปรแกรมครบ 28 วัน
        </p>
        <Link href="/" className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm">
          กลับหน้าหลัก
        </Link>
      </main>
    )
  }

  const scores = await loadISIScores()

  // Already completed → show result
  if (scores.final !== null) {
    redirect('/final-isi/result')
  }

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto flex flex-col">
      <div className="p-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
      </div>
      <FinalISIForm />
    </main>
  )
}
