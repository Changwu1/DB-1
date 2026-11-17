'use client'

import Link from 'next/link'
import { dismissMythAction } from '@/app/actions'
import FormSubmitButton from './FormSubmitButton'

const MYTH_HEADLINES: Record<number, string> = {
  1: 'ทุกคนต้องนอน 8 ชั่วโมง',
  2: 'นอนชดเชยตอนวันหยุดได้',
  3: 'ฉันชินกับการนอน 5–6 ชั่วโมงแล้ว',
  4: 'ดูทีวีหรือเลื่อนมือถือช่วยให้หลับ',
  5: 'นมอุ่นหรือชาสมุนไพรช่วยให้หลับ',
  6: 'ตื่นกลางดึกแปลว่านอนไม่ดี',
  7: 'แอลกอฮอล์ช่วยให้หลับ',
  8: 'นอนกรนไม่เป็นอันตราย',
  9: 'ยานอนหลับช่วยได้ดีที่สุด',
}

interface Props {
  mythNumber: number
}

export default function MythBanner({ mythNumber }: Props) {
  const headline = MYTH_HEADLINES[mythNumber] ?? `ความเชื่อผิด #${mythNumber}`

  return (
    <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-700 font-medium mb-0.5">ความเชื่อผิดประจำวัน</p>
        <p className="text-sm text-amber-900 font-medium leading-snug">{headline}</p>
        <Link
          href={`/education/myth/${mythNumber}`}
          className="text-xs text-amber-700 underline"
        >
          แตะเพื่อดูข้อเท็จจริง
        </Link>
      </div>
      <form action={dismissMythAction}>
        <FormSubmitButton
          label="✕"
          loadingLabel="…"
          ariaLabel="ปิด"
          className="text-amber-500 p-1 rounded flex-shrink-0 flex items-center justify-center disabled:opacity-40"
        />
      </form>
    </div>
  )
}
