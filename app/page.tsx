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
import { Moon, BarChart2, Lightbulb, BookOpen, CheckSquare, ClipboardList } from 'lucide-react'

export default async function Home() {
  const programme = await loadProgrammeStart()

  if (!programme?.started_at) {
    redirect('/assessment')
  }

  const eduState = await loadEducationState()

  const now = await getNowServer()
  const today = toDateString(now)

  // D1–D4: myth of the day
  const mythState = rowToMythState(eduState)
  const mythResult = pickMythOfDay(mythState, today)

  if (mythResult.newState !== mythState) {
    await saveMythState(mythResult.newState)
  }

  const rulesAccepted = eduState?.rules_accepted ?? false

  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1
  const weekNumber = Math.ceil(dayOfProgramme / 7)
  const showSuggestion = rulesAccepted && dayOfProgramme >= 8

  // D9: show final ISI prompt from day 28
  const showFinalISI = dayOfProgramme >= FINAL_ISI_OFFER_DAY
  let finalISICompleted = false
  if (showFinalISI) {
    const isiScores = await loadISIScores()
    finalISICompleted = isiScores.final !== null
  }

  return (
    <main className="flex flex-col flex-1">
      {/* Myth banner */}
      {mythResult.show && <MythBanner mythNumber={mythResult.mythNumber} />}

      <div className="flex flex-col gap-4 p-4 flex-1">
        {/* Greeting */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">สวัสดี</h1>
            <p className="text-sm text-stone-500">สัปดาห์ที่ {weekNumber} ของโปรแกรม</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Moon className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Primary action — diary */}
        <Link
          href="/diary"
          className="rounded-2xl bg-indigo-600 text-white p-5 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base">บันทึกการนอน</span>
            <span className="text-indigo-200 text-sm">บันทึกการนอนเมื่อคืน</span>
          </div>
        </Link>

        {/* Suggestion (day ≥ 8) */}
        {showSuggestion && (
          <Link
            href="/suggestion"
            className="rounded-2xl bg-teal-600 text-white p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base">คำแนะนำประจำสัปดาห์</span>
              <span className="text-teal-200 text-sm">เลือกสิ่งที่อยากลองสัปดาห์นี้</span>
            </div>
          </Link>
        )}

        {/* Final ISI (day ≥ 28) */}
        {showFinalISI && !finalISICompleted && (
          <Link
            href="/final-isi"
            className="rounded-2xl bg-amber-500 text-white p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base">ประเมินผลการนอน</span>
              <span className="text-amber-100 text-sm">ครบ 28 วันแล้ว — ลองทำแบบประเมินซ้ำดูนะ</span>
            </div>
          </Link>
        )}
        {showFinalISI && finalISICompleted && (
          <Link
            href="/final-isi/result"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-amber-900">ดูผลการประเมิน</span>
              <span className="text-amber-600 text-sm">ผลเปรียบเทียบก่อน/หลังโปรแกรม</span>
            </div>
          </Link>
        )}

        {/* Recap */}
        <Link
          href="/recap"
          className="rounded-2xl border border-stone-200 bg-white p-5 flex items-center gap-4"
        >
          <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-stone-800">สรุปประจำสัปดาห์</span>
            <span className="text-stone-400 text-sm">ดูผลการนอนช่วงนี้</span>
          </div>
        </Link>

        {/* Education row */}
        <div className="flex gap-3">
          <Link
            href="/education/basics"
            className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 flex flex-col items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-stone-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-stone-700 text-center">การนอน<br />ทำงานยังไง</span>
          </Link>
          <Link
            href={rulesAccepted ? '/education/rules?readonly=1' : '/education/rules'}
            className="flex-1 rounded-2xl border border-stone-200 bg-white p-4 flex flex-col items-center gap-2"
          >
            <CheckSquare className="w-5 h-5 text-stone-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-stone-700 text-center">
              {rulesAccepted ? 'กฎของฉัน' : 'ยืนยันกฎ'}
            </span>
          </Link>
        </div>
      </div>
    </main>
  )
}
