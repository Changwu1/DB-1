export const instant = false

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNowServer, toDateString, daysBetween } from '@/lib/time'
import { loadProgrammeStart } from '@/lib/diary-db'
import { loadEducationState } from '@/lib/education-db'
import {
  loadSuggestionState,
  loadSuggestionInput,
  saveSuggestionState,
  type SuggestionRenderStats,
} from '@/lib/suggestion-db'
import { calcSuggestions } from '@/lib/suggestion'
import SuggestionPicker from './_components/SuggestionPicker'

export default async function SuggestionPage() {
  const [programme, eduState] = await Promise.all([
    loadProgrammeStart(),
    loadEducationState(),
  ])

  if (!programme?.started_at) redirect('/')

  // D3: locked until all rules accepted
  if (!eduState?.rules_accepted) redirect('/education/rules')

  const now = await getNowServer()
  const today = toDateString(now)
  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1

  // evaluationWeek = number of completed weeks (0 = not ready yet)
  // Week 1 completes on day 7, so eval starts on day 8 (evaluationWeek=1)
  const evaluationWeek = Math.floor((dayOfProgramme - 1) / 7)

  if (evaluationWeek === 0) {
    return (
      <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-lg font-semibold text-gray-900">คำแนะนำประจำสัปดาห์</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          คำแนะนำจะพร้อมหลังจากบันทึกการนอนครบ 7 คืนแรกแล้ว บันทึกต่อไปนะ
        </p>
        <Link href="/" className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm">
          กลับหน้าหลัก
        </Link>
      </main>
    )
  }

  // Load existing state to check if already computed for this evaluation week
  const existingState = await loadSuggestionState()
  const isNewWeek = !existingState?.eval_week_number || existingState.eval_week_number !== evaluationWeek

  let renderStats: SuggestionRenderStats
  let status: 'F1' | 'F2' | 'suggestions'
  let topThree: string[]
  let safetyFlags: string[]
  let s2AddScreen: boolean
  let s2AddClock: boolean
  let alreadySelected: string[]

  if (isNewWeek) {
    // Compute fresh queue for this evaluation week
    const input = await loadSuggestionInput(startDate, evaluationWeek, today)

    if (!input) {
      // Can't load input (data issue)
      status = 'F1'
      topThree = []
      safetyFlags = []
      s2AddScreen = false
      s2AddClock = false
      alreadySelected = []
      renderStats = { outOfBedRangeMins: 0, avgSleepOnsetMins: 0, caffeineNearBedDays: 0, alcoholNearBedDays: 0, dimLightsDays: 0, exerciseDays: 0 }
    } else {
      const result = calcSuggestions(input)
      status = result.status
      topThree = result.topThree
      safetyFlags = result.safetyFlags
      s2AddScreen = result.s2AddScreen
      s2AddClock = result.s2AddClock
      alreadySelected = []
      renderStats = input.renderStats

      // Persist to DB for subsequent page loads this week
      await saveSuggestionState({
        eval_week_number: evaluationWeek,
        queue: result.queue,
        top_three: topThree,
        safety_flags: safetyFlags,
        s2_add_screen: s2AddScreen,
        s2_add_clock: s2AddClock,
        status,
        selected: null,
        teach_started_at: null,
        out_of_bed_range_mins: renderStats.outOfBedRangeMins,
        avg_sleep_onset_mins: renderStats.avgSleepOnsetMins,
        caffeine_near_bed_days: renderStats.caffeineNearBedDays,
        alcohol_near_bed_days: renderStats.alcoholNearBedDays,
        dim_lights_days: renderStats.dimLightsDays,
        exercise_days: renderStats.exerciseDays,
      })
    }
  } else {
    // Load from persisted state
    status = existingState!.status ?? 'F1'
    topThree = existingState!.top_three ?? []
    safetyFlags = existingState!.safety_flags ?? []
    s2AddScreen = existingState!.s2_add_screen ?? false
    s2AddClock = existingState!.s2_add_clock ?? false
    alreadySelected = existingState!.selected ?? []
    renderStats = {
      outOfBedRangeMins: existingState!.out_of_bed_range_mins ?? 0,
      avgSleepOnsetMins: existingState!.avg_sleep_onset_mins ?? 0,
      caffeineNearBedDays: existingState!.caffeine_near_bed_days ?? 0,
      alcoholNearBedDays: existingState!.alcohol_near_bed_days ?? 0,
      dimLightsDays: existingState!.dim_lights_days ?? 0,
      exerciseDays: existingState!.exercise_days ?? 0,
    }
  }

  // F1: not enough nights
  if (status === 'F1') {
    return (
      <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-lg font-semibold text-gray-900">คำแนะนำประจำสัปดาห์</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          ตอนนี้ข้อมูลการนอนยังมีไม่พอให้แนะนำได้แม่น ลองบันทึกต่ออีกไม่กี่คืนนะ คืนที่ลืมไม่เป็นไร
        </p>
        <Link href="/diary" className="rounded-xl bg-indigo-600 text-white py-3 text-center font-semibold text-sm">
          บันทึกการนอน
        </Link>
      </main>
    )
  }

  // F2: no conditions met (and no safety flags)
  if (status === 'F2' && safetyFlags.length === 0) {
    return (
      <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-lg font-semibold text-gray-900">คำแนะนำประจำสัปดาห์</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          ช่วงนี้รูปแบบการนอนของคุณค่อนข้างสม่ำเสมอ ยังไม่มีอะไรที่ต้องปรับเพิ่ม บันทึกต่อไปเรื่อยๆ ก็พอ
        </p>
        <Link href="/" className="rounded-xl border border-gray-300 text-gray-700 py-3 text-center font-semibold text-sm">
          กลับหน้าหลัก
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto flex flex-col">
      <div className="flex flex-col gap-4 p-4">
        <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
        <h1 className="text-lg font-semibold text-gray-900">เลือกสิ่งที่อยากลอง</h1>

        {topThree.length > 0 && (
          <p className="text-sm text-gray-600">
            จากบันทึกของคุณ เราเห็นหลายเรื่องที่ปรับได้ เลือก 1–2 ข้อที่รู้สึกทำได้ ค่อยๆ เปลี่ยนทีละนิดก็พอ
          </p>
        )}

        {/* F2 with safety flags: show only safety, no F2 message */}
        <SuggestionPicker
          topThree={topThree}
          safetyFlags={safetyFlags}
          s2AddScreen={s2AddScreen}
          s2AddClock={s2AddClock}
          stats={renderStats}
          weekNumber={evaluationWeek}
          alreadySelected={alreadySelected}
        />
      </div>
    </main>
  )
}
