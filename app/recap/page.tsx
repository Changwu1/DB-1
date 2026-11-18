export const instant = false

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNowServer, toDateString, daysBetween } from '@/lib/time'
import { loadProgrammeStart } from '@/lib/diary-db'
import { loadEducationState } from '@/lib/education-db'
import { loadRecapStats } from '@/lib/recap-db'
import {
  loadSuggestionState,
  loadSuggestionInput,
  saveSuggestionState,
  type SuggestionRenderStats,
} from '@/lib/suggestion-db'
import { calcSuggestions } from '@/lib/suggestion'
import SuggestionPicker from '@/app/suggestion/_components/SuggestionPicker'

const TREND_LABEL = { improved: 'ดีขึ้น', unchanged: 'เท่าเดิม', worse: 'แย่ลง' } as const

function fmt(value: number, unit: 'pct' | 'min'): string {
  if (unit === 'pct') return `${value.toFixed(1)}%`
  const h = Math.floor(value / 60)
  const m = Math.round(value % 60)
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`
}

type SuggestionSection = 'not_ready' | 'no_rules' | 'F1' | 'F2_clean' | 'show'

const EMPTY_RENDER_STATS: SuggestionRenderStats = {
  outOfBedRangeMins: 0,
  avgSleepOnsetMins: 0,
  caffeineNearBedDays: 0,
  alcoholNearBedDays: 0,
  dimLightsDays: 0,
  exerciseDays: 0,
}

export default async function RecapPage() {
  const [programme, eduState] = await Promise.all([
    loadProgrammeStart(),
    loadEducationState(),
  ])
  if (!programme?.started_at) redirect('/')

  const now = await getNowServer()
  const today = toDateString(now)
  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1
  const currentWeek = Math.ceil(dayOfProgramme / 7)
  const evaluationWeek = Math.floor((dayOfProgramme - 1) / 7)

  // ─── Recap (sleep stats) ──────────────────────────────────────────────────
  const data = await loadRecapStats(startDate, currentWeek)

  // ─── Suggestion ───────────────────────────────────────────────────────────
  let suggestionSection: SuggestionSection = 'not_ready'
  let topThree: string[] = []
  let safetyFlags: string[] = []
  let s2AddScreen = false
  let s2AddClock = false
  let renderStats: SuggestionRenderStats = EMPTY_RENDER_STATS
  let alreadySelected: string[] = []

  if (evaluationWeek === 0) {
    suggestionSection = 'not_ready'
  } else if (!eduState?.rules_accepted) {
    suggestionSection = 'no_rules'
  } else {
    const existingState = await loadSuggestionState()
    const isNewWeek = !existingState?.eval_week_number || existingState.eval_week_number !== evaluationWeek

    if (isNewWeek) {
      const input = await loadSuggestionInput(startDate, evaluationWeek, today)
      if (!input) {
        suggestionSection = 'F1'
      } else {
        const result = calcSuggestions(input)
        topThree = result.topThree
        safetyFlags = result.safetyFlags
        s2AddScreen = result.s2AddScreen
        s2AddClock = result.s2AddClock
        renderStats = input.renderStats
        alreadySelected = []

        await saveSuggestionState({
          eval_week_number: evaluationWeek,
          queue: result.queue,
          top_three: topThree,
          safety_flags: safetyFlags,
          s2_add_screen: s2AddScreen,
          s2_add_clock: s2AddClock,
          status: result.status,
          selected: null,
          teach_started_at: null,
          out_of_bed_range_mins: renderStats.outOfBedRangeMins,
          avg_sleep_onset_mins: renderStats.avgSleepOnsetMins,
          caffeine_near_bed_days: renderStats.caffeineNearBedDays,
          alcohol_near_bed_days: renderStats.alcoholNearBedDays,
          dim_lights_days: renderStats.dimLightsDays,
          exercise_days: renderStats.exerciseDays,
        })

        if (result.status === 'F1') {
          suggestionSection = 'F1'
        } else if (result.status === 'F2' && safetyFlags.length === 0) {
          suggestionSection = 'F2_clean'
        } else {
          suggestionSection = 'show'
        }
      }
    } else {
      const status = existingState!.status ?? 'F1'
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

      if (status === 'F1') {
        suggestionSection = 'F1'
      } else if (status === 'F2' && safetyFlags.length === 0) {
        suggestionSection = 'F2_clean'
      } else {
        suggestionSection = 'show'
      }
    }
  }

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-8">
      <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
      <h1 className="text-lg font-semibold text-zinc-900 -mt-4">สรุปและคำแนะนำ</h1>

      {/* ── Section 1: Sleep stats ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">ผลการนอนสัปดาห์ที่ {data.currentWeek}</h2>

        {data.nightsValid === 0 && (
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
            {(['ประสิทธิภาพการนอน', 'เวลาหลับจริงเฉลี่ย', 'เวลากว่าจะหลับเฉลี่ย'] as const).map(label => (
              <div key={label} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-zinc-600">{label}</span>
                <span className="text-sm text-zinc-300">ยังไม่มีข้อมูล</span>
              </div>
            ))}
          </div>
        )}

        {data.nightsValid > 0 && data.nightsValid < 5 && (
          <p className="text-sm text-zinc-500">
            สัปดาห์นี้มีข้อมูล {data.nightsValid} คืน ยังน้อยอยู่ บันทึกต่ออีกนิดเพื่อให้เห็นภาพชัดขึ้น
          </p>
        )}

        {data.currentWeekStats && (
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-zinc-600">ประสิทธิภาพการนอน</span>
              <span className="text-sm font-semibold text-zinc-900">
                {data.currentWeekStats.weeklyEfficiency.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-zinc-600">เวลาหลับจริงเฉลี่ย</span>
              <span className="text-sm font-semibold text-zinc-900">
                {fmt(data.currentWeekStats.avgSleepTimeMins, 'min')}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-zinc-600">เวลากว่าจะหลับเฉลี่ย</span>
              <span className="text-sm font-semibold text-zinc-900">
                {fmt(data.currentWeekStats.avgSleepOnsetMins, 'min')}
              </span>
            </div>
          </div>
        )}

        {/* Week comparison — from week 2 onwards */}
        {data.currentWeek > 1 && (
          <div className="flex flex-col gap-3 mt-1">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">เทียบกับสัปดาห์แรก</h3>

            {!data.comparison && (
              <p className="text-sm text-zinc-500">ยังเทียบไม่ได้ เพราะข้อมูลบางสัปดาห์ยังไม่ครบ</p>
            )}

            {data.comparison && (
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-zinc-600">ประสิทธิภาพการนอน</span>
                  <span className="text-zinc-800">
                    {data.comparison.efficiency.week1.toFixed(1)}% → {data.comparison.efficiency.current.toFixed(1)}%
                    <span className={`ml-1 text-xs ${data.comparison.efficiency.trend === 'improved' ? 'text-green-600' : data.comparison.efficiency.trend === 'worse' ? 'text-red-500' : 'text-zinc-400'}`}>
                      ({TREND_LABEL[data.comparison.efficiency.trend]})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-zinc-600">เวลาหลับจริงเฉลี่ย</span>
                  <span className="text-zinc-800">
                    {fmt(data.comparison.sleepTime.week1, 'min')} → {fmt(data.comparison.sleepTime.current, 'min')}
                    <span className={`ml-1 text-xs ${data.comparison.sleepTime.trend === 'improved' ? 'text-green-600' : data.comparison.sleepTime.trend === 'worse' ? 'text-red-500' : 'text-zinc-400'}`}>
                      ({TREND_LABEL[data.comparison.sleepTime.trend]})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-zinc-600">เวลากว่าจะหลับ</span>
                  <span className="text-zinc-800">
                    {fmt(data.comparison.sleepOnset.week1, 'min')} → {fmt(data.comparison.sleepOnset.current, 'min')}
                    <span className={`ml-1 text-xs ${data.comparison.sleepOnset.trend === 'improved' ? 'text-green-600' : data.comparison.sleepOnset.trend === 'worse' ? 'text-red-500' : 'text-zinc-400'}`}>
                      ({TREND_LABEL[data.comparison.sleepOnset.trend]})
                    </span>
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-zinc-400">
              ตัวเลขนี้เป็นการเทียบก่อน-หลัง ไม่ได้บอกว่าดีขึ้นเพราะโปรแกรมอย่างเดียว
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2: Personal recommendations ── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-700">คำแนะนำส่วนตัว</h2>

        {suggestionSection === 'not_ready' && (
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
            <p className="text-sm text-zinc-500">ยังไม่มีข้อมูลเพียงพอ</p>
            <p className="text-xs text-zinc-400">คำแนะนำจะพร้อมหลังจากบันทึกการนอนครบ 7 คืนแรก</p>
          </div>
        )}

        {suggestionSection === 'no_rules' && (
          <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
            <p className="text-sm text-zinc-500">ยังไม่มีข้อมูลเพียงพอ</p>
            <p className="text-xs text-zinc-400">ยืนยันกฎ CBT-I ก่อนเพื่อปลดล็อกคำแนะนำส่วนตัว</p>
            <Link href="/education/rules" className="text-xs text-indigo-600">
              ดูกฎ CBT-I →
            </Link>
          </div>
        )}

        {suggestionSection === 'F1' && (
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-zinc-500">ยังไม่มีข้อมูลเพียงพอ</p>
            <p className="text-xs text-zinc-400 mt-1">บันทึกการนอนต่ออีกไม่กี่คืน แล้วคำแนะนำจะปรากฏที่นี่</p>
          </div>
        )}

        {suggestionSection === 'F2_clean' && (
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-zinc-600">รูปแบบการนอนช่วงนี้ค่อนข้างสม่ำเสมอแล้ว ยังไม่มีอะไรต้องปรับเพิ่ม บันทึกต่อไปเรื่อยๆ ก็พอ</p>
          </div>
        )}

        {suggestionSection === 'show' && (
          <SuggestionPicker
            topThree={topThree}
            safetyFlags={safetyFlags}
            s2AddScreen={s2AddScreen}
            s2AddClock={s2AddClock}
            stats={renderStats}
            weekNumber={evaluationWeek}
            alreadySelected={alreadySelected}
          />
        )}
      </section>
    </main>
  )
}
