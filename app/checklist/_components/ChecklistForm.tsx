'use client'

import { useActionState } from 'react'
import { submitChecklist, type ChecklistActionState } from '@/app/checklist/actions'
import type { ChecklistRow } from '@/lib/diary-db'

const DAY_QUESTIONS = [
  { name: 'days_morning_light', label: 'รับแสงแดดภายในชั่วโมงแรกหลังตื่น' },
  { name: 'days_caffeine_near_bed', label: 'ดื่มคาเฟอีนภายใน 6 ชม. ก่อนนอน' },
  { name: 'days_napped', label: 'งีบกลางวัน (เกิน 30 นาที หรืองีบหลังบ่าย)' },
  { name: 'days_exercised', label: 'ขยับร่างกายหรือออกกำลังกาย' },
  { name: 'days_alcohol_near_bed', label: 'ดื่มแอลกอฮอล์ภายใน 4 ชม. ก่อนนอน' },
  { name: 'days_heavy_meal_or_exercise', label: 'กินมื้อใหญ่หรือออกกำลังหนักใกล้เวลานอน' },
  { name: 'days_dim_light', label: 'หรี่ไฟและทำอะไรสบายๆ ประมาณ 30 นาทีก่อนนอน' },
  { name: 'days_screen_in_bed', label: 'ใช้มือถือ แท็บเล็ต หรือดูทีวีบนเตียง' },
]

const DAY_OPTIONS = [
  { v: 0, label: '0 วัน' }, { v: 1, label: '1 วัน' }, { v: 2, label: '2 วัน' },
  { v: 3, label: '3 วัน' }, { v: 4, label: '4 วัน' }, { v: 5, label: '5 วัน' },
  { v: 6, label: '6 วัน' }, { v: 7, label: 'ทุกวัน' },
]

interface Props {
  weekNumber: number
  prefill?: ChecklistRow | null
}

export default function ChecklistForm({ weekNumber, prefill }: Props) {
  const [state, action, pending] = useActionState<ChecklistActionState, FormData>(submitChecklist, null)

  return (
    <form action={action} className="flex flex-col gap-6 p-4">
      <input type="hidden" name="week_number" value={weekNumber} />

      <div className="text-center">
        <h1 className="text-lg font-semibold">สัปดาห์นี้เป็นอย่างไรบ้าง</h1>
        <p className="text-sm text-gray-500 mt-1">ไม่มีคำตอบถูกหรือผิด เราใช้ข้อมูลนี้เลือกเคล็ดลับที่เหมาะกับคุณ</p>
      </div>

      {state?.status === 'missing' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          ยังเหลืออีก {state.missingCount} ข้อ
        </div>
      )}
      {state?.status === 'save_error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Q1–8: Day count questions */}
      {DAY_QUESTIONS.map((q, idx) => {
        const prefillVal = prefill?.[q.name as keyof ChecklistRow] as number | undefined
        return (
          <div key={q.name} className="flex flex-col gap-2">
            <span className="text-sm font-medium">{idx + 1}. {q.label}</span>
            <div className="grid grid-cols-4 gap-1">
              {DAY_OPTIONS.map(opt => (
                <label
                  key={opt.v}
                  className="flex items-center justify-center rounded-lg border py-1.5 text-xs cursor-pointer
                    has-[:checked]:bg-indigo-600 has-[:checked]:border-indigo-600 has-[:checked]:text-white
                    border-gray-300 text-gray-700"
                >
                  <input
                    type="radio"
                    name={q.name}
                    value={opt.v}
                    defaultChecked={prefillVal === opt.v}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )
      })}

      {/* Q9: Clock check frequency */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">9. ดูนาฬิกาหรือมือถือตอนตื่นกลางดึกบ่อยแค่ไหน?</span>
        <div className="flex gap-2">
          {[
            { v: 'never', label: 'ไม่เลย' },
            { v: 'sometimes', label: 'บางครั้ง' },
            { v: 'often', label: 'บ่อย' },
          ].map(opt => (
            <label
              key={opt.v}
              className="flex-1 flex items-center justify-center rounded-lg border py-2 text-sm cursor-pointer
                has-[:checked]:bg-indigo-600 has-[:checked]:border-indigo-600 has-[:checked]:text-white
                border-gray-300 text-gray-700"
            >
              <input
                type="radio"
                name="clock_check_frequency"
                value={opt.v}
                defaultChecked={prefill?.clock_check_frequency === opt.v}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-indigo-600 text-white py-3 font-semibold text-base disabled:opacity-60"
      >
        {pending ? 'กำลังบันทึก…' : 'ส่ง'}
      </button>
    </form>
  )
}
