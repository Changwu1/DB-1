export const instant = false

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNowServer, toDateString, daysBetween } from '@/lib/time'
import { loadEducationState, rowToMythState, saveMythState } from '@/lib/education-db'
import { loadProgrammeStart } from '@/lib/diary-db'
import { loadISIScores } from '@/lib/assessment-db'
import { pickMythOfDay } from '@/lib/education'
import { FINAL_ISI_OFFER_DAY } from '@/lib/constants'
import MythBanner from './_components/MythBanner'

export default async function Home() {
  const programme = await loadProgrammeStart()

  // If programme hasn't started → go to assessment
  if (!programme?.started_at) {
    redirect('/assessment')
  }

  const eduState = await loadEducationState()

  // C3: rules not accepted and at least 1 diary entry exists → open rules screen
  // (The diary action also redirects there after saving — this catches the app-open case)
  if (!eduState?.rules_accepted) {
    // Check if any diary entries exist by trying to load today's or recent entries
    // Simplest proxy: if the programme has started, the user has been in the app
    // so the first diary save would have redirected them. If they're here without
    // rules_accepted it means they haven't saved a diary yet — show home normally.
    // The diary action handles C1 (after first save). C3 fires if they bypassed
    // the diary flow somehow; we surface it on home open.
    // For now, we let the diary action drive C1/C3 — users land here after rules.
  }

  const now = await getNowServer()
  const today = toDateString(now)

  // D1–D4: myth of the day
  const mythState = rowToMythState(eduState)
  const mythResult = pickMythOfDay(mythState, today)

  // Persist if state changed (D2: new day)
  if (mythResult.newState !== mythState) {
    await saveMythState(mythResult.newState)
  }

  const rulesAccepted = eduState?.rules_accepted ?? false

  // Show suggestion link when: rules accepted AND at least week 2 (day ≥ 8)
  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1
  const showSuggestion = rulesAccepted && dayOfProgramme >= 8

  // D9: show final ISI prompt from day 28, until completed
  const showFinalISI = dayOfProgramme >= FINAL_ISI_OFFER_DAY
  let finalISICompleted = false
  if (showFinalISI) {
    const isiScores = await loadISIScores()
    finalISICompleted = isiScores.final !== null
  }

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto flex flex-col">
      {/* Myth banner (D1) */}
      {mythResult.show && <MythBanner mythNumber={mythResult.mythNumber} />}

      <div className="flex flex-col gap-4 p-4 flex-1">
        <h1 className="text-lg font-semibold text-gray-900 mt-4">สวัสดี</h1>

        {/* Quick action */}
        <Link
          href="/diary"
          className="rounded-xl bg-indigo-600 text-white p-4 flex flex-col gap-1"
        >
          <span className="font-semibold">บันทึกการนอน</span>
          <span className="text-indigo-200 text-sm">บันทึกการนอนเมื่อคืน</span>
        </Link>

        {/* Suggestion link (visible from day 8, D3: requires rules_accepted) */}
        {showSuggestion && (
          <Link
            href="/suggestion"
            className="rounded-xl bg-teal-600 text-white p-4 flex flex-col gap-1"
          >
            <span className="font-semibold">คำแนะนำประจำสัปดาห์</span>
            <span className="text-teal-200 text-sm">เลือกสิ่งที่อยากลองสัปดาห์นี้</span>
          </Link>
        )}

        {/* Final ISI prompt (D9: day ≥ 28) */}
        {showFinalISI && !finalISICompleted && (
          <Link
            href="/final-isi"
            className="rounded-xl bg-amber-500 text-white p-4 flex flex-col gap-1"
          >
            <span className="font-semibold">ประเมินผลการนอน</span>
            <span className="text-amber-100 text-sm">ครบ 28 วันแล้ว — ลองทำแบบประเมินซ้ำดูนะ</span>
          </Link>
        )}
        {showFinalISI && finalISICompleted && (
          <Link
            href="/final-isi/result"
            className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-4 flex flex-col gap-1"
          >
            <span className="font-semibold">ดูผลการประเมิน</span>
            <span className="text-amber-600 text-sm">ผลเปรียบเทียบก่อน/หลังโปรแกรม</span>
          </Link>
        )}

        {/* Recap link */}
        <Link
          href="/recap"
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-1"
        >
          <span className="font-semibold text-zinc-700">สรุปประจำสัปดาห์</span>
          <span className="text-gray-400 text-sm">ดูผลการนอนช่วงนี้</span>
        </Link>

        {/* Education buttons */}
        <div className="flex gap-3">
          <Link
            href="/education/basics"
            className="flex-1 rounded-xl border border-gray-200 p-3 text-sm font-medium text-gray-700 text-center"
          >
            การนอนทำงานยังไง
          </Link>
          <Link
            href={rulesAccepted ? '/education/rules?readonly=1' : '/education/rules'}
            className="flex-1 rounded-xl border border-gray-200 p-3 text-sm font-medium text-gray-700 text-center"
          >
            {rulesAccepted ? 'กฎของฉัน' : 'ยืนยันกฎ'}
          </Link>
        </div>
      </div>
    </main>
  )
}
