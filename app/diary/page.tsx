export const instant = false

import { getNowServer, toDateString, addDays } from '@/lib/time'
import { loadDiaryEntry } from '@/lib/diary-db'
import DiaryForm from './_components/DiaryForm'

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function formatThaiDate(d: Date): string {
  const day = THAI_DAYS[d.getDay()]
  return `คืนวัน${day} ${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`
}

export default async function DiaryPage() {
  const now = await getNowServer()
  const yesterday = addDays(now, -1)
  const nightDate = toDateString(yesterday)
  const displayDate = formatThaiDate(yesterday)

  const prefill = await loadDiaryEntry(nightDate)

  return (
    <main className="min-h-screen bg-white max-w-sm mx-auto">
      {prefill && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-700 text-center">
          คืนนี้บันทึกไว้แล้ว แก้ได้เลย
        </div>
      )}
      <DiaryForm
        nightDate={nightDate}
        displayDate={displayDate}
        prefill={prefill}
      />
    </main>
  )
}
