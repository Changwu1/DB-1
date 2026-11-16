export const instant = false

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNowServer, toDateString, daysBetween } from '@/lib/time'
import { loadProgrammeStart } from '@/lib/diary-db'
import { loadRecapStats } from '@/lib/recap-db'

// §7.4 trend labels
const TREND_LABEL = { improved: 'ดีขึ้น', unchanged: 'เท่าเดิม', worse: 'แย่ลง' } as const

function fmt(value: number, unit: 'pct' | 'min'): string {
  if (unit === 'pct') return `${value.toFixed(1)}%`
  const h = Math.floor(value / 60)
  const m = Math.round(value % 60)
  return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`
}

export default async function RecapPage() {
  const programme = await loadProgrammeStart()
  if (!programme?.started_at) redirect('/')

  const now = await getNowServer()
  const startDate = toDateString(new Date(programme.started_at))
  const dayOfProgramme = daysBetween(new Date(startDate), now) + 1
  const currentWeek = Math.ceil(dayOfProgramme / 7)

  const data = await loadRecapStats(startDate, currentWeek)

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto p-6 flex flex-col gap-6">
      <Link href="/" className="text-sm text-indigo-600">← กลับ</Link>
      <h1 className="text-lg font-semibold text-zinc-900">สรุปประจำสัปดาห์</h1>
      <p className="text-xs text-zinc-400">สัปดาห์ที่ {data.currentWeek}</p>

      {/* Current week stats */}
      {data.nightsValid === 0 && (
        <p className="text-sm text-zinc-500">ยังไม่มีบันทึก เริ่มบันทึกเช้าพรุ่งนี้ได้เลย</p>
      )}

      {data.nightsValid > 0 && data.nightsValid < 5 && (
        <p className="text-sm text-zinc-500">
          สัปดาห์นี้มีข้อมูล {data.nightsValid} คืน ยังน้อยไปสำหรับสรุปทั้งสัปดาห์ บันทึกต่ออีกนิด เราจะเห็นภาพชัดขึ้น
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

      {/* R7: Week comparison (§7.4) — from week 2 onwards */}
      {data.currentWeek > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-700">สัปดาห์นี้ต่างจากสัปดาห์แรกอย่างไร</h2>

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
        </section>
      )}
    </main>
  )
}
