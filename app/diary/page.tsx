export const instant = false

import { getNowServer, toDateString, addDays } from '@/lib/time'
import { loadDiaryEntry, loadNightStatusMap } from '@/lib/diary-db'
import { skipDiaryDay } from './actions'
import DiaryForm from './_components/DiaryForm'
import WeekStrip from './_components/WeekStrip'
import type { NightItem } from './_components/WeekStrip'
import FormSubmitButton from '../_components/FormSubmitButton'

const THAI_DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const THAI_DAY_ABBR = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function formatThaiDate(d: Date): string {
  return `คืนวัน${THAI_DAYS_FULL[d.getDay()]} ${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`
}

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DiaryPage({ searchParams }: PageProps) {
  const now = await getNowServer()
  const params = await searchParams

  const yesterdayStr = toDateString(addDays(now, -1))
  const sevenDaysAgoStr = toDateString(addDays(now, -7))

  // Which night is currently selected
  let nightDate = yesterdayStr
  let isBackfillMode = false

  const requested = params.date
  if (requested && requested < yesterdayStr && requested >= sevenDaysAgoStr) {
    nightDate = requested
    isBackfillMode = true
  }

  // Strip always shows the last 7 nights regardless of programme start
  const stripStart = sevenDaysAgoStr

  // Load statuses for all nights in the strip range
  const statusMap = await loadNightStatusMap(stripStart, yesterdayStr)

  // Build the ordered list of nights for the strip (oldest → newest)
  const stripNights: NightItem[] = []
  let cursor = parseLocalDate(stripStart)
  const yesterdayDate = parseLocalDate(yesterdayStr)
  while (cursor <= yesterdayDate) {
    const dateStr = toDateString(cursor)
    stripNights.push({
      date: dateStr,
      dayAbbr: THAI_DAY_ABBR[cursor.getDay()],
      dayNum: cursor.getDate(),
      status: statusMap[dateStr] ?? 'unfilled',
      isSelected: dateStr === nightDate,
      isYesterday: dateStr === yesterdayStr,
    })
    cursor = addDays(cursor, 1)
  }

  // Load entry for the selected night
  const prefill = await loadDiaryEntry(nightDate)
  const displayDate = formatThaiDate(parseLocalDate(nightDate))

  const isAlreadySubmitted = !!prefill?.submitted_at
  const isAlreadySkipped = !!prefill?.skipped

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto">
      <WeekStrip nights={stripNights} />

      {/* Skipped night notice */}
      {isAlreadySkipped && (
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 text-sm text-stone-500 text-center">
          คืนนี้กดข้ามไว้แล้ว กรอกข้อมูลเพิ่มได้ถ้าจำได้
        </div>
      )}

      <DiaryForm
        nightDate={nightDate}
        displayDate={displayDate}
        prefill={isAlreadySkipped ? null : prefill}
      />

      {/* Skip button — only for past nights not yet submitted */}
      {isBackfillMode && !isAlreadySubmitted && (
        <div className="px-4 pb-8">
          <form action={skipDiaryDay}>
            <input type="hidden" name="night_date" value={nightDate} />
            <FormSubmitButton
              label={isAlreadySkipped ? 'ข้ามแล้ว (กดอีกครั้งเพื่อยืนยัน)' : 'ไม่แน่ใจ ข้ามคืนนี้ไปก่อน'}
              loadingLabel="กำลังข้าม…"
              className="w-full rounded-xl border border-stone-300 py-3 text-sm font-medium text-stone-400 flex items-center justify-center gap-2 disabled:opacity-40"
            />
          </form>
        </div>
      )}
    </main>
  )
}
