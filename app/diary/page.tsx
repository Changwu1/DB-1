export const instant = false

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getNowServer, toDateString, addDays } from '@/lib/time'
import { loadDiaryEntry, loadFilledOrSkippedNights, loadProgrammeStart } from '@/lib/diary-db'
import { skipDiaryDay } from './actions'
import DiaryForm from './_components/DiaryForm'
import FormSubmitButton from '../_components/FormSubmitButton'

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatThaiDate(d: Date): string {
  const day = THAI_DAYS[d.getDay()]
  return `คืนวัน${day} ${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`
}

function parseLocalDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as local noon to avoid timezone boundary issues
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DiaryPage({ searchParams }: PageProps) {
  const now = await getNowServer()
  const params = await searchParams

  const yesterday = addDays(now, -1)
  const yesterdayStr = toDateString(yesterday)

  // Resolve which night to show
  let nightDate = yesterdayStr
  let isBackfillMode = false

  if (params.date && params.date !== yesterdayStr) {
    const requested = params.date
    const sevenDaysAgo = toDateString(addDays(now, -7))
    // Valid: in the past, within 7 days
    if (requested < yesterdayStr && requested >= sevenDaysAgo) {
      nightDate = requested
      isBackfillMode = true
    }
  }

  const displayDate = formatThaiDate(parseLocalDate(nightDate))
  const prefill = await loadDiaryEntry(nightDate)

  // Build the unfilled-days list for the main view (not shown in backfill mode)
  let unfilledNights: Array<{ date: string; label: string }> = []
  if (!isBackfillMode) {
    const programme = await loadProgrammeStart()
    const programmeStartStr = programme?.started_at
      ? toDateString(new Date(programme.started_at))
      : null
    const sevenDaysAgo = toDateString(addDays(now, -7))
    const rangeStart = programmeStartStr && programmeStartStr > sevenDaysAgo
      ? programmeStartStr
      : sevenDaysAgo
    const rangeEnd = toDateString(addDays(now, -2)) // days older than yesterday

    if (rangeStart <= rangeEnd) {
      const filled = new Set(await loadFilledOrSkippedNights(rangeStart, rangeEnd))

      // Walk from rangeEnd back to rangeStart, collect unfilled nights
      let cursor = new Date(parseLocalDate(rangeEnd))
      const startDate = parseLocalDate(rangeStart)
      while (cursor >= startDate) {
        const dateStr = toDateString(cursor)
        if (!filled.has(dateStr)) {
          unfilledNights.push({ date: dateStr, label: formatThaiDate(cursor) })
        }
        cursor = addDays(cursor, -1)
      }
    }
  }

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto">
      {/* Back button in backfill mode */}
      {isBackfillMode && (
        <div className="px-4 pt-3">
          <Link href="/diary" className="inline-flex items-center gap-1 text-sm text-indigo-600">
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            กลับ
          </Link>
        </div>
      )}

      {/* Existing entry banner (today's view) */}
      {!isBackfillMode && prefill && !prefill.skipped && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-700 text-center">
          เมื่อคืนบันทึกไว้แล้ว แก้ได้เลย
        </div>
      )}

      <DiaryForm
        nightDate={nightDate}
        displayDate={displayDate}
        prefill={prefill?.skipped ? null : prefill}
      />

      {/* Skip button — only in backfill mode and not yet submitted */}
      {isBackfillMode && !prefill?.submitted_at && (
        <div className="px-4 pb-6">
          <form action={skipDiaryDay}>
            <input type="hidden" name="night_date" value={nightDate} />
            <FormSubmitButton
              label="ไม่แน่ใจ ข้ามคืนนี้ไปก่อน"
              loadingLabel="กำลังข้าม…"
              className="w-full rounded-xl border border-stone-300 py-3 text-sm font-medium text-stone-500 flex items-center justify-center gap-2 disabled:opacity-40"
            />
          </form>
        </div>
      )}

      {/* Unfilled past nights list — shown only in main (non-backfill) view */}
      {!isBackfillMode && unfilledNights.length > 0 && (
        <section className="border-t border-stone-100 mt-2 pb-8">
          <div className="px-4 pt-5 pb-3">
            <p className="text-sm font-semibold text-stone-700">
              คืนที่ยังไม่ได้บันทึก ({unfilledNights.length} คืน)
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              กรอกย้อนหลังได้ถ้ายังจำได้ กดข้ามถ้าไม่แน่ใจ
            </p>
          </div>
          <ul className="flex flex-col gap-2 px-4">
            {unfilledNights.map(({ date, label }) => (
              <li key={date}>
                <Link
                  href={`/diary?date=${date}`}
                  className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm"
                >
                  <span className="text-stone-700">{label}</span>
                  <span className="text-indigo-600 font-medium text-xs">กรอกข้อมูล →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
